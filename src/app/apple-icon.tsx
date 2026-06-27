import { ImageResponse } from "next/og";

// iPhoneのホーム画面に追加したときのアイコン（iOSが角丸マスクを自動適用）
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
          flexDirection: "column",
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
            width: 132,
            height: 132,
            border: "8px solid #14110F",
            borderRadius: 28,
            background: "#FFFFFF",
            boxShadow: "8px 8px 0 #14110F",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", fontSize: 52, fontWeight: 800, lineHeight: 1, letterSpacing: -2 }}>
              <span>AI</span>
              <span style={{ color: "#E60012" }}>&</span>
            </div>
            <div style={{ display: "flex", fontSize: 30, fontWeight: 800, lineHeight: 1, letterSpacing: 1, marginTop: 4 }}>
              UX
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
