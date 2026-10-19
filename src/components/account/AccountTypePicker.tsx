import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { Building2, Check, Home, KeyRound, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ACCOUNT_TYPES, type AccountType } from '@/lib/account';

/**
 * "How will you use Home+?": four large cards, one choice. A real radio group, so the arrow keys,
 * Tab and Space work. Used at sign-up, in onboarding (Google/Apple sign-ups) and in Settings.
 */
const ICONS: Record<AccountType, typeof Home> = {
  homeowner: Home,
  landlord: Building2,
  both: Layers,
  renter: KeyRound,
};

type Variant = 'signup' | 'onboarding' | 'settings';

const SELECTED: Record<Variant, string> = {
  signup: 'border-primary bg-primary/5 ring-1 ring-primary',
  settings: 'border-primary bg-primary/5 ring-1 ring-primary',
  onboarding: 'border-accent bg-gradient-hero text-accent-foreground',
};
const IDLE: Record<Variant, string> = {
  signup: 'border-input bg-background hover:bg-muted/50',
  settings: 'border-input bg-background hover:bg-muted/50',
  onboarding: 'border-border bg-card text-foreground hover:border-foreground',
};

interface Props {
  value: AccountType | null;
  onChange: (value: AccountType) => void;
  variant?: Variant;
  disabled?: boolean;
  /** An error to show under the cards (e.g. nothing chosen yet). */
  error?: string;
  className?: string;
}

const AccountTypePicker = ({ value, onChange, variant = 'signup', disabled, error, className }: Props) => (
  <div className={className}>
    <RadioGroupPrimitive.Root
      value={value ?? ''}
      onValueChange={v => onChange(v as AccountType)}
      disabled={disabled}
      aria-label="How will you use Home+?"
      className="grid grid-cols-1 gap-3"
      data-testid="account-type-picker"
    >
      {ACCOUNT_TYPES.map(option => {
        const Icon = ICONS[option.value];
        const selected = value === option.value;
        return (
          <RadioGroupPrimitive.Item
            key={option.value}
            value={option.value}
            data-account-type={option.value}
            className={cn(
              'group flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-60',
              selected ? SELECTED[variant] : IDLE[variant],
            )}
          >
            <span
              className={cn(
                'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                selected && variant === 'onboarding' ? 'bg-accent-foreground/10' : 'bg-muted',
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold leading-tight">{option.title}</span>
              <span
                className={cn(
                  'mt-0.5 block text-[13px] leading-snug',
                  selected && variant === 'onboarding' ? 'text-accent-foreground/70' : 'text-muted-foreground',
                )}
              >
                {option.line}
              </span>
            </span>
            <span
              aria-hidden
              className={cn(
                'mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                selected ? 'border-current' : 'border-muted-foreground/30',
              )}
            >
              {selected && <Check className="h-3 w-3" strokeWidth={3} />}
            </span>
          </RadioGroupPrimitive.Item>
        );
      })}
    </RadioGroupPrimitive.Root>
    {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
  </div>
);

export default AccountTypePicker;
