import { useState, useMemo, useRef } from 'react';
import {
  Upload,
  Download,
  Eye,
  Trash2,
  FileText,
  Package,
  FolderOpen,
  Search,
  AlertTriangle,
  Pencil,
  Loader2,
  CalendarIcon,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { toast } from '@/lib/toast';
import { format, parseISO } from 'date-fns';
import useFetch from '@/hooks/useFetch';
import useDelete from '@/hooks/useDelete';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteFile, updateDocument, getDocumentDownloadUrl, type NormDoc, type DocumentUpdatePayload, type PaginatedResponse } from '@/lib/Api';
import DocsUploadDialog from '@/components/docsUploadDialog';
import { exportDocumentPack } from '@/lib/Api2';
import Quote, { type QuotePrefill } from '@/components/topbar/Quote';
import { cn } from '@/lib/utils';
import { TRADE_OPTIONS, DISCIPLINE_OPTIONS, tradeCategoriesByType, getTradeCategoryLabel } from '@/lib/tradeCategories';

const CATEGORY_TABS = [
  { id: 'all', label: 'All' },
  ...DISCIPLINE_OPTIONS
    .filter(d => d.value !== 'other')
    .map(d => ({ id: d.value, label: d.label })),
];

const DISCIPLINES = DISCIPLINE_OPTIONS;
const DOC_TYPES = TRADE_OPTIONS;

const tradeTypeLabel = (value: string) => TRADE_OPTIONS.find(t => t.value === value)?.label ?? value;

const formatBytes = (bytes: number) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const expiryStatus = (doc: NormDoc) => {
  if (!doc.expires_at) return { label: 'No expiry', cls: 'bg-gray-100 text-gray-600' };
  if (doc.is_expired) return { label: 'Expired', cls: 'bg-red-50 text-red-600' };
  const days = Math.ceil((new Date(doc.expires_at).getTime() - Date.now()) / 86_400_000);
  if (days <= 30) return { label: `${days}d left`, cls: 'bg-yellow-50 text-yellow-600' };
  return { label: 'Valid', cls: 'bg-green-50 text-green-600' };
};

const needsJobCTA = (doc: NormDoc): boolean => {
  if (!doc.expires_at) return false;
  if (doc.is_expired) return true;
  const days = Math.ceil((new Date(doc.expires_at).getTime() - Date.now()) / 86_400_000);
  return days >= 0 && days <= 7;
};

interface EditState {
  name: string;
  doc_type: string;
  category: string;
  discipline: string;
  expires_at: Date | null;
  notes: string;
}

const DOCS_URL = '/api/v1/documents/';
const EXPIRY_URL = '/api/v1/documents/expiring/';

