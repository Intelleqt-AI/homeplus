import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Calendar, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addNewEvent } from '@/lib/Api2';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

const Event = () => {
  const queryClient = useQueryClient();
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    time: '',
    type: 'maintenance',
    description: '',
    requiresTrade: false,
    estimatedCost: '',
    recurring: 'never',
    priority: 'medium',
    property: 'main',
    complianceType: 'none',
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
        toast.success('Event added');
        // setIsAddEventOpen(false);
        // reset form
        setNewEvent({
          title: '',
          date: '',
          time: '',
          type: 'maintenance',
          description: '',
          requiresTrade: false,
          estimatedCost: '',
          recurring: 'never',
          priority: 'medium',
          property: 'main',
          complianceType: 'none',
        });
      },
      onError: err => {
        console.error('Add event error', err);
        toast.error('Failed to add event');
      },
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          <span>Add Task</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Task Title</label>
            <input
              value={newEvent.title}
              onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
              type="text"
              placeholder="e.g., Check boiler pressure"
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Description</label>
            <textarea
              value={newEvent.description}
              onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
              placeholder="Add details about the task..."
              rows={3}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600" htmlFor="priority">
                Priority
              </Label>
              <Select value={newEvent.priority} onValueChange={value => setNewEvent({ ...newEvent, priority: value })}>
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
            <div>
              <label className="text-sm font-medium text-gray-600">Due Date</label>
              <Input id="date" type="date" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} />
            </div>
          </div>
          <div className="flex space-x-3 pt-4">
            <DialogTrigger asChild>
              <Button disabled={newEvent.title === ''} onClick={handleAddEvent} className="flex-1">
                Create Task
              </Button>
            </DialogTrigger>
            <Button variant="outline" className="flex-1 bg-black text-white">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Event;
