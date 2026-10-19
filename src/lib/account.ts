// "How will you use Home+?": the account types, what a property is to its owner, and the
// few wording rules that follow. The values match the backend (`User.account_type`,
// `Property.usage`; apps/properties/usage.py).

export type AccountType = 'homeowner' | 'landlord' | 'both' | 'renter';
export type Usage = 'own_home' | 'let' | 'rented_home';

/** The four sign-up / Settings choices. Titles and lines are the product brief's, word for word. */
export const ACCOUNT_TYPES: { value: AccountType; title: string; line: string }[] = [
  { value: 'homeowner', title: 'My own home', line: 'Keep on top of the home you live in.' },
  { value: 'landlord', title: 'Homes I let out', line: 'Safety certificates and upkeep for your rentals.' },
  { value: 'both', title: 'Both', line: 'The home you live in, plus homes you let.' },
  {
    value: 'renter',
    title: 'I rent my home',
    line: 'Keep track of your tenancy, documents and the jobs that are yours.',
  },
];

export const ACCOUNT_TYPE_CAPTION = 'You can change this later in Settings.';

export const accountTypeTitle = (type?: string | null): string =>
  ACCOUNT_TYPES.find(a => a.value === type)?.title ?? '';

/** What a property is to its owner (Settings labels, the brief's wording). */
export const USAGE_OPTIONS: { value: Usage; label: string }[] = [
  { value: 'own_home', label: 'I live here and own it' },
  { value: 'let', label: 'I let this out' },
  { value: 'rented_home', label: 'I rent this home' },
];

export const usageLabel = (usage?: string | null): string =>
  USAGE_OPTIONS.find(u => u.value === usage)?.label ?? '';

// Usage <-> the older `role` the backend keeps in step with it (older app builds still read it).
export const ROLE_FOR_USAGE: Record<Usage, string> = { own_home: 'homeowner', let: 'landlord', rented_home: 'tenant' };
export const USAGE_FOR_ROLE: Record<string, Usage> = { homeowner: 'own_home', landlord: 'let', tenant: 'rented_home' };

/** The usage of the first property someone adds at sign-up. "Both" starts with the home they live in. */
export const firstUsage = (type: AccountType): Usage =>
  type === 'landlord' ? 'let' : type === 'renter' ? 'rented_home' : 'own_home';

/** Who can see the portfolio overview and the "All properties" choice. */
export const isPortfolioAccount = (type?: string | null): boolean => type === 'landlord' || type === 'both';

// ── where the person came from (?src=) ───────────────────────────────────────

const SRC_KEY = 'hp_signup_src';
/** Marketing pages that pre-select "Homes I let out". */
const LANDLORD_SOURCES = ['/landlords', '/property-maintenance-app'];

/** `/Landlords/`, `https://www.myhomeplus.io/landlords/x?y=1#z` -> `/landlords`, `/landlords/x`. */
export function normaliseSrc(raw: string | null | undefined): string {
  const value = (raw ?? '').trim();
  if (!value) return '';
  let path = value;
  try {
    path = new URL(value, 'https://home.invalid').pathname;
  } catch {
    path = value.split(/[?#]/)[0];
  }
  path = path.toLowerCase();
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

/** "Homes I let out" for `/landlords`, `/landlords/...` and `/property-maintenance-app`; else nothing. */
export function srcPreselect(src: string | null | undefined): AccountType | null {
  const path = normaliseSrc(src);
  if (!path) return null;
  if (LANDLORD_SOURCES.includes(path) || path.startsWith('/landlords/')) return 'landlord';
  return null;
}

/** Remember `?src=` for the rest of the visit: Google/Apple sign-ups reach onboarding by another page. */
export function rememberSrc(search: string): string {
  try {
    const src = normaliseSrc(new URLSearchParams(search).get('src'));
    if (src) sessionStorage.setItem(SRC_KEY, src);
    return src || readSrc();
  } catch {
    return '';
  }
}

export function readSrc(): string {
  try {
    return sessionStorage.getItem(SRC_KEY) ?? '';
  } catch {
    return '';
  }
}

export function clearSrc(): void {
  try {
    sessionStorage.removeItem(SRC_KEY);
  } catch {
    // best effort
  }
}

// ── wording ──────────────────────────────────────────────────────────────────

/** `home` for the home someone lives in (own or rented), `property` for one they let out. */
export type Wording = 'home' | 'property';
export const wordingFor = (usage?: string | null): Wording => (usage === 'let' ? 'property' : 'home');

/** Where the app says "your home", a let property says "this property" and the portfolio "your properties". */
export function homeLabels(usage?: string | null, portfolio = false) {
  const let_ = usage === 'let';
  return {
    nav: portfolio ? 'Your properties' : let_ ? 'This property' : 'My Home',
    paperwork: let_ ? "This property's paperwork" : 'Your home paperwork',
    settingsHomes: let_ || portfolio ? 'Your properties' : 'Your homes',
    addressStep: let_ ? "This property's address & details — done at sign-up." : "Your home's address & details — done at sign-up.",
  };
}
