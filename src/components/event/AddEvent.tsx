import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Building,
  CreditCard,
  Flame,
  Home,
  Plus,
  Settings,
  Shield,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addNewEvent } from "@/lib/Api2";
import { toast } from "sonner";

const AddEvent = () => {
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<
    "property" | "household" | null
  >(null);
  const [taskInput, setTaskInput] = useState("");
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const [selectedEvents, setSelectedEvents] = useState<number[]>([]);
  const queryClient = useQueryClient();

  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    time: "",
    type: "maintenance",
    description: "",
    requiresTrade: false,
    estimatedCost: "",
    recurring: "never",
    priority: "medium",
    property: "main",
    complianceType: "none",
  });

  const mutation = useMutation({
    mutationFn: addNewEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event"] });
    },
    onError: (error) => {
      console.log(error);
      toast.error("Error! Try again");
    },
  });

  // Quick Add Task Templates
  const propertyMaintenanceTemplates = [
    {
      id: "boiler",
      icon: Flame,
      title: "Boiler Service",
      type: "maintenance",
      recurring: "annual",
      cost: "120",
    },
    {
      id: "gutter",
      icon: Building,
      title: "Gutter Clean",
      type: "maintenance",
      recurring: "biannual",
      cost: "180",
    },
    {
      id: "garden",
      icon: Home,
      title: "Garden Work",
      type: "maintenance",
      recurring: "seasonal",
      cost: "250",
    },
    {
      id: "eicr",
      icon: Shield,
      title: "EICR Check",
      type: "safety",
      recurring: "5years",
      cost: "350",
    },
    {
      id: "custom",
      icon: Plus,
      title: "Custom Trade",
      type: "custom",
      recurring: "never",
      cost: "0",
    },
  ];

  const householdTemplates = [
    {
      id: "bins",
      icon: Trash2,
      title: "Bin Day",
      type: "household",
      recurring: "weekly",
      cost: "0",
    },
    {
      id: "rent",
      icon: CreditCard,
      title: "Pay Rent",
      type: "financial",
      recurring: "monthly",
      cost: "0",
    },
    {
      id: "meter",
      icon: Zap,
      title: "Meter Reading",
      type: "household",
      recurring: "quarterly",
      cost: "0",
    },
    {
      id: "council-tax",
      icon: Building,
      title: "Council Tax",
      type: "financial",
      recurring: "monthly",
      cost: "200",
    },
    {
      id: "custom-task",
      icon: Plus,
      title: "Custom Task",
      type: "custom",
      recurring: "never",
      cost: "0",
    },
  ];

  // Additional household task categories
  const councilUtilitiesTemplates = [
    {
      id: "bins-weekly",
      icon: Trash2,
      title: "Bin Collection",
      type: "household",
      recurring: "weekly",
      cost: "0",
    },
    {
      id: "council-tax",
      icon: Building,
      title: "Council Tax",
      type: "financial",
      recurring: "monthly",
      cost: "120",
    },
    {
      id: "water-rates",
      icon: Zap,
      title: "Water Rates",
      type: "financial",
      recurring: "monthly",
      cost: "35",
    },
    {
      id: "tv-licence",
      icon: Settings,
      title: "TV Licence",
      type: "financial",
      recurring: "annual",
      cost: "159",
    },
    {
      id: "meter-reading",
      icon: Zap,
      title: "Meter Readings",
      type: "household",
      recurring: "quarterly",
      cost: "0",
    },
  ];

  const propertyAdminTemplates = [
    {
      id: "mortgage",
      icon: CreditCard,
      title: "Mortgage Payment",
      type: "financial",
      recurring: "monthly",
      cost: "0",
    },
    {
      id: "ground-rent",
      icon: Building,
      title: "Ground Rent",
      type: "financial",
      recurring: "annual",
      cost: "0",
    },
    {
      id: "service-charge",
      icon: Settings,
      title: "Service Charge",
      type: "financial",
      recurring: "quarterly",
      cost: "0",
    },
    {
      id: "buildings-insurance",
      icon: Shield,
      title: "Buildings Insurance",
      type: "financial",
      recurring: "annual",
      cost: "300",
    },
    {
      id: "contents-insurance",
      icon: Home,
      title: "Contents Insurance",
      type: "financial",
      recurring: "annual",
      cost: "150",
    },
  ];

  const seasonalTemplates = [
    {
      id: "winter-heating",
      icon: Flame,
      title: "Winter: Check Heating",
      type: "maintenance",
      recurring: "annual",
      cost: "0",
    },
    {
      id: "spring-gutters",
      icon: Building,
      title: "Spring: Clear Gutters",
      type: "maintenance",
      recurring: "annual",
      cost: "120",
    },
    {
      id: "summer-painting",
      icon: Home,
      title: "Summer: Exterior Check",
      type: "maintenance",
      recurring: "annual",
      cost: "300",
    },
    {
      id: "autumn-chimney",
      icon: Flame,
      title: "Autumn: Chimney Sweep",
      type: "maintenance",
      recurring: "annual",
      cost: "80",
    },
  ];

  // Enhanced smart task recognition
  const recognizeTask = (input: string) => {
    const lower = input.toLowerCase();

    // Property maintenance
    if (lower.includes("boiler"))
      return {
        template: propertyMaintenanceTemplates[0],
        suggestion: "Annual service recommended, I can find 3 trades for you",
      };
    if (lower.includes("gutter"))
      return {
        template: propertyMaintenanceTemplates[1],
        suggestion: "Seasonal cleaning twice per year recommended",
      };
    if (lower.includes("garden"))
      return {
        template: propertyMaintenanceTemplates[2],
        suggestion: "Seasonal suggestions based on current month",
      };
    if (lower.includes("eicr") || lower.includes("electrical"))
      return {
        template: propertyMaintenanceTemplates[3],
        suggestion:
          "Required every 5 years for landlords, 10 years for homeowners",
      };

    // Council & utilities
    if (
      lower.includes("bin") ||
      lower.includes("refuse") ||
      lower.includes("recycling")
    )
      return {
        template: councilUtilitiesTemplates[0],
        suggestion: "Link to council calendar for automatic reminders",
      };
    if (lower.includes("council tax"))
      return {
        template: councilUtilitiesTemplates[1],
        suggestion: "Set up monthly payment reminder",
      };
    if (lower.includes("water"))
      return {
        template: councilUtilitiesTemplates[2],
        suggestion: "Monthly or annual payment options available",
      };
    if (lower.includes("tv licence"))
      return {
        template: councilUtilitiesTemplates[3],
        suggestion: "Annual renewal required for UK households",
      };
    if (lower.includes("meter"))
      return {
        template: councilUtilitiesTemplates[4],
        suggestion: "Quarterly readings help monitor usage",
      };

    // Property admin
    if (lower.includes("mortgage"))
      return {
        template: propertyAdminTemplates[0],
        suggestion: "Set up monthly payment tracking",
      };
    if (lower.includes("rent"))
      return {
        template: householdTemplates[1],
        suggestion: "Set up monthly payment reminder",
      };
    if (lower.includes("insurance"))
      return {
        template: propertyAdminTemplates[3],
        suggestion: "Compare quotes annually for best rates",
      };

    return null;
  };

  const handleQuickAdd = (template: any) => {
    setNewEvent({
      ...newEvent,
      title: template.title,
      type: template.type,
      recurring: template.recurring,
      estimatedCost: template.cost,
      requiresTrade: template.type === "maintenance",
    });
    setIsAddEventOpen(true);
    setQuickAddType(null);
  };

  const handleAddEvent = () => {
    // Build payload matching Supabase event table columns
    const payload = {
      title: newEvent.title,
      date: newEvent.date || null,
      eventType: newEvent.type,
      priority: newEvent.priority,
      cost: newEvent.estimatedCost ? Number(newEvent.estimatedCost) : 0,
      recurring: newEvent.recurring,
      complianceType: newEvent.complianceType,
      isRequireTrade: !!newEvent.requiresTrade,
      description: newEvent.description,
    };

    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Event added");
        setIsAddEventOpen(false);
        // reset form
        setNewEvent({
          title: "",
          date: "",
          time: "",
          type: "maintenance",
          description: "",
          requiresTrade: false,
          estimatedCost: "",
          recurring: "never",
          priority: "medium",
          property: "main",
          complianceType: "none",
        });
      },
      onError: (err) => {
        console.error("Add event error", err);
        toast.error("Failed to add event");
      },
    });
  };

  const handleBulkAction = (action: string) => {
    console.log(`Bulk ${action} for events:`, selectedEvents);
    setSelectedEvents([]);
  };

  return (
    <>
      {/* Quick Add with Smart Options */}
      <div className="relative">
        <Button
          onClick={() => setQuickAddType("property")}
          className="flex items-center space-x-2 px-4 py-2">
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Add Task</span>
        </Button>

        {/* Quick Add Popover */}
        {quickAddType && (
          <div className="absolute top-full right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">What type of task?</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuickAddType(null)}
                className="h-6 w-6 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-4">
              {/* Main Categories */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Property Maintenance
                  </h4>
                  <div className="space-y-2">
                    {propertyMaintenanceTemplates
                      .slice(0, 5)
                      .map((template) => {
                        const IconComponent = template.icon;
                        return (
                          <Button
                            key={template.id}
                            variant="outline"
                            className="w-full justify-start text-left p-2 h-auto text-black hover:bg-black hover:text-white"
                            onClick={() => handleQuickAdd(template)}>
                            <IconComponent className="w-4 h-4 mr-2" />
                            <div>
                              <div className="font-medium text-sm">
                                {template.title}
                              </div>
                              <div className="text-xs">{template.cost}</div>
                            </div>
                          </Button>
                        );
                      })}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Household Tasks
                  </h4>
                  <div className="space-y-2">
                    {householdTemplates.slice(0, 5).map((template) => {
                      const IconComponent = template.icon;
                      return (
                        <Button
                          key={template.id}
                          variant="outline"
                          className="w-full justify-start text-left p-2 h-auto text-black hover:bg-black hover:text-white"
                          onClick={() => handleQuickAdd(template)}>
                          <IconComponent className="w-4 h-4 mr-2" />
                          <div>
                            <div className="font-medium text-sm">
                              {template.title}
                            </div>
                            <div className="text-xs text-gray-500">
                              {template.cost}
                            </div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Extended Categories */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Council & Utilities
                  </h4>
                  <div className="grid grid-cols-1 gap-1">
                    {councilUtilitiesTemplates.slice(0, 3).map((template) => {
                      const IconComponent = template.icon;
                      return (
                        <Button
                          key={template.id}
                          variant="ghost"
                          size="sm"
                          className="justify-start text-xs h-8 text-black hover:bg-black hover:text-white"
                          onClick={() => handleQuickAdd(template)}>
                          <IconComponent className="w-3 h-3 mr-2" />
                          {template.title}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Property Admin
                  </h4>
                  <div className="grid grid-cols-1 gap-1">
                    {propertyAdminTemplates.slice(0, 3).map((template) => {
                      const IconComponent = template.icon;
                      return (
                        <Button
                          key={template.id}
                          variant="ghost"
                          size="sm"
                          className="justify-start text-xs h-8 text-black hover:bg-black hover:text-white"
                          onClick={() => handleQuickAdd(template)}>
                          <IconComponent className="w-3 h-3 mr-2" />
                          {template.title}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Seasonal Tasks */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Seasonal Tasks
                </h4>
                <div className="grid grid-cols-2 gap-1">
                  {seasonalTemplates.map((template) => {
                    const IconComponent = template.icon;
                    return (
                      <Button
                        key={template.id}
                        variant="ghost"
                        size="sm"
                        className="justify-start text-xs h-8 text-black hover:bg-black hover:text-white"
                        onClick={() => handleQuickAdd(template)}>
                        <IconComponent className="w-3 h-3 mr-2" />
                        {template.title.split(": ")[1]}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Smart Recognition Input */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium text-gray-700">
                Or type to search:
              </Label>
              <Input
                placeholder="e.g., 'Boiler service', 'bins', 'rent payment'"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                className="mt-1"
              />
              {taskInput && recognizeTask(taskInput) && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-900">
                    {recognizeTask(taskInput)?.template.title}
                  </div>
                  <div className="text-xs text-blue-700">
                    {recognizeTask(taskInput)?.suggestion}
                  </div>
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      const recognized = recognizeTask(taskInput);
                      if (recognized) handleQuickAdd(recognized.template);
                    }}>
                    Add This Task
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
        <DialogTrigger asChild>
          <div style={{ display: "none" }} />
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                value={newEvent.title}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, title: e.target.value })
                }
                placeholder="e.g., Boiler Service"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newEvent.date}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, date: e.target.value })
                  }
                />
              </div>
              {/* <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input id="time" type="time" value={newEvent.time} onChange={e => setNewEvent({ ...newEvent, time: e.target.value })} />
              </div> */}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="type">Event Type</Label>
                <Select
                  value={newEvent.type}
                  onValueChange={(value) =>
                    setNewEvent({ ...newEvent, type: value })
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newEvent.priority}
                  onValueChange={(value) =>
                    setNewEvent({ ...newEvent, priority: value })
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="estimatedCost">Estimated Cost</Label>
                <Input
                  id="estimatedCost"
                  value={newEvent.estimatedCost}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, estimatedCost: e.target.value })
                  }
                  placeholder="£150"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recurring">Recurring</Label>
                <Select
                  value={newEvent.recurring}
                  onValueChange={(value) =>
                    setNewEvent({ ...newEvent, recurring: value })
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="complianceType">Compliance Type</Label>
                <Select
                  value={newEvent.complianceType}
                  onValueChange={(value) =>
                    setNewEvent({ ...newEvent, complianceType: value })
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="gas_safety">Gas Safety</SelectItem>
                    <SelectItem value="eicr">EICR</SelectItem>
                    <SelectItem value="epc">EPC</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="pat_testing">PAT Testing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="requiresTrade"
                  checked={newEvent.requiresTrade}
                  onChange={(e) =>
                    setNewEvent({
                      ...newEvent,
                      requiresTrade: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <Label htmlFor="requiresTrade">Requires Trade?</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newEvent.description}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, description: e.target.value })
                }
                placeholder="Optional description..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsAddEventOpen(false)}
              className="text-black hover:bg-black hover:text-white">
              Cancel
            </Button>
            <Button onClick={handleAddEvent}>Add Event</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddEvent;
