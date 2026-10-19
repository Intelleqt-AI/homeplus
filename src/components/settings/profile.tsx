import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BadgeCheck, CheckCircle, Home, Loader2, Lock, MapPin, Pencil, Phone, Plus, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { useAuth } from '@/hooks/useAuth';
import usePatch from '@/hooks/usePatch';
import { useActiveProperty } from '@/hooks/useActiveProperty';
import { memberRoleLabel, propertyNickname, usageOf } from '@/lib/household';
import { homeLabels, isPortfolioAccount, usageLabel } from '@/lib/account';
import HowYouUse from './HowYouUse';
import { PROPERTY_TYPES } from './Properties';

type Form = { first_name: string; last_name: string; phone: string };
const EMPTY: Form = { first_name: '', last_name: '', phone: '' };

const TYPE_LABEL: Record<string, string> = Object.fromEntries(PROPERTY_TYPES.map(t => [t.value, t.label]));

const Chip = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap', className)}>
    {children}
  </span>
);

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const { properties, activePropertyId } = useActiveProperty();

  const [initial, setInitial] = useState<Form>(EMPTY);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    const meta = (user.user_metadata || {}) as { first_name?: string; last_name?: string };
    const profile = user._raw?.profile as { phone?: string } | undefined;
    const next = { first_name: meta.first_name || '', last_name: meta.last_name || '', phone: profile?.phone || '' };
    setInitial(next);
    setForm(next);
  }, [user]);

  const phoneVerified = !!(user?._raw?.profile as { phone_verified?: boolean } | undefined)?.phone_verified;
  const emailVerified = user?._raw?.email_verified !== false;
  const fullName = `${form.first_name} ${form.last_name}`.trim() || user?.email?.split('@')[0] || '';
  const initials = (`${initial.first_name.charAt(0)}${initial.last_name.charAt(0)}` || user?.email?.charAt(0) || '?').toUpperCase();
  const memberSince = user?.created_at ? format(new Date(user.created_at), 'MMMM yyyy') : null;
  const dirty = useMemo(
    () => (Object.keys(form) as (keyof Form)[]).some(k => form[k].trim() !== initial[k].trim()),
    [form, initial],
  );

  const updateProfile = usePatch({
    onSuccess: async () => {
      await refreshUser();
      setSaved(true);
      toast.success('Profile updated.');
      setTimeout(() => setSaved(false), 2500);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save profile.';
      toast.error(msg);
    },
  });

  const set = (field: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSaved(false);
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirty) return;
    // Only the person's own details: each home keeps its address in Settings → Properties.
    updateProfile.mutate({
      url: '/api/v1/auth/me/',
      data: {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        profile: { phone: form.phone.trim() },
      },
    });
  };

  const ownHomes = properties.filter(p => p.access !== 'member');

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card data-section="profile-header">
        <CardContent className="flex items-center gap-4 p-5 sm:p-6">
          <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-full bg-accent/20 flex items-center justify-center text-lg sm:text-xl font-semibold text-foreground">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg sm:text-xl font-semibold truncate">{fullName}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground min-w-0">
              <span className="truncate">{user?.email}</span>
              {emailVerified && (
                <Chip className="gap-1 border-green-300 text-green-700 bg-green-50 dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/30">
                  <BadgeCheck className="w-3 h-3" /> Verified
                </Chip>
              )}
            </div>
            {memberSince && <p className="mt-1 text-xs text-muted-foreground">Member since {memberSince}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Personal details */}
      <Card data-section="personal">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <User className="w-5 h-5 shrink-0 text-accent" /> Personal details
          </CardTitle>
          <p className="text-sm text-muted-foreground">How you appear to your family and the tradespeople you hire.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="first_name">First name</Label>
                <Input id="first_name" value={form.first_name} onChange={set('first_name')} placeholder="John" autoComplete="given-name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="last_name">Last name</Label>
                <Input id="last_name" value={form.last_name} onChange={set('last_name')} placeholder="Smith" autoComplete="family-name" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="phone">Phone number</Label>
                  {phoneVerified && (
                    <Chip className="gap-1 border-green-300 text-green-700 bg-green-50 dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/30">
                      <BadgeCheck className="w-3 h-3" /> Verified
                    </Chip>
                  )}
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={set('phone')}
                    placeholder="+44 7700 900 123"
                    autoComplete="tel"
                    className="pl-9"
                  />
                </div>
                {!form.phone.trim() && (
                  <p className="text-xs text-muted-foreground">Add a number so tradespeople can call you about your jobs.</p>
                )}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="email">Email address</Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    readOnly
                    disabled
                    className="pl-9 bg-muted text-muted-foreground cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  To change your email,{' '}
                  <a href="mailto:support@homeplus.co.uk" className="underline hover:text-foreground">contact support</a>.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 border-t pt-4">
              {dirty && (
                <Button type="button" variant="outline" onClick={() => setForm(initial)} disabled={updateProfile.isPending}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={!dirty || updateProfile.isPending} className="min-w-[140px]">
                {updateProfile.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</>
                ) : saved && !dirty ? (
                  <><CheckCircle className="w-4 h-4 mr-2" /> Saved</>
                ) : (
                  'Save changes'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* How you use Home+ */}
      <HowYouUse />

      {/* Your homes */}
      <Card data-section="homes">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Home className="w-5 h-5 shrink-0 text-accent" /> {homeLabels(undefined, isPortfolioAccount(user?.account_type)).settingsHomes}
          </CardTitle>
          <p className="text-sm text-muted-foreground">Each home keeps its own address and details.</p>
        </CardHeader>
        <CardContent>
          {properties.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-8 text-center">
              <p className="text-sm text-muted-foreground">You haven't added a home yet.</p>
              <Button asChild size="sm">
                <Link to="/dashboard/settings?tab=properties"><Plus className="w-4 h-4 mr-1.5" /> Add a home</Link>
              </Button>
            </div>
          ) : (
            <>
              <ul className="divide-y">
                {properties.map(p => {
                  const shared = p.access === 'member';
                  const role = shared ? memberRoleLabel(p.member_role) : usageLabel(usageOf(p));
                  return (
                    <li key={p.id} data-home={propertyNickname(p)} className="py-3.5 first:pt-0 last:pb-0 flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <Home className="h-[18px] w-[18px]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-sm font-medium truncate max-w-full">{propertyNickname(p) || 'Home'}</p>
                          {p.id === activePropertyId && (
                            <Chip className="border-accent/40 bg-accent/15 text-foreground">Selected</Chip>
                          )}
                        </div>
                        {(p.address || p.postcode) && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 min-w-0 mt-0.5">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{[p.address, p.postcode].filter(Boolean).join(' · ')}</span>
                          </p>
                        )}
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {p.property_type && (
                            <Chip className="border-border bg-muted/60 text-muted-foreground">{TYPE_LABEL[p.property_type] ?? p.property_type}</Chip>
                          )}
                          {role && <Chip className="border-border bg-muted/60 text-muted-foreground">{role}</Chip>}
                          {shared && (
                            <Chip className="border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30">
                              Shared by {p.owner_name || 'owner'}
                            </Chip>
                          )}
                        </div>
                      </div>
                      <Button asChild variant="outline" size="sm" className="shrink-0">
                        <Link to={`/dashboard/settings?tab=properties&edit=${p.id}`} aria-label={`Edit ${propertyNickname(p) || 'home'}`}>
                          <Pencil className="w-3.5 h-3.5 sm:mr-1.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </Link>
                      </Button>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  {ownHomes.length} home{ownHomes.length === 1 ? '' : 's'} of your own
                  {properties.length > ownHomes.length ? ` · ${properties.length - ownHomes.length} shared with you` : ''}
                </p>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/dashboard/settings?tab=properties">Manage homes</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link to="/dashboard/settings?tab=properties"><Plus className="w-4 h-4 mr-1.5" /> Add a home</Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
