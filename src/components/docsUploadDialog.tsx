import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from '@/lib/toast';
import { CalendarIcon, Upload } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadFileWithMetadata } from '@/lib/Api';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { TRADE_OPTIONS, DISCIPLINE_OPTIONS, tradeCategoriesByType } from '@/lib/tradeCategories';
import ExpiryConfirmDialog from '@/components/docsUploadDialog/ExpiryConfirmDialog';

interface Props {
  openForm: boolean;
  setOpenForm: (v: boolean) => void;
  refetch?: () => void;
}

type UploadedDoc = {
  id: string;
  name: string;
  doc_type?: string | null;
  expires_at?: string | null;
  /** Set when the backend auto-created the reminder on upload. */
  created_event?: string | null;
};

const DocsUploadDialog = ({ openForm, setOpenForm, refetch }: Props) => {
  const [documentType, setDocumentType] = useState('');
  const [documentTradeCategory, setDocumentTradeCategory] = useState('');
  const [documentDiscipline, setDocumentDiscipline] = useState('other');
  const [documentName, setDocumentName] = useState('');
  const [documentNotes, setDocumentNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  const [reminderDoc, setReminderDoc] = useState<UploadedDoc | null>(null);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);

  const queryClient = useQueryClient();
  const { user } = useAuth();

  const tradeCategories = documentType ? tradeCategoriesByType[documentType] ?? [] : [];

  const reset = () => {
    setDocumentType('');
    setDocumentTradeCategory('');
    setDocumentDiscipline('other');
    setDocumentName('');
    setDocumentNotes('');
    setSelectedFile(null);
    setSelectedDate(null);
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
      queryClient.invalidateQueries({ queryKey: ['/api/v1/documents/'] });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/documents/expiring/'] });
      refetch?.();
      // Hand the user off to the confirm-reminder dialog before closing the
      // upload modal. If `created_event` is already set, the backend
      // auto-scheduled the reminder at upload time — the dialog enters
      // "update" mode so the user can fine-tune lead time / trade without
      // creating a duplicate. Users can still Skip and keep the defaults.
      // Also invalidate the events query so the calendar shows the new
      // reminder immediately.
      queryClient.invalidateQueries({ queryKey: ['event'] });
      setReminderDoc({
        id: doc.id,
        name: doc.name,
        doc_type: doc.doc_type ?? null,
        expires_at: doc.expires_at ?? null,
        created_event: doc.created_event ?? null,
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
    if (!documentTradeCategory) {
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
          status: selectedDate,
          notes: documentNotes,
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
            <label htmlFor="file-upload">
              <div
                className={cn(
                  'flex items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
                  isDragging ? 'border-primary bg-primary/10' : 'border-border hover:bg-secondary',
                )}
                onDragOver={e => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
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

          {/* Type */}
          <div className="space-y-2">
            <Label>Document Type</Label>
            <Select
              value={documentType}
              onValueChange={v => {
                setDocumentType(v);
                setDocumentTradeCategory('');
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

          {/* Category — appears only after Document Type is selected */}
          {documentType && (
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={documentTradeCategory} onValueChange={setDocumentTradeCategory}>
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

          {/* Expiry date */}
          <div className="space-y-2">
            <Label>
              Expiry Date <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-full justify-start font-normal', !selectedDate && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP') : 'No expiry date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate ?? undefined}
                  onSelect={d => {
                    setSelectedDate(d ?? null);
                    setDateOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

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
