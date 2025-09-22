import { useEffect, useRef, useState } from 'react';
import { useSessionStore } from '../state/useSessionStore';
import { repeatCurrent } from '../audio/sessionOrchestrator';

export function triggerSkip() {
  useSessionStore.getState().requestSkip();
}

export function useVoiceCommands(enabled: boolean) {
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Web-only: window.SpeechRecognition
    const w: any = typeof window !== 'undefined' ? window : undefined;
    const SpeechRecognition = w?.SpeechRecognition || w?.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }
    setSupported(true);
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event: any) => {
      const transcript: string = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join(' ')
        .toLowerCase();
      if (transcript.includes('skip') || transcript.includes('next')) {
        triggerSkip();
      }
      if (transcript.includes('repeat') || transcript.includes('again')) {
        repeatCurrent();
      }
    };

    recognitionRef.current.onerror = () => {};

    return () => {
      try {
        recognitionRef.current?.stop?.();
      } catch {}
    };
  }, []);

  useEffect(() => {
    const rec = recognitionRef.current;
    if (!supported || !rec) return;
    if (enabled) {
      try { rec.start(); } catch {}
    } else {
      try { rec.stop(); } catch {}
    }
  }, [enabled, supported]);

  return { supported };
}


