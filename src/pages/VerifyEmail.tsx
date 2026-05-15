import { useEffect, useRef, useState } from 'react';
import { Home, Loader2, AlertCircle, Mail, RotateCcw } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth, PENDING_TOKEN_KEY } from '@/hooks/useAuth';

const VerifyEmail = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { verifyEmail, resendOTP, cancelRegistration, user } = useAuth();
  const navigate = useNavigate();

  const pendingToken = localStorage.getItem(PENDING_TOKEN_KEY);

  // Derive masked email from token payload if stored alongside
  const pendingEmail = localStorage.getItem('hp_pending_email') || '';

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  if (user) return <Navigate to="/dashboard" replace />;
  if (!pendingToken) return <Navigate to="/signup" replace />;

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setError('');

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 filled
    if (digit && index === 5) {
      const full = [...next].join('');
      if (full.length === 6) submitOTP(full);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    pasted.split('').forEach((d, i) => { next[i] = d; });
    setOtp(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    if (pasted.length === 6) submitOTP(pasted);
  };

  const submitOTP = async (code: string) => {
    setLoading(true);
    setError('');
    const { error, user: newUser } = await verifyEmail(pendingToken!, code);
    if (error) {
      setError(error.message);
      setLoading(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } else {
      const onboardingDone = newUser?._raw?.profile?.onboarding_completed;
      navigate(onboardingDone ? '/dashboard' : '/onboarding', { replace: true });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { setError('Enter all 6 digits.'); return; }
    submitOTP(code);
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    const { error } = await resendOTP(pendingToken!);
    setResending(false);
    if (error) { setError(error.message); return; }
    setResendCooldown(60);
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  const handleCancel = async () => {
    setCancelling(true);
    await cancelRegistration(pendingToken!);
    localStorage.removeItem('hp_pending_email');
    navigate('/signup');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero">
              <Home className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-semibold tracking-tight">Home+</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-card border rounded-xl shadow-sm p-6 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-xl font-semibold">Check your email</h1>
            <p className="text-sm text-muted-foreground">
              We sent a 6-digit code to{' '}
              {pendingEmail ? (
                <span className="font-medium text-foreground">{pendingEmail}</span>
              ) : (
                'your email address'
              )}
            </p>
          </div>

          {/* OTP inputs */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2 justify-center" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  disabled={loading}
                  className={`w-11 h-13 text-center text-xl font-semibold rounded-md border bg-background
                    focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
                    disabled:opacity-50 transition-colors
                    ${error ? 'border-destructive' : 'border-input'}
                  `}
                  style={{ height: '3.25rem' }}
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || otp.join('').length < 6}
              className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium
                flex items-center justify-center gap-2
                hover:bg-primary/90 active:scale-[0.98]
                disabled:opacity-60 disabled:cursor-not-allowed
                transition-all duration-150"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</> : 'Verify email'}
            </button>
          </form>

          {/* Resend */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Didn't receive it?{' '}
              {resendCooldown > 0 ? (
                <span className="text-muted-foreground">Resend in {resendCooldown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="inline-flex items-center gap-1 text-primary hover:underline font-medium disabled:opacity-50"
                >
                  {resending ? <><RotateCcw className="h-3 w-3 animate-spin" /> Sending…</> : 'Resend code'}
                </button>
              )}
            </p>
          </div>

          {/* Cancel */}
          <div className="border-t pt-4 text-center">
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="text-sm text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
            >
              {cancelling ? 'Cancelling…' : 'Cancel registration'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
