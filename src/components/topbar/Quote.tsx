import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Wrench } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const Quote = ({ open, setOpen }) => {
  const { user } = useAuth();

  const [service, setService] = useState('Plumbing');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://bozuxpzratqjsjqgjchq.supabase.co/functions/v1/receive-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvenV4cHpyYXRxanNqcWdqY2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzY3ODMsImV4cCI6MjA3MjY1Mjc4M30.X25eruOvP6dZlxRwrzJdIB_nRoms_vH2ZOCNaA_a76E`, // keep existing auth header
        },
        body: JSON.stringify({
          name: user?.user_metadata?.full_name,
          email: user?.email,
          phone: user?.phone,
          service,
          location: location,
          value: budget,
          priority,
          homeID: user?.id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Job posted successfully!');
        setOpen(false);
      } else {
        toast.error('Error posting job: ' + (data.error || JSON.stringify(data)));
      }
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? (err as { message?: string }).message : String(err);
      toast.error('Network error: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Get Quotes</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Service Required</label>
            <select className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option>Plumbing</option>
              <option>Electrical</option>
              <option>Heating</option>
              <option>Gardening</option>
              <option>Cleaning</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Location</label>
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Enter your location..."
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Budget Range</label>
              <input
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder="e.g. 200 or £100-250"
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value={'low'}>Low</option>
                <option value={'medium'}>Medium</option>
                <option value={'high'}>High</option>
              </select>
            </div>
          </div>
          <div className="flex space-x-3 pt-4">
            <Button onClick={handleSubmit} className="flex-1" disabled={loading}>
              {loading ? 'Posting…' : 'Post Job'}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Quote;
