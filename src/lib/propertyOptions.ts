// Option lists for the property details asked at signup and in onboarding. The values
// match the backend `Property` choices (backend/apps/properties/models.py).

import type { EpcDetails } from '@/lib/homeLookup';
import { ROLE_FOR_USAGE, USAGE_OPTIONS, type Usage } from '@/lib/account';

export type Option = { value: string; label: string };

export const PROPERTY_TYPES: Option[] = [
  { value: 'detached', label: 'Detached' },
  { value: 'semi_detached', label: 'Semi-Detached' },
  { value: 'terraced', label: 'Terraced' },
  { value: 'flat', label: 'Flat' },
  { value: 'bungalow', label: 'Bungalow' },
  { value: 'other', label: 'Other' },
];

/** What the property is to its owner: own home / let / rented (replaces the old "Your role"). */
export const USAGES: Option[] = USAGE_OPTIONS;

export const HEATING_TYPES: Option[] = [
  { value: 'gas_combi', label: 'Gas Combi Boiler' },
  { value: 'gas_system', label: 'Gas System Boiler' },
  { value: 'electric', label: 'Electric Heating' },
  { value: 'oil', label: 'Oil Boiler' },
  { value: 'heat_pump', label: 'Heat Pump' },
  { value: 'other', label: 'Other / Not sure' },
];

export const TENURE_TYPES: Option[] = [
  { value: 'freehold', label: 'Freehold' },
  { value: 'leasehold', label: 'Leasehold' },
  { value: 'share_of_freehold', label: 'Share of Freehold' },
];

export const labelFor = (options: Option[], value: string): string =>
  options.find(o => o.value === value)?.label ?? value;

export const WALL_TYPES: Option[] = [
  { value: 'cavity', label: 'Cavity wall' },
  { value: 'solid', label: 'Solid wall' },
  { value: 'timber', label: 'Timber frame' },
  { value: 'other', label: 'Other' },
];

/** The property details collected at signup (sent as `home_details`). */
export type HomeDetails = {
  name: string;
  propertyType: string;
  /** What the home is to its owner; sent as `usage` (and the matching older `role`). */
  usage: Usage;
  bedrooms: string;
  bathrooms: string;
  heatingType: string;
  yearBuilt: string;
  tenure: string;
  // Read from the home's EPC certificate (see applyEpc); the user can still change them later.
  floorArea: string;
  builtForm: string;
  ageBand: string;
  wallConstruction: string;
  heatingNote: string;
  /** Names of the fields above that came from EPC rather than the user. */
  epcFilled: string[];
};

export const EMPTY_HOME_DETAILS: HomeDetails = {
  name: '', propertyType: '', usage: 'own_home', bedrooms: '', bathrooms: '', heatingType: '', yearBuilt: '', tenure: '',
  floorArea: '', builtForm: '', ageBand: '', wallConstruction: '', heatingNote: '', epcFilled: [],
};

/** The backend's `home_details` object for a details form. */
export const toHomeDetailsPayload = (d: HomeDetails) => ({
  name: d.name.trim(),
  usage: d.usage,
  // The older `role` twin: the backend keeps the two in step, and an older backend only knows this.
  role: ROLE_FOR_USAGE[d.usage],
  bedrooms: d.bedrooms ? parseInt(d.bedrooms, 10) || 0 : 0,
  bathrooms: d.bathrooms ? parseInt(d.bathrooms, 10) || 0 : 0,
  heating_type: d.heatingType,
  year_built: d.yearBuilt ? parseInt(d.yearBuilt, 10) : null,
  tenure: d.tenure,
  floor_area: d.floorArea ? parseInt(d.floorArea, 10) || null : null,
  built_form: d.builtForm,
  construction_age_band: d.ageBand,
  wall_construction: d.wallConstruction,
  heating_note: d.heatingNote,
  epc_filled: d.epcFilled,
});

/** Fill the empty fields of `d` from a home's EPC facts; returns the new details. Anything the
 *  user already entered is kept. */
export function applyEpc(d: HomeDetails, epc: EpcDetails): HomeDetails {
  const next = { ...d };
  const filled = new Set(d.epcFilled);
  const put = (field: keyof HomeDetails, value: string | number | undefined) => {
    if (value === undefined || value === null || value === '' || next[field]) return;
    (next as Record<string, unknown>)[field] = String(value);
    filled.add(field);
  };
  put('propertyType', epc.property_type);
  put('heatingType', epc.heating_type);
  put('yearBuilt', epc.year_built);
  put('floorArea', epc.floor_area);
  put('builtForm', epc.built_form);
  put('ageBand', epc.construction_age_band);
  put('wallConstruction', epc.wall_construction);
  put('heatingNote', epc.heating_note);
  next.epcFilled = [...filled];
  return next;
}

/** Forget everything that came from EPC (the user picked a different home). */
export function clearEpc(d: HomeDetails): HomeDetails {
  const next: HomeDetails = { ...d, floorArea: '', builtForm: '', ageBand: '', wallConstruction: '', heatingNote: '', epcFilled: [] };
  for (const f of d.epcFilled) {
    if (f in next && typeof next[f as keyof HomeDetails] === 'string') (next as Record<string, unknown>)[f] = '';
  }
  return next;
}

/** "Semi-Detached · built 1967-1975 · 198 m²": what EPC told us, for the signup note. */
export function epcSummary(d: HomeDetails): string[] {
  const out: string[] = [];
  const typeLabel = d.epcFilled.includes('propertyType') && d.propertyType ? labelFor(PROPERTY_TYPES, d.propertyType) : '';
  if (typeLabel) out.push(typeLabel);
  // The built form (End-Terrace...) only when it adds something to the type.
  if (d.builtForm && d.builtForm.toLowerCase() !== typeLabel.toLowerCase()) out.push(d.builtForm);
  if (d.ageBand) out.push(`built ${d.ageBand}`);
  else if (d.epcFilled.includes('yearBuilt') && d.yearBuilt) out.push(`built ${d.yearBuilt}`);
  if (d.floorArea) out.push(`${d.floorArea} m²`);
  if (d.epcFilled.includes('heatingType') && d.heatingType) out.push(labelFor(HEATING_TYPES, d.heatingType));
  if (d.wallConstruction) out.push(labelFor(WALL_TYPES, d.wallConstruction));
  return out;
}
