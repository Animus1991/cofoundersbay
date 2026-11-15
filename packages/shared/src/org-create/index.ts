/**
 * Creating an organisation (`POST /organizations`).
 *
 * The endpoint handed its body to `prisma.organization.create`: any `type`
 * (the column is an enum, so a typo was a 500), any slug - including `programs`
 * or `applications`, which `/org/<slug>` can never reach because those are the
 * organisation console's own pages - and a client-chosen `tenantId`, which
 * attached the new organisation to someone else's white-label tenant. This
 * reader keeps the fields a founder of an organisation owns, checks them, and
 * drops the rest (verification, activity, settings and the tenant stay with
 * the platform). One rule for the API, the form and the demo world.
 */

export const ORGANIZATION_TYPES = [
  'incubator', 'accelerator', 'university', 'venture_studio', 'innovation_hub', 'vc_fund', 'angel_syndicate',
  'public_body', 'service_provider', 'corporate_innovation', 'chamber', 'cluster', 'ngo',
] as const;
export type OrganizationTypeValue = (typeof ORGANIZATION_TYPES)[number];

export const ORGANIZATION_TYPE_COPY: Readonly<Record<OrganizationTypeValue, { en: string; el: string }>> = {
  incubator: { en: 'Incubator', el: 'Θερμοκοιτίδα' },
  accelerator: { en: 'Accelerator', el: 'Επιταχυντής' },
  university: { en: 'University', el: 'Πανεπιστήμιο' },
  venture_studio: { en: 'Venture studio', el: 'Venture studio' },
  innovation_hub: { en: 'Innovation hub', el: 'Κόμβος καινοτομίας' },
  vc_fund: { en: 'VC fund', el: 'Ταμείο VC' },
  angel_syndicate: { en: 'Angel syndicate', el: 'Ομάδα angel επενδυτών' },
  public_body: { en: 'Public body', el: 'Δημόσιος φορέας' },
  service_provider: { en: 'Service provider', el: 'Πάροχος υπηρεσιών' },
  corporate_innovation: { en: 'Corporate innovation', el: 'Εταιρική καινοτομία' },
  chamber: { en: 'Chamber', el: 'Επιμελητήριο' },
  cluster: { en: 'Cluster', el: 'Σύμπραξη (cluster)' },
  ngo: { en: 'Non-profit', el: 'Μη κερδοσκοπικός οργανισμός' },
};

/**
 * Slugs `/org/<slug>` cannot serve: the console's own pages under /org, and a
 * few words kept for later. A new console page adds its folder name here
 * (`orgCreate.test.ts` reads the folders).
 */
export const RESERVED_ORG_SLUGS = [
  'analytics', 'applications', 'cohorts', 'dashboard', 'events', 'members', 'mentors', 'programs', 'settings', 'startups',
  'admin', 'api', 'new', 'create', 'join', 'billing', 'help',
] as const;

export const ORG_CREATE_LIMITS = { name: 120, slugMin: 3, slugMax: 48, text: 1000, short: 120, url: 500 } as const;

/** Fields a member may never set when creating an organisation. */
export const ORG_PLATFORM_FIELDS = ['id', 'tenantId', 'createdById', 'isVerified', 'isActive', 'settings', 'createdAt', 'updatedAt'] as const;

export type NewOrganization = {
  type: OrganizationTypeValue;
  name: string;
  slug: string;
  description?: string;
  website?: string;
  city?: string;
  country?: string;
};

export type OrgCreateRead =
  | { ok: true; value: NewOrganization; ignored: string[] }
  | { ok: false; field: string; reason: { en: string; el: string } };

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const GREEK_TO_LATIN: Record<string, string> = {
  α: 'a', β: 'v', γ: 'g', δ: 'd', ε: 'e', ζ: 'z', η: 'i', θ: 'th', ι: 'i', κ: 'k', λ: 'l', μ: 'm', ν: 'n', ξ: 'x',
  ο: 'o', π: 'p', ρ: 'r', σ: 's', ς: 's', τ: 't', υ: 'y', φ: 'f', χ: 'ch', ψ: 'ps', ω: 'o',
};

/** A slug suggested from a name: lower case, Latin letters and digits, words joined by hyphens. */
export function slugFromName(name: string): string {
  const plain = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[α-ω]/g, (c) => GREEK_TO_LATIN[c] ?? '');
  return plain.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, ORG_CREATE_LIMITS.slugMax).replace(/-+$/, '');
}

