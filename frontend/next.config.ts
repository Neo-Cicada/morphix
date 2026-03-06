import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei', '@remotion/three'],
};

export default nextConfig;
