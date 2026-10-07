import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { SavedSearch as SavedSearchRow, SavedSearchType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * Saved searches over the people directory, with alerts.
 *
 * `/discover` saves its current filters here and `/saved-searches` lists,
 * renames, re-runs and alerts on them. Until this module the web client
 * called five routes the API never had, so the feature worked only in the
 * preview demo. An alert names only profiles the owner has not been shown:
 * every run, by hand or by the scheduler, records what it returned.
 */

export const ALERT_FREQUENCIES = ['instant', 'daily', 'weekly'] as const;
export type AlertFrequency = (typeof ALERT_FREQUENCIES)[number];
const FILTER_KEYS = ['roles', 'skills', 'industries', 'locations', 'stage'] as const;
type FilterKey = (typeof FILTER_KEYS)[number];
export type SavedSearchFilters = Partial<Record<FilterKey, string[]>>;

export const SAVED_SEARCH_LIMITS = { perUser: 50, name: 80, query: 200, filterItems: 20, filterItem: 60, seenIds: 500, runResults: 50 } as const;

/** How long after the last alert each frequency may alert again. `instant` is the scheduler's own hourly pass. */
const ALERT_INTERVAL_MS: Record<AlertFrequency, number> = {
  instant: 55 * 60 * 1000,
  daily: 23 * 60 * 60 * 1000,
  weekly: 6.9 * 24 * 60 * 60 * 1000,
};

export interface SavedSearchInput {
  name: string;
  query: string;
  filters: SavedSearchFilters;
  alertsEnabled: boolean;
  alertFrequency: AlertFrequency;
}

function cleanList(value: unknown, key: string): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) throw new BadRequestException(`filters.${key} must be a list`);
  const items = value
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.trim())
    .filter(Boolean);
  if (items.length > SAVED_SEARCH_LIMITS.filterItems) throw new BadRequestException(`filters.${key} takes at most ${SAVED_SEARCH_LIMITS.filterItems} values`);
  if (items.some((v) => v.length > SAVED_SEARCH_LIMITS.filterItem)) throw new BadRequestException(`filters.${key} values are at most ${SAVED_SEARCH_LIMITS.filterItem} characters`);
  return items.length ? [...new Set(items)] : undefined;
}

function readFrequency(value: unknown): AlertFrequency | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string' && (ALERT_FREQUENCIES as readonly string[]).includes(value)) return value as AlertFrequency;
  throw new BadRequestException(`alertFrequency must be one of ${ALERT_FREQUENCIES.join(', ')}`);
}

function readName(value: unknown): string {
  const name = typeof value === 'string' ? value.trim() : '';
  if (!name) throw new BadRequestException('A saved search needs a name');
  if (name.length > SAVED_SEARCH_LIMITS.name) throw new BadRequestException(`The name is at most ${SAVED_SEARCH_LIMITS.name} characters`);
  return name;
}

/** Validates a create body; unknown filter keys are dropped, never stored. */
export function readSavedSearchInput(body: unknown): SavedSearchInput {
  const b = (body ?? {}) as Record<string, unknown>;
  const query = typeof b.query === 'string' ? b.query.trim() : '';
  if (query.length > SAVED_SEARCH_LIMITS.query) throw new BadRequestException(`The query is at most ${SAVED_SEARCH_LIMITS.query} characters`);
  const rawFilters = (b.filters && typeof b.filters === 'object' ? b.filters : {}) as Record<string, unknown>;
  const filters: SavedSearchFilters = {};
  for (const key of FILTER_KEYS) {
    const list = cleanList(rawFilters[key], key);
    if (list) filters[key] = list;
  }
  return {
    name: readName(b.name),
    query,
    filters,
    alertsEnabled: b.alertsEnabled === true,
    alertFrequency: readFrequency(b.alertFrequency) ?? 'daily',
  };
}

