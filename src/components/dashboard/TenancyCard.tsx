import { Link } from 'react-router-dom';
import { CalendarRange, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CertificateRow, { fmtDay } from '@/components/dashboard/CertificateRow';
import { propertyEditLink } from '@/components/insights/systemHealthActions';
import { usePropertyCertificates } from '@/hooks/usePropertyCertificates';
import type { SystemHealthAction, SystemUploadDraft } from '@/lib/Api2';

interface Props {
  propertyId: string;
  tenancyStart?: string | null;
  tenancyEnd?: string | null;
  onAction: (action: SystemHealthAction) => void;
  onUpload: (draft: SystemUploadDraft) => void;
}

/**
 * A renter's tenancy card: the dates they entered, and the certificates their landlord should give
 * them (gas safety record, EICR, EPC), each with an "Add a copy" button that saves it to the vault.
 */
const TenancyCard = ({ propertyId, tenancyStart, tenancyEnd, onAction, onUpload }: Props) => {
  const { data, isLoading, isError, refetch } = usePropertyCertificates(propertyId);
  const editDates = propertyEditLink(propertyId, 'tenancy_start');

  return (
    <section className="bg-card rounded-[18px] border border-border overflow-hidden" data-section="tenancy">
      <div className="flex items-center justify-between gap-2 px-5 pt-5 pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center shrink-0">
            <CalendarRange className="w-4 h-4 text-foreground" />
          </div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Your tenancy</h2>
        </div>
        <Link to={editDates} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">
          {tenancyStart || tenancyEnd ? 'Edit dates' : 'Add tenancy dates'}
        </Link>
      </div>

      <dl className="grid grid-cols-2 gap-4 px-5 pb-4 text-sm" data-tenancy-dates>
        <div>
          <dt className="text-xs text-muted-foreground">Started</dt>
          <dd className="font-medium text-foreground" data-tenancy="start">{fmtDay(tenancyStart) || 'Not entered'}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Ends or renewal</dt>
          <dd className="font-medium text-foreground" data-tenancy="end">{fmtDay(tenancyEnd) || 'Not entered'}</dd>
        </div>
      </dl>

      <div className="border-t border-border">
        <div className="flex items-center gap-2 px-5 pt-4 pb-1">
          <ShieldCheck className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-[13px] font-semibold text-foreground">Your landlord&rsquo;s certificates</h3>
        </div>
        <p className="px-5 pb-2 text-[12px] text-muted-foreground">
          Your landlord should give you these. Keep a copy here so you can find them.
        </p>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : isError || !data ? (
          <div className="px-5 pb-5 text-sm text-muted-foreground flex items-center justify-between gap-3">
            Could not load the certificates.
            <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : (
          <ul className="divide-y divide-border border-t border-border">
            {data.certificates.map(item => (
              <CertificateRow key={item.type} item={item} variant="renter" onAction={onAction} onUpload={onUpload} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default TenancyCard;
