/**
 * Stakeholder listings: the mentor, service-provider and investor cards other
 * members search (`MentorProfile`, `ServiceProviderProfile`,
 * `InvestorProfile`).
 *
 * `POST /roles/{mentor,service-provider,investor}-profile` handed the request
 * body straight to a Prisma upsert, so a member could set their own rating,
 * review count or verification. These readers keep only the fields a member
 * owns, check each one's type and bounds, and drop everything else; ratings,
 * counts and verification stay with the platform. One rule for the API and
 * the demo world.
 */

export const MENTOR_SESSION_FORMATS = ['video', 'in_person', 'async'] as const;
export type MentorSessionFormat = (typeof MENTOR_SESSION_FORMATS)[number];

export const MENTOR_AVAILABILITY = ['available', 'limited', 'unavailable', 'by_invitation'] as const;
export type MentorAvailability = (typeof MENTOR_AVAILABILITY)[number];

export const SERVICE_PROVIDER_TYPES = [
  'legal', 'accounting', 'development', 'design', 'marketing', 'recruiting', 'consulting', 'coaching',
] as const;
export type ServiceProviderKind = (typeof SERVICE_PROVIDER_TYPES)[number];

export const PROVIDER_PRICING_MODELS = ['hourly', 'project', 'retainer', 'equity', 'mixed'] as const;
export type ProviderPricingModel = (typeof PROVIDER_PRICING_MODELS)[number];

export const INVESTOR_KINDS = ['angel', 'vc', 'scout', 'syndicate', 'cvc', 'family_office', 'institutional'] as const;
export type InvestorKind = (typeof INVESTOR_KINDS)[number];

export const LISTING_LIMITS = {
  headline: 120,
  name: 120,
  text: 4000,
  url: 500,
  listItems: 20,
  listItem: 60,
} as const;

/** Fields a member may never set on their own listing, named so a test can assert each is dropped. */
export const LISTING_PLATFORM_FIELDS = [
  'id', 'userId', 'user', 'createdAt', 'updatedAt',
  'avgRating', 'totalReviews', 'totalMentees', 'totalSessions',
  'isVerified', 'verifiedAt', 'mentoringSince',
] as const;

export interface ListingRefusal {
  ok: false;
  field: string;
  reason: { en: string; el: string };
}

export interface ListingRead<T> {
  ok: true;
  value: T;
  /** Keys the reader dropped: unknown, or owned by the platform. */
  ignored: string[];
}

export type ListingResult<T> = ListingRead<T> | ListingRefusal;

export interface MentorListingInput {
  headline?: string | null;
  bio?: string | null;
  expertiseSummary?: string | null;
  industries?: string[];
  startupStages?: string[];
  skills?: string[];
  specializations?: string[];
  yearsExperience?: number | null;
  hoursPerWeek?: number | null;
  sessionFormats?: MentorSessionFormat[];
  sessionDuration?: number;
  timezone?: string | null;
  isFree?: boolean;
  /** In cents, as the schema stores it. */
  hourlyRate?: number | null;
  currency?: string;
  availabilityStatus?: MentorAvailability;
  isActive?: boolean;
  isAcceptingRequests?: boolean;
}

export interface ProviderListingInput {
  serviceType?: ServiceProviderKind;
  companyName?: string | null;
  companyWebsite?: string | null;
  companyLogoUrl?: string | null;
  headline?: string | null;
  description?: string | null;
  industries?: string[];
  startupStages?: string[];
  pricingModel?: ProviderPricingModel | null;
  /** In cents. */
  startingPrice?: number | null;
  currency?: string;
  clientsServed?: number | null;
  yearsInBusiness?: number | null;
  isActive?: boolean;
  isAcceptingClients?: boolean;
}

export interface InvestorListingInput {
  investorType?: InvestorKind;
  firmName?: string | null;
  firmRole?: string | null;
  firmWebsite?: string | null;
  firmLogoUrl?: string | null;
  checkSizeMin?: number | null;
  checkSizeMax?: number | null;
  industries?: string[];
  stages?: string[];
  geographies?: string[];
  businessModels?: string[];
  portfolioCount?: number | null;
  exitsCount?: number | null;
  investingSince?: Date | null;
  bio?: string | null;
  investmentThesis?: string | null;
  isActivelyScouting?: boolean;
  acceptsColdOutreach?: boolean;
  isActive?: boolean;
  isPublic?: boolean;
}

class Refused extends Error {
  constructor(readonly field: string, readonly en: string, readonly el: string) {
    super(en);
  }
}

type Reader = (value: unknown, field: string) => unknown;