/** The directory a search looks through, from its role filter. */
export function searchTypeFor(filters: SavedSearchFilters): SavedSearchType {
  const roles = filters.roles ?? [];
  if (roles.length === 1 && roles[0] === 'mentor') return 'mentor';
  if (roles.length > 0 && roles.every((r) => r === 'investor' || r === 'angel_investor')) return 'investor';
  return 'cofounder';
}

export function alertIsDue(row: Pick<SavedSearchRow, 'alertEnabled' | 'alertFrequency' | 'lastAlertAt'>, now: number): boolean {
  if (!row.alertEnabled) return false;
  if (!row.lastAlertAt) return true;
  const frequency = (ALERT_FREQUENCIES as readonly string[]).includes(row.alertFrequency ?? '') ? (row.alertFrequency as AlertFrequency) : 'daily';
  return now - row.lastAlertAt.getTime() >= ALERT_INTERVAL_MS[frequency];
}

/** Profiles in this run that the owner has not been shown and that are not the owner. */
export function newResultIds(hits: Array<{ userId?: string | null }>, seen: readonly string[], ownerId: string): string[] {
  const known = new Set(seen);
  return [...new Set(hits.map((h) => h.userId).filter((id): id is string => !!id && id !== ownerId && !known.has(id)))];
}

/** Keeps the newest ids first and bounds the list, so a long-lived search stays small. */
export function mergeSeen(previous: readonly string[], fresh: readonly string[]): string[] {
  return [...new Set([...fresh, ...previous])].slice(0, SAVED_SEARCH_LIMITS.seenIds);
}

