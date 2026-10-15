import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  Users,
  UserPlus,
  Mail,
  Pencil,
  RotateCw,
  Trash2,
  Home,
  LogOut,
  Phone,
  AlertCircle,
  Link2,
  Copy,
} from 'lucide-react';
import useFetch from '@/hooks/useFetch';
import { usePost } from '@/hooks/usePost';
import usePatch from '@/hooks/usePatch';
import useDelete from '@/hooks/useDelete';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import {
  briefName,
  homeLabel,
  MEMBER_ROLE_OPTIONS,
  memberRoleLabel,
  type ApiError,
  type HouseholdHome,
  type MemberRole,
  type UserBrief,
} from '@/lib/household';

// ─── Types (see /api/v1/household/) ───────────────────────────────────────────

type MemberStatus = 'pending' | 'accepted' | 'expired';

interface Member {
  id: string;
  email: string;
  invited_name?: string;
  name?: string;
  status: MemberStatus;
  member: UserBrief | null;
  all_properties: boolean;
  /** Their role on every home when `all_properties`. */
  default_role?: MemberRole;
  /** The shared homes, each with their role. */
  properties: HouseholdHome[];
  /** Account-level jobs, documents and tasks not linked to any home. */
  share_unassigned?: boolean;
  invited_at?: string;
  accepted_at?: string | null;
  expires_at?: string | null;
  /** Pending invites only (owner view). */
  invite_url?: string | null;
  /** Set on invite / resend responses. */
  email_sent?: boolean;
}

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Link copied.');
  } catch {
    toast.error('Could not copy — select the link and copy it manually.');
  }
};

interface MembersPayload {
  members: Member[];
  homes: HouseholdHome[];
  max_pending?: number;
}

type ContactMode = 'owner' | 'members' | 'poster';

interface ContactSettings {
  contact_mode: ContactMode;
  contact_user_ids: string[];
  options: { id: string; name: string; email: string; relation: 'owner' | 'family' }[];
}

interface SharedHousehold {
  id: string;
  owner: UserBrief | null;
  all_properties: boolean;
  default_role?: MemberRole;
  properties: HouseholdHome[];
  share_unassigned?: boolean;
  accepted_at?: string;
}

type Envelope<T> = { data?: T; message?: string; errors?: Record<string, unknown> };

const BASE = '/api/v1/household';
const MEMBERS_URL = `${BASE}/members/`;
const SETTINGS_URL = `${BASE}/settings/`;
const SHARED_URL = `${BASE}/shared/`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const errMsg = (v: unknown): string => {
  if (Array.isArray(v)) return errMsg(v[0]);
  return typeof v === 'string' ? v : '';
};

const apiErrors = (err: unknown): Record<string, unknown> => (err as ApiError)?.response?.data?.errors ?? {};
const apiMessage = (err: unknown, fallback: string): string => {
  const errors = apiErrors(err);
  const first = Object.values(errors).map(errMsg).find(Boolean);
  return first || (err as ApiError)?.response?.data?.message || fallback;
};

const STATUS_BADGE: Record<MemberStatus, { label: string; className: string }> = {
  accepted: { label: 'Active', className: 'border-green-300 text-green-700 bg-green-50' },
  pending: { label: 'Pending', className: 'border-amber-300 text-amber-700 bg-amber-50' },
  expired: { label: 'Expired', className: 'border-gray-300 text-gray-600 bg-gray-50' },
};

const memberDisplayName = (m: Member) => briefName(m.member) || m.name || m.invited_name || m.email;

const UNASSIGNED_LABEL = 'Items without a home';

const withUnassigned = (homesText: string | null, shareUnassigned?: boolean) =>
  !shareUnassigned ? homesText ?? 'No homes' : homesText ? `${homesText} + items without a home` : UNASSIGNED_LABEL;

/** "Rental Flat · Tenant, Demo · Family member" / "All homes · Tenant". */
const accessSummary = (allProps: boolean, props: HouseholdHome[], shareUnassigned?: boolean, defaultRole?: MemberRole) =>
  withUnassigned(
    allProps
      ? `All homes · ${memberRoleLabel(defaultRole)}`
      : props.length
        ? props.map(p => `${homeLabel(p)} · ${memberRoleLabel(p.role)}`).join(', ')
        : null,
    shareUnassigned,
  );

