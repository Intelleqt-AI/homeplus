// Shared types/helpers for the "family members" (household) feature.

import { USAGE_FOR_ROLE, type Usage } from '@/lib/account';

export type UserBrief = {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
};

/** What a member is to a shared home (set by the owner per home). */
export type MemberRole = 'family' | 'homeowner' | 'landlord' | 'tenant';

export const MEMBER_ROLE_OPTIONS: { value: MemberRole; label: string; hint: string }[] = [
  { value: 'family', label: 'Family member', hint: 'Sees the home as you do' },
  { value: 'homeowner', label: 'Homeowner', hint: 'Co-owner of the home' },
  { value: 'landlord', label: 'Landlord', hint: 'Co-landlord or agent: gets the Rental register' },
  { value: 'tenant', label: 'Tenant', hint: "Lives there: sees what the landlord must do" },
];

export const memberRoleLabel = (role?: string | null): string =>
  MEMBER_ROLE_OPTIONS.find(o => o.value === role)?.label ?? 'Family member';

/** The caller's role on a home: a member's own role (tenant, landlord…), else the home's. */
export const myRole = (p?: { role?: string; my_role?: string } | null): string | undefined => p?.my_role ?? p?.role;

type UsageSource = { usage?: string; role?: string; my_role?: string; access?: 'owner' | 'member' } | null | undefined;

/** What the home is to its owner (own_home / let / rented_home). Older API rows only have `role`. */
export const usageOf = (p?: UsageSource): Usage =>
  (p?.usage as Usage | undefined) ?? USAGE_FOR_ROLE[p?.role ?? ''] ?? 'own_home';

/** What it is to the caller: for a home shared with them, from the role the owner gave them
 *  (a tenant member of a landlord's home sees a tenant's view), else the owner's `usage`. */
export const myUsage = (p?: UsageSource): Usage =>
  p?.access === 'member' ? USAGE_FOR_ROLE[myRole(p) ?? ''] ?? 'own_home' : usageOf(p);

/** What the app calls a property: its nickname/name, else the first line of its address. */
export const propertyNickname = (
  p?: { nickname?: string; name?: string; address?: string; postcode?: string } | null,
): string => {
  if (!p) return '';
  const named = (p.nickname || p.name || '').trim();
  if (named) return named;
  const parts = (p.address ?? '').split(',').map(s => s.trim()).filter(Boolean);
  const first = parts[0] ?? '';
  // "Flat 2" on its own would look the same across a landlord's flats: add the next part.
  const unit = /^(?:(?:flat|apartment|apt\.?|unit|room|studio|suite|floor|maisonette)\b.*|\d+[a-z]?)$/i.test(first);
  return (unit && parts[1] ? `${first}, ${parts[1]}` : first) || p.postcode || 'Home';
};

export type HouseholdHome = {
  id: string;
  name?: string;
  address?: string;
  postcode?: string;
  /** The member's role on this home (member / invite payloads). */
  role?: MemberRole;
  role_label?: string;
};

export const briefName = (u?: Partial<UserBrief> | null): string => {
  if (!u) return '';
  const full = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim();
  return u.name || full || u.email || '';
};

/**
 * Attribution label for a row on a shared home.
 * - undefined: backend didn't send the field (older API) -> '' (hide)
 * - null: the creator left / deleted their account -> 'Former member'
 * - me -> 'You'
 */
export const attributionLabel = (
  createdBy: UserBrief | null | undefined,
  myId: string | null | undefined,
): string => {
  if (createdBy === undefined) return '';
  if (createdBy === null) return 'Former member';
  if (myId && String(createdBy.id) === String(myId)) return 'You';
  return briefName(createdBy) || 'Former member';
};

export const homeLabel = (h: HouseholdHome): string => propertyNickname(h);

type GroupableHome = { access?: string; owner_id?: string | null; owner_name?: string | null };

/**
 * Split homes into "Your homes" + one "Shared by <owner>" group per owner.
 * When nothing is shared with the user, returns a single group with an empty
 * heading so existing single-list UIs render exactly as before.
 */
export const groupHomes = <T extends GroupableHome>(homes: T[]): { key: string; heading: string; items: T[] }[] => {
  const own = homes.filter(h => h.access !== 'member');
  const shared = homes.filter(h => h.access === 'member');
  if (shared.length === 0) return [{ key: 'own', heading: '', items: own }];
  const groups: { key: string; heading: string; items: T[] }[] = [];
  if (own.length) groups.push({ key: 'own', heading: 'Your homes', items: own });
  const byOwner = new Map<string, T[]>();
  for (const h of shared) {
    const k = String(h.owner_id ?? h.owner_name ?? 'shared');
    byOwner.set(k, [...(byOwner.get(k) ?? []), h]);
  }
  byOwner.forEach((items, k) => {
    const owner = items[0].owner_name;
    groups.push({ key: `shared-${k}`, heading: owner ? `Shared by ${owner}` : 'Shared with you', items });
  });
  return groups;
};

/** Shape of an axios error from the {data, message, errors} envelope. */
export type ApiError = {
  response?: { status?: number; data?: { errors?: Record<string, unknown>; message?: string } };
};
