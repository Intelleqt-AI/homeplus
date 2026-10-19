import { useState } from 'react';
import { ExternalLink, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CertificateRow from '@/components/dashboard/CertificateRow';
import NewTenancyDialog from '@/components/dashboard/NewTenancyDialog';
import { usePropertyCertificates } from '@/hooks/usePropertyCertificates';
import type { SystemHealthAction, SystemUploadDraft } from '@/lib/Api2';

interface Props {
  propertyId: string;
  nickname: string;
  onAction: (action: SystemHealthAction) => void;
  onUpload: (draft: SystemUploadDraft) => void;
}

/**
 * "Rental safety certificates": the one extra card of a let property's dashboard. The gas safety
 * record, EICR and EPC with their dates and a link to the stored copy; a "New tenancy starting"
 * action; and, depending on the nation, the landlord register line or the "rules are different" note.
 */
const RentalCertificatesCard = ({ propertyId, nickname, onAction, onUpload }: Props) => {
  const { data, isLoading, isError, refetch } = usePropertyCertificates(propertyId);
  const [tenancyOpen, setTenancyOpen] = useState(false);

  return (
    <section className="bg-card rounded-[18px] border border-border overflow-hidden" data-section="rental-certificates">
      <div className="flex items-center gap-2 px-5 pt-5 pb-3">
        <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4 text-foreground" />
        </div>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Rental safety certificates
        </h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : isError || !data ? (
        <div className="px-5 pb-5 text-sm text-muted-foreground flex items-center justify-between gap-3">
          Could not load the certificates.
          <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
        </div>
      ) : (
        <>
          {data.note && (
            <p className="mx-5 mb-3 rounded-lg bg-muted px-3 py-2 text-[13px] text-foreground" data-note={data.note.kind}>
              {data.note.text}
            </p>
          )}
          <ul className="divide-y divide-border border-t border-border">
            {data.certificates.map(item => (
              <CertificateRow key={item.type} item={item} variant="let" onAction={onAction} onUpload={onUpload} />
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4">
            {/* The alarm check is an England task: elsewhere the landlord adds their own dates. */}
            {data.register_line ? (
              <Button variant="outline" size="sm" onClick={() => setTenancyOpen(true)} data-action="new-tenancy">
                New tenancy starting
              </Button>
            ) : <span />}
            {data.register_line && (
              <a
                href={data.register_line.url} target="_blank" rel="noopener noreferrer" data-register-line
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {data.register_line.text} <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            )}
          </div>
          <NewTenancyDialog open={tenancyOpen} onOpenChange={setTenancyOpen} propertyId={propertyId} nickname={nickname} />
        </>
      )}
    </section>
  );
};

export default RentalCertificatesCard;
