import { gooeyToast, type GooeyToastOptions, type GooeyToastUpdateOptions } from 'goey-toast';

export const toast = Object.assign(
  (msg: string, opts?: GooeyToastOptions) => gooeyToast(msg, opts),
  {
    success: (msg: string, opts?: GooeyToastOptions) => gooeyToast.success(msg, opts),
    error:   (msg: string, opts?: GooeyToastOptions) => gooeyToast.error(msg, opts),
    warning: (msg: string, opts?: GooeyToastOptions) => gooeyToast.warning(msg, opts),
    info:    (msg: string, opts?: GooeyToastOptions) => gooeyToast.info(msg, opts),
    dismiss: (id?: string | number) => gooeyToast.dismiss(id),
    update:  (id: string | number, opts: GooeyToastUpdateOptions) => gooeyToast.update(id, opts),
    promise: gooeyToast.promise,
  }
);
