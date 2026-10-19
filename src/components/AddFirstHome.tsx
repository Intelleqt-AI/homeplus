import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Home, Loader2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useActiveProperty } from '@/hooks/useActiveProperty';
import { usePost } from '@/hooks/usePost';
import { toast } from '@/lib/toast';
import { formatPostcode } from '@/lib/postcode';
import { firstUsage } from '@/lib/account';
import {
  EMPTY_FORM,
  PropertyFormFields,
  formToPayload,
  validatePropertyForm,
  type FormErrors,
  type PropertyForm,
} from '@/components/settings/Properties';

type Created = { data?: { id?: string } };
type ApiErr = Error & { response?: { data?: { errors?: Record<string, string[]>; message?: string } } };

/** Shown instead of the app to an account with no home (its own or shared):
 *  everything in Home+ belongs to a home, so one is needed before going on. */
export default function AddFirstHome() {
  const queryClient = useQueryClient();
  const { signOut, user } = useAuth();
  const { setActivePropertyId } = useActiveProperty();
  // Starts from the postcode given at sign-up, and from what the person said they use Home+ for.
  const [form, setForm] = useState<PropertyForm>(() => ({
    ...EMPTY_FORM,
    usage: firstUsage(user?.account_type ?? 'homeowner'),
    postcode: formatPostcode(user?.user_metadata?.postcode ?? ''),
  }));
  const [errors, setErrors] = useState<FormErrors>({});

  const create = usePost<Created>({
    onSuccess: async res => {
      toast.success('Home added.');
      // Wait for the home list to include it so the guard lets the app through.
      await queryClient.invalidateQueries({
        predicate: q => typeof q.queryKey[0] === 'string' && (q.queryKey[0] as string).startsWith('/api/v1/properties/'),
      });
      if (res?.data?.id) setActivePropertyId(res.data.id);
    },
    onError: (err: ApiErr) => {
      const api = err?.response?.data?.errors ?? {};
      const mapped: FormErrors = {};
      if (api.address) mapped.address = api.address[0];
      if (api.postcode) mapped.postcode = api.postcode[0];
      if (api.property_type) mapped.property_type = api.property_type[0];
      if (Object.keys(mapped).length) setErrors(mapped);
      else toast.error(err?.response?.data?.message || 'Could not add your home.');
    },
  });

  const save = () => {
    const errs = validatePropertyForm(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    create.mutate({ url: '/api/v1/properties/', data: formToPayload(form) });
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:py-12" data-page="add-first-home">
      <div className="mx-auto w-full max-w-lg space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
            <Home className="h-6 w-6 text-foreground" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Add your home</h1>
          <p className="text-sm text-muted-foreground">
            Everything in Home+ (jobs, documents, reminders) belongs to a home. Add yours to carry on.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5 sm:p-6 shadow-sm">
          <PropertyFormFields
            form={form}
            setForm={setForm}
            errors={errors}
            onClearError={field => setErrors(prev => ({ ...prev, [field]: undefined }))}
          />
          <Button onClick={save} disabled={create.isPending} className="mt-5 w-full">
            {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {create.isPending ? 'Adding…' : 'Add home and continue'}
          </Button>
        </div>
        <button
          type="button"
          onClick={() => signOut()}
          className="mx-auto flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );
}
