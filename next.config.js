const { paraglide } = require('@inlang/paraglide-next/plugin');
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // domains: ['lh3.googleusercontent.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
};

module.exports = paraglide({
  paraglide: {
    project: './project.inlang',
    outdir: './src/paraglide',
  },
  ...nextConfig,
});
