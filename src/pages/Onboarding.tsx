import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Home, ChevronRight, ArrowRight, Building, Building2, Warehouse, LayoutGrid, HelpCircle, KeyRound, Briefcase, Users, Check, Camera } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/apiClient';
import HomeSelector from '@/components/HomeSelector';
import { EMPTY_HOME, fetchHomeDetails, type HomeSelection } from '@/lib/homeLookup';
import { formatPostcode, postcodeError } from '@/lib/postcode';
import {
  PROPERTY_TYPES as TYPE_OPTIONS, ROLES as ROLE_OPTIONS, HEATING_TYPES, TENURE_TYPES, WALL_TYPES, EMPTY_HOME_DETAILS,
  applyEpc, clearEpc, labelFor, type HomeDetails,
} from '@/lib/propertyOptions';
import PropertyDetailsFields, { type DetailField } from '@/components/PropertyDetailsFields';

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
const ROLE_ICONS: Record<string, typeof Home> = { homeowner: KeyRound, landlord: Briefcase, tenant: Users };

const PROPERTY_TYPES = TYPE_OPTIONS.map(t => ({ ...t, icon: TYPE_ICONS[t.value] ?? Home }));
const ROLES = ROLE_OPTIONS.map(r => ({ ...r, icon: ROLE_ICONS[r.value] ?? Home }));

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
  phone, setPhone, error,
}: { phone: string; setPhone: (v: string) => void; error: string }) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground tracking-widest uppercase">Step 1 of 3</p>
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
            onChange={e => setPhone(e.target.value.replace(/[^0-9 ()+\-]/g, ''))}
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
  role, setRole,
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
  role: string; setRole: (v: string) => void;
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

  return (
    <div className="space-y-7">
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground tracking-widest uppercase">Step 2 of 3</p>
        <h1 className="text-3xl sm:text-5xl font-bold text-foreground leading-[1.1] tracking-tight">
          {showSummary ? <>Here&apos;s your<br />home.</> : <>Tell us about<br />your home.</>}
        </h1>
        <p className="text-[17px] text-muted-foreground">
          {showSummary ? 'Check the details. You can edit anything.' : "We'll use this to tailor your maintenance schedule."}
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
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Your home</p>
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
                ['Role', labelFor(ROLES, role)],
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
          placeholder="Property name (e.g. Main Home)"
          className="w-full rounded-2xl border-2 border-border focus:border-foreground bg-card px-4 py-3.5 text-[15px] font-medium text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors"
        />

        <HomeSelector value={home} onChange={onHomeChange} />

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

        {/* Role */}
        <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Your role</label>
        <div className="grid grid-cols-1 xs:grid-cols-3 gap-2.5">
          {ROLES.map(r => (
            <motion.button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className={`flex flex-col items-start gap-0.5 rounded-2xl border-2 py-3.5 px-2.5 sm:px-4 text-left transition-all ${
                role === r.value
                  ? 'border-accent bg-gradient-hero text-accent-foreground'
                  : 'border-border bg-card text-foreground hover:border-foreground'
              }`}
            >
              <r.icon className="w-4 h-4 mb-1" />
              <span className="text-xs sm:text-sm font-bold">{r.label}</span>
              <span className={`text-xs ${role === r.value ? 'text-accent-foreground/60' : 'text-muted-foreground'}`}>{r.desc}</span>
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
  prefs, setPrefs,
}: { prefs: NotifPrefs; setPrefs: (p: NotifPrefs) => void }) {
  const items: { key: keyof NotifPrefs; label: string; desc: string }[] = [
    { key: 'email_notifications', label: 'Email updates',      desc: 'Reminders, certificates, service alerts' },
    { key: 'sms_notifications',   label: 'SMS alerts',         desc: 'Urgent alerts to your phone. Coming soon.' },
    { key: 'calendar_reminders',  label: 'Calendar events',    desc: 'Add jobs and services to your calendar' },
    { key: 'marketing_emails',    label: 'Tips & offers',      desc: 'Home advice, deals, product news' },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground tracking-widest uppercase">Step 3 of 3</p>
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

// ─── Main Page ────────────────────────────────────────────────────────────────

const Onboarding = () => {
  const { user, loading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Step 2
  const [propertyName, setPropertyName] = useState('');
  const [address, setAddress] = useState('');
  const [postcode, setPostcode] = useState('');
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [role, setRole] = useState('homeowner');
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
    if (ROLES.some(r => r.value === hd.role)) setRole(text(hd.role));
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
    name: propertyName, propertyType, role, bedrooms, bathrooms, heatingType, yearBuilt, tenure,
    floorArea, builtForm, ageBand, wallConstruction, heatingNote, epcFilled,
  };
  const detailsRef = useRef(details);
  detailsRef.current = details;
  const patchDetails = (p: Partial<HomeDetails>) => {
    if (p.name !== undefined) setPropertyName(p.name);
    if (p.propertyType !== undefined) setPropertyType(p.propertyType);
    if (p.role !== undefined) setRole(p.role);
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

  const advance = () => {
    setDirection(1);
    setStep(s => s + 1);
  };

  const back = () => {
    setDirection(-1);
    setStep(s => s - 1);
  };

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
    advance();
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
    advance();
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
    advance();
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
    advance();
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
      role,
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
    };
    let propertyId: string | null = null;
    try {
      const { data: res } = await apiClient.post('/api/v1/properties/', payload);
      propertyId = res?.data?.id ?? res?.id ?? null;
    } catch (e) {
      setPropertyError(apiFieldError(e, 'postcode') || apiFieldError(e, 'address')
        || 'Could not save your home. Check the details and try again.');
      setDirection(-1);
      setStep(1);
      return;
    }

    if (coverFile && propertyId) {
      const fd = new FormData();
      fd.append('file', coverFile);
      await apiClient.post(`/api/v1/properties/${propertyId}/cover-image/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).catch(() => {});
    }

    // EPC auto-link on the first home. Non-critical: user can set it manually.
    if (propertyId && postcode.trim()) {
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

  const TOTAL_STEPS = 3; // loading screen is step 3 (index), not counted in progress

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <img src="/homeplus-logo.png" alt="Home+" className="w-8 h-8 object-contain" />
          <span className="text-[17px] font-semibold text-foreground">Home+</span>
        </div>

        {step < TOTAL_STEPS && (
          <div className="flex items-center gap-1.5">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <motion.div
                key={i}
                animate={{ width: i === step ? 28 : 8, opacity: i <= step ? 1 : 0.2 }}
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
            {step === 0 && (
              <motion.div
                key="phone"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <StepPhone phone={phone} setPhone={setPhone} error={phoneError} />
              </motion.div>
            )}

            {step === 1 && (
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
                  role={role} setRole={setRole}
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

            {step === 2 && (
              <motion.div
                key="notifications"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <StepNotifications prefs={notifPrefs} setPrefs={setNotifPrefs} />
              </motion.div>
            )}

            {step === 3 && (
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
      {step < TOTAL_STEPS && (
        <motion.footer
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="px-6 pb-8 pt-4"
        >
          <div className="max-w-lg mx-auto space-y-3">
            {/* Primary CTA */}
            {step === 0 && (
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

            {step === 1 && (
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

            {step === 2 && (
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
              {step > 0 ? (
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
