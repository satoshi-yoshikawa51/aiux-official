import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // 自己完結の3DゲームHTML（public/game/index.html）を /game で配信
      { source: "/game", destination: "/game/index.html" },
    ];
  },
  async redirects() {
    return [
      // 旧URL aiux-official.vercel.app へのアクセスを正規ドメイン
      // comixai.dev へ恒久（308）リダイレクトし、評価を集約する。
      // プレビューデプロイ(aiux-official-xxxx.vercel.app)は対象外。
      {
        source: "/:path*",
        has: [{ type: "host", value: "aiux-official.vercel.app" }],
        destination: "https://comixai.dev/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