function text(max: number): Reader {
  return (value, field) => {
    if (value === null) return null;
    if (typeof value !== 'string') throw new Refused(field, `${field} must be text.`, `Το πεδίο ${field} πρέπει να είναι κείμενο.`);
    const trimmed = value.trim();
    if (trimmed.length > max) {
      throw new Refused(field, `${field} is longer than ${max} characters.`, `Το πεδίο ${field} ξεπερνά τους ${max} χαρακτήρες.`);
    }
    return trimmed.length ? trimmed : null;
  };
}

function url(value: unknown, field: string): unknown {
  const read = text(LISTING_LIMITS.url)(value, field);
  if (read === null) return null;
  const candidate = String(read);
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(candidate) ? candidate : `https://${candidate}`;
  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    throw new Refused(field, `${field} is not a web address.`, `Το πεδίο ${field} δεν είναι διεύθυνση ιστού.`);
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Refused(field, `${field} must start with http or https.`, `Το πεδίο ${field} πρέπει να ξεκινά με http ή https.`);
  }
  return parsed.toString();
}

function list(value: unknown, field: string): unknown {
  if (value === null) return [];
  if (!Array.isArray(value)) throw new Refused(field, `${field} must be a list.`, `Το πεδίο ${field} πρέπει να είναι λίστα.`);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') throw new Refused(field, `${field} must be a list of words.`, `Το πεδίο ${field} πρέπει να είναι λίστα λέξεων.`);
    const trimmed = item.trim();
    if (!trimmed) continue;
    if (trimmed.length > LISTING_LIMITS.listItem) {
      throw new Refused(field, `An item in ${field} is longer than ${LISTING_LIMITS.listItem} characters.`, `Ένα στοιχείο του ${field} ξεπερνά τους ${LISTING_LIMITS.listItem} χαρακτήρες.`);
    }
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  if (out.length > LISTING_LIMITS.listItems) {
    throw new Refused(field, `${field} holds at most ${LISTING_LIMITS.listItems} items.`, `Το πεδίο ${field} δέχεται έως ${LISTING_LIMITS.listItems} στοιχεία.`);
  }
  return out;
}

function oneOf<T extends string>(values: readonly T[], nullable = false): Reader {
  return (value, field) => {
    if (value === null && nullable) return null;
    if (typeof value === 'string' && (values as readonly string[]).includes(value)) return value;
    throw new Refused(field, `${field} must be one of: ${values.join(', ')}.`, `Το πεδίο ${field} πρέπει να είναι ένα από: ${values.join(', ')}.`);
  };
}

function subsetOf<T extends string>(values: readonly T[]): Reader {
  return (value, field) => {
    const read = list(value, field) as string[];
    for (const item of read) {
      if (!(values as readonly string[]).includes(item)) {
        throw new Refused(field, `${field} accepts only: ${values.join(', ')}.`, `Το πεδίο ${field} δέχεται μόνο: ${values.join(', ')}.`);
      }
    }
    return read;
  };
}

function whole(min: number, max: number, nullable = true): Reader {
  return (value, field) => {
    if ((value === null || value === '') && nullable) return null;
    const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
    if (typeof n !== 'number' || !Number.isFinite(n) || !Number.isInteger(n)) {
      throw new Refused(field, `${field} must be a whole number.`, `Το πεδίο ${field} πρέπει να είναι ακέραιος αριθμός.`);
    }
    if (n < min || n > max) {
      throw new Refused(field, `${field} must be between ${min} and ${max}.`, `Το πεδίο ${field} πρέπει να είναι από ${min} έως ${max}.`);
    }
    return n;
  };
}

function flag(value: unknown, field: string): unknown {
  if (typeof value === 'boolean') return value;
  throw new Refused(field, `${field} must be true or false.`, `Το πεδίο ${field} πρέπει να είναι αληθές ή ψευδές.`);
}

function currency(value: unknown, field: string): unknown {
  if (typeof value === 'string' && /^[A-Za-z]{3}$/.test(value.trim())) return value.trim().toUpperCase();
  throw new Refused(field, `${field} must be a three-letter currency code.`, `Το πεδίο ${field} πρέπει να είναι κωδικός νομίσματος τριών γραμμάτων.`);
}

function pastDate(value: unknown, field: string): unknown {
  if (value === null || value === '') return null;
  const d = value instanceof Date ? value : typeof value === 'string' ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) throw new Refused(field, `${field} must be a date.`, `Το πεδίο ${field} πρέπει να είναι ημερομηνία.`);
  if (d.getTime() > Date.now()) throw new Refused(field, `${field} cannot be in the future.`, `Το πεδίο ${field} δεν μπορεί να είναι στο μέλλον.`);
  return d;
}

