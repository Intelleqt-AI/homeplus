type DocumentCategory = 'home' | 'car' | 'warranties' | 'miscellaneous';
type DocumentType = 'Insurance' | 'Certificate' | 'Compliance' | 'Warranty' | 'Receipt' | 'Contract' | 'Report';

interface DocumentSuggestion {
  category: DocumentCategory;
  type: DocumentType;
  confidence: 'high' | 'medium' | 'low';
  expiryRelevant: boolean;
}

const PATTERNS: { regex: RegExp; category: DocumentCategory; type: DocumentType; expiryRelevant: boolean }[] = [
  // Gas Safety / CP12
  { regex: /gas.?safe|cp12|cp\s?12/i, category: 'home', type: 'Certificate', expiryRelevant: true },
  // EICR
  { regex: /eicr|electrical.?install|electrical.?inspect/i, category: 'home', type: 'Certificate', expiryRelevant: true },
  // EPC
  { regex: /epc|energy.?performance/i, category: 'home', type: 'Certificate', expiryRelevant: true },
  // PAT
  { regex: /pat.?test|portable.?appliance/i, category: 'home', type: 'Certificate', expiryRelevant: true },
  // Fire Safety
  { regex: /fire.?risk|fire.?safe|fire.?cert/i, category: 'home', type: 'Compliance', expiryRelevant: true },
  // Legionella
  { regex: /legionella|water.?risk/i, category: 'home', type: 'Certificate', expiryRelevant: true },
  // Boiler
  { regex: /boiler.?serv|boiler.?cert|boiler.?warrant/i, category: 'home', type: 'Certificate', expiryRelevant: true },
  // Insurance - Home
  { regex: /home.?insur|building.?insur|content.?insur|landlord.?insur/i, category: 'home', type: 'Insurance', expiryRelevant: true },
  // Insurance - Car
  { regex: /car.?insur|motor.?insur|vehicle.?insur|auto.?insur/i, category: 'car', type: 'Insurance', expiryRelevant: true },
  // MOT
  { regex: /\bmot\b|mot.?cert|mot.?test/i, category: 'car', type: 'Certificate', expiryRelevant: true },
  // Car tax / road tax
  { regex: /car.?tax|road.?tax|vehicle.?tax|ved\b/i, category: 'car', type: 'Certificate', expiryRelevant: true },
  // Building regs
  { regex: /building.?reg|planning.?perm|planning.?consent/i, category: 'home', type: 'Compliance', expiryRelevant: false },
  // Mortgage
  { regex: /mortgage|remortgage/i, category: 'home', type: 'Contract', expiryRelevant: true },
  // Tenancy
  { regex: /tenancy|lease.?agree|rental.?agree/i, category: 'home', type: 'Contract', expiryRelevant: true },
  // Warranty
  { regex: /warranty|guarantee/i, category: 'warranties', type: 'Warranty', expiryRelevant: true },
  // Receipt
  { regex: /receipt|invoice|bill/i, category: 'miscellaneous', type: 'Receipt', expiryRelevant: false },
  // Survey / Report
  { regex: /survey|valuation|report|inspection/i, category: 'home', type: 'Report', expiryRelevant: false },
];

export function suggestDocumentCategory(filename: string): DocumentSuggestion {
  const name = filename.replace(/\.[^.]+$/, ''); // Remove extension

  for (const pattern of PATTERNS) {
    if (pattern.regex.test(name)) {
      return {
        category: pattern.category,
        type: pattern.type,
        confidence: 'high',
        expiryRelevant: pattern.expiryRelevant,
      };
    }
  }

  // Medium confidence: check for very generic keywords
  if (/cert|certificate/i.test(name)) {
    return { category: 'home', type: 'Certificate', confidence: 'medium', expiryRelevant: true };
  }
  if (/insur|policy/i.test(name)) {
    return { category: 'home', type: 'Insurance', confidence: 'medium', expiryRelevant: true };
  }

  return { category: 'miscellaneous', type: 'Receipt', confidence: 'low', expiryRelevant: false };
}

export function getComplianceLink(filename: string): string | null {
  const name = filename.toLowerCase();
  if (/gas.?safe|cp12/.test(name)) return 'gas-safety';
  if (/eicr|electrical.?install/.test(name)) return 'eicr';
  if (/epc|energy.?perf/.test(name)) return 'epc';
  if (/pat.?test/.test(name)) return 'pat';
  if (/fire.?risk/.test(name)) return 'fire-safety';
  if (/legionella/.test(name)) return 'legionella';
  if (/boiler/.test(name)) return 'boiler-service';
  return null;
}
