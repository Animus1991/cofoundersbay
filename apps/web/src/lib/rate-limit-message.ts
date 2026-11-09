import { ApiError } from '@/lib/api';

/** What a sign-in or sign-up form says when the API's limit is reached (docs §121). */
export const TOO_MANY_ATTEMPTS = {
  en: 'Too many attempts. Please wait a minute and try again.',
  el: 'Πολλές προσπάθειες. Περιμένετε ένα λεπτό και δοκιμάστε ξανά.',
};

export const isRateLimited = (err: unknown): boolean => err instanceof ApiError && err.status === 429;
