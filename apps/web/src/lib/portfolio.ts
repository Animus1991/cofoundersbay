import { apiRequest } from '@/lib/api';

/** What a member shows on their profile (docs §111). */

export const PORTFOLIO_TYPES = [
  { value: 'project', en: 'Project', el: 'Έργο' },
  { value: 'case_study', en: 'Case study', el: 'Μελέτη περίπτωσης' },
  { value: 'publication', en: 'Publication', el: 'Δημοσίευση' },
  { value: 'press', en: 'Press', el: 'Δημοσίευμα Τύπου' },
  { value: 'award', en: 'Award', el: 'Βραβείο' },
  { value: 'certification', en: 'Certification', el: 'Πιστοποίηση' },
  { value: 'patent', en: 'Patent', el: 'Δίπλωμα ευρεσιτεχνίας' },
  { value: 'open_source', en: 'Open source', el: 'Ανοιχτός κώδικας' },
  { value: 'other', en: 'Other', el: 'Άλλο' },
] as const;

export type PortfolioType = (typeof PORTFOLIO_TYPES)[number]['value'];

export type PortfolioItem = {
  id: string;
  type: PortfolioType;
  title: string;
  description: string | null;
  url: string | null;
  createdAt: string;
};

export type PortfolioInput = { type: PortfolioType; title: string; description: string | null; url: string | null };

export function getMyPortfolio(): Promise<{ items: PortfolioItem[] }> {
  return apiRequest('/api/me/portfolio');
}

export function getMemberPortfolio(userId: string): Promise<{ items: PortfolioItem[] }> {
  return apiRequest(`/api/profiles/${userId}/portfolio`);
}

export function addPortfolioItem(body: PortfolioInput): Promise<{ items: PortfolioItem[] }> {
  return apiRequest('/api/me/portfolio', { method: 'POST', body: JSON.stringify(body) });
}

export function updatePortfolioItem(id: string, body: PortfolioInput): Promise<{ items: PortfolioItem[] }> {
  return apiRequest(`/api/me/portfolio/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export function removePortfolioItem(id: string): Promise<{ items: PortfolioItem[] }> {
  return apiRequest(`/api/me/portfolio/${id}`, { method: 'DELETE' });
}
