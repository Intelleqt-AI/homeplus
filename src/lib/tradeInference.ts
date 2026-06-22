/**
 * Best-effort guess of which TradePilot trade applies to an event title.
 * Returns one of the values accepted by Quote.tsx's `service` dropdown:
 *   'Plumbing' | 'Gas Engineer' | 'Roofing' | 'Electrical' | ''
 *
 * Empty string = couldn't infer; the user picks in the Quote dialog.
 */
export type InferredTrade = 'Plumbing' | 'Gas Engineer' | 'Roofing' | 'Electrical' | '';

const RULES: Array<{ trade: InferredTrade; keywords: string[] }> = [
  { trade: 'Gas Engineer', keywords: ['boiler', 'gas safety', 'gas cert', 'cp12', 'cooker', 'hob', 'flue'] },
  { trade: 'Electrical', keywords: ['eicr', 'electric', 'fuse', 'consumer unit', 'pat test', 'rewir', 'socket', 'ev charger', 'lighting'] },
  { trade: 'Roofing', keywords: ['roof', 'chimney', 'gutter', 'fascia', 'soffit', 'flashing', 'skylight'] },
  { trade: 'Plumbing', keywords: ['plumb', 'leak', 'tap', 'shower', 'toilet', 'drain', 'radiator', 'pipe'] },
];

export const inferTradeFromTitle = (title: string | undefined | null): InferredTrade => {
  if (!title) return '';
  const lower = title.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some(kw => lower.includes(kw))) return rule.trade;
  }
  return '';
};
