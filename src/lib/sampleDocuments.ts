// DEV BYPASS: fake documents for the Documents page when the backend returns
// no results. Disciplines mirror DISCIPLINE_OPTIONS in tradeCategories.ts so
// every category tab has something to show.
//
// Remove this fallback once the backend is seeded with real demo data, or
// once user accounts have their own uploaded documents.

import type { NormDoc } from '@/lib/Api';

const today = new Date();
const daysFromNow = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};
const monthsAgo = (n: number) => {
  const d = new Date(today);
  d.setMonth(d.getMonth() - n);
  return d.toISOString();
};

const base = (overrides: Partial<NormDoc>): NormDoc => ({
  id: '',
  name: '',
  category: '',
  doc_type: 'other',
  discipline: 'other',
  expires_at: null,
  is_expired: false,
  notes: '',
  file_size: 524_288,
  content_type: 'application/pdf',
  file_name: 'document.pdf',
  uploaded_at: monthsAgo(2),
  updated_at: monthsAgo(2),
  property: null,
  property_address: '14 Oak Avenue, Tunbridge Wells',
  created_event: null,
  _docId: '',
  publicUrl: null,
  metadata: {
    createdAt: monthsAgo(2),
    metadata: { type: 'application/pdf', category: 'other', status: null },
  },
  ...overrides,
});

