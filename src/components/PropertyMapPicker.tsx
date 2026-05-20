import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, Search } from 'lucide-react';
import { postcodeToLatLng, reverseGeocode } from '@/lib/geocoding';

// Leaflet default-icon Vite workaround — bundle the marker assets explicitly.
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const UK_CENTER: [number, number] = [54.5, -2.0];

export type PickerChange = {
  lat: number;
  lng: number;
  address?: string;
  postcode?: string;
  city?: string;
};

type Suggestion = {
  display_name: string;
  lat: number;
  lng: number;
  postcode?: string;
  city?: string;
};

interface Props {
  lat: number | null;
  lng: number | null;
  postcode?: string;
  onChange: (change: PickerChange) => void;
  className?: string;
}

function Recenter({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (lat !== null && lng !== null) {
      map.setView([lat, lng], 16, { animate: true });
    }
  }, [lat, lng, map]);
  return null;
}

async function searchPlaces(query: string): Promise<Suggestion[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=gb&q=${encodeURIComponent(q)}&addressdetails=1&limit=8`,
      { headers: { 'Accept-Language': 'en' } },
    );
    if (!res.ok) return [];
    const body = await res.json();
    if (!Array.isArray(body)) return [];
    return body.map((r: any) => ({
      display_name: r.display_name as string,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      postcode: r.address?.postcode as string | undefined,
      city: (r.address?.city ?? r.address?.town ?? r.address?.village ?? r.address?.suburb) as string | undefined,
    }));
  } catch {
    return [];
  }
}

const PropertyMapPicker = ({ lat, lng, postcode, onChange, className }: Props) => {
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const lastLookedUp = useRef<string>('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounced autocomplete search
  useEffect(() => {
    if (search.trim().length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = setTimeout(async () => {
      const results = await searchPlaces(search);
      setSuggestions(results);
      setLoading(false);
    }, 450);
    return () => clearTimeout(id);
  }, [search]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auto-look-up when the parent's postcode prop changes (debounced)
  useEffect(() => {
    const pc = (postcode || '').trim();
    const normalized = pc.replace(/\s+/g, '').toUpperCase();
    if (!pc || normalized === lastLookedUp.current) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      postcodeToLatLng(pc).then(res => {
        if (cancelled || !res) return;
        lastLookedUp.current = normalized;
        onChange({ lat: res.lat, lng: res.lng });
      });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postcode]);

  const handlePickSuggestion = (s: Suggestion) => {
    setSearch(s.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
    onChange({ lat: s.lat, lng: s.lng, address: s.display_name, postcode: s.postcode, city: s.city });
  };

  const center: [number, number] = lat !== null && lng !== null ? [lat, lng] : UK_CENTER;
  const zoom = lat !== null && lng !== null ? 16 : 6;

  return (
    <div className={className ?? 'space-y-2'}>
      {/* Search with autocomplete */}
      <div ref={wrapperRef} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search address, street, postcode or city…"
            className="w-full pl-9 pr-9 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            autoComplete="off"
          />
          {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />}
        </div>
        {showSuggestions && (suggestions.length > 0 || (loading && search.trim().length >= 3)) && (
          <div className="absolute z-[1000] mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {loading && suggestions.length === 0 && (
              <div className="px-3 py-2 text-xs text-gray-400">Searching…</div>
            )}
            {suggestions.map((s, i) => (
              <button
                type="button"
                key={`${s.lat}-${s.lng}-${i}`}
                onClick={() => handlePickSuggestion(s)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                {s.display_name}
              </button>
            ))}
            {!loading && suggestions.length === 0 && search.trim().length >= 3 && (
              <div className="px-3 py-2 text-xs text-gray-400">No matches</div>
            )}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-1">Pick a suggestion or drag the pin on the map to fine-tune the location.</p>
      </div>

      {/* Map */}
      <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-200">
        <MapContainer center={center} zoom={zoom} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {lat !== null && lng !== null && (
            <Marker
              draggable
              position={[lat, lng]}
              icon={defaultIcon}
              eventHandlers={{
                async dragend(e) {
                  const p = (e.target as L.Marker).getLatLng();
                  const rev = await reverseGeocode(p.lat, p.lng);
                  if (rev?.postcode) {
                    lastLookedUp.current = rev.postcode.replace(/\s+/g, '').toUpperCase();
                  }
                  onChange({
                    lat: p.lat,
                    lng: p.lng,
                    address: rev?.address,
                    postcode: rev?.postcode,
                    city: rev?.city,
                  });
                },
              }}
            />
          )}
          <Recenter lat={lat} lng={lng} />
        </MapContainer>
      </div>
    </div>
  );
};

export default PropertyMapPicker;
