import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Building2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AddPropertyDialog from '@/components/property/AddPropertyDialog';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/apiClient';

/**
 * One-time card for an account that existed when landlord accounts arrived: "Do you let out a
 * property?" It goes for good once it is dismissed or acted on (the server holds the flag, so it
 * is the same on every device). It asks about adding a property: it never asks anyone to change
 * what an existing home is.
 */
const LetPromptCard = () => {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  // Hidden at once, whatever the server takes to answer.
  const [hidden, setHidden] = useState(false);

  if (!user?.let_prompt_pending || hidden) return null;

  const dismiss = async () => {
    setHidden(true);
    try {
      await apiClient.patch('/api/v1/auth/me/', { profile: { let_prompt_pending: false } });
      await refreshUser();
    } catch {
      // The card stays gone for this visit; it would reappear on the next if the save failed.
    }
  };

  return (
    <>
      <div
        className="relative bg-card rounded-[18px] border border-border p-5 flex flex-col sm:flex-row sm:items-center gap-4"
        data-section="let-prompt"
      >
        <div className="h-10 w-10 shrink-0 bg-muted rounded-full flex items-center justify-center">
          <Building2 className="w-5 h-5 text-foreground" />
        </div>
        <div className="min-w-0 flex-1 pr-6 sm:pr-0">
          <p className="text-[15px] font-semibold text-foreground">Do you let out a property?</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Add it to Home+ and get reminders for gas safety, EICR and EPC renewals.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button size="sm" onClick={() => setAddOpen(true)} data-action="add-let-property">
            Add a let property
          </Button>
          <Button size="sm" variant="outline" onClick={dismiss} data-action="no-thanks">
            No thanks
          </Button>
        </div>
        <button
          type="button" onClick={dismiss} aria-label="Dismiss"
          className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:bg-muted sm:hidden"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <AddPropertyDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        fixedUsage="let"
        onCreated={() => {
          // Acting on it ends it for good (the server cleared the flag when the home was created).
          setHidden(true);
          queryClient.invalidateQueries({ queryKey: ['event'] });
        }}
      />
    </>
  );
};

export default LetPromptCard;
