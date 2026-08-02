/** @type {import('next').NextConfig} */
const webpack = require('webpack');

const nextConfig = {
  output: 'standalone',
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }

    // Pacote opcional só para treino local com TFJS_USE_NODE=1 — não faz parte do bundle
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^@tensorflow\/tfjs-node$/,
      })
    );

    return config;
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
};

module.exports = nextConfig;
