import { Link } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import {
  AlertCircle, BadgeCheck, Briefcase, CalendarDays, Clock, FileCheck2, Loader2,
  Mail, MapPin, MessageSquare, Phone, ShieldCheck, Star, Wrench,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import useFetch from '@/hooks/useFetch';
import { TRADE_OPTIONS } from '@/lib/tradeCategories';
import { cn } from '@/lib/utils';

export interface TraderProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  business_name: string;
  business_type: string;
  trade_specialty: string;
  years_experience: string;
  description: string;
  location: string;
  postcode: string;
  radius_km: number | null;
  is_available: boolean;
  is_verified: boolean;
  has_insurance: boolean;
  has_license: boolean;
  profile_photo_url: string | null;
  member_since: string | null;
  phone: string;
  email: string;
  completed_jobs: number;
  avg_rating: number | null;
  total_ratings: number;
  rating_breakdown: Record<string, number>;
  credentials: { type: string; label: string; name: string; expires_at: string | null; is_expired: boolean }[];
  services: { name: string; description: string; price: string; price_type: string; price_type_label: string }[];
  reviews: { rating: number; comment: string; rated_at: string | null; trade: string; is_yours: boolean }[];
  your_jobs: {
    job_id: string; title: string; job_status: string; bid_id: string; bid_status: string;
    amount: string | null; conversation_id: string | null; created_at: string;
  }[];
}

interface Props {
  traderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const prettify = (s?: string) => (s ? s.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()) : '');
const tradeLabel = (v: string) => TRADE_OPTIONS.find(t => t.value === v)?.label ?? prettify(v);
const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('') || 'T';

const BID_STATUS: Record<string, { label: string; cls: string }> = {
  accepted: { label: 'Hired', cls: 'bg-[#ECFDF5] text-[#047857]' },
  pending: { label: 'Quoted', cls: 'bg-[#FEF9E7] text-[#B45309]' },
  purchased: { label: 'Interested', cls: 'bg-[#EEF2FF] text-[#4338CA]' },
  rejected: { label: 'Not selected', cls: 'bg-[#F5F5F0] text-[#6B6B6B]' },
};

const Stars = ({ value, size = 'h-3.5 w-3.5' }: { value: number; size?: string }) => (
  <span className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(n => (
      <Star key={n} className={cn(size, n <= Math.round(value) ? 'fill-[#FBBF24] text-[#FBBF24]' : 'text-[#E8E8E3]')} />
    ))}
  </span>
);

const Section = ({ title, icon: Icon, children }: { title: string; icon: typeof Star; children: React.ReactNode }) => (
  <div>
    <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#6B6B6B]">
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} /> {title}
    </p>
    {children}
  </div>
);

