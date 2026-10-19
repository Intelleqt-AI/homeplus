import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { HEATING_TYPES, PROPERTY_TYPES, TENURE_TYPES, USAGES, WALL_TYPES, type HomeDetails } from '@/lib/propertyOptions';
import type { Usage, Wording } from '@/lib/account';

export type DetailField =
  | 'name' | 'propertyType' | 'usage' | 'bedrooms' | 'bathrooms' | 'heatingType' | 'yearBuilt' | 'tenure'
  | 'floorArea' | 'wallConstruction';

/**
 * The property details a user types in: home name, type (dropdown), role, rooms and extras.
 * `show` limits it to some fields: signup asks only name + role (EPC fills the rest where it
 * can), and onboarding asks only what is still empty. `required` marks fields that must be set.
 */
interface Props {
  value: HomeDetails;
  onChange: (patch: Partial<HomeDetails>) => void;
  errors?: Record<string, string>;
  show?: DetailField[];
  required?: DetailField[];
  autoFocus?: boolean;
  /** `property` for a home someone lets out ("Property name"), else `home`. */
  wording?: Wording;
}

const PropertyDetailsFields = ({ value, onChange, errors = {}, show, required = [], autoFocus, wording = 'home' }: Props) => {
  const has = (f: DetailField) => !show || show.includes(f);
  const optional = (f: DetailField) => (required.includes(f) ? null : (
    <span className="font-normal text-muted-foreground"> (optional)</span>
  ));
  const pair = (a: DetailField, b: DetailField) => has(a) && has(b);

  const bedrooms = (
    <div className="space-y-1.5">
      <Label htmlFor="bedrooms">Bedrooms{optional('bedrooms')}</Label>
      <Input
        id="bedrooms" type="number" min={0} max={20} placeholder="e.g. 3"
        value={value.bedrooms} onChange={e => onChange({ bedrooms: e.target.value })}
      />
    </div>
  );
  const bathrooms = (
    <div className="space-y-1.5">
      <Label htmlFor="bathrooms">Bathrooms{optional('bathrooms')}</Label>
      <Input
        id="bathrooms" type="number" min={0} max={10} placeholder="e.g. 1"
        value={value.bathrooms} onChange={e => onChange({ bathrooms: e.target.value })}
      />
    </div>
  );
  const yearBuilt = (
    <div className="space-y-1.5">
      <Label htmlFor="yearBuilt">Year built{optional('yearBuilt')}</Label>
      <Input
        id="yearBuilt" type="number" min={1800} max={new Date().getFullYear()} placeholder="e.g. 1985"
        value={value.yearBuilt} onChange={e => onChange({ yearBuilt: e.target.value })}
        className={errors.yearBuilt ? 'border-destructive' : ''}
      />
      {errors.yearBuilt && <p className="text-xs text-destructive">{errors.yearBuilt}</p>}
    </div>
  );
  const tenure = (
    <div className="space-y-1.5">
      <Label>Tenure{optional('tenure')}</Label>
      <Select value={value.tenure} onValueChange={v => onChange({ tenure: v })}>
        <SelectTrigger className="h-10"><SelectValue placeholder="Select" /></SelectTrigger>
        <SelectContent>
          {TENURE_TYPES.map(t => (
            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const floorArea = (
    <div className="space-y-1.5">
      <Label htmlFor="floorArea">Floor area (m²){optional('floorArea')}</Label>
      <Input
        id="floorArea" type="number" min={1} placeholder="e.g. 85"
        value={value.floorArea} onChange={e => onChange({ floorArea: e.target.value })}
      />
    </div>
  );
  const wall = (
    <div className="space-y-1.5">
      <Label>Wall construction{optional('wallConstruction')}</Label>
      <Select value={value.wallConstruction} onValueChange={v => onChange({ wallConstruction: v })}>
        <SelectTrigger className="h-10"><SelectValue placeholder="Select" /></SelectTrigger>
        <SelectContent>
          {WALL_TYPES.map(w => (
            <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-4">
      {has('name') && (
        <div className="space-y-1.5">
          <Label htmlFor="homeName">{wording === 'property' ? 'Property name' : 'Home name'}{optional('name')}</Label>
          <Input
            id="homeName"
            placeholder={wording === 'property' ? 'e.g. Flat 2, Oxford Road' : 'e.g. Main Home'}
            value={value.name}
            maxLength={200}
            autoFocus={autoFocus}
            onChange={e => onChange({ name: e.target.value })}
          />
        </div>
      )}

      {has('propertyType') && (
        <div className="space-y-1.5">
          <Label>Property type{optional('propertyType')}</Label>
          <Select value={value.propertyType} onValueChange={v => onChange({ propertyType: v })}>
            <SelectTrigger className={cn('h-10', errors.propertyType && 'border-destructive')}>
              <SelectValue placeholder="Select property type" />
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.propertyType && <p className="text-xs text-destructive">{errors.propertyType}</p>}
        </div>
      )}

      {has('usage') && (
        <div className="space-y-1.5">
          <Label htmlFor="usage">How do you use this property?</Label>
          <Select value={value.usage || undefined} onValueChange={v => onChange({ usage: v as Usage })}>
            <SelectTrigger id="usage" className={cn('h-10', errors.usage && 'border-destructive')}>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {USAGES.map(u => (
                <SelectItem key={u.value} value={u.value} data-usage={u.value}>{u.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.usage && <p className="text-xs text-destructive">{errors.usage}</p>}
        </div>
      )}

      {pair('bedrooms', 'bathrooms') ? (
        <div className="grid grid-cols-2 gap-4">{bedrooms}{bathrooms}</div>
      ) : (
        <>{has('bedrooms') && bedrooms}{has('bathrooms') && bathrooms}</>
      )}

      {has('heatingType') && (
        <div className="space-y-1.5">
          <Label>Heating type{optional('heatingType')}</Label>
          <Select value={value.heatingType} onValueChange={v => onChange({ heatingType: v })}>
            <SelectTrigger className="h-10"><SelectValue placeholder="Select heating type" /></SelectTrigger>
            <SelectContent>
              {HEATING_TYPES.map(h => (
                <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {value.heatingNote && (
            <p className="text-xs text-muted-foreground">
              EPC says: {value.heatingNote.toLowerCase()}. Pick combi or system.
            </p>
          )}
        </div>
      )}

      {pair('yearBuilt', 'tenure') ? (
        <div className="grid grid-cols-2 gap-4">{yearBuilt}{tenure}</div>
      ) : (
        <>{has('yearBuilt') && yearBuilt}{has('tenure') && tenure}</>
      )}

      {pair('floorArea', 'wallConstruction') ? (
        <div className="grid grid-cols-2 gap-4">{floorArea}{wall}</div>
      ) : (
        <>{has('floorArea') && floorArea}{has('wallConstruction') && wall}</>
      )}
    </div>
  );
};

export default PropertyDetailsFields;
