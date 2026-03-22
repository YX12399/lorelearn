'use client';

import { useState } from 'react';

interface Choice {
  id: string;
  text: string;
  emoji?: string;
  isCorrect?: boolean;
  feedback: string;
}

interface ChoicePointProps {
  characterName: string;
  prompt: string;
  choices: Choice[];
  encouragement: string;
  onChoose?: (choiceId: string, isCorrect: boolean) => void;
  onContinue?: () => void;
}

export default function ChoicePoint({
  characterName,
  prompt,
  choices,
  encouragement,
  onChoose,
  onContinue,
}: ChoicePointProps) {
  const [selected, setSelected] = useState<Choice | null>(null);

  const handleChoose = (choice: Choice) => {
    if (selected) return;
    setSelected(choice);
    onChoose?.(choice.id, choice.isCorrect ?? false);
  };

  return (
    <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">🌟</div>
        <h2 className="text-xl font-bold text-blue-700 mb-1">
          What should {characterName} do?
        </h2>
        <p className="text-gray-600 text-sm leading-relaxed">{prompt}</p>
      </div>

      {/* Choices */}
      <div className="space-y-3 mb-6">
        {choices.map((choice) => {
          const isSelected = selected?.id === choice.id;
          const showResult = !!selected;
          const isCorrect = choice.isCorrect ?? false;

          let btnClass =
            'w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ';
          if (showResult) {
            if (isCorrect) {
              btnClass += 'bg-green-50 border-green-400 text-green-800';
            } else if (isSelected && !isCorrect) {
              btnClass += 'bg-red-50 border-red-300 text-red-700';
            } else {
              btnClass += 'bg-gray-50 border-gray-200 text-gray-400';
            }
          } else {
            btnClass +=
              'bg-blue-50 border-blue-200 text-blue-800 hover:border-blue-400 hover:bg-blue-100 cursor-pointer';
          }

          return (
            <button
              key={choice.id}
              className={btnClass}
              onClick={() => handleChoose(choice)}
              disabled={!!selected}
            >
              {choice.emoji && <span className="text-2xl flex-shrink-0">{choice.emoji}</span>}
              <span className="font-semibold flex-1">{choice.text}</span>
              {showResult && isCorrect && (
                <span className="text-green-600 font-bold flex-shrink-0">✓</span>
              )}
              {showResult && isSelected && !isCorrect && (
                <span className="text-red-500 font-bold flex-shrink-0">✗</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {selected && (
        <div className="mb-5">
          <div
            className={`p-4 rounded-2xl mb-3 ${
              selected.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'
            }`}
          >
            <p
              className={`font-medium text-sm ${
                selected.isCorrect ? 'text-green-800' : 'text-blue-800'
              }`}
            >
              {selected.feedback}
            </p>
          </div>
          <p className="text-center text-gray-600 font-medium">{encouragement}</p>
        </div>
      )}

      {/* Continue button */}
      {selected && (
        <button
          onClick={onContinue}
          className="w-full py-4 px-8 bg-blue-500 text-white text-lg font-bold rounded-2xl hover:bg-blue-600 transition-colors"
        >
          Keep Watching ▶
        </button>
      )}
    </div>
  );
}
