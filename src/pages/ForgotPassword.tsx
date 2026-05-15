import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Home, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/apiClient';
import Logo from '/home-logo-new.png';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await apiClient.post('/api/v1/auth/forgot-password/', { email }, { _skipRefresh: true } as any);
      setSent(true);
    } catch (err: any) {
      const errors = err.response?.data?.errors || {};
      setError(errors.email?.[0] || err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <img src={Logo} className="max-w-[100px]" />
          </Link>
        </div>

        {sent ? (
          /* Success state */
          <div className="bg-card border rounded-xl shadow-sm p-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-xl font-semibold">Check your inbox</h1>
              <p className="text-sm text-muted-foreground">
                If <span className="font-medium text-foreground">{email}</span> is registered, you'll receive a password reset link shortly.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Didn't get it? Check your spam folder or{' '}
              <button
                type="button"
                className="text-primary hover:underline font-medium"
                onClick={() => {
                  setSent(false);
                }}
              >
                try again
              </button>
            </p>
            <Link to="/login" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back to sign in
            </Link>
          </div>
        ) : (
          /* Form state */
          <>
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">Forgot your password?</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">Enter your email and we'll send you a reset link.</p>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  autoComplete="email"
                  autoFocus
                  disabled={loading}
                  required
                  className="h-10 bg-white"
                />
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
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                  </>
                ) : (
                  'Send reset link'
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Remember it?{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
