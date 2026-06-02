import { useState, useMemo } from 'react';
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
import Quote, { type QuotePrefill } from '@/components/topbar/Quote';
import { cn } from '@/lib/utils';
import { TRADE_OPTIONS, DISCIPLINE_OPTIONS, tradeCategoriesByType, getTradeCategoryLabel } from '@/lib/tradeCategories';
import { SAMPLE_DOCUMENTS } from '@/lib/sampleDocuments';

const CATEGORY_TABS = [{ id: 'all', label: 'All' }, ...DISCIPLINE_OPTIONS.map(d => ({ id: d.value, label: d.label }))];

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
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quotePrefill, setQuotePrefill] = useState<QuotePrefill | undefined>();

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
  // DEV BYPASS: fall back to fixtures so the page shows something when the
  // backend is unreachable or hasn't been seeded. See src/lib/sampleDocuments.ts.
  const allDocs = useMemo<NormDoc[]>(() => {
    const remote = docsPage?.results ?? [];
    return remote.length ? remote : SAMPLE_DOCUMENTS;
  }, [docsPage]);

  const { data: expiringPage } = useFetch<PaginatedResponse<NormDoc>>(EXPIRY_URL);
  const expiringDocs = useMemo<NormDoc[]>(() => {
    const remote = expiringPage?.results ?? [];
    if (remote.length) return remote;
    // Derive an "expiring soon / expired" list from the fixture for the stat tile.
    return SAMPLE_DOCUMENTS.filter((d) => {
      if (!d.expires_at) return false;
      if (d.is_expired) return true;
      const days = Math.ceil(
        (new Date(d.expires_at).getTime() - Date.now()) / 86_400_000
      );
      return days <= 30;
    });
  }, [expiringPage]);

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
                onClick={() => setIsExportModalOpen(true)}
                disabled={selectedForExport.length === 0}
                className="text-[#1A1A1A] hover:bg-[#F5F5F0] border border-[#E8E8E3] bg-white text-sm font-medium h-10 px-4 rounded-full disabled:opacity-50"
              >
                <Package className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Export Pack {selectedForExport.length > 0 && `(${selectedForExport.length})`}
              </Button>
              <Button
                onClick={() => setOpenForm(true)}
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

        {/* Table card */}
        <div className="bg-white rounded-[20px] p-4 md:p-6 border border-[#E8E8E3]">
          {/* Search + Tabs */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
              <Input placeholder="Search documents…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {CATEGORY_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                    activeTab === tab.id ? 'bg-[#1A1A1A] text-white' : 'text-[#4A4A4A] hover:bg-[#F5F5F0]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
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
            <div className="space-y-3">
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

                    <div className="shrink-0 pl-2 border-l border-[#E8E8E3]">
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
                onClick={() => setOpenForm(true)}
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
                <Button onClick={() => setOpenForm(true)} className="bg-[#1A1A1A] text-white hover:bg-[#333333] rounded-full">
                  <Upload className="w-4 h-4 mr-2" /> Upload Document
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Upload dialog */}
        <DocsUploadDialog openForm={openForm} setOpenForm={setOpenForm} refetch={refetch} />

        {/* Post-a-Job dialog (prefilled from a doc) */}
        <Quote open={quoteOpen} setOpen={setQuoteOpen} prefill={quotePrefill} />

        {/* Export modal */}
        <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Export Home Pack</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-[#6B6B6B] mb-4">
                {selectedForExport.length} document{selectedForExport.length !== 1 ? 's' : ''} selected.
              </p>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {allDocs
                  .filter(d => selectedForExport.includes(d.id))
                  .map(doc => (
                    <div key={doc.id} className="flex items-center gap-3 p-2 bg-[#F5F5F0] rounded-lg">
                      <FileText className="w-4 h-4 text-[#6B6B6B]" />
                      <span className="text-sm text-[#1A1A1A]">{doc.name}</span>
                    </div>
                  ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button className="text-black hover:bg-gray-200" variant="outline" onClick={() => setIsExportModalOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-[#1A1A1A] text-white hover:bg-[#333333]"
                onClick={() => {
                  toast.success(`Exporting ${selectedForExport.length} documents`);
                  setIsExportModalOpen(false);
                }}
              >
                Generate Pack
              </Button>
            </div>
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
