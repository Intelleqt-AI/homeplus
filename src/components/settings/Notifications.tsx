import { useState } from 'react';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import useFetch from '@/hooks/useFetch';
import usePatch from '@/hooks/usePatch';

interface NotificationPrefs {
  email_notifications: boolean;
  sms_notifications: boolean;
  calendar_reminders: boolean;
  marketing_emails: boolean;
  updated_at?: string;
}

const ITEMS: { key: keyof Omit<NotificationPrefs, 'updated_at'>; label: string; description: string }[] = [
  { key: 'email_notifications', label: 'Email Notifications', description: 'Receive updates and reminders via email' },
  { key: 'sms_notifications', label: 'SMS Notifications', description: 'Receive urgent alerts via SMS' },
  { key: 'calendar_reminders', label: 'Calendar Reminders', description: 'Add maintenance events to your calendar' },
  { key: 'marketing_emails', label: 'Marketing Emails', description: 'Receive tips, offers, and product updates' },
];

const Notifications = () => {
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const { data: fetchedPrefs, isLoading } = useFetch<{ data: NotificationPrefs }>(
    '/api/v1/auth/notification-preferences/'
  );
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);

  if (fetchedPrefs?.data && !prefs) setPrefs(fetchedPrefs.data);

  const patchPrefs = usePatch({
    onError: () => setError('Failed to save. Try again.'),
  });

  const handleToggle = async (key: keyof Omit<NotificationPrefs, 'updated_at'>) => {
    if (!prefs || saving) return;
    const newValue = !prefs[key];
    setPrefs(prev => prev ? { ...prev, [key]: newValue } : prev);
    setSaving(key);
    setError('');

    try {
      const res = await patchPrefs.mutateAsync({
        url: '/api/v1/auth/notification-preferences/',
        data: { [key]: newValue },
      }) as { data: NotificationPrefs };
      setPrefs(res.data);
      setSavedKey(key);
      setTimeout(() => setSavedKey(null), 2000);
    } catch {
      setPrefs(prev => prev ? { ...prev, [key]: !newValue } : prev);
    } finally {
      setSaving(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <p className="text-sm text-muted-foreground">Choose how and when you want to be notified.</p>
      </CardHeader>
      <CardContent className="space-y-1">
        {error && (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {ITEMS.map((item, index) => (
          <div
            key={item.key}
            className={`flex items-center justify-between py-4 ${index < ITEMS.length - 1 ? 'border-b' : ''}`}
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{item.label}</p>
                {savedKey === item.key && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
            <Switch
              checked={prefs ? prefs[item.key] : false}
              onCheckedChange={() => handleToggle(item.key)}
              disabled={saving === item.key}
              aria-label={item.label}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default Notifications;
