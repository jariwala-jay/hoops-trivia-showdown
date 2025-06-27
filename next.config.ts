import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      'localhost', 
      '127.0.0.1',
      'storage.googleapis.com',
      'assets.nbatopshot.com',
      'cdn.dapperlabs.com',
      'ipfs.io',
      'gateway.pinata.cloud'
    ],
  },
};

export default nextConfig;
