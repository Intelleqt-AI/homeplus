import { Link } from 'react-router-dom';
import { Loader2, Users } from 'lucide-react';
import useFetch from '@/hooks/useFetch';
import { cn } from '@/lib/utils';

// GET /api/v1/properties/{id}/people/ — the owner and the members who can reach a home.
type Person = {
  id: string;
  user_id: string | null;
  name: string;
  /** Hidden (null) for other members when the viewer is a member. */
  email: string | null;
  relation: 'owner' | 'member';
  status: 'accepted' | 'pending' | 'expired';
  role: string;
  role_label: string;
  all_properties?: boolean;
  is_you: boolean;
};

type PeopleResponse = { data?: { people: Person[]; can_manage: boolean } };

const ROLE_CHIP: Record<string, string> = {
  homeowner: 'border-blue-300 text-blue-700 bg-blue-50',
  landlord: 'border-purple-300 text-purple-700 bg-purple-50',
  tenant: 'border-orange-300 text-orange-700 bg-orange-50',
  family: 'border-gray-300 text-gray-700 bg-gray-50',
};

const STATUS_LABEL: Record<string, string> = { pending: 'Invite pending', expired: 'Invite expired' };

/** "People with access" on a home's details: owner first, then members with their role. */
export default function HomePeople({ propertyId }: { propertyId: string }) {
  const { data, isLoading, isError } = useFetch<PeopleResponse>(`/api/v1/properties/${propertyId}/people/`);
  const people = data?.data?.people ?? [];
  const canManage = !!data?.data?.can_manage;

  return (
    <section className="pt-3 border-t border-[#E8E8E3]" data-section="people">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" /> People with access
        </p>
        {canManage && (
          <Link to="/dashboard/settings?tab=family" className="text-xs font-medium text-[#1A1A1A] underline underline-offset-2">
            {people.length > 1 ? 'Manage' : 'Share this home'}
          </Link>
        )}
      </div>
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      ) : isError ? (
        <p className="text-xs text-muted-foreground">Could not load who has access.</p>
      ) : (
        <ul className="space-y-2">
          {people.map(p => (
            <li key={p.id} className="flex items-center gap-3 min-w-0">
              <div className="h-8 w-8 shrink-0 rounded-full bg-muted flex items-center justify-center text-xs font-semibold uppercase">
                {(p.name || p.email || '?').charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#1A1A1A] truncate">
                  {p.name || p.email}
                  {p.is_you && <span className="font-normal text-muted-foreground"> (you)</span>}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {p.relation === 'owner' ? 'Owner' : STATUS_LABEL[p.status] ?? 'Member'}
                  {p.email && p.email !== p.name ? ` · ${p.email}` : ''}
                </p>
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-full border px-2 py-0.5 text-xs',
                  ROLE_CHIP[p.role] ?? ROLE_CHIP.family,
                  p.status !== 'accepted' && 'opacity-60',
                )}
              >
                {p.role_label}
              </span>
            </li>
          ))}
          {people.length === 1 && canManage && (
            <li className="text-xs text-muted-foreground">Only you. Share it from Settings → Family.</li>
          )}
        </ul>
      )}
    </section>
  );
}
