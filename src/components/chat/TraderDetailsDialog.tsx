import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BadgeCheck, Phone, ShieldCheck, Star } from 'lucide-react';

interface TradePilotProfile {
  business_name: string;
  trade_specialty: string;
  years_experience: string;
  postcode: string;
  has_insurance: boolean;
  has_license: boolean;
  is_verified: boolean;
  completed_jobs: number;
  avg_rating: number | null;
  total_ratings: number;
  profile_photo_url: string | null;
}

interface TraderBid {
  contractor_phone: string;
  company_name: string;
  bidder: { first_name: string; last_name: string; email: string };
  tradepilot_profile: TradePilotProfile | null;
}

interface TraderDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bid: TraderBid | null;
  fallbackName?: string;
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || 'T';

const TraderDetailsDialog = ({ open, onOpenChange, bid, fallbackName }: TraderDetailsDialogProps) => {
  const profile = bid?.tradepilot_profile ?? null;
  const displayName =
    profile?.business_name ||
    bid?.company_name ||
    `${bid?.bidder?.first_name ?? ''} ${bid?.bidder?.last_name ?? ''}`.trim() ||
    fallbackName ||
    'Trader';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile?.profile_photo_url ?? undefined} alt={displayName} />
              <AvatarFallback className="text-sm font-semibold text-gray-600">
                {initials(displayName)}
              </AvatarFallback>
            </Avatar>
            <DialogTitle className="flex items-center gap-1.5">
              {displayName}
              {profile?.is_verified && <BadgeCheck className="h-4 w-4 text-blue-500" aria-label="Verified trader" />}
            </DialogTitle>
          </div>
        </DialogHeader>

        {!bid ? (
          <p className="text-sm text-gray-500">Trader details aren't available yet.</p>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-1.5">
              {profile?.trade_specialty && <Badge variant="secondary">{cap(profile.trade_specialty)}</Badge>}
              {profile?.has_insurance && <Badge variant="outline">Insured</Badge>}
              {profile?.has_license && <Badge variant="outline">Licensed</Badge>}
            </div>

            <div className="space-y-1.5 rounded-lg border bg-gray-50 p-3 text-xs">
              {profile?.years_experience && (
                <div className="flex gap-2">
                  <span className="min-w-[110px] shrink-0 text-gray-500">Experience</span>
                  <span className="text-gray-900">{profile.years_experience} years</span>
                </div>
              )}
              {profile?.postcode && (
                <div className="flex gap-2">
                  <span className="min-w-[110px] shrink-0 text-gray-500">Postcode</span>
                  <span className="text-gray-900">{profile.postcode}</span>
                </div>
              )}
              {profile && (
                <div className="flex items-center gap-2">
                  <span className="min-w-[110px] shrink-0 text-gray-500">Rating</span>
                  {profile.total_ratings > 0 ? (
                    <span className="flex items-center gap-1 text-gray-900">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {profile.avg_rating?.toFixed(1)} ({profile.total_ratings})
                    </span>
                  ) : (
                    <span className="text-gray-500">No ratings yet</span>
                  )}
                </div>
              )}
              {profile && (
                <div className="flex gap-2">
                  <span className="min-w-[110px] shrink-0 text-gray-500">Completed jobs</span>
                  <span className="text-gray-900">{profile.completed_jobs}</span>
                </div>
              )}
              {bid.contractor_phone && (
                <div className="flex items-center gap-2">
                  <span className="min-w-[110px] shrink-0 text-gray-500">Phone</span>
                  <span className="flex items-center gap-1 text-gray-900">
                    <Phone className="h-3.5 w-3.5" />
                    {bid.contractor_phone}
                  </span>
                </div>
              )}
            </div>

            {(profile?.has_insurance || profile?.has_license) && (
              <p className="flex items-center gap-1.5 text-xs text-gray-500">
                <ShieldCheck className="h-3.5 w-3.5" />
                Insurance/license status is self-reported by the trader.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TraderDetailsDialog;
