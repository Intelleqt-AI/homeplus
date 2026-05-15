import { patchData } from '@/lib/Api';
import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

type PatchVars = { url: string; data?: unknown };

const usePatch = <TData = unknown, TError = Error, TVariables = PatchVars>(
  options?: UseMutationOptions<TData, TError, TVariables>
) => {
  const { mutationFn, ...rest } = options ?? {};
  return useMutation<TData, TError, TVariables>({
    mutationFn: mutationFn ?? ((vars: TVariables) => patchData<TData>(vars as PatchVars)),
    ...rest,
  });
};

export default usePatch;
