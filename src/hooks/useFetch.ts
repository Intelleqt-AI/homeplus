import { fetchData } from '@/lib/Api';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

const useFetch = <T = any>(
  url: string | null,
  options?: Omit<UseQueryOptions<T, Error>, 'queryKey'>
) => {
  const { queryFn: customFn, enabled, ...rest } = options ?? {};
  const { data, isLoading, error, isError, refetch, isPending, isFetching } = useQuery<T, Error>({
    queryKey: [url],
    queryFn: customFn ?? (() => fetchData<T>(url!)),
    enabled: url !== null && enabled !== false,
    ...rest,
  });

  return { data, isLoading, error, isError, refetch, isPending, isFetching };
};

export default useFetch;
