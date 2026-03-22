export async function generateVoiceNarration(
  text: string,
  voiceTone: 'calm' | 'warm' | 'energetic' = 'warm'
): Promise<{ audioUrl: string; duration: number }> {
  const VOICE_IDS: Record<string, string> = {
    calm: 'pNInz6obpgDQGcFmaJgB', // Adam - calm
    warm: 'EXAVITQu4vr4xnSDxMaL',  // Bella - warm
    energetic: 'VR6AewLTigWG4xSOukaG', // Arnold - energetic
  };

  const voiceId = VOICE_IDS[voiceTone] || VOICE_IDS.warm;

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: voiceTone === 'calm' ? 0.8 : 0.6,
        similarity_boost: 0.85,
        style: voiceTone === 'energetic' ? 0.4 : 0.2,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error: ${error}`);
  }

  const audioBuffer = await response.arrayBuffer();
  const base64Audio = Buffer.from(audioBuffer).toString('base64');
  const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;

  // Estimate duration: ~150 words per minute
  const wordCount = text.split(' ').length;
  const duration = Math.ceil((wordCount / 150) * 60);

  return { audioUrl, duration };
}
