import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router-dom';
import { Home, ChevronRight, ArrowRight, Building, Building2, Warehouse, LayoutGrid, HelpCircle, KeyRound, Briefcase, Users, Check, ChevronsUpDown, Camera } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/apiClient';
import { UK_LOCATIONS, LOCATION_POSTCODE } from '@/lib/ukLocations';

// ─── Types ───────────────────────────────────────────────────────────────────

type NotifPrefs = {
  email_notifications: boolean;
  sms_notifications: boolean;
  calendar_reminders: boolean;
  marketing_emails: boolean;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const PROPERTY_TYPES = [
  { value: 'detached',      label: 'Detached',      icon: Home },
  { value: 'semi_detached', label: 'Semi-Detached',  icon: Building2 },
  { value: 'terraced',      label: 'Terraced',       icon: LayoutGrid },
  { value: 'flat',          label: 'Flat',           icon: Building },
  { value: 'bungalow',      label: 'Bungalow',       icon: Warehouse },
  { value: 'other',         label: 'Other',          icon: HelpCircle },
];

const ROLES = [
  { value: 'homeowner', label: 'Homeowner', desc: "It's my place",      icon: KeyRound },
  { value: 'landlord',  label: 'Landlord',  desc: 'I own & rent it out', icon: Briefcase },
  { value: 'tenant',    label: 'Tenant',    desc: "I'm renting",         icon: Users },
];

const LOADING_PHRASES = [
  'Setting up your profile',
  'Applying your preferences',
  'Personalising your dashboard',
  'Connecting everything together',
  'Almost there',
];

// ─── Framer variants ─────────────────────────────────────────────────────────

const stepVariants = {
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
        <h1 className="text-5xl font-bold text-foreground leading-[1.1] tracking-tight">
          What's your<br />phone number?
        </h1>
        <p className="text-[17px] text-muted-foreground leading-relaxed max-w-sm">
          We'll only use this for important account alerts — never marketing.
        </p>
      </div>

      <div className="space-y-2">
        <div className={`flex items-center gap-0 rounded-2xl border-2 bg-white overflow-hidden transition-colors ${
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
            className="flex-1 px-4 py-4 text-[17px] font-medium text-foreground placeholder:text-muted-foreground/50 bg-transparent outline-none"
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
  address, setAddress,
  postcode, setPostcode,
  location, setLocation,
  propertyType, setPropertyType,
  role, setRole,
  coverPreview, onCoverClick,
  error,
}: {
  name: string; setName: (v: string) => void;
  address: string; setAddress: (v: string) => void;
  postcode: string; setPostcode: (v: string) => void;
  location: string; setLocation: (v: string) => void;
  propertyType: string; setPropertyType: (v: string) => void;
  role: string; setRole: (v: string) => void;
  coverPreview: string | null; onCoverClick: () => void;
  error: string;
}) {
  const [locationOpen, setLocationOpen] = useState(false);

  const selectLocation = (val: string) => {
    setLocation(val);
    setPostcode(LOCATION_POSTCODE[val] ?? postcode);
    setLocationOpen(false);
  };

  return (
    <div className="space-y-7">
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground tracking-widest uppercase">Step 2 of 3</p>
        <h1 className="text-5xl font-bold text-foreground leading-[1.1] tracking-tight">
          Tell us about<br />your home.
        </h1>
        <p className="text-[17px] text-muted-foreground">
          We'll use this to tailor your maintenance schedule.
        </p>
      </div>

      {/* Cover photo */}
      <div
        onClick={onCoverClick}
        className="relative rounded-2xl overflow-hidden h-36 border-2 border-dashed border-border bg-white cursor-pointer hover:border-foreground transition-colors"
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

      {/* Address */}
      <div className="space-y-3">
        {/* Property name */}
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Property name (e.g. Main Home)"
          className="w-full rounded-2xl border-2 border-border focus:border-foreground bg-white px-4 py-3.5 text-[15px] font-medium text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors"
        />

        <div className="grid grid-cols-3 gap-3">
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="Address"
            className="col-span-2 rounded-2xl border-2 border-border focus:border-foreground bg-white px-4 py-3.5 text-[15px] font-medium text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors"
          />
          <input
            type="text"
            value={postcode}
            onChange={e => setPostcode(e.target.value.toUpperCase())}
            placeholder="Postcode"
            className="rounded-2xl border-2 border-border focus:border-foreground bg-white px-4 py-3.5 text-[15px] font-medium text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors uppercase"
          />
        </div>

        {/* City / Area selector */}
        <Popover open={locationOpen} onOpenChange={setLocationOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                'w-full rounded-2xl border-2 border-border focus:border-foreground bg-white px-4 py-3.5 text-[15px] font-medium outline-none transition-colors',
                'flex items-center justify-between gap-2',
                !location ? 'text-muted-foreground/50' : 'text-foreground',
              )}
            >
              <span className="truncate">{location || 'City / Area'}</span>
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-40" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search area…" />
              <CommandList>
                <CommandEmpty>No area found.</CommandEmpty>
                {UK_LOCATIONS.map(group => (
                  <CommandGroup key={group.group} heading={group.group}>
                    {group.items.map(item => (
                      <CommandItem key={item} value={item} onSelect={selectLocation}>
                        <Check className={cn('mr-2 h-3.5 w-3.5', location === item ? 'opacity-100' : 'opacity-0')} />
                        {item}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Property type */}
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
                  : 'border-border bg-white text-foreground hover:border-foreground'
              }`}
            >
              <t.icon className="w-5 h-5" />
              <span className="text-xs font-semibold">{t.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Role */}
        <div className="grid grid-cols-3 gap-2.5">
          {ROLES.map(r => (
            <motion.button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className={`flex flex-col items-start gap-0.5 rounded-2xl border-2 py-3.5 px-4 text-left transition-all ${
                role === r.value
                  ? 'border-accent bg-gradient-hero text-accent-foreground'
                  : 'border-border bg-white text-foreground hover:border-foreground'
              }`}
            >
              <r.icon className="w-4 h-4 mb-1" />
              <span className="text-sm font-bold">{r.label}</span>
              <span className={`text-xs ${role === r.value ? 'text-accent-foreground/60' : 'text-muted-foreground'}`}>{r.desc}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

function StepNotifications({
  prefs, setPrefs,
}: { prefs: NotifPrefs; setPrefs: (p: NotifPrefs) => void }) {
  const items: { key: keyof NotifPrefs; label: string; desc: string }[] = [
    { key: 'email_notifications', label: 'Email updates',      desc: 'Reminders, certificates, service alerts' },
    { key: 'sms_notifications',   label: 'SMS alerts',         desc: 'Urgent alerts to your phone' },
    { key: 'calendar_reminders',  label: 'Calendar events',    desc: 'Add jobs and services to your calendar' },
    { key: 'marketing_emails',    label: 'Tips & offers',      desc: 'Home advice, deals, product news' },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground tracking-widest uppercase">Step 3 of 3</p>
        <h1 className="text-5xl font-bold text-foreground leading-[1.1] tracking-tight">
          How should<br />we reach you?
        </h1>
        <p className="text-[17px] text-muted-foreground">
          You can change these any time in Settings.
        </p>
      </div>

      <div className="space-y-3">
        {items.map(item => (
          <button
            key={item.key}
            type="button"
            onClick={() => setPrefs({ ...prefs, [item.key]: !prefs[item.key] })}
            className={`w-full flex items-center justify-between rounded-2xl border-2 px-5 py-4 text-left transition-all ${
              prefs[item.key]
                ? 'border-accent bg-gradient-hero text-accent-foreground'
                : 'border-border bg-white text-foreground hover:border-foreground'
            }`}
          >
            <div>
              <p className="text-[15px] font-semibold">{item.label}</p>
              <p className={`text-xs mt-0.5 ${prefs[item.key] ? 'text-accent-foreground/60' : 'text-muted-foreground'}`}>{item.desc}</p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
              prefs[item.key] ? 'border-accent-foreground bg-accent-foreground' : 'border-border'
            }`}>
              {prefs[item.key] && (
                <div className="w-2.5 h-2.5 rounded-full bg-accent" />
              )}
            </div>
          </button>
        ))}
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
          className="w-24 h-24 rounded-[28px] bg-foreground flex items-center justify-center"
        >
          <Home className="w-10 h-10 text-accent" strokeWidth={1.5} />
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
  const [propertyError, setPropertyError] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const coverRef = useRef<HTMLInputElement>(null);

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

  const handlePropertyContinue = async () => {
    if (!address.trim() || !postcode.trim() || !propertyType) {
      setPropertyError('Please fill in address, postcode and select a property type.');
      return;
    }
    setPropertyError('');
    setSubmitting(true);
    try {
      const { data: res } = await apiClient.post('/api/v1/properties/', {
        name:          propertyName.trim() || undefined,
        address:       address.trim(),
        postcode:      postcode.trim().toUpperCase(),
        location:      location.trim() || undefined,
        property_type: propertyType,
        role,
        bedrooms: 0,
        bathrooms: 0,
      });
      const propertyId = res?.data?.id ?? res?.id;
      if (coverFile && propertyId) {
        const fd = new FormData();
        fd.append('file', coverFile);
        await apiClient.post(`/api/v1/properties/${propertyId}/cover-image/`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }).catch(() => {});
      }
    } catch {
      // non-critical, continue anyway
    } finally {
      setSubmitting(false);
    }
    advance();
  };

  const handlePropertySkip = () => {
    setPropertyError('');
    advance();
  };

  const handleNotifContinue = async () => {
    setSubmitting(true);
    try {
      await apiClient.patch('/api/v1/auth/notification-preferences/', notifPrefs);
    } catch {
      // non-critical
    } finally {
      setSubmitting(false);
    }
    advance();
  };

  const handleComplete = async () => {
    try {
      await apiClient.patch('/api/v1/auth/me/', { profile: { onboarding_completed: true } });
      await refreshUser();
    } catch {
      // best effort
    }
    navigate('/dashboard', { replace: true });
  };

  const TOTAL_STEPS = 3; // loading screen is step 3 (index), not counted in progress

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
            <Home className="w-4 h-4 text-accent" strokeWidth={1.5} />
          </div>
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
                  address={address} setAddress={setAddress}
                  postcode={postcode} setPostcode={setPostcode}
                  location={location} setLocation={setLocation}
                  propertyType={propertyType} setPropertyType={setPropertyType}
                  role={role} setRole={setRole}
                  coverPreview={coverPreview}
                  onCoverClick={() => coverRef.current?.click()}
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
              <button
                onClick={handlePhoneContinue}
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

            {step === 1 && (
              <button
                onClick={handlePropertyContinue}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-foreground text-white rounded-2xl py-4 text-[16px] font-semibold hover:bg-foreground/90 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <><span>Add property</span><ArrowRight className="w-4 h-4" /></>
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

              {step === 1 && (
                <button
                  type="button"
                  onClick={handlePropertySkip}
                  className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  Skip <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </motion.footer>
      )}
    </div>
  );
};

export default Onboarding;
