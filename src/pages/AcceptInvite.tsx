import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, AlertCircle, XCircle, Clock, CheckCircle2, Home, ShieldCheck, Inbox } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useActiveProperty } from '@/hooks/useActiveProperty';
import apiClient from '@/lib/apiClient';
import type { ApiError } from '@/lib/household';
import type { AxiosRequestConfig } from 'axios';
import Logo from '/homeplus-logo.png';

type InviteDetails = {
  status: 'pending' | 'accepted' | 'expired';
  email: string;
  invited_name?: string;
  owner?: { name?: string };
  all_properties?: boolean;
  /** Account-level jobs, documents and tasks not linked to any home. */
  share_unassigned?: boolean;
  /** Each home with the role the owner gave them on it. */
  homes?: { name?: string; address?: string; role?: string; role_label?: string }[];
  /** Their role on every home when `all_properties`. */
  default_role_label?: string;
  account_exists?: boolean;
};

type PageState = 'validating' | 'invalid' | 'ready';

const skip = { _skipRefresh: true } as AxiosRequestConfig;

const firstError = (err: ApiError, fallback: string): string => {
  const errors = err?.response?.data?.errors;
  if (errors && typeof errors === 'object') {
    for (const v of Object.values(errors)) {
      const msg = Array.isArray(v) ? v[0] : v;
      if (typeof msg === 'string' && msg && msg !== 'accepted' && msg !== 'expired') return msg;
    }
  }
  return err?.response?.data?.message || fallback;
};

const PasswordInput = ({
  id,
  value,
  onChange,
  disabled,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  invalid: boolean;
}) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        placeholder="••••••••"
        value={value}
        onChange={e => onChange(e.target.value)}
        autoComplete="new-password"
        disabled={disabled}
        className={`h-10 bg-card pr-10 ${invalid ? 'border-destructive focus-visible:ring-0' : ''}`}
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
};

const primaryBtn =
  'w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 ' +
  'hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

const AcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading, refreshUser, signOut } = useAuth();
  const { setActivePropertyId } = useActiveProperty();

  const [pageState, setPageState] = useState<PageState>(token ? 'validating' : 'invalid');
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [forceLogin, setForceLogin] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token) return;
    apiClient
      .get(`/api/v1/household/invites/validate/?token=${encodeURIComponent(token)}`, skip)
      .then(({ data: res }) => {
        const d = (res?.data ?? res) as InviteDetails;
        setInvite(d);
        if (d?.invited_name) {
          const [f, ...rest] = d.invited_name.trim().split(/\s+/);
          setFirstName(prev => prev || f || '');
          setLastName(prev => prev || rest.join(' '));
        }
        setPageState('ready');
      })
      .catch(() => setPageState('invalid'));
  }, [token]);

  const ownerName = invite?.owner?.name || 'Someone';
  const loginHref = `/login?next=${encodeURIComponent(`/accept-invite?token=${token}`)}`;

  // Shared post-accept flow: refresh the session + homes, make the new shared
  // home active, then land on the dashboard.
  const finish = async (homeId: string | null) => {
    await refreshUser();
    let id = homeId;
    if (!id) {
      try {
        const { data: res } = await apiClient.get('/api/v1/household/shared/');
        const households: { accepted_at?: string; properties?: { id: string }[] }[] = res?.data?.households ?? [];
        const latest = [...households].sort((a, b) =>
          String(b.accepted_at ?? '').localeCompare(String(a.accepted_at ?? '')),
        )[0];
        id = latest?.properties?.[0]?.id ?? null;
      } catch {
        id = null;
      }
    }
    await queryClient.invalidateQueries({
      predicate: q => typeof q.queryKey[0] === 'string' && (q.queryKey[0] as string).startsWith('/api/v1/properties/'),
    });
    if (id) setActivePropertyId(String(id));
    navigate('/dashboard', { replace: true });
  };

  const handleStatusError = (err: ApiError): boolean => {
    const raw = err?.response?.data?.errors?.status;
    const st = Array.isArray(raw) ? raw[0] : raw;
    if (err?.response?.status === 400 && (st === 'accepted' || st === 'expired')) {
      setInvite(prev => (prev ? { ...prev, status: st } : prev));
      return true;
    }
    if (err?.response?.status === 404) {
      setPageState('invalid');
      return true;
    }
    return false;
  };

  const handleAccept = async () => {
    setError('');
    setBusy(true);
    try {
      const { data: res } = await apiClient.post('/api/v1/household/invites/accept/', { token });
      await finish(res?.data?.properties?.[0]?.id ?? null);
    } catch (e) {
      const err = e as ApiError;
      if (!handleStatusError(err)) setError(firstError(err, 'Could not accept the invitation. Try again.'));
      setBusy(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.first_name = 'Enter your first name.';
    if (password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (password !== confirm) errs.confirm = 'Passwords do not match.';
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setBusy(true);
    try {
      await apiClient.post(
        '/api/v1/household/invites/accept-signup/',
        { token, first_name: firstName.trim(), last_name: lastName.trim(), password },
        skip,
      );
      await finish(null);
    } catch (e) {
      const err = e as ApiError;
      setBusy(false);
      if (err?.response?.status === 409) {
        setForceLogin(true);
        return;
      }
      if (handleStatusError(err)) return;
      const errors = err?.response?.data?.errors ?? {};
      const pick = (k: string): string => {
        const v = errors[k];
        return String((Array.isArray(v) ? v[0] : v) || '');
      };
      const fe: Record<string, string> = {};
      if (pick('first_name')) fe.first_name = pick('first_name');
      if (pick('last_name')) fe.last_name = pick('last_name');
      if (pick('password')) fe.password = pick('password');
      setFieldErrors(fe);
      if (!Object.keys(fe).length) setError(firstError(err, 'Something went wrong. Try again.'));
    }
  };

  const handleSwitchAccount = async () => {
    await signOut();
    setError('');
  };

  const shell = (children: React.ReactNode, wide = false) => (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
      <div className={`w-full ${wide ? 'max-w-md' : 'max-w-sm'}`}>
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <img src={Logo} className="h-16 w-auto object-contain" alt="Home+" />
          </Link>
        </div>
        {children}
      </div>
    </div>
  );

  const statusCard = (icon: React.ReactNode, iconBg: string, title: string, body: string, actions: React.ReactNode) =>
    shell(
      <div className="bg-card border rounded-xl shadow-sm p-6 text-center space-y-4">
        <div className={`mx-auto w-12 h-12 rounded-full ${iconBg} flex items-center justify-center`}>{icon}</div>
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{body}</p>
        </div>
        {actions}
      </div>,
    );

  if (pageState === 'validating' || (pageState === 'ready' && authLoading)) {
    return shell(
      <div className="bg-card border rounded-xl shadow-sm p-6 flex flex-col items-center gap-4">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Checking your invitation…</p>
      </div>,
    );
  }

  if (pageState === 'invalid' || !invite) {
    return statusCard(
      <XCircle className="h-6 w-6 text-red-500" />,
      'bg-red-100',
      'Invitation not found',
      'This invitation link is invalid. Ask the person who invited you to send a new one.',
      <Link to={user ? '/dashboard' : '/login'} className={primaryBtn}>
        {user ? 'Go to dashboard' : 'Go to sign in'}
      </Link>,
    );
  }

  if (invite.status === 'expired') {
    return statusCard(
      <Clock className="h-6 w-6 text-amber-600" />,
      'bg-amber-100',
      'Invitation expired',
      `This invitation from ${ownerName} has expired. Ask them to resend it from their Home+ settings.`,
      <Link to={user ? '/dashboard' : '/login'} className={primaryBtn}>
        {user ? 'Go to dashboard' : 'Go to sign in'}
      </Link>,
    );
  }

  if (invite.status === 'accepted') {
    return statusCard(
      <CheckCircle2 className="h-6 w-6 text-green-600" />,
      'bg-green-100',
      'Invitation already accepted',
      `This invitation from ${ownerName} has already been accepted.`,
      <Link to={user ? '/dashboard' : loginHref} className={primaryBtn}>
        {user ? 'Go to dashboard' : 'Sign in'}
      </Link>,
    );
  }

  // ── Pending ────────────────────────────────────────────────────────────────
  const homes = invite.homes ?? [];
  const emailMatches = !!user && user.email.toLowerCase() === (invite.email || '').toLowerCase();

  let action: React.ReactNode;
  if (user && emailMatches) {
    action = (
      <button type="button" onClick={handleAccept} disabled={busy} className={primaryBtn}>
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Accepting…
          </>
        ) : (
          'Accept invitation'
        )}
      </button>
    );
  } else if (user) {
    action = (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          You're signed in as <span className="font-medium text-foreground break-all">{user.email}</span>, but this
          invitation was sent to <span className="font-medium text-foreground break-all">{invite.email}</span>.
        </p>
        <button type="button" onClick={handleSwitchAccount} className={primaryBtn}>
          Log out and continue
        </button>
        <Link to="/dashboard" className="block text-center text-sm text-muted-foreground hover:text-foreground">
          Back to dashboard
        </Link>
      </div>
    );
  } else if (invite.account_exists || forceLogin) {
    action = (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {forceLogin ? 'An account with this email already exists. ' : ''}
          Sign in as <span className="font-medium text-foreground break-all">{invite.email}</span> to accept.
        </p>
        <Link to={loginHref} className={primaryBtn}>
          Log in to accept
        </Link>
      </div>
    );
  } else {
    action = (
      <form onSubmit={handleSignup} className="space-y-4" noValidate>
        <div>
          <p className="text-sm font-medium">Create your account</p>
          <p className="text-xs text-muted-foreground break-all">You'll sign in with {invite.email}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5 min-w-0">
            <Label htmlFor="first-name">First name</Label>
            <Input
              id="first-name"
              value={firstName}
              onChange={e => {
                setFirstName(e.target.value);
                setFieldErrors(p => ({ ...p, first_name: '' }));
              }}
              autoComplete="given-name"
              disabled={busy}
              className={`h-10 bg-card ${fieldErrors.first_name ? 'border-destructive focus-visible:ring-0' : ''}`}
            />
            {fieldErrors.first_name && <p className="text-xs text-destructive">{fieldErrors.first_name}</p>}
          </div>
          <div className="space-y-1.5 min-w-0">
            <Label htmlFor="last-name">Last name</Label>
            <Input
              id="last-name"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              autoComplete="family-name"
              disabled={busy}
              className={`h-10 bg-card ${fieldErrors.last_name ? 'border-destructive focus-visible:ring-0' : ''}`}
            />
            {fieldErrors.last_name && <p className="text-xs text-destructive">{fieldErrors.last_name}</p>}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            value={password}
            onChange={v => {
              setPassword(v);
              setFieldErrors(p => ({ ...p, password: '' }));
            }}
            disabled={busy}
            invalid={!!fieldErrors.password}
          />
          {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <PasswordInput
            id="confirm-password"
            value={confirm}
            onChange={v => {
              setConfirm(v);
              setFieldErrors(p => ({ ...p, confirm: '' }));
            }}
            disabled={busy}
            invalid={!!fieldErrors.confirm}
          />
          {fieldErrors.confirm && <p className="text-xs text-destructive">{fieldErrors.confirm}</p>}
        </div>
        <button type="submit" disabled={busy} className={primaryBtn}>
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Creating account…
            </>
          ) : (
            'Create account and accept'
          )}
        </button>
        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{' '}
          <Link to={loginHref} className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </form>
    );
  }

  return shell(
    <div className="bg-card border rounded-xl shadow-sm p-5 sm:p-6 space-y-5">
      <div className="text-center space-y-1.5">
        <h1 className="text-xl font-semibold break-words">
          {ownerName} invited you to join their{' '}
          {homes.length === 0 && !invite.all_properties ? 'household' : homes.length === 1 ? 'home' : 'homes'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {invite.all_properties
            ? `You'll get access to all of ${ownerName}'s homes on Home+${invite.default_role_label ? ` as a ${invite.default_role_label.toLowerCase()}` : ''}, including any they add later.`
            : homes.length === 0 && invite.share_unassigned
              ? `You'll be able to see and manage ${ownerName}'s items that aren't linked to any home on Home+.`
              : `You'll be able to see and manage ${homes.length === 1 ? 'this home' : 'these homes'} on Home+.`}
        </p>
      </div>

      {(homes.length > 0 || invite.share_unassigned) && (
        <ul className="space-y-2">
          {homes.map((h, i) => (
            <li key={i} className="flex items-start gap-3 rounded-lg border bg-muted/40 px-3 py-2.5 min-w-0">
              <Home className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{h.name || h.address || 'Home'}</p>
                {h.name && h.address && <p className="truncate text-xs text-muted-foreground">{h.address}</p>}
              </div>
              {h.role_label && (
                <span className="shrink-0 rounded-full border bg-background px-2 py-0.5 text-xs text-muted-foreground">
                  as {h.role_label}
                </span>
              )}
            </li>
          ))}
          {invite.share_unassigned && (
            <li className="flex items-start gap-3 rounded-lg border bg-muted/40 px-3 py-2.5 min-w-0">
              <Inbox className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">Items without a home</p>
                <p className="text-xs text-muted-foreground">
                  Documents and tasks that aren't linked to any home
                </p>
              </div>
            </li>
          )}
        </ul>
      )}

      <div className="flex items-start gap-2.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
        <p className="text-xs text-blue-900">
          When a job is posted for a shared home, your name, email and phone number may be shared with the
          tradespeople who quote for it, depending on {ownerName}'s contact settings.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {action}
    </div>,
    true,
  );
};

export default AcceptInvite;
