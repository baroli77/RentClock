import { ImageResponse } from "next/og";

export const alt = "RentClock — compliance deadlines for small landlords";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ background: "#08233f", color: "#ffffff", display: "flex", height: "100%", width: "100%", padding: "72px", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", fontSize: 48, fontWeight: 700 }}>
          <span style={{ color: "#18b6a2", marginRight: 18 }}>◷</span> RentClock
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, lineHeight: 1.05, fontWeight: 750, letterSpacing: "-2px" }}>Compliance deadlines,<br />under control.</div>
          <div style={{ color: "#8ee5d9", fontSize: 32, marginTop: 28 }}>For small landlords in England</div>
        </div>
        <div style={{ display: "flex", color: "#d7e2ec", fontSize: 26 }}>Gas safety · EICR · EPC · Renters’ Rights Act</div>
      </div>
    ),
    size,
  );
}
