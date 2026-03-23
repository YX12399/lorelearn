import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { execSync, exec } from 'child_process';
import { writeFileSync, mkdirSync, existsSync, readFileSync, unlinkSync, readdirSync } from 'fs';
import { join } from 'path';

export const maxDuration = 300;

interface StitchScene {
  videoUrl: string;
  audioUrl?: string;
  duration: number;
}

/**
 * POST /api/stitch
 * Merges scene videos + audio into one final episode MP4 using FFmpeg.
 * Body: { episodeId, title, scenes: [{ videoUrl, audioUrl, duration }] }
 * Returns: { videoUrl: string } — permanent URL to the stitched video
 */
export async function POST(request: NextRequest) {
  const tmpDir = join('/tmp', `stitch-${Date.now()}`);

  try {
    const { episodeId, title, scenes } = (await request.json()) as {
      episodeId: string;
      title: string;
      scenes: StitchScene[];
    };

    if (!scenes?.length) {
      return NextResponse.json({ error: 'No scenes provided' }, { status: 400 });
    }

    // Check if FFmpeg is available
    try {
      execSync('which ffmpeg', { encoding: 'utf8' });
    } catch {
      return NextResponse.json(
        { error: 'FFmpeg not available on this server. Video stitching requires a server with FFmpeg installed.' },
        { status: 501 }
      );
    }

    mkdirSync(tmpDir, { recursive: true });

    // Download all scene videos and audio files in parallel
    console.log(`[Stitch] Downloading ${scenes.length} scenes...`);
    
    await Promise.all(
      scenes.map(async (scene, i) => {
        // Download video
        const videoResp = await fetch(scene.videoUrl);
        const videoBuffer = Buffer.from(await videoResp.arrayBuffer());
        writeFileSync(join(tmpDir, `scene_${i}.mp4`), videoBuffer);

        // Download audio if present (skip base64 data URIs — decode them)
        if (scene.audioUrl) {
          if (scene.audioUrl.startsWith('data:audio')) {
            const base64Data = scene.audioUrl.split(',')[1];
            const audioBuffer = Buffer.from(base64Data, 'base64');
            writeFileSync(join(tmpDir, `audio_${i}.mp3`), audioBuffer);
          } else {
            const audioResp = await fetch(scene.audioUrl);
            const audioBuffer = Buffer.from(await audioResp.arrayBuffer());
            writeFileSync(join(tmpDir, `audio_${i}.mp3`), audioBuffer);
          }
        }
      })
    );

    console.log(`[Stitch] All assets downloaded. Merging...`);

    // For each scene, merge video + audio into a single clip
    for (let i = 0; i < scenes.length; i++) {
      const videoFile = join(tmpDir, `scene_${i}.mp4`);
      const audioFile = join(tmpDir, `audio_${i}.mp3`);
      const mergedFile = join(tmpDir, `merged_${i}.mp4`);

      if (existsSync(audioFile)) {
        // Merge video + audio, using the longer of the two as duration
        // Loop video if audio is longer, trim audio if video is longer
        execSync(
          `ffmpeg -y -stream_loop -1 -i "${videoFile}" -i "${audioFile}" ` +
          `-c:v libx264 -preset ultrafast -crf 23 -c:a aac -b:a 128k ` +
          `-shortest -map 0:v:0 -map 1:a:0 ` +
          `-movflags +faststart "${mergedFile}"`,
          { timeout: 60000, encoding: 'utf8' }
        );
      } else {
        // No audio — just re-encode for consistent format
        execSync(
          `ffmpeg -y -i "${videoFile}" -c:v libx264 -preset ultrafast -crf 23 ` +
          `-an -movflags +faststart "${mergedFile}"`,
          { timeout: 60000, encoding: 'utf8' }
        );
      }
    }

    // Create a concat list file
    const concatList = scenes
      .map((_, i) => `file 'merged_${i}.mp4'`)
      .join('\n');
    writeFileSync(join(tmpDir, 'concat.txt'), concatList);

    // Concatenate all merged clips
    const outputFile = join(tmpDir, 'episode.mp4');
    execSync(
      `ffmpeg -y -f concat -safe 0 -i "${join(tmpDir, 'concat.txt')}" ` +
      `-c:v libx264 -preset ultrafast -crf 23 -c:a aac -b:a 128k ` +
      `-movflags +faststart "${outputFile}"`,
      { timeout: 120000, encoding: 'utf8' }
    );

    console.log(`[Stitch] Episode video created`);

    // Upload to Vercel Blob if token available
    const outputBuffer = readFileSync(outputFile);
    
    let videoUrl: string;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(
        `episodes/${episodeId}/full-episode.mp4`,
        outputBuffer,
        { access: 'public', contentType: 'video/mp4' }
      );
      videoUrl = blob.url;
      console.log(`[Stitch] Uploaded to Blob: ${videoUrl}`);
    } else {
      // Fallback: return as base64 data URI (not ideal for large files)
      videoUrl = `data:video/mp4;base64,${outputBuffer.toString('base64')}`;
      console.log(`[Stitch] No Blob token, returning data URI`);
    }

    // Cleanup
    try {
      const files = readdirSync(tmpDir);
      files.forEach(f => unlinkSync(join(tmpDir, f)));
    } catch {}

    return NextResponse.json({ videoUrl, duration: scenes.reduce((s, sc) => s + sc.duration, 0) });
  } catch (error) {
    console.error('[Stitch] Error:', error);
    // Cleanup on error
    try {
      if (existsSync(tmpDir)) {
        const files = readdirSync(tmpDir);
        files.forEach(f => unlinkSync(join(tmpDir, f)));
      }
    } catch {}
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Stitching failed' },
      { status: 500 }
    );
  }
}
