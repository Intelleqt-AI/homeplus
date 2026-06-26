import { useState, useMemo, useRef } from 'react';
import {
  Upload, Download, Eye, Trash2, FileText, Package, FolderOpen,
  Search, AlertTriangle, Pencil, Loader2, CalendarIcon, MoreHorizontal,
  SlidersHorizontal, ChevronRight,
  ShieldCheck, Umbrella, Leaf, BookOpen, ClipboardList, Ruler,
  Landmark, Key, Layers, HelpCircle, BadgeCheck, Zap,
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteFile, updateDocument, getDocumentDownloadUrl, type NormDoc, type DocumentUpdatePayload, type PaginatedResponse } from '@/lib/Api';
import DocsUploadDialog from '@/components/docsUploadDialog';
import { exportDocumentPack, fetchDocumentSummary, type DocumentSummary } from '@/lib/Api2';
import Quote, { type QuotePrefill } from '@/components/topbar/Quote';
import { cn } from '@/lib/utils';
import { TRADE_OPTIONS, DISCIPLINE_OPTIONS, tradeCategoriesByType, getTradeCategoryLabel } from '@/lib/tradeCategories';

// ── Category config ────────────────────────────────────────────────────────────

type CatEntry = { name: string; color: string; bg: string; Icon: React.ElementType };
const CAT_CONFIG: Record<string, CatEntry> = {
  compliance:         { name: 'Compliance',         color: '#A855F7', bg: '#F3E8FF', Icon: ShieldCheck },
  warranty:           { name: 'Warranty',           color: '#6366F1', bg: '#E0E7FF', Icon: BadgeCheck },
  insurance:          { name: 'Insurance',           color: '#3B82F6', bg: '#DBEAFE', Icon: Umbrella },
  energy_epc:         { name: 'Energy & EPC',        color: '#10B981', bg: '#DCFCE7', Icon: Leaf },
  manuals_appliances: { name: 'Manuals',             color: '#F59E0B', bg: '#FEF3C7', Icon: BookOpen },
  surveys_reports:    { name: 'Surveys',             color: '#64748B', bg: '#E2E8F0', Icon: ClipboardList },
  tenancy:            { name: 'Tenancy',             color: '#F43F5E', bg: '#FFE4E6', Icon: Key },
  purchase:           { name: 'Purchase',            color: '#0EA5E9', bg: '#E0F2FE', Icon: Landmark },
  planning:           { name: 'Planning',            color: '#14B8A6', bg: '#CCFBF1', Icon: Ruler },
  utility:            { name: 'Utility',             color: '#F97316', bg: '#FFEDD5', Icon: Zap },
  other:              { name: 'Other',               color: '#71717A', bg: '#F4F4F5', Icon: FolderOpen },
};

// ── Existing helpers (unchanged) ───────────────────────────────────────────────

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
  if (!doc.expires_at) return { label: 'No expiry', cls: 'bg-[#F5F5F0] text-[#6B6B6B]' };
  if (doc.is_expired) return { label: 'Expired', cls: 'bg-red-50 text-red-600' };
  const days = Math.ceil((new Date(doc.expires_at).getTime() - Date.now()) / 86_400_000);
  if (days <= 30) return { label: `${days}d left`, cls: 'bg-yellow-50 text-yellow-700' };
  return { label: 'Valid', cls: 'bg-green-50 text-green-700' };
};

const needsJobCTA = (doc: NormDoc): boolean => {
  if (!doc.expires_at) return false;
  if (doc.is_expired) return true;
  const days = Math.ceil((new Date(doc.expires_at).getTime() - Date.now()) / 86_400_000);
  return days >= 0 && days <= 7;
};

interface EditState {
  name: string; doc_type: string; category: string; discipline: string;
  expires_at: Date | null; notes: string;
}

// Request page_size=100 (backend max) so a typical user's full library comes
// down in one shot. Counts still come from /documents/summary/ below — they
// stay correct even if a user exceeds 100 docs.
const DOCS_URL = '/api/v1/documents/?page_size=100';
const EXPIRY_URL = '/api/v1/documents/expiring/?page_size=100';

// ── Component ─────────────────────────────────────────────────────────────────

