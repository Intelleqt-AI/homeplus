import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { addNewProperty } from '@/lib/Api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';

const Property = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: addNewProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property'] });
    },
    onError: error => {
      console.log(error);
      toast.error('Error! Try again');
    },
  });

  // form state for Add Property
  const [isAddPropertyOpen, setIsAddPropertyOpen] = React.useState(false);
  const [address, setAddress] = React.useState('');
  const [type, setType] = React.useState('House');
  const [bedrooms, setBedrooms] = React.useState('1');
  const [role, setRole] = React.useState('Owner-occupier');

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      address: address.trim(),
      type,
      bedrooms,
      role,
    };

    if (!payload.address) {
      toast.error('Please enter an address');
      return;
    }

    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success('Property added');
        setIsAddPropertyOpen(false);
        // reset simple fields
        setAddress('');
        setType('House');
        setBedrooms('1');
        setRole('Owner-occupier');
      },
    });
  };

  return (
    <Dialog open={isAddPropertyOpen} onOpenChange={setIsAddPropertyOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center space-x-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
          <Plus className="w-4 h-4 text-gray-600" strokeWidth={1} />
          <span className="text-sm font-medium text-gray-700">Property</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Property</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAddProperty} className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Property Address</label>
            <input
              type="text"
              placeholder="Enter full address"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Property Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option>House</option>
                <option>Flat</option>
                <option>Apartment</option>
                <option>Studio</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Bedrooms</label>
              <select
                value={bedrooms}
                onChange={e => setBedrooms(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option>1</option>
                <option>2</option>
                <option>3</option>
                <option>4</option>
                <option>5+</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Your Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option>Owner-occupier</option>
              <option>Landlord</option>
              <option>Tenant</option>
              <option>Property Manager</option>
            </select>
          </div>
          <div className="flex space-x-3 pt-4">
            <Button type="submit" className="flex-1" disabled={mutation.status === 'pending'}>
              {mutation.status === 'pending' ? 'Adding...' : 'Add Property'}
            </Button>
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsAddPropertyOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default Property;
