import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get("title") || "Compliance deadlines, under control.").slice(0, 96);
  const eyebrow = (searchParams.get("eyebrow") || "RentClock · England").slice(0, 64);
  return new ImageResponse(
    <div style={{ background: "#08233f", color: "#ffffff", display: "flex", height: "100%", width: "100%", padding: "72px", flexDirection: "column", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", fontSize: 46, fontWeight: 700 }}><span style={{ color: "#18b6a2", marginRight: 18 }}>RC</span> RentClock</div>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: "1000px" }}><div style={{ display: "flex", fontSize: 68, lineHeight: 1.06, fontWeight: 700, letterSpacing: "-2px" }}>{title}</div></div>
      <div style={{ display: "flex", color: "#8ee5d9", fontSize: 30 }}>{eyebrow}</div>
    </div>,
    { width: 1200, height: 630 },
  );
}
