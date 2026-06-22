import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Loader2, CheckCircle, ChevronsUpDown, Check, ShieldCheck, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { useAuth } from '@/hooks/useAuth';
import usePatch from '@/hooks/usePatch';
import { UK_LOCATIONS, LOCATION_POSTCODE } from '@/lib/ukLocations';

const PROPERTY_TYPES = [
  { value: 'detached', label: 'Detached' },
  { value: 'semi_detached', label: 'Semi-Detached' },
  { value: 'terraced', label: 'Terraced' },
  { value: 'flat', label: 'Flat' },
  { value: 'bungalow', label: 'Bungalow' },
  { value: 'other', label: 'Other' },
];

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [locationOpen, setLocationOpen] = useState(false);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    location: '',
    postcode: '',
    property_type: '',
  });
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [saved, setSaved] = useState(false);

  const updateProfile = usePatch({
    onSuccess: async () => {
      await refreshUser();
      setSaved(true);
      toast.success('Profile updated.');
      setTimeout(() => setSaved(false), 2500);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save profile.';
      toast.error(msg);
    },
  });

  useEffect(() => {
    if (!user) return;
    const meta = user.user_metadata || {};
    setForm({
      first_name: meta.first_name || '',
      last_name: meta.last_name || '',
      email: user.email || '',
      phone: user._raw?.profile?.phone || '',
      location: meta.location || '',
      postcode: meta.postcode || '',
      property_type: meta.property_type || '',
    });
    setPhoneVerified(user._raw?.profile?.phone_verified ?? false);
  }, [user]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const selectLocation = (val: string) => {
    setForm(prev => ({
      ...prev,
      location: val,
      postcode: LOCATION_POSTCODE[val] ?? prev.postcode,
    }));
    setLocationOpen(false);
  };

  const handleSave = () => {
    setSaved(false);
    updateProfile.mutate({
      url: '/api/v1/auth/me/',
      data: {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        profile: {
          phone: form.phone.trim(),
          location: form.location.trim(),
          postcode: form.postcode.trim().toUpperCase(),
          property_type: form.property_type,
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Personal info */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="first_name">First name</Label>
              <Input id="first_name" value={form.first_name} onChange={set('first_name')} placeholder="John" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name">Last name</Label>
              <Input id="last_name" value={form.last_name} onChange={set('last_name')} placeholder="Smith" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              readOnly
              disabled
              className="bg-muted text-muted-foreground cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              Need to update your email?{' '}
              <a href="mailto:support@homeplus.co.uk" className="underline hover:text-foreground">
                Contact support
              </a>{' '}
              to start the secure change flow.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="phone">Phone number</Label>
              {phoneVerified && (
                <Badge variant="outline" className="gap-1 text-xs border-green-300 text-green-700 bg-green-50">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </Badge>
              )}
            </div>
            <Input id="phone" type="tel" value={form.phone} onChange={set('phone')} placeholder="+44 7700 900 123" />
            {!phoneVerified && (
              <div className="mt-1.5 flex items-start gap-2 p-2.5 bg-orange-50 border border-orange-200 rounded-lg">
                <ShieldAlert className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-orange-800">Phone not verified</p>
                  <p className="text-xs text-orange-700 mt-0.5">Required when posting jobs — tradespeople need a number to contact you.</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Property / Location */}
      <Card>
        <CardHeader>
          <CardTitle>Property & Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>City / Area</Label>
              <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      'w-full h-10 px-3 rounded-md border border-input text-sm flex items-center justify-between gap-1 bg-background',
                      'hover:bg-muted/40 transition-colors',
                      !form.location && 'text-muted-foreground',
                    )}
                  >
                    <span className="truncate">{form.location || 'Select area'}</span>
                    <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search area…" />
                    <CommandList>
                      <CommandEmpty>No area found.</CommandEmpty>
                      {UK_LOCATIONS.map(group => (
                        <CommandGroup key={group.group} heading={group.group}>
                          {group.items.map(item => (
                            <CommandItem key={item} value={item} onSelect={selectLocation}>
                              <Check className={cn('mr-2 h-3.5 w-3.5', form.location === item ? 'opacity-100' : 'opacity-0')} />
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
            <div className="space-y-1.5">
              <Label htmlFor="postcode">Postcode</Label>
              <Input
                id="postcode"
                value={form.postcode}
                onChange={e => setForm(prev => ({ ...prev, postcode: e.target.value.toUpperCase() }))}
                placeholder="SW1A 1AA"
                className="uppercase"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="property_type">Property type</Label>
            <Select value={form.property_type} onValueChange={v => setForm(prev => ({ ...prev, property_type: v }))}>
              <SelectTrigger id="property_type">
                <SelectValue placeholder="Select type…" />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateProfile.isPending} className="min-w-[140px]">
          {updateProfile.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…
            </>
          ) : saved ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" /> Saved
            </>
          ) : (
            'Save changes'
          )}
        </Button>
      </div>
    </div>
  );
};

export default Profile;
