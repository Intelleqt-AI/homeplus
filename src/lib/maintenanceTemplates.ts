export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface MaintenanceTemplate {
  id: string;
  title: string;
  description: string;
  season: Season;
  month: number; // 0-indexed — the month the task should ideally be scheduled
  cadence: 'once' | 'annual' | 'biannual' | 'quarterly' | 'monthly';
  category: 'exterior' | 'interior' | 'plumbing' | 'electrical' | 'garden' | 'safety' | 'heating';
  estimatedCostGBP: string;
  diyDifficulty: 'easy' | 'medium' | 'professional';
  tradeRequired: boolean;
}

export const SEASONAL_TEMPLATES: MaintenanceTemplate[] = [
  // SPRING (March - May)
  {
    id: 'spring-gutter-clean',
    title: 'Gutter cleaning',
    description: 'Clear gutters and downpipes of winter debris to prevent blockages and water damage.',
    season: 'spring',
    month: 2,
    cadence: 'biannual',
    category: 'exterior',
    estimatedCostGBP: '£80-150',
    diyDifficulty: 'medium',
    tradeRequired: false,
  },
  {
    id: 'spring-roof-check',
    title: 'Roof inspection',
    description: 'Check for loose, cracked or missing tiles/slates after winter weather. Look for moss build-up.',
    season: 'spring',
    month: 3,
    cadence: 'annual',
    category: 'exterior',
    estimatedCostGBP: '£150-300',
    diyDifficulty: 'professional',
    tradeRequired: true,
  },
  {
    id: 'spring-exterior-paint',
    title: 'Exterior paintwork check',
    description: 'Inspect external woodwork, render, and fascia boards for peeling or damage.',
    season: 'spring',
    month: 3,
    cadence: 'annual',
    category: 'exterior',
    estimatedCostGBP: '£200-500',
    diyDifficulty: 'medium',
    tradeRequired: false,
  },
  {
    id: 'spring-garden-prep',
    title: 'Garden spring preparation',
    description: 'Prune shrubs, prepare beds, check fencing, and service lawn mower.',
    season: 'spring',
    month: 2,
    cadence: 'annual',
    category: 'garden',
    estimatedCostGBP: '£0-100',
    diyDifficulty: 'easy',
    tradeRequired: false,
  },
  {
    id: 'spring-ac-service',
    title: 'Air conditioning service',
    description: 'Service and clean AC units before summer. Replace filters.',
    season: 'spring',
    month: 4,
    cadence: 'annual',
    category: 'heating',
    estimatedCostGBP: '£80-150',
    diyDifficulty: 'professional',
    tradeRequired: true,
  },

  // SUMMER (June - August)
  {
    id: 'summer-pest-check',
    title: 'Pest inspection',
    description: 'Check for signs of wasps, ants, mice, and woodworm. Treat if necessary.',
    season: 'summer',
    month: 5,
    cadence: 'annual',
    category: 'interior',
    estimatedCostGBP: '£100-250',
    diyDifficulty: 'professional',
    tradeRequired: true,
  },
  {
    id: 'summer-deck-treatment',
    title: 'Deck/patio treatment',
    description: 'Power wash and treat wooden decking or seal patio slabs.',
    season: 'summer',
    month: 6,
    cadence: 'annual',
    category: 'garden',
    estimatedCostGBP: '£50-200',
    diyDifficulty: 'easy',
    tradeRequired: false,
  },
  {
    id: 'summer-window-clean',
    title: 'Window cleaning (exterior)',
    description: 'Professional external window cleaning including frames and sills.',
    season: 'summer',
    month: 6,
    cadence: 'biannual',
    category: 'exterior',
    estimatedCostGBP: '£40-100',
    diyDifficulty: 'easy',
    tradeRequired: false,
  },
  {
    id: 'summer-driveway-seal',
    title: 'Driveway maintenance',
    description: 'Weed, clean and reseal driveways and paths. Check for cracks.',
    season: 'summer',
    month: 7,
    cadence: 'annual',
    category: 'exterior',
    estimatedCostGBP: '£100-400',
    diyDifficulty: 'medium',
    tradeRequired: false,
  },

  // AUTUMN (September - November)
  {
    id: 'autumn-boiler-service',
    title: 'Boiler service',
    description: 'Annual boiler service before winter. Required to maintain warranty on most boilers.',
    season: 'autumn',
    month: 8,
    cadence: 'annual',
    category: 'heating',
    estimatedCostGBP: '£60-120',
    diyDifficulty: 'professional',
    tradeRequired: true,
  },
  {
    id: 'autumn-draught-proof',
    title: 'Draught proofing',
    description: 'Check and replace draught excluders on doors and windows. Seal gaps around pipes.',
    season: 'autumn',
    month: 9,
    cadence: 'annual',
    category: 'interior',
    estimatedCostGBP: '£20-80',
    diyDifficulty: 'easy',
    tradeRequired: false,
  },
  {
    id: 'autumn-gutter-clean-2',
    title: 'Gutter cleaning (autumn)',
    description: 'Second annual gutter clean after leaf fall before winter rains.',
    season: 'autumn',
    month: 10,
    cadence: 'biannual',
    category: 'exterior',
    estimatedCostGBP: '£80-150',
    diyDifficulty: 'medium',
    tradeRequired: false,
  },
  {
    id: 'autumn-chimney-sweep',
    title: 'Chimney sweep',
    description: 'Essential before using fireplace in winter. Prevents chimney fires and CO build-up.',
    season: 'autumn',
    month: 9,
    cadence: 'annual',
    category: 'safety',
    estimatedCostGBP: '£50-80',
    diyDifficulty: 'professional',
    tradeRequired: true,
  },
  {
    id: 'autumn-smoke-co-test',
    title: 'Smoke & CO alarm test',
    description: 'Test all smoke and carbon monoxide detectors. Replace batteries if needed.',
    season: 'autumn',
    month: 9,
    cadence: 'monthly',
    category: 'safety',
    estimatedCostGBP: '£0-20',
    diyDifficulty: 'easy',
    tradeRequired: false,
  },

  // WINTER (December - February)
  {
    id: 'winter-pipe-lagging',
    title: 'Pipe lagging check',
    description: 'Ensure exposed pipes in loft, garage, and outside are insulated against freezing.',
    season: 'winter',
    month: 11,
    cadence: 'annual',
    category: 'plumbing',
    estimatedCostGBP: '£10-50',
    diyDifficulty: 'easy',
    tradeRequired: false,
  },
  {
    id: 'winter-boiler-pressure',
    title: 'Boiler pressure check',
    description: 'Check boiler pressure gauge is between 1-1.5 bar. Top up if low.',
    season: 'winter',
    month: 11,
    cadence: 'monthly',
    category: 'heating',
    estimatedCostGBP: '£0',
    diyDifficulty: 'easy',
    tradeRequired: false,
  },
  {
    id: 'winter-stop-tap-test',
    title: 'Stopcock/stop tap test',
    description: 'Test that your main water stop tap turns off fully. Know where it is for emergencies.',
    season: 'winter',
    month: 11,
    cadence: 'annual',
    category: 'plumbing',
    estimatedCostGBP: '£0',
    diyDifficulty: 'easy',
    tradeRequired: false,
  },
  {
    id: 'winter-heating-bleed',
    title: 'Bleed radiators',
    description: 'Release trapped air from radiators to improve heating efficiency.',
    season: 'winter',
    month: 0,
    cadence: 'annual',
    category: 'heating',
    estimatedCostGBP: '£0',
    diyDifficulty: 'easy',
    tradeRequired: false,
  },
];

export const getTemplatesBySeason = (season: Season) =>
  SEASONAL_TEMPLATES.filter(t => t.season === season);

export const getTemplatesByCategory = (category: MaintenanceTemplate['category']) =>
  SEASONAL_TEMPLATES.filter(t => t.category === category);

export const getCurrentSeasonTemplates = (): MaintenanceTemplate[] => {
  const month = new Date().getMonth();
  let season: Season;
  if (month >= 2 && month <= 4) season = 'spring';
  else if (month >= 5 && month <= 7) season = 'summer';
  else if (month >= 8 && month <= 10) season = 'autumn';
  else season = 'winter';
  return getTemplatesBySeason(season);
};

export const SEASON_CONFIG = {
  spring: { label: 'Spring', months: 'Mar - May', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', emoji: '🌱' },
  summer: { label: 'Summer', months: 'Jun - Aug', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200', emoji: '☀️' },
  autumn: { label: 'Autumn', months: 'Sep - Nov', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', emoji: '🍂' },
  winter: { label: 'Winter', months: 'Dec - Feb', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', emoji: '❄️' },
};
