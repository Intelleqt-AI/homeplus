import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '../ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/lib/toast';
import { useQueryClient } from '@tanstack/react-query';
import { usePost } from '@/hooks/usePost';
import useFetch from '@/hooks/useFetch';
import { createJob, postData } from '@/lib/Api';
import { UK_LOCATIONS, LOCATION_POSTCODE } from '@/lib/ukLocations';
import { categoryConfig } from '@/lib/jobCategories';
import { TRADE_OPTIONS } from '@/lib/tradeCategories';
import { Check, ChevronsUpDown, Upload, File as FileIcon, X, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import PropertySelect, { type PropertyOption } from '@/components/property/PropertySelect';

const MAX_FILES = 3;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

export type QuotePrefill = {
  title?: string;
  service?: string;
  category?: string;
  /** Pre-select a property by id. Postcode + area auto-fill once it resolves. */
  property?: string;
};

interface QuoteProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  prefill?: QuotePrefill;
}

const Quote = ({ open, setOpen, prefill }: QuoteProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Property
  const [propertyId, setPropertyId] = useState('');

  // Job details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [service, setService] = useState('Plumbing');
  const [category, setCategory] = useState('');
  const [urgency, setUrgency] = useState('normal');
  const [priority, setPriority] = useState('medium');
  const [preferredDate, setPreferredDate] = useState('');

  // Location
  const [locationArea, setLocationArea] = useState('');
  const [locationPostcode, setLocationPostcode] = useState('');
  const [locationOpen, setLocationOpen] = useState(false);

  // Dynamic Q&A
  const [answers, setAnswers] = useState<Record<string, string | number | undefined>>({});

  // File attachments (picked before job exists)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Phone verification state
  const [showPhoneVerifyPrompt, setShowPhoneVerifyPrompt] = useState(false);

  // Selected property (used for location autofill + map-pin validation).
  // The full list of properties is fetched inside <PropertySelect />.
  const { data: propertiesRes } = useFetch<{ results?: PropertyOption[]; data?: PropertyOption[] }>(
    '/api/v1/properties/',
  );
  const properties: PropertyOption[] = propertiesRes?.results ?? propertiesRes?.data ?? [];
  const selectedProperty = properties.find(p => p.id === propertyId);

  const reset = () => {
    setPropertyId('');
    setTitle('');
    setDescription('');
    setService('Plumbing');
    setCategory('');
    setUrgency('normal');
    setPriority('medium');
    setPreferredDate('');
    setLocationArea('');
    setLocationPostcode('');
    setAnswers({});
    setPendingFiles([]);
  };

  const handleAddFiles = (fileList: FileList | File[]) => {
    const incoming = Array.from(fileList);
    const remaining = MAX_FILES - pendingFiles.length;
    const valid = incoming.filter(f => {
      if (f.size > MAX_FILE_BYTES) { toast.error(`${f.name} exceeds 5 MB`); return false; }
      return true;
    });
    if (valid.length > remaining) toast.error(`Max ${MAX_FILES} files — ${valid.length - remaining} skipped`);
    setPendingFiles(prev => [...prev, ...valid.slice(0, remaining)]);
  };

  useEffect(() => {
    if (!open || !prefill) return;
    if (prefill.title) setTitle(prefill.title);
    if (prefill.service) {
      setService(prefill.service);
      setAnswers({});
    }
    if (prefill.category) setCategory(prefill.category);
    if (prefill.property) setPropertyId(prefill.property);
  }, [open, prefill?.title, prefill?.service, prefill?.category, prefill?.property]);

  // Whenever the selected property changes (from either the picker or a
  // prefill), populate the location fields from it. Without this, prefilled
  // property IDs would leave the user with an empty postcode.
  useEffect(() => {
    if (!propertyId || !selectedProperty) return;
    setLocationArea(selectedProperty.location ?? '');
    setLocationPostcode(selectedProperty.postcode ?? '');
  }, [propertyId, selectedProperty]);

  const { mutate: submitJob, isPending } = usePost({
    mutationFn: (vars: Record<string, unknown>) => createJob(vars),
    onSuccess: async (result: unknown) => {
      const jobId = (result as { data?: { id?: string } })?.data?.id;
      if (jobId && pendingFiles.length > 0) {
        setUploading(true);
        for (const file of pendingFiles) {
          try {
            const fd = new FormData();
            fd.append('file', file);
            await postData({ url: `/api/v1/jobs/${jobId}/files/`, data: fd });
          } catch {
            toast.error(`Failed to upload ${file.name}`);
          }
        }
        setUploading(false);
      }
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Job posted successfully!');
      reset();
      setOpen(false);
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = e?.response?.data?.message || e?.message || 'Failed to post job';
      toast.error(msg);
    },
  });

  const serviceCategories = categoryConfig.filter(c => c.trade === service).map(c => c.category);

  // Get selected category configuration
  const selectedCategoryConfig = categoryConfig.find(c => c.category === category);

  const handleAnswerChange = (outputKey: string, value: string | number) => {
    setAnswers(prev => ({ ...prev, [outputKey]: value }));
  };

  const handleSubmit = () => {
    if (selectedProperty && (selectedProperty.latitude === null || selectedProperty.longitude === null)) {
      toast.error('Selected property has no exact location. Open Settings → Properties to set its map pin.');
      return;
    }
    if (!title.trim()) {
      toast.error('Job title is required');
      return;
    }
    if (!locationPostcode.trim()) {
      toast.error('Postcode is required');
      return;
    }
    if (serviceCategories.length > 0 && !category) {
      toast.error('Please select a category');
      return;
    }
    const requiredUnanswered = selectedCategoryConfig?.questions.filter(q => q.required && !answers[q.output_key]);
    if (requiredUnanswered?.length) {
      toast.error(`Please answer: ${requiredUnanswered[0].question_text}`);
      return;
    }

    // Soft-prompt: photos improve quote accuracy and response speed
    if (pendingFiles.length === 0) {
      toast.warning('Add at least one photo to get faster, more accurate quotes');
      return;
    }

    // Phone verify guard — trades need a callback number
    const phoneVerified = (user as { profile?: { phone_verified?: boolean } } | null)?.profile?.phone_verified;
    if (phoneVerified === false) {
      setShowPhoneVerifyPrompt(true);
    }

    submitJob({
      ...(propertyId ? { property: propertyId } : {}),
      title,
      description,
      service,
      category: category || '',
      urgency,
      priority,
      location: locationArea,
      postcode: locationPostcode,
      ...(preferredDate ? { preferred_date: preferredDate } : {}),
      answers,
    });
  };

  const inputCls =
    'w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white';
  const selectCls = `${inputCls} cursor-pointer`;
  const sectionTitle = 'text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3';

  return (
    <Dialog
      open={open}
      onOpenChange={open => {
        if (!open) reset();
        setOpen(open);
      }}
    >
      <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="px-4 sm:px-6 pt-6 pb-4 border-b border-gray-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">Post a Job</DialogTitle>
            <p className="text-sm text-gray-500 mt-0.5">Get quotes from verified local tradespeople</p>
          </DialogHeader>
        </div>

        <div className="px-4 sm:px-6 py-5 space-y-6">
          {/* ── Property ─────────────────────────────────────── */}
          <div>
            <p className={sectionTitle}>
              Property <span className="normal-case font-normal text-gray-400">(optional)</span>
            </p>
            <PropertySelect
              value={propertyId}
              onChange={id => setPropertyId(id)}
              requireMapPin
            />
          </div>

          {/* ── Job Details ───────────────────────────────────── */}
          <div>
            <p className={sectionTitle}>Job Details</p>
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Job Title <span className="text-red-500">*</span>
                </Label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Boiler service needed urgently"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Trade <span className="text-red-500">*</span>
                  </Label>
                  <select
                    value={service}
                    onChange={e => {
                      setService(e.target.value);
                      setCategory('');
                      setAnswers({});
                    }}
                    className={selectCls}
                  >
                    {TRADE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.label}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                {serviceCategories.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Category</Label>
                    <select
                      value={category}
                      onChange={e => {
                        setCategory(e.target.value);
                        setAnswers({});
                      }}
                      className={selectCls}
                    >
                      <option value="">Select category</option>
                      {serviceCategories.map(cat => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Description</Label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the job in detail — what needs doing, current state, any specific requirements…"
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>
          </div>

          {/* ── Location ─────────────────────────────────────── */}
          <div>
            <p className={sectionTitle}>Location</p>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium text-gray-700">Area</Label>
                <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        'w-full mt-1 h-10 px-3 rounded-lg border text-sm flex items-center justify-between gap-1 bg-white border-gray-200 hover:bg-gray-50 transition-colors',
                        !locationArea && 'text-gray-400',
                      )}
                    >
                      <span className="truncate">{locationArea || 'Select area'}</span>
                      <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search area…" />
                      <CommandList>
                        <CommandEmpty>No area found.</CommandEmpty>
                        {UK_LOCATIONS.map(group => (
                          <CommandGroup key={group.group} heading={group.group}>
                            {group.items.map(item => (
                              <CommandItem
                                key={item}
                                value={item}
                                onSelect={val => {
                                  setLocationArea(val);
                                  setLocationPostcode(LOCATION_POSTCODE[val] ?? '');
                                  setLocationOpen(false);
                                }}
                              >
                                <Check className={cn('mr-2 h-3.5 w-3.5', locationArea === item ? 'opacity-100' : 'opacity-0')} />
                                {item}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Postcode <span className="text-red-500">*</span>
                </Label>
                <input
                  value={locationPostcode}
                  onChange={e => setLocationPostcode(e.target.value.toUpperCase())}
                  placeholder="e.g. SW1A"
                  className={`${inputCls} uppercase`}
                />
                <p className="text-xs text-gray-400 mt-1">Auto-filled from area or property · editable</p>
              </div>
            </div>
          </div>

          {/* ── Requirements ─────────────────────────────────── */}
          <div>
            <p className={sectionTitle}>Requirements</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-sm font-medium text-gray-700">Urgency</Label>
                <select value={urgency} onChange={e => setUrgency(e.target.value)} className={selectCls}>
                  <option value="emergency">Emergency (same day)</option>
                  <option value="urgent">Urgent (within 48h)</option>
                  <option value="normal">Normal (within 2 weeks)</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Priority</Label>
                <select value={priority} onChange={e => setPriority(e.target.value)} className={selectCls}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-sm font-medium text-gray-700">Preferred Date</Label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={e => setPreferredDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* ── Category Q&A (Plumbing) ───────────────────────── */}
          {selectedCategoryConfig && (
            <div>
              <p className={sectionTitle}>Additional Details — {selectedCategoryConfig.category}</p>
              <p className="text-xs text-gray-400 mb-3">{selectedCategoryConfig.category_description}</p>
              <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                {selectedCategoryConfig.questions
                  .sort((a, b) => a.question_order - b.question_order)
                  .map(question => (
                    <div key={question.output_key}>
                      <Label className="text-xs font-medium text-gray-600">
                        {question.question_text}
                        {question.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {question.question_type === 'multiple_choice' && (
                        <select
                          value={String(answers[question.output_key] ?? '')}
                          onChange={e => handleAnswerChange(question.output_key, e.target.value)}
                          className={`${selectCls} mt-1`}
                        >
                          <option value="">Select an option</option>
                          {question.options?.map(opt => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}
                      {question.question_type === 'text' && (
                        <textarea
                          value={String(answers[question.output_key] ?? '')}
                          onChange={e => handleAnswerChange(question.output_key, e.target.value)}
                          placeholder="Enter details…"
                          rows={3}
                          className={`${inputCls} mt-1 resize-none`}
                        />
                      )}
                      {question.question_type === 'number' && (
                        <input
                          type="number"
                          value={String(answers[question.output_key] ?? '')}
                          onChange={e => handleAnswerChange(question.output_key, Number(e.target.value))}
                          placeholder="Enter number"
                          className={`${inputCls} mt-1`}
                        />
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ── Phone verify banner ─────────────────────────── */}
          {showPhoneVerifyPrompt && (
            <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
              <div className="flex-1">
                <span className="font-medium">Add your phone number</span> so trades can contact you directly.{' '}
                <a href="/dashboard/settings" className="underline text-amber-700 hover:text-amber-900">Go to Settings</a>
              </div>
              <button type="button" onClick={() => setShowPhoneVerifyPrompt(false)} className="shrink-0 text-amber-500 hover:text-amber-700">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ── Attachments ──────────────────────────────────── */}
          <div>
            <p className={sectionTitle}>Photos <span className="text-red-400">*</span> ({pendingFiles.length}/{MAX_FILES}) <span className="normal-case font-normal text-gray-400">— add at least one photo for faster, more accurate quotes</span></p>

            {pendingFiles.length > 0 && (
              <div className="space-y-2 mb-3">
                {pendingFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                    <FileIcon className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="flex-1 truncate text-gray-700">{f.name}</span>
                    <span className="text-xs text-gray-400 shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                    <button type="button" onClick={() => setPendingFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 shrink-0 ml-1">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {pendingFiles.length < MAX_FILES && (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleAddFiles(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                  dragOver ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/40 hover:bg-gray-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                  className="hidden"
                  onChange={e => e.target.files && handleAddFiles(e.target.files)}
                />
                <Upload className="h-5 w-5 mx-auto mb-1.5 text-gray-400" />
                <p className="text-sm text-gray-600 font-medium">Drop files or click to browse</p>
                <p className="text-xs text-gray-400 mt-0.5">Max {MAX_FILES} files · 5 MB each · PDF, images, Word</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-100 flex gap-3">
          <Button onClick={handleSubmit} className="flex-1" disabled={isPending || uploading}>
            {uploading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Uploading…</> : isPending ? 'Posting…' : 'Post Job'}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              reset();
              setOpen(false);
            }}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Quote;
