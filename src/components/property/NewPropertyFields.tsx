import { useRef } from 'react';
import { Check } from 'lucide-react';
import HomeSelector from '@/components/HomeSelector';
import PropertyDetailsFields, { type DetailField } from '@/components/PropertyDetailsFields';
import { fetchHomeDetails, type HomeSelection } from '@/lib/homeLookup';
import { applyEpc, clearEpc, epcSummary, type HomeDetails } from '@/lib/propertyOptions';

/**
 * Add-a-property fields, the same flow as the onboarding home step: Area → Postcode → Home,
 * address and map pin placed for you, then the property details with whatever the home's EPC
 * certificate told us already filled in (property type, floor area, year built, walls...).
 * Everything stays editable. Controlled: the parent owns the state and builds the request.
 */
interface Props {
  home: HomeSelection;
  onHomeChange: (home: HomeSelection) => void;
  details: HomeDetails;
  onDetailsChange: (details: HomeDetails) => void;
  errors?: Record<string, string>;
}

// The home name comes first, above the address; everything else follows the picked home.
const AFTER_HOME: DetailField[] = [
  'propertyType', 'role', 'bedrooms', 'bathrooms', 'heatingType', 'yearBuilt', 'tenure', 'floorArea', 'wallConstruction',
];

const NewPropertyFields = ({ home, onHomeChange, details, onDetailsChange, errors = {} }: Props) => {
  // Lookups finish after renders, so they read the latest details from here.
  const detailsRef = useRef(details);
  detailsRef.current = details;

  const handleHomeChange = (next: HomeSelection) => {
    const changed = next.homeId !== home.homeId;
    onHomeChange(next);
    if (!changed) return;
    // A different home: drop what the last one gave us, then read this one's EPC facts.
    detailsRef.current = clearEpc(detailsRef.current);
    onDetailsChange(detailsRef.current);
    if (next.homeId !== null) {
      fetchHomeDetails(next.homeId).then(epc => {
        detailsRef.current = applyEpc(clearEpc(detailsRef.current), epc);
        onDetailsChange(detailsRef.current);
      });
    }
  };

  const patchDetails = (patch: Partial<HomeDetails>) => {
    detailsRef.current = { ...detailsRef.current, ...patch };
    onDetailsChange(detailsRef.current);
  };

  const summary = epcSummary(details);
  const homeChosen = !!home.postcode || !!home.address;

  return (
    <div className="space-y-5">
      <PropertyDetailsFields value={details} onChange={patchDetails} show={['name']} />

      <HomeSelector value={home} onChange={handleHomeChange} error={errors.home} />

      {homeChosen && (
        <div className="space-y-4 border-t pt-4">
          {summary.length > 0 && (
            <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm text-foreground">
                <span className="font-medium">Filled from your EPC:</span> {summary.join(' · ')}
              </p>
            </div>
          )}
          <PropertyDetailsFields
            value={details}
            onChange={patchDetails}
            errors={errors}
            show={AFTER_HOME}
            required={['propertyType']}
          />
        </div>
      )}
    </div>
  );
};

export default NewPropertyFields;
