// Client for the public postcode / home lookup (backend: apps/properties/lookup_views.py).
// Every answer is cached server-side, so these are cheap to call as the user types.
import type { AxiosRequestConfig } from 'axios';
import apiClient from '@/lib/apiClient';

// Pre-login calls must not trigger the 401 token-refresh dance.
const publicCall = { _skipRefresh: true } as AxiosRequestConfig;
const BASE = '/api/v1/properties/lookup';

export type PostcodeOption = {
  postcode: string;
  latitude: number | null;
  longitude: number | null;
  admin_district: string;
};

export type LookupHome = {
  id: number;
  source: 'epc' | 'osm';
  uprn: string;
  address: string;
  post_town: string;
  certificate_number: string;
  latitude: number | null;
  longitude: number | null;
};

export type HomesResult = {
  status: 'ok' | 'not_found' | 'invalid_postcode' | 'unavailable' | 'pending';
  cached: boolean;
  homes: LookupHome[];
  postcode?: string;
  latitude?: number | null;
  longitude?: number | null;
  area?: string;
};

export type ReverseResult =
  | { status: 'not_found' }
  | {
      status: 'ok';
      postcode: string;
      latitude: number | null;
      longitude: number | null;
      area: string;
      address: string;
      home_id: number | null;
    };

/** The home the user picked at signup / onboarding. */
export type HomeSelection = {
  area: string;
  postcode: string;
  address: string;
  uprn: string;
  certificateNumber: string;
  lat: number | null;
  lng: number | null;
  /** True when the address was typed or came from the pin rather than a listed home. */
  manual: boolean;
  /** The listed home this came from (for looking up its EPC details); null when typed. */
  homeId: number | null;
};

export const EMPTY_HOME: HomeSelection = {
  area: '',
  postcode: '',
  address: '',
  uprn: '',
  certificateNumber: '',
  lat: null,
  lng: null,
  manual: false,
  homeId: null,
};

/** A home is complete once it has an address, a postcode and a pin. */
export const isHomeComplete = (h: HomeSelection): boolean =>
  !!h.address.trim() && !!h.postcode.trim() && h.lat !== null && h.lng !== null;

export async function searchPostcodes(outcode: string, q: string): Promise<PostcodeOption[]> {
  try {
    const { data } = await apiClient.get(`${BASE}/postcodes/`, { ...publicCall, params: { outcode, q } });
    return data?.data?.results ?? [];
  } catch {
    return [];
  }
}

export async function fetchHomes(postcode: string): Promise<HomesResult> {
  try {
    const { data } = await apiClient.get(`${BASE}/addresses/`, { ...publicCall, params: { postcode } });
    return data?.data as HomesResult;
  } catch {
    return { status: 'unavailable', cached: false, homes: [] };
  }
}

/** Fetches homes, asking again a few times while another request is still filling the cache. */
export async function fetchHomesPatiently(postcode: string): Promise<HomesResult> {
  let result = await fetchHomes(postcode);
  for (let i = 0; i < 3 && result.status === 'pending'; i++) {
    await new Promise(r => setTimeout(r, 2000));
    result = await fetchHomes(postcode);
  }
  return result;
}

/** What a home's EPC certificate says about the building (only the known fields are present). */
export type EpcDetails = {
  property_type?: string;
  built_form?: string;
  floor_area?: number;
  year_built?: number;
  construction_age_band?: string;
  heating_type?: string;
  heating_note?: string;
  wall_construction?: string;
};

/** The EPC facts for a listed home, or {} when there are none or the lookup failed. */
export async function fetchHomeDetails(homeId: number): Promise<EpcDetails> {
  try {
    const { data } = await apiClient.get(`${BASE}/details/`, { ...publicCall, params: { id: homeId } });
    return (data?.data?.details ?? {}) as EpcDetails;
  } catch {
    return {};
  }
}

export async function locateHome(id: number): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const { data } = await apiClient.get(`${BASE}/locate/`, { ...publicCall, params: { id } });
    const d = data?.data;
    return d?.latitude != null ? { latitude: d.latitude, longitude: d.longitude } : null;
  } catch {
    return null;
  }
}

export async function reversePin(lat: number, lng: number): Promise<ReverseResult> {
  try {
    const { data } = await apiClient.get(`${BASE}/reverse/`, { ...publicCall, params: { lat, lng } });
    return data?.data as ReverseResult;
  } catch {
    return { status: 'not_found' };
  }
}

/** Address text stored on the home: the line plus its post town when it is not already there. */
export const homeAddressText = (h: LookupHome): string =>
  h.post_town && !h.address.toLowerCase().includes(h.post_town.toLowerCase())
    ? `${h.address}, ${h.post_town}`
    : h.address;