const MAX_CENTS = 100_000_000; // one million in the currency's main unit

const MENTOR_FIELDS: Record<keyof MentorListingInput, Reader> = {
  headline: text(LISTING_LIMITS.headline),
  bio: text(LISTING_LIMITS.text),
  expertiseSummary: text(LISTING_LIMITS.text),
  industries: list,
  startupStages: list,
  skills: list,
  specializations: list,
  yearsExperience: whole(0, 70),
  hoursPerWeek: whole(0, 80),
  sessionFormats: subsetOf(MENTOR_SESSION_FORMATS),
  sessionDuration: whole(15, 240, false),
  timezone: text(64),
  isFree: flag,
  hourlyRate: whole(0, MAX_CENTS),
  currency,
  availabilityStatus: oneOf(MENTOR_AVAILABILITY),
  isActive: flag,
  isAcceptingRequests: flag,
};

const PROVIDER_FIELDS: Record<keyof ProviderListingInput, Reader> = {
  serviceType: oneOf(SERVICE_PROVIDER_TYPES),
  companyName: text(LISTING_LIMITS.name),
  companyWebsite: url,
  companyLogoUrl: url,
  headline: text(LISTING_LIMITS.headline),
  description: text(LISTING_LIMITS.text),
  industries: list,
  startupStages: list,
  pricingModel: oneOf(PROVIDER_PRICING_MODELS, true),
  startingPrice: whole(0, MAX_CENTS),
  currency,
  clientsServed: whole(0, 1_000_000),
  yearsInBusiness: whole(0, 200),
  isActive: flag,
  isAcceptingClients: flag,
};

const INVESTOR_FIELDS: Record<keyof InvestorListingInput, Reader> = {
  investorType: oneOf(INVESTOR_KINDS),
  firmName: text(LISTING_LIMITS.name),
  firmRole: text(LISTING_LIMITS.name),
  firmWebsite: url,
  firmLogoUrl: url,
  checkSizeMin: whole(0, 2_000_000_000),
  checkSizeMax: whole(0, 2_000_000_000),
  industries: list,
  stages: list,
  geographies: list,
  businessModels: list,
  portfolioCount: whole(0, 100_000),
  exitsCount: whole(0, 100_000),
  investingSince: pastDate,
  bio: text(LISTING_LIMITS.text),
  investmentThesis: text(LISTING_LIMITS.text),
  isActivelyScouting: flag,
  acceptsColdOutreach: flag,
  isActive: flag,
  isPublic: flag,
};

function readWith<T>(fields: Record<string, Reader>, raw: unknown): ListingResult<T> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, field: 'body', reason: { en: 'Send the listing as an object of fields.', el: 'Στείλτε την καταχώριση ως αντικείμενο πεδίων.' } };
  }
  const value: Record<string, unknown> = {};
  const ignored: string[] = [];
  try {
    for (const [key, input] of Object.entries(raw as Record<string, unknown>)) {
      const reader = Object.prototype.hasOwnProperty.call(fields, key) ? fields[key] : undefined;
      if (!reader || input === undefined) {
        if (!reader) ignored.push(key);
        continue;
      }
      value[key] = reader(input, key);
    }
  } catch (err) {
    if (err instanceof Refused) return { ok: false, field: err.field, reason: { en: err.en, el: err.el } };
    throw err;
  }
  return { ok: true, value: value as T, ignored };
}

export function readMentorListing(raw: unknown): ListingResult<MentorListingInput> {
  return readWith<MentorListingInput>(MENTOR_FIELDS, raw);
}

export function readProviderListing(raw: unknown): ListingResult<ProviderListingInput> {
  return readWith<ProviderListingInput>(PROVIDER_FIELDS, raw);
}

export function readInvestorListing(raw: unknown): ListingResult<InvestorListingInput> {
  const read = readWith<InvestorListingInput>(INVESTOR_FIELDS, raw);
  if (read.ok) {
    const { checkSizeMin, checkSizeMax } = read.value;
    if (typeof checkSizeMin === 'number' && typeof checkSizeMax === 'number' && checkSizeMin > checkSizeMax) {
      return {
        ok: false,
        field: 'checkSizeMax',
        reason: { en: 'The largest cheque is smaller than the smallest.', el: 'Το μεγαλύτερο ποσό είναι μικρότερο από το μικρότερο.' },
      };
    }
  }
  return read;
}

/** A listing is created on its first save; these kinds must be named then. */
export const LISTING_CREATE_REQUIRES = {
  mentor: [] as string[],
  provider: ['serviceType'],
  investor: ['investorType'],
} as const;
