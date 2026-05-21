import { postData } from '@/lib/Api';
import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

type PostVars = { url: string; data?: unknown; config?: unknown };

export const usePost = <TData = unknown, TError = Error, TVariables = PostVars>(
  options?: UseMutationOptions<TData, TError, TVariables>
) => {
  const { mutationFn, ...rest } = options ?? {};
  return useMutation<TData, TError, TVariables>({
    mutationFn: mutationFn ?? ((vars: TVariables) => postData<TData>(vars as PostVars)),
    ...rest,
  });
};
