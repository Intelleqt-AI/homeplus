import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/apiClient';
import Logo from '/home-logo-new.png';

type TokenState = 'validating' | 'valid' | 'invalid';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [tokenState, setTokenState] = useState<TokenState>('validating');
  const [tokenError, setTokenError] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    if (!token) return;
    apiClient
      .get(`/api/v1/auth/validate-reset-token/?token=${encodeURIComponent(token)}`, {
        _skipRefresh: true,
      } as any)
      .then(() => setTokenState('valid'))
      .catch((err: any) => {
        const errors = err.response?.data?.errors || {};
        const msg =
          errors.token?.[0] ||
          err.response?.data?.message ||
          'This reset link is invalid or has expired.';
        setTokenError(msg);
        setTokenState('invalid');
      });
  }, [token]);

  if (user) return <Navigate to="/dashboard" replace />;
  if (!token) return <Navigate to="/forgot-password" replace />;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (newPassword.length < 8) errs.newPassword = 'Password must be at least 8 characters.';
    if (newPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const errs = validate();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    try {
      await apiClient.post(
        '/api/v1/auth/reset-password/',
        { token, new_password: newPassword, confirm_password: confirmPassword },
        { _skipRefresh: true } as any,
      );
      setDone(true);
    } catch (err: any) {
      const errors = err.response?.data?.errors || {};
      const msg =
        errors.token?.[0] ||
        errors.new_password?.[0] ||
        errors.confirm_password?.[0] ||
        errors.non_field_errors?.[0] ||
        err.response?.data?.message ||
        'Something went wrong. Try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const logoBlock = (
    <div className="text-center mb-8">
      <Link to="/" className="inline-flex items-center gap-2.5">
        <img src={Logo} className="max-w-[100px]" />
      </Link>
    </div>
  );

  if (tokenState === 'validating') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {logoBlock}
          <div className="bg-card border rounded-xl shadow-sm p-6 flex flex-col items-center gap-4">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Validating your reset link…</p>
          </div>
        </div>
      </div>
    );
  }

  if (tokenState === 'invalid') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {logoBlock}
          <div className="bg-card border rounded-xl shadow-sm p-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-6 w-6 text-red-500" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-xl font-semibold">Link invalid or expired</h1>
              <p className="text-sm text-muted-foreground">{tokenError}</p>
            </div>
            <Link
              to="/forgot-password"
              className="block w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium
                flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
              Request a new link
            </Link>
            <Link to="/login" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {logoBlock}

        {done ? (
          <div className="bg-card border rounded-xl shadow-sm p-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-xl font-semibold">Password reset!</h1>
              <p className="text-sm text-muted-foreground">Your password has been updated. You can now sign in with your new password.</p>
            </div>
            <Link
              to="/login"
              className="block w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium
                flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
              Sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">Set new password</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">Choose a strong password for your account.</p>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="new-password" className="text-sm font-medium">
                  New password
                </Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNew ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={e => {
                      setNewPassword(e.target.value);
                      setFieldErrors(p => ({ ...p, newPassword: '' }));
                    }}
                    autoComplete="new-password"
                    autoFocus
                    disabled={loading}
                    required
                    className={`h-10 bg-white pr-10 ${fieldErrors.newPassword ? 'border-destructive focus-visible:ring-0' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showNew ? 'Hide password' : 'Show password'}
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.newPassword && <p className="text-xs text-destructive">{fieldErrors.newPassword}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-password" className="text-sm font-medium">
                  Confirm password
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => {
                      setConfirmPassword(e.target.value);
                      setFieldErrors(p => ({ ...p, confirmPassword: '' }));
                    }}
                    autoComplete="new-password"
                    disabled={loading}
                    required
                    className={`h-10 bg-white pr-10 ${fieldErrors.confirmPassword ? 'border-destructive focus-visible:ring-0' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium
                  flex items-center justify-center gap-2
                  hover:bg-primary/90 active:scale-[0.98]
                  disabled:opacity-60 disabled:cursor-not-allowed
                  transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Resetting…
                  </>
                ) : (
                  'Reset password'
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link to="/login" className="font-medium text-primary hover:underline">
                ← Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