export const SAMPLE_DOCUMENTS: NormDoc[] = [
  // ── Compliance ───────────────────────────────────────────────────────────
  base({
    id: 'sample-1',
    _docId: 'sample-1',
    name: 'Gas Safety Certificate (CP12)',
    discipline: 'compliance',
    doc_type: 'gas_engineer',
    category: 'gas_engineer_boilers',
    file_name: 'cp12-2025.pdf',
    file_size: 412_000,
    expires_at: daysFromNow(14),
    uploaded_at: monthsAgo(11),
    notes: 'Annual landlord gas safety check by registered Gas Safe engineer.',
  }),
  base({
    id: 'sample-2',
    _docId: 'sample-2',
    name: 'EICR — Electrical Installation Condition Report',
    discipline: 'compliance',
    doc_type: 'electrical',
    category: 'electrical_testing_certificates',
    file_name: 'eicr-report-2024.pdf',
    file_size: 1_840_000,
    expires_at: daysFromNow(1750),
    uploaded_at: monthsAgo(18),
    notes: '5-year inspection. Result: satisfactory.',
  }),
  base({
    id: 'sample-3',
    _docId: 'sample-3',
    name: 'EPC — Energy Performance Certificate',
    discipline: 'compliance',
    doc_type: 'other',
    category: '',
    file_name: 'epc-rating-c.pdf',
    file_size: 220_000,
    expires_at: daysFromNow(1400),
    uploaded_at: monthsAgo(20),
    notes: 'Energy rating: C (74). Potential: B (84).',
  }),
  base({
    id: 'sample-4',
    _docId: 'sample-4',
    name: 'Smoke & CO Alarm Test Log',
    discipline: 'compliance',
    doc_type: 'other',
    category: '',
    file_name: 'alarm-test-log.pdf',
    file_size: 96_000,
    uploaded_at: monthsAgo(1),
    notes: 'Monthly alarm test record.',
  }),

  // ── Warranty ─────────────────────────────────────────────────────────────
  base({
    id: 'sample-5',
    _docId: 'sample-5',
    name: 'Boiler Service Record — Worcester Bosch',
    discipline: 'warranty',
    doc_type: 'gas_engineer',
    category: 'gas_engineer_boilers',
    file_name: 'boiler-service-2025.pdf',
    file_size: 380_000,
    expires_at: daysFromNow(3),
    uploaded_at: monthsAgo(12),
    notes: 'Annual service due — book before warranty lapses.',
  }),
  base({
    id: 'sample-6',
    _docId: 'sample-6',
    name: 'Worcester Bosch 5-Year Boiler Warranty',
    discipline: 'warranty',
    doc_type: 'gas_engineer',
    category: 'gas_engineer_boilers',
    file_name: 'boiler-warranty.pdf',
    file_size: 290_000,
    expires_at: daysFromNow(900),
    uploaded_at: monthsAgo(26),
    notes: 'Greenstar 30i — covers parts & labour.',
  }),
  base({
    id: 'sample-7',
    _docId: 'sample-7',
    name: 'Bosch Dishwasher Warranty',
    discipline: 'warranty',
    doc_type: 'other',
    category: '',
    file_name: 'dishwasher-warranty.pdf',
    file_size: 130_000,
    expires_at: daysFromNow(180),
    uploaded_at: monthsAgo(6),
  }),

  // ── Insurance ────────────────────────────────────────────────────────────
  base({
    id: 'sample-8',
    _docId: 'sample-8',
    name: 'Buildings Insurance Policy 2025–26',
    discipline: 'insurance',
    doc_type: 'other',
    category: '',
    file_name: 'buildings-insurance-2025.pdf',
    file_size: 720_000,
    expires_at: daysFromNow(120),
    uploaded_at: monthsAgo(8),
    notes: 'Aviva — policy #BLD-784512.',
  }),
  base({
    id: 'sample-9',
    _docId: 'sample-9',
    name: 'Contents Insurance Policy',
    discipline: 'insurance',
    doc_type: 'other',
    category: '',
    file_name: 'contents-insurance-2025.pdf',
    file_size: 540_000,
    expires_at: daysFromNow(210),
    uploaded_at: monthsAgo(4),
    notes: 'Direct Line — £75k cover, accidental damage included.',
  }),

  // ── Tenancy ──────────────────────────────────────────────────────────────
  base({
    id: 'sample-10',
    _docId: 'sample-10',
    name: 'Assured Shorthold Tenancy Agreement',
    discipline: 'tenancy',
    doc_type: 'other',
    category: '',
    file_name: 'ast-2025.pdf',
    file_size: 980_000,
    expires_at: daysFromNow(105),
    uploaded_at: monthsAgo(10),
    notes: '12-month AST — rent £1,650/mo.',
  }),
  base({
    id: 'sample-11',
    _docId: 'sample-11',
    name: 'Move-In Inventory & Schedule of Condition',
    discipline: 'tenancy',
    doc_type: 'other',
    category: '',
    file_name: 'inventory-checkin.pdf',
    file_size: 3_200_000,
    uploaded_at: monthsAgo(10),
    notes: 'Photo inventory across all rooms.',
  }),

  // ── Purchase ─────────────────────────────────────────────────────────────
  base({
    id: 'sample-12',
    _docId: 'sample-12',
    name: 'Title Deeds — HM Land Registry',
    discipline: 'purchase',
    doc_type: 'other',
    category: '',
    file_name: 'title-deeds.pdf',
    file_size: 1_100_000,
    uploaded_at: monthsAgo(36),
  }),
  base({
    id: 'sample-13',
    _docId: 'sample-13',
    name: 'HomeBuyer Survey Report',
    discipline: 'purchase',
    doc_type: 'other',
    category: '',
    file_name: 'homebuyer-survey.pdf',
    file_size: 4_400_000,
    uploaded_at: monthsAgo(36),
    notes: 'RICS Level 2 — no major issues, damp survey advised.',
  }),
  base({
    id: 'sample-14',
    _docId: 'sample-14',
    name: 'Mortgage Offer & Agreement',
    discipline: 'purchase',
    doc_type: 'other',
    category: '',
    file_name: 'mortgage-offer.pdf',
    file_size: 860_000,
    expires_at: daysFromNow(8000),
    uploaded_at: monthsAgo(35),
    notes: 'Nationwide — 25-year fixed for first 5.',
  }),

  // ── Planning ─────────────────────────────────────────────────────────────
  base({
    id: 'sample-15',
    _docId: 'sample-15',
    name: 'Planning Permission — Single-Storey Rear Extension',
    discipline: 'planning',
    doc_type: 'other',
    category: '',
    file_name: 'planning-rear-extension.pdf',
    file_size: 1_600_000,
    uploaded_at: monthsAgo(14),
    notes: 'Granted by Tunbridge Wells BC, ref 25/00123/FUL.',
  }),
  base({
    id: 'sample-16',
    _docId: 'sample-16',
    name: 'Building Regulations Completion Certificate',
    discipline: 'planning',
    doc_type: 'other',
    category: '',
    file_name: 'building-regs-completion.pdf',
    file_size: 410_000,
    uploaded_at: monthsAgo(9),
  }),

  // ── Utility ──────────────────────────────────────────────────────────────
  base({
    id: 'sample-17',
    _docId: 'sample-17',
    name: 'Council Tax Bill 2025–26',
    discipline: 'utility',
    doc_type: 'other',
    category: '',
    file_name: 'council-tax-2025.pdf',
    file_size: 180_000,
    expires_at: daysFromNow(-60),
    is_expired: true,
    uploaded_at: monthsAgo(14),
    notes: 'Band D — £2,184.00 across 10 instalments.',
  }),
  base({
    id: 'sample-18',
    _docId: 'sample-18',
    name: 'Octopus Energy — Annual Statement',
    discipline: 'utility',
    doc_type: 'other',
    category: '',
    file_name: 'octopus-annual-statement.pdf',
    file_size: 240_000,
    uploaded_at: monthsAgo(3),
  }),

  // ── Other ────────────────────────────────────────────────────────────────
  base({
    id: 'sample-19',
    _docId: 'sample-19',
    name: 'House Manual & Floor Plan',
    discipline: 'other',
    doc_type: 'other',
    category: '',
    file_name: 'house-manual.pdf',
    file_size: 2_600_000,
    uploaded_at: monthsAgo(20),
    notes: 'Stopcock locations, fuse box, appliance manuals.',
  }),
  base({
    id: 'sample-20',
    _docId: 'sample-20',
    name: 'Roofing — 10-Year Workmanship Guarantee',
    discipline: 'warranty',
    doc_type: 'roofing',
    category: 'roofing_re_roofing_full_roof_replacement',
    file_name: 'roofing-guarantee.pdf',
    file_size: 320_000,
    expires_at: daysFromNow(2200),
    uploaded_at: monthsAgo(15),
    notes: 'Smith & Sons Roofing — issued after re-roof.',
  }),
];
