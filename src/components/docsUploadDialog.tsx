import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/lib/toast';
import { Camera, Upload } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadFileWithMetadata } from '@/lib/Api';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { TRADE_OPTIONS, DISCIPLINE_OPTIONS, tradeCategoriesByType } from '@/lib/tradeCategories';
import ExpiryConfirmDialog from '@/components/docsUploadDialog/ExpiryConfirmDialog';

interface Props {
  openForm: boolean;
  setOpenForm: (v: boolean) => void;
  refetch?: () => void;
  /** Pre-fill the Discipline field (e.g. pass activeTab or a suggested doc's discipline). */
  prefillDiscipline?: string;
}

type UploadedDoc = {
  id: string;
  name: string;
  doc_type?: string | null;
  expires_at?: string | null;
  /** Set when the backend auto-created the reminder on upload. */
  created_event?: string | null;
  /** OCR-suggested expiry date returned by the backend. */
  suggested_expiry?: string | null;
};

const DocsUploadDialog = ({ openForm, setOpenForm, refetch, prefillDiscipline }: Props) => {
  const [documentType, setDocumentType] = useState('');
  const [documentTradeCategory, setDocumentTradeCategory] = useState('');
  const [documentDiscipline, setDocumentDiscipline] = useState('other');
  const [documentName, setDocumentName] = useState('');
  const [documentNotes, setDocumentNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  // Appliance-specific fields (visible when discipline = manuals_appliances)
  const [applianceModel, setApplianceModel] = useState('');
  const [applianceSerial, setApplianceSerial] = useState('');
  const [lastServiced, setLastServiced] = useState('');

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const [reminderDoc, setReminderDoc] = useState<UploadedDoc | null>(null);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);

  const queryClient = useQueryClient();
  const { user } = useAuth();

  const tradeCategories = documentType ? tradeCategoriesByType[documentType] ?? [] : [];

  // When the dialog opens, apply prefillDiscipline if provided
  useEffect(() => {
    if (openForm && prefillDiscipline) {
      const valid = DISCIPLINE_OPTIONS.some(d => d.value === prefillDiscipline);
      setDocumentDiscipline(valid ? prefillDiscipline : 'other');
    }
  }, [openForm, prefillDiscipline]);

  const reset = () => {
    setDocumentType('');
    setDocumentTradeCategory('');
    setDocumentDiscipline('other');
    setDocumentName('');
    setDocumentNotes('');
    setSelectedFile(null);
    setApplianceModel('');
    setApplianceSerial('');
    setLastServiced('');
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const uploadMutation = useMutation({
    mutationFn: uploadFileWithMetadata,
    onSuccess: doc => {
      // Refresh everything an upload affects, independent of any parent refetch prop.
      ['documents', 'documents-expiring', 'documents-summary', 'event', 'recent-activity'].forEach(k =>
        queryClient.invalidateQueries({ queryKey: [k] }),
      );
      refetch?.();
      if (doc.discipline === 'energy_epc' && doc.epc_status === 'unreadable') {
        toast.error("Couldn't read a rating from this file — try a clearer photo or the EPC PDF.");
      }
      setReminderDoc({
        id: doc.id,
        name: doc.name,
        doc_type: doc.doc_type ?? null,
        expires_at: doc.expires_at ?? null,
        created_event: doc.created_event ?? null,
        suggested_expiry: doc.suggested_expiry ?? null,
      });
      setReminderDialogOpen(true);
      reset();
      setOpenForm(false);
    },
  });

  const handleSubmit = () => {
    if (!selectedFile) {
      toast.error('Please select a file.');
      return;
    }
    if (!documentType) {
      toast.error('Please select a document type.');
      return;
    }
    if (!documentTradeCategory && documentType !== 'other') {
      toast.error('Please select a category.');
      return;
    }
    toast.promise(
      uploadMutation.mutateAsync({
        file: selectedFile,
        id: user?.id ?? '',
        metadata: {
          name: documentName || selectedFile.name,
          type: documentType,
          category: documentTradeCategory,
          discipline: documentDiscipline,
          notes: documentNotes,
          appliance_model: applianceModel,
          appliance_serial: applianceSerial,
          last_serviced: lastServiced,
        },
      }),
      {
        loading: 'Uploading…',
        success: 'Uploaded successfully!',
        error: 'Failed to upload document.',
      },
    );
  };

  return (
    <>
    <ExpiryConfirmDialog
      doc={reminderDoc}
      open={reminderDialogOpen}
      onOpenChange={v => {
        setReminderDialogOpen(v);
        if (!v) setReminderDoc(null);
      }}
    />
    <Dialog open={openForm} onOpenChange={setOpenForm}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">

          {/* Drop zone */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Document File</Label>
            <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCameraCapture} />
            {isMobile && (
              <Button type="button" variant="outline" className="w-full mb-2" onClick={() => cameraInputRef.current?.click()}>
                <Camera className="w-4 h-4 mr-2" />
                Take Photo
              </Button>
            )}
            <label htmlFor="file-upload">
              <div
                className={cn(
                  'flex items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
                  isDragging ? 'border-primary bg-primary/10' : 'border-border hover:bg-secondary',
                )}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <div className="text-center">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">{selectedFile ? selectedFile.name : 'Click or drag & drop to upload'}</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, DOC up to 10MB</p>
                </div>
              </div>
            </label>
            {!isMobile && (
              <p className="text-xs text-[#6B6B6B] flex items-center gap-1.5 mt-1">
                <span role="img" aria-label="mobile phone">📱</span>
                On your phone? Open Home+ in your mobile browser to scan directly with your camera.
              </p>
            )}
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="doc-name">Document Name</Label>
            <Input
              id="doc-name"
              placeholder="e.g. Boiler Service Report 2026"
              value={documentName}
              onChange={e => setDocumentName(e.target.value)}
            />
          </div>

          {/* Discipline */}
          <div className="space-y-2">
            <Label>Discipline</Label>
            <Select value={documentDiscipline} onValueChange={setDocumentDiscipline}>
              <SelectTrigger>
                <SelectValue placeholder="Select discipline" />
              </SelectTrigger>
              <SelectContent>
                {DISCIPLINE_OPTIONS.map(d => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Document Type */}
          <div className="space-y-2">
            <Label>Document Type</Label>
            <Select
              value={documentType || undefined}
              onValueChange={v => {
                setDocumentType(v);
                setDocumentTradeCategory(v === 'other' ? 'other' : '');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {TRADE_OPTIONS.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category — appears after Document Type is selected (hidden for Other — auto-set) */}
          {documentType && documentType !== 'other' && (
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={documentTradeCategory || undefined} onValueChange={setDocumentTradeCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {tradeCategories.map(c => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="doc-notes">
              Notes <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Textarea
              id="doc-notes"
              placeholder="Add any notes about this document…"
              value={documentNotes}
              onChange={e => setDocumentNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Appliance fields — shown when discipline is Manuals & Appliances */}
          {documentDiscipline === 'manuals_appliances' && (
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Appliance Details (optional)</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="appliance-model" className="text-xs">Model number</Label>
                  <Input id="appliance-model" placeholder="e.g. EcoTec Plus" value={applianceModel} onChange={e => setApplianceModel(e.target.value)} className="text-sm" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="appliance-serial" className="text-xs">Serial number</Label>
                  <Input id="appliance-serial" placeholder="e.g. GC9000i" value={applianceSerial} onChange={e => setApplianceSerial(e.target.value)} className="text-sm" />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="last-serviced" className="text-xs">Last serviced</Label>
                <Input id="last-serviced" type="date" value={lastServiced} onChange={e => setLastServiced(e.target.value)} className="text-sm" />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={handleSubmit} disabled={uploadMutation.isPending}>
              Upload
            </Button>
            <Button variant="outline" className="flex-1 text-black hover:bg-gray-200" onClick={() => setOpenForm(false)}>
              Cancel
            </Button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default DocsUploadDialog;
