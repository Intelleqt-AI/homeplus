import { categoryConfig } from './jobCategories';

export type Option = { value: string; label: string };

export const TRADE_OPTIONS: Option[] = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'gas_engineer', label: 'Gas Engineer' },
  { value: 'roofing', label: 'Roofing' },
  { value: 'electrical', label: 'Electrical' },
];

export const DISCIPLINE_OPTIONS: Option[] = [
  { value: 'compliance', label: 'Compliance' },
  { value: 'warranty', label: 'Warranty' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'tenancy', label: 'Tenancy' },
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
