function resolveApiBase() {
  const envBase = process.env.EXPO_PUBLIC_API_BASE;
  if (envBase) return envBase;
  // Android emulator cannot hit localhost of host machine
  // 10.0.2.2 is Android emulator loopback to host
  // 127.0.0.1 for web/ios simulator
  // Default to 127.0.0.1; devs can override via EXPO_PUBLIC_API_BASE
  if (typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)) {
    return 'http://10.0.2.2:3000';
  }
  return 'http://127.0.0.1:3000';
}

const API_BASE = resolveApiBase();

export async function getHeadlines(topics: string[]) {
  const url = `${API_BASE}/news/headlines?topics=${encodeURIComponent(topics.join(','))}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch headlines');
  return res.json();
}

export async function getAgendaGoogle(accessToken: string) {
  const res = await fetch(`${API_BASE}/calendar/google/agenda`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken }),
  });
  if (!res.ok) throw new Error('Failed to fetch google agenda');
  return res.json();
}

export async function getAgendaMicrosoft(accessToken: string) {
  const res = await fetch(`${API_BASE}/calendar/microsoft/agenda`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken }),
  });
  if (!res.ok) throw new Error('Failed to fetch microsoft agenda');
  return res.json();
}


