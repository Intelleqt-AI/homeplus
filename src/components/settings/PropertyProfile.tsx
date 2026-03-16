import { useState } from 'react';
import { Home, Flame, Droplets, Zap, Plus, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Appliance {
  id: string;
  name: string;
  make: string;
  model: string;
  installDate: string;
  warrantyExpiry: string;
  category: 'heating' | 'plumbing' | 'electrical' | 'kitchen' | 'other';
}

const CATEGORY_CONFIG = {
  heating: { label: 'Heating', icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50' },
  plumbing: { label: 'Plumbing', icon: Droplets, color: 'text-blue-600', bg: 'bg-blue-50' },
  electrical: { label: 'Electrical', icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  kitchen: { label: 'Kitchen', icon: Home, color: 'text-green-600', bg: 'bg-green-50' },
  other: { label: 'Other', icon: Home, color: 'text-gray-600', bg: 'bg-gray-50' },
};

const SAMPLE_APPLIANCES: Appliance[] = [
  { id: '1', name: 'Boiler', make: 'Worcester Bosch', model: 'Greenstar 4000', installDate: '2021-03-15', warrantyExpiry: '2028-03-15', category: 'heating' },
  { id: '2', name: 'Washing Machine', make: 'Samsung', model: 'WW90T554DAW', installDate: '2023-06-20', warrantyExpiry: '2025-06-20', category: 'kitchen' },
  { id: '3', name: 'Hot Water Cylinder', make: 'Megaflo', model: 'Eco 170i', installDate: '2021-03-15', warrantyExpiry: '2031-03-15', category: 'plumbing' },
  { id: '4', name: 'Consumer Unit', make: 'Hager', model: 'VML916', installDate: '2022-09-10', warrantyExpiry: '2027-09-10', category: 'electrical' },
];

const PropertyProfile = () => {
  const [appliances, setAppliances] = useState<Appliance[]>(SAMPLE_APPLIANCES);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAppliance, setNewAppliance] = useState<Partial<Appliance>>({ category: 'heating' });

  const [propertyDetails, setPropertyDetails] = useState({
    yearBuilt: '2005',
    heatingType: 'Gas Boiler',
    roofType: 'Pitched - Tile',
    lastRoofInspection: '2023-11-01',
    windowType: 'Double Glazed - uPVC',
    insulationType: 'Cavity Wall + Loft',
  });

  const getWarrantyStatus = (expiry: string) => {
    const now = new Date();
    const exp = new Date(expiry);
    const diff = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { label: 'Expired', color: 'text-red-600', bg: 'bg-red-50' };
    if (diff <= 90) return { label: `${diff}d left`, color: 'text-amber-600', bg: 'bg-amber-50' };
    return { label: 'Active', color: 'text-emerald-600', bg: 'bg-emerald-50' };
  };

  const handleAddAppliance = () => {
    if (!newAppliance.name || !newAppliance.make) return;
    const appliance: Appliance = {
      id: Date.now().toString(),
      name: newAppliance.name || '',
      make: newAppliance.make || '',
      model: newAppliance.model || '',
      installDate: newAppliance.installDate || '',
      warrantyExpiry: newAppliance.warrantyExpiry || '',
      category: (newAppliance.category as Appliance['category']) || 'other',
    };
    setAppliances(prev => [...prev, appliance]);
    setNewAppliance({ category: 'heating' });
    setShowAddForm(false);
  };

  const handleRemoveAppliance = (id: string) => {
    setAppliances(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Property Details */}
      <div className="bg-white rounded-[16px] border border-[#E8E8E3] p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-9 w-9 bg-[#F5F5F0] rounded-full flex items-center justify-center">
            <Home className="w-4 h-4 text-[#1A1A1A]" strokeWidth={1.5} />
          </div>
          <h3 className="text-[#1A1A1A] text-lg font-semibold">Property Details</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label className="text-[#6B6B6B] text-xs">Year Built</Label>
            <Input
              value={propertyDetails.yearBuilt}
              onChange={e => setPropertyDetails(p => ({ ...p, yearBuilt: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-[#6B6B6B] text-xs">Heating System</Label>
            <select
              value={propertyDetails.heatingType}
              onChange={e => setPropertyDetails(p => ({ ...p, heatingType: e.target.value }))}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option>Gas Boiler</option>
              <option>Combi Boiler</option>
              <option>Heat Pump (Air Source)</option>
              <option>Heat Pump (Ground Source)</option>
              <option>Electric Heating</option>
              <option>Oil Boiler</option>
              <option>District Heating</option>
            </select>
          </div>
          <div>
            <Label className="text-[#6B6B6B] text-xs">Roof Type</Label>
            <select
              value={propertyDetails.roofType}
              onChange={e => setPropertyDetails(p => ({ ...p, roofType: e.target.value }))}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option>Pitched - Tile</option>
              <option>Pitched - Slate</option>
              <option>Flat - Felt</option>
              <option>Flat - EPDM</option>
              <option>Flat - GRP</option>
              <option>Mixed</option>
            </select>
          </div>
          <div>
            <Label className="text-[#6B6B6B] text-xs">Last Roof Inspection</Label>
            <Input
              type="date"
              value={propertyDetails.lastRoofInspection}
              onChange={e => setPropertyDetails(p => ({ ...p, lastRoofInspection: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-[#6B6B6B] text-xs">Window Type</Label>
            <select
              value={propertyDetails.windowType}
              onChange={e => setPropertyDetails(p => ({ ...p, windowType: e.target.value }))}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option>Double Glazed - uPVC</option>
              <option>Double Glazed - Wood</option>
              <option>Double Glazed - Aluminium</option>
              <option>Triple Glazed</option>
              <option>Single Glazed</option>
            </select>
          </div>
          <div>
            <Label className="text-[#6B6B6B] text-xs">Insulation</Label>
            <select
              value={propertyDetails.insulationType}
              onChange={e => setPropertyDetails(p => ({ ...p, insulationType: e.target.value }))}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option>Cavity Wall + Loft</option>
              <option>Cavity Wall Only</option>
              <option>Loft Only</option>
              <option>Solid Wall (Internal)</option>
              <option>Solid Wall (External)</option>
              <option>None / Unknown</option>
            </select>
          </div>
        </div>
      </div>

      {/* Appliance & System Registry */}
      <div className="bg-white rounded-[16px] border border-[#E8E8E3] p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-[#F5F5F0] rounded-full flex items-center justify-center">
              <Flame className="w-4 h-4 text-[#1A1A1A]" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-[#1A1A1A] text-lg font-semibold">Appliance & System Registry</h3>
              <p className="text-[#6B6B6B] text-xs">Track your home systems, warranties, and install dates</p>
            </div>
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-[#1A1A1A] text-white hover:bg-[#333] text-sm h-9 px-4 rounded-full"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Appliance
          </Button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-[#F5F5F0] rounded-[12px] p-4 mb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-[#6B6B6B]">Name *</Label>
                <Input
                  placeholder="e.g. Boiler"
                  value={newAppliance.name || ''}
                  onChange={e => setNewAppliance(p => ({ ...p, name: e.target.value }))}
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-[#6B6B6B]">Make *</Label>
                <Input
                  placeholder="e.g. Worcester Bosch"
                  value={newAppliance.make || ''}
                  onChange={e => setNewAppliance(p => ({ ...p, make: e.target.value }))}
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-[#6B6B6B]">Model</Label>
                <Input
                  placeholder="e.g. Greenstar 4000"
                  value={newAppliance.model || ''}
                  onChange={e => setNewAppliance(p => ({ ...p, model: e.target.value }))}
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-[#6B6B6B]">Category</Label>
                <select
                  value={newAppliance.category || 'other'}
                  onChange={e => setNewAppliance(p => ({ ...p, category: e.target.value as Appliance['category'] }))}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs text-[#6B6B6B]">Install Date</Label>
                <Input
                  type="date"
                  value={newAppliance.installDate || ''}
                  onChange={e => setNewAppliance(p => ({ ...p, installDate: e.target.value }))}
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-[#6B6B6B]">Warranty Expiry</Label>
                <Input
                  type="date"
                  value={newAppliance.warrantyExpiry || ''}
                  onChange={e => setNewAppliance(p => ({ ...p, warrantyExpiry: e.target.value }))}
                  className="mt-1 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button onClick={handleAddAppliance} className="bg-[#1A1A1A] text-white text-sm h-8 px-4 rounded-full">
                Save
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)} className="text-sm h-8 px-4 rounded-full border-[#E8E8E3]">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Appliance List */}
        <div className="space-y-2">
          {appliances.map(appliance => {
            const catConfig = CATEGORY_CONFIG[appliance.category];
            const warranty = appliance.warrantyExpiry ? getWarrantyStatus(appliance.warrantyExpiry) : null;
            const CatIcon = catConfig.icon;

            return (
              <div key={appliance.id} className="flex items-center justify-between p-4 bg-[#FAFAFA] rounded-[12px] border border-[#F0F0F0] hover:bg-[#F5F5F0] transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-[10px] ${catConfig.bg} flex items-center justify-center`}>
                    <CatIcon className={`w-4 h-4 ${catConfig.color}`} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[#1A1A1A] text-sm font-medium">{appliance.name}</p>
                    <p className="text-[#9CA3AF] text-xs">{appliance.make} {appliance.model}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {appliance.installDate && (
                    <div className="hidden sm:flex items-center gap-1 text-xs text-[#9CA3AF]">
                      <Calendar className="w-3 h-3" />
                      Installed {new Date(appliance.installDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                    </div>
                  )}
                  {warranty && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${warranty.bg} ${warranty.color}`}>
                      Warranty: {warranty.label}
                    </span>
                  )}
                  <button
                    onClick={() => handleRemoveAppliance(appliance.id)}
                    className="p-1.5 rounded-full hover:bg-red-50 text-[#9CA3AF] hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {appliances.length === 0 && (
          <div className="text-center py-8">
            <p className="text-[#6B6B6B] text-sm">No appliances added yet. Click "Add Appliance" to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyProfile;
