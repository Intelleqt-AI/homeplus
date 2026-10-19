import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Home, ChevronRight, ArrowRight, Building, Building2, Warehouse, LayoutGrid, HelpCircle, Camera, Plus, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/apiClient';
import HomeSelector from '@/components/HomeSelector';
import AccountTypePicker from '@/components/account/AccountTypePicker';
import NewPropertyFields from '@/components/property/NewPropertyFields';
import { EMPTY_HOME, fetchHomeDetails, type HomeSelection } from '@/lib/homeLookup';
import { formatPostcode, postcodeError } from '@/lib/postcode';
import {
  PROPERTY_TYPES as TYPE_OPTIONS, HEATING_TYPES, TENURE_TYPES, WALL_TYPES, EMPTY_HOME_DETAILS,
  applyEpc, clearEpc, labelFor, toHomeDetailsPayload, type HomeDetails,
} from '@/lib/propertyOptions';
import PropertyDetailsFields, { type DetailField } from '@/components/PropertyDetailsFields';
import {
  ACCOUNT_TYPE_CAPTION, ROLE_FOR_USAGE, clearSrc, firstUsage, readSrc, srcPreselect, usageLabel,
  wordingFor, type AccountType, type Usage,
} from '@/lib/account';
import { propertyNickname } from '@/lib/household';

/** The API's first message for ``field`` ({errors: {field: [...]}}), or ''. */
const apiFieldError = (err: unknown, field: string): string => {
  const v = (err as { response?: { data?: { errors?: Record<string, unknown> } } })?.response?.data?.errors?.[field];
  return Array.isArray(v) ? String(v[0] ?? '') : typeof v === 'string' ? v : '';
};

// ─── Types ───────────────────────────────────────────────────────────────────

type NotifPrefs = {
  email_notifications: boolean;
  sms_notifications: boolean;
  calendar_reminders: boolean;
  marketing_emails: boolean;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, typeof Home> = {
  detached: Home, semi_detached: Building2, terraced: LayoutGrid, flat: Building, bungalow: Warehouse, other: HelpCircle,
};

const PROPERTY_TYPES = TYPE_OPTIONS.map(t => ({ ...t, icon: TYPE_ICONS[t.value] ?? Home }));

/** The screens, in the order a person meets them. `type` only for those who have not answered
 *  "How will you use Home+?" yet (Google/Apple sign-ups, accounts that were mid-way at release);
 *  `tenancy` only for renters; `extra` and `more` for landlords and "both". */
type StepId = 'type' | 'phone' | 'property' | 'tenancy' | 'extra' | 'more' | 'notifications' | 'loading';

/** What the first property is called on its screen, by how the person uses Home+. */
const PROPERTY_HEADINGS: Record<AccountType, { form: [string, string]; summary: [string, string]; hint: string }> = {
  homeowner: {
    form: ['Tell us about', 'your home.'], summary: ["Here's your", 'home.'],
    hint: "We'll use this to tailor your maintenance schedule.",
  },
  landlord: {
    form: ['Tell us about', 'the property you let.'], summary: ["Here's the", 'property you let.'],
    hint: "We'll use this to tailor your reminders.",
  },
  both: {
    form: ['Tell us about', 'the home you live in.'], summary: ["Here's the home", 'you live in.'],
    hint: "We'll use this to tailor your maintenance schedule.",
  },
  renter: {
    form: ['Tell us about', 'the home you rent.'], summary: ["Here's the home", 'you rent.'],
    hint: "We'll use this to tailor your reminders.",
  },
};

/** A property after the first (landlords and "both"): what the person has filled in so far. */
type ExtraDraft = { id: number; home: HomeSelection; details: HomeDetails; error: string };

const LOADING_PHRASES = [
  'Setting up your profile',
  'Applying your preferences',
  'Personalising your dashboard',
  'Connecting everything together',
  'Almost there',
];

// ─── Framer variants ─────────────────────────────────────────────────────────

const stepVariants: Variants = {
  enter: (d: number) => ({ x: d > 0 ? 72 : -72, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.32, ease: [0.32, 0.72, 0, 1] } },
  exit: (d: number) => ({ x: d > 0 ? -72 : 72, opacity: 0, transition: { duration: 0.22, ease: [0.32, 0.72, 0, 1] } }),
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepPhone({
  phone, setPhone, error, stepLabel,
}: { phone: string; setPhone: (v: string) => void; error: string; stepLabel: string }) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground tracking-widest uppercase">{stepLabel}</p>
        <h1 className="text-3xl sm:text-5xl font-bold text-foreground leading-[1.1] tracking-tight">
          What's your<br />phone number?
        </h1>
        <p className="text-[17px] text-muted-foreground leading-relaxed max-w-sm">
          We'll only use this for important account alerts — never marketing.
        </p>
      </div>

      <div className="space-y-2">
        <div className={`flex items-center gap-0 rounded-2xl border-2 bg-card overflow-hidden transition-colors ${
          error ? 'border-red-400' : 'border-border focus-within:border-foreground'
        }`}>
          <div className="flex items-center gap-2 px-4 py-4 border-r border-border bg-muted shrink-0">
            <span className="text-xl">🇬🇧</span>
            <span className="text-sm font-semibold text-foreground">+44</span>
          </div>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value.replace(/[^0-9 ()+-]/g, ''))}
            placeholder="7700 900 123"
            autoFocus
            className="flex-1 min-w-0 px-4 py-4 text-[17px] font-medium text-foreground placeholder:text-muted-foreground/50 bg-transparent outline-none"
            aria-label="Phone number"
            autoComplete="tel-national"
          />
        </div>
        {error && <p className="text-sm text-red-500 pl-1">{error}</p>}
      </div>
    </div>
  );
}

