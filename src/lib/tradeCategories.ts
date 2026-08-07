import { categoryConfig } from './jobCategories';

export type Option = { value: string; label: string };

export const TRADE_OPTIONS: Option[] = [
  { value: 'plumbing',    label: 'Plumbing' },
  { value: 'gas_engineer', label: 'Gas Engineer' },
  { value: 'electrical',  label: 'Electrical' },
  { value: 'roofing',     label: 'Roofing' },
  { value: 'builder',     label: 'Builder' },
  { value: 'decorator',   label: 'Decorator / Painter' },
  { value: 'carpenter',   label: 'Carpenter / Joiner' },
  { value: 'plasterer',   label: 'Plasterer' },
  { value: 'tiler',       label: 'Tiler' },
  { value: 'bathroom',    label: 'Bathroom Fitter' },
  { value: 'kitchen',     label: 'Kitchen Installer' },
  { value: 'locksmith',   label: 'Locksmith' },
  { value: 'groundworks', label: 'Groundworks / Drainage' },
  { value: 'handyman',    label: 'Handyman' },
  { value: 'hvac',        label: 'HVAC / Air Conditioning' },
  { value: 'other',       label: 'Other' },
];

export const JOB_TRADE_OPTIONS: Option[] = [
  { value: 'plumbing',     label: 'Plumbing' },
  { value: 'gas_engineer', label: 'Gas Engineer' },
  { value: 'electrical',   label: 'Electrical' },
  { value: 'roofing',      label: 'Roofing' },
];

export const DISCIPLINE_OPTIONS: Option[] = [
  { value: 'compliance', label: 'Compliance' },
  { value: 'warranty', label: 'Warranty' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'energy_epc', label: 'Energy & EPC' },
  { value: 'manuals_appliances', label: 'Manuals & Appliances' },
  { value: 'surveys_reports', label: 'Surveys & Reports' },
  { value: 'tenancy', label: 'Tenancy & Lettings' },
  { value: 'purchase', label: 'Purchase' },
  { value: 'planning', label: 'Planning' },
  { value: 'utility', label: 'Utility' },
  { value: 'other', label: 'Other' },
];

const TRADE_LABEL_TO_VALUE: Record<string, string> = {
  Plumbing: 'plumbing',
  'Gas Engineer': 'gas_engineer',
  Roofing: 'roofing',
  Electrical: 'electrical',
  Builder: 'builder',
  'Decorator / Painter': 'decorator',
  'Carpenter / Joiner': 'carpenter',
  'Kitchen Installer': 'kitchen',
  'Bathroom Fitter': 'bathroom',
  Plasterer: 'plasterer',
  Locksmith: 'locksmith',
  'Groundworks / Drainage': 'groundworks',
};

export const slugifyCategory = (tradeLabel: string, category: string): string => {
  const tradeSlug = TRADE_LABEL_TO_VALUE[tradeLabel] ?? tradeLabel.toLowerCase().replace(/\s+/g, '_');
  const cat = category
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `${tradeSlug}_${cat}`;
};

export const tradeCategoriesByType: Record<string, Option[]> = (() => {
  const map: Record<string, Option[]> = {};
  for (const cfg of categoryConfig) {
    const tradeLabel = cfg.trade;
    if (!tradeLabel) continue;
    const tradeValue = TRADE_LABEL_TO_VALUE[tradeLabel];
    if (!tradeValue) continue;
    if (!map[tradeValue]) map[tradeValue] = [];
    map[tradeValue].push({
      value: slugifyCategory(tradeLabel, cfg.category),
      label: cfg.category,
    });
  }
  return map;
})();

export const getTradeCategoryLabel = (slug: string): string => {
  for (const list of Object.values(tradeCategoriesByType)) {
    const found = list.find(o => o.value === slug);
    if (found) return found.label;
  }
  return slug;
};
