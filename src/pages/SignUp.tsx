import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Home, ArrowRight, Check, Shield, Users, Star, Eye, EyeOff, Loader2, AlertCircle, ChevronsUpDown } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { UK_LOCATIONS, LOCATION_POSTCODE } from '@/lib/ukLocations';
const ALL_LOCATIONS = UK_LOCATIONS.flatMap(g => g.items);
import Logo from '/home-logo-new.png';

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
  if (!data.location) e.location = 'Select your area.';
  if (!data.postCode) e.postCode = 'Postcode is required.';
  return e;
}

function validateStep2(data: typeof INITIAL) {
  const e: Record<string, string> = {};
  if (!data.firstName.trim()) e.firstName = 'First name is required.';
  if (!data.lastName.trim()) e.lastName = 'Last name is required.';
  if (!data.propertyType) e.propertyType = 'Select a property type.';
  return e;
}

// ── constants ─────────────────────────────────────────────────────────────────

const INITIAL = {
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  propertyType: '',
  location: '',
  postCode: '',
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [formData, setFormData] = useState(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');

  const { signUp, user } = useAuth();
  const navigate = useNavigate();

  if (user) return <Navigate to="/dashboard" replace />;

  const update = (field: keyof typeof INITIAL) => (val: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: val }));
    setErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleNext = () => {
    const errs = step === 1 ? validateStep1(formData) : validateStep2(formData);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
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
      property_type: formData.propertyType,
      postcode: formData.postCode.trim().toUpperCase(),
      location: formData.location,
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
            <img src={Logo} className="max-w-[90px]" />
          </Link>
          <div className="text-sm text-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Left Side - Benefits */}
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="w-fit">
                Step {step} of 3
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight">
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
          <div className="flex items-center justify-center">
            <Card className="w-full max-w-md shadow-strong">
              <CardHeader className="text-center space-y-2">
                <CardTitle className="text-2xl">
                  {step === 1 && 'Create your account'}
                  {step === 2 && 'Tell us about yourself'}
                  {step === 3 && 'Almost there!'}
                </CardTitle>
                <CardDescription>
                  {step === 1 && 'Start your home management journey'}
                  {step === 2 && 'Help us personalize your experience'}
                  {step === 3 && 'Confirm your details and get started'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* ── Step 1 ── */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={e => update('email')(e.target.value)}
                        autoComplete="email"
                        autoFocus
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

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Area</Label>
                        <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className={cn(
                                'w-full h-10 px-3 rounded-md border text-sm flex items-center justify-between gap-1 bg-background',
                                'hover:bg-muted/40 transition-colors',
                                errors.location ? 'border-destructive' : 'border-input',
                                !formData.location && 'text-muted-foreground',
                              )}
                            >
                              <span className="truncate">{formData.location || 'Select area'}</span>
                              <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search area…" />
                              <CommandList>
                                <CommandEmpty>No area found.</CommandEmpty>
                                {UK_LOCATIONS.map(group => (
                                  <CommandGroup key={group.group} heading={group.group}>
                                    {group.items.map(item => (
                                      <CommandItem
                                        key={item}
                                        value={item}
                                        onSelect={val => {
                                          setFormData(prev => ({ ...prev, location: val, postCode: LOCATION_POSTCODE[val] ?? '' }));
                                          setErrors(prev => {
                                            const next = { ...prev };
                                            delete next.location;
                                            delete next.postCode;
                                            return next;
                                          });
                                          setLocationOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn('mr-2 h-3.5 w-3.5', formData.location === item ? 'opacity-100' : 'opacity-0')}
                                        />
                                        {item}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                ))}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {errors.location && <p className="text-xs text-destructive">{errors.location}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="postCode">Postcode</Label>
                        <Input
                          id="postCode"
                          placeholder="Auto-filled"
                          value={formData.postCode}
                          onChange={e => update('postCode')(e.target.value.toUpperCase())}
                          autoComplete="postal-code"
                          className={`uppercase ${errors.postCode ? 'border-destructive focus-visible:ring-0' : ''}`}
                        />
                        {errors.postCode ? (
                          <p className="text-xs text-destructive">{errors.postCode}</p>
                        ) : (
                          <p className="text-xs text-muted-foreground">Edit if incorrect</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Step 2 ── */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="firstName">First name</Label>
                        <Input
                          id="firstName"
                          placeholder="John"
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
                          value={formData.lastName}
                          onChange={e => update('lastName')(e.target.value)}
                          className={errors.lastName ? 'border-destructive focus-visible:ring-0' : ''}
                        />
                        {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Property type</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'detached', label: 'Detached' },
                          { value: 'semi_detached', label: 'Semi-Detached' },
                          { value: 'terraced', label: 'Terraced' },
                          { value: 'flat', label: 'Flat' },
                          { value: 'bungalow', label: 'Bungalow' },
                          { value: 'other', label: 'Other' },
                        ].map(({ value, label }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => update('propertyType')(value)}
                            className={`h-12 rounded-md border text-sm font-medium transition-all
                              ${
                                formData.propertyType === value
                                  ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                                  : 'border-input bg-background hover:bg-muted/50'
                              }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      {errors.propertyType && <p className="text-xs text-destructive">{errors.propertyType}</p>}
                    </div>
                  </div>
                )}

                {/* ── Step 3 ── */}
                {step === 3 && (
                  <div className="space-y-5">
                    <div className="bg-muted/50 rounded-lg border divide-y text-sm">
                      {[
                        ['Name', `${formData.firstName} ${formData.lastName}`],
                        ['Email', formData.email],
                        ['Area', formData.location],
                        ['Postcode', formData.postCode],
                        [
                          'Property',
                          {
                            detached: 'Detached',
                            semi_detached: 'Semi-Detached',
                            terraced: 'Terraced',
                            flat: 'Flat',
                            bungalow: 'Bungalow',
                            other: 'Other',
                          }[formData.propertyType] ?? formData.propertyType,
                        ],
                      ].map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between px-4 py-2.5">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-medium">{value || '—'}</span>
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
                    onClick={step === 3 ? handleSignUp : handleNext}
                    disabled={loading}
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
                    ) : step === 3 ? (
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
