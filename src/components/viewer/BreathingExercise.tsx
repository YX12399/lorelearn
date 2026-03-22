'use client';

import { useState, useEffect, useCallback } from 'react';

type Phase = 'inhale' | 'hold' | 'exhale' | 'rest';

interface BreathCycle {
  phase: Phase;
  duration: number; // seconds
  label: string;
  instruction: string;
}

const BREATH_CYCLES: BreathCycle[] = [
  { phase: 'inhale', duration: 4, label: 'Breathe In', instruction: 'Slowly breathe in through your nose...' },
  { phase: 'hold', duration: 2, label: 'Hold', instruction: 'Hold it gently...' },
  { phase: 'exhale', duration: 6, label: 'Breathe Out', instruction: 'Slowly breathe out through your mouth...' },
  { phase: 'rest', duration: 1, label: 'Rest', instruction: 'Rest for a moment...' },
];

const PHASE_COLORS: Record<Phase, { bg: string; bubble: string; text: string }> = {
  inhale: { bg: 'from-blue-100 to-blue-200', bubble: 'bg-blue-400', text: 'text-blue-800' },
  hold: { bg: 'from-purple-100 to-purple-200', bubble: 'bg-purple-400', text: 'text-purple-800' },
  exhale: { bg: 'from-green-100 to-green-200', bubble: 'bg-green-400', text: 'text-green-800' },
  rest: { bg: 'from-gray-50 to-blue-50', bubble: 'bg-blue-200', text: 'text-blue-600' },
};

interface BreathingExerciseProps {
  totalRounds?: number;
  onComplete?: () => void;
  onSkip?: () => void;
}

export default function BreathingExercise({
  totalRounds = 3,
  onComplete,
  onSkip,
}: BreathingExerciseProps) {
  const [round, setRound] = useState(1);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [countdown, setCountdown] = useState(BREATH_CYCLES[0].duration);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const currentPhase = BREATH_CYCLES[phaseIndex];
  const colors = PHASE_COLORS[currentPhase.phase];

  const advancePhase = useCallback(() => {
    const nextPhaseIndex = (phaseIndex + 1) % BREATH_CYCLES.length;
    if (nextPhaseIndex === 0) {
      // Completed a full cycle
      if (round >= totalRounds) {
        setIsDone(true);
        setIsRunning(false);
        return;
      }
      setRound((r) => r + 1);
    }
    setPhaseIndex(nextPhaseIndex);
    setCountdown(BREATH_CYCLES[nextPhaseIndex].duration);
  }, [phaseIndex, round, totalRounds]);

  useEffect(() => {
    if (!isRunning) return;

    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          advancePhase();
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [isRunning, advancePhase]);

  const bubbleSize =
    currentPhase.phase === 'inhale'
      ? 'scale-125'
      : currentPhase.phase === 'exhale'
      ? 'scale-75'
      : 'scale-100';

  if (isDone) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-6xl mb-4">🌟</div>
        <h2 className="text-2xl font-bold text-green-700 mb-2">Amazing job!</h2>
        <p className="text-gray-600 mb-6">You completed {totalRounds} breathing rounds. How do you feel now?</p>
        <button
          onClick={onComplete}
          className="px-8 py-4 bg-green-500 text-white text-lg font-bold rounded-2xl hover:bg-green-600 transition-colors"
        >
          I feel better! Continue ✨
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center p-8 bg-gradient-to-b ${colors.bg} rounded-3xl min-h-80`}>
      {/* Title */}
      <h2 className="text-xl font-bold text-gray-700 mb-2">Breathing Exercise</h2>
      <p className="text-sm text-gray-500 mb-6">
        Round {round} of {totalRounds}
      </p>

      {/* Breathing bubble */}
      <div className="relative flex items-center justify-center mb-8" style={{ width: 180, height: 180 }}>
        {/* Outer glow */}
        <div
          className={`absolute w-40 h-40 ${colors.bubble} opacity-20 rounded-full transition-transform duration-1000 ease-in-out ${
            isRunning ? bubbleSize : 'scale-100'
          }`}
          style={{ filter: 'blur(20px)' }}
        />
        {/* Main bubble */}
        <div
          className={`w-36 h-36 ${colors.bubble} rounded-full flex items-center justify-center transition-transform duration-1000 ease-in-out shadow-lg ${
            isRunning ? bubbleSize : 'scale-100'
          }`}
        >
          <span className={`text-4xl font-bold text-white`}>{isRunning ? countdown : '🫧'}</span>
        </div>
      </div>

      {/* Phase label */}
      <div className="text-center mb-6">
        <p className={`text-2xl font-bold ${colors.text} mb-1`}>{currentPhase.label}</p>
        <p className="text-gray-500 text-sm">{currentPhase.instruction}</p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 mb-8">
        {BREATH_CYCLES.map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i === phaseIndex && isRunning ? colors.bubble : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        {!isRunning ? (
          <button
            onClick={() => setIsRunning(true)}
            className="px-8 py-3 bg-blue-500 text-white font-bold rounded-2xl hover:bg-blue-600 transition-colors"
          >
            {phaseIndex === 0 && countdown === BREATH_CYCLES[0].duration ? "Let's Breathe 🌬️" : 'Resume'}
          </button>
        ) : (
          <button
            onClick={() => setIsRunning(false)}
            className="px-8 py-3 bg-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-300 transition-colors"
          >
            Pause
          </button>
        )}
        {onSkip && (
          <button
            onClick={onSkip}
            className="px-6 py-3 border border-gray-200 text-gray-500 font-medium rounded-2xl hover:border-gray-300 transition-colors"
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
}
