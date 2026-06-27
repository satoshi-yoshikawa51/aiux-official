import { ImageResponse } from "next/og";

// iPhoneのホーム画面に追加したときのアイコン（COMIXAI ワードマーク）
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FBF7EF",
          color: "#14110F",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 140,
            height: 140,
            border: "8px solid #14110F",
            borderRadius: 28,
            background: "#FFFFFF",
            boxShadow: "8px 8px 0 #14110F",
            fontSize: 27,
            fontWeight: 800,
            letterSpacing: -1,
          }}
        >
          <span>CO</span>
          <span style={{ color: "#E60012" }}>MIX</span>
          <span>AI</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
