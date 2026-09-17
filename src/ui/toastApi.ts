import { enqueueSnackbar } from 'notistack'

export type ToastKind = 'info' | 'assign' | 'urgent' | 'ok'

/**
 * Imperative, matching the legacy `UCM.toast(title, body, kind)` signature so
 * call sites port mechanically. notistack's standalone `enqueueSnackbar` means
 * this works from plain event handlers, outside the React tree.
 *
 * Lives apart from the provider component so importing it doesn't defeat
 * fast refresh.
 */
export function toast(title: string, body?: string, kind: ToastKind = 'info'): void {
  enqueueSnackbar({ message: title, variant: 'ucm', body, kind })
}
