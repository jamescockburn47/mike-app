import * as AuthSession from 'expo-auth-session';

const startAsync = (AuthSession as any).startAsync as
  | ((options: { authUrl: string }) => Promise<AuthSession.AuthSessionResult>)
  | undefined;

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
const MS_CLIENT_ID = process.env.EXPO_PUBLIC_MS_CLIENT_ID || '';

function ensureStartAsync() {
  if (!startAsync) {
    throw new Error('OAuth flow is not available in this runtime');
  }
  return startAsync;
}

export async function signInWithGoogle() {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'morning' });
  const authUrl =
    'https://accounts.google.com/o/oauth2/v2/auth' +
    `?client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=token` +
    `&scope=${encodeURIComponent('https://www.googleapis.com/auth/calendar.readonly email profile')}`;
  const res = await ensureStartAsync()({ authUrl });
  if (res.type === 'success' && res.params?.access_token) {
    return { accessToken: res.params.access_token as string };
  }
  throw new Error('Google sign-in cancelled or failed');
}

export async function signInWithMicrosoft() {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'morning' });
  const authUrl =
    'https://login.microsoftonline.com/common/oauth2/v2.0/authorize' +
    `?client_id=${encodeURIComponent(MS_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=token` +
    `&scope=${encodeURIComponent('https://graph.microsoft.com/Calendars.Read offline_access')}`;
  const res = await ensureStartAsync()({ authUrl });
  if (res.type === 'success' && res.params?.access_token) {
    return { accessToken: res.params.access_token as string };
  }
  throw new Error('Microsoft sign-in cancelled or failed');
}

