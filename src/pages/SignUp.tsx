import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Home, ArrowRight, Check, Shield, Users, Star, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import SocialSignInButtons from '@/components/auth/SocialSignInButtons';
import AccountTypePicker from '@/components/account/AccountTypePicker';
import HomeSelector from '@/components/HomeSelector';
import PropertyDetailsFields from '@/components/PropertyDetailsFields';
import { EMPTY_HOME, fetchHomeDetails, type HomeSelection } from '@/lib/homeLookup';
import {
  EMPTY_HOME_DETAILS, HEATING_TYPES, PROPERTY_TYPES, WALL_TYPES, applyEpc, clearEpc, epcSummary, labelFor,
  toHomeDetailsPayload, type HomeDetails,
} from '@/lib/propertyOptions';
import {
  ACCOUNT_TYPE_CAPTION, accountTypeTitle, firstUsage, rememberSrc, srcPreselect, wordingFor, type AccountType,
} from '@/lib/account';
import Logo from '/homeplus-logo.png';

// ── validation ────────────────────────────────────────────────────────────────

function validateStep1(data: typeof INITIAL) {
  const e: Record<string, string> = {};
  if (!data.email) e.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = 'Enter a valid email address.';
  if (!data.password) e.password = 'Password is required.';
  else if (data.password.length < 8) e.password = 'Must be at least 8 characters.';
  else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(data.password)) e.password = 'Include at least one letter and one number.';
  if (!data.confirmPassword) e.confirmPassword = 'Please confirm your password.';
  else if (data.password !== data.confirmPassword) e.confirmPassword = 'Passwords do not match.';
  if (!data.firstName.trim()) e.firstName = 'First name is required.';
  if (!data.lastName.trim()) e.lastName = 'Last name is required.';
  return e;
}

function validateHome(home: HomeSelection, wording: 'home' | 'property') {
  const e: Record<string, string> = {};
  if (wording === 'property') {
    if (!home.postcode) e.home = 'Select your area and postcode, then the property.';
    else if (!home.address.trim()) e.home = "Select the property, or choose \"This property isn't listed\" and enter the address.";
    else if (home.lat === null || home.lng === null) e.home = 'Place the pin on the map to mark the property.';
    return e;
  }
  if (!home.postcode) e.home = 'Select your area and postcode, then your home.';
  else if (!home.address.trim()) e.home = "Select your home, or choose \"My home isn't listed\" and enter the address.";
  else if (home.lat === null || home.lng === null) e.home = 'Place the pin on the map to mark your home.';
  return e;
}

// The titles of the two home steps follow what the first property is. The brief gives the
// renter's "Tell us about the home you rent"; the rest are written in the same plain style.
const HOME_STEP_TITLES: Record<AccountType, { where: string; about: string }> = {
  homeowner: { where: 'Where is your home?', about: 'Tell us about your home' },
  landlord: { where: 'Where is the property you let?', about: 'Tell us about the property you let' },
  both: { where: 'Where is the home you live in?', about: 'Tell us about the home you live in' },
  renter: { where: 'Where is the home you rent?', about: 'Tell us about the home you rent' },
};
const HOME_STEP_SUBTITLES: Record<AccountType, { where: string; about: string }> = {
  homeowner: { where: 'Pick your area, postcode and home', about: 'We use this to tailor your maintenance schedule' },
  landlord: { where: 'Pick the area, postcode and property', about: 'We use this to tailor your reminders' },
  both: { where: 'Pick your area, postcode and home', about: 'We use this to tailor your maintenance schedule' },
  renter: { where: 'Pick your area, postcode and home', about: 'We use this to tailor your reminders' },
};
const TOTAL_STEPS = 5;

// ── constants ─────────────────────────────────────────────────────────────────

const INITIAL = {
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  agreeToTerms: false,
};

const benefits = [
  { icon: Shield, text: 'Free forever - no hidden costs' },
  { icon: Users, text: 'Connect with top-rated local trades' },
  { icon: Star, text: 'Preventive maintenance reminders' },
  { icon: Check, text: 'Complete home history tracking' },
];

