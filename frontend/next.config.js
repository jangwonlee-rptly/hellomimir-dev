/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  // Disable ESLint during builds (optional, remove if you want strict checks)
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Disable TypeScript checks during builds (optional, remove if you want strict checks)
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