export function toClientSavedSearch(row: SavedSearchRow) {
  const filters = (row.filters && typeof row.filters === 'object' ? row.filters : {}) as SavedSearchFilters;
  return {
    id: row.id,
    name: row.name,
    query: row.query ?? '',
    filters,
    alertsEnabled: row.alertEnabled,
    alertFrequency: ((ALERT_FREQUENCIES as readonly string[]).includes(row.alertFrequency ?? '') ? row.alertFrequency : 'daily') as AlertFrequency,
    lastRun: row.lastUsedAt?.toISOString(),
    resultCount: row.lastResultCount ?? undefined,
    newResults: row.pendingNewCount > 0 ? row.pendingNewCount : undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Injectable()
export class SavedSearchesService {
  private readonly logger = new Logger(SavedSearchesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly search: SearchService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(userId: string) {
    const rows = await this.prisma.savedSearch.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } });
    return { searches: rows.map(toClientSavedSearch) };
  }

  async create(userId: string, body: unknown) {
    const input = readSavedSearchInput(body);
    const count = await this.prisma.savedSearch.count({ where: { userId } });
    if (count >= SAVED_SEARCH_LIMITS.perUser) throw new BadRequestException(`You can keep up to ${SAVED_SEARCH_LIMITS.perUser} saved searches`);
    const row = await this.prisma.savedSearch.create({
      data: {
        userId,
        name: input.name,
        searchType: searchTypeFor(input.filters),
        query: input.query || null,
        filters: input.filters,
        alertEnabled: input.alertsEnabled,
        alertFrequency: input.alertFrequency,
        // The owner saw the current results on /discover; alerts start from here.
        lastAlertAt: input.alertsEnabled ? new Date() : null,
      },
    });
    // Record what the search returns now, so the first alert names only newcomers.
    await this.runRow(row, { mode: 'baseline' }).catch((err) => this.logger.warn(`Initial run of saved search ${row.id} failed: ${String(err)}`));
    const fresh = await this.prisma.savedSearch.findUnique({ where: { id: row.id } });
    return { search: toClientSavedSearch(fresh ?? row) };
  }

  async update(userId: string, id: string, body: unknown) {
    const row = await this.owned(userId, id);
    const b = (body ?? {}) as Record<string, unknown>;
    const data: { name?: string; alertEnabled?: boolean; alertFrequency?: AlertFrequency; lastAlertAt?: Date } = {};
    if (b.name !== undefined) data.name = readName(b.name);
    if (b.alertsEnabled !== undefined) {
      if (typeof b.alertsEnabled !== 'boolean') throw new BadRequestException('alertsEnabled must be true or false');
      data.alertEnabled = b.alertsEnabled;
      // Turning alerts on starts the clock now rather than alerting at once.
      if (b.alertsEnabled && !row.alertEnabled) data.lastAlertAt = new Date();
    }
    const frequency = readFrequency(b.alertFrequency);
    if (frequency) data.alertFrequency = frequency;
    const updated = await this.prisma.savedSearch.update({ where: { id: row.id }, data });
    return { search: toClientSavedSearch(updated) };
  }

  async remove(userId: string, id: string) {
    const row = await this.owned(userId, id);
    await this.prisma.savedSearch.delete({ where: { id: row.id } });
    return { ok: true };
  }

  async run(userId: string, id: string) {
    const row = await this.owned(userId, id);
    const { hits, total } = await this.runRow(row, { mode: 'manual' });
    return { results: hits, count: total };
  }

  /** One scheduler pass: every due search with alerts on, one notification per search that found someone new. */
  async runDueAlerts(now = Date.now()): Promise<{ checked: number; notified: number }> {
    const rows = await this.prisma.savedSearch.findMany({ where: { alertEnabled: true }, take: 500, orderBy: { lastAlertAt: 'asc' } });
    let checked = 0;
    let notified = 0;
    for (const row of rows) {
      if (!alertIsDue(row, now)) continue;
      checked += 1;
      try {
        const { fresh } = await this.runRow(row, { mode: 'alert', at: new Date(now) });
        if (fresh.length === 0) continue;
        notified += 1;
        await this.notifications.createNotification({
          userId: row.userId,
          type: 'match_suggestion',
          title: fresh.length === 1 ? `1 new profile for “${row.name}”` : `${fresh.length} new profiles for “${row.name}”`,
          body: 'Your saved search found people you have not seen yet.',
          link: '/saved-searches',
          meta: { savedSearchId: row.id, userIds: fresh.slice(0, 20) },
        });
      } catch (err) {
        this.logger.warn(`Saved search alert ${row.id} failed: ${String(err)}`);
      }
    }
    return { checked, notified };
  }

  private async owned(userId: string, id: string): Promise<SavedSearchRow> {
    const row = await this.prisma.savedSearch.findUnique({ where: { id } });
    // Someone else's search answers exactly like a missing one.
    if (!row || row.userId !== userId) throw new NotFoundException('Saved search not found');
    return row;
  }

  /**
   * Runs a search and records it. Every mode marks the returned people as
   * seen; `manual` also counts a use, `alert` stamps the alert clock, and
   * `baseline` (right after saving) records nothing else.
   */
  private async runRow(row: SavedSearchRow, options: { mode: 'manual' | 'alert' | 'baseline'; at?: Date }) {
    const filters = toClientSavedSearch(row).filters;
    const result = (await this.search.searchProfiles({
      q: row.query || undefined,
      roles: filters.roles,
      skills: filters.skills,
      industries: filters.industries,
      stage: filters.stage,
      location: filters.locations?.[0],
      sortBy: 'recent',
      limit: SAVED_SEARCH_LIMITS.runResults,
    })) as { hits?: Array<{ userId?: string | null }>; total?: number };
    const hits = (result?.hits ?? []).filter((h) => h?.userId !== row.userId);
    const total = typeof result?.total === 'number' ? result.total : hits.length;
    const fresh = newResultIds(hits, row.seenResultIds ?? [], row.userId);
    await this.prisma.savedSearch.update({
      where: { id: row.id },
      data: {
        lastResultCount: total,
        seenResultIds: mergeSeen(row.seenResultIds ?? [], fresh),
        // Running the search is looking at it: the "new" badge clears.
        ...(options.mode === 'manual' ? { useCount: { increment: 1 }, lastUsedAt: new Date(), pendingNewCount: 0 } : {}),
        ...(options.mode === 'alert' ? { lastAlertAt: options.at ?? new Date(), pendingNewCount: { increment: fresh.length } } : {}),
      },
    });
    return { hits, total, fresh };
  }
}
