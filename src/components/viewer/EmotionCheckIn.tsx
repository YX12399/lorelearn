'use client';

import { useState } from 'react';
import { ZoneOfRegulation } from '@/types';

interface Emotion {
  name: string;
  zone: ZoneOfRegulation;
  emoji: string;
  color: string;
  textColor: string;
  borderColor: string;
}

const EMOTIONS: Emotion[] = [
  { name: 'Happy', zone: 'green', emoji: '😊', color: 'bg-green-100', textColor: 'text-green-800', borderColor: 'border-green-400' },
  { name: 'Calm', zone: 'green', emoji: '😌', color: 'bg-green-100', textColor: 'text-green-800', borderColor: 'border-green-400' },
  { name: 'Excited', zone: 'yellow', emoji: '🤩', color: 'bg-yellow-100', textColor: 'text-yellow-800', borderColor: 'border-yellow-400' },
  { name: 'Worried', zone: 'yellow', emoji: '😟', color: 'bg-yellow-100', textColor: 'text-yellow-800', borderColor: 'border-yellow-400' },
  { name: 'Frustrated', zone: 'yellow', emoji: '😤', color: 'bg-yellow-100', textColor: 'text-yellow-800', borderColor: 'border-yellow-400' },
  { name: 'Sad', zone: 'blue', emoji: '😢', color: 'bg-blue-100', textColor: 'text-blue-800', borderColor: 'border-blue-400' },
  { name: 'Tired', zone: 'blue', emoji: '😴', color: 'bg-blue-100', textColor: 'text-blue-800', borderColor: 'border-blue-400' },
  { name: 'Angry', zone: 'red', emoji: '😠', color: 'bg-red-100', textColor: 'text-red-800', borderColor: 'border-red-400' },
  { name: 'Scared', zone: 'red', emoji: '😨', color: 'bg-red-100', textColor: 'text-red-800', borderColor: 'border-red-400' },
];

const ZONE_LABELS: Record<ZoneOfRegulation, string> = {
  green: 'Green Zone',
  yellow: 'Yellow Zone',
  blue: 'Blue Zone',
  red: 'Red Zone',
};

const ZONE_COLORS: Record<ZoneOfRegulation, string> = {
  green: 'bg-green-400',
  yellow: 'bg-yellow-400',
  blue: 'bg-blue-400',
  red: 'bg-red-400',
};

const ZONE_RESPONSES: Record<ZoneOfRegulation, string> = {
  green: "That's wonderful! You're in the Green Zone — what a great feeling!",
  yellow: "Thank you for telling me. Yellow Zone feelings are normal — let's keep watching!",
  blue: "I hear you. Blue Zone feelings are okay. Let's take it slow together.",
  red: "That sounds really big. It's okay to feel that way. Want to try a breathing exercise?",
};

interface EmotionCheckInProps {
  characterName: string;
  prompt?: string;
  onAnswer?: (emotion: string, zone: ZoneOfRegulation) => void;
  onContinue?: () => void;
}

export default function EmotionCheckIn({
  characterName,
  prompt,
  onAnswer,
  onContinue,
}: EmotionCheckInProps) {
  const [selected, setSelected] = useState<Emotion | null>(null);
  const [answered, setAnswered] = useState(false);

  const handleSelect = (emotion: Emotion) => {
    setSelected(emotion);
    setAnswered(true);
    onAnswer?.(emotion.name, emotion.zone);
  };

  return (
    <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl">
      {/* Prompt */}
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">🤔</div>
        <h2 className="text-xl font-bold text-purple-700 mb-2">
          {prompt ?? `How do you think ${characterName} is feeling right now?`}
        </h2>
        <p className="text-gray-500 text-sm">Tap the face that matches!</p>
      </div>

      {!answered ? (
        /* Emotion grid */
        <div className="grid grid-cols-3 gap-3">
          {EMOTIONS.map((emotion) => (
            <button
              key={emotion.name}
              onClick={() => handleSelect(emotion)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 border-transparent hover:border-purple-300 hover:${emotion.color} transition-all`}
            >
              <span className="text-3xl">{emotion.emoji}</span>
              <span className="text-xs font-semibold text-gray-700">{emotion.name}</span>
            </button>
          ))}
        </div>
      ) : selected ? (
        /* Response */
        <div className="text-center">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 ${selected.color} ${selected.borderColor} mb-5`}
          >
            <span className="text-2xl">{selected.emoji}</span>
            <span className={`font-bold ${selected.textColor}`}>{selected.name}</span>
            <div className={`w-3 h-3 ${ZONE_COLORS[selected.zone]} rounded-full ml-1`} />
            <span className={`text-xs font-medium ${selected.textColor}`}>
              {ZONE_LABELS[selected.zone]}
            </span>
          </div>

          <p className="text-gray-700 font-medium mb-6">{ZONE_RESPONSES[selected.zone]}</p>

          <button
            onClick={onContinue}
            className="w-full py-4 px-8 bg-purple-500 text-white text-lg font-bold rounded-2xl hover:bg-purple-600 transition-colors"
          >
            Continue Watching ▶
          </button>
        </div>
      ) : null}
    </div>
  );
}
