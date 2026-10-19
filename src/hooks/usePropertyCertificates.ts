import { useQuery } from '@tanstack/react-query';
import { fetchCertificates } from '@/lib/Api2';

export const CERTIFICATES_KEY = '/api/v1/properties/certificates/';

/** The gas safety record, EICR and EPC of one home, with their dates and vault links. */
export function usePropertyCertificates(propertyId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: [CERTIFICATES_KEY, propertyId ?? null],
    queryFn: () => fetchCertificates(propertyId as string),
    enabled: enabled && !!propertyId,
    staleTime: 60_000,
    refetchOnMount: 'always',
  });
}
