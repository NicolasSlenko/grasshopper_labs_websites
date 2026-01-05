import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "@xenova/transformers"],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'sharp$': false,
      'onnxruntime-node$': false,
      '@xenova/transformers': path.resolve(__dirname, 'node_modules/@xenova/transformers'),
    }
    return config
  }
};

export default nextConfig;
