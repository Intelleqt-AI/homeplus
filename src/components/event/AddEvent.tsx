import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Bell,
  Building,
  CreditCard,
  Flame,
  Home,
  Plus,
  Settings,
  Shield,
  Trash2,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { usePost } from '@/hooks/usePost';
import { addNewEvent } from '@/lib/Api2';
import { toast } from '@/lib/toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { LucideIcon } from 'lucide-react';
import PropertySelect from '@/components/property/PropertySelect';
import { cn } from '@/lib/utils';
import { TRADE_OPTIONS, tradeCategoriesByType } from '@/lib/tradeCategories';

type EventMode = 'task' | 'reminder';

interface EventTemplate {
  id: string;
  icon: LucideIcon;
  title: string;
  type: string;
  recurring: string;
  requiresTrade: boolean;
  /** Trade slug (e.g. 'gas_engineer'). Optional — Custom templates leave blank. */
  trade?: string;
  /** Subcategory slug (e.g. 'gas_engineer_boilers'). Optional. */
  tradeCategory?: string;
}

const eventSchema = z
  .object({
    // Optional at the schema level — superRefine below enforces "required for
    // tasks only" so reminders (e.g. "Bin Day", "Pay phone bill") can be
    // saved without a property.
    propertyId: z.string().optional(),
    title: z.string().min(1, 'Title is required'),
    date: z.string().min(1, 'Date is required'),
    type: z.enum(
      ['maintenance', 'repair', 'inspection', 'compliance', 'improvement', 'cleaning', 'admin', 'other'],
      { required_error: 'Event type is required' },
    ),
    priority: z.enum(['low', 'medium', 'high', 'urgent'], { required_error: 'Priority is required' }),
    recurring: z.enum(['never', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually'], {
      required_error: 'Recurring is required',
    }),
    complianceType: z
      .enum(['gas_safety', 'eicr', 'epc', 'pat_testing', 'fire_safety', 'legionella', 'asbestos', 'other'])
      .optional(),
    requiresTrade: z.boolean().optional(),
    trade: z.string().optional(),
    tradeCategory: z.string().optional(),
    description: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.requiresTrade) {
      if (!val.propertyId) {
        ctx.addIssue({
          path: ['propertyId'],
          code: z.ZodIssueCode.custom,
          message: 'Property is required for tasks',
        });
      }
      if (!val.trade) {
        ctx.addIssue({
          path: ['trade'],
          code: z.ZodIssueCode.custom,
          message: 'Category is required for tasks',
        });
      }
      if (!val.tradeCategory) {
        ctx.addIssue({
          path: ['tradeCategory'],
          code: z.ZodIssueCode.custom,
          message: 'Subcategory is required for tasks',
        });
      }
    }
  });

type EventFormValues = z.infer<typeof eventSchema>;

interface AddEventProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialDate?: string;
  initialMode?: EventMode;
  hideTrigger?: boolean;
}

