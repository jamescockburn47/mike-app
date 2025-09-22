import { buildSampleAgenda } from '../content/sampleAgenda';
import { getAgendaGoogle, getAgendaMicrosoft } from './api';

export type AgendaItemType = 'focus' | 'meeting' | 'personal';

export type AgendaItem = {
  id: string;
  title: string;
  startISO: string;
  endISO: string;
  location?: string;
  type: AgendaItemType;
};

export type AgendaResponse = {
  source: 'placeholder' | 'google' | 'microsoft';
  items: AgendaItem[];
  error?: string;
};

export async function loadAgenda(options: { provider: 'google' | 'microsoft'; accessToken?: string }): Promise<AgendaResponse> {
  const fallback = buildSampleAgenda();
  if (!options.accessToken) {
    return { source: 'placeholder', items: fallback };
  }

  try {
    const raw = options.provider === 'google'
      ? await getAgendaGoogle(options.accessToken)
      : await getAgendaMicrosoft(options.accessToken);
    const mapped = mapAgenda(raw);
    if (!mapped.length) {
      return { source: options.provider, items: fallback, error: 'empty' };
    }
    return { source: options.provider, items: mapped };
  } catch (error) {
    return {
      source: 'placeholder',
      items: fallback,
      error: error instanceof Error ? error.message : 'unknown',
    };
  }
}

function mapAgenda(raw: any): AgendaItem[] {
  const collection = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.items)
    ? raw.items
    : Array.isArray(raw?.events)
    ? raw.events
    : [];

  return collection
    .map((item: any, index: number) => {
      const start = extractDate(item?.start);
      const end = extractDate(item?.end);
      if (!start || !end) return null;
      const title = item?.summary || item?.title || 'Scheduled block';
      const location = item?.location || item?.conferenceData?.entryPoints?.[0]?.uri;
      const type: AgendaItemType = resolveType(item);
      return {
        id: String(item?.id || `event-${index}`),
        title,
        startISO: start,
        endISO: end,
        location: location || undefined,
        type,
      };
    })
    .filter(Boolean) as AgendaItem[];
}

function extractDate(input: any): string | null {
  if (!input) return null;
  const value = input?.dateTime || input?.date || input?.startTime || input?.iso || input;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function resolveType(item: any): AgendaItemType {
  const summary = (item?.summary || item?.title || '').toLowerCase();
  if (summary.includes('focus') || summary.includes('deep')) return 'focus';
  if (summary.includes('walk') || summary.includes('break') || summary.includes('reset')) return 'personal';
  return 'meeting';
}
