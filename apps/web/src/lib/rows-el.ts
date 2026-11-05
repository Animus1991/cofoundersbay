import { statusEl } from '@/components/common/StatusText';

/**
 * An enum value as a Greek reader's assistant should quote it: the status
 * vocabulary's Greek when it knows the value ("active" → «Ενεργό»), else
 * the value with its underscores read as spaces. For page lists' `rowsEl`
 * (docs §54.7-7, §111), so a Greek answer about "this page" does not quote
 * the API's English.
 */
export function elWord(value: string | null | undefined): string {
  if (!value) return '';
  return statusEl(value) ?? value.replace(/_/g, ' ');
}
