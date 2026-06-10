import path from 'path'
import { loadEnvConfig } from '@next/env'

loadEnvConfig(path.resolve(__dirname))

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;