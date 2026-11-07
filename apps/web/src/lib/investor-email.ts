/**
 * A first version of a note to an investor. It starts from the step the founder
 * wrote down, so it says something true, and it never claims a meeting, a
 * figure or a promise: those are the founder's to add.
 */
export function investorEmailDraft(
  lead: { name: string; nameEl?: string; nextStep?: string },
  sender: string | null,
  language: 'en' | 'el',
): { subject: string; body: string } {
  const step = lead.nextStep?.trim();
  if (language === 'el') {
    return {
      subject: step ? `Επόμενο βήμα: ${step}` : 'Μια σύντομη ενημέρωση',
      body: [
        `Καλησπέρα ${lead.nameEl ?? lead.name},`,
        step ? `Σας γράφω για το επόμενο βήμα μας: ${step}.` : 'Σας γράφω για μια σύντομη ενημέρωση για τον γύρο μας.',
        'Θα μπορούσαμε να μιλήσουμε σύντομα αυτή την εβδομάδα;',
        sender ? `Με εκτίμηση,\n${sender}` : 'Με εκτίμηση,',
      ].join('\n\n'),
    };
  }
  return {
    subject: step ? `Next step: ${step}` : 'A short update',
    body: [
      `Hello ${lead.name},`,
      step ? `I am writing about our next step: ${step}.` : 'I am writing with a short update on our round.',
      'Could we speak briefly this week?',
      sender ? `Best regards,\n${sender}` : 'Best regards,',
    ].join('\n\n'),
  };
}

/** Opens the reader's own mail app. Nothing leaves the platform until they press send there. */
export function mailtoHref({ to, subject, body }: { to: string; subject: string; body: string }): string {
  return `mailto:${encodeURIComponent(to.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
