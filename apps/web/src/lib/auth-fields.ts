export type FieldMessage = { en: string; el: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Shown under the field after blur or submit. A valid value returns nothing, so the form keeps its resting height. */
export function loginEmailError(value: string): FieldMessage | null {
  const email = value.trim();
  if (!email) {
    return {
      en: 'Enter the email you signed up with.',
      el: 'Γράψτε το email με το οποίο εγγραφήκατε.',
    };
  }
  if (!EMAIL_RE.test(email)) {
    return {
      en: 'That does not look like an email.',
      el: 'Αυτό δεν μοιάζει με email.',
    };
  }
  return null;
}

export function loginPasswordError(value: string): FieldMessage | null {
  if (value.length > 0) return null;
  return {
    en: 'Enter your password.',
    el: 'Γράψτε τον κωδικό σας.',
  };
}

export function registerEmailError(value: string): FieldMessage | null {
  return loginEmailError(value);
}

export function registerPasswordError(value: string): FieldMessage | null {
  if (value.length >= 8) return null;
  return {
    en: 'Password must be at least 8 characters.',
    el: 'Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες.',
  };
}
