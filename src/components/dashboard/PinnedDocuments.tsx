import { Link } from 'react-router-dom';
import { FileText, Pin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PinnedDoc {
  id: string;
  name: string;
  type: string;
  status: 'valid' | 'expired' | 'no-expiry';
  expiryDate?: string;
}

const SAMPLE_PINNED: PinnedDoc[] = [
  { id: '1', name: 'Home Insurance 2024', type: 'Insurance', status: 'valid', expiryDate: '2025-03-15' },
  { id: '2', name: 'Gas Safety CP12', type: 'Certificate', status: 'valid', expiryDate: '2026-06-15' },
  { id: '3', name: 'EPC Certificate', type: 'Certificate', status: 'valid', expiryDate: '2033-05-10' },
  { id: '4', name: 'Boiler Warranty', type: 'Warranty', status: 'valid', expiryDate: '2028-01-15' },
];

const PinnedDocuments = () => {
  const pinnedDocs = SAMPLE_PINNED;

  const getStatusBadge = (doc: PinnedDoc) => {
    if (doc.status === 'expired') return { label: 'Expired', color: 'text-red-600 bg-red-50' };
    if (doc.expiryDate) {
      const days = Math.ceil((new Date(doc.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (days <= 30) return { label: `${days}d left`, color: 'text-amber-600 bg-amber-50' };
    }
    return { label: 'Valid', color: 'text-emerald-600 bg-emerald-50' };
  };

  return (
    <div className="bg-white rounded-[20px] p-6 border border-[#E8E8E3]">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-[#F5F5F0] rounded-full flex items-center justify-center">
            <Pin className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-[#1A1A1A] text-lg font-semibold">Important Documents</h3>
            <p className="text-[#6B6B6B] text-sm">Quick access to key documents</p>
          </div>
        </div>
        <Link to="/dashboard/documents">
          <Button variant="outline" className="text-sm h-9 px-4 rounded-full border-[#E8E8E3]">
            All Documents
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {pinnedDocs.map(doc => {
          const badge = getStatusBadge(doc);
          return (
            <Link
              key={doc.id}
              to="/dashboard/documents"
              className="bg-[#FAFAFA] rounded-[12px] p-4 border border-[#F0F0F0] hover:bg-[#F5F5F0] hover:border-[#E8E8E3] transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="h-8 w-8 rounded-[8px] bg-white border border-[#E5E7EB] flex items-center justify-center">
                  <FileText className="w-4 h-4 text-[#4A4A4A]" strokeWidth={1.5} />
                </div>
                <ExternalLink className="w-3 h-3 text-[#9CA3AF] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h4 className="text-[#1A1A1A] text-sm font-medium truncate">{doc.name}</h4>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[#9CA3AF] text-xs">{doc.type}</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${badge.color}`}>
                  {badge.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default PinnedDocuments;
