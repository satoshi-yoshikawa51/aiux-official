import { ImageResponse } from "next/og";

// ブラウザのタブに出るファビコン（COMIXAI モノグラム：C=インク黒 / M=赤）
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
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
          border: "5px solid #14110F",
          borderRadius: 14,
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: -1,
        }}
      >
        <span>C</span>
        <span style={{ color: "#E60012" }}>M</span>
      </div>
    ),
    { ...size }
  );
}
