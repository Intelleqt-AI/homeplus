import { useState, useRef } from 'react';
import { Camera, ArrowRight, ArrowLeft, X, CheckCircle, Home, Loader2, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePost } from '@/hooks/usePost';
import { toast } from '@/lib/toast';
import { useQueryClient } from '@tanstack/react-query';
import {
  PropertyFormFields,
  EMPTY_FORM,
  validatePropertyForm,
  formToPayload,
  type PropertyForm,
  type FormErrors,
} from '@/components/settings/Properties';
import apiClient from '@/lib/apiClient';

interface SetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const TOTAL_STEPS = 3;

export default function SetupWizard({ isOpen, onClose, onComplete }: SetupWizardProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);

  // Property form state
  const [form, setForm] = useState<PropertyForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const resetState = () => {
    setStep(1);
    setForm(EMPTY_FORM);
    setErrors({});
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(null);
    setCoverPreview(null);
    setCreatedId(null);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    if (coverRef.current) coverRef.current.value = '';
  };

  const coverMutation = usePost({
    mutationFn: ({ id, fd }: { id: string; fd: FormData }) =>
      apiClient.post(`/api/v1/properties/${id}/cover-image/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: q => typeof q.queryKey[0] === 'string' && (q.queryKey[0] as string).startsWith('/api/v1/properties/'),
      });
    },
    onError: () => toast.error('Property created but cover upload failed.'),
  });

  const createMutation = usePost({
    mutationFn: (payload: ReturnType<typeof formToPayload>) =>
      apiClient.post('/api/v1/properties/', payload),
    onSuccess: (res: { data: { data: { id: string } } }) => {
      const id = res?.data?.data?.id ?? res?.data?.id;
      setCreatedId(id);
      if (coverFile && id) {
        const fd = new FormData();
        fd.append('file', coverFile);
        coverMutation.mutate({ id, fd });
      }
      queryClient.invalidateQueries({
        predicate: q => typeof q.queryKey[0] === 'string' && (q.queryKey[0] as string).startsWith('/api/v1/properties/'),
      });
      setStep(3);
    },
    onError: (err: Error & { response?: { data?: { errors?: Record<string, string[]> } } }) => {
      const apiErrs = err?.response?.data?.errors ?? {};
      const mapped: FormErrors = {};
      if (apiErrs.address) mapped.address = apiErrs.address[0];
      if (apiErrs.postcode) mapped.postcode = apiErrs.postcode[0];
      if (apiErrs.property_type) mapped.property_type = apiErrs.property_type[0];
      if (Object.keys(mapped).length) {
        setErrors(mapped);
      } else {
        toast.error('Failed to add property.');
      }
    },
  });

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
      return;
    }
    if (step === 2) {
      const errs = validatePropertyForm(form);
      if (Object.keys(errs).length) {
        setErrors(errs);
        return;
      }
      createMutation.mutate(formToPayload(form));
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFinish = () => {
    resetState();
    onComplete();
  };

  const isSubmitting = createMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={open => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-semibold text-gray-900">
                {step === 1 && 'Welcome to HomePlus'}
                {step === 2 && 'Add your property'}
                {step === 3 && "You're all set!"}
              </DialogTitle>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">Step {step} of {TOTAL_STEPS}</span>
                <button
                  type="button"
                  onClick={handleClose}
                  className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-4">
              <div
                className="bg-gray-900 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              />
            </div>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center py-4">
                <div className="h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <Home className="h-8 w-8 text-gray-700" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Manage your home in one place
                </h2>
                <p className="text-sm text-gray-500 max-w-sm">
                  Keep track of your properties, documents, maintenance, and find trusted tradespeople — all from your dashboard.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[
                  { icon: '🏠', title: 'Property Management', desc: 'Add and track all your properties in one place' },
                  { icon: '📋', title: 'Documents & Compliance', desc: 'Store certificates, warranties, and important docs' },
                  { icon: '🔧', title: 'Find Tradespeople', desc: 'Post jobs and get quotes from verified local trades' },
                ].map(item => (
                  <div key={item.title} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <span className="text-xl shrink-0">{item.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Add property form */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Cover photo */}
              <div
                className="relative rounded-xl overflow-hidden h-36 bg-gray-50 border border-gray-200 cursor-pointer"
                onClick={() => coverRef.current?.click()}
              >
                {coverPreview ? (
                  <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <Camera className="w-7 h-7 text-gray-300" />
                    <p className="text-xs text-gray-400">Add cover photo (optional)</p>
                  </div>
                )}
                <span className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none">
                  <Camera className="w-3.5 h-3.5" />
                  {coverPreview ? 'Change' : 'Add photo'}
                </span>
                <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
              </div>

              <PropertyFormFields
                form={form}
                setForm={setForm}
                errors={errors}
                onClearError={field => setErrors(prev => ({ ...prev, [field]: undefined }))}
              />
            </div>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <div className="flex flex-col items-center text-center py-6 space-y-5">
              <div className="h-16 w-16 bg-green-50 rounded-2xl flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Property added!</h2>
                <p className="text-sm text-gray-500 max-w-sm">
                  Your property is ready. You can add more properties, upload documents, and post jobs from your dashboard.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 w-full text-left">
                {[
                  '✓ Property saved to your account',
                  '✓ Ready to receive job quotes',
                  '✓ Document storage available',
                ].map(item => (
                  <p key={item} className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">{item}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          {step > 1 && step < 3 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep(s => s - 1)}
              disabled={isSubmitting}
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {step === 1 && (
            <Button onClick={handleNext}>
              Get started
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          )}

          {step === 2 && (
            <Button onClick={handleNext} disabled={isSubmitting} className="min-w-[140px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  Add property
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </>
              )}
            </Button>
          )}

          {step === 3 && (
            <Button onClick={handleFinish} className="min-w-[160px]">
              <Sparkles className="h-4 w-4 mr-1.5" />
              Go to dashboard
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
