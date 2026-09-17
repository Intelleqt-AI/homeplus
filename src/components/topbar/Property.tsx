import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePost } from '@/hooks/usePost';
import { useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import React from 'react';
import { toast } from '@/lib/toast';
import { Button } from '../ui/button';

const Property = () => {
  const queryClient = useQueryClient();

  const mutation = usePost({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property'] });
    },
    onError: (error) => {
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

    mutation.mutate({
      url: '/api/v1/properties/',
      data: {
        address: payload.address,
        postcode: '',
        property_type: (payload.type || 'other').toLowerCase().replace(' ', '_'),
        role: (payload.role || 'homeowner').toLowerCase(),
        bedrooms: Number(payload.bedrooms) || 0,
        bathrooms: 0,
      },
    }, {
      onSuccess: () => {
        toast.success('Property added');
        setIsAddPropertyOpen(false);
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
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="House">House</SelectItem>
                  <SelectItem value="Flat">Flat</SelectItem>
                  <SelectItem value="Apartment">Apartment</SelectItem>
                  <SelectItem value="Studio">Studio</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Bedrooms</label>
              <Select value={bedrooms} onValueChange={setBedrooms}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5+">5+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Your Role</label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Owner-occupier">Owner-occupier</SelectItem>
                <SelectItem value="Landlord">Landlord</SelectItem>
                <SelectItem value="Tenant">Tenant</SelectItem>
                <SelectItem value="Property Manager">Property Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded-md p-2">
            ⚠ For posting jobs, set the exact location and postcode in <strong>Settings → Properties</strong> after adding.
          </p>
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
