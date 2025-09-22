import { request } from 'undici';

async function fetchJson(url: string, options: any) {
  const { body } = await request(url, options);
  const text = await body.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const calendarService = {
  async fetchGoogleAgenda(accessToken: string) {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    const params = new URLSearchParams({
      timeMin: now.toISOString(),
      timeMax: end.toISOString(),
      maxResults: '50',
      singleEvents: 'true',
      orderBy: 'startTime',
    });
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`;
    const data = await fetchJson(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return { provider: 'google', data };
  },

  async fetchMicrosoftAgenda(accessToken: string) {
    const start = new Date();
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    const params = new URLSearchParams({
      startDateTime: start.toISOString(),
      endDateTime: end.toISOString(),
    });
    const url = `https://graph.microsoft.com/v1.0/me/calendarView?${params.toString()}`;
    const data = await fetchJson(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return { provider: 'microsoft', data };
  },
};


