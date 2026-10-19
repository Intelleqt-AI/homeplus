import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  AlertTriangle, CalendarClock, CheckCircle, Circle, FileText, MinusCircle, Upload, Wrench, XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { documentLink } from '@/components/insights/systemHealthActions';
import type { CertificateItem, CertificateStatus, CertificateType, SystemHealthAction, SystemUploadDraft } from '@/lib/Api2';

/** The upload form for each certificate, filled in (the vault files it under the right type). */
export const CERT_UPLOAD: Record<CertificateType, SystemUploadDraft> = {
  gas_safety: {
    name: 'Gas safety record', discipline: 'compliance', doc_type: 'gas_engineer',
    category: 'gas_engineer_gas_safety_certificates',
  },
  eicr: { name: 'EICR', discipline: 'compliance', doc_type: 'electrical', category: 'electrical_testing_certificates' },
  epc: { name: 'Energy Performance Certificate (EPC)', discipline: 'energy_epc', doc_type: 'other', category: 'other' },
};

const STATUS: Record<CertificateStatus, { label: string; chip: string; Icon: typeof CheckCircle; icon: string }> = {
  done: { label: 'Done', chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', Icon: CheckCircle, icon: 'text-emerald-600' },
  missing: { label: 'Missing', chip: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300', Icon: Circle, icon: 'text-red-500' },
  undated: { label: 'No expiry date', chip: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', Icon: AlertTriangle, icon: 'text-amber-500' },
  expired: { label: 'Expired', chip: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300', Icon: XCircle, icon: 'text-red-500' },
  expiring: { label: 'Expiring soon', chip: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', Icon: CalendarClock, icon: 'text-amber-500' },
  below_minimum: { label: 'Below band E', chip: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300', Icon: XCircle, icon: 'text-red-500' },
  not_needed: { label: 'Not needed', chip: 'bg-muted text-muted-foreground', Icon: MinusCircle, icon: 'text-muted-foreground' },
};

export const fmtDay = (iso?: string | null) => {
  if (!iso) return '';
  try {
    return format(parseISO(iso), 'd MMM yyyy');
  } catch {
    return iso;
  }
};

const pill = 'inline-flex items-center gap-1 text-[11.5px] font-medium px-2.5 py-1.5 rounded-full transition-colors whitespace-nowrap';
const PRIMARY = cn(pill, 'bg-foreground text-background hover:opacity-90');
const SECONDARY = cn(pill, 'border border-border bg-card text-foreground hover:bg-muted');

interface Props {
  item: CertificateItem;
  /** `let`: the landlord's card. `renter`: the tenant's list of what the landlord should give them. */
  variant: 'let' | 'renter';
  onAction: (action: SystemHealthAction) => void;
  onUpload: (draft: SystemUploadDraft) => void;
}

/** One certificate: its dates, a link to the stored copy, and what to do next. */
const CertificateRow = ({ item, variant, onAction, onUpload }: Props) => {
  const s = STATUS[item.status] ?? STATUS.missing;
  const dated = !!item.expires_on;

  const dates: string[] = [];
  if (item.status === 'not_needed') dates.push('Not needed: the home has no gas heating.');
  else if (item.status === 'missing') dates.push(variant === 'renter' ? 'Not added yet.' : 'No certificate on file.');
  else if (item.status === 'undated') dates.push('A copy is on file but it has no expiry date.');
  else {
    if (item.band) dates.push(`Band ${item.band}`);
    if (item.last_date) {
      dates.push(`Last ${fmtDay(item.last_date)}${item.last_date_source === 'derived' ? ' (est.)' : ''}`);
    }
    if (item.expires_on) dates.push(`${item.status === 'expired' ? 'Expired' : 'Expires'} ${fmtDay(item.expires_on)}`);
    if (item.next_due && item.next_due !== item.expires_on) dates.push(`Next due ${fmtDay(item.next_due)}`);
  }

  // "Add date": the certificate has no date yet. A copy that is on file opens for its date to be
  // typed in; with no copy at all the date comes with uploading one.
  const addDateAction = item.actions.find(a => a.prefill?.open === 'edit');
  const quote = item.actions.find(a => a.kind === 'quote');
  const others = item.actions.filter(a => a !== addDateAction && a !== quote && a.title !== 'View certificate' && a.title !== 'Upload');

  return (
    <li
      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3"
      data-certificate={item.type}
      data-status={item.status}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <s.Icon className={cn('w-4 h-4 mt-0.5 shrink-0', s.icon)} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[13.5px] font-semibold text-foreground">{item.label}</p>
            <span className={cn('text-[10.5px] font-semibold px-2 py-0.5 rounded-full', s.chip)}>{s.label}</span>
          </div>
          <p className="text-[12px] text-muted-foreground mt-0.5 break-words" data-dates>
            {dates.join(' · ')}
          </p>
        </div>
      </div>

      {item.status !== 'not_needed' && (
        <div className="flex flex-wrap gap-1.5 pl-7 sm:pl-0 shrink-0">
          {variant === 'renter' ? (
            <button type="button" className={item.document ? SECONDARY : PRIMARY} onClick={() => onUpload(CERT_UPLOAD[item.type])}>
              <Upload className="w-3 h-3" /> Add a copy
            </button>
          ) : (
            !dated && (
              <button
                type="button"
                className={PRIMARY}
                data-action="add-date"
                onClick={() => (addDateAction ? onAction(addDateAction) : onUpload(CERT_UPLOAD[item.type]))}
              >
                <CalendarClock className="w-3 h-3" /> Add date
              </button>
            )
          )}
          {item.document && (
            <Link to={documentLink(item.document.id)} className={SECONDARY} data-action="view-certificate">
              <FileText className="w-3 h-3" /> View certificate
            </Link>
          )}
          {variant === 'let' && quote && (
            <button type="button" className={SECONDARY} onClick={() => onAction(quote)}>
              <Wrench className="w-3 h-3" /> {quote.title}
            </button>
          )}
          {variant === 'let' && dated && (item.status === 'expired' || item.status === 'expiring') && (
            <button type="button" className={SECONDARY} onClick={() => onUpload(CERT_UPLOAD[item.type])}>
              <Upload className="w-3 h-3" /> Upload new
            </button>
          )}
          {variant === 'let' && others.map((a, i) => (
            <button key={i} type="button" className={SECONDARY} onClick={() => onAction(a)}>
              {a.title}
            </button>
          ))}
        </div>
      )}
    </li>
  );
};

export default CertificateRow;