const Documents = () => {
  const queryClient = useQueryClient();

  const [openForm, setOpenForm] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [editDoc, setEditDoc] = useState<NormDoc | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [editDateOpen, setEditDateOpen] = useState(false);
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<NormDoc | null>(null);
  const [selectedForExport, setSelectedForExport] = useState<string[]>([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportMode, setExportMode] = useState<'pick' | 'review'>('pick');
  const [exportModalSearch, setExportModalSearch] = useState('');
  const [exportModalSelected, setExportModalSelected] = useState<string[]>([]);
  const [prefillDiscipline, setPrefillDiscipline] = useState<string | undefined>();
  const [exportLoading, setExportLoading] = useState(false);
  const [highlightCheckboxes, setHighlightCheckboxes] = useState(false);
  const docListRef = useRef<HTMLDivElement>(null);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quotePrefill, setQuotePrefill] = useState<QuotePrefill | undefined>();

  const openUploadForm = (discipline?: string) => {
    setPrefillDiscipline(discipline ?? (activeTab !== 'all' ? activeTab : undefined));
    setOpenForm(true);
  };

  const handleStartSelecting = () => {
    docListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setHighlightCheckboxes(true);
    setTimeout(() => setHighlightCheckboxes(false), 2000);
  };

  const handlePostJob = (doc: NormDoc) => {
    const tradeLabel = TRADE_OPTIONS.find(t => t.value === doc.doc_type)?.label;
    const categoryLabel = doc.category ? getTradeCategoryLabel(doc.category) : undefined;
    setQuotePrefill({
      title: doc.name,
      service: tradeLabel,
      category: categoryLabel,
    });
    setQuoteOpen(true);
  };

  const { data: docsPage, isLoading, refetch } = useFetch<PaginatedResponse<NormDoc>>(DOCS_URL);
  // Backend is the single source of truth — no demo/sample fallback.
  const allDocs = useMemo<NormDoc[]>(() => docsPage?.results ?? [], [docsPage]);

  const { data: expiringPage } = useFetch<PaginatedResponse<NormDoc>>(EXPIRY_URL);

  // Fetch primary property for suggested docs and role-based chip logic
  const { data: propertiesRes } = useFetch<{ results?: { id: string; role: string; heating_type?: string; year_built?: number }[]; data?: { id: string; role: string; heating_type?: string; year_built?: number }[] }>('/api/v1/properties/');
  const primaryProperty = useMemo(() => {
    const list = propertiesRes?.results ?? propertiesRes?.data ?? [];
    return list[0] ?? null;
  }, [propertiesRes]);
  const expiringDocs = useMemo<NormDoc[]>(() => expiringPage?.results ?? [], [expiringPage]);

  const deleteMutation = useDelete({
    mutationFn: deleteFile,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: [DOCS_URL] });
      queryClient.refetchQueries({ queryKey: [EXPIRY_URL] });
      setDeleteDocId(null);
      toast.success('Document deleted.');
    },
    onError: () => toast.error('Failed to delete.'),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: DocumentUpdatePayload }) => updateDocument(id, data),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: [DOCS_URL] });
      queryClient.refetchQueries({ queryKey: [EXPIRY_URL] });
      setEditDoc(null);
      toast.success('Document updated.');
    },
    onError: () => toast.error('Failed to update document.'),
  });

  const openEdit = (doc: NormDoc) => {
    setEditDoc(doc);
    setEditState({
      name: doc.name,
      doc_type: doc.doc_type,
      category: doc.category,
      discipline: doc.discipline || 'other',
      expires_at: doc.expires_at ? new Date(doc.expires_at) : null,
      notes: doc.notes,
    });
  };

  const handleEditSave = () => {
    if (!editDoc || !editState) return;
    editMutation.mutate({
      id: editDoc.id,
      data: {
        name: editState.name.trim() || editDoc.name,
        doc_type: editState.doc_type,
        category: editState.category,
        discipline: editState.discipline,
        expires_at: editState.expires_at ? editState.expires_at.toISOString().split('T')[0] : null,
        notes: editState.notes,
      },
    });
  };

  const editTradeCategories = editState?.doc_type ? (tradeCategoriesByType[editState.doc_type] ?? []) : [];

  const filtered = useMemo(() => {
    let docs = allDocs;
    if (activeTab !== 'all') docs = docs.filter(d => d.discipline === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      docs = docs.filter(
        d => d.name.toLowerCase().includes(q) || d.notes?.toLowerCase().includes(q) || d.file_name?.toLowerCase().includes(q),
      );
    }
    return docs;
  }, [allDocs, activeTab, search]);

  const stats = useMemo(
    () => ({
      total: allDocs.length,
      expiring: expiringDocs.length,
      expired: allDocs?.filter(d => d.is_expired).length,
      compliance: allDocs?.filter(d => d.discipline === 'compliance').length,
    }),
    [allDocs, expiringDocs],
  );

  // Suggested documents based on property profile — shown when < 5 docs uploaded
  const suggestedDocs = useMemo(() => {
    if (allDocs.length >= 5) return [];
    const hasDisc = (discipline: string, category?: string) =>
      allDocs.some(d => d.discipline === discipline && (!category || d.category === category));
    const suggestions: { label: string; discipline: string; category: string; reason: string }[] = [];
    if (!hasDisc('insurance'))
      suggestions.push({ label: 'Buildings Insurance', discipline: 'insurance', category: '', reason: 'Every UK homeowner should have this' });
    if (primaryProperty?.heating_type?.startsWith('gas') && !hasDisc('compliance', 'gas_engineer_gas_safety_certificates'))
      suggestions.push({ label: 'Gas Safety Certificate (CP12)', discipline: 'compliance', category: 'gas_engineer_gas_safety_certificates', reason: 'Required for gas appliances' });
    if (primaryProperty?.heating_type?.startsWith('gas') && !hasDisc('manuals_appliances', 'boiler_manual'))
      suggestions.push({ label: 'Boiler Manual', discipline: 'manuals_appliances', category: 'boiler_manual', reason: 'Useful for servicing & faults' });
    if (!hasDisc('energy_epc', 'epc_certificate'))
      suggestions.push({ label: 'EPC Certificate', discipline: 'energy_epc', category: 'epc_certificate', reason: 'Valid 10 years — required for selling/letting' });
    if ((primaryProperty?.year_built ?? 3000) < 1970 && !hasDisc('compliance', 'electrical_testing_certificates'))
      suggestions.push({ label: 'Electrical Condition Report (EICR)', discipline: 'compliance', category: 'electrical_testing_certificates', reason: 'Recommended for older properties' });
    return suggestions.slice(0, 4);
  }, [allDocs, primaryProperty]);

  function downloadFile(docId: string, fileName: string) {
    toast.promise(
      getDocumentDownloadUrl(docId).then(url =>
        fetch(url)
          .then(r => {
            if (!r.ok) throw new Error('Download failed');
            return r.blob();
          })
          .then(blob => {
            const a = document.createElement('a');
            a.href = window.URL.createObjectURL(blob);
            a.download = fileName;
            a.click();
            a.remove();
          }),
      ),
      { loading: 'Downloading…', success: 'Download started.', error: 'Download failed.' },
    );
  }

  const handleExportSelection = (id: string, checked: boolean) =>
    setSelectedForExport(prev => (checked ? [...prev, id] : prev.filter(x => x !== id)));

  const handleSelectAll = (checked: boolean) => setSelectedForExport(checked ? allDocs.map(d => d.id) : []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header + Stats */}
        <div className="bg-white rounded-[20px] p-4 md:p-6 border border-[#E8E8E3]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-[#F5F5F0] rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[#6B6B6B] text-sm mb-0.5">Your documents</p>
                <h1 className="text-[#1A1A1A] text-2xl font-semibold">Documents</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  if (selectedForExport.length > 0) {
                    setExportMode('review');
                    setExportModalSelected(selectedForExport);
                  } else {
                    setExportMode('pick');
                    setExportModalSelected([]);
                  }
                  setExportModalSearch('');
                  setIsExportModalOpen(true);
                }}
                className="text-[#1A1A1A] hover:bg-[#F5F5F0] border border-[#E8E8E3] bg-white text-sm font-medium h-10 px-4 rounded-full"
              >
                <Package className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Export Pack {selectedForExport.length > 0 && `(${selectedForExport.length})`}
              </Button>
              <Button
                onClick={() => openUploadForm()}
                className="bg-[#1A1A1A] text-white hover:bg-[#333333] text-sm font-medium h-10 px-4 rounded-full"
              >
                <Upload className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Upload Document
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {[
              {
                label: 'Total Documents',
                value: stats.total,
                sub: 'Stored safely',
                Icon: FolderOpen,
                iconCls: 'text-[#FBBF24]',
                iconBg: 'bg-[#FEF9E7]',
                valCls: 'text-[#1A1A1A]',
              },
              {
                label: 'Expiring Soon',
                value: stats.expiring,
                sub: 'Within 30 days',
                Icon: AlertTriangle,
                iconCls: 'text-orange-500',
                iconBg: 'bg-orange-50',
                valCls: stats.expiring > 0 ? 'text-orange-600' : 'text-[#1A1A1A]',
              },
              {
                label: 'Expired',
                value: stats.expired,
                sub: 'Need attention',
                Icon: AlertTriangle,
                iconCls: 'text-[#DC2626]',
                iconBg: 'bg-[#FEF2F2]',
                valCls: stats.expired > 0 ? 'text-[#DC2626]' : 'text-[#1A1A1A]',
              },
              {
                label: 'Compliance',
                value: stats.compliance,
                sub: 'Certificates',
                Icon: FileText,
                iconCls: 'text-[#FBBF24]',
                iconBg: 'bg-[#FEF9E7]',
                valCls: 'text-[#1A1A1A]',
              },
            ].map(s => (
              <div key={s.label} className="bg-[#F5F5F0] rounded-[16px] px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#6B6B6B] text-sm">{s.label}</span>
                  <div className={`h-8 w-8 rounded-full ${s.iconBg} flex items-center justify-center`}>
                    <s.Icon className={`w-4 h-4 ${s.iconCls}`} strokeWidth={1.5} />
                  </div>
                </div>
                <p className={`text-2xl font-semibold ${s.valCls}`}>{s.value}</p>
                <p className="text-[#8B8B8B] text-xs mt-1">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Expiring banner */}
        {expiringDocs.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-[16px] px-5 py-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                {expiringDocs.length} document{expiringDocs.length !== 1 ? 's' : ''} expiring within 30 days
              </p>
              <p className="text-xs text-yellow-700 mt-0.5">{expiringDocs.map(d => d.name).join(' · ')}</p>
            </div>
          </div>
        )}

        {/* Home Pack promo — shown when 3+ docs exist */}
        {allDocs.length >= 3 && (
          <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[16px] p-5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-[#FEF3C7] flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-[#FBBF24]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A]">Ready to sell or remortgage?</p>
                <p className="text-xs text-[#6B6B6B] mt-0.5">
                  Select documents below and build your Home Pack — share with your solicitor or estate agent.
                </p>
              </div>
            </div>
            <Button
              onClick={handleStartSelecting}
              className="bg-[#FBBF24] text-[#1A1A1A] hover:bg-[#F59E0B] text-sm font-medium h-9 px-4 rounded-full shrink-0"
            >
              Start selecting
            </Button>
          </div>
        )}

        {/* Table card */}
        <div className="bg-white rounded-[20px] p-4 md:p-6 border border-[#E8E8E3]">
          {/* Search + Tabs */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
              <Input placeholder="Search documents…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {CATEGORY_TABS.map(tab => {
                const isTenancy = tab.id === 'tenancy';
                const isHomeownerOnly = isTenancy && primaryProperty?.role === 'homeowner';
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    title={isTenancy ? 'For rental properties — landlord agreements, tenancy deposits, inventories' : undefined}
                    className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                      activeTab === tab.id ? 'bg-[#1A1A1A] text-white' : 'text-[#4A4A4A] hover:bg-[#F5F5F0]'
                    } ${isHomeownerOnly ? 'opacity-40' : ''}`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Select all */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-end mb-3">
              {selectedForExport.length > 0 && (
                <span className="text-sm text-[#FBBF24] font-medium mr-3">{selectedForExport.length} selected</span>
              )}
              <label htmlFor="select-all" className="text-sm text-[#6B6B6B] cursor-pointer mr-2">
                Select all
              </label>
              <Checkbox
                id="select-all"
                checked={selectedForExport.length === allDocs.length && allDocs.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </div>
          )}

          {/* Suggested for your home */}
          {suggestedDocs.length > 0 && (
            <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <p className="text-sm font-semibold text-amber-900 mb-3">Suggested for your home</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestedDocs.map(s => (
                  <div key={s.label} className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-amber-100">
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">{s.label}</p>
                      <p className="text-xs text-[#6B6B6B]">{s.reason}</p>
                    </div>
                    <button
                      onClick={() => openUploadForm(s.discipline)}
                      className="ml-2 shrink-0 px-3 py-1.5 text-xs font-medium bg-[#1A1A1A] text-white rounded-full hover:bg-[#333] transition-colors"
                    >
                      Upload
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading skeletons */}
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-[#F5F5F0] rounded-[12px] h-16 animate-pulse" />
              ))}
            </div>
          )}

          {/* Doc list */}
          {!isLoading && (
            <div className="space-y-3" ref={docListRef}>
              {filtered.map(doc => {
                const status = expiryStatus(doc);
                return (
                  <div
                    key={doc.id}
                    className="bg-[#F5F5F0] rounded-[12px] px-5 py-4 hover:shadow-sm transition-all flex items-center gap-4"
                  >
                    <div className="h-10 w-10 rounded-[10px] bg-white border border-[#E5E7EB] flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-[#4A4A4A]" strokeWidth={1.5} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-[#1A1A1A] text-sm font-medium truncate">{doc.name}</h4>
                      <p className="text-[#6B6B6B] text-xs">
                        {tradeTypeLabel(doc.doc_type) || '—'}
                        {doc.category ? ` · ${getTradeCategoryLabel(doc.category)}` : ''} · {formatBytes(doc.file_size)}
                      </p>
                    </div>

                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#E8E8E3] text-[#4A4A4A] capitalize shrink-0">
                      {doc.discipline || 'other'}
                    </span>

                    <p className="text-[#6B6B6B] text-xs shrink-0 w-24 text-right">{format(parseISO(doc.uploaded_at), 'dd MMM yyyy')}</p>

                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${status.cls}`}>{status.label}</span>

                    {needsJobCTA(doc) && doc.doc_type && (
                      <Button
                        onClick={() => handlePostJob(doc)}
                        size="sm"
                        className="bg-[#FBBF24] text-[#1A1A1A] hover:bg-[#F59E0B] h-8 px-3 rounded-full text-xs font-medium shrink-0"
                      >
                        Post a Job
                      </Button>
                    )}

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="p-2 text-[#4A4A4A] hover:bg-[#E8E8E3] rounded-full transition-colors"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => downloadFile(doc.id, doc.file_name || doc.name)}
                        className="p-2 text-[#4A4A4A] hover:bg-[#E8E8E3] rounded-full transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEdit(doc)}
                        className="p-2 text-[#4A4A4A] hover:bg-[#E8E8E3] rounded-full transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteDocId(doc.id)}
                        className="p-2 text-[#6B6B6B] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-full transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className={`shrink-0 pl-2 border-l transition-colors ${highlightCheckboxes ? 'border-[#FBBF24]' : 'border-[#E8E8E3]'}`}>
                      <Checkbox
                        checked={selectedForExport.includes(doc.id)}
                        onCheckedChange={checked => handleExportSelection(doc.id, checked as boolean)}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Upload row */}
              <div
                className="bg-white rounded-[12px] px-5 py-4 border-2 border-dashed border-[#E8E8E3] cursor-pointer hover:bg-[#F5F5F0] hover:border-[#FBBF24] transition-all flex items-center gap-4"
                onClick={() => openUploadForm()}
              >
                <div className="h-10 w-10 rounded-[10px] bg-[#FEF9E7] flex items-center justify-center shrink-0">
                  <Upload className="w-5 h-5 text-[#FBBF24]" strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="text-[#1A1A1A] text-sm font-medium">Upload Document</h4>
                  <p className="text-[#6B6B6B] text-xs">Click to add a new document</p>
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-[#F5F5F0] flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-[#6B6B6B]" strokeWidth={1.5} />
              </div>
              <h3 className="text-[#1A1A1A] text-lg font-medium mb-2">{search ? 'No results found' : 'No documents yet'}</h3>
              <p className="text-[#6B6B6B] text-sm mb-4">
                {search ? 'Try a different search term' : 'Upload your first document to get started'}
              </p>
              {!search && (
                <Button onClick={() => openUploadForm()} className="bg-[#1A1A1A] text-white hover:bg-[#333333] rounded-full">
                  <Upload className="w-4 h-4 mr-2" /> Upload Document
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Upload dialog */}
        <DocsUploadDialog openForm={openForm} setOpenForm={setOpenForm} refetch={refetch} prefillDiscipline={prefillDiscipline} />

        {/* Post-a-Job dialog (prefilled from a doc) */}
        <Quote open={quoteOpen} setOpen={setQuoteOpen} prefill={quotePrefill} />

        {/* Export modal */}
        <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Export Home Pack</DialogTitle>
            </DialogHeader>

            {exportMode === 'pick' ? (
              /* ── Pick mode: choose from all documents ── */
              <div className="py-2">
                <p className="text-sm text-[#6B6B6B] mb-3">
                  Select the documents you want to include in your ZIP pack.
                </p>
                {/* Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B8B8B]" strokeWidth={1.5} />
                  <input
                    type="text"
                    placeholder="Search documents…"
                    value={exportModalSearch}
                    onChange={e => setExportModalSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-[#E8E8E3] rounded-lg bg-white outline-none focus:border-[#1A1A1A] transition-colors"
                  />
                </div>
                {/* Document list */}
                <div className="space-y-1 max-h-[320px] overflow-y-auto pr-1">
                  {allDocs
                    .filter(d => {
                      const q = exportModalSearch.toLowerCase();
                      return !q || d.name.toLowerCase().includes(q) || (d.file_name ?? '').toLowerCase().includes(q);
                    })
                    .map(doc => {
                      const checked = exportModalSelected.includes(doc.id);
                      return (
                        <label
                          key={doc.id}
                          className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer hover:bg-[#F5F5F0] transition-colors"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={v => {
                              setExportModalSelected(prev =>
                                v ? [...prev, doc.id] : prev.filter(id => id !== doc.id),
                              );
                            }}
                          />
                          <FileText className="w-4 h-4 text-[#6B6B6B] shrink-0" strokeWidth={1.5} />
                          <span className="text-sm text-[#1A1A1A] flex-1 truncate">{doc.name}</span>
                          {doc.discipline && doc.discipline !== 'other' && (
                            <span className="text-[11px] text-[#6B6B6B] bg-[#F5F5F0] border border-[#E8E8E3] rounded-full px-2 py-0.5 shrink-0 capitalize">
                              {doc.discipline.replace(/_/g, ' ')}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  {allDocs.length === 0 && (
                    <p className="text-sm text-[#8B8B8B] text-center py-6">No documents uploaded yet.</p>
                  )}
                </div>
                {/* Footer */}
                <div className="flex items-center justify-between pt-4 mt-1 border-t border-[#E8E8E3]">
                  <span className="text-sm text-[#6B6B6B]">
                    {exportModalSelected.length > 0
                      ? `${exportModalSelected.length} document${exportModalSelected.length !== 1 ? 's' : ''} selected`
                      : 'No documents selected'}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" className="text-black hover:bg-gray-100" onClick={() => setIsExportModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      className="bg-[#1A1A1A] text-white hover:bg-[#333333]"
                      disabled={exportModalSelected.length === 0 || exportLoading}
                      onClick={async () => {
                        setExportLoading(true);
                        try {
                          await exportDocumentPack(exportModalSelected);
                          setIsExportModalOpen(false);
                          setSelectedForExport([]);
                          setExportModalSelected([]);
                        } catch {
                          toast.error('Failed to generate pack. Please try again.');
                        } finally {
                          setExportLoading(false);
                        }
                      }}
                    >
                      {exportLoading ? 'Generating…' : 'Download ZIP'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* ── Review mode: show pre-selected documents ── */
              <div className="py-2">
                <p className="text-sm text-[#6B6B6B] mb-3">
                  {selectedForExport.length} document{selectedForExport.length !== 1 ? 's' : ''} selected for export.
                </p>
                <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                  {allDocs
                    .filter(d => selectedForExport.includes(d.id))
                    .map(doc => (
                      <div key={doc.id} className="flex items-center gap-3 p-2.5 bg-[#F5F5F0] rounded-lg">
                        <FileText className="w-4 h-4 text-[#6B6B6B] shrink-0" strokeWidth={1.5} />
                        <span className="text-sm text-[#1A1A1A] flex-1 truncate">{doc.name}</span>
                        {doc.discipline && doc.discipline !== 'other' && (
                          <span className="text-[11px] text-[#6B6B6B] bg-white border border-[#E8E8E3] rounded-full px-2 py-0.5 shrink-0 capitalize">
                            {doc.discipline.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
                <div className="flex justify-end gap-2 pt-4 mt-1 border-t border-[#E8E8E3]">
                  <Button variant="outline" className="text-black hover:bg-gray-100" onClick={() => setIsExportModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-[#1A1A1A] text-white hover:bg-[#333333]"
                    disabled={exportLoading}
                    onClick={async () => {
                      setExportLoading(true);
                      try {
                        await exportDocumentPack(selectedForExport);
                        setIsExportModalOpen(false);
                        setSelectedForExport([]);
                      } catch {
                        toast.error('Failed to generate pack. Please try again.');
                      } finally {
                        setExportLoading(false);
                      }
                    }}
                  >
                    {exportLoading ? 'Generating…' : 'Download ZIP'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete confirm */}
        <Dialog open={!!deleteDocId} onOpenChange={() => setDeleteDocId(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete Document</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground py-2">This action cannot be undone. The document will be permanently deleted.</p>
            <div className="flex justify-end gap-2">
              <Button className="" variant="outline" onClick={() => setDeleteDocId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deleteMutation.isPending}
                onClick={() => deleteDocId && deleteMutation.mutate({ id: deleteDocId })}
              >
                {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit dialog */}
        <Dialog open={!!editDoc} onOpenChange={() => setEditDoc(null)}>
          <DialogContent className="sm:max-w-[440px]">
            <DialogHeader>
              <DialogTitle>Edit Document</DialogTitle>
            </DialogHeader>
            {editState && (
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input value={editState.name} onChange={e => setEditState(prev => (prev ? { ...prev, name: e.target.value } : prev))} />
                </div>

                <div className="space-y-1.5">
                  <Label>Document Type</Label>
                  <Select
                    value={editState.doc_type}
                    onValueChange={v => setEditState(prev => (prev ? { ...prev, doc_type: v, category: '' } : prev))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOC_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {editState.doc_type && (
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Select value={editState.category} onValueChange={v => setEditState(prev => (prev ? { ...prev, category: v } : prev))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {editTradeCategories.map(c => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>Discipline</Label>
                  <Select
                    value={editState.discipline}
                    onValueChange={v => setEditState(prev => (prev ? { ...prev, discipline: v } : prev))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select discipline" />
                    </SelectTrigger>
                    <SelectContent>
                      {DISCIPLINES.map(d => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Expiry Date</Label>
                  <Popover open={editDateOpen} onOpenChange={setEditDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn('w-full justify-start font-normal', !editState.expires_at && 'text-muted-foreground')}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editState.expires_at ? format(editState.expires_at, 'PPP') : 'No expiry date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={editState.expires_at ?? undefined}
                        onSelect={d => {
                          setEditState(prev => (prev ? { ...prev, expires_at: d ?? null } : prev));
                          setEditDateOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-1.5">
                  <Label>Notes</Label>
                  <Textarea
                    value={editState.notes}
                    onChange={e => setEditState(prev => (prev ? { ...prev, notes: e.target.value } : prev))}
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setEditDoc(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleEditSave} disabled={editMutation.isPending}>
                    {editMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Save
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Preview dialog */}
        <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
          <DialogContent className="sm:max-w-[500px] rounded-[20px] border border-[#E8E8E3]">
            {previewDoc && (
              <>
                <div className="flex items-center gap-3 pb-4 border-b border-[#E8E8E3]">
                  <div className="h-10 w-10 rounded-[10px] bg-[#F5F5F0] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-[#4A4A4A]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1A1A1A]">{previewDoc.name}</h3>
                    <p className="text-xs text-[#6B6B6B]">
                      {tradeTypeLabel(previewDoc.doc_type) || '—'}
                      {previewDoc.category ? ` · ${getTradeCategoryLabel(previewDoc.category)}` : ''}
                      {previewDoc.discipline ? ` · ${previewDoc.discipline}` : ''}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 py-2">
                  {(
                    [
                      { label: 'File name', value: previewDoc.file_name || '—' },
                      { label: 'File size', value: formatBytes(previewDoc.file_size) },
                      { label: 'Uploaded', value: format(parseISO(previewDoc.uploaded_at), 'dd MMM yyyy, HH:mm') },
                      { label: 'Last updated', value: format(parseISO(previewDoc.updated_at), 'dd MMM yyyy, HH:mm') },
                      {
                        label: 'Expiry',
                        value: previewDoc.expires_at ? format(parseISO(previewDoc.expires_at), 'dd MMM yyyy') : 'No expiry',
                      },
                      previewDoc.notes ? { label: 'Notes', value: previewDoc.notes } : null,
                      previewDoc.property_address ? { label: 'Property', value: previewDoc.property_address } : null,
                    ] as Array<{ label: string; value: string } | null>
                  )
                    .filter((r): r is { label: string; value: string } => r !== null)
                    .map(row => (
                      <div key={row.label} className="flex justify-between text-sm">
                        <span className="text-[#6B6B6B]">{row.label}</span>
                        <span className="text-[#1A1A1A] font-medium text-right max-w-[280px] break-words">{row.value}</span>
                      </div>
                    ))}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E8E3]">
                  <Button variant="outline" onClick={() => downloadFile(previewDoc.id, previewDoc.file_name || previewDoc.name)}>
                    <Download className="w-3.5 h-3.5 mr-2" strokeWidth={1.5} />
                    Download
                  </Button>
                  <Button className="bg-[#1A1A1A] text-white hover:bg-[#333333]" onClick={() => setPreviewDoc(null)}>
                    Close
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Documents;
