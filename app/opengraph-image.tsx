import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt =
  "SwiftFix — Control Your Savings. The Swift Way.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function toDataUrl(filename: string, mime: string) {
  const buffer = await readFile(join(process.cwd(), "public", filename));
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

export default async function Image() {
  const [bg, character, laptop, logo] = await Promise.all([
    toDataUrl("hero-bg.png", "image/png"),
    toDataUrl("hero-right-character.png", "image/png"),
    toDataUrl("hero-laptop-mockup.png", "image/png"),
    toDataUrl("logo.png", "image/png"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          position: "relative",
          overflow: "hidden",
          background: "#f4f4f5",
        }}
      >
        <img
          src={bg}
          alt=""
          width={1200}
          height={630}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "top",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            padding: "48px 56px",
          }}
        >
          <img
            src={logo}
            alt="SwiftFix"
            width={168}
            height={40}
            style={{ objectFit: "contain", objectPosition: "left" }}
          />
          <div
            style={{
              marginTop: 28,
              display: "flex",
              flexDirection: "column",
              maxWidth: 520,
            }}
          >
            <div
              style={{
                fontSize: 52,
                fontWeight: 700,
                lineHeight: 1.05,
                color: "#09090b",
                letterSpacing: "-0.03em",
              }}
            >
              Control Your Savings.
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 52,
                fontWeight: 700,
                lineHeight: 1.05,
                color: "#9333ea",
                letterSpacing: "-0.03em",
              }}
            >
              The Swift Way.
            </div>
            <div
              style={{
                marginTop: 20,
                fontSize: 24,
                lineHeight: 1.4,
                color: "#3f3f46",
              }}
            >
              Seamlessly request trusted artisans, and pay them in Naira or USDT.
            </div>
          </div>
        </div>
        <img
          src={laptop}
          alt=""
          width={500}
          height={238}
          style={{
            position: "absolute",
            bottom: 24,
            left: 56,
            objectFit: "contain",
          }}
        />
        <img
          src={character}
          alt=""
          width={340}
          height={520}
          style={{
            position: "absolute",
            bottom: 0,
            right: 48,
            objectFit: "contain",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
