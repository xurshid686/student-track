/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    JWT_SECRET: process.env.JWT_SECRET,
  },
}

module.exports = nextConfig
