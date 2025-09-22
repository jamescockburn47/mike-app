import * as Speech from 'expo-speech';
import { useSessionStore, SessionSlot } from '../state/useSessionStore';

type RunOptions = {
  onSlotStart?: (slot: SessionSlot) => void;
  onSlotEnd?: (slot: SessionSlot) => void;
};

export async function runMorningSession(options: RunOptions = {}) {
  const store = useSessionStore.getState();
  if (store.status !== 'running') return;

  for (let i = store.currentIndex; i < store.slots.length; i++) {
    const current = useSessionStore.getState();
    if (current.status !== 'running') break;

    const slot = current.slots[i];
    options.onSlotStart?.(slot);

    const initialSkip = current.skipCounter;
    await speakWithSkip(slot.script, () => {
      const now = useSessionStore.getState();
      return now.skipCounter !== initialSkip;
    });

    options.onSlotEnd?.(slot);
    useSessionStore.getState().next();
  }

  useSessionStore.getState().markCompleted();
}

async function speakWithSkip(text: string, checkSkip: () => boolean): Promise<void> {
  return new Promise((resolve) => {
    let finished = false;
    const onDone = () => {
      if (finished) return;
      finished = true;
      resolve();
    };

    Speech.speak(text, {
      onDone,
      onStopped: onDone,
      onError: onDone,
    });

    const interval = setInterval(() => {
      if (checkSkip()) {
        Speech.stop();
        clearInterval(interval);
        onDone();
      }
    }, 250);
  });
}

export function repeatCurrent() {
  const { slots, currentIndex, status } = useSessionStore.getState();
  if (status !== 'running') return;
  const index = Math.min(currentIndex, slots.length - 1);
  if (index < 0) return;
  const script = slots[index]?.script;
  if (script) {
    Speech.stop();
    Speech.speak(script);
  }
}


