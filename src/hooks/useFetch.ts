import { fetchData } from '@/lib/Api';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

const useFetch = <T = any>(
  url: string | null,
  // queryKey is optional; defaults to [url]. Passing it lets callers share a
  // stable cache key independent of the URL string (e.g. ['leads']).
  options?: Partial<UseQueryOptions<T, Error>>
) => {
  const { queryKey, queryFn: customFn, enabled, ...rest } = options ?? {};
  const { data, isLoading, error, isError, refetch, isPending, isFetching } = useQuery<T, Error>({
    queryKey: queryKey ?? [url],
    queryFn: customFn ?? (() => fetchData<T>(url!)),
    enabled: url !== null && enabled !== false,
    ...rest,
  });

  return { data, isLoading, error, isError, refetch, isPending, isFetching };
};

export default useFetch;
