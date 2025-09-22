export type SampleTrack = {
  id: string;
  title: string;
  artist: string;
  mood: 'lift' | 'steady' | 'calm';
  duration: number;
};

export type SamplePlaylist = {
  id: string;
  title: string;
  description: string;
  vibe: string;
  tracks: SampleTrack[];
};

const sampleTracks: SampleTrack[] = [
  { id: '1', title: 'Signal Rise', artist: 'Analog Stories', mood: 'lift', duration: 148 },
  { id: '2', title: 'Blue Hour Momentum', artist: 'Southline', mood: 'steady', duration: 176 },
  { id: '3', title: 'Golden Parameters', artist: 'Pixel Echo', mood: 'lift', duration: 152 },
  { id: '4', title: 'Calibrate', artist: 'Night Loop', mood: 'steady', duration: 189 },
  { id: '5', title: 'Calm Operator', artist: 'Phase Field', mood: 'calm', duration: 205 },
];

export function getSamplePlaylist(): SamplePlaylist {
  return {
    id: 'mike-morning',
    title: 'Mike Morning Signal',
    description: 'A measured climb from soft focus into confident execution.',
    vibe: 'Warm synth pads, subtle percussion, minimal vocals',
    tracks: sampleTracks,
  };
}