const Stat = ({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) => (
  <div className="rounded-[12px] bg-[#F5F5F0] p-3">
    <p className="text-[11px] text-[#6B6B6B]">{label}</p>
    <div className="mt-0.5 text-base font-semibold text-[#1A1A1A]">{value}</div>
    {sub && <p className="text-[11px] text-[#A1A1A1]">{sub}</p>}
  </div>
);

const TraderProfileDialog = ({ traderId, open, onOpenChange }: Props) => {
  const { data, isLoading, isError } = useFetch<{ data?: TraderProfile }>(
    open && traderId ? `/api/v1/jobs/traders/${traderId}/` : null,
    { staleTime: 60 * 1000 },
  );
  const t = data?.data;
  const fullName = t ? `${t.first_name} ${t.last_name}`.trim() : '';
  const displayName = t?.business_name || fullName || 'Tradesperson';
  const maxBreakdown = t ? Math.max(1, ...Object.values(t.rating_breakdown)) : 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader className="sr-only">
          <DialogTitle>{displayName}</DialogTitle>
        </DialogHeader>

        {isLoading || (!t && !isError) ? (
          <div className="flex h-60 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#6B6B6B]" />
          </div>
        ) : isError || !t ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
            <AlertCircle className="h-6 w-6 text-[#A1A1A1]" />
            <p className="text-sm text-[#6B6B6B]">This tradesperson's profile isn't available.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 shrink-0 bg-[#F5F5F0]">
                <AvatarImage src={t.profile_photo_url ?? undefined} alt={displayName} />
                <AvatarFallback className="bg-[#FEF9E7] text-lg font-semibold text-[#B45309]">{initials(displayName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 pr-6">
                <div className="flex items-center gap-1.5">
                  <h2 className="truncate text-lg font-semibold text-[#1A1A1A]">{displayName}</h2>
                  {t.is_verified && <BadgeCheck className="h-5 w-5 shrink-0 text-[#2563EB]" aria-label="Verified" />}
                </div>
                {t.business_name && fullName && <p className="text-sm text-[#6B6B6B]">{fullName}</p>}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {t.trade_specialty && (
                    <span className="rounded-full border border-[#E8E8E3] bg-white px-2.5 py-0.5 text-xs text-[#1A1A1A]">{tradeLabel(t.trade_specialty)}</span>
                  )}
                  {t.business_type && (
                    <span className="rounded-full border border-[#E8E8E3] bg-white px-2.5 py-0.5 text-xs text-[#6B6B6B]">{prettify(t.business_type)}</span>
                  )}
                  <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium',
                    t.is_available ? 'bg-[#ECFDF5] text-[#047857]' : 'bg-[#F5F5F0] text-[#6B6B6B]')}>
                    {t.is_available ? 'Available for work' : 'Currently unavailable'}
                  </span>
                  {t.is_verified && (
                    <span className="rounded-full bg-[#EFF6FF] px-2.5 py-0.5 text-xs font-medium text-[#1D4ED8]">Verified by HomePlus</span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat
                label="Rating"
                value={t.total_ratings > 0
                  ? <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-[#FBBF24] text-[#FBBF24]" />{t.avg_rating?.toFixed(1)}</span>
                  : '—'}
                sub={t.total_ratings > 0 ? `${t.total_ratings} review${t.total_ratings === 1 ? '' : 's'}` : 'No reviews yet'}
              />
              <Stat label="Jobs completed" value={t.completed_jobs} sub="on HomePlus" />
              <Stat label="Experience" value={t.years_experience ? `${t.years_experience} yrs` : '—'} />
              <Stat
                label="Member since"
                value={t.member_since ? format(new Date(t.member_since), 'MMM yyyy') : '—'}
                sub={t.member_since ? formatDistanceToNow(new Date(t.member_since), { addSuffix: true }) : undefined}
              />
            </div>

            {t.description && (
              <Section title="About" icon={Briefcase}>
                <p className="whitespace-pre-wrap rounded-[12px] border border-[#E8E8E3] bg-white p-3 text-sm leading-relaxed text-[#1A1A1A]">{t.description}</p>
              </Section>
            )}

            {/* Area + contact */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(t.location || t.postcode) && (
                <div className="flex items-start gap-2.5 rounded-[12px] bg-[#F5F5F0] p-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#6B6B6B]" strokeWidth={1.5} />
                  <div>
                    <p className="text-[11px] text-[#6B6B6B]">Based in</p>
                    <p className="text-sm font-medium text-[#1A1A1A]">{[t.location, t.postcode].filter(Boolean).join(', ')}</p>
                    {t.radius_km ? <p className="text-[11px] text-[#A1A1A1]">Covers ~{t.radius_km} km</p> : null}
                  </div>
                </div>
              )}
              {t.phone && (
                <a href={`tel:${t.phone}`} className="flex items-start gap-2.5 rounded-[12px] bg-[#F5F5F0] p-3 hover:bg-[#EFEFEA]">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#6B6B6B]" strokeWidth={1.5} />
                  <div className="min-w-0">
                    <p className="text-[11px] text-[#6B6B6B]">Phone</p>
                    <p className="truncate text-sm font-medium text-[#1A1A1A]">{t.phone}</p>
                  </div>
                </a>
              )}
              {t.email && (
                <a href={`mailto:${t.email}`} className="flex items-start gap-2.5 rounded-[12px] bg-[#F5F5F0] p-3 hover:bg-[#EFEFEA]">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#6B6B6B]" strokeWidth={1.5} />
                  <div className="min-w-0">
                    <p className="text-[11px] text-[#6B6B6B]">Email</p>
                    <p className="truncate text-sm font-medium text-[#1A1A1A]">{t.email}</p>
                  </div>
                </a>
              )}
            </div>

            {/* Credentials */}
            <Section title="Verified credentials" icon={FileCheck2}>
              {t.credentials.length === 0 ? (
                <p className="text-xs text-[#6B6B6B]">No documents verified by HomePlus yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {t.credentials.map((c, i) => (
                    <div key={i} className="flex items-center gap-2.5 rounded-[10px] border border-[#E8E8E3] bg-white px-3 py-2">
                      <ShieldCheck className={cn('h-4 w-4 shrink-0', c.is_expired ? 'text-[#A1A1A1]' : 'text-[#059669]')} strokeWidth={1.75} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#1A1A1A]">{c.label}</p>
                        {c.name && c.name !== c.label && <p className="truncate text-[11px] text-[#6B6B6B]">{c.name}</p>}
                      </div>
                      <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
                        c.is_expired ? 'bg-[#FEF2F2] text-[#B91C1C]' : 'bg-[#ECFDF5] text-[#047857]')}>
                        {c.is_expired ? 'Expired' : c.expires_at ? `Valid until ${format(new Date(c.expires_at), 'd MMM yyyy')}` : 'Verified'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {(t.has_insurance || t.has_license) && (
                <p className="mt-2 text-[11px] text-[#A1A1A1]">
                  Self-declared: {[t.has_insurance && 'insured', t.has_license && 'licensed'].filter(Boolean).join(' · ')}
                </p>
              )}
            </Section>

            {t.services.length > 0 && (
              <Section title="Services offered" icon={Wrench}>
                <div className="divide-y divide-[#E8E8E3] rounded-[12px] border border-[#E8E8E3] bg-white">
                  {t.services.map((s, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#1A1A1A]">{s.name}</p>
                        {s.description && <p className="text-xs text-[#6B6B6B]">{s.description}</p>}
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-[#1A1A1A]">
                        {s.price_type === 'from' ? 'from ' : ''}£{Number(s.price).toLocaleString('en-GB')}
                        {s.price_type === 'hourly' && <span className="text-xs font-normal text-[#6B6B6B]"> /hr</span>}
                      </p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Reviews */}
            <Section title={`Reviews (${t.total_ratings})`} icon={Star}>
              {t.total_ratings === 0 ? (
                <p className="text-xs text-[#6B6B6B]">No reviews yet.</p>
              ) : (
                <>
                  <div className="mb-3 space-y-1">
                    {['5', '4', '3', '2', '1'].map(n => (
                      <div key={n} className="flex items-center gap-2 text-xs text-[#6B6B6B]">
                        <span className="w-3">{n}</span>
                        <Star className="h-3 w-3 fill-[#FBBF24] text-[#FBBF24]" />
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#F5F5F0]">
                          <div className="h-full rounded-full bg-[#FBBF24]" style={{ width: `${(t.rating_breakdown[n] / maxBreakdown) * 100}%` }} />
                        </div>
                        <span className="w-5 text-right">{t.rating_breakdown[n]}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {t.reviews.map((r, i) => (
                      <div key={i} className={cn('rounded-[12px] border p-3', r.is_yours ? 'border-[#FDE68A] bg-[#FFFBEB]' : 'border-[#E8E8E3] bg-white')}>
                        <div className="flex items-center justify-between gap-2">
                          <Stars value={r.rating} />
                          <span className="text-[11px] text-[#A1A1A1]">
                            {r.is_yours ? 'Your review · ' : ''}{tradeLabel(r.trade)}
                            {r.rated_at ? ` · ${format(new Date(r.rated_at), 'd MMM yyyy')}` : ''}
                          </span>
                        </div>
                        {r.comment && <p className="mt-1.5 text-sm text-[#1A1A1A]">{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Section>

            {/* Your jobs */}
            <Section title="Your jobs with this tradesperson" icon={CalendarDays}>
              <div className="space-y-1.5">
                {t.your_jobs.map(j => {
                  const st = BID_STATUS[j.bid_status] ?? { label: prettify(j.bid_status), cls: 'bg-[#F5F5F0] text-[#6B6B6B]' };
                  return (
                    <div key={j.bid_id} className="flex items-center gap-3 rounded-[10px] border border-[#E8E8E3] bg-white px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#1A1A1A]">{j.title}</p>
                        <p className="flex items-center gap-1 text-[11px] text-[#6B6B6B]">
                          <Clock className="h-3 w-3" /> {formatDistanceToNow(new Date(j.created_at), { addSuffix: true })}
                          {' · '}job {prettify(j.job_status).toLowerCase()}
                        </p>
                      </div>
                      <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium', st.cls)}>{st.label}</span>
                      {j.amount && <span className="shrink-0 text-sm font-semibold text-[#1A1A1A]">£{Number(j.amount).toLocaleString('en-GB')}</span>}
                      {j.conversation_id && (
                        <Link
                          to={`/dashboard/messages?job=${j.job_id}&from=${encodeURIComponent(fullName)}`}
                          onClick={() => onOpenChange(false)}
                          className="shrink-0 rounded-full p-1.5 text-[#6B6B6B] hover:bg-[#F5F5F0] hover:text-[#1A1A1A]"
                          title="Open chat"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TraderProfileDialog;
