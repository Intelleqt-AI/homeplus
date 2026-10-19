import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AccountTypePicker from '@/components/account/AccountTypePicker';
import { useAuth } from '@/hooks/useAuth';
import usePatch from '@/hooks/usePatch';
import { toast } from '@/lib/toast';
import type { AccountType } from '@/lib/account';

/**
 * Settings → Profile: "How you use Home+" (the same four choices as sign-up). It only changes the
 * dashboard and the labels; it never touches a property, and every property stays.
 */
const HowYouUse = () => {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const current: AccountType = user?.account_type ?? 'homeowner';
  const [value, setValue] = useState<AccountType>(current);

  useEffect(() => setValue(current), [current]);

  const save = usePatch({
    onSuccess: async () => {
      await refreshUser();
      // The portfolio and the labels follow the account type.
      queryClient.invalidateQueries({ predicate: q => typeof q.queryKey[0] === 'string' && (q.queryKey[0] as string).startsWith('/api/v1/properties/') });
      toast.success('Updated.');
    },
    onError: () => toast.error('Could not save that. Please try again.'),
  });

  const changed = value !== current;

  return (
    <Card data-section="how-you-use">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Users className="w-5 h-5 shrink-0 text-accent" /> How you use Home+
        </CardTitle>
        <p className="text-sm text-muted-foreground">Changing this never deletes a property.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <AccountTypePicker value={value} onChange={setValue} variant="settings" disabled={save.isPending} />
        <div className="flex justify-end gap-2 border-t pt-4">
          {changed && (
            <Button type="button" variant="outline" onClick={() => setValue(current)} disabled={save.isPending}>
              Cancel
            </Button>
          )}
          <Button
            type="button"
            disabled={!changed || save.isPending}
            className="min-w-[110px]"
            data-action="save-account-type"
            onClick={() => save.mutate({ url: '/api/v1/auth/me/', data: { account_type: value } })}
          >
            {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default HowYouUse;
