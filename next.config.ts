import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.fal.media' },
      { protocol: 'https', hostname: '**.fal.run' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
    ],
  },
  serverExternalPackages: ['@anthropic-ai/sdk'],
};

export default nextConfig;