const AddEvent = ({ open, onOpenChange, initialDate, initialMode, hideTrigger }: AddEventProps = {}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isAddEventOpen = isControlled ? open : internalOpen;
  const setIsAddEventOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [taskInput, setTaskInput] = useState('');
  const [eventMode, setEventMode] = useState<EventMode>(initialMode ?? 'task');
  const queryClient = useQueryClient();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      type: 'maintenance',
      priority: 'medium',
      recurring: 'never',
      requiresTrade: true,
    },
  });

  const propertyId = watch('propertyId');

  useEffect(() => {
    if (isAddEventOpen && initialDate) {
      setValue('date', initialDate);
    }
  }, [isAddEventOpen, initialDate, setValue]);

  // Switching mode keeps everything else but flips the trade-quote intent.
  useEffect(() => {
    setValue('requiresTrade', eventMode === 'task');
    if (eventMode === 'reminder') {
      // Reminders default to "other" so the calendar treats them as non-trade items.
      setValue('type', 'other');
    }
  }, [eventMode, setValue]);

  const mutation = usePost({
    mutationFn: addNewEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event'] });
    },
    onError: error => {
      console.log(error);
      toast.error('Error! Try again');
    },
  });

  const propertyMaintenanceTemplates: EventTemplate[] = [
    { id: 'boiler', icon: Flame, title: 'Boiler Service', type: 'maintenance', recurring: 'annually', requiresTrade: true, trade: 'gas_engineer', tradeCategory: 'gas_engineer_boilers' },
    { id: 'gutter', icon: Building, title: 'Gutter Clean', type: 'maintenance', recurring: 'annually', requiresTrade: true, trade: 'roofing', tradeCategory: 'roofing_gutters_fascias_soffits' },
    // Gardening isn't in the 4-trade list; leave fields blank so the user picks.
    { id: 'garden', icon: Home, title: 'Garden Work', type: 'maintenance', recurring: 'annually', requiresTrade: true },
    { id: 'eicr', icon: Shield, title: 'EICR Check', type: 'inspection', recurring: 'annually', requiresTrade: true, trade: 'electrical', tradeCategory: 'electrical_testing_certificates' },
    { id: 'custom', icon: Plus, title: 'Custom Trade', type: 'maintenance', recurring: 'never', requiresTrade: true },
  ];

  const householdTemplates: EventTemplate[] = [
    { id: 'bins', icon: Trash2, title: 'Bin Day', type: 'cleaning', recurring: 'weekly', requiresTrade: false },
    { id: 'rent', icon: CreditCard, title: 'Pay Rent', type: 'admin', recurring: 'monthly', requiresTrade: false },
    { id: 'meter', icon: Zap, title: 'Meter Reading', type: 'admin', recurring: 'quarterly', requiresTrade: false },
    { id: 'council-tax', icon: Building, title: 'Council Tax', type: 'admin', recurring: 'monthly', requiresTrade: false },
    { id: 'custom-task', icon: Plus, title: 'Custom Task', type: 'other', recurring: 'never', requiresTrade: false },
  ];

  const councilUtilitiesTemplates: EventTemplate[] = [
    { id: 'bins-weekly', icon: Trash2, title: 'Bin Collection', type: 'cleaning', recurring: 'weekly', requiresTrade: false },
    { id: 'council-tax', icon: Building, title: 'Council Tax', type: 'admin', recurring: 'monthly', requiresTrade: false },
    { id: 'water-rates', icon: Zap, title: 'Water Rates', type: 'admin', recurring: 'monthly', requiresTrade: false },
    { id: 'tv-licence', icon: Settings, title: 'TV Licence', type: 'admin', recurring: 'annually', requiresTrade: false },
    { id: 'meter-reading', icon: Zap, title: 'Meter Readings', type: 'admin', recurring: 'quarterly', requiresTrade: false },
  ];

  const propertyAdminTemplates: EventTemplate[] = [
    { id: 'mortgage', icon: CreditCard, title: 'Mortgage Payment', type: 'admin', recurring: 'monthly', requiresTrade: false },
    { id: 'ground-rent', icon: Building, title: 'Ground Rent', type: 'admin', recurring: 'annually', requiresTrade: false },
    { id: 'service-charge', icon: Settings, title: 'Service Charge', type: 'admin', recurring: 'quarterly', requiresTrade: false },
    { id: 'buildings-insurance', icon: Shield, title: 'Buildings Insurance', type: 'admin', recurring: 'annually', requiresTrade: false },
    { id: 'contents-insurance', icon: Home, title: 'Contents Insurance', type: 'admin', recurring: 'annually', requiresTrade: false },
  ];

  const seasonalTemplates: EventTemplate[] = [
    { id: 'winter-heating', icon: Flame, title: 'Winter: Check Heating', type: 'maintenance', recurring: 'annually', requiresTrade: true, trade: 'gas_engineer', tradeCategory: 'gas_engineer_boilers' },
    { id: 'spring-gutters', icon: Building, title: 'Spring: Clear Gutters', type: 'maintenance', recurring: 'annually', requiresTrade: true, trade: 'roofing', tradeCategory: 'roofing_gutters_fascias_soffits' },
    { id: 'summer-painting', icon: Home, title: 'Summer: Exterior Check', type: 'maintenance', recurring: 'annually', requiresTrade: true },
    { id: 'autumn-chimney', icon: Flame, title: 'Autumn: Chimney Sweep', type: 'maintenance', recurring: 'annually', requiresTrade: true, trade: 'roofing', tradeCategory: 'roofing_chimney_work' },
  ];

  const recognizeTask = (input: string) => {
    const lower = input.toLowerCase();
    if (lower.includes('boiler')) return { template: propertyMaintenanceTemplates[0], suggestion: 'Annual service recommended, I can find 3 trades for you' };
    if (lower.includes('gutter')) return { template: propertyMaintenanceTemplates[1], suggestion: 'Seasonal cleaning twice per year recommended' };
    if (lower.includes('garden')) return { template: propertyMaintenanceTemplates[2], suggestion: 'Seasonal suggestions based on current month' };
    if (lower.includes('eicr') || lower.includes('electrical')) return { template: propertyMaintenanceTemplates[3], suggestion: 'Required every 5 years for landlords, 10 years for homeowners' };
    if (lower.includes('bin') || lower.includes('refuse') || lower.includes('recycling')) return { template: councilUtilitiesTemplates[0], suggestion: 'Link to council calendar for automatic reminders' };
    if (lower.includes('council tax')) return { template: councilUtilitiesTemplates[1], suggestion: 'Set up monthly payment reminder' };
    if (lower.includes('water')) return { template: councilUtilitiesTemplates[2], suggestion: 'Monthly or annual payment options available' };
    if (lower.includes('tv licence')) return { template: councilUtilitiesTemplates[3], suggestion: 'Annual renewal required for UK households' };
    if (lower.includes('meter')) return { template: councilUtilitiesTemplates[4], suggestion: 'Quarterly readings help monitor usage' };
    if (lower.includes('mortgage')) return { template: propertyAdminTemplates[0], suggestion: 'Set up monthly payment tracking' };
    if (lower.includes('rent')) return { template: householdTemplates[1], suggestion: 'Set up monthly payment reminder' };
    if (lower.includes('insurance')) return { template: propertyAdminTemplates[3], suggestion: 'Compare quotes annually for best rates' };
    return null;
  };

  const handleQuickAdd = (template: EventTemplate) => {
    setEventMode(template.requiresTrade ? 'task' : 'reminder');
    setValue('title', template.title);
    setValue('type', template.type as EventFormValues['type']);
    setValue('recurring', template.recurring as EventFormValues['recurring']);
    setValue('requiresTrade', template.requiresTrade);
    setValue('trade', template.trade ?? '');
    setValue('tradeCategory', template.tradeCategory ?? '');
    setIsAddEventOpen(true);
    setQuickAddOpen(false);
  };

  const onSubmit = (data: EventFormValues) => {
    const payload = {
      title: data.title,
      date: data.date,
      eventType: data.type,
      priority: data.priority,
      recurring: data.recurring,
      complianceType: data.complianceType,
      isRequireTrade: !!data.requiresTrade,
      // Only send trade fields when this is a task. Reminders submit them blank.
      trade: data.requiresTrade ? data.trade ?? '' : '',
      tradeCategory: data.requiresTrade ? data.tradeCategory ?? '' : '',
      description: data.description ?? '',
      property: data.propertyId,
    };

    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success(eventMode === 'task' ? 'Task added' : 'Reminder added');
        setIsAddEventOpen(false);
        reset();
      },
      onError: err => {
        console.error('Add event error', err);
        toast.error('Failed to add event');
      },
    });
  };

  const handleDialogChange = (open: boolean) => {
    setIsAddEventOpen(open);
    if (!open) reset();
  };

  return (
    <>
      <div className="relative">
        {!hideTrigger && (
          <Button
            onClick={() => setQuickAddOpen(v => !v)}
            className="bg-[#1A1A1A] text-white hover:bg-[#333333] transition-all text-sm font-medium h-10 px-4 rounded-full"
          >
            <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
            Add Task
          </Button>
        )}

        {quickAddOpen && (
          <div className="absolute top-full right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">What type of task?</h3>
              <Button variant="ghost" size="sm" onClick={() => setQuickAddOpen(false)} className="h-6 w-6 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Property Maintenance</h4>
                  <div className="space-y-2">
                    {propertyMaintenanceTemplates.slice(0, 5).map(template => {
                      const IconComponent = template.icon;
                      return (
                        <Button key={template.id} variant="outline" className="w-full justify-start text-left p-2 h-auto text-black hover:bg-black hover:text-white" onClick={() => handleQuickAdd(template)}>
                          <IconComponent className="w-4 h-4 mr-2" />
                          <div className="font-medium text-sm">{template.title}</div>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Household Tasks</h4>
                  <div className="space-y-2">
                    {householdTemplates.slice(0, 5).map(template => {
                      const IconComponent = template.icon;
                      return (
                        <Button key={template.id} variant="outline" className="w-full justify-start text-left p-2 h-auto text-black hover:bg-black hover:text-white" onClick={() => handleQuickAdd(template)}>
                          <IconComponent className="w-4 h-4 mr-2" />
                          <div className="font-medium text-sm">{template.title}</div>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Council & Utilities</h4>
                  <div className="grid grid-cols-1 gap-1">
                    {councilUtilitiesTemplates.slice(0, 3).map(template => {
                      const IconComponent = template.icon;
                      return (
                        <Button key={template.id} variant="ghost" size="sm" className="justify-start text-xs h-8 text-black hover:bg-black hover:text-white" onClick={() => handleQuickAdd(template)}>
                          <IconComponent className="w-3 h-3 mr-2" />
                          {template.title}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Property Admin</h4>
                  <div className="grid grid-cols-1 gap-1">
                    {propertyAdminTemplates.slice(0, 3).map(template => {
                      const IconComponent = template.icon;
                      return (
                        <Button key={template.id} variant="ghost" size="sm" className="justify-start text-xs h-8 text-black hover:bg-black hover:text-white" onClick={() => handleQuickAdd(template)}>
                          <IconComponent className="w-3 h-3 mr-2" />
                          {template.title}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Seasonal Tasks</h4>
                <div className="grid grid-cols-2 gap-1">
                  {seasonalTemplates.map(template => {
                    const IconComponent = template.icon;
                    return (
                      <Button key={template.id} variant="ghost" size="sm" className="justify-start text-xs h-8 text-black hover:bg-black hover:text-white" onClick={() => handleQuickAdd(template)}>
                        <IconComponent className="w-3 h-3 mr-2" />
                        {template.title.split(': ')[1]}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <Label className="text-sm font-medium text-gray-700">Or type to search:</Label>
              <Input
                placeholder="e.g., 'Boiler service', 'bins', 'rent payment'"
                value={taskInput}
                onChange={e => setTaskInput(e.target.value)}
                className="mt-1"
              />
              {taskInput && recognizeTask(taskInput) && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-900">{recognizeTask(taskInput)?.template.title}</div>
                  <div className="text-xs text-blue-700">{recognizeTask(taskInput)?.suggestion}</div>
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      const recognized = recognizeTask(taskInput);
                      if (recognized) handleQuickAdd(recognized.template);
                    }}
                  >
                    Add This Task
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Dialog open={isAddEventOpen} onOpenChange={handleDialogChange}>
        <DialogTrigger asChild>
          <div style={{ display: 'none' }} />
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{eventMode === 'task' ? 'Add Task' : 'Add Reminder'}</DialogTitle>
          </DialogHeader>

          {/* Task / Reminder mode toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              type="button"
              onClick={() => setEventMode('task')}
              className={cn(
                'flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors',
                eventMode === 'task' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
              )}
            >
              <Wrench className="w-4 h-4" />
              Task (get quotes)
            </button>
            <button
              type="button"
              onClick={() => setEventMode('reminder')}
              className={cn(
                'flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors',
                eventMode === 'reminder' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
              )}
            >
              <Bell className="w-4 h-4" />
              Reminder
            </button>
          </div>
          <p className="text-xs text-gray-500 -mt-2">
            {eventMode === 'task'
              ? 'A task sits in your calendar and lets you press "Get Quotes" to find a trade.'
              : 'A reminder sits in your calendar with a notification. No trade action.'}
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>
                Property{' '}
                {eventMode === 'task' ? (
                  <span className="text-red-500">*</span>
                ) : (
                  <span className="text-xs text-gray-400 font-normal">(optional)</span>
                )}
              </Label>
              <Controller
                name="propertyId"
                control={control}
                render={({ field }) => (
                  <PropertySelect
                    value={field.value ?? ''}
                    onChange={id => field.onChange(id)}
                    requireMapPin={eventMode === 'task'}
                  />
                )}
              />
              {errors.propertyId && <p className="text-xs text-red-500">{errors.propertyId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">{eventMode === 'task' ? 'Task Title' : 'Reminder Title'} <span className="text-red-500">*</span></Label>
              <Input
                id="title"
                placeholder={eventMode === 'task' ? 'e.g., Annual Boiler Service' : 'e.g., Bin Day'}
                {...register('title')}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date <span className="text-red-500">*</span></Label>
              <Input id="date" type="date" {...register('date')} className={errors.date ? 'border-red-500' : ''} />
              {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
            </div>

            {eventMode === 'task' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="trade">Category <span className="text-red-500">*</span></Label>
                  <Controller
                    name="trade"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={v => {
                          field.onChange(v);
                          // Reset subcategory whenever the parent trade changes
                          // so an invalid pair can't be submitted.
                          setValue('tradeCategory', '');
                        }}
                        value={field.value ?? ''}
                      >
                        <SelectTrigger className={errors.trade ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {TRADE_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.trade && <p className="text-xs text-red-500">{errors.trade.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tradeCategory">Subcategory <span className="text-red-500">*</span></Label>
                  <Controller
                    name="tradeCategory"
                    control={control}
                    render={({ field }) => {
                      const tradeValue = watch('trade') ?? '';
                      const options = tradeValue ? tradeCategoriesByType[tradeValue] ?? [] : [];
                      return (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? ''}
                          disabled={!tradeValue}
                        >
                          <SelectTrigger className={errors.tradeCategory ? 'border-red-500' : ''}>
                            <SelectValue placeholder={tradeValue ? 'Select subcategory' : 'Pick a category first'} />
                          </SelectTrigger>
                          <SelectContent>
                            {options.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      );
                    }}
                  />
                  {errors.tradeCategory && (
                    <p className="text-xs text-red-500">{errors.tradeCategory.message}</p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="type">Type <span className="text-red-500">*</span></Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="repair">Repair</SelectItem>
                        <SelectItem value="inspection">Inspection</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                        <SelectItem value="improvement">Improvement</SelectItem>
                        <SelectItem value="cleaning">Cleaning</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.type && <p className="text-xs text-red-500">{errors.type.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority <span className="text-red-500">*</span></Label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className={errors.priority ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.priority && <p className="text-xs text-red-500">{errors.priority.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="recurring">Recurring</Label>
                <Controller
                  name="recurring"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">Never</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Biweekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="complianceType">Compliance Type</Label>
                <Controller
                  name="complianceType"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <SelectTrigger>
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gas_safety">Gas Safety Certificate</SelectItem>
                        <SelectItem value="eicr">EICR</SelectItem>
                        <SelectItem value="epc">EPC</SelectItem>
                        <SelectItem value="pat_testing">PAT Testing</SelectItem>
                        <SelectItem value="fire_safety">Fire Safety</SelectItem>
                        <SelectItem value="legionella">Legionella Risk Assessment</SelectItem>
                        <SelectItem value="asbestos">Asbestos Survey</SelectItem>
                        <SelectItem value="other">Other Compliance</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Optional description..." rows={3} {...register('description')} />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => handleDialogChange(false)} className="text-black hover:bg-black hover:text-white">
                Cancel
              </Button>
              <Button type="submit" disabled={eventMode === 'task' && !propertyId}>
                {eventMode === 'task' ? 'Add Task' : 'Add Reminder'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddEvent;