const Documents = () => {
  const queryClient = useQueryClient();

  const [openForm, setOpenForm] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sort, setSort] = useState<'recent' | 'name' | 'expiry'>('recent');
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
  const docListRef = useRef<HTMLDivElement>(null);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quotePrefill, setQuotePrefill] = useState<QuotePrefill | undefined>();
  const [mobileActionDoc, setMobileActionDoc] = useState<NormDoc | null>(null);
  const [mobileCatOpen, setMobileCatOpen] = useState(false);

  const openUploadForm = (discipline?: string) => {
    setPrefillDiscipline(discipline ?? (activeTab !== 'all' ? activeTab : undefined));
    setOpenForm(true);
  };

  const handlePostJob = (doc: NormDoc) => {
    const tradeLabel = TRADE_OPTIONS.find(t => t.value === doc.doc_type)?.label;
    const categoryLabel = doc.category ? getTradeCategoryLabel(doc.category) : undefined;
    setQuotePrefill({ title: doc.name, service: tradeLabel, category: categoryLabel });
    setQuoteOpen(true);
  };

  // ── Data fetching ──────────────────────────────────────────────────────────

  const { data: docsPage, isLoading, refetch } = useFetch<PaginatedResponse<NormDoc>>(DOCS_URL);
  const allDocs = useMemo<NormDoc[]>(() => docsPage?.results ?? [], [docsPage]);

  const { data: expiringPage } = useFetch<PaginatedResponse<NormDoc>>(EXPIRY_URL);

  // Authoritative counts come from /documents/summary/ — same query key the
  // dashboard uses, so both pages share cache and always agree.
  const { data: summaryRes } = useQuery({
    queryKey: ['documents-summary'],
    queryFn: fetchDocumentSummary,
  });
  const summary: DocumentSummary = summaryRes?.data ?? { total: 0, valid: 0, expiring: 0, expired: 0, by_discipline: {} };

  // refetch wrapper that also busts the shared summary cache, so dashboard
  // and Documents page tick together after an upload/delete/edit.
  const refetchAll = useMemo(() => () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['documents-summary'] });
  }, [refetch, queryClient]);

  const { data: propertiesRes } = useFetch<{ results?: { id: string; role: string; heating_type?: string; year_built?: number }[]; data?: { id: string; role: string; heating_type?: string; year_built?: number }[] }>('/api/v1/properties/');
  const primaryProperty = useMemo(() => {
    const list = propertiesRes?.results ?? propertiesRes?.data ?? [];
    return list[0] ?? null;
  }, [propertiesRes]);
  const expiringDocs = useMemo<NormDoc[]>(() => expiringPage?.results ?? [], [expiringPage]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const deleteMutation = useDelete({
    mutationFn: deleteFile,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: [DOCS_URL] });
      queryClient.refetchQueries({ queryKey: [EXPIRY_URL] });
      queryClient.invalidateQueries({ queryKey: ['documents-summary'] });
      queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
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
      queryClient.invalidateQueries({ queryKey: ['documents-summary'] });
      setEditDoc(null);
      toast.success('Document updated.');
    },
    onError: () => toast.error('Failed to update document.'),
  });

  const openEdit = (doc: NormDoc) => {
    setEditDoc(doc);
    setEditState({
      name: doc.name, doc_type: doc.doc_type, category: doc.category,
      discipline: doc.discipline || 'other', expires_at: doc.expires_at ? new Date(doc.expires_at) : null,
      notes: doc.notes,
    });
  };

  const handleEditSave = () => {
    if (!editDoc || !editState) return;
    editMutation.mutate({
      id: editDoc.id,
      data: {
        name: editState.name.trim() || editDoc.name,
        doc_type: editState.doc_type, category: editState.category, discipline: editState.discipline,
        expires_at: editState.expires_at ? editState.expires_at.toISOString().split('T')[0] : null,
        notes: editState.notes,
      },
    });
  };

  const editTradeCategories = editState?.doc_type ? (tradeCategoriesByType[editState.doc_type] ?? []) : [];

  // ── Computed ───────────────────────────────────────────────────────────────

  const stats = useMemo(() => ({
    total: summary.total,
    expiring: summary.expiring,
    expired: summary.expired,
    compliance: summary.by_discipline?.compliance ?? 0,
  }), [summary]);

  const docsByDiscipline = useMemo(() => {
    const map: Record<string, NormDoc[]> = {};
    allDocs.forEach(d => {
      if (!map[d.discipline]) map[d.discipline] = [];
      map[d.discipline].push(d);
    });
    return map;
  }, [allDocs]);

  const calendarData = useMemo(() => {
    const map: Record<number, { tone: 'done' | 'warn' | 'future'; docs: string[] }> = {};
    allDocs.forEach(doc => {
      if (!doc.expires_at) return;
      const expiry = new Date(doc.expires_at);
      const m = expiry.getMonth();
      const days = Math.ceil((expiry.getTime() - Date.now()) / 86_400_000);
      const tone: 'done' | 'warn' | 'future' = days < 0 ? 'done' : days <= 90 ? 'warn' : 'future';
      if (!map[m]) map[m] = { tone, docs: [] };
      map[m].docs.push(doc.name);
    });
    return map;
  }, [allDocs]);

  const filtered = useMemo(() => {
    let docs = allDocs;
    if (activeTab !== 'all') docs = docs.filter(d => d.discipline === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      docs = docs.filter(d => d.name.toLowerCase().includes(q) || d.notes?.toLowerCase().includes(q) || d.file_name?.toLowerCase().includes(q));
    }
    return docs;
  }, [allDocs, activeTab, search]);

  const sorted = useMemo(() => {
    const docs = [...filtered];
    if (sort === 'name') docs.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'expiry') {
      const rank = (d: NormDoc) => {
        if (!d.expires_at) return 3;
        if (d.is_expired) return 0;
        const days = Math.ceil((new Date(d.expires_at).getTime() - Date.now()) / 86_400_000);
        return days <= 30 ? 1 : 2;
      };
      docs.sort((a, b) => rank(a) - rank(b));
    }
    return docs;
  }, [filtered, sort]);

  const suggestedDocs = useMemo(() => {
    // A suggestion is satisfied if a doc is in the right discipline AND its
    // category matches exactly OR is unspecific ('' / 'other'). Discipline-grouped
    // categories (epc_certificate, boiler_manual) can't be set via the trade-scoped
    // upload dialog, so an uploaded EPC lands as energy_epc/'other' — match on that.
    const UNSPECIFIC_CATS = new Set(['', 'other']);
    const hasDisc = (discipline: string, category?: string) =>
      allDocs.some(d =>
        d.discipline === discipline &&
        (!category || d.category === category || UNSPECIFIC_CATS.has((d.category ?? '').toLowerCase()))
      );
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
        fetch(url).then(r => {
          if (!r.ok) throw new Error('Download failed');
          return r.blob();
        }).then(blob => {
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
    setSelectedForExport(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
  const handleSelectAll = (checked: boolean) => setSelectedForExport(checked ? allDocs.map(d => d.id) : []);

  // PackBuilder list — every real document (selected first), scrollable in the card.
  const PACK_ITEMS = [
    ...allDocs.filter(d => selectedForExport.includes(d.id)).map(d => ({ id: d.id, name: d.name, inPack: true })),
    ...allDocs.filter(d => !selectedForExport.includes(d.id)).map(d => ({ id: d.id, name: d.name, inPack: false })),
  ];
  const packReadiness = allDocs.length > 0 ? Math.round((selectedForExport.length / allDocs.length) * 100) : 0;
  const allSelected = allDocs.length > 0 && selectedForExport.length === allDocs.length;

  const MONTHS_SHORT = ['J','F','M','A','M','J','J','A','S','O','N','D'];
  const MONTHS_FULL = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const currentMonth = new Date().getMonth();

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="space-y-4">

        {/* ── DocsHero ─────────────────────────────────────── */}
        <div className="bg-white rounded-[18px] border border-[#E8E8E3] p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8B8B8B]">Document pack</p>
              <h1 className="text-[26px] font-bold tracking-tight text-[#1A1A1A] mt-0.5 leading-none">Your home paperwork</h1>
              <p className="text-[13px] text-[#6B6B6B] mt-1.5">Stored safely, organised by category, exportable as a moving pack.</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Total files', value: String(stats.total), Icon: FileText, tint: '#F5F5F0', color: '#1A1A1A' },
                { label: 'Compliance', value: String(stats.compliance), Icon: ShieldCheck, tint: '#F3E8FF', color: '#A855F7' },
                { label: 'Expiring', value: String(stats.expiring), Icon: AlertTriangle, tint: '#FFFBEB', color: '#F59E0B' },
                { label: 'Expired', value: String(stats.expired), Icon: AlertTriangle, tint: '#FEF2F2', color: '#EF4444' },
              ].map(s => (
                <div key={s.label} className="text-center px-4 py-2.5 bg-[#FAFAF7] border border-[#E8E8E3] rounded-[14px] flex flex-col items-center justify-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <span className="h-5 w-5 rounded-full flex items-center justify-center"
                      style={{ background: s.tint, color: s.color }}>
                      <s.Icon className="w-2.5 h-2.5" />
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8B8B8B]">{s.label}</span>
                  </div>
                  <span className="text-[22px] font-bold tracking-tight text-[#1A1A1A] leading-none">{s.value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => openUploadForm()}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full bg-[#1A1A1A] text-white text-sm font-medium hover:bg-[#333] transition-colors w-full sm:w-auto"
              >
                <Upload className="w-4 h-4" /> Upload document
              </button>
            </div>
          </div>
        </div>

        {/* ── Two-column layout ──────────────────────────────── */}
        <div className="flex flex-col gap-4 items-start lg:flex-row">

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">

            {/* MissingEssentials */}
            {suggestedDocs.length > 0 && (
              <div className="bg-white rounded-[18px] border border-[#E8E8E3] p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-[#F5F5F0] rounded-full flex items-center justify-center">
                      <HelpCircle className="w-4 h-4 text-[#1A1A1A]" />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8B8B8B]">Missing essentials</span>
                  </div>
                  <span className="text-[11px] text-[#8B8B8B]">{suggestedDocs.length} of 27 essential docs to go</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {suggestedDocs.map(s => (
                    <div key={s.label} className="flex flex-col gap-2.5 p-3.5 rounded-[14px] bg-[#FAFAF7] border border-dashed border-[#E4E4DE]">
                      <div className="flex items-center gap-2.5">
                        <span className="h-8 w-8 rounded-[10px] bg-white border border-[#E8E8E3] text-[#4A4A4A] flex items-center justify-center shrink-0">
                          {CAT_CONFIG[s.discipline]
                            ? (() => { const C = CAT_CONFIG[s.discipline].Icon; return <C className="w-4 h-4" />; })()
                            : <FileText className="w-4 h-4" />}
                        </span>
                        <span className="text-[13px] font-semibold text-[#1A1A1A]">{s.label}</span>
                      </div>
                      <p className="text-[11.5px] text-[#6B6B6B] leading-snug">{s.reason}</p>
                      <div className="flex gap-1.5 mt-auto">
                        <button
                          onClick={() => openUploadForm(s.discipline)}
                          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors"
                        >
                          <Upload className="w-3 h-3" /> Upload
                        </button>
                        <button className="text-xs font-medium px-3 py-1.5 rounded-full border border-[#E8E8E3] text-[#4A4A4A] hover:bg-[#F5F5F0] transition-colors">
                          Remind me
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Categories — mobile: filter button / desktop: full grid */}
            {/* Mobile filter button */}
            <div className="sm:hidden">
              {(() => {
                const activeCat = activeTab === 'all' ? null : CAT_CONFIG[activeTab];
                const ActiveIcon = activeCat?.Icon ?? Layers;
                const activeName = activeCat?.name ?? 'All documents';
                const activeCount = activeTab === 'all' ? stats.total : (summary.by_discipline?.[activeTab] ?? 0);
                return (
                  <button
                    onClick={() => setMobileCatOpen(true)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 bg-white rounded-[16px] border border-[#E8E8E3] hover:border-[#FBBF24]/60 transition-colors"
                  >
                    <span className="h-9 w-9 rounded-[11px] flex items-center justify-center shrink-0"
                      style={{ background: activeCat?.bg ?? '#EEEEEA', color: activeCat?.color ?? '#1A1A1A' }}>
                      <ActiveIcon className="w-4 h-4" />
                    </span>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#8B8B8B]">Category filter</p>
                      <p className="text-[13.5px] font-bold text-[#1A1A1A] truncate">{activeName}</p>
                    </div>
                    <span className="text-[13px] font-bold text-[#1A1A1A] mr-1">{activeCount}</span>
                    <SlidersHorizontal className="w-4 h-4 text-[#9B9B9B] shrink-0" />
                  </button>
                );
              })()}
            </div>

            {/* Desktop categories grid */}
            <div className="hidden sm:block bg-white rounded-[18px] border border-[#E8E8E3] p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-[#F5F5F0] rounded-full flex items-center justify-center">
                    <FolderOpen className="w-4 h-4 text-[#1A1A1A]" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8B8B8B]">Categories</span>
                </div>
              </div>
              <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}>
                <button
                  onClick={() => setActiveTab('all')}
                  className={`text-left p-4 rounded-[14px] border flex flex-col gap-3 transition-all ${activeTab === 'all' ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white' : 'bg-[#FAFAF7] border-[#E8E8E3] text-[#1A1A1A] hover:border-[#FBBF24]/60'}`}
                >
                  <div className="flex items-start justify-between">
                    <span className={`h-9 w-9 rounded-[11px] flex items-center justify-center ${activeTab === 'all' ? 'bg-[#FBBF24]' : 'bg-[#EEEEEA]'}`} style={{ color: '#1A1A1A' }}>
                      <Layers className="w-4 h-4" />
                    </span>
                    <span className="text-[18px] font-bold tracking-tight">{stats.total}</span>
                  </div>
                  <p className="text-[13px] font-semibold">All documents</p>
                  <span className={`text-[10.5px] ${activeTab === 'all' ? 'text-white/55' : 'text-[#8B8B8B]'}`}>Across every category</span>
                </button>
                {Object.entries(CAT_CONFIG).map(([key, cat]) => {
                  const have = summary.by_discipline?.[key] ?? 0;
                  const active = activeTab === key;
                  const lastDoc = docsByDiscipline[key]?.sort((a, b) =>
                    new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())[0];
                  const lastDate = lastDoc ? format(parseISO(lastDoc.uploaded_at), 'dd MMM') : null;
                  return (
                    <button key={key} onClick={() => setActiveTab(key)}
                      className="text-left p-4 rounded-[14px] border flex flex-col gap-3 transition-all"
                      style={{
                        background: active ? '#fff' : '#FAFAF7',
                        borderColor: active ? cat.color : '#E8E8E3',
                        boxShadow: active ? `0 0 0 3px ${cat.bg}` : 'none',
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <span className="h-9 w-9 rounded-[11px] flex items-center justify-center"
                          style={{ background: cat.bg, color: cat.color }}>
                          <cat.Icon className="w-4 h-4" />
                        </span>
                        <span className="text-[18px] font-bold tracking-tight text-[#1A1A1A]">{have}</span>
                      </div>
                      <p className="text-[13px] font-semibold text-[#1A1A1A] leading-snug">{cat.name}</p>
                      <span className="text-[10.5px] text-[#8B8B8B]">{lastDate ? `Last ${lastDate}` : 'Empty'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Library */}
            <div className="bg-white rounded-[18px] border border-[#E8E8E3] p-5">
              {/* Library header */}
              <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-8 w-8 bg-[#F5F5F0] rounded-full flex items-center justify-center">
                      <FileText className="w-4 h-4 text-[#1A1A1A]" />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8B8B8B]">Library</span>
                  </div>
                  <h3 className="text-[20px] font-bold tracking-tight text-[#1A1A1A] pl-10">
                    {sorted.length} document{sorted.length !== 1 ? 's' : ''}
                    {activeTab !== 'all' && CAT_CONFIG[activeTab] && (
                      <span className="text-[#8B8B8B] font-normal"> in {CAT_CONFIG[activeTab].name}</span>
                    )}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8B8B8B]" />
                    <input
                      placeholder="Search documents…"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="h-9 w-full sm:w-52 pl-8 pr-4 rounded-full border border-[#E8E8E3] bg-white text-[12.5px] text-[#1A1A1A] placeholder:text-[#8B8B8B] outline-none focus:border-[#1A1A1A] transition-colors"
                    />
                  </div>
                  <select
                    value={sort}
                    onChange={e => setSort(e.target.value as 'recent' | 'name' | 'expiry')}
                    className="h-9 px-3 rounded-full border border-[#E8E8E3] bg-white text-[12.5px] text-[#4A4A4A] outline-none cursor-pointer appearance-none"
                  >
                    <option value="recent">Recently added</option>
                    <option value="name">Name A–Z</option>
                    <option value="expiry">Expiry status</option>
                  </select>
                  {selectedForExport.length > 0 && (
                    <span className="text-[12px] font-medium text-[#FBBF24]">{selectedForExport.length} selected</span>
                  )}
                </div>
              </div>

              {/* Table header row */}
              <div className="hidden sm:grid items-center gap-3 px-3.5 pb-2 border-b border-[#E8E8E3] text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#8B8B8B]
                sm:grid-cols-[36px_minmax(0,1.6fr)_minmax(0,1fr)_auto_32px]
                md:grid-cols-[36px_minmax(0,1.6fr)_minmax(0,1fr)_100px_110px_auto_32px]">
                <span />
                <span>Document</span>
                <span className="hidden sm:inline">Category</span>
                <span className="hidden md:inline">Size</span>
                <span className="hidden md:inline">Added</span>
                <span className="text-right">Status</span>
                <span />
              </div>

              {/* Doc rows */}
              {isLoading ? (
                <div className="space-y-2 mt-2">
                  {[1,2,3].map(i => <div key={i} className="h-14 rounded-[12px] bg-[#F5F5F0] animate-pulse" />)}
                </div>
              ) : (
                <div className="flex flex-col gap-0.5 mt-1" ref={docListRef}>
                  {sorted.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="h-14 w-14 rounded-full bg-[#F5F5F0] flex items-center justify-center mx-auto mb-3">
                        <FileText className="w-7 h-7 text-[#6B6B6B]" />
                      </div>
                      <p className="text-[#4A4A4A] font-medium">{search ? 'No results found' : 'No documents yet'}</p>
                      <p className="text-[#8B8B8B] text-sm mt-1">{search ? 'Try a different search' : 'Upload your first document'}</p>
                    </div>
                  ) : sorted.map(doc => {
                    const status = expiryStatus(doc);
                    const catCfg = CAT_CONFIG[doc.discipline];
                    return (
                      <div key={doc.id}
                        onClick={() => setPreviewDoc(doc)}
                        className="group grid items-center gap-3 px-3.5 py-3 rounded-[12px] hover:bg-[#FAFAF7] transition-colors cursor-pointer
                          grid-cols-[36px_minmax(0,1fr)_32px]
                          sm:grid-cols-[36px_minmax(0,1.6fr)_minmax(0,1fr)_auto_32px]
                          md:grid-cols-[36px_minmax(0,1.6fr)_minmax(0,1fr)_100px_110px_auto_32px]"
                      >
                        <span className="h-9 w-9 rounded-[10px] flex items-center justify-center shrink-0"
                          style={{ background: catCfg?.bg ?? '#F5F5F0', color: catCfg?.color ?? '#6B6B6B' }}>
                          {catCfg ? <catCfg.Icon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[13.5px] font-semibold text-[#1A1A1A] truncate">{doc.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="text-[11.5px] text-[#6B6B6B] truncate">{(catCfg?.name ?? tradeTypeLabel(doc.doc_type)) || '—'}</p>
                            <span className={`sm:hidden shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${status.cls}`}>{status.label}</span>
                          </div>
                        </div>
                        {/* Mobile: tap to open action sheet */}
                        <button
                          className="sm:hidden flex items-center justify-center w-8 h-8 rounded-full hover:bg-[#E8E8E3] text-[#9B9B9B]"
                          onClick={e => { e.stopPropagation(); setMobileActionDoc(doc); }}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {/* Desktop: category */}
                        <span className="hidden sm:inline-block text-[12px] text-[#6B6B6B] truncate">{catCfg?.name ?? doc.discipline}</span>
                        <span className="hidden md:inline-block text-[12px] text-[#6B6B6B]">{formatBytes(doc.file_size)}</span>
                        <span className="hidden md:inline-block text-[12px] text-[#6B6B6B]">{format(parseISO(doc.uploaded_at), 'dd MMM yyyy')}</span>
                        {/* Status + actions: desktop only */}
                        <div className="hidden sm:flex flex-wrap items-center justify-end gap-1.5 min-w-0" onClick={e => e.stopPropagation()}>
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${status.cls}`}>{status.label}</span>
                          <div className="flex md:hidden md:group-hover:flex items-center gap-0.5 flex-wrap justify-end">
                            <button onClick={e => { e.stopPropagation(); setPreviewDoc(doc); }} className="p-1 rounded-full hover:bg-[#E8E8E3] text-[#6B6B6B]" title="Preview">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={e => { e.stopPropagation(); downloadFile(doc.id, doc.file_name || doc.name); }} className="p-1 rounded-full hover:bg-[#E8E8E3] text-[#6B6B6B]" title="Download">
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={e => { e.stopPropagation(); openEdit(doc); }} className="p-1 rounded-full hover:bg-[#E8E8E3] text-[#6B6B6B]" title="Edit">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={e => { e.stopPropagation(); setDeleteDocId(doc.id); }} className="p-1 rounded-full hover:bg-[#FEF2F2] text-[#6B6B6B] hover:text-red-500" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            {needsJobCTA(doc) && (
                              <button onClick={e => { e.stopPropagation(); handlePostJob(doc); }} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#FBBF24] text-[#1A1A1A] hover:bg-[#F59E0B] transition-colors ml-1">
                                Post Job
                              </button>
                            )}
                          </div>
                        </div>
                        {/* Checkbox: desktop only */}
                        <span className="hidden sm:block" onClick={e => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedForExport.includes(doc.id)}
                            onCheckedChange={checked => handleExportSelection(doc.id, checked as boolean)}
                          />
                        </span>
                      </div>
                    );
                  })}

                  {/* Dropzone */}
                  <button
                    onClick={() => openUploadForm()}
                    className="w-full mt-2 flex items-center justify-center gap-3 p-4 rounded-[12px] border-2 border-dashed border-[#E4E4DE] bg-[#FAFAF7] hover:border-[#FBBF24] hover:bg-[#FFFBEB] transition-all text-[#6B6B6B]"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="text-[12.5px]">Drag & drop a file here, or <b className="text-[#1A1A1A]">browse</b> · PDF, JPG, PNG up to 25 MB</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Right rail ────────────────────────────────────── */}
          <div className="w-full shrink-0 flex flex-col gap-4 lg:w-[290px] lg:sticky lg:top-[80px]">

            {/* PackBuilder */}
            <div className="rounded-[18px] p-5" style={{ background: '#1A1A1A' }}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <Package className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/60">Moving pack</span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                  {selectedForExport.length} / {allDocs.length}
                </span>
              </div>
              <h3 className="text-[20px] font-bold tracking-tight text-white mt-3.5 mb-1">One pack, ready when you move</h3>
              <p className="text-[12px] text-white/55 leading-relaxed">Add docs new owners ask for. Hand it over as a single ZIP.</p>
              {allDocs.length === 0 ? (
                /* New user — no documents to build a pack from yet */
                <div className="mt-4 flex flex-col items-center text-center py-6">
                  <div className="h-12 w-12 rounded-full flex items-center justify-center mb-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <FileText className="w-5 h-5 text-white/40" />
                  </div>
                  <p className="text-[13px] font-semibold text-white/80">No documents uploaded yet</p>
                  <p className="text-[11px] text-white/45 mt-1 max-w-[210px] leading-relaxed">Upload your documents to build a moving pack to hand over when you sell.</p>
                  <button onClick={() => openUploadForm()}
                    className="mt-3.5 flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-[12.5px] font-semibold bg-[#FBBF24] text-[#1A1A1A] hover:bg-[#F59E0B] transition-colors">
                    <Upload className="w-3.5 h-3.5" /> Upload document
                  </button>
                </div>
              ) : (
                <>
                  {/* Progress */}
                  <div className="mt-3.5 p-3.5 rounded-[12px]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className="text-white/55">Pack readiness</span>
                      <span className="text-white font-semibold">{packReadiness}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-full rounded-full bg-[#FBBF24] transition-all" style={{ width: `${packReadiness}%` }} />
                    </div>
                  </div>
                  {/* Select all */}
                  <div className="flex items-center justify-between mt-3.5">
                    <span className="text-[11px] text-white/45">{selectedForExport.length} of {allDocs.length} selected</span>
                    <button onClick={() => handleSelectAll(!allSelected)}
                      className="text-[11px] font-semibold text-[#FBBF24] hover:text-[#F59E0B] transition-colors">
                      {allSelected ? 'Clear all' : 'Select all'}
                    </button>
                  </div>
                  {/* Checklist — tap a document to add/remove it from the pack (scrollable) */}
                  <div className="pack-scroll mt-2 flex flex-col overflow-y-auto pr-1" style={{ maxHeight: 220 }}>
                    {PACK_ITEMS.map((item) => (
                      <button key={item.id} type="button" onClick={() => handleExportSelection(item.id, !item.inPack)}
                        className="flex items-center gap-2.5 py-1.5 w-full text-left shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <span className="h-4 w-4 rounded-[4px] flex items-center justify-center shrink-0"
                          style={{ background: item.inPack ? '#FBBF24' : 'transparent', border: `1px solid ${item.inPack ? '#FBBF24' : 'rgba(255,255,255,0.25)'}` }}>
                          {item.inPack && (
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        <span className="flex-1 text-[12.5px] truncate" style={{ color: item.inPack ? '#fff' : 'rgba(255,255,255,0.5)' }}>{item.name}</span>
                        <span className="text-[10px]" style={{ color: item.inPack ? '#10B981' : 'rgba(255,255,255,0.35)' }}>
                          {item.inPack ? 'in pack' : 'add'}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2 mt-4">
                    <button
                      disabled={selectedForExport.length === 0 || exportLoading}
                      onClick={async () => {
                        if (selectedForExport.length === 0) {
                          setExportMode('pick'); setExportModalSelected([]); setExportModalSearch(''); setIsExportModalOpen(true);
                          return;
                        }
                        setExportLoading(true);
                        try {
                          await exportDocumentPack(selectedForExport);
                          setSelectedForExport([]);
                        } catch { toast.error('Failed to generate pack.'); }
                        finally { setExportLoading(false); }
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-full text-[13px] font-semibold bg-[#FBBF24] text-[#1A1A1A] hover:bg-[#F59E0B] transition-colors disabled:opacity-40"
                    >
                      <Download className="w-4 h-4" />
                      {exportLoading ? 'Generating…' : selectedForExport.length > 0 ? 'Export pack (ZIP)' : 'Select documents'}
                    </button>
                    <button
                      disabled={exportLoading}
                      onClick={async () => {
                        if (selectedForExport.length === 0) {
                          setExportMode('pick'); setExportModalSelected([]); setExportModalSearch(''); setIsExportModalOpen(true);
                          return;
                        }
                        setExportLoading(true);
                        try {
                          await exportDocumentPack(selectedForExport);
                          const count = selectedForExport.length;
                          const subject = encodeURIComponent('Home documentation pack');
                          const body = encodeURIComponent(
                            `Hi,\n\nPlease find attached my home documentation pack (${count} document${count === 1 ? '' : 's'}) for the property. Let me know if you need anything else.\n\nThanks`
                          );
                          window.location.href = `mailto:?subject=${subject}&body=${body}`;
                          toast.success('Pack downloaded — attach the ZIP to the email that just opened.');
                          setSelectedForExport([]);
                        } catch { toast.error('Failed to prepare pack.'); }
                        finally { setExportLoading(false); }
                      }}
                      className="w-full py-2.5 rounded-full text-[13px] font-medium text-white/70 hover:text-white transition-colors disabled:opacity-40"
                      style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
                      Share with conveyancer
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* ComplianceCalendar */}
            <div className="bg-white rounded-[18px] border border-[#E8E8E3] p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-[#F5F5F0] rounded-full flex items-center justify-center">
                    <CalendarIcon className="w-4 h-4 text-[#1A1A1A]" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8B8B8B]">Compliance calendar</span>
                </div>
                <span className="text-[11px] font-semibold text-[#1A1A1A]">2026</span>
              </div>

              {/* 4×3 grid */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {MONTHS_FULL.map((month, i) => {
                  const ev = calendarData[i];
                  const isCurrent = i === currentMonth;
                  const isPast = i < currentMonth;
                  const tone = ev?.tone;
                  const hasDone = tone === 'done' || (isPast && !ev);
                  const bg = !ev
                    ? (isPast ? '#F9FFF9' : '#FAFAF7')
                    : tone === 'done' ? '#ECFDF5'
                    : tone === 'warn' ? '#FFFBEB'
                    : '#F5F5F0';
                  const borderColor = isCurrent
                    ? '#FBBF24'
                    : !ev ? '#E8E8E3'
                    : tone === 'done' ? '#A7F3D0'
                    : tone === 'warn' ? '#FDE68A'
                    : '#E8E8E3';
                  const dotColor = !ev
                    ? (isPast ? '#10B981' : '#D1D5DB')
                    : tone === 'done' ? '#10B981'
                    : tone === 'warn' ? '#F59E0B'
                    : '#8B8B8B';
                  return (
                    <div key={i} className="relative flex flex-col rounded-[10px] overflow-hidden"
                      style={{ border: `1.5px solid ${borderColor}`, background: bg }}>
                      {/* Color top strip */}
                      <div className="h-1 w-full" style={{ background: dotColor, opacity: 0.7 }} />
                      <div className="px-2 py-2">
                        <p className="text-[11px] font-semibold text-[#4A4A4A]">{month.slice(0, 3)}</p>
                        {ev?.docs[0] && (
                          <p className="text-[9px] text-[#6B6B6B] mt-0.5 leading-tight truncate">{ev.docs[0].split(' ')[0]}</p>
                        )}
                        {!ev && isCurrent && (
                          <p className="text-[9px] font-medium text-[#FBBF24] mt-0.5">Now</p>
                        )}
                        {!ev && isPast && (
                          <p className="text-[9px] text-[#10B981] mt-0.5">Clear</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#E8E8E3] text-[10.5px] text-[#8B8B8B]">
                {[['#10B981','Done'],['#F59E0B','Expiring'],['#D1D5DB','Upcoming']].map(([c,l]) => (
                  <span key={l} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: c }} />{l}
                  </span>
                ))}
              </div>

              {/* Upcoming events list */}
              {Object.entries(calendarData).length > 0 && (
                <div className="flex flex-col gap-1.5 mt-3">
                  {Object.entries(calendarData)
                    .filter(([, entry]) => entry.tone === 'warn')
                    .slice(0, 3)
                    .map(([m, entry]) => (
                    <div key={m} className="flex items-center gap-2 p-2 rounded-[8px] bg-[#FFFBEB]">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#F59E0B]" />
                      <span className="flex-1 text-[11px] text-[#4A4A4A] truncate">{entry.docs[0]}</span>
                      <span className="text-[10px] font-medium text-[#F59E0B] shrink-0">{MONTHS_FULL[Number(m)].slice(0,3)}</span>
                    </div>
                  ))}
                  {Object.entries(calendarData).filter(([, e]) => e.tone === 'warn').length === 0 && (
                    <div className="flex items-center gap-2 p-2 rounded-[8px] bg-[#ECFDF5]">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#10B981]" />
                      <span className="text-[11px] text-[#047857]">All compliance docs are valid</span>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ── Dialogs (unchanged logic) ─────────────────────── */}

      <DocsUploadDialog openForm={openForm} setOpenForm={setOpenForm} refetch={refetchAll} prefillDiscipline={prefillDiscipline} />
      <Quote open={quoteOpen} setOpen={setQuoteOpen} prefill={quotePrefill} />

      {/* Export modal */}
      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Export Home Pack</DialogTitle></DialogHeader>
          {exportMode === 'pick' ? (
            <div className="py-2">
              <p className="text-sm text-[#6B6B6B] mb-3">Select the documents you want to include in your ZIP pack.</p>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B8B8B]" strokeWidth={1.5} />
                <input type="text" placeholder="Search documents…" value={exportModalSearch} onChange={e => setExportModalSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-[#E8E8E3] rounded-lg bg-white outline-none focus:border-[#1A1A1A] transition-colors" />
              </div>
              <div className="space-y-1 max-h-[320px] overflow-y-auto pr-1">
                {allDocs.filter(d => { const q = exportModalSearch.toLowerCase(); return !q || d.name.toLowerCase().includes(q) || (d.file_name ?? '').toLowerCase().includes(q); })
                  .map(doc => {
                    const checked = exportModalSelected.includes(doc.id);
                    return (
                      <label key={doc.id} className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer hover:bg-[#F5F5F0] transition-colors">
                        <Checkbox checked={checked} onCheckedChange={v => setExportModalSelected(prev => v ? [...prev, doc.id] : prev.filter(id => id !== doc.id))} />
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
                {allDocs.length === 0 && <p className="text-sm text-[#8B8B8B] text-center py-6">No documents uploaded yet.</p>}
              </div>
              <div className="flex items-center justify-between pt-4 mt-1 border-t border-[#E8E8E3]">
                <span className="text-sm text-[#6B6B6B]">{exportModalSelected.length > 0 ? `${exportModalSelected.length} selected` : 'No documents selected'}</span>
                <div className="flex gap-2">
                  <Button variant="outline" className="text-black hover:bg-gray-100" onClick={() => setIsExportModalOpen(false)}>Cancel</Button>
                  <Button className="bg-[#1A1A1A] text-white hover:bg-[#333333]" disabled={exportModalSelected.length === 0 || exportLoading}
                    onClick={async () => {
                      setExportLoading(true);
                      try { await exportDocumentPack(exportModalSelected); setIsExportModalOpen(false); setSelectedForExport([]); setExportModalSelected([]);
                      } catch { toast.error('Failed to generate pack. Please try again.'); } finally { setExportLoading(false); }
                    }}>
                    {exportLoading ? 'Generating…' : 'Download ZIP'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-2">
              <p className="text-sm text-[#6B6B6B] mb-3">{selectedForExport.length} document{selectedForExport.length !== 1 ? 's' : ''} selected for export.</p>
              <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                {allDocs.filter(d => selectedForExport.includes(d.id)).map(doc => (
                  <div key={doc.id} className="flex items-center gap-3 p-2.5 bg-[#F5F5F0] rounded-lg">
                    <FileText className="w-4 h-4 text-[#6B6B6B] shrink-0" strokeWidth={1.5} />
                    <span className="text-sm text-[#1A1A1A] flex-1 truncate">{doc.name}</span>
                    {doc.discipline && doc.discipline !== 'other' && (
                      <span className="text-[11px] text-[#6B6B6B] bg-white border border-[#E8E8E3] rounded-full px-2 py-0.5 shrink-0 capitalize">{doc.discipline.replace(/_/g, ' ')}</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-4 mt-1 border-t border-[#E8E8E3]">
                <Button variant="outline" className="text-black hover:bg-gray-100" onClick={() => setIsExportModalOpen(false)}>Cancel</Button>
                <Button className="bg-[#1A1A1A] text-white hover:bg-[#333333]" disabled={exportLoading}
                  onClick={async () => {
                    setExportLoading(true);
                    try { await exportDocumentPack(selectedForExport); setIsExportModalOpen(false); setSelectedForExport([]);
                    } catch { toast.error('Failed to generate pack. Please try again.'); } finally { setExportLoading(false); }
                  }}>
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
          <DialogHeader><DialogTitle>Delete Document</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">This action cannot be undone. The document will be permanently deleted.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteDocId(null)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteMutation.isPending}
              onClick={() => deleteDocId && deleteMutation.mutate({ id: deleteDocId })}>
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editDoc} onOpenChange={() => setEditDoc(null)}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader><DialogTitle>Edit Document</DialogTitle></DialogHeader>
          {editState && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={editState.name} onChange={e => setEditState(prev => prev ? { ...prev, name: e.target.value } : prev)} />
              </div>
              <div className="space-y-1.5">
                <Label>Document Type</Label>
                <Select value={editState.doc_type} onValueChange={v => setEditState(prev => prev ? { ...prev, doc_type: v, category: '' } : prev)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>{DOC_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {editState.doc_type && (
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={editState.category} onValueChange={v => setEditState(prev => prev ? { ...prev, category: v } : prev)}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>{editTradeCategories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Discipline</Label>
                <Select value={editState.discipline} onValueChange={v => setEditState(prev => prev ? { ...prev, discipline: v } : prev)}>
                  <SelectTrigger><SelectValue placeholder="Select discipline" /></SelectTrigger>
                  <SelectContent>{DISCIPLINES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Expiry Date</Label>
                <Popover open={editDateOpen} onOpenChange={setEditDateOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('w-full justify-start font-normal', !editState.expires_at && 'text-muted-foreground')}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editState.expires_at ? format(editState.expires_at, 'PPP') : 'No expiry date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={editState.expires_at ?? undefined}
                      onSelect={d => { setEditState(prev => prev ? { ...prev, expires_at: d ?? null } : prev); setEditDateOpen(false); }}
                      initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea value={editState.notes} onChange={e => setEditState(prev => prev ? { ...prev, notes: e.target.value } : prev)} rows={2} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditDoc(null)}>Cancel</Button>
                <Button onClick={handleEditSave} disabled={editMutation.isPending}>
                  {editMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Save
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
                {([
                  { label: 'File name', value: previewDoc.file_name || '—' },
                  { label: 'File size', value: formatBytes(previewDoc.file_size) },
                  { label: 'Uploaded', value: format(parseISO(previewDoc.uploaded_at), 'dd MMM yyyy, HH:mm') },
                  { label: 'Last updated', value: format(parseISO(previewDoc.updated_at), 'dd MMM yyyy, HH:mm') },
                  { label: 'Expiry', value: previewDoc.expires_at ? format(parseISO(previewDoc.expires_at), 'dd MMM yyyy') : 'No expiry' },
                  previewDoc.notes ? { label: 'Notes', value: previewDoc.notes } : null,
                  previewDoc.property_address ? { label: 'Property', value: previewDoc.property_address } : null,
                ] as Array<{ label: string; value: string } | null>)
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
                  <Download className="w-3.5 h-3.5 mr-2" strokeWidth={1.5} /> Download
                </Button>
                <Button className="bg-[#1A1A1A] text-white hover:bg-[#333333]" onClick={() => setPreviewDoc(null)}>Close</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      {/* ── Mobile category filter sheet ─────────────────── */}
      {mobileCatOpen && (
        <div className="sm:hidden fixed inset-0 z-50 flex items-end" onClick={() => setMobileCatOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative w-full bg-white rounded-t-[24px] pb-8 shadow-2xl max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-[#E0E0DA] rounded-full mx-auto mt-4 mb-1 shrink-0" />
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#F0F0EB] shrink-0">
              <span className="text-[15px] font-bold text-[#1A1A1A]">Filter by category</span>
              {activeTab !== 'all' && (
                <button
                  onClick={() => { setActiveTab('all'); setMobileCatOpen(false); }}
                  className="text-[12px] font-semibold text-[#FBBF24]"
                >
                  Clear
                </button>
              )}
            </div>
            {/* Category list */}
            <div className="overflow-y-auto flex-1">
              {/* All documents row */}
              <button
                onClick={() => { setActiveTab('all'); setMobileCatOpen(false); }}
                className={`w-full flex items-center gap-3 px-5 py-3.5 transition-colors ${activeTab === 'all' ? 'bg-[#FAFAF7]' : 'hover:bg-[#FAFAF7]'}`}
              >
                <span className={`h-9 w-9 rounded-[11px] flex items-center justify-center shrink-0 ${activeTab === 'all' ? 'bg-[#1A1A1A]' : 'bg-[#EEEEEA]'}`}
                  style={{ color: activeTab === 'all' ? '#FBBF24' : '#1A1A1A' }}>
                  <Layers className="w-4 h-4" />
                </span>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[13.5px] font-semibold text-[#1A1A1A]">All documents</p>
                  <p className="text-[11px] text-[#8B8B8B]">Across every category</p>
                </div>
                <span className="text-[13px] font-bold text-[#1A1A1A] mr-2">{stats.total}</span>
                {activeTab === 'all' && <ChevronRight className="w-4 h-4 text-[#FBBF24] shrink-0" />}
              </button>
              {/* Discipline rows */}
              {Object.entries(CAT_CONFIG).map(([key, cat]) => {
                const have = summary.by_discipline?.[key] ?? 0;
                const active = activeTab === key;
                const lastDoc = docsByDiscipline[key]?.sort((a, b) =>
                  new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())[0];
                const lastDate = lastDoc ? format(parseISO(lastDoc.uploaded_at), 'dd MMM') : null;
                return (
                  <button
                    key={key}
                    onClick={() => { setActiveTab(key); setMobileCatOpen(false); }}
                    className={`w-full flex items-center gap-3 px-5 py-3.5 border-t border-[#F5F5F0] transition-colors ${active ? 'bg-[#FAFAF7]' : 'hover:bg-[#FAFAF7]'}`}
                  >
                    <span className="h-9 w-9 rounded-[11px] flex items-center justify-center shrink-0"
                      style={{ background: cat.bg, color: cat.color }}>
                      <cat.Icon className="w-4 h-4" />
                    </span>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-[13.5px] font-semibold text-[#1A1A1A]">{cat.name}</p>
                      <p className="text-[11px] text-[#8B8B8B]">{lastDate ? `Last ${lastDate}` : 'Empty'}</p>
                    </div>
                    <span className="text-[13px] font-bold text-[#1A1A1A] mr-2">{have}</span>
                    {active && <ChevronRight className="w-4 h-4 shrink-0" style={{ color: cat.color }} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile action sheet ───────────────────────────── */}
      {mobileActionDoc && (() => {
        const doc = mobileActionDoc;
        const sheetCat = CAT_CONFIG[doc.discipline];
        const SheetIcon = sheetCat?.Icon ?? FileText;
        const sheetStatus = expiryStatus(doc);
        const inPack = selectedForExport.includes(doc.id);
        return (
          <div className="sm:hidden fixed inset-0 z-50 flex items-end" onClick={() => setMobileActionDoc(null)}>
            <div className="absolute inset-0 bg-black/50" />
            <div
              className="relative w-full bg-white rounded-t-[24px] p-5 pb-8 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="w-10 h-1 bg-[#E0E0DA] rounded-full mx-auto mb-5" />

              {/* Doc info */}
              <div className="flex items-center gap-3 mb-4">
                <span className="h-12 w-12 rounded-[14px] flex items-center justify-center shrink-0"
                  style={{ background: sheetCat?.bg ?? '#F5F5F0', color: sheetCat?.color ?? '#6B6B6B' }}>
                  <SheetIcon className="w-5 h-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold text-[#1A1A1A] truncate">{doc.name}</p>
                  <p className="text-[12px] text-[#6B6B6B] mt-0.5">{sheetCat?.name ?? doc.discipline}</p>
                </div>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${sheetStatus.cls}`}>
                  {sheetStatus.label}
                </span>
              </div>

              <div className="border-t border-[#F0F0EB] mb-4" />

              {/* Action grid */}
              <div className="grid grid-cols-4 gap-2.5 mb-4">
                {([
                  { icon: Eye, label: 'Preview', onClick: () => { setPreviewDoc(doc); setMobileActionDoc(null); } },
                  { icon: Download, label: 'Download', onClick: () => { downloadFile(doc.id, doc.file_name || doc.name); setMobileActionDoc(null); } },
                  { icon: Pencil, label: 'Edit', onClick: () => { openEdit(doc); setMobileActionDoc(null); } },
                  { icon: Trash2, label: 'Delete', onClick: () => { setDeleteDocId(doc.id); setMobileActionDoc(null); }, danger: true },
                ] as { icon: React.ElementType; label: string; onClick: () => void; danger?: boolean }[]).map(({ icon: Icon, label, onClick, danger }) => (
                  <button key={label} onClick={onClick}
                    className={`flex flex-col items-center gap-2 pt-3.5 pb-3 rounded-[16px] border transition-colors ${
                      danger
                        ? 'border-red-100 bg-red-50 text-red-500 active:bg-red-100'
                        : 'border-[#E8E8E3] bg-[#FAFAF7] text-[#4A4A4A] active:bg-[#EEEEE8]'
                    }`}>
                    <Icon className="w-5 h-5" />
                    <span className="text-[10.5px] font-semibold">{label}</span>
                  </button>
                ))}
              </div>

              {/* Post Job */}
              {needsJobCTA(doc) && (
                <button
                  onClick={() => { handlePostJob(doc); setMobileActionDoc(null); }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[16px] bg-[#FBBF24] text-[#1A1A1A] font-bold text-[13.5px] active:bg-[#F59E0B] transition-colors mb-3"
                >
                  Post Job
                </button>
              )}

              {/* Pack toggle */}
              <button
                onClick={() => handleExportSelection(doc.id, !inPack)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-[16px] border transition-colors ${
                  inPack
                    ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white'
                    : 'border-[#E8E8E3] bg-[#FAFAF7] text-[#4A4A4A]'
                }`}
              >
                <span className="text-[13.5px] font-semibold">
                  {inPack ? '✓ In moving pack' : 'Add to moving pack'}
                </span>
                <Package className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>
        );
      })()}
    </DashboardLayout>
  );
};

export default Documents;
