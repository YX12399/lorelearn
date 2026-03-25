'use client';

import { useState } from 'react';

type Stage = 'input' | 'scripting' | 'generating' | 'done' | 'error';

interface VideoResult {
  videoUrl: string;
  narration: string;
  prompt: string;
}

export default function Home() {
  const [concept, setConcept] = useState('');
  const [duration, setDuration] = useState(8);
  const [style, setStyle] = useState('cinematic');
  const [aspectRatio, setAspectRatio] = useState('16:9');

  const [stage, setStage] = useState<Stage>('input');
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<VideoResult | null>(null);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!concept.trim()) return;

    setStage('scripting');
    setStatus('Writing video script with AI...');
    setError('');
    setResult(null);

    try {
      // Step 1: Generate script
      const scriptRes = await fetch('/api/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept, style, duration }),
      });

      if (!scriptRes.ok) {
        const e = await scriptRes.json();
        throw new Error(e.error || 'Script generation failed');
      }

      const script = await scriptRes.json();
      setStatus(`Script ready. Generating ${duration}s video with Veo 3...`);
      setStage('generating');

      // Step 2: Generate video
      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: script.videoPrompt,
          duration,
          aspectRatio,
        }),
      });

      if (!genRes.ok) {
        const e = await genRes.json();
        throw new Error(e.error || 'Video generation failed');
      }

      const data = await genRes.json();
      setResult({
        videoUrl: data.videoUrl,
        narration: script.narration,
        prompt: script.videoPrompt,
      });
      setStage('done');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStage('error');
    }
  };

  const reset = () => {
    setStage('input');
    setResult(null);
    setError('');
    setStatus('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--accent)' }}>
            LoreLearn
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
            Describe a concept. Get an AI-generated explainer video.
          </p>
        </div>

        {/* ── Input Form ── */}
        {(stage === 'input' || stage === 'error') && (
          <div className="space-y-5">
            {/* Concept */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>
                What concept should the video explain?
              </label>
              <textarea
                value={concept}
                onChange={e => setConcept(e.target.value)}
                placeholder="e.g. How photosynthesis converts sunlight into energy for plants"
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-base outline-none resize-none"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
                autoFocus
              />
            </div>

            {/* Constraints Row */}
            <div className="grid grid-cols-3 gap-3">
              {/* Duration */}
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-2)' }}>Duration</label>
                <select
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                >
                  <option value={6}>6 seconds</option>
                  <option value={8}>8 seconds</option>
                </select>
              </div>

              {/* Style */}
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-2)' }}>Style</label>
                <select
                  value={style}
                  onChange={e => setStyle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                >
                  <option value="cinematic">Cinematic</option>
                  <option value="animated illustration">Animated</option>
                  <option value="3D render">3D Render</option>
                  <option value="watercolor painting">Watercolor</option>
                  <option value="minimalist motion graphics">Motion Graphics</option>
                </select>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-2)' }}>Aspect Ratio</label>
                <select
                  value={aspectRatio}
                  onChange={e => setAspectRatio(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                >
                  <option value="16:9">16:9 (Landscape)</option>
                  <option value="9:16">9:16 (Portrait)</option>
                  <option value="1:1">1:1 (Square)</option>
                </select>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generate}
              disabled={!concept.trim()}
              className="w-full py-3 rounded-xl text-base font-semibold transition-colors cursor-pointer"
              style={{
                background: concept.trim() ? 'var(--accent)' : 'var(--surface-2)',
                color: concept.trim() ? '#fff' : 'var(--text-2)',
              }}
            >
              Generate Video
            </button>

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm" style={{ background: '#1a0000', border: '1px solid var(--error)', color: 'var(--error)' }}>
                {error}
              </div>
            )}

            {/* Examples */}
            <div>
              <p className="text-xs mb-2" style={{ color: 'var(--text-2)' }}>Try one:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'How gravity bends light around a black hole',
                  'How a neural network learns to recognize faces',
                  'The water cycle from ocean to raindrop',
                  'How DNA replicates inside a cell',
                ].map(ex => (
                  <button
                    key={ex}
                    onClick={() => setConcept(ex)}
                    className="px-3 py-1.5 rounded-lg text-xs transition-colors"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Loading States ── */}
        {(stage === 'scripting' || stage === 'generating') && (
          <div className="flex flex-col items-center py-20 text-center">
            {/* Spinner */}
            <div
              className="w-10 h-10 rounded-full border-2 spinner mb-6"
              style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }}
            />
            <p className="text-lg font-medium mb-1">{stage === 'scripting' ? 'Writing script...' : 'Generating video...'}</p>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>{status}</p>
            {stage === 'generating' && (
              <p className="text-xs mt-4 pulse" style={{ color: 'var(--text-2)' }}>
                Veo 3 typically takes 2-4 minutes. Hang tight.
              </p>
            )}
          </div>
        )}

        {/* ── Result ── */}
        {stage === 'done' && result && (
          <div className="space-y-5">
            {/* Video Player */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)' }}>
              <video
                src={result.videoUrl}
                controls
                autoPlay
                loop
                playsInline
                className="w-full"
                style={{ aspectRatio: aspectRatio === '9:16' ? '9/16' : aspectRatio === '1:1' ? '1/1' : '16/9' }}
              />
            </div>

            {/* Narration Script */}
            <div className="rounded-xl px-4 py-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-2)' }}>Narration Script</p>
              <p className="text-sm leading-relaxed">{result.narration}</p>
            </div>

            {/* Video Prompt (collapsed) */}
            <details className="rounded-xl px-4 py-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <summary className="text-xs font-medium cursor-pointer" style={{ color: 'var(--text-2)' }}>
                Video Prompt (click to expand)
              </summary>
              <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--text-2)' }}>{result.prompt}</p>
            </details>

            {/* Actions */}
            <div className="flex gap-3">
              <a
                href={result.videoUrl}
                download
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-center"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                Download Video
              </a>
              <button
                onClick={reset}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                Make Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
