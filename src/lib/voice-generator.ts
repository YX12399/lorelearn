export async function generateVoiceNarration(
  text: string,
  voiceTone: 'calm' | 'warm' | 'energetic' = 'warm'
): Promise<{ audioUrl: string; duration: number }> {
  const VOICE_IDS: Record<string, string> = {
    calm: 'pNInz6obpgDQGcFmaJgB',
    warm: 'EXAVITQu4vr4xnSDxMaL',
    energetic: 'VR6AewLTigWG4xSOukaG',
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

  // Calculate duration from MP3 buffer size (ElevenLabs outputs ~128kbps)
  const byteLength = audioBuffer.byteLength;
  const estimatedBitrate = 128000;
  const durationFromBytes = Math.ceil((byteLength * 8) / estimatedBitrate);
  const wordCount = text.split(' ').length;
  const durationFromWords = Math.ceil((wordCount / 150) * 60);
  const duration = Math.max(durationFromBytes, durationFromWords, 3);

  console.log(`[Voice] Generated ${byteLength} bytes (~${duration}s)`);

  // Upload to Vercel Blob for persistent storage instead of base64 data URLs
  let audioUrl: string;
  try {
    const { put } = await import('@vercel/blob');
    const filename = `audio/narration_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.mp3`;
    const blob = await put(filename, Buffer.from(audioBuffer), {
      access: 'public',
      contentType: 'audio/mpeg',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    audioUrl = blob.url;
    console.log(`[Voice] Uploaded to Blob: ${audioUrl}`);
  } catch (err) {
    // Fallback to base64 if Blob is not configured
    console.warn('[Voice] Blob upload failed, falling back to base64:', err);
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    audioUrl = `data:audio/mpeg;base64,${base64Audio}`;
  }

  return { audioUrl, duration };
}
