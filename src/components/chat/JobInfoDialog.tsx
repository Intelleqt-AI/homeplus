import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface JobDetail {
  title: string;
  description: string;
  trade: string;
  category: string;
  urgency: string;
  priority: string;
  status: string;
  location: string;
  postcode: string;
  preferred_date: string | null;
}

interface BidSummary {
  id: string;
  conversation_id: string | null;
  bidder: { first_name: string; last_name: string; email: string };
  tradepilot_profile: { business_name: string } | null;
}

interface JobInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobDetail: JobDetail | null;
  bids: BidSummary[];
  conversationId: string | null;
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const bidderName = (b: BidSummary) =>
  b.tradepilot_profile?.business_name || `${b.bidder?.first_name ?? ''} ${b.bidder?.last_name ?? ''}`.trim() || 'A trader';

const JobInfoDialog = ({ open, onOpenChange, jobDetail, bids, conversationId }: JobInfoDialogProps) => {
  if (!jobDetail) return null;
  const otherBids = bids.filter(b => b.conversation_id !== conversationId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Job details</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-gray-900">{jobDetail.title}</h3>
            <div className="flex flex-wrap gap-1.5">
              {jobDetail.trade && <Badge variant="secondary">{cap(jobDetail.trade)}</Badge>}
              {jobDetail.status && <Badge variant="outline">{cap(jobDetail.status.replace('_', ' '))}</Badge>}
            </div>
          </div>

          <div className="space-y-1.5 rounded-lg border bg-gray-50 p-3 text-xs">
            {(jobDetail.location || jobDetail.postcode) && (
              <div className="flex gap-2">
                <span className="min-w-[100px] shrink-0 text-gray-500">Location</span>
                <span className="text-gray-900">{[jobDetail.location, jobDetail.postcode].filter(Boolean).join(', ')}</span>
              </div>
            )}
            {jobDetail.preferred_date && (
              <div className="flex gap-2">
                <span className="min-w-[100px] shrink-0 text-gray-500">Preferred date</span>
                <span className="text-gray-900">{fmtDate(jobDetail.preferred_date)}</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5 border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Other traders on this job</p>
            {otherBids.length === 0 ? (
              <p className="text-xs text-gray-500">No other traders have purchased this job yet.</p>
            ) : (
              <>
                <p className="text-xs text-gray-700">
                  {otherBids.length} other trader{otherBids.length > 1 ? 's have' : ' has'} also purchased this job.
                </p>
                <ul className="space-y-0.5 text-xs text-gray-700">
                  {otherBids.map(b => (
                    <li key={b.id}>• {bidderName(b)}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobInfoDialog;
