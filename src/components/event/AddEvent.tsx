import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Building, CreditCard, Flame, Home, Plus, Settings, Shield, Trash2, X, Zap } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addNewEvent } from '@/lib/Api2';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.string().min(1, 'Date is required'),
  type: z.enum(['maintenance', 'repair', 'inspection', 'compliance', 'improvement', 'cleaning', 'admin', 'other'], {
    required_error: 'Event type is required',
  }),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    required_error: 'Priority is required',
  }),
  recurring: z.enum(['never', 'weekly', 'monthly', 'quarterly', 'annually'], {
    required_error: 'Recurring is required',
  }),
  estimatedCost: z.string().optional(),
  complianceType: z.enum(['gas_safety', 'eicr', 'epc', 'pat_testing', 'fire_safety', 'legionella', 'asbestos', 'other'], {
    required_error: 'Compliance type is required',
  }),
  requiresTrade: z.boolean().optional(),
  description: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

const AddEvent = () => {
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<'property' | 'household' | null>(null);
  const [taskInput, setTaskInput] = useState('');
  const queryClient = useQueryClient();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
  });

  const mutation = useMutation({
    mutationFn: addNewEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event'] });
    },
    onError: error => {
      console.log(error);
      toast.error('Error! Try again');
    },
  });

  // Quick Add Task Templates
  const propertyMaintenanceTemplates = [
    { id: 'boiler', icon: Flame, title: 'Boiler Service', type: 'maintenance', recurring: 'annually', cost: '120' },
    { id: 'gutter', icon: Building, title: 'Gutter Clean', type: 'maintenance', recurring: 'annually', cost: '180' },
    { id: 'garden', icon: Home, title: 'Garden Work', type: 'maintenance', recurring: 'annually', cost: '250' },
    { id: 'eicr', icon: Shield, title: 'EICR Check', type: 'inspection', recurring: 'annually', cost: '350' },
    { id: 'custom', icon: Plus, title: 'Custom Trade', type: 'maintenance', recurring: 'never', cost: '0' },
  ];

  const householdTemplates = [
    { id: 'bins', icon: Trash2, title: 'Bin Day', type: 'cleaning', recurring: 'weekly', cost: '0' },
    { id: 'rent', icon: CreditCard, title: 'Pay Rent', type: 'admin', recurring: 'monthly', cost: '0' },
    { id: 'meter', icon: Zap, title: 'Meter Reading', type: 'admin', recurring: 'quarterly', cost: '0' },
    { id: 'council-tax', icon: Building, title: 'Council Tax', type: 'admin', recurring: 'monthly', cost: '200' },
    { id: 'custom-task', icon: Plus, title: 'Custom Task', type: 'other', recurring: 'never', cost: '0' },
  ];

  const councilUtilitiesTemplates = [
    { id: 'bins-weekly', icon: Trash2, title: 'Bin Collection', type: 'cleaning', recurring: 'weekly', cost: '0' },
    { id: 'council-tax', icon: Building, title: 'Council Tax', type: 'admin', recurring: 'monthly', cost: '120' },
    { id: 'water-rates', icon: Zap, title: 'Water Rates', type: 'admin', recurring: 'monthly', cost: '35' },
    { id: 'tv-licence', icon: Settings, title: 'TV Licence', type: 'admin', recurring: 'annually', cost: '159' },
    { id: 'meter-reading', icon: Zap, title: 'Meter Readings', type: 'admin', recurring: 'quarterly', cost: '0' },
  ];

  const propertyAdminTemplates = [
    { id: 'mortgage', icon: CreditCard, title: 'Mortgage Payment', type: 'admin', recurring: 'monthly', cost: '0' },
    { id: 'ground-rent', icon: Building, title: 'Ground Rent', type: 'admin', recurring: 'annually', cost: '0' },
    { id: 'service-charge', icon: Settings, title: 'Service Charge', type: 'admin', recurring: 'quarterly', cost: '0' },
    { id: 'buildings-insurance', icon: Shield, title: 'Buildings Insurance', type: 'admin', recurring: 'annually', cost: '300' },
    { id: 'contents-insurance', icon: Home, title: 'Contents Insurance', type: 'admin', recurring: 'annually', cost: '150' },
  ];

  const seasonalTemplates = [
    { id: 'winter-heating', icon: Flame, title: 'Winter: Check Heating', type: 'maintenance', recurring: 'annually', cost: '0' },
    { id: 'spring-gutters', icon: Building, title: 'Spring: Clear Gutters', type: 'maintenance', recurring: 'annually', cost: '120' },
    { id: 'summer-painting', icon: Home, title: 'Summer: Exterior Check', type: 'maintenance', recurring: 'annually', cost: '300' },
    { id: 'autumn-chimney', icon: Flame, title: 'Autumn: Chimney Sweep', type: 'maintenance', recurring: 'annually', cost: '80' },
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

  const handleQuickAdd = (template: any) => {
    setValue('title', template.title);
    setValue('type', template.type as EventFormValues['type']);
    setValue('recurring', template.recurring as EventFormValues['recurring']);
    setValue('estimatedCost', template.cost);
    setValue('requiresTrade', template.type === 'maintenance');
    setIsAddEventOpen(true);
    setQuickAddType(null);
  };

  const onSubmit = (data: EventFormValues) => {
    const payload = {
      title: data.title,
      date: data.date,
      eventType: data.type,
      priority: data.priority,
      cost: data.estimatedCost ? Number(data.estimatedCost) : 0,
      recurring: data.recurring,
      complianceType: data.complianceType,
      isRequireTrade: !!data.requiresTrade,
      description: data.description ?? '',
    };

    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success('Event added');
        setIsAddEventOpen(false);
        reset();
      },
      onError: (err) => {
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
        <Button
          onClick={() => setQuickAddType('property')}
          className="bg-[#1A1A1A] text-white hover:bg-[#333333] transition-all text-sm font-medium h-10 px-4 rounded-full"
        >
          <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
          Add Task
        </Button>

        {quickAddType && (
          <div className="absolute top-full right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">What type of task?</h3>
              <Button variant="ghost" size="sm" onClick={() => setQuickAddType(null)} className="h-6 w-6 p-0">
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
                          <div>
                            <div className="font-medium text-sm">{template.title}</div>
                            <div className="text-xs">{template.cost}</div>
                          </div>
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
                          <div>
                            <div className="font-medium text-sm">{template.title}</div>
                            <div className="text-xs text-gray-500">{template.cost}</div>
                          </div>
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
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title <span className="text-red-500">*</span></Label>
              <Input id="title" placeholder="e.g., Boiler Service" {...register('title')} className={errors.title ? 'border-red-500' : ''} />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date <span className="text-red-500">*</span></Label>
              <Input id="date" type="date" {...register('date')} className={errors.date ? 'border-red-500' : ''} />
              {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="type">Event Type <span className="text-red-500">*</span></Label>
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
                <Label htmlFor="estimatedCost">Estimated Cost</Label>
                <Input id="estimatedCost" placeholder="£150" {...register('estimatedCost')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recurring">Recurring <span className="text-red-500">*</span></Label>
                <Controller
                  name="recurring"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className={errors.recurring ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">Never</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.recurring && <p className="text-xs text-red-500">{errors.recurring.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="complianceType">Compliance Type <span className="text-red-500">*</span></Label>
                <Controller
                  name="complianceType"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <SelectTrigger className={errors.complianceType ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select compliance type" />
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
                {errors.complianceType && <p className="text-xs text-red-500">{errors.complianceType.message}</p>}
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <input type="checkbox" id="requiresTrade" {...register('requiresTrade')} className="rounded" />
                <Label htmlFor="requiresTrade">Requires Trade?</Label>
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
              <Button type="submit">Add Event</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddEvent;
