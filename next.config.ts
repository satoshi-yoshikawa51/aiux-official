import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // 自己完結の3DゲームHTML（public/game/index.html）を /game で配信
      { source: "/game", destination: "/game/index.html" },
    ];
  },
};

export default nextConfig;
