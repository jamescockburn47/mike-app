import { SessionSlot } from '../state/useSessionStore';

export type RitualPreset = {
  id: string;
  heroTitle: string;
  heroSubtitle: string;
  focus: string;
  highlight: string;
  energy: number; // 1-5 scale displayed to user
  vibe: { from: string; to: string };
  tags: string[];
  affirmation: string;
  anchors: string[];
  microWins: string[];
  bodyPrimers: string[];
  prompts: string[];
  closing: string;
};

export type RitualFlow = {
  preset: RitualPreset;
  slots: SessionSlot[];
};

const PRESETS: RitualPreset[] = [
  {
    id: 'launch-sequence',
    heroTitle: 'Signal: Launch Sequence',
    heroSubtitle: 'Tune into the signal. Prime your mind for decisive execution.',
    focus: 'Move one bold project forward before 10 AM.',
    highlight: 'Ship the investor summary with clarity and momentum.',
    energy: 4,
    vibe: { from: '#17c6f8', to: '#6366f1' },
    tags: ['Founder mode', 'Sharp focus', 'High signal'],
    affirmation: 'I author the tone of today; clarity and momentum follow my lead.',
    anchors: [
      'Inbox zero sweep by 08:45',
      'Ten-minute stand-up with core squad',
      'Hydration streak at four days - keep it alive',
    ],
    microWins: [
      'Draft a three-sentence investor update',
      'Send a gratitude ping to your product partner',
      'Block a 15-minute build jam for midday iteration',
    ],
    bodyPrimers: [
      'Two minutes of power breathing to wake the system',
      'Quick shoulder rolls to unlock posture',
      'Finish with a cold splash to anchor alertness',
    ],
    prompts: [
      'Where will one brave decision unlock leverage?',
      'Who deserves a quick nudge from you this morning?',
      'What does "done" look like by noon?',
    ],
    closing: 'Lock it in. Today you broadcast signal, not noise. Step forward.',
  },
  {
    id: 'creative-stretch',
    heroTitle: 'Creative Stretch Lab',
    heroSubtitle: 'Loosen the edges, invite pattern breaks, design a fresher move.',
    focus: 'Prototype a surprising angle in under 45 minutes.',
    highlight: 'Storyboards for the launch reel land before team sync.',
    energy: 3,
    vibe: { from: '#ec4899', to: '#8b5cf6' },
    tags: ['Design mind', 'Playful rigor', 'Curiosity'],
    affirmation: 'Originality is my baseline - every iteration sharpens the signal.',
    anchors: [
      'Sketchbook ready with one experimental frame',
      'Share moodboard draft on the #inspo thread',
      'Step away for a two-minute sensory reset at 10:30',
    ],
    microWins: [
      "Capture three metaphors that describe today's product vibe",
      'Record a 30-second voice memo narrating the customer journey',
      'Swap feedback with a teammate on one bold color choice',
    ],
    bodyPrimers: [
      'Neck release sequence to ease screen strain',
      'Figure-eight wrist flows to prep sketch muscles',
      'Slow diaphragmatic breathing - inhale for four, exhale for six',
    ],
    prompts: [
      'What would surprise and delight the calmest user?',
      'How can constraint become a playful rule today?',
      'Which storyline deserves a cinematic reveal?',
    ],
    closing: 'Creative pulse is alive. Ship the draft, share the spark, iterate in public.',
  },
  {
    id: 'calm-operator',
    heroTitle: 'Calm Operator Routine',
    heroSubtitle: 'Steady hands, long horizon. Execute without friction.',
    focus: 'Protect deep work and craft one clean delivery.',
    highlight: 'Finalize the client playbook with confident, measured pacing.',
    energy: 2,
    vibe: { from: '#38bdf8', to: '#0ea5e9' },
    tags: ['Systems', 'Deep work', 'Measured pace'],
    affirmation: 'I move with precision. My calm presence sets the rhythm for the room.',
    anchors: [
      'Calendar blocks protected - no chance meetings this morning',
      'Focus playlist locked, notifications muted',
      'Intentional break penciled for 11:45 to reset posture',
    ],
    microWins: [
      "Outline today's deliverable in five bullet anchors",
      'Flag one risk early and message the stakeholder now',
      'Organize reference tabs into one dashboard view',
    ],
    bodyPrimers: [
      'Five rounds of box breathing, count four-by-four',
      'Slow spinal rolls to unstick the back',
      'Ground feet, press evenly, feel the floor support you',
    ],
    prompts: [
      'What will make this handoff feel effortless for the recipient?',
      'Which detail deserves a double-check before noon?',
      'How will you protect the calm cadence if fire drills appear?',
    ],
    closing: 'Own the calm advantage. Execute clean, then celebrate the pocket of progress.',
  },
  {
    id: 'momentum-reset',
    heroTitle: 'Momentum Reset Sprint',
    heroSubtitle: 'Shake off the drag, reboot your edge, prime a fresh streak.',
    focus: 'Reclaim rhythm with one decisive, confidence-building win.',
    highlight: 'Close out the lingering task that has been siphoning energy.',
    energy: 5,
    vibe: { from: '#f97316', to: '#ef4444' },
    tags: ['Momentum', 'Bold move', 'Reset'],
    affirmation: 'Every reset is a launchpad - I convert hesitation into forward motion.',
    anchors: [
      'Phone parked out of reach for the first 90 minutes',
      'Text an accountability buddy with your target win',
      'Quick walk outside post-session to anchor the reset',
    ],
    microWins: [
      'Archive stale to-dos that no longer matter',
      'Fire off the email you have been delaying',
      'Tidy the workspace surface to clear visual noise',
    ],
    bodyPrimers: [
      'High-knee march for thirty seconds to spike energy',
      'Push-up ladder: three, five, seven, breathe steady',
      'Victory posture hold for twenty seconds to lock confidence',
    ],
    prompts: [
      'Which nagging task gets cleared first to reset momentum?',
      'Who can celebrate the win with you in four hours?',
      'What environment tweak keeps the flow unlocked?',
    ],
    closing: 'Surge forward. Momentum is yours to claim - lock the win, stack the streak.',
  },
];

