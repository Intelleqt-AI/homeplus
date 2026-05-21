import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '../ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/lib/toast';
import { useQueryClient } from '@tanstack/react-query';
import { usePost } from '@/hooks/usePost';
import useFetch from '@/hooks/useFetch';
import { createJob } from '@/lib/Api';
import { UK_LOCATIONS, LOCATION_POSTCODE } from '@/lib/ukLocations';
import { categoryConfig } from '@/lib/jobCategories';
import { Check, ChevronsUpDown, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type QuotePrefill = {
  title?: string;
  service?: string;
  category?: string;
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
  const [propertyOpen, setPropertyOpen] = useState(false);

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

  // Fetch user's properties
  interface PropertyData {
    id: string;
    address: string;
    postcode: string;
    location: string;
    name?: string;
    latitude: number | null;
    longitude: number | null;
  }
  const { data: propertiesRes } = useFetch<{ results?: PropertyData[]; data?: PropertyData[] }>('/api/v1/properties/');
  const properties: PropertyData[] = propertiesRes?.results ?? propertiesRes?.data ?? [];
  const selectedProperty = properties.find(p => p.id === propertyId);

  const reset = () => {
    setPropertyId(''); setTitle(''); setDescription(''); setService('Plumbing');
    setCategory(''); setUrgency('normal'); setPriority('medium'); setPreferredDate('');
    setLocationArea(''); setLocationPostcode('');
    setAnswers({});
  };

  useEffect(() => {
    if (!open || !prefill) return;
    if (prefill.title) setTitle(prefill.title);
    if (prefill.service) {
      setService(prefill.service);
      setAnswers({});
    }
    if (prefill.category) setCategory(prefill.category);
  }, [open, prefill?.title, prefill?.service, prefill?.category]);

  const { mutate: submitJob, isPending } = usePost({
    mutationFn: (vars: Record<string, unknown>) => createJob(vars),
    onSuccess: () => {
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
    if (!propertyId) { toast.error('Please select a property'); return; }
    if (selectedProperty && (selectedProperty.latitude === null || selectedProperty.longitude === null)) {
      toast.error('Selected property has no exact location. Open Settings → Properties to set its map pin.');
      return;
    }
    if (!title.trim()) { toast.error('Job title is required'); return; }
    if (!locationPostcode.trim()) { toast.error('Postcode is required'); return; }
    if (serviceCategories.length > 0 && !category) { toast.error('Please select a category'); return; }
    const requiredUnanswered = selectedCategoryConfig?.questions.filter(
      q => q.required && !answers[q.output_key]
    );
    if (requiredUnanswered?.length) {
      toast.error(`Please answer: ${requiredUnanswered[0].question_text}`);
      return;
    }

    submitJob({
      property: propertyId,
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

  const inputCls = 'w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white';
  const selectCls = `${inputCls} cursor-pointer`;
  const sectionTitle = 'text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3';

  return (
    <Dialog open={open} onOpenChange={open => { if (!open) reset(); setOpen(open); }}>
      <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">Post a Job</DialogTitle>
            <p className="text-sm text-gray-500 mt-0.5">Get quotes from verified local tradespeople</p>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-6">

          {/* ── Property ─────────────────────────────────────── */}
          <div>
            <p className={sectionTitle}>Property <span className="text-red-500">*</span></p>
            <Popover open={propertyOpen} onOpenChange={setPropertyOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'w-full min-h-10 px-3 py-2 rounded-lg border text-sm flex items-center justify-between gap-2 bg-white border-gray-200 hover:bg-gray-50 transition-colors',
                    !propertyId && 'text-gray-400',
                  )}
                >
                  <span className="flex items-center gap-2 min-w-0 flex-1">
                    <Building2 className="h-4 w-4 shrink-0 text-gray-400" />
                    {selectedProperty ? (
                      <span className="flex flex-col min-w-0 text-left">
                        <span className="truncate font-medium text-gray-900 leading-tight">
                          {selectedProperty.name || selectedProperty.address}
                        </span>
                        {selectedProperty.name && (
                          <span className="truncate text-xs text-gray-400 leading-tight">
                            {selectedProperty.address}{selectedProperty.postcode ? ` · ${selectedProperty.postcode}` : ''}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span>Select a property</span>
                    )}
                  </span>
                  <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[500px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search properties…" />
                  <CommandList>
                    <CommandEmpty>No properties found.</CommandEmpty>
                    <CommandGroup>
                      {properties.map(p => (
                        <CommandItem
                          key={p.id}
                          value={`${p.name ?? ''} ${p.address}`}
                          onSelect={() => {
                            setPropertyId(p.id);
                            setLocationArea(p.location ?? '');
                            setLocationPostcode(p.postcode ?? '');
                            setPropertyOpen(false);
                          }}
                        >
                          <Check className={cn('mr-2 h-3.5 w-3.5 shrink-0', propertyId === p.id ? 'opacity-100' : 'opacity-0')} />
                          <span className="flex flex-col min-w-0 flex-1">
                            <span className="truncate font-medium text-gray-900 text-sm leading-tight">
                              {p.name || p.address}
                            </span>
                            {p.name && (
                              <span className="truncate text-xs text-gray-400 leading-tight">
                                {p.address}{p.postcode ? ` · ${p.postcode}` : ''}
                              </span>
                            )}
                          </span>
                          {p.postcode && !p.name && <Badge variant="outline" className="ml-auto text-xs shrink-0">{p.postcode}</Badge>}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedProperty && (selectedProperty.latitude === null || selectedProperty.longitude === null) && (
              <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                ⚠ This property has no map pin yet. Go to <strong>Settings → Properties</strong> and drag the pin to its exact location before posting the job.
              </p>
            )}
          </div>

          {/* ── Job Details ───────────────────────────────────── */}
          <div>
            <p className={sectionTitle}>Job Details</p>
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-700">Job Title <span className="text-red-500">*</span></Label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Boiler service needed urgently" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Trade <span className="text-red-500">*</span></Label>
                  <select value={service} onChange={e => { setService(e.target.value); setCategory(''); setAnswers({}); }} className={selectCls}>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Gas Engineer">Gas Engineer</option>
                    <option value="Roofing">Roofing</option>
                    <option value="Electrical">Electrical</option>
                  </select>
                </div>
                {serviceCategories.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Category</Label>
                    <select value={category} onChange={e => { setCategory(e.target.value); setAnswers({}); }} className={selectCls}>
                      <option value="">Select category</option>
                      {serviceCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
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
            <div className="grid grid-cols-2 gap-3">
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
                              <CommandItem key={item} value={item} onSelect={val => { setLocationArea(val); setLocationPostcode(LOCATION_POSTCODE[val] ?? ''); setLocationOpen(false); }}>
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
                <Label className="text-sm font-medium text-gray-700">Postcode <span className="text-red-500">*</span></Label>
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
            <div className="grid grid-cols-3 gap-3">
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
              <div>
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
                        <select value={String(answers[question.output_key] ?? '')} onChange={e => handleAnswerChange(question.output_key, e.target.value)} className={`${selectCls} mt-1`}>
                          <option value="">Select an option</option>
                          {question.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      )}
                      {question.question_type === 'text' && (
                        <textarea value={String(answers[question.output_key] ?? '')} onChange={e => handleAnswerChange(question.output_key, e.target.value)} placeholder="Enter details…" rows={3} className={`${inputCls} mt-1 resize-none`} />
                      )}
                      {question.question_type === 'number' && (
                        <input type="number" value={String(answers[question.output_key] ?? '')} onChange={e => handleAnswerChange(question.output_key, Number(e.target.value))} placeholder="Enter number" className={`${inputCls} mt-1`} />
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <Button onClick={handleSubmit} className="flex-1" disabled={isPending}>
            {isPending ? 'Posting…' : 'Post Job'}
          </Button>
          <Button variant="outline" onClick={() => { reset(); setOpen(false); }} className="flex-1">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Quote;
