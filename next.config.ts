import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config) => {
    config.externals.push(
      'encoding' /* add any other modules that might be causing the error */
    );
    return config;
  },
};

export default nextConfig;
