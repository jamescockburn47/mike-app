import * as AuthSession from 'expo-auth-session';

const startAsync = (AuthSession as any).startAsync as
  | ((options: { authUrl: string }) => Promise<AuthSession.AuthSessionResult>)
  | undefined;

const SPOTIFY_CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID || '';

function ensureStartAsync() {
  if (!startAsync) {
    throw new Error('OAuth flow is not available in this runtime');
  }
  return startAsync;
}

export async function signInWithSpotify() {
  if (!SPOTIFY_CLIENT_ID) {
    throw new Error('Missing Spotify client id. Set EXPO_PUBLIC_SPOTIFY_CLIENT_ID.');
  }
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'morning' });
  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'token',
    redirect_uri: redirectUri,
    scope: 'user-read-playback-state user-read-recently-played playlist-read-private',
    show_dialog: 'true',
  });
  const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
  const res = await ensureStartAsync()({ authUrl });
  if (res.type === 'success' && res.params?.access_token) {
    return { accessToken: res.params.access_token as string };
  }
  throw new Error('Spotify sign-in cancelled or failed');
}
