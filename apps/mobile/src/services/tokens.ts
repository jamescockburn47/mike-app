const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'http://localhost:3000';

export type Provider = 'google' | 'microsoft' | 'spotify';

export async function saveToken(params: { provider: Provider; userId: string; accessToken: string; refreshToken?: string }) {
  const res = await fetch(`${API_BASE}/tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Failed to save token');
  return res.json();
}