export function getRitualFlow(date: Date = new Date()): RitualFlow {
  const index = rotateIndex(PRESETS.length, dateSeed(date));
  const preset = PRESETS[index] ?? PRESETS[0];
  return { preset, slots: buildSlots(preset) };
}

function buildSlots(preset: RitualPreset): SessionSlot[] {
  return [
    {
      id: `${preset.id}-ignite`,
      title: 'Ignition Brief',
      minSec: 30,
      maxSec: 45,
      script: `Welcome back. ${preset.heroSubtitle} Today's focus: ${preset.focus} Headline move: ${preset.highlight}.`,
    },
    {
      id: `${preset.id}-affirm`,
      title: 'Affirmation',
      minSec: 20,
      maxSec: 30,
      script: `Center for a beat and repeat: ${preset.affirmation}`,
    },
    {
      id: `${preset.id}-anchors`,
      title: 'Anchors',
      minSec: 35,
      maxSec: 50,
      script: `Key anchors for this morning are: ${preset.anchors.join(', ')}. Lock them in and let them protect your flow.`,
    },
    {
      id: `${preset.id}-micro`,
      title: 'Micro Wins',
      minSec: 35,
      maxSec: 55,
      script: `Stack quick momentum with these micro wins: ${preset.microWins.join(', ')}. Each one moves the needle forward.`,
    },
    {
      id: `${preset.id}-body`,
      title: 'Body Primers',
      minSec: 35,
      maxSec: 55,
      script: `Prime the body to match the mind. Run through: ${preset.bodyPrimers.join(', ')}. Feel the energy rise.`,
    },
    {
      id: `${preset.id}-prompts`,
      title: 'Reflection Sparks',
      minSec: 35,
      maxSec: 55,
      script: `Hold space for these prompts: ${preset.prompts.join(', ')}. Let them shape the story of today.`,
    },
    {
      id: `${preset.id}-close`,
      title: 'Close & Commit',
      minSec: 25,
      maxSec: 40,
      script: preset.closing,
    },
  ];
}

function rotateIndex(length: number, seed: number) {
  if (!length) return 0;
  const normalized = Math.abs(seed) % length;
  return normalized;
}

function dateSeed(date: Date) {
  return Number(`${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}`);
}










