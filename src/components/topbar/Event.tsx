import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Calendar, Plus, Bell, ClipboardList, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addNewEvent } from '@/lib/Api2';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Link } from 'react-router-dom';

const Event = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [eventMode, setEventMode] = useState<'task' | 'reminder'>('task');
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

  const openDialog = (mode: 'task' | 'reminder') => {
    setEventMode(mode);
    setDialogOpen(true);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {/* Stacked Buttons */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => openDialog('reminder')}
          className="flex items-center justify-center h-9 px-4 bg-[#1A1A1A] text-white text-sm font-medium rounded-full hover:bg-[#333333] transition-colors"
        >
          Add Reminder
        </button>
        <button
          onClick={() => openDialog('task')}
          className="flex items-center justify-center h-9 px-4 bg-[#1A1A1A] text-white text-sm font-medium rounded-full hover:bg-[#333333] transition-colors"
        >
          Add Task
        </button>
        <Link to="/dashboard/documents">
          <button
            className="flex items-center justify-center h-9 px-4 w-full bg-[#1A1A1A] text-white text-sm font-medium rounded-full hover:bg-[#333333] transition-colors"
          >
            Add Document
          </button>
        </Link>
      </div>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{eventMode === 'task' ? 'Add New Task' : 'Add New Reminder'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium text-gray-600">{eventMode === 'task' ? 'Task Title' : 'Reminder Title'}</label>
            <input
              value={newEvent.title}
              onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
              type="text"
              placeholder={eventMode === 'task' ? 'e.g., Check boiler pressure' : 'e.g., Pay electricity bill'}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Description</label>
            <textarea
              value={newEvent.description}
              onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
              placeholder={eventMode === 'task' ? 'Add details about the task...' : 'Add details about the reminder...'}
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
              <label className="text-sm font-medium text-gray-600">{eventMode === 'task' ? 'Due Date' : 'Remind On'}</label>
              <Input id="date" type="date" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} />
            </div>
          </div>
          <div className="flex space-x-3 pt-4">
            <Button disabled={newEvent.title === ''} onClick={() => { handleAddEvent(); setDialogOpen(false); }} className="flex-1">
              {eventMode === 'task' ? 'Create Task' : 'Set Reminder'}
            </Button>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Event;
