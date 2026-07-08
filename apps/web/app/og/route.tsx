import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get("title") ?? "Engineering Notes";
  const summary = searchParams.get("summary") ?? "A config-driven engineering knowledge base.";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          width: "100%",
          height: "100%",
          backgroundColor: "#0b0d10",
          padding: "60px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "#5865f2",
            }}
          />
          <span style={{ color: "#8b919a", fontSize: "16px" }}>
            Engineering Notes
          </span>
        </div>
        <div
          style={{
            fontSize: title.length > 50 ? "42px" : "56px",
            fontWeight: "700",
            color: "#e2e8f0",
            lineHeight: 1.1,
            marginBottom: "20px",
            maxWidth: "900px",
          }}
        >
          {title}
        </div>
        {summary && (
          <div
            style={{
              fontSize: "22px",
              color: "#8b919a",
              lineHeight: 1.4,
              maxWidth: "800px",
            }}
          >
            {summary.length > 140 ? summary.slice(0, 137) + "…" : summary}
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
