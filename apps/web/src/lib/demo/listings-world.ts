/**
 * The demo visitor's own mentor and service-provider listings, with the API's
 * rules (`apps/api/src/roles`, `packages/shared/src/listings`): only the fields
 * a member owns are kept, a provider names its kind before the first save, and
 * a refusal carries the field and its Greek message.
 *
 * Both forms used to wait 800ms and say "Your profile is live" without saving
 * anything. The seeds are the values those forms opened with, so the demo
 * looks as it did; now a save survives a reload in the same session.
 */

import {
  LISTING_CREATE_REQUIRES,
  readMentorListing,
  readProviderListing,
  type ListingResult,
  type MentorListingInput,
  type ProviderListingInput,
} from '@cofounderbay/shared';
import { DemoRefusal } from './demo-refusal';

const STORAGE_KEY = 'cfb:demo-listings:v1';

type State = { mentor: MentorListingInput | null; provider: ProviderListingInput | null };

const SEED: State = {
  mentor: {
    headline: null,
    bio: null,
    industries: ['SaaS', 'Fintech'],
    startupStages: ['MVP', 'Early Revenue', 'Growth'],
    skills: ['Product Strategy', 'Fundraising', 'Go-to-Market'],
    sessionFormats: ['video', 'async'],
    isFree: true,
    hourlyRate: null,
    yearsExperience: 5,
    sessionDuration: 30,
    hoursPerWeek: 5,
    isAcceptingRequests: true,
  },
  provider: {
    serviceType: 'consulting',
    companyName: null,
    companyWebsite: null,
    headline: null,
    description: null,
    pricingModel: 'project',
    startingPrice: null,
    yearsInBusiness: 3,
    clientsServed: null,
    isAcceptingClients: true,
    industries: ['SaaS', 'Fintech'],
    startupStages: ['Seed', 'Series A'],
  },
};

let memory: State | null = null;

function load(): State {
  if (memory) return memory;
  try {
    const raw = typeof window !== 'undefined' ? window.sessionStorage.getItem(STORAGE_KEY) : null;
    memory = raw ? (JSON.parse(raw) as State) : structuredClone(SEED);
  } catch {
    memory = structuredClone(SEED);
  }
  return memory;
}

function persist() {
  try {
    if (memory && typeof window !== 'undefined') window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  } catch {
    // Storage blocked: the demo keeps working for this page view.
  }
}

export function resetDemoListings() {
  memory = null;
  try {
    if (typeof window !== 'undefined') window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function accepted<T>(read: ListingResult<T>): T {
  if (!read.ok) {
    throw new DemoRefusal(400, read.reason.en, { reason: 'listing_invalid', field: read.field, messageEl: read.reason.el });
  }
  return read.value;
}

/** Answers `/api/roles/{mentor,service-provider}-profile` for the demo, or `undefined` for any other path. */
export function previewListingsApi(pathname: string, method: string, body: Record<string, unknown>): unknown {
  if (pathname !== '/api/roles/mentor-profile' && pathname !== '/api/roles/service-provider-profile') return undefined;
  const state = load();
  const key = pathname === '/api/roles/mentor-profile' ? 'mentor' : 'provider';
  if (method === 'GET') return state[key] ? { id: `demo-${key}-listing`, ...state[key] } : null;
  if (method !== 'POST') return undefined;
  if (key === 'mentor') {
    state.mentor = { ...(state.mentor ?? {}), ...accepted(readMentorListing(body)) };
  } else {
    const read = accepted(readProviderListing(body));
    if (!state.provider) {
      for (const field of LISTING_CREATE_REQUIRES.provider) {
        if ((read as Record<string, unknown>)[field] === undefined) {
          throw new DemoRefusal(400, 'Choose the kind of service before the first save.', {
            reason: 'listing_invalid',
            field,
            messageEl: 'Επιλέξτε το είδος της υπηρεσίας πριν από την πρώτη αποθήκευση.',
          });
        }
      }
    }
    state.provider = { ...(state.provider ?? {}), ...read };
  }
  persist();
  return { id: `demo-${key}-listing`, ...state[key] };
}
