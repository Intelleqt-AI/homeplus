import { useEffect, useState } from 'react';
import {
  MessageSquare,
  Filter,
  Plus,
  MapPin,
  Clock,
  PoundSterling,
  Star,
  Briefcase,
  CheckCircle,
  Search,
  Pencil,
  Trash2,
  AlertTriangle,
  Lock,
  Building2,
  Check,
  ChevronsUpDown,
  Shield,
  Phone,
  Mail,
  BadgeCheck,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { createJob, fetchLeads, modifyBid, updateJob, deleteJob, rateBid } from '@/lib/Api';
import { useQueryClient } from '@tanstack/react-query';
import useFetch from '@/hooks/useFetch';
import { usePost } from '@/hooks/usePost';
import usePatch from '@/hooks/usePatch';
import Quote from '@/components/topbar/Quote';
import { toast } from '@/lib/toast';
import { UK_LOCATIONS, LOCATION_POSTCODE } from '@/lib/ukLocations';
import { categoryConfig } from '@/lib/jobCategories';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TradePilotProfile {
  user_id: string;
  business_name: string;
  trade_specialty: string;
  years_experience: string;
  postcode: string;
  has_insurance: boolean;
  has_license: boolean;
  completed_jobs: number;
  avg_rating: number | null;
  total_ratings: number;
}

interface Bid {
  id: string;
  proposedValue: number;
  status: string;
  Available: string;
  bid_by: string;
  description: string;
  contractor_phone: string;
  company_name: string;
  rating: number | null;
  rating_comment: string;
  rating_is_anonymous: boolean;
  rated_at: string | null;
  bidder: { first_name: string; last_name: string; email: string };
  tradepilot_profile: TradePilotProfile | null;
}

interface PropertyData {
  id: string;
  address: string;
  postcode: string;
  location: string;
  name?: string;
}

interface Job {
  id: string;
  name: string;
  service: string;
  trade: string;
  category: string;
  location: string;
  postcode: string;
  description: string;
  value: string;
  isApproved: boolean;
  status: string;
  urgency: string;
  priority: string;
  budget_min: string | null;
  budget_max: string | null;
  preferred_date: string | null;
  property: string | null;
  answers: Record<string, unknown>;
  updated_at: string;
  bids: Bid[];
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputCls = (disabled?: boolean) =>
  `w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white${disabled ? ' opacity-50 cursor-not-allowed' : ''}`;

const selectCls = (disabled?: boolean) => `${inputCls(disabled)} cursor-pointer`;

const sectionTitle = 'text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3';

// ─── Edit Modal ───────────────────────────────────────────────────────────────

interface EditJobModalProps {
  job: Job | null;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

const TRADES = ['Plumbing', 'Electrical', 'Heating', 'Gardening', 'Cleaning', 'Other'];
const plumbingCategories = categoryConfig.map(c => c.category);

const EditJobModal = ({ job, onClose, onSaved, onDeleted }: EditJobModalProps) => {
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // property
  const [propertyId, setPropertyId] = useState('');
  const [propertyOpen, setPropertyOpen] = useState(false);

  // job details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [service, setService] = useState('Plumbing');
  const [category, setCategory] = useState('');
  const [urgency, setUrgency] = useState('normal');
  const [priority, setPriority] = useState('medium');
  const [preferredDate, setPreferredDate] = useState('');

  // budget
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');

  // location
  const [locationArea, setLocationArea] = useState('');
  const [locationPostcode, setLocationPostcode] = useState('');
  const [locationOpen, setLocationOpen] = useState(false);

  // answers
  const [answers, setAnswers] = useState<Record<string, string | number | undefined>>({});

  // fetch properties
  const { data: propertiesRes } = useFetch<{ results?: PropertyData[]; data?: PropertyData[] }>('/api/v1/properties/');
  const properties: PropertyData[] = propertiesRes?.results ?? propertiesRes?.data ?? [];
  const selectedProperty = properties.find(p => p.id === propertyId);

  // populate form when job changes
  useEffect(() => {
    if (!job) return;
    setPropertyId(job.property ?? '');
    setTitle(job.name ?? '');
    setDescription(job.description ?? '');
    // service is stored capitalized (e.g. "Plumbing")
    const svc = job.service ? job.service.charAt(0).toUpperCase() + job.service.slice(1).toLowerCase() : 'Plumbing';
    setService(TRADES.includes(svc) ? svc : 'Other');
    setCategory(job.category ?? '');
    setUrgency(job.urgency ?? 'normal');
    setPriority(job.priority ?? 'medium');
    setLocationArea(job.location ?? '');
    setLocationPostcode(job.postcode ?? '');
    setBudgetMin(job.budget_min ? String(parseFloat(String(job.budget_min))) : '');
    setBudgetMax(job.budget_max ? String(parseFloat(String(job.budget_max))) : '');
    setPreferredDate(job.preferred_date ?? '');
    setAnswers((job.answers as Record<string, string | number | undefined>) ?? {});
    setDeleteConfirm(false);
    setPropertyOpen(false);
    setLocationOpen(false);
  }, [job]);

  const { mutate: saveJob, isPending: saving } = usePost({
    mutationFn: (vars: Record<string, unknown>) => updateJob(job!.id, vars),
    onSuccess: () => { toast.success('Job updated'); onSaved(); },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(e?.response?.data?.message ?? e?.message ?? 'Failed to update job');
    },
  });

  const { mutate: doDelete, isPending: deleting } = usePost({
    mutationFn: () => deleteJob(job!.id),
    onSuccess: () => { toast.success('Job deleted'); onDeleted(); },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(e?.response?.data?.message ?? e?.message ?? 'Failed to delete job');
    },
  });

  if (!job) return null;

  const locked = job.bids.length > 0;
  const selectedCategoryConfig = categoryConfig.find(c => c.category === category);

  const handleAnswerChange = (key: string, value: string | number) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (!title.trim()) { toast.error('Job title is required'); return; }
    if (!locationPostcode.trim()) { toast.error('Postcode is required'); return; }
    if (!budgetMin.trim()) { toast.error('Minimum budget is required'); return; }
    saveJob({
      ...(propertyId ? { property: propertyId } : { property: null }),
      title: title.trim(),
      service,
      category: category || '',
      description: description.trim(),
      urgency,
      priority,
      location: locationArea.trim(),
      postcode: locationPostcode.trim(),
      ...(budgetMin ? { budget_min: parseFloat(budgetMin) } : {}),
      ...(budgetMax ? { budget_max: parseFloat(budgetMax) } : {}),
      ...(preferredDate ? { preferred_date: preferredDate } : { preferred_date: null }),
      answers,
    });
  };

  return (
    <Dialog open={!!job} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              {locked && <Lock className="h-4 w-4 text-amber-500 shrink-0" />}
              Edit Job
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-0.5">
              {locked
                ? `This job has ${job.bids.length} quote${job.bids.length > 1 ? 's' : ''} — editing is disabled`
                : 'Update your job details'}
            </p>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Lock banner */}
          {locked && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-700">
                Job has received quotes and cannot be edited. You can still delete it.
              </p>
            </div>
          )}

          {/* ── Property ─────────────────────────────────────── */}
          <div>
            <p className={sectionTitle}>Property</p>
            <Popover open={propertyOpen} onOpenChange={locked ? undefined : setPropertyOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  disabled={locked}
                  className={cn(
                    'w-full min-h-10 px-3 py-2 rounded-lg border text-sm flex items-center justify-between gap-2 bg-white border-gray-200 hover:bg-gray-50 transition-colors',
                    !propertyId && 'text-gray-400',
                    locked && 'opacity-50 cursor-not-allowed hover:bg-white',
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
                      <span>Select a property (optional)</span>
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
                      <CommandItem value="" onSelect={() => { setPropertyId(''); setPropertyOpen(false); }}>
                        <Check className={cn('mr-2 h-3.5 w-3.5', !propertyId ? 'opacity-100' : 'opacity-0')} />
                        None (no property)
                      </CommandItem>
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
          </div>

          {/* ── Job Details ───────────────────────────────────── */}
          <div>
            <p className={sectionTitle}>Job Details</p>
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-700">Job Title <span className="text-red-500">*</span></Label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  disabled={locked}
                  placeholder="e.g. Boiler service needed urgently"
                  className={inputCls(locked)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Trade <span className="text-red-500">*</span></Label>
                  <select
                    value={service}
                    onChange={e => { setService(e.target.value); setCategory(''); setAnswers({}); }}
                    disabled={locked}
                    className={selectCls(locked)}
                  >
                    {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                {service === 'Plumbing' && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Category</Label>
                    <select
                      value={category}
                      onChange={e => { setCategory(e.target.value); setAnswers({}); }}
                      disabled={locked}
                      className={selectCls(locked)}
                    >
                      <option value="">Select category</option>
                      {plumbingCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Description</Label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  disabled={locked}
                  placeholder="Describe the job in detail…"
                  rows={3}
                  className={`${inputCls(locked)} resize-none`}
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
                <Popover open={locationOpen} onOpenChange={locked ? undefined : setLocationOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      disabled={locked}
                      className={cn(
                        'w-full mt-1 h-10 px-3 rounded-lg border text-sm flex items-center justify-between gap-1 bg-white border-gray-200 hover:bg-gray-50 transition-colors',
                        !locationArea && 'text-gray-400',
                        locked && 'opacity-50 cursor-not-allowed hover:bg-white',
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
                <Label className="text-sm font-medium text-gray-700">Postcode <span className="text-red-500">*</span></Label>
                <input
                  value={locationPostcode}
                  onChange={e => setLocationPostcode(e.target.value.toUpperCase())}
                  disabled={locked}
                  placeholder="e.g. SW1A"
                  className={`${inputCls(locked)} uppercase`}
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
                <select value={urgency} onChange={e => setUrgency(e.target.value)} disabled={locked} className={selectCls(locked)}>
                  <option value="emergency">Emergency (same day)</option>
                  <option value="urgent">Urgent (within 48h)</option>
                  <option value="normal">Normal (within 2 weeks)</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Priority</Label>
                <select value={priority} onChange={e => setPriority(e.target.value)} disabled={locked} className={selectCls(locked)}>
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
                  disabled={locked}
                  min={new Date().toISOString().split('T')[0]}
                  className={inputCls(locked)}
                />
              </div>
            </div>
          </div>

          {/* ── Budget ───────────────────────────────────────── */}
          <div>
            <p className={sectionTitle}>Budget</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium text-gray-700">Min Budget (£) <span className="text-red-500">*</span></Label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={budgetMin}
                  onChange={e => setBudgetMin(e.target.value)}
                  disabled={locked}
                  placeholder="e.g. 100"
                  className={inputCls(locked)}
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Max Budget (£)</Label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={budgetMax}
                  onChange={e => setBudgetMax(e.target.value)}
                  disabled={locked}
                  placeholder="e.g. 500"
                  className={inputCls(locked)}
                />
              </div>
            </div>
          </div>

          {/* ── Category Q&A ─────────────────────────────────── */}
          {selectedCategoryConfig && (
            <div>
              <p className={sectionTitle}>Additional Details — {selectedCategoryConfig.category}</p>
              <p className="text-xs text-gray-400 mb-3">{selectedCategoryConfig.category_description}</p>
              <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                {selectedCategoryConfig.questions
                  .sort((a, b) => a.question_order - b.question_order)
                  .map(q => (
                    <div key={q.output_key}>
                      <Label className="text-xs font-medium text-gray-600">
                        {q.question_text}
                        {q.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {q.question_type === 'multiple_choice' && (
                        <select
                          value={String(answers[q.output_key] ?? '')}
                          onChange={e => handleAnswerChange(q.output_key, e.target.value)}
                          disabled={locked}
                          className={`${selectCls(locked)} mt-1`}
                        >
                          <option value="">Select an option</option>
                          {q.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      )}
                      {q.question_type === 'text' && (
                        <textarea
                          value={String(answers[q.output_key] ?? '')}
                          onChange={e => handleAnswerChange(q.output_key, e.target.value)}
                          disabled={locked}
                          placeholder="Enter details…"
                          rows={3}
                          className={`${inputCls(locked)} mt-1 resize-none`}
                        />
                      )}
                      {q.question_type === 'number' && (
                        <input
                          type="number"
                          value={String(answers[q.output_key] ?? '')}
                          onChange={e => handleAnswerChange(q.output_key, Number(e.target.value))}
                          disabled={locked}
                          placeholder="Enter number"
                          className={`${inputCls(locked)} mt-1`}
                        />
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100">
          {deleteConfirm ? (
            <div className="space-y-3">
              <p className="text-sm text-red-600 font-medium text-center">
                Delete &ldquo;{job.name}&rdquo;? This cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button variant="destructive" className="flex-1" disabled={deleting} onClick={() => doDelete()}>
                  {deleting ? 'Deleting…' : 'Yes, Delete'}
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              {!locked && (
                <Button className="flex-1" disabled={saving} onClick={handleSave}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </Button>
              )}
              <Button
                variant="outline"
                className="flex items-center gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                onClick={() => setDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
              <Button variant="outline" onClick={onClose}>
                {locked ? 'Close' : 'Cancel'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── Bid Detail Modal ─────────────────────────────────────────────────────────

interface BidDetailModalProps {
  bid: Bid | null;
  job: Job | null;
  onClose: () => void;
  onAccept: (job: Job, bid: Bid) => void;
}

const statusColors: Record<string, string> = {
  accepted: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

const BidDetailModal = ({ bid, job, onClose, onAccept }: BidDetailModalProps) => {
  if (!bid || !job) return null;
  const profile = bid.tradepilot_profile;
  const contractorName = `${bid.bidder.first_name} ${bid.bidder.last_name}`.trim() || bid.bidder.email;
  const isAccepted = bid.status === 'accepted';
  const canAccept = !isAccepted && !job.isApproved;

  return (
    <Dialog open={!!bid} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-gray-100 flex items-center justify-center text-lg font-semibold text-gray-600">
                {bid.bidder.first_name?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">{contractorName}</h2>
                {bid.company_name && <p className="text-sm text-gray-500">{bid.company_name}</p>}
              </div>
            </div>
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full border capitalize ${statusColors[bid.status] ?? statusColors.pending}`}>
              {bid.status}
            </span>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Quote details */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Quote Details</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-500 mb-0.5">Price</p>
                <p className="text-lg font-bold text-gray-900">£{bid.proposedValue.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-500 mb-0.5">Available</p>
                <p className="text-sm font-medium text-gray-900">
                  {bid.Available ? new Date(bid.Available).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-500 mb-0.5">For Job</p>
                <p className="text-sm font-medium text-gray-900 truncate">{job.name}</p>
              </div>
            </div>
            {bid.description && (
              <div className="mt-3 px-4 py-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Notes from contractor</p>
                <p className="text-sm text-gray-700">{bid.description}</p>
              </div>
            )}
          </div>

          {/* Contact info */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Contact</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                <span>{bid.bidder.email || '—'}</span>
              </div>
              {bid.contractor_phone && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                  <span>{bid.contractor_phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* TradePilot profile */}
          {profile ? (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">TradePilot Profile</p>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                {/* Profile header */}
                <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{profile.business_name}</p>
                    <p className="text-xs text-gray-500">{profile.trade_specialty} · {profile.years_experience} yrs exp · {profile.postcode}</p>
                  </div>
                  {profile.avg_rating !== null ? (
                    <div className="flex items-center gap-1 bg-yellow-50 px-2.5 py-1 rounded-full">
                      <Star className="h-3.5 w-3.5 text-yellow-400 fill-current" />
                      <span className="text-xs font-semibold text-yellow-700">{profile.avg_rating}</span>
                      <span className="text-xs text-yellow-600">({profile.total_ratings})</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">No ratings yet</span>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 divide-x divide-gray-100">
                  <div className="px-4 py-3 text-center">
                    <p className="text-lg font-bold text-gray-900">{profile.completed_jobs}</p>
                    <p className="text-xs text-gray-500">Jobs done</p>
                  </div>
                  <div className="px-4 py-3 text-center">
                    <p className="text-lg font-bold text-gray-900">{profile.total_ratings}</p>
                    <p className="text-xs text-gray-500">Reviews</p>
                  </div>
                  <div className="px-4 py-3 text-center">
                    <p className="text-lg font-bold text-gray-900">{profile.avg_rating ?? '—'}</p>
                    <p className="text-xs text-gray-500">Avg rating</p>
                  </div>
                </div>

                {/* Credentials */}
                <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-3">
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${profile.has_insurance ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    <Shield className="h-3.5 w-3.5" />
                    {profile.has_insurance ? 'Insured' : 'No insurance'}
                  </span>
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${profile.has_license ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                    <BadgeCheck className="h-3.5 w-3.5" />
                    {profile.has_license ? 'Licensed' : 'No license'}
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600">
                    <MapPin className="h-3.5 w-3.5" />
                    {profile.postcode}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-500">
              No TradePilot profile — contractor submitted bid manually.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          {canAccept && (
            <Button
              className="flex-1"
              onClick={() => { onAccept(job, bid); onClose(); }}
            >
              Accept Bid
            </Button>
          )}
          {isAccepted && (
            <div className="flex-1 flex items-center gap-2 justify-center text-sm font-medium text-green-600">
              <CheckCircle className="h-4 w-4" />
              Bid Accepted
            </div>
          )}
          <Button variant="outline" onClick={onClose} className={canAccept ? '' : 'flex-1'}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── Rate Tradesman Modal ─────────────────────────────────────────────────────

interface RateModalProps {
  job: Job | null;
  bid: Bid | null;
  onClose: () => void;
  onRated: () => void;
}

const StarButton = ({ filled, onClick }: { filled: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="focus:outline-none transition-transform hover:scale-110"
  >
    <Star className={`h-8 w-8 ${filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
  </button>
);

const RateTradesmanModal = ({ job, bid, onClose, onRated }: RateModalProps) => {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    if (!bid) return;
    setRating(bid.rating ?? 0);
    setComment(bid.rating_comment ?? '');
    setIsAnonymous(bid.rating_is_anonymous ?? false);
    setHovered(0);
  }, [bid]);

  const wordCount = comment.trim() ? comment.trim().split(/\s+/).length : 0;
  const overLimit = wordCount > 80;
  const alreadyRated = !!bid?.rated_at;
  const contractorName = bid
    ? `${bid.bidder.first_name} ${bid.bidder.last_name}`.trim() || bid.bidder.email
    : '';

  const { mutate: submitRating, isPending } = usePost({
    mutationFn: (vars: Record<string, unknown>) => rateBid(vars as Parameters<typeof rateBid>[0]),
    onSuccess: () => { toast.success('Feedback submitted'); onRated(); },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } }; message?: string };
      const detail = e?.response?.data?.errors?.rating_comment?.[0] ?? e?.response?.data?.message ?? e?.message ?? 'Failed to submit';
      toast.error(detail);
    },
  });

  if (!bid || !job) return null;

  const handleSubmit = () => {
    if (rating === 0) { toast.error('Select a rating'); return; }
    if (overLimit) { toast.error('Feedback must be 80 words or fewer'); return; }
    submitRating({ job_id: job.id, bid_id: bid.id, rating, rating_comment: comment.trim(), is_anonymous: isAnonymous });
  };

  const displayRating = hovered || rating;

  return (
    <Dialog open={!!bid} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[480px] p-0">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-gray-900">
              {alreadyRated ? 'Your Feedback' : 'Rate the Tradesman'}
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-0.5">
              {contractorName} · {job.name}
            </p>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Stars */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Rating</p>
            <div
              className="flex gap-1"
              onMouseLeave={() => !alreadyRated && setHovered(0)}
            >
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  disabled={alreadyRated}
                  onMouseEnter={() => !alreadyRated && setHovered(n)}
                  onClick={() => !alreadyRated && setRating(n)}
                  className="focus:outline-none transition-transform hover:scale-110 disabled:cursor-default"
                >
                  <Star className={`h-9 w-9 transition-colors ${n <= displayRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                </button>
              ))}
              {displayRating > 0 && (
                <span className="ml-2 self-center text-sm font-medium text-gray-600">
                  {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][displayRating]}
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Feedback</p>
              <span className={`text-xs ${overLimit ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                {wordCount}/80 words
              </span>
            </div>
            <textarea
              value={comment}
              onChange={e => !alreadyRated && setComment(e.target.value)}
              disabled={alreadyRated}
              placeholder="Describe your experience (optional, max 80 words)…"
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary bg-white ${overLimit ? 'border-red-400' : 'border-gray-200'} ${alreadyRated ? 'opacity-60 cursor-default' : ''}`}
            />
          </div>

          {/* Anonymous */}
          {!alreadyRated && (
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={e => setIsAnonymous(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              />
              <span className="text-sm text-gray-700">
                Submit anonymously
                <span className="block text-xs text-gray-400 mt-0.5">
                  Your name won&apos;t be shown on the tradesman&apos;s profile
                </span>
              </span>
            </label>
          )}

          {alreadyRated && bid.rating_is_anonymous && (
            <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
              Submitted anonymously · {new Date(bid.rated_at!).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
          {alreadyRated && !bid.rating_is_anonymous && (
            <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
              Submitted · {new Date(bid.rated_at!).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          {!alreadyRated && (
            <Button className="flex-1" disabled={isPending || rating === 0 || overLimit} onClick={handleSubmit}>
              {isPending ? 'Submitting…' : 'Submit Feedback'}
            </Button>
          )}
          <Button variant="outline" onClick={onClose} className={alreadyRated ? 'flex-1' : ''}>
            {alreadyRated ? 'Close' : 'Cancel'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const JobLeads = () => {
  const [compareMode, setCompareMode] = useState<Record<string, boolean>>({});
  const [selectedBidDetail, setSelectedBidDetail] = useState<Bid | null>(null);
  const [selectedBidJob, setSelectedBidJob] = useState<Job | null>(null);
  const [rateBidTarget, setRateBidTarget] = useState<{ job: Job; bid: Bid } | null>(null);
  const [leads, setLeads] = useState<Job[]>([]);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [editJob, setEditJob] = useState<Job | null>(null);
  const queryClient = useQueryClient();
  const [currentItem, setCurrentItem] = useState<Job | null>(null);
  const [currentBid, setCurrentBid] = useState<Bid | null>(null);

  const addJob = usePost({
    mutationFn: createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setCurrentItem(null);
      setCurrentBid(null);
    },
  });

  const modifyBidMutation = usePatch({
    mutationFn: modifyBid,
    onSuccess: () => {
      toast.success('Bid updated successfully');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      addJob.mutate({
        trade: currentItem?.service,
        location: currentItem?.location,
        rate: currentBid?.proposedValue,
        status: 'todo',
        priority: 'medium',
        leads_id: currentItem?.id,
        trader_id: currentBid?.bid_by,
      });
    },
    onError: () => toast.error('No trades found'),
  });

  const { data, isLoading } = useFetch('/api/v1/jobs/', {
    queryKey: ['leads'],
    queryFn: fetchLeads,
  });

  useEffect(() => {
    if (!isLoading && data) setLeads((data as Job[]) || []);
  }, [data, isLoading]);

  const toggleCompareMode = (jobId: string) => {
    setCompareMode(prev => ({ ...prev, [jobId]: !prev[jobId] }));
  };

  const handleApprove = (job: Job, bid: Bid) => {
    setCurrentItem(job);
    setCurrentBid(bid);
    modifyBidMutation.mutate({ bid_id: bid.id, status: 'accepted', lead_id: job.id, isApproved: true });
  };

  const handleJobSaved = () => {
    queryClient.invalidateQueries({ queryKey: ['leads'] });
    setEditJob(null);
  };

  const handleJobDeleted = () => {
    queryClient.invalidateQueries({ queryKey: ['leads'] });
    setEditJob(null);
  };

  const handleRated = () => {
    queryClient.invalidateQueries({ queryKey: ['leads'] });
    setRateBidTarget(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-[20px] p-4 md:p-6 border border-[#E8E8E3]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-[#F5F5F0] rounded-full flex items-center justify-center">
                <Search className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[#6B6B6B] text-sm mb-0.5">Find tradespeople</p>
                <h1 className="text-[#1A1A1A] text-2xl font-semibold">Find a Trade</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setQuoteOpen(true)}
                className="bg-[#1A1A1A] text-white hover:bg-[#333333] transition-all text-sm font-medium h-10 px-4 rounded-full"
              >
                <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Post Job
              </Button>
              <Quote open={quoteOpen} setOpen={setQuoteOpen} />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-[#F5F5F0] rounded-[16px] px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#6B6B6B] text-sm">Total Jobs</span>
                <div className="h-8 w-8 rounded-full bg-[#FEF9E7] flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-[#FBBF24]" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-[#1A1A1A] text-2xl font-semibold">{leads.length}</p>
              <p className="text-[#8B8B8B] text-xs mt-1">All posted jobs</p>
            </div>
            <div className="bg-[#F5F5F0] rounded-[16px] px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#6B6B6B] text-sm">Active</span>
                <div className="h-8 w-8 rounded-full bg-[#FEF9E7] flex items-center justify-center">
                  <Clock className="w-4 h-4 text-[#FBBF24]" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-[#1A1A1A] text-2xl font-semibold">{leads.filter(l => !l.isApproved).length}</p>
              <p className="text-[#8B8B8B] text-xs mt-1">Awaiting quotes</p>
            </div>
            <div className="bg-[#F5F5F0] rounded-[16px] px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#6B6B6B] text-sm">Quotes Received</span>
                <div className="h-8 w-8 rounded-full bg-[#FEF9E7] flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-[#FBBF24]" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-[#FBBF24] text-2xl font-semibold">{leads.reduce((acc, l) => acc + l.bids.length, 0)}</p>
              <p className="text-[#8B8B8B] text-xs mt-1">From tradespeople</p>
            </div>
            <div className="bg-[#F5F5F0] rounded-[16px] px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#6B6B6B] text-sm">Completed</span>
                <div className="h-8 w-8 rounded-full bg-[#ECFDF5] flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-[#10B981]" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-[#10B981] text-2xl font-semibold">{leads.filter(l => l.isApproved).length}</p>
              <p className="text-[#8B8B8B] text-xs mt-1">Jobs completed</p>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Jobs list */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-[20px] p-4 md:p-6 border border-[#E8E8E3]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[#1A1A1A] text-lg font-semibold">Your Jobs</h2>
                <button className="px-4 py-2 text-sm font-medium text-[#4A4A4A] hover:bg-[#F5F5F0] rounded-full transition-colors flex items-center gap-2 border border-[#E8E8E3]">
                  <Filter className="w-3 h-3" />
                  Filter
                </button>
              </div>

              <div className="space-y-3">
                {leads.map(job => (
                  <div key={job.id} className="bg-[#F5F5F0] rounded-[12px] px-5 py-4 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="flex items-start gap-4 flex-1 cursor-pointer"
                        onClick={() => setEditJob(job)}
                      >
                        <div className="h-10 w-10 rounded-[10px] bg-white border border-[#E5E7EB] flex items-center justify-center flex-shrink-0">
                          <Briefcase className="w-5 h-5 text-[#4A4A4A]" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-[#1A1A1A] text-sm font-medium">{job.name}</h3>
                            {job.bids.length > 0 && <Lock className="h-3 w-3 text-amber-500 shrink-0" />}
                          </div>
                          <p className="text-[#6B6B6B] text-xs mt-0.5">{job.service}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-[#6B6B6B]">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{job.location || '—'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <PoundSterling className="w-3 h-3" />
                              <span>{job.value}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(job.updated_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {(() => {
                          const s = job.status;
                          const cfg =
                            s === 'completed'   ? { cls: 'bg-green-50 text-green-700',   label: 'Completed' }
                            : s === 'in_progress' ? { cls: 'bg-blue-50 text-blue-700',     label: 'In Progress' }
                            : s === 'todo'        ? { cls: 'bg-purple-50 text-purple-700', label: 'Booked' }
                            : s === 'cancelled'   ? { cls: 'bg-red-50 text-red-700',       label: 'Cancelled' }
                            : job.bids.length > 0 ? { cls: 'bg-yellow-50 text-yellow-700', label: `${job.bids.length} Quote${job.bids.length > 1 ? 's' : ''}` }
                            :                       { cls: 'bg-gray-50 text-gray-600',     label: 'Awaiting quotes' };
                          return (
                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${cfg.cls}`}>
                              {cfg.label}
                            </span>
                          );
                        })()}

                        {job.status === 'completed' && job.bids.some(b => b.status === 'accepted') && (() => {
                          const acceptedBid = job.bids.find(b => b.status === 'accepted')!;
                          const alreadyRated = !!acceptedBid.rated_at;
                          return (
                            <button
                              onClick={e => { e.stopPropagation(); setRateBidTarget({ job, bid: acceptedBid }); }}
                              className={`flex items-center gap-1 px-2.5 h-8 rounded-full text-xs font-medium border transition-colors ${
                                alreadyRated
                                  ? 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
                                  : 'bg-white text-gray-700 border-[#E8E8E3] hover:bg-[#F5F5F0]'
                              }`}
                              title={alreadyRated ? 'View feedback' : 'Rate tradesman'}
                            >
                              <Star className={`w-3 h-3 ${alreadyRated ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                              {alreadyRated ? 'Rated' : 'Rate'}
                            </button>
                          );
                        })()}
                        <button
                          onClick={e => { e.stopPropagation(); setEditJob(job); }}
                          className="h-8 w-8 rounded-full bg-white border border-[#E8E8E3] flex items-center justify-center hover:bg-[#F5F5F0] transition-colors"
                          title="Edit job"
                        >
                          <Pencil className="w-3.5 h-3.5 text-[#4A4A4A]" />
                        </button>

                        <button
                          onClick={e => { e.stopPropagation(); toggleCompareMode(job.id); }}
                          className="px-3 py-1.5 text-xs font-medium text-[#4A4A4A] bg-white border border-[#E8E8E3] rounded-full hover:bg-[#E8E8E3] transition-colors"
                        >
                          {compareMode[job.id] ? 'Hide quotes' : 'View quotes'}
                        </button>
                      </div>
                    </div>

                    {/* Quotes section */}
                    {job.bids.length > 0 && compareMode[job.id] && (
                      <div className="mt-4 pt-4 border-t border-[#E8E8E8]">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {job.bids.map(bid => {
                            const profile = bid.tradepilot_profile;
                            return (
                              <div key={bid.id} className="bg-white rounded-[10px] p-4 border border-[#E8E8E3]">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-sm font-medium text-[#1A1A1A] truncate">
                                    {bid.bidder?.first_name
                                      ? `${bid.bidder.first_name} ${bid.bidder.last_name}`.trim()
                                      : bid.bidder?.email}
                                  </h4>
                                  {profile?.avg_rating !== null && profile?.avg_rating !== undefined ? (
                                    <div className="flex items-center gap-1 shrink-0">
                                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                      <span className="text-xs text-[#6B6B6B]">{profile.avg_rating}</span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-400 shrink-0">New</span>
                                  )}
                                </div>
                                {bid.company_name && (
                                  <p className="text-xs text-gray-500 mb-1.5">{bid.company_name}</p>
                                )}
                                <div className="space-y-1 text-xs text-[#6B6B6B]">
                                  <div className="flex justify-between">
                                    <span>Price:</span>
                                    <span className="font-semibold text-[#1A1A1A]">£{bid.proposedValue.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Available:</span>
                                    <span>{bid.Available ? new Date(bid.Available).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}</span>
                                  </div>
                                  {profile && (
                                    <div className="flex gap-1.5 mt-2 pt-2 border-t border-gray-100">
                                      {profile.has_insurance && (
                                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-medium">
                                          <Shield className="h-2.5 w-2.5" />Insured
                                        </span>
                                      )}
                                      {profile.has_license && (
                                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium">
                                          <BadgeCheck className="h-2.5 w-2.5" />Licensed
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <button
                                  className={`w-full mt-3 px-3 py-2 text-xs font-medium rounded-full transition-colors ${
                                    bid.status === 'accepted'
                                      ? 'bg-green-50 text-green-700 border border-green-200'
                                      : 'text-[#4A4A4A] bg-[#F5F5F0] hover:bg-[#E8E8E3]'
                                  }`}
                                  onClick={() => { setSelectedBidDetail(bid); setSelectedBidJob(job); }}
                                >
                                  {bid.status === 'accepted' ? '✓ Accepted — View Details' : 'View Details'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Post new job row */}
                <div
                  className="bg-white rounded-[12px] px-5 py-4 border-2 border-dashed border-[#E8E8E3] cursor-pointer hover:bg-[#F5F5F0] hover:border-[#FBBF24] transition-all flex items-center gap-4"
                  onClick={() => setQuoteOpen(true)}
                >
                  <div className="h-10 w-10 rounded-[10px] bg-[#FEF9E7] flex items-center justify-center flex-shrink-0">
                    <Plus className="w-5 h-5 text-[#FBBF24]" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[#1A1A1A] text-sm font-medium">Post a New Job</h4>
                    <p className="text-[#6B6B6B] text-xs">Click to get quotes from local tradespeople</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="bg-white rounded-[20px] p-4 md:p-6 border border-[#E8E8E3]">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-10 w-10 bg-[#F5F5F0] rounded-full flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.5} />
              </div>
              <h3 className="text-[#1A1A1A] text-lg font-semibold">How It Works</h3>
            </div>
            <div className="space-y-4">
              {[
                { n: 1, title: 'Post Your Job', desc: 'Describe what you need done with all the details' },
                { n: 2, title: 'Receive Quotes', desc: 'Get quotes from verified local tradespeople' },
                { n: 3, title: 'Choose & Book', desc: 'Compare quotes and select the best option' },
              ].map(s => (
                <div key={s.n} className="bg-[#F5F5F0] rounded-[12px] p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 bg-[#FEF9E7] rounded-full flex items-center justify-center text-sm font-semibold text-[#FBBF24] shrink-0">
                      {s.n}
                    </div>
                    <div>
                      <h4 className="text-[#1A1A1A] text-sm font-medium">{s.title}</h4>
                      <p className="text-[#6B6B6B] text-xs mt-1">{s.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setQuoteOpen(true)}
              className="w-full mt-4 py-3 bg-[#1A1A1A] text-white text-sm font-medium rounded-full hover:bg-[#333333] transition-colors"
            >
              Post a Job
            </button>
          </div>
        </div>
      </div>

      <EditJobModal
        job={editJob}
        onClose={() => setEditJob(null)}
        onSaved={handleJobSaved}
        onDeleted={handleJobDeleted}
      />

      <BidDetailModal
        bid={selectedBidDetail}
        job={selectedBidJob}
        onClose={() => { setSelectedBidDetail(null); setSelectedBidJob(null); }}
        onAccept={handleApprove}
      />

      <RateTradesmanModal
        job={rateBidTarget?.job ?? null}
        bid={rateBidTarget?.bid ?? null}
        onClose={() => setRateBidTarget(null)}
        onRated={handleRated}
      />
    </DashboardLayout>
  );
};

export default JobLeads;