function StepProperty({
  name, setName,
  home, onHomeChange, hasSavedHome,
  propertyType, setPropertyType,
  usage, accountType, stepLabel,
  bedrooms, setBedrooms,
  bathrooms, setBathrooms,
  heatingType, setHeatingType,
  yearBuilt, setYearBuilt,
  tenure, setTenure,
  floorArea, setFloorArea,
  details, patchDetails, askFields,
  coverPreview, onCoverClick,
  editing, setEditing, onDoneEditing,
  error,
}: {
  name: string; setName: (v: string) => void;
  /** The home chosen at signup (or being chosen now), with the map pin. */
  home: HomeSelection; onHomeChange: (h: HomeSelection) => void; hasSavedHome: boolean;
  propertyType: string; setPropertyType: (v: string) => void;
  /** What this first property is (set by how the person uses Home+) and what they said that is. */
  usage: Usage; accountType: AccountType; stepLabel: string;
  bedrooms: string; setBedrooms: (v: string) => void;
  bathrooms: string; setBathrooms: (v: string) => void;
  heatingType: string; setHeatingType: (v: string) => void;
  yearBuilt: string; setYearBuilt: (v: string) => void;
  tenure: string; setTenure: (v: string) => void;
  floorArea: string; setFloorArea: (v: string) => void;
  /** All the home's details in one object (for the summary and the "Complete your details" list). */
  details: HomeDetails; patchDetails: (patch: Partial<HomeDetails>) => void;
  /** The fields signup and EPC left empty, asked under the summary. */
  askFields: DetailField[];
  coverPreview: string | null; onCoverClick: () => void;
  /** Signup users: false = summary of the home they added, true = the full editable form. */
  editing: boolean; setEditing: (v: boolean) => void; onDoneEditing: () => void;
  error: string;
}) {
  // People who added their home at signup see a summary (with Edit). Google/Apple
  // sign-ups have no saved home, so they get the full form and must complete it.
  const showSummary = hasSavedHome && !editing && !!home.address;
  const wording = wordingFor(usage);
  const headings = PROPERTY_HEADINGS[accountType];
  const [h1, h2] = showSummary ? headings.summary : headings.form;

  return (
    <div className="space-y-7">
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground tracking-widest uppercase">{stepLabel}</p>
        <h1 className="text-3xl sm:text-5xl font-bold text-foreground leading-[1.1] tracking-tight">
          {h1}<br />{h2}
        </h1>
        <p className="text-[17px] text-muted-foreground">
          {showSummary ? 'Check the details. You can edit anything.' : headings.hint}
        </p>
      </div>

      {/* Cover photo */}
      <div
        onClick={onCoverClick}
        className="relative rounded-2xl overflow-hidden h-36 border-2 border-dashed border-border bg-card cursor-pointer hover:border-foreground transition-colors"
      >
        {coverPreview ? (
          <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <Camera className="w-7 h-7 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground/60">Add cover photo (optional)</p>
          </div>
        )}
        <span className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none">
          <Camera className="w-3 h-3" />
          {coverPreview ? 'Change' : 'Add photo'}
        </span>
      </div>

      {showSummary ? (
        <>
          <div className="rounded-2xl border-2 border-border bg-card px-4 py-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {wording === 'property' ? 'Your property' : 'Your home'}
                </p>
                <p className="text-[17px] font-semibold text-foreground break-words">{name.trim() || home.address}</p>
              </div>
              <button type="button" onClick={() => setEditing(true)} className="shrink-0 text-sm font-semibold text-primary hover:underline">
                Edit
              </button>
            </div>
            <dl className="mt-3 divide-y divide-border text-sm">
              {([
                ['Address', home.address],
                ['Postcode', [home.postcode, home.area].filter(Boolean).join(' · ')],
                ['Property type', propertyType ? labelFor(PROPERTY_TYPES, propertyType) : ''],
                ['Built form', details.builtForm.toLowerCase() === labelFor(PROPERTY_TYPES, propertyType).toLowerCase() ? '' : details.builtForm],
                ['Floor area', floorArea ? `${floorArea} m²` : ''],
                ['Built', details.ageBand || yearBuilt],
                ['Walls', details.wallConstruction ? labelFor(WALL_TYPES, details.wallConstruction) : ''],
                ['How you use it', usageLabel(usage)],
                ['Bedrooms', bedrooms],
                ['Bathrooms', bathrooms],
                ['Heating', heatingType ? labelFor(HEATING_TYPES, heatingType) : ''],
                ['Tenure', tenure ? labelFor(TENURE_TYPES, tenure) : ''],
              ] as [string, string][]).filter(([, value]) => value).map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-3 py-2">
                  <dt className="shrink-0 text-muted-foreground">{label}</dt>
                  <dd className="min-w-0 text-right font-medium text-foreground break-words">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {askFields.length > 0 && (
            <div className="space-y-3 rounded-2xl border-2 border-border bg-card px-4 py-4">
              <div>
                <p className="text-[15px] font-semibold text-foreground">Complete your details</p>
                <p className="text-sm text-muted-foreground">
                  {details.epcFilled.length > 0 ? 'We filled in what we could from your EPC. ' : ''}
                  These are the ones we couldn&apos;t.
                </p>
              </div>
              <PropertyDetailsFields
                value={details}
                onChange={patchDetails}
                show={askFields}
                required={['propertyType']}
              />
            </div>
          )}
        </>
      ) : (
      <>
      {/* Address */}
      <div className="space-y-3">
        {/* Property name */}
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={wording === 'property' ? 'Property name (e.g. Flat 2, Oxford Road)' : 'Property name (e.g. Main Home)'}
          className="w-full rounded-2xl border-2 border-border focus:border-foreground bg-card px-4 py-3.5 text-[15px] font-medium text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors"
        />

        <HomeSelector value={home} onChange={onHomeChange} wording={wording} />

        {/* Property type */}
        <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Property type</label>
        <div className="grid grid-cols-3 gap-2.5">
          {PROPERTY_TYPES.map(t => (
            <motion.button
              key={t.value}
              type="button"
              onClick={() => setPropertyType(t.value)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 py-3.5 px-2 transition-all ${
                propertyType === t.value
                  ? 'border-accent bg-gradient-hero text-accent-foreground'
                  : 'border-border bg-card text-foreground hover:border-foreground'
              }`}
            >
              <t.icon className="w-5 h-5" />
              <span className="text-xs font-semibold">{t.label}</span>
            </motion.button>
          ))}
        </div>
        </div>

      </div>

        {/* Bedrooms & Bathrooms */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Bedrooms</label>
            <input
              type="number"
              min="0"
              max="20"
              value={bedrooms}
              onChange={e => setBedrooms(e.target.value)}
              placeholder="e.g. 3"
              className="w-full rounded-2xl border-2 border-border focus:border-foreground bg-card px-4 py-3 text-[15px] font-medium text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Bathrooms</label>
            <input
              type="number"
              min="0"
              max="10"
              value={bathrooms}
              onChange={e => setBathrooms(e.target.value)}
              placeholder="e.g. 1"
              className="w-full rounded-2xl border-2 border-border focus:border-foreground bg-card px-4 py-3 text-[15px] font-medium text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Floor area */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Floor area (m²) <span className="font-normal normal-case text-muted-foreground/60">(optional)</span></label>
          <input
            type="number"
            min="1"
            value={floorArea}
            onChange={e => setFloorArea(e.target.value)}
            placeholder="e.g. 85"
            className="w-full rounded-2xl border-2 border-border focus:border-foreground bg-card px-4 py-3 text-[15px] font-medium text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors"
          />
        </div>

        {/* Heating type */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Heating type</label>
          <Select value={heatingType} onValueChange={setHeatingType}>
            <SelectTrigger className="w-full rounded-2xl border-2 border-border focus:border-foreground bg-card px-4 py-3 h-auto text-[15px] font-medium text-foreground">
              <SelectValue placeholder="Select heating type (optional)" />
            </SelectTrigger>
            <SelectContent>
              {HEATING_TYPES.map(h => (
                <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Year built & Tenure */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Year built <span className="font-normal normal-case text-muted-foreground/60">(optional)</span></label>
            <input
              type="number"
              min="1800"
              max={new Date().getFullYear()}
              value={yearBuilt}
              onChange={e => setYearBuilt(e.target.value)}
              placeholder="e.g. 1985"
              className="w-full rounded-2xl border-2 border-border focus:border-foreground bg-card px-4 py-3 text-[15px] font-medium text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Tenure <span className="font-normal normal-case text-muted-foreground/60">(optional)</span></label>
            <Select value={tenure} onValueChange={setTenure}>
              <SelectTrigger className="w-full rounded-2xl border-2 border-border focus:border-foreground bg-card px-4 py-3 h-auto text-[15px] font-medium text-foreground">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {TENURE_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

      {hasSavedHome && editing && (
        <button
          type="button"
          onClick={onDoneEditing}
          className="w-full rounded-2xl border border-foreground py-3 text-[15px] font-semibold text-foreground hover:bg-muted transition-colors"
        >
          Done editing
        </button>
      )}
      </>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

function StepNotifications({
  prefs, setPrefs, stepLabel,
}: { prefs: NotifPrefs; setPrefs: (p: NotifPrefs) => void; stepLabel: string }) {
  const items: { key: keyof NotifPrefs; label: string; desc: string }[] = [
    { key: 'email_notifications', label: 'Email updates',      desc: 'Reminders, certificates, service alerts' },
    { key: 'sms_notifications',   label: 'SMS alerts',         desc: 'Urgent alerts to your phone. Coming soon.' },
    { key: 'calendar_reminders',  label: 'Calendar events',    desc: 'Add jobs and services to your calendar' },
    { key: 'marketing_emails',    label: 'Tips & offers',      desc: 'Home advice, deals, product news' },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground tracking-widest uppercase">{stepLabel}</p>
        <h1 className="text-3xl sm:text-5xl font-bold text-foreground leading-[1.1] tracking-tight">
          How should<br />we reach you?
        </h1>
        <p className="text-[17px] text-muted-foreground">
          You can change these any time in Settings.
        </p>
      </div>

      <div className="space-y-3">
        {items.map(item => {
          const disabled = item.key === 'sms_notifications';
          const checked = !disabled && prefs[item.key];
          return (
            <button
              key={item.key}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && setPrefs({ ...prefs, [item.key]: !prefs[item.key] })}
              className={`w-full flex items-center justify-between gap-3 rounded-2xl border-2 px-5 py-4 text-left transition-all ${
                disabled
                  ? 'border-border bg-muted/50 text-muted-foreground cursor-not-allowed opacity-60'
                  : checked
                    ? 'border-accent bg-gradient-hero text-accent-foreground'
                    : 'border-border bg-card text-foreground hover:border-foreground'
              }`}
            >
              <div>
                <p className="text-[15px] font-semibold">{item.label}</p>
                <p className={`text-xs mt-0.5 ${disabled ? 'text-muted-foreground' : checked ? 'text-accent-foreground/60' : 'text-muted-foreground'}`}>{item.desc}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                checked ? 'border-accent-foreground bg-accent-foreground' : 'border-border'
              }`}>
                {checked && (
                  <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepLoading({ onDone }: { onDone: () => void }) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const doneRef = useRef(false);

  useEffect(() => {
    let i = 0;
    const cycle = () => {
      if (doneRef.current) return;
      setVisible(false);
      setTimeout(() => {
        i++;
        if (i >= LOADING_PHRASES.length) {
          doneRef.current = true;
          onDone();
          return;
        }
        setPhraseIndex(i);
        setVisible(true);
        setTimeout(cycle, 900);
      }, 300);
    };
    const t = setTimeout(cycle, 900);
    return () => { clearTimeout(t); doneRef.current = true; };
  }, [onDone]);

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-10 py-8">
      {/* Animated logo mark */}
      <div className="relative">
        <motion.div
          animate={{ scale: [1, 1.06, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-24 h-24 rounded-[28px] flex items-center justify-center"
        >
          <img src="/homeplus-logo.png" alt="Home+" className="w-16 h-16 object-contain" />
        </motion.div>
        <motion.div
          animate={{ scale: [1.1, 1.4, 1.1], opacity: [0.12, 0, 0.12] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-[28px] bg-foreground"
        />
      </div>

      {/* Cycling text */}
      <div className="space-y-2 min-h-[80px] flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={phraseIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -10 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28 }}
            className="text-2xl font-bold text-foreground"
          >
            {LOADING_PHRASES[phraseIndex]}
          </motion.p>
        </AnimatePresence>
        <p className="text-[15px] text-muted-foreground">Just a moment…</p>
      </div>

      {/* Dots indicator */}
      <div className="flex gap-2">
        {LOADING_PHRASES.map((_, i) => (
          <motion.div
            key={i}
            animate={{ opacity: i <= phraseIndex ? 1 : 0.2, width: i === phraseIndex ? 24 : 8 }}
            transition={{ duration: 0.3 }}
            className="h-2 rounded-full bg-foreground"
          />
        ))}
      </div>
    </div>
  );
}

// ─── "How will you use Home+?" and the steps only some people see ────────────

const dateInputClass =
  'w-full rounded-2xl border-2 border-border focus:border-foreground bg-card px-4 py-3.5 text-[17px] font-medium text-foreground outline-none transition-colors';

function StepAccountType({
  value, onChange, error, stepLabel,
}: { value: AccountType | null; onChange: (v: AccountType) => void; error: string; stepLabel: string }) {
  return (
    <div className="space-y-7" data-step="account-type">
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground tracking-widest uppercase">{stepLabel}</p>
        <h1 className="text-3xl sm:text-5xl font-bold text-foreground leading-[1.1] tracking-tight">
          How will you use<br />Home+?
        </h1>
      </div>
      <AccountTypePicker value={value} onChange={onChange} variant="onboarding" error={error} />
      <p className="text-sm text-muted-foreground">{ACCOUNT_TYPE_CAPTION}</p>
    </div>
  );
}

/** A renter's own tenancy dates, one question at a time, each skippable. */
function StepTenancy({
  question, start, end, setStart, setEnd, error, stepLabel,
}: {
  question: 0 | 1; start: string; end: string; setStart: (v: string) => void; setEnd: (v: string) => void;
  error: string; stepLabel: string;
}) {
  return (
    <div className="space-y-7" data-step="tenancy">
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground tracking-widest uppercase">{stepLabel}</p>
        <h1 className="text-3xl sm:text-5xl font-bold text-foreground leading-[1.1] tracking-tight">
          {question === 0 ? 'When did your tenancy start?' : 'When does it end or come up for renewal?'}
        </h1>
        <p className="text-[17px] text-muted-foreground">Both dates are optional.</p>
      </div>
      <div className="space-y-2">
        {question === 0 ? (
          <input
            key="tenancy-start" type="date" value={start} onChange={e => setStart(e.target.value)}
            aria-label="When did your tenancy start?" className={dateInputClass} autoFocus
          />
        ) : (
          <input
            key="tenancy-end" type="date" value={end} min={start || undefined} onChange={e => setEnd(e.target.value)}
            aria-label="When does it end or come up for renewal?" className={dateInputClass} autoFocus
          />
        )}
        {error && <p className="text-sm text-red-500 pl-1">{error}</p>}
      </div>
    </div>
  );
}

/** A property after the first: a home the person lets out (landlords, and "both"). */
function StepExtraProperty({
  draft, errors, onHomeChange, onDetailsChange, stepLabel,
}: {
  draft: ExtraDraft; errors: Record<string, string>;
  onHomeChange: (h: HomeSelection) => void; onDetailsChange: (d: HomeDetails) => void; stepLabel: string;
}) {
  return (
    <div className="space-y-7" data-step="extra-property">
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground tracking-widest uppercase">{stepLabel}</p>
        <h1 className="text-3xl sm:text-5xl font-bold text-foreground leading-[1.1] tracking-tight">
          {<>Add a<br />property you let.</>}
        </h1>
        <p className="text-[17px] text-muted-foreground">We&apos;ll use this to tailor your reminders.</p>
      </div>
      <NewPropertyFields
        home={draft.home}
        onHomeChange={onHomeChange}
        details={draft.details}
        onDetailsChange={onDetailsChange}
        errors={errors}
        fixedUsage
        wording="property"
      />
      {errors.form && <p className="text-sm text-red-500">{errors.form}</p>}
    </div>
  );
}

/** "Add another property?" after a landlord's (or "both" account's) first let property. */
function StepMore({
  items, onAdd, onFinish, onRemove, stepLabel,
}: {
  items: { key: string; label: string; usage: Usage; removable: boolean }[];
  onAdd: () => void; onFinish: () => void; onRemove: (key: string) => void; stepLabel: string;
}) {
  return (
    <div className="space-y-7" data-step="add-another">
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground tracking-widest uppercase">{stepLabel}</p>
        <h1 className="text-3xl sm:text-5xl font-bold text-foreground leading-[1.1] tracking-tight">
          Add another<br />property?
        </h1>
      </div>
      <ul className="space-y-2" aria-label="Your properties">
        {items.map(item => (
          <li key={item.key} className="flex items-center gap-3 rounded-2xl border-2 border-border bg-card px-4 py-3">
            <Home className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold text-foreground">{item.label}</span>
              <span className="block text-xs text-muted-foreground">{usageLabel(item.usage)}</span>
            </span>
            {item.removable && (
              <button
                type="button" onClick={() => onRemove(item.key)} aria-label={`Remove ${item.label}`}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </li>
        ))}
      </ul>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button" onClick={onAdd} data-action="add-another"
          className="flex items-center justify-center gap-2 rounded-2xl border-2 border-foreground py-4 text-[16px] font-semibold text-foreground hover:bg-muted transition-colors"
        >
          <Plus className="h-4 w-4" /> Add another
        </button>
        <button
          type="button" onClick={onFinish} data-action="go-to-dashboard"
          className="flex items-center justify-center gap-2 rounded-2xl bg-foreground py-4 text-[16px] font-semibold text-white hover:bg-foreground/90 active:scale-[0.98] transition-all"
        >
          Go to my dashboard <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const Onboarding = () => {
  const { user, loading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // The screen, and the ones before it (Back walks this list: the flow is not a straight line).
  const [step, setStep] = useState<StepId | null>(null);
  const [history, setHistory] = useState<StepId[]>([]);
  const [direction, setDirection] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // "How will you use Home+?" is asked first, once, by anyone who has not answered it (Google/Apple
  // sign-ups, accounts that were mid-way when it was introduced). Decided when the user loads and
  // then kept, so answering it does not take the screen away.
  const askTypeRef = useRef<boolean | null>(null);
  if (askTypeRef.current === null && user) askTypeRef.current = !user.account_type_confirmed;
  const askType = !!askTypeRef.current;
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [typeError, setTypeError] = useState('');
  // The first property is what the account type says (for "both": the home they live in).
  const usage: Usage = firstUsage(accountType ?? 'homeowner');

  // A renter's own tenancy dates, asked one at a time, both optional.
  const [tenancyStart, setTenancyStart] = useState('');
  const [tenancyEnd, setTenancyEnd] = useState('');
  const [tenancyQ, setTenancyQ] = useState<0 | 1>(0);
  const [tenancyError, setTenancyError] = useState('');

  // The properties after the first (landlords and "both"). Nothing is saved until Finish setup.
  const [extras, setExtras] = useState<ExtraDraft[]>([]);
  const [editingExtra, setEditingExtra] = useState<number | null>(null);
  const [extraErrors, setExtraErrors] = useState<Record<string, string>>({});
  const nextDraftId = useRef(1);
  // What has been saved already, so a retry after a failure does not save a home twice.
  const createdFirst = useRef<string | null>(null);
  const createdExtras = useRef<Record<number, string>>({});

  // Step 1
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Step 2
  const [propertyName, setPropertyName] = useState('');
  const [address, setAddress] = useState('');
  const [postcode, setPostcode] = useState('');
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [heatingType, setHeatingType] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [tenure, setTenure] = useState('');
  // Read from the home's EPC certificate (see applyEpc); the user can change the editable ones.
  const [floorArea, setFloorArea] = useState('');
  const [builtForm, setBuiltForm] = useState('');
  const [ageBand, setAgeBand] = useState('');
  const [wallConstruction, setWallConstruction] = useState('');
  const [heatingNote, setHeatingNote] = useState('');
  const [epcFilled, setEpcFilled] = useState<string[]>([]);
  const [homeId, setHomeId] = useState<number | null>(null);
  // The fields asked under the summary: decided once, from what signup and EPC left empty,
  // so a field does not vanish while the user is typing in it.
  const [askFields, setAskFields] = useState<DetailField[] | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  // From the home picker: the register entry for the chosen home, when it has one.
  const [uprn, setUprn] = useState('');
  const [epcCertificate, setEpcCertificate] = useState('');
  const [propertyError, setPropertyError] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  // Landlords: the other homes they let, added right after the first.
  // Signup users: false shows the summary of the home they added, true the editable form.
  const [editingHome, setEditingHome] = useState(false);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    if (coverRef.current) coverRef.current.value = '';
  };

  // Step 3
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>({
    email_notifications: true,
    sms_notifications: false,
    calendar_reminders: true,
    marketing_emails: false,
  });

  // The home picked at sign-up (area, postcode, address, pin) and the property type
  // chosen there fill this step. Google/Apple sign-ups have none, so the home picker shows.
  const meta = user?.user_metadata;
  const hasSavedHome = !!meta?.address && meta.latitude !== null && !!meta.postcode;
  useEffect(() => {
    if (!user) return;
    // Answered already: that is the choice. Not yet: nothing is picked for them, except by the page they came from.
    setAccountType(prev => prev ?? (user.account_type_confirmed ? user.account_type : srcPreselect(readSrc())));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!meta) return;
    if (meta.postcode) setPostcode(prev => prev || formatPostcode(meta.postcode));
    if (meta.location) setLocation(prev => prev || meta.location);
    if (meta.address) setAddress(prev => prev || meta.address);
    if (meta.latitude !== null && meta.longitude !== null) {
      setLat(prev => prev ?? meta.latitude);
      setLng(prev => prev ?? meta.longitude);
    }
    if (meta.uprn) setUprn(prev => prev || meta.uprn);
    if (meta.epc_certificate_number) setEpcCertificate(prev => prev || meta.epc_certificate_number);
    if (PROPERTY_TYPES.some(t => t.value === meta.property_type)) setPropertyType(prev => prev || meta.property_type);
    // The rest of the details from signup step 2.
    const hd = meta.home_details ?? {};
    const text = (v: unknown) => (typeof v === 'string' || typeof v === 'number' ? String(v) : '');
    const count = (v: unknown) => (Number(v) > 0 ? String(v) : '');
    if (hd.name) setPropertyName(prev => prev || text(hd.name));
    setBedrooms(prev => prev || count(hd.bedrooms));
    setBathrooms(prev => prev || count(hd.bathrooms));
    if (hd.heating_type) setHeatingType(prev => prev || text(hd.heating_type));
    if (hd.year_built) setYearBuilt(prev => prev || text(hd.year_built));
    if (hd.tenure) setTenure(prev => prev || text(hd.tenure));
    if (Number(hd.floor_area) > 0) setFloorArea(prev => prev || text(hd.floor_area));
    if (hd.built_form) setBuiltForm(prev => prev || text(hd.built_form));
    if (hd.construction_age_band) setAgeBand(prev => prev || text(hd.construction_age_band));
    if (hd.wall_construction) setWallConstruction(prev => prev || text(hd.wall_construction));
    if (hd.heating_note) setHeatingNote(prev => prev || text(hd.heating_note));
    const filled = hd.epc_filled;
    if (Array.isArray(filled)) setEpcFilled(prev => (prev.length ? prev : filled.map(String)));
    setAskFields(prev => prev ?? ([
      !PROPERTY_TYPES.some(t => t.value === meta.property_type) && 'propertyType',
      !(Number(hd.bedrooms) > 0) && 'bedrooms',
      !(Number(hd.bathrooms) > 0) && 'bathrooms',
      !hd.heating_type && 'heatingType',
      !hd.year_built && 'yearBuilt',
      !hd.tenure && 'tenure',
    ].filter(Boolean) as DetailField[]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // All the details as one object, so the summary and "Complete your details" share the helpers.
  const details: HomeDetails = {
    ...EMPTY_HOME_DETAILS,
    name: propertyName, propertyType, usage, bedrooms, bathrooms, heatingType, yearBuilt, tenure,
    floorArea, builtForm, ageBand, wallConstruction, heatingNote, epcFilled,
  };
  const detailsRef = useRef(details);
  detailsRef.current = details;
  const patchDetails = (p: Partial<HomeDetails>) => {
    if (p.name !== undefined) setPropertyName(p.name);
    if (p.propertyType !== undefined) setPropertyType(p.propertyType);
    if (p.bedrooms !== undefined) setBedrooms(p.bedrooms);
    if (p.bathrooms !== undefined) setBathrooms(p.bathrooms);
    if (p.heatingType !== undefined) setHeatingType(p.heatingType);
    if (p.yearBuilt !== undefined) setYearBuilt(p.yearBuilt);
    if (p.tenure !== undefined) setTenure(p.tenure);
    if (p.floorArea !== undefined) setFloorArea(p.floorArea);
    if (p.builtForm !== undefined) setBuiltForm(p.builtForm);
    if (p.ageBand !== undefined) setAgeBand(p.ageBand);
    if (p.wallConstruction !== undefined) setWallConstruction(p.wallConstruction);
    if (p.heatingNote !== undefined) setHeatingNote(p.heatingNote);
    if (p.epcFilled !== undefined) setEpcFilled(p.epcFilled);
  };

  const home: HomeSelection = { ...EMPTY_HOME, area: location, postcode, address, uprn, certificateNumber: epcCertificate, lat, lng, homeId };
  const handleHomeChange = (h: HomeSelection) => {
    setLocation(h.area);
    setPostcode(h.postcode);
    setAddress(h.address);
    setUprn(h.uprn);
    setEpcCertificate(h.certificateNumber);
    setLat(h.lat);
    setLng(h.lng);
    if (h.homeId !== homeId) {
      setHomeId(h.homeId);
      // A different home: drop what the last one gave us and read this one's EPC facts.
      patchDetails(clearEpc(detailsRef.current));
      if (h.homeId !== null) {
        const picked = h.homeId;
        fetchHomeDetails(picked).then(epc => {
          patchDetails(applyEpc(clearEpc(detailsRef.current), epc));
        });
      }
    }
  };

  // Load existing notification prefs
  useEffect(() => {
    apiClient.get('/api/v1/auth/notification-preferences/')
      .then(({ data: res }) => setNotifPrefs(res.data))
      .catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user._raw?.profile?.onboarding_completed) return <Navigate to="/dashboard" replace />;

  const current: StepId = step ?? (askType ? 'type' : 'phone');
  const go = (next: StepId) => {
    setDirection(1);
    setHistory(h => [...h, current]);
    setStep(next);
  };

  // The steps that count in "Step n of N": extra/more/tenancy map to their nearest main step.
  const mainSteps: StepId[] = [...(askType ? (['type'] as StepId[]) : []), 'phone', 'property', 'notifications'];
  const STEP_MAP: Partial<Record<StepId, StepId>> = { extra: 'notifications', more: 'notifications', tenancy: 'notifications' };
  const mainIndex = (id: StepId) => {
    const resolved = STEP_MAP[id] ?? id;
    const at = mainSteps.indexOf(resolved);
    return at >= 0 ? at : mainSteps.indexOf('property');
  };
  const stepLabel = `Step ${mainIndex(current) + 1} of ${mainSteps.length}`;

  const back = () => {
    setDirection(-1);
    // Second tenancy question: Back is the first question.
    if (current === 'tenancy' && tenancyQ === 1) {
      setTenancyQ(0);
      setTenancyError('');
      return;
    }
    // Leaving a property form that was never finished: it is not kept.
    if (current === 'extra') {
      setExtras(prev => prev.filter(d => d.id !== editingExtra || d.home.address.trim()));
      setExtraErrors({});
    }
    const previous = history[history.length - 1];
    if (!previous) return;
    setHistory(history.slice(0, -1));
    setStep(previous);
  };

  const newDraft = (): ExtraDraft => ({
    id: nextDraftId.current++, home: EMPTY_HOME, details: { ...EMPTY_HOME_DETAILS, usage: 'let' }, error: '',
  });
  const startExtra = () => {
    const draft = newDraft();
    setExtras(prev => [...prev, draft]);
    setEditingExtra(draft.id);
    setExtraErrors({});
    go('extra');
  };
  const patchExtra = (id: number, patch: Partial<ExtraDraft>) => {
    setExtras(prev => prev.map(d => (d.id === id ? { ...d, ...patch } : d)));
    setExtraErrors({});
  };

  /** Where the property step leads: a renter's tenancy dates; landlords and "both" to the
   *  optional "Add a property you let" list (where Finish setup is always available); everyone
   *  else straight on. */
  const afterProperty = () => {
    if (accountType === 'renter') go('tenancy');
    else if (accountType === 'both' || accountType === 'landlord') go('more');
    else go('notifications');
  };

  const handleTypeContinue = async () => {
    if (!accountType) {
      setTypeError('Choose one to continue.');
      return;
    }
    setTypeError('');
    setSubmitting(true);
    try {
      // Saved now, so the answer survives a reload.
      await apiClient.patch('/api/v1/auth/me/', { account_type: accountType });
      await refreshUser();
      clearSrc();
      go('phone');
    } catch {
      setTypeError("We couldn't save that. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTenancyContinue = () => {
    if (tenancyQ === 0) {
      setTenancyQ(1);
      return;
    }
    if (tenancyStart && tenancyEnd && tenancyEnd < tenancyStart) {
      setTenancyError("The end date can't be before the start date.");
      return;
    }
    setTenancyError('');
    go('notifications');
  };

  const handleTenancySkip = () => {
    setTenancyError('');
    if (tenancyQ === 0) {
      setTenancyStart('');
      setTenancyQ(1);
    } else {
      setTenancyEnd('');
      go('notifications');
    }
  };

  const handleExtraContinue = () => {
    const draft = extras.find(d => d.id === editingExtra);
    if (!draft) return;
    const errors: Record<string, string> = {};
    const { home, details: d } = draft;
    if (!home.postcode) errors.home = 'Select your area and postcode, then the property.';
    else if (!home.address.trim()) errors.home = "Select the property, or choose \"This property isn't listed\" and enter the address.";
    else if (home.lat === null || home.lng === null) errors.home = 'Place the pin on the map to mark the property.';
    if (!d.propertyType) errors.propertyType = 'Select a property type.';
    if (d.yearBuilt && (+d.yearBuilt < 1800 || +d.yearBuilt > new Date().getFullYear())) errors.yearBuilt = 'Enter a valid year.';
    if (Object.keys(errors).length) {
      setExtraErrors(errors);
      return;
    }
    setExtraErrors({});
    go('more');
  };

  const removeExtra = (key: string) => setExtras(prev => prev.filter(d => String(d.id) !== key));

  const handlePhoneContinue = async () => {
    if (!phone.trim()) {
      setPhoneError('Phone number is required.');
      return;
    }
    setPhoneError('');
    setSubmitting(true);
    try {
      await apiClient.patch('/api/v1/auth/me/', { profile: { phone: `+44 ${phone.trim()}` } });
    } catch {
      // non-critical, continue anyway
    } finally {
      setSubmitting(false);
    }
    go('property');
  };

  // Validates the home form and moves on; the actual API call is deferred to
  // Finish setup so going Back does not leave a half-created record.
  const handlePropertyContinue = () => {
    if (!address.trim() || !postcode.trim() || !propertyType) {
      setPropertyError(
        hasSavedHome && !editingHome && address.trim() && postcode.trim()
          ? 'Select your property type to continue.'
          : 'Please fill in address, postcode and select a property type.',
      );
      return;
    }
    const pcError = postcodeError(postcode);
    if (pcError) {
      setPropertyError(pcError);
      return;
    }
    setPropertyError('');
    setEditingHome(false);
    afterProperty();
  };

  // "Done editing" on a signup user's home: check it, then back to the summary.
  const handleDoneEditing = () => {
    if (!address.trim() || !postcode.trim() || !propertyType) {
      setPropertyError('Please fill in address, postcode and select a property type.');
      return;
    }
    const pcError = postcodeError(postcode);
    if (pcError) {
      setPropertyError(pcError);
      return;
    }
    setPropertyError('');
    setEditingHome(false);
  };

  const handlePhoneSkip = () => {
    setPhoneError('');
    go('property');
  };

  const handleNotifContinue = async () => {
    setSubmitting(true);
    const payload = { ...notifPrefs, sms_notifications: false };
    try {
      await apiClient.patch('/api/v1/auth/notification-preferences/', payload);
    } catch {
      // non-critical
    } finally {
      setSubmitting(false);
    }
    go('loading');
  };

  const handleComplete = async () => {
    // The homes are only saved once Finish setup is pressed, so a user who
    // bails out at any earlier step leaves nothing behind. First home, then
    // the landlord's other homes, then the cover/EPC side-effects, then the
    // onboarding_completed flag.
    const payload = {
      name:          propertyName.trim() || undefined,
      address:       address.trim(),
      postcode:      formatPostcode(postcode),
      location:      location.trim() || undefined,
      property_type: propertyType,
      usage,
      role: ROLE_FOR_USAGE[usage],
      bedrooms:  bedrooms  ? parseInt(bedrooms,  10) : 0,
      bathrooms: bathrooms ? parseInt(bathrooms, 10) : 0,
      ...(heatingType ? { heating_type: heatingType } : {}),
      ...(yearBuilt   ? { year_built: parseInt(yearBuilt, 10) } : {}),
      ...(tenure      ? { tenure } : {}),
      ...(floorArea   ? { floor_area: parseInt(floorArea, 10) } : {}),
      ...(builtForm   ? { built_form: builtForm } : {}),
      ...(ageBand     ? { construction_age_band: ageBand } : {}),
      ...(wallConstruction ? { wall_construction: wallConstruction } : {}),
      ...(lat !== null ? { latitude: lat } : {}),
      ...(lng !== null ? { longitude: lng } : {}),
      // A renter's own tenancy dates (both optional).
      ...(usage === 'rented_home' && tenancyStart ? { tenancy_start: tenancyStart } : {}),
      ...(usage === 'rented_home' && tenancyEnd ? { tenancy_end: tenancyEnd } : {}),
    };
    // A retry after a later home failed must not save this one twice.
    const justCreated = !createdFirst.current;
    let propertyId: string | null = createdFirst.current;
    if (justCreated) {
      try {
        const { data: res } = await apiClient.post('/api/v1/properties/', payload);
        propertyId = res?.data?.id ?? res?.id ?? null;
        createdFirst.current = propertyId ?? 'saved';
      } catch (e) {
        setPropertyError(apiFieldError(e, 'postcode') || apiFieldError(e, 'address')
          || 'Could not save your home. Check the details and try again.');
        setDirection(-1);
        setStep('property');
        return;
      }
    }

    if (justCreated && coverFile && propertyId) {
      const fd = new FormData();
      fd.append('file', coverFile);
      await apiClient.post(`/api/v1/properties/${propertyId}/cover-image/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).catch(() => {});
    }

    // EPC auto-link on the first home. Non-critical: user can set it manually.
    if (justCreated && propertyId && postcode.trim()) {
      try {
        // A home picked from the list already carries its certificate; otherwise match by address.
        let band: string | undefined;
        let certificateNumber: string | undefined = epcCertificate || undefined;
        if (!certificateNumber) {
          const epcRes = await apiClient.get('/api/v1/properties/epc-lookup/', {
            params: { postcode: formatPostcode(postcode), address: address.trim() },
          });
          ({ band, certificate_number: certificateNumber } = epcRes?.data?.data ?? {});
        }
        if (certificateNumber) {
          await apiClient
            .post(`/api/v1/properties/${propertyId}/epc/link/`, { certificate_number: certificateNumber })
            .catch(() => (band ? apiClient.patch(`/api/v1/properties/${propertyId}/`, { epc_band: band }).catch(() => {}) : undefined));
        }
      } catch {
        // non-critical
      }
    }

    // The homes a landlord (or "both") added after the first, each a home they let out.
    for (const draft of extras) {
      if (createdExtras.current[draft.id]) continue;
      const hd = toHomeDetailsPayload(draft.details);
      try {
        const { data: res } = await apiClient.post('/api/v1/properties/', {
          name: hd.name || undefined,
          address: draft.home.address.trim(),
          postcode: formatPostcode(draft.home.postcode),
          location: draft.home.area || undefined,
          property_type: draft.details.propertyType,
          usage: hd.usage,
          role: hd.role,
          bedrooms: hd.bedrooms,
          bathrooms: hd.bathrooms,
          ...(hd.heating_type ? { heating_type: hd.heating_type } : {}),
          ...(hd.year_built ? { year_built: hd.year_built } : {}),
          ...(hd.tenure ? { tenure: hd.tenure } : {}),
          ...(hd.floor_area ? { floor_area: hd.floor_area } : {}),
          ...(hd.built_form ? { built_form: hd.built_form } : {}),
          ...(hd.construction_age_band ? { construction_age_band: hd.construction_age_band } : {}),
          ...(hd.wall_construction ? { wall_construction: hd.wall_construction } : {}),
          ...(draft.home.lat !== null ? { latitude: draft.home.lat } : {}),
          ...(draft.home.lng !== null ? { longitude: draft.home.lng } : {}),
        });
        const savedId: string | null = res?.data?.id ?? res?.id ?? null;
        createdExtras.current[draft.id] = savedId ?? 'saved';
        // A home picked from the list already carries its EPC certificate: link it (non-critical).
        if (savedId && draft.home.certificateNumber) {
          await apiClient
            .post(`/api/v1/properties/${savedId}/epc/link/`, { certificate_number: draft.home.certificateNumber })
            .catch(() => {});
        }
      } catch (e) {
        // Back to that home's form with the reason; the ones already saved are kept.
        const reason = apiFieldError(e, 'postcode') || apiFieldError(e, 'address')
          || 'Could not save this property. Check the details and try again.';
        setEditingExtra(draft.id);
        setExtraErrors({ home: reason });
        setDirection(-1);
        setStep('extra');
        return;
      }
    }

    try {
      await apiClient.patch('/api/v1/auth/me/', { profile: { onboarding_completed: true } });
      await refreshUser();
    } catch {
      // best effort — the home is saved, so this will succeed on the next load.
    }

    await queryClient.invalidateQueries({
      predicate: q => typeof q.queryKey[0] === 'string' && (q.queryKey[0] as string).startsWith('/api/v1/properties/'),
    });
    navigate('/dashboard', { replace: true });
  };

  const activeDraft = extras.find(d => d.id === editingExtra);
  const savedExtras = extras.filter(d => d.home.address.trim());
  // "Add another property?" lists what is added so far. All let homes are removable.
  const moreItems = [
    { key: 'first', label: propertyName.trim() || propertyNickname({ address }), usage, removable: false },
    ...savedExtras.map(d => ({
      key: String(d.id),
      label: propertyNickname({ name: d.details.name, address: d.home.address, postcode: d.home.postcode }),
      usage: 'let' as Usage,
      removable: true,
    })),
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <img src="/homeplus-logo.png" alt="Home+" className="w-8 h-8 object-contain" />
          <span className="text-[17px] font-semibold text-foreground">Home+</span>
        </div>

        {current !== 'loading' && (
          <div className="flex items-center gap-1.5">
            {mainSteps.map((_, i) => (
              <motion.div
                key={i}
                animate={{ width: i === mainIndex(current) ? 28 : 8, opacity: i <= mainIndex(current) ? 1 : 0.2 }}
                transition={{ duration: 0.3 }}
                className="h-2 rounded-full bg-foreground"
              />
            ))}
          </div>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait" custom={direction}>
            {current === 'type' && (
              <motion.div
                key="type"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <StepAccountType
                  value={accountType}
                  onChange={v => { setAccountType(v); setTypeError(''); }}
                  error={typeError}
                  stepLabel={stepLabel}
                />
              </motion.div>
            )}

            {current === 'phone' && (
              <motion.div
                key="phone"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <StepPhone phone={phone} setPhone={setPhone} error={phoneError} stepLabel={stepLabel} />
              </motion.div>
            )}

            {current === 'property' && (
              <motion.div
                key="property"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <StepProperty
                  name={propertyName} setName={setPropertyName}
                  bedrooms={bedrooms} setBedrooms={setBedrooms}
                  bathrooms={bathrooms} setBathrooms={setBathrooms}
                  heatingType={heatingType} setHeatingType={setHeatingType}
                  yearBuilt={yearBuilt} setYearBuilt={setYearBuilt}
                  tenure={tenure} setTenure={setTenure}
                  floorArea={floorArea} setFloorArea={setFloorArea}
                  details={details} patchDetails={patchDetails} askFields={askFields ?? []}
                  home={home} onHomeChange={handleHomeChange} hasSavedHome={hasSavedHome}
                  propertyType={propertyType} setPropertyType={setPropertyType}
                  usage={usage} accountType={accountType ?? 'homeowner'} stepLabel={stepLabel}
                  coverPreview={coverPreview}
                  onCoverClick={() => coverRef.current?.click()}
                  editing={editingHome} setEditing={setEditingHome} onDoneEditing={handleDoneEditing}
                  error={propertyError}
                />
                <input
                  ref={coverRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverChange}
                />
              </motion.div>
            )}

            {current === 'tenancy' && (
              <motion.div
                key={`tenancy-${tenancyQ}`}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <StepTenancy
                  question={tenancyQ} start={tenancyStart} end={tenancyEnd}
                  setStart={v => { setTenancyStart(v); setTenancyError(''); }}
                  setEnd={v => { setTenancyEnd(v); setTenancyError(''); }}
                  error={tenancyError} stepLabel={stepLabel}
                />
              </motion.div>
            )}

            {current === 'extra' && activeDraft && (
              <motion.div
                key={`extra-${activeDraft.id}`}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <StepExtraProperty
                  draft={activeDraft}
                  errors={extraErrors}
                  onHomeChange={h => patchExtra(activeDraft.id, { home: h })}
                  onDetailsChange={d => patchExtra(activeDraft.id, { details: d })}
                  stepLabel={stepLabel}
                />
              </motion.div>
            )}

            {current === 'more' && (
              <motion.div
                key="more"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <StepMore
                  items={moreItems}
                  onAdd={startExtra}
                  onFinish={() => go('notifications')}
                  onRemove={removeExtra}
                  stepLabel={stepLabel}
                />
              </motion.div>
            )}

            {current === 'notifications' && (
              <motion.div
                key="notifications"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <StepNotifications prefs={notifPrefs} setPrefs={setNotifPrefs} stepLabel={stepLabel} />
              </motion.div>
            )}

            {current === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              >
                <StepLoading onDone={handleComplete} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer CTA */}
      {current !== 'loading' && (
        <motion.footer
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="px-6 pb-8 pt-4"
        >
          <div className="max-w-lg mx-auto space-y-3">
            {/* Primary CTA */}
            {current === 'type' && (
              <button
                onClick={handleTypeContinue}
                disabled={submitting}
                data-action="continue"
                className="w-full flex items-center justify-center gap-2 bg-foreground text-white rounded-2xl py-4 text-[16px] font-semibold hover:bg-foreground/90 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <><span>Continue</span><ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            )}

            {current === 'phone' && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePhoneContinue}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-foreground text-white rounded-2xl py-4 text-[16px] font-semibold hover:bg-foreground/90 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <><span>Continue</span><ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handlePhoneSkip}
                  className="shrink-0 text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  Skip <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {current === 'property' && (
              <button
                onClick={handlePropertyContinue}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-foreground text-white rounded-2xl py-4 text-[16px] font-semibold hover:bg-foreground/90 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <><span>Continue</span><ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            )}

            {current === 'tenancy' && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleTenancyContinue}
                  data-action="continue"
                  className="flex-1 flex items-center justify-center gap-2 bg-foreground text-white rounded-2xl py-4 text-[16px] font-semibold hover:bg-foreground/90 active:scale-[0.98] transition-all"
                >
                  <span>Continue</span><ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleTenancySkip}
                  data-action="skip"
                  className="shrink-0 text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  Skip <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {current === 'extra' && (
              <button
                onClick={handleExtraContinue}
                data-action="continue"
                className="w-full flex items-center justify-center gap-2 bg-foreground text-white rounded-2xl py-4 text-[16px] font-semibold hover:bg-foreground/90 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <span>Continue</span><ArrowRight className="w-4 h-4" />
              </button>
            )}

            {current === 'notifications' && (
              <button
                onClick={handleNotifContinue}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-foreground text-white rounded-2xl py-4 text-[16px] font-semibold hover:bg-foreground/90 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <><span>Finish setup</span><ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            )}

            {/* Secondary CTA */}
            <div className="flex items-center justify-between">
              {history.length > 0 || (current === 'tenancy' && tenancyQ === 1) ? (
                <button
                  type="button"
                  onClick={back}
                  className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back
                </button>
              ) : <div />}

            </div>
          </div>
        </motion.footer>
      )}
    </div>
  );
};

export default Onboarding;