type TextRead = { ok: true; value: string | undefined } | { ok: false };

function readText(body: Record<string, unknown>, key: string, max: number): TextRead {
  const v = body[key];
  if (v === undefined || v === null || v === '') return { ok: true, value: undefined };
  if (typeof v !== 'string') return { ok: false };
  const t = v.trim();
  if (!t) return { ok: true, value: undefined };
  return t.length > max ? { ok: false } : { ok: true, value: t };
}

export function readNewOrganization(raw: unknown): OrgCreateRead {
  const body = (raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}) as Record<string, unknown>;
  const refuse = (field: string, en: string, el: string): OrgCreateRead => ({ ok: false, field, reason: { en, el } });

  const type = body.type;
  if (typeof type !== 'string' || !(ORGANIZATION_TYPES as readonly string[]).includes(type)) {
    return refuse('type', 'Choose what kind of organisation this is.', 'Επιλέξτε τι είδους οργανισμός είναι.');
  }
  const name = readText(body, 'name', ORG_CREATE_LIMITS.name);
  if (!name.ok || !name.value || name.value.length < 2) {
    return refuse('name', `Give the organisation a name of 2 to ${ORG_CREATE_LIMITS.name} characters.`, `Δώστε στον οργανισμό όνομα από 2 έως ${ORG_CREATE_LIMITS.name} χαρακτήρες.`);
  }
  const slug = typeof body.slug === 'string' && body.slug.trim() ? body.slug.trim().toLowerCase() : slugFromName(name.value);
  if (slug.length < ORG_CREATE_LIMITS.slugMin || slug.length > ORG_CREATE_LIMITS.slugMax || !SLUG.test(slug)) {
    return refuse(
      'slug',
      `The address takes ${ORG_CREATE_LIMITS.slugMin} to ${ORG_CREATE_LIMITS.slugMax} lower-case Latin letters, digits and single hyphens.`,
      `Η διεύθυνση δέχεται ${ORG_CREATE_LIMITS.slugMin} έως ${ORG_CREATE_LIMITS.slugMax} πεζά λατινικά γράμματα, ψηφία και μονές παύλες.`,
    );
  }
  if ((RESERVED_ORG_SLUGS as readonly string[]).includes(slug)) {
    return refuse('slug', 'That address is one of the platform’s own pages. Choose another.', 'Αυτή η διεύθυνση είναι σελίδα της πλατφόρμας. Επιλέξτε άλλη.');
  }
  const description = readText(body, 'description', ORG_CREATE_LIMITS.text);
  if (!description.ok) {
    return refuse('description', `Keep the description under ${ORG_CREATE_LIMITS.text} characters.`, `Η περιγραφή να είναι κάτω από ${ORG_CREATE_LIMITS.text} χαρακτήρες.`);
  }
  const website = readText(body, 'website', ORG_CREATE_LIMITS.url);
  if (!website.ok || (website.value && !/^https?:\/\/[^\s/]+\.[^\s]+$/i.test(website.value))) {
    return refuse('website', 'Give the website as a full address starting with https://.', 'Δώστε τον ιστότοπο ως πλήρη διεύθυνση που ξεκινά με https://.');
  }
  const city = readText(body, 'city', ORG_CREATE_LIMITS.short);
  if (!city.ok) return refuse('city', `Keep the city under ${ORG_CREATE_LIMITS.short} characters.`, `Η πόλη να είναι κάτω από ${ORG_CREATE_LIMITS.short} χαρακτήρες.`);
  const country = readText(body, 'country', ORG_CREATE_LIMITS.short);
  if (!country.ok) return refuse('country', `Keep the country under ${ORG_CREATE_LIMITS.short} characters.`, `Η χώρα να είναι κάτω από ${ORG_CREATE_LIMITS.short} χαρακτήρες.`);

  const kept = ['type', 'name', 'slug', 'description', 'website', 'city', 'country'];
  const value: NewOrganization = { type: type as OrganizationTypeValue, name: name.value, slug };
  if (description.value) value.description = description.value;
  if (website.value) value.website = website.value;
  if (city.value) value.city = city.value;
  if (country.value) value.country = country.value;
  return { ok: true, value, ignored: Object.keys(body).filter((k) => !kept.includes(k)) };
}