// ── component ─────────────────────────────────────────────────────────────────

const SignUp = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingHome, setCheckingHome] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState(INITIAL);
  const [details, setDetails] = useState<HomeDetails>(EMPTY_HOME_DETAILS);
  const [home, setHome] = useState<HomeSelection>(EMPTY_HOME);
  // "How will you use Home+?" Nothing is chosen for you, except when the person came from a
  // landlord page of the website (?src=/landlords...), which pre-selects "Homes I let out".
  const [accountType, setAccountType] = useState<AccountType | null>(() => srcPreselect(rememberSrc(window.location.search)));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');

  const { signUp, user } = useAuth();
  const navigate = useNavigate();

  // A card pre-selected from ?src= also decides what the first property is.
  useEffect(() => {
    if (accountType) setDetails(prev => ({ ...prev, usage: firstUsage(accountType) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (user) return <Navigate to="/dashboard" replace />;

  const update = (field: keyof typeof INITIAL) => (val: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: val }));
    setErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleDetailsChange = (patch: Partial<HomeDetails>) => {
    setDetails(prev => ({ ...prev, ...patch }));
    setErrors(prev => {
      const next = { ...prev };
      for (const k of Object.keys(patch)) delete next[k];
      return next;
    });
  };

  const handleHomeChange = (next: HomeSelection) => {
    setHome(next);
    setErrors(prev => {
      if (!prev.home) return prev;
      const { home: _drop, ...rest } = prev;
      return rest;
    });
  };

  // What the first property is follows the choice ("Both" starts with the home they live in).
  const handleAccountTypeChange = (type: AccountType) => {
    setAccountType(type);
    setDetails(prev => ({ ...prev, usage: firstUsage(type) }));
    setErrors(prev => {
      const { accountType: _drop, ...rest } = prev;
      return rest;
    });
  };

  const wording = wordingFor(details.usage);
  const titles = HOME_STEP_TITLES[accountType ?? 'homeowner'];
  const subtitles = HOME_STEP_SUBTITLES[accountType ?? 'homeowner'];

  const handleNext = async () => {
    const errs =
      step === 1 ? validateStep1(formData)
        : step === 2 ? (accountType ? {} : { accountType: 'Choose one to continue.' })
          : step === 3 ? validateHome(home, wording)
            : {};
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitError('');
    if (step === 3) {
      // Read what the home's EPC certificate says (type, floor area, ...). A failed or empty
      // lookup just means nothing is prefilled.
      setCheckingHome(true);
      const epc = home.homeId !== null ? await fetchHomeDetails(home.homeId) : {};
      setDetails(prev => applyEpc(clearEpc(prev), epc));
      setCheckingHome(false);
    }
    setStep(s => s + 1);
  };

  const handleSignUp = async () => {
    if (!formData.agreeToTerms) {
      setErrors({ agreeToTerms: 'You must agree to the terms to continue.' });
      return;
    }
    setSubmitError('');
    setLoading(true);

    const { error, email } = await signUp(formData.email, formData.password, {
      first_name: formData.firstName,
      last_name: formData.lastName,
      account_type: accountType ?? undefined,
      property_type: details.propertyType,
      home_details: toHomeDetailsPayload(details),
      postcode: home.postcode,
      location: home.area,
      address: home.address.trim(),
      latitude: home.lat,
      longitude: home.lng,
      uprn: home.uprn,
      epc_certificate_number: home.certificateNumber,
    });

    if (error) {
      setSubmitError(error.message);
      setLoading(false);
    } else {
      if (email) localStorage.setItem('hp_pending_email', email);
      navigate('/verify-email');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={Logo} className="h-10 w-auto object-contain" />
          </Link>
          <div className="text-sm text-foreground">
            <span className="hidden xs:inline">Already have an account? </span>
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-12">
        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Left Side - Benefits */}
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="w-fit">
                Step {step} of {TOTAL_STEPS}
              </Badge>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Join thousands of homeowners managing their homes{' '}
                <span className="bg-gradient-hero bg-clip-text text-transparent">smarter</span>
              </h1>
              <p className="text-xl text-foreground leading-relaxed">
                Get started with your digital home MOT logbook and never miss important maintenance again.
              </p>
            </div>

            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <benefit.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-foreground">{benefit.text}</span>
                </div>
              ))}
            </div>

            <div className="bg-muted/50 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 border-2 border-background"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 border-2 border-background"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500 border-2 border-background"></div>
                </div>
                <span className="font-medium">Join 10,000+ homeowners</span>
              </div>
              <p className="text-sm text-foreground">
                "Home+ saved me £2,000 by catching a roof issue early. The maintenance reminders are a lifesaver!"
              </p>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="ml-2 text-sm font-medium">4.9/5 rating</span>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="flex items-center justify-center order-first lg:order-none">
            <Card className="w-full max-w-md shadow-strong">
              <CardHeader className="text-center space-y-2">
                <CardTitle className="text-2xl">
                  {step === 1 && 'Create your account'}
                  {step === 2 && 'How will you use Home+?'}
                  {step === 3 && titles.where}
                  {step === 4 && titles.about}
                  {step === 5 && 'Almost there!'}
                </CardTitle>
                {step !== 2 && (
                  <CardDescription>
                    {step === 1 && 'Start your home management journey'}
                    {step === 3 && subtitles.where}
                    {step === 4 && subtitles.about}
                    {step === 5 && 'Confirm your details and get started'}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {/* ── Step 1 ── */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="firstName">First name</Label>
                        <Input
                          id="firstName"
                          placeholder="John"
                          autoComplete="given-name"
                          autoFocus
                          value={formData.firstName}
                          onChange={e => update('firstName')(e.target.value)}
                          className={errors.firstName ? 'border-destructive focus-visible:ring-0' : ''}
                        />
                        {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="lastName">Last name</Label>
                        <Input
                          id="lastName"
                          placeholder="Smith"
                          autoComplete="family-name"
                          value={formData.lastName}
                          onChange={e => update('lastName')(e.target.value)}
                          className={errors.lastName ? 'border-destructive focus-visible:ring-0' : ''}
                        />
                        {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={e => update('email')(e.target.value)}
                        autoComplete="email"
                        className={errors.email ? 'border-destructive focus-visible:ring-0' : ''}
                      />
                      {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={e => update('password')(e.target.value)}
                          autoComplete="new-password"
                          className={`pr-10 ${errors.password ? 'border-destructive focus-visible:ring-0' : ''}`}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowPassword(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.password ? (
                        <p className="text-xs text-destructive">{errors.password}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Min 8 characters, mix of letters and numbers</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPassword">Confirm password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirm ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={formData.confirmPassword}
                          onChange={e => update('confirmPassword')(e.target.value)}
                          autoComplete="new-password"
                          className={`pr-10 ${errors.confirmPassword ? 'border-destructive focus-visible:ring-0' : ''}`}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowConfirm(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={showConfirm ? 'Hide password' : 'Show password'}
                        >
                          {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                    </div>
                  </div>
                )}

                {/* ── Step 2: how will you use Home+? ── */}
                {step === 2 && (
                  <div className="space-y-3">
                    <AccountTypePicker
                      value={accountType}
                      onChange={handleAccountTypeChange}
                      variant="signup"
                      error={errors.accountType}
                    />
                    <p className="text-center text-xs text-muted-foreground">{ACCOUNT_TYPE_CAPTION}</p>
                  </div>
                )}

                {/* ── Step 3: home ── */}
                {step === 3 && <HomeSelector value={home} onChange={handleHomeChange} error={errors.home} wording={wording} />}

                {/* ── Step 4: property details ── */}
                {step === 4 && (
                  <div className="space-y-4">
                    {epcSummary(details).length > 0 && (
                      <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <p className="text-sm text-foreground">
                          <span className="font-medium">Filled from your EPC:</span> {epcSummary(details).join(' · ')}
                        </p>
                      </div>
                    )}
                    <PropertyDetailsFields
                      value={details}
                      onChange={handleDetailsChange}
                      errors={errors}
                      show={['name']}
                      autoFocus
                      wording={wording}
                    />
                    <p className="text-xs text-muted-foreground">
                      We&apos;ll ask for any other details, like bedrooms, after you verify your email.
                    </p>
                  </div>
                )}

                {/* ── Step 5 ── */}
                {step === 5 && (
                  <div className="space-y-5">
                    <div className="bg-muted/50 rounded-lg border divide-y text-sm">
                      {[
                        ['Name', `${formData.firstName} ${formData.lastName}`],
                        ['Email', formData.email],
                        ['How you use Home+', accountTypeTitle(accountType)],
                        [wording === 'property' ? 'Property name' : 'Home name', details.name.trim()],
                        ['Address', home.address],
                        ['Postcode', home.postcode],
                        ['Area', home.area],
                        ['Property type', details.propertyType ? labelFor(PROPERTY_TYPES, details.propertyType) : ''],
                        ['Built form', details.builtForm.toLowerCase() === labelFor(PROPERTY_TYPES, details.propertyType).toLowerCase() ? '' : details.builtForm],
                        ['Floor area', details.floorArea ? `${details.floorArea} m²` : ''],
                        ['Built', details.ageBand || details.yearBuilt],
                        ['Heating', details.heatingType ? labelFor(HEATING_TYPES, details.heatingType) : ''],
                        ['Walls', details.wallConstruction ? labelFor(WALL_TYPES, details.wallConstruction) : ''],
                      ].filter(([, value]) => value).map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between gap-3 px-4 py-2.5">
                          <span className="shrink-0 text-muted-foreground">{label}</span>
                          <span className="min-w-0 truncate text-right font-medium" title={value || undefined}>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {submitError && (
                      <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                        <p className="text-sm text-destructive">{submitError}</p>
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="terms"
                          checked={formData.agreeToTerms}
                          onCheckedChange={v => update('agreeToTerms')(v as boolean)}
                          className="mt-0.5"
                        />
                        <label htmlFor="terms" className="text-sm text-foreground leading-snug cursor-pointer">
                          I agree to the{' '}
                          <Link to="/terms" className="text-primary hover:underline">
                            Terms of Service
                          </Link>{' '}
                          and{' '}
                          <Link to="/privacy" className="text-primary hover:underline">
                            Privacy Policy
                          </Link>
                        </label>
                      </div>
                      {errors.agreeToTerms && <p className="text-xs text-destructive pl-6">{errors.agreeToTerms}</p>}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={step === TOTAL_STEPS ? handleSignUp : handleNext}
                    disabled={loading || checkingHome}
                    className="w-full h-12 rounded-md bg-primary text-primary-foreground text-base font-medium
                      flex items-center justify-center gap-2
                      hover:bg-primary/90 active:scale-[0.98]
                      disabled:opacity-60 disabled:cursor-not-allowed
                      transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Creating account…
                      </>
                    ) : checkingHome ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Checking your home…
                      </>
                    ) : step === TOTAL_STEPS ? (
                      'Complete Registration'
                    ) : (
                      <>
                        Continue <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  {step > 1 && (
                    <Button
                      variant="ghost"
                      onClick={() => setStep(s => s - 1)}
                      className="w-full rounded-md text-muted-foreground hover:text-foreground"
                    >
                      Back
                    </Button>
                  )}
                </div>

                {/* Social sign-up sits under the form, as on the sign-in page. */}
                {step === 1 && (
                  <div className="space-y-3">
                    <SocialSignInButtons
                      variant="signup"
                      onSuccess={() => navigate('/dashboard')}
                      onError={setSubmitError}
                    />
                    {submitError && <p className="text-sm text-destructive text-center">{submitError}</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
