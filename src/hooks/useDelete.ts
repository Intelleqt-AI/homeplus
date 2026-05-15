import { deleteData } from '@/lib/Api';
import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

type DeleteVars = { url: string; data?: unknown };

const useDelete = <TData = unknown, TError = Error, TVariables = DeleteVars>(
  options?: UseMutationOptions<TData, TError, TVariables>
) => {
  const { mutationFn, ...rest } = options ?? {};
  return useMutation<TData, TError, TVariables>({
    mutationFn: mutationFn ?? ((vars: TVariables) => deleteData<TData>(vars as DeleteVars)),
    ...rest,
  });
};

export default useDelete;