/** The roles to send for the ticked homes (unset ones are "family"). */
const rolesFor = (ids: string[], roles: Record<string, MemberRole>) =>
  Object.fromEntries(ids.map(id => [id, roles[id] ?? 'family']));

const invalidateProperties = (qc: ReturnType<typeof useQueryClient>) =>
  qc.invalidateQueries({
    predicate: q => typeof q.queryKey[0] === 'string' && (q.queryKey[0] as string).startsWith('/api/v1/properties/'),
  });

// ─── Home access picker (invite + edit) ───────────────────────────────────────

/** Their role on one home, shown next to the home once it is ticked. */
const RoleSelect = ({
  value,
  onChange,
  disabled,
  label,
}: {
  value: MemberRole;
  onChange: (role: MemberRole) => void;
  disabled?: boolean;
  label: string;
}) => (
  <Select value={value} onValueChange={v => onChange(v as MemberRole)} disabled={disabled}>
    <SelectTrigger aria-label={label} className="h-8 w-[136px] sm:w-[150px] shrink-0 text-xs">
      {/* Only the name in the box; the list also explains each role. */}
      <SelectValue>{memberRoleLabel(value)}</SelectValue>
    </SelectTrigger>
    <SelectContent>
      {MEMBER_ROLE_OPTIONS.map(o => (
        <SelectItem key={o.value} value={o.value} className="text-sm">
          <span className="block">{o.label}</span>
          <span className="block text-xs text-muted-foreground">{o.hint}</span>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

const HomeAccessPicker = ({
  homes,
  allProperties,
  propertyIds,
  shareUnassigned,
  roles,
  defaultRole,
  onChange,
  onShareUnassignedChange,
  onRolesChange,
  onDefaultRoleChange,
  error,
  disabled,
}: {
  homes: HouseholdHome[];
  allProperties: boolean;
  propertyIds: string[];
  shareUnassigned: boolean;
  /** Their role per ticked home. */
  roles: Record<string, MemberRole>;
  /** Their role on every home when "All homes" is ticked. */
  defaultRole: MemberRole;
  onChange: (all: boolean, ids: string[]) => void;
  onShareUnassignedChange: (v: boolean) => void;
  onRolesChange: (roles: Record<string, MemberRole>) => void;
  onDefaultRoleChange: (role: MemberRole) => void;
  error?: string;
  disabled?: boolean;
}) => {
  const toggle = (id: string) =>
    onChange(false, propertyIds.includes(id) ? propertyIds.filter(x => x !== id) : [...propertyIds, id]);

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-2">
        <Label>Homes they can access</Label>
        <span className="text-xs text-muted-foreground">Their role</span>
      </div>
      <div className={cn('rounded-lg border divide-y', error && 'border-destructive')}>
        <div className="flex items-center gap-3 p-3 hover:bg-muted/40">
          <label className="flex items-start gap-3 min-w-0 flex-1 cursor-pointer">
            <Checkbox
              className="mt-0.5 rounded-[4px]"
              checked={allProperties}
              disabled={disabled}
              onCheckedChange={v => onChange(!!v, v ? [] : propertyIds)}
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">All homes</span>
              <span className="block text-xs text-muted-foreground">Including any homes you add in the future</span>
            </span>
          </label>
          {allProperties && (
            <RoleSelect value={defaultRole} onChange={onDefaultRoleChange} disabled={disabled} label="Role in all homes" />
          )}
        </div>
        {homes.map(h => {
          const ticked = !allProperties && propertyIds.includes(h.id);
          return (
            <div
              key={h.id}
              className={cn('flex items-center gap-3 p-3 hover:bg-muted/40', allProperties && 'opacity-60')}
            >
              <label className={cn('flex items-start gap-3 min-w-0 flex-1', allProperties ? 'cursor-default' : 'cursor-pointer')}>
                <Checkbox
                  className="mt-0.5 rounded-[4px]"
                  checked={allProperties || propertyIds.includes(h.id)}
                  disabled={disabled || allProperties}
                  onCheckedChange={() => toggle(h.id)}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium truncate">{homeLabel(h)}</span>
                  {h.name && h.address && <span className="block text-xs text-muted-foreground truncate">{h.address}</span>}
                </span>
              </label>
              {ticked && (
                <RoleSelect
                  value={roles[h.id] ?? 'family'}
                  onChange={role => onRolesChange({ ...roles, [h.id]: role })}
                  disabled={disabled}
                  label={`Role in ${homeLabel(h)}`}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        A tenant sees what their landlord must do; a landlord also gets the Rental register; a family member sees the
        home as you do.
      </p>
      <p className="pt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Account-level</p>
      <div className={cn('rounded-lg border', error && 'border-destructive')}>
        <label className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/40">
          <Checkbox
            className="mt-0.5 rounded-[4px]"
            checked={shareUnassigned}
            disabled={disabled}
            onCheckedChange={v => onShareUnassignedChange(!!v)}
          />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">{UNASSIGNED_LABEL}</span>
            <span className="block text-xs text-muted-foreground">
              Documents and tasks that aren't linked to any home, including existing ones.
            </span>
          </span>
        </label>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};

// ─── Contact option (card-style radio) ────────────────────────────────────────

const ContactOption = ({
  selected,
  onSelect,
  label,
  description,
  disabled,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  description: string;
  disabled?: boolean;
  children?: React.ReactNode;
}) => (
  <div
    className={cn(
      'rounded-lg border transition-colors',
      selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40',
      disabled && 'opacity-50',
    )}
  >
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className="w-full text-left p-3 flex items-start gap-3 disabled:cursor-not-allowed"
    >
      <span
        className={cn(
          'mt-1 h-3.5 w-3.5 rounded-full border-2 shrink-0 transition-colors',
          selected ? 'border-primary bg-primary ring-2 ring-primary/20' : 'border-gray-300',
        )}
      />
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground mt-0.5">{description}</span>
      </span>
    </button>
    {selected && children && <div className="px-3 pb-3 pl-9">{children}</div>}
  </div>
);

// ─── Owner: invite + members ──────────────────────────────────────────────────

const OwnerSection = ({ payload }: { payload: MembersPayload }) => {
  const qc = useQueryClient();
  const homes = payload.homes ?? [];
  const members = payload.members ?? [];

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [allProps, setAllProps] = useState(false);
  const [propIds, setPropIds] = useState<string[]>([]);
  const [shareUnassigned, setShareUnassigned] = useState(false);
  const [roles, setRoles] = useState<Record<string, MemberRole>>({});
  const [defaultRole, setDefaultRole] = useState<MemberRole>('family');
  const [errors, setErrors] = useState<{ email?: string; property_ids?: string; general?: string }>({});

  const [editing, setEditing] = useState<Member | null>(null);
  const [editAll, setEditAll] = useState(false);
  const [editIds, setEditIds] = useState<string[]>([]);
  const [editUnassigned, setEditUnassigned] = useState(false);
  const [editRoles, setEditRoles] = useState<Record<string, MemberRole>>({});
  const [editDefaultRole, setEditDefaultRole] = useState<MemberRole>('family');
  const [editError, setEditError] = useState('');
  const [removing, setRemoving] = useState<Member | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  // Shown when the invite email couldn't be sent, so the owner can share the link by hand.
  const [shareLink, setShareLink] = useState<{ email: string; url: string } | null>(null);

  const afterSend = (res: unknown, sentMessage: string) => {
    const m = (res as { data?: Member } | undefined)?.data;
    if (m && m.email_sent === false && m.invite_url) {
      toast.warning("Couldn't email the invite — copy the link and share it.");
      setShareLink({ email: m.email, url: m.invite_url });
    } else {
      toast.success(sentMessage);
    }
  };

  const refresh = () => {
    qc.invalidateQueries({ queryKey: [MEMBERS_URL] });
    qc.invalidateQueries({ queryKey: [SETTINGS_URL] });
    invalidateProperties(qc);
  };

  const inviteMut = usePost();
  const patchMut = usePatch();
  const deleteMut = useDelete();
  const resendMut = usePost();

  // Single-home owners: pre-tick the only home so the form is one step.
  useEffect(() => {
    if (homes.length === 1 && propIds.length === 0 && !allProps) setPropIds([homes[0].id]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homes.length]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) errs.email = 'Enter a valid email address.';
    if (!allProps && propIds.length === 0 && !shareUnassigned)
      errs.property_ids = 'Choose at least one home, or items without a home.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      const res = await inviteMut.mutateAsync({
        url: MEMBERS_URL,
        data: {
          email: email.trim(),
          name: name.trim(),
          all_properties: allProps,
          property_ids: allProps ? [] : propIds,
          share_unassigned: shareUnassigned,
          default_role: allProps ? defaultRole : 'family',
          roles: allProps ? {} : rolesFor(propIds, roles),
        },
      });
      afterSend(res, `Invitation sent to ${email.trim()}.`);
      setEmail('');
      setName('');
      setAllProps(false);
      setPropIds(homes.length === 1 ? [homes[0].id] : []);
      setShareUnassigned(false);
      setRoles({});
      setDefaultRole('family');
      refresh();
    } catch (err) {
      const fe = apiErrors(err);
      const next = { email: errMsg(fe.email), property_ids: errMsg(fe.property_ids) };
      if (!next.email && !next.property_ids) setErrors({ general: apiMessage(err, 'Could not send the invitation.') });
      else setErrors(next);
    }
  };

  const openEdit = (m: Member) => {
    setEditing(m);
    setEditAll(m.all_properties);
    setEditIds((m.properties ?? []).map(p => p.id));
    setEditUnassigned(!!m.share_unassigned);
    setEditRoles(Object.fromEntries((m.properties ?? []).map(p => [p.id, p.role ?? 'family'])));
    setEditDefaultRole(m.default_role ?? 'family');
    setEditError('');
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    if (!editAll && editIds.length === 0 && !editUnassigned) {
      setEditError('Choose at least one home or items without a home, or remove this person instead.');
      return;
    }
    try {
      await patchMut.mutateAsync({
        url: `${MEMBERS_URL}${editing.id}/`,
        data: {
          all_properties: editAll,
          property_ids: editAll ? [] : editIds,
          share_unassigned: editUnassigned,
          default_role: editAll ? editDefaultRole : 'family',
          roles: editAll ? {} : rolesFor(editIds, editRoles),
        },
      });
      toast.success('Access updated.');
      setEditing(null);
      refresh();
    } catch (err) {
      setEditError(apiMessage(err, 'Could not update access.'));
    }
  };

  const handleResend = async (m: Member) => {
    setResendingId(m.id);
    try {
      const res = await resendMut.mutateAsync({ url: `${MEMBERS_URL}${m.id}/resend/` });
      afterSend(res, `Invitation resent to ${m.email}.`);
      refresh();
    } catch (err) {
      toast.error(apiMessage(err, 'Could not resend the invitation.'));
    } finally {
      setResendingId(null);
    }
  };

  const handleRemove = async () => {
    if (!removing) return;
    try {
      await deleteMut.mutateAsync({ url: `${MEMBERS_URL}${removing.id}/` });
      toast.success(removing.status === 'accepted' ? 'Member removed.' : 'Invitation cancelled.');
      setRemoving(null);
      refresh();
    } catch (err) {
      toast.error(apiMessage(err, 'Could not remove this person.'));
    }
  };

  return (
    <>
      {/* Invite */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <UserPlus className="w-5 h-5 shrink-0 text-accent" /> Invite a family member
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            They'll get an email link to join. Members can see and manage the homes you share: jobs, documents,
            calendar and messages with tradespeople. Choose their role on each home.
          </p>
        </CardHeader>
        <CardContent>
          {homes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add a home in the Properties tab before inviting anyone.</p>
          ) : (
            <form onSubmit={handleInvite} className="space-y-4" noValidate>
              {errors.general && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <p className="text-sm text-destructive">{errors.general}</p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 min-w-0">
                  <Label htmlFor="family-email">Email</Label>
                  <Input
                    id="family-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      setErrors(p => ({ ...p, email: undefined, general: undefined }));
                    }}
                    disabled={inviteMut.isPending}
                    className={cn(errors.email && 'border-destructive focus-visible:ring-0')}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-1.5 min-w-0">
                  <Label htmlFor="family-name">
                    Name <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="family-name"
                    placeholder="e.g. Sam"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    disabled={inviteMut.isPending}
                  />
                </div>
              </div>
              <HomeAccessPicker
                homes={homes}
                allProperties={allProps}
                propertyIds={propIds}
                shareUnassigned={shareUnassigned}
                roles={roles}
                defaultRole={defaultRole}
                onRolesChange={setRoles}
                onDefaultRoleChange={setDefaultRole}
                disabled={inviteMut.isPending}
                error={errors.property_ids}
                onChange={(all, ids) => {
                  setAllProps(all);
                  setPropIds(ids);
                  setErrors(p => ({ ...p, property_ids: undefined }));
                }}
                onShareUnassignedChange={v => {
                  setShareUnassigned(v);
                  setErrors(p => ({ ...p, property_ids: undefined }));
                }}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={inviteMut.isPending} className="w-full sm:w-auto">
                  {inviteMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Mail className="w-4 h-4 mr-1.5" />}
                  Send invitation
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Users className="w-5 h-5 shrink-0 text-accent" /> Family members
          </CardTitle>
          <p className="text-sm text-muted-foreground">People who can access your homes.</p>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">You haven't invited anyone yet.</p>
          ) : (
            <ul className="divide-y">
              {members.map(m => {
                const display = memberDisplayName(m);
                const badge = STATUS_BADGE[m.status] ?? STATUS_BADGE.pending;
                return (
                  <li key={m.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-muted flex items-center justify-center text-sm font-semibold uppercase text-foreground">
                        {display.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium truncate max-w-full">{display}</p>
                          <Badge variant="outline" className={cn('text-xs', badge.className)}>
                            {badge.label}
                          </Badge>
                        </div>
                        {display !== m.email && <p className="text-xs text-muted-foreground truncate">{m.email}</p>}
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-start gap-1 min-w-0">
                          <Home className="w-3 h-3 mt-0.5 shrink-0" />
                          <span className="break-words min-w-0">{accessSummary(m.all_properties, m.properties ?? [], m.share_unassigned, m.default_role)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end sm:shrink-0 pl-[52px] sm:pl-0">
                      <Button variant="outline" size="sm" onClick={() => openEdit(m)}>
                        <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit access
                      </Button>
                      {m.status === 'pending' && m.invite_url && (
                        <Button variant="outline" size="sm" onClick={() => copyText(m.invite_url!)}>
                          <Link2 className="w-3.5 h-3.5 mr-1.5" />
                          Copy link
                        </Button>
                      )}
                      {(m.status === 'pending' || m.status === 'expired') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResend(m)}
                          disabled={resendingId === m.id}
                        >
                          {resendingId === m.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                          ) : (
                            <RotateCw className="w-3.5 h-3.5 mr-1.5" />
                          )}
                          Resend
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                        onClick={() => setRemoving(m)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Remove
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <ContactCard hasActiveMembers={members.some(m => m.status === 'accepted')} />

      {/* Edit access */}
      <Dialog open={!!shareLink} onOpenChange={open => !open && setShareLink(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share the invite link</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            We couldn't email <span className="font-medium text-foreground [overflow-wrap:anywhere]">{shareLink?.email}</span>.
            Send them this link yourself (e.g. WhatsApp or SMS). It expires in 7 days.
          </p>
          <div className="flex items-center gap-2">
            <Input readOnly value={shareLink?.url ?? ''} onFocus={e => e.currentTarget.select()} className="min-w-0 text-xs" />
            <Button size="sm" className="shrink-0" onClick={() => shareLink && copyText(shareLink.url)}>
              <Copy className="w-3.5 h-3.5 mr-1.5" />
              Copy
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareLink(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={open => !open && setEditing(null)}>
        <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="leading-snug [overflow-wrap:anywhere] pr-6">Edit access for {editing ? memberDisplayName(editing) : ''}</DialogTitle>
          </DialogHeader>
          <HomeAccessPicker
            homes={homes}
            allProperties={editAll}
            propertyIds={editIds}
            shareUnassigned={editUnassigned}
            roles={editRoles}
            defaultRole={editDefaultRole}
            onRolesChange={setEditRoles}
            onDefaultRoleChange={setEditDefaultRole}
            disabled={patchMut.isPending}
            error={editError}
            onChange={(all, ids) => {
              setEditAll(all);
              setEditIds(ids);
              setEditError('');
            }}
            onShareUnassignedChange={v => {
              setEditUnassigned(v);
              setEditError('');
            }}
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditing(null)} disabled={patchMut.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={patchMut.isPending} className="min-w-[80px]">
              {patchMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove */}
      <AlertDialog open={!!removing} onOpenChange={open => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {removing?.status === 'accepted' ? 'Remove family member?' : 'Cancel invitation?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {removing?.status === 'accepted'
                ? `${removing ? memberDisplayName(removing) : 'This person'} will lose access to your homes straight away. Jobs, documents and events they added stay on your homes.`
                : `The invitation link sent to ${removing?.email ?? 'this email'} will stop working.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-black hover:bg-gray-200" disabled={deleteMut.isPending}>
              Keep
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={e => {
                e.preventDefault();
                handleRemove();
              }}
              disabled={deleteMut.isPending}
              className="bg-destructive border-none text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// ─── Owner: who do tradespeople contact? ──────────────────────────────────────

const ContactCard = ({ hasActiveMembers }: { hasActiveMembers: boolean }) => {
  const qc = useQueryClient();
  const { data, isLoading, isError } = useFetch<Envelope<ContactSettings>>(SETTINGS_URL);
  const settings = data?.data;
  const saveMut = usePatch();

  const [mode, setMode] = useState<ContactMode>('owner');
  const [ids, setIds] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!settings) return;
    setMode(settings.contact_mode ?? 'owner');
    setIds((settings.contact_user_ids ?? []).map(String));
  }, [settings]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  if (isError || !settings) return null;

  const options = settings.options ?? [];
  const dirty =
    mode !== settings.contact_mode ||
    (mode === 'members' &&
      [...ids].sort().join(',') !== [...(settings.contact_user_ids ?? []).map(String)].sort().join(','));

  const toggleId = (id: string) => {
    setError('');
    setIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const handleSave = async () => {
    if (mode === 'members' && ids.length === 0) {
      setError('Choose at least one person.');
      return;
    }
    try {
      await saveMut.mutateAsync({
        url: SETTINGS_URL,
        data: { contact_mode: mode, contact_user_ids: mode === 'members' ? ids : [] },
      });
      toast.success('Contact settings saved.');
      qc.invalidateQueries({ queryKey: [SETTINGS_URL] });
    } catch (err) {
      setError(apiMessage(err, 'Could not save contact settings.'));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Phone className="w-5 h-5 shrink-0 text-accent" /> Who do tradespeople contact?
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          When a tradesperson unlocks one of your jobs, they get the name, email and phone number of every person
          selected here.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div role="radiogroup" className="space-y-2">
          <ContactOption
            selected={mode === 'owner'}
            onSelect={() => {
              setMode('owner');
              setError('');
            }}
            label="Just me (default)"
            description="Tradespeople always contact you, the home owner."
          />
          {(hasActiveMembers || settings.contact_mode === 'members') && (
            <ContactOption
              selected={mode === 'members'}
              onSelect={() => {
                setMode('members');
                setError('');
              }}
              label="Specific people"
              description="Choose one or more people. Each one's details are shared."
            >
              <div className="space-y-2">
                {options.map(o => (
                  <label key={o.id} className="flex items-start gap-3 cursor-pointer">
                    <Checkbox
                      className="mt-0.5 rounded-[4px]"
                      checked={ids.includes(String(o.id))}
                      onCheckedChange={() => toggleId(String(o.id))}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium truncate">
                        {o.name || o.email}
                        {o.relation === 'owner' && <span className="text-muted-foreground font-normal"> (you)</span>}
                      </span>
                      {o.name && <span className="block text-xs text-muted-foreground truncate">{o.email}</span>}
                    </span>
                  </label>
                ))}
              </div>
            </ContactOption>
          )}
          <ContactOption
            selected={mode === 'poster'}
            onSelect={() => {
              setMode('poster');
              setError('');
            }}
            label="Whoever posted the job"
            description="The person who posted each job is the contact for it."
          />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={!dirty || saveMut.isPending} className="w-full sm:w-auto">
            {saveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Member: homes shared with me ─────────────────────────────────────────────

const SharedWithMe = ({ households }: { households: SharedHousehold[] }) => {
  const qc = useQueryClient();
  const leaveMut = usePost();
  const [leaving, setLeaving] = useState<SharedHousehold | null>(null);

  const handleLeave = async () => {
    if (!leaving) return;
    try {
      await leaveMut.mutateAsync({ url: `${SHARED_URL}${leaving.id}/leave/` });
      toast.success('You left the household.');
      setLeaving(null);
      qc.invalidateQueries({ queryKey: [SHARED_URL] });
      invalidateProperties(qc);
    } catch (err) {
      toast.error(apiMessage(err, 'Could not leave the household.'));
    }
  };

  const ownerOf = (h: SharedHousehold | null) => briefName(h?.owner) || 'the owner';

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Home className="w-5 h-5 shrink-0 text-accent" /> Homes shared with you
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Your name, email and phone may be shared with tradespeople for jobs on these homes.
          </p>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {households.map(h => (
              <li key={h.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-muted flex items-center justify-center text-sm font-semibold uppercase">
                    {ownerOf(h).charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">Shared by {ownerOf(h)}</p>
                    {h.owner?.email && <p className="text-xs text-muted-foreground truncate">{h.owner.email}</p>}
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-start gap-1 min-w-0">
                      <Home className="w-3 h-3 mt-0.5 shrink-0" />
                      <span className="break-words min-w-0">
                        {h.all_properties
                          ? withUnassigned(
                              `All homes as ${memberRoleLabel(h.default_role)} (${(h.properties ?? []).map(homeLabel).join(', ') || 'none yet'})`,
                              h.share_unassigned,
                            )
                          : accessSummary(false, h.properties ?? [], h.share_unassigned)}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="pl-[52px] sm:pl-0 sm:shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                    onClick={() => setLeaving(h)}
                  >
                    <LogOut className="w-3.5 h-3.5 mr-1.5" /> Leave
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <AlertDialog open={!!leaving} onOpenChange={open => !open && setLeaving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave {ownerOf(leaving)}'s household?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll lose access to their homes. Anything you added stays with them. You'd need a new invitation to
              rejoin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-black hover:bg-gray-200" disabled={leaveMut.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={e => {
                e.preventDefault();
                handleLeave();
              }}
              disabled={leaveMut.isPending}
              className="bg-destructive border-none text-destructive-foreground hover:bg-destructive/90"
            >
              {leaveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// ─── Tab ──────────────────────────────────────────────────────────────────────

const Family = () => {
  const members = useFetch<Envelope<MembersPayload>>(MEMBERS_URL);
  const shared = useFetch<Envelope<{ households: SharedHousehold[] }>>(SHARED_URL);

  if (members.isLoading || shared.isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const ownerPayload = members.data?.data;
  const households = shared.data?.data?.households ?? [];
  // A pure member (no homes of their own, nobody invited) just sees what's shared with them.
  const showOwner =
    !!ownerPayload &&
    ((ownerPayload.homes ?? []).length > 0 || (ownerPayload.members ?? []).length > 0 || households.length === 0);

  if (!ownerPayload && households.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <p className="text-sm text-muted-foreground">Failed to load family settings.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              members.refetch();
              shared.refetch();
            }}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {households.length > 0 && <SharedWithMe households={households} />}
      {showOwner && ownerPayload && <OwnerSection payload={ownerPayload} />}
    </div>
  );
};

export default Family;
