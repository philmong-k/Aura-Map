import { useState, useEffect, useCallback } from 'react';

export type BreathingPhase = 'ready' | 'inhale' | 'hold' | 'exhale';

export function useBreathingCycle() {
  const [phase, setPhase] = useState<BreathingPhase>('ready');
  const [isStarted, setIsStarted] = useState(false);
  const [scale, setScale] = useState(1);

  const start = useCallback(() => {
    setIsStarted(true);
    setPhase('inhale');
  }, []);

  const stop = useCallback(() => {
    setIsStarted(false);
    setPhase('ready');
    setScale(1);
  }, []);

  useEffect(() => {
    if (!isStarted) return;

    let timer: any;
    const durations = {
      inhale: 4000,
      hold: 2000,
      exhale: 4000,
    };

    const runCycle = () => {
      if (phase === 'inhale') {
        setScale(1.8);
        timer = setTimeout(() => setPhase('hold'), durations.inhale);
      } else if (phase === 'hold') {
        timer = setTimeout(() => setPhase('exhale'), durations.hold);
      } else if (phase === 'exhale') {
        setScale(1);
        timer = setTimeout(() => setPhase('inhale'), durations.exhale);
      }
    };

    runCycle();

    return () => clearTimeout(timer);
  }, [isStarted, phase]);

  return { phase, scale, isStarted, start, stop };
}
