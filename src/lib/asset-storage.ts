import { put } from '@vercel/blob';

/**
 * Upload an asset (image, video, or audio) to Vercel Blob storage
 * Falls back gracefully if BLOB_READ_WRITE_TOKEN is not set
 */
export async function uploadAsset(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  // If no token, return empty string to indicate fallback
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn('[Asset Storage] BLOB_READ_WRITE_TOKEN not set, assets will not be persisted');
    return '';
  }

  try {
    const blob = await put(filename, buffer, {
      contentType,
      access: 'public',
    });
    return blob.url;
  } catch (error) {
    console.error('[Asset Storage] Upload failed:', error);
    return '';
  }
}

/**
 * Upload an image from a URL to Vercel Blob storage
 */
export async function uploadImageFromUrl(
  url: string,
  episodeId: string,
  sceneIndex: number
): Promise<string> {
  if (!url) return '';

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Failed to fetch image from URL');
      return '';
    }

    const buffer = await response.arrayBuffer();
    const filename = 'episodes/' + episodeId + '/scene-' + sceneIndex + '-image.png';
    
    return uploadAsset(Buffer.from(buffer), filename, 'image/png');
  } catch (error) {
    console.error('[Asset Storage] Image upload failed:', error);
    return '';
  }
}

/**
 * Upload a video from a URL to Vercel Blob storage
 */
export async function uploadVideoFromUrl(
  url: string,
  episodeId: string,
  sceneIndex: number
): Promise<string> {
  if (!url) return '';

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Failed to fetch video from URL');
      return '';
    }

    const buffer = await response.arrayBuffer();
    const filename = 'episodes/' + episodeId + '/scene-' + sceneIndex + '-video.mp4';
    
    return uploadAsset(Buffer.from(buffer), filename, 'video/mp4');
  } catch (error) {
    console.error('[Asset Storage] Video upload failed:', error);
    return '';
  }
}

/**
 * Upload audio from base64-encoded string to Vercel Blob storage
 */
export async function uploadAudioFromBase64(
  base64: string,
  episodeId: string,
  sceneIndex: number
): Promise<string> {
  if (!base64) return '';

  try {
    const buffer = Buffer.from(base64, 'base64');
    const filename = 'episodes/' + episodeId + '/scene-' + sceneIndex + '-audio.mp3';
    
    return uploadAsset(buffer, filename, 'audio/mpeg');
  } catch (error) {
    console.error('[Asset Storage] Audio upload failed:', error);
    return '';
  }
}

/**
 * Helper to check if Vercel Blob storage is configured
 */
export function isBlobStorageConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}
