import { getSamplePlaylist, SamplePlaylist } from '../content/sampleSpotify';

export type SpotifyTrack = {
  id: string;
  title: string;
  artist: string;
  duration: number;
};

export type SpotifyBrief = {
  source: 'placeholder' | 'spotify';
  playlist: {
    id: string;
    title: string;
    description: string;
    vibe: string;
    tracks: SpotifyTrack[];
    externalUrl?: string;
  };
  error?: string;
};

export async function fetchSpotifyMorningMix(accessToken?: string): Promise<SpotifyBrief> {
  const fallback = toBrief(getSamplePlaylist(), 'placeholder');
  if (!accessToken) {
    return fallback;
  }

  try {
    const params = new URLSearchParams({
      limit: '6',
      market: 'US',
      seed_genres: 'focus,productive,ambient',
    });
    const response = await fetch(`https://api.spotify.com/v1/recommendations?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`);
    }
    const body = await response.json();
    const tracks = Array.isArray(body?.tracks) ? body.tracks : [];
    if (!tracks.length) {
      throw new Error('Spotify recommendation response was empty');
    }
    const playlist: SpotifyBrief['playlist'] = {
      id: 'spotify-recommendations',
      title: 'Morning Momentum',
      description: 'A Spotify-powered ramp into deep, confident flow.',
      vibe: 'Pulseless ambient into low tempo percussion',
      externalUrl: tracks?.[0]?.album?.external_urls?.spotify,
      tracks: tracks.map((track: any) => ({
        id: String(track?.id),
        title: String(track?.name || 'Untitled'),
        artist: String(track?.artists?.[0]?.name || 'Unknown artist'),
        duration: Number(track?.duration_ms ? Math.round(track.duration_ms / 1000) : 0),
      })),
    };
    return { source: 'spotify', playlist };
  } catch (error) {
    return {
      ...fallback,
      error: error instanceof Error ? error.message : 'unknown',
    };
  }
}

function toBrief(playlist: SamplePlaylist, source: 'placeholder' | 'spotify'): SpotifyBrief {
  return {
    source,
    playlist: {
      id: playlist.id,
      title: playlist.title,
      description: playlist.description,
      vibe: playlist.vibe,
      tracks: playlist.tracks.map((track) => ({
        id: track.id,
        title: track.title,
        artist: track.artist,
        duration: track.duration,
      })),
    },
  };
}
