//! https://github.com/antfu/raycast-multi-translate

import { Buffer } from "node:buffer";
import fs from "node:fs/promises";
import { join } from "node:path";
import satori from "satori";
import { diffChars } from "diff";
import { environment } from "@raycast/api";

const font = fs.readFile(join(environment.assetsPath, "RobotoMono-Regular.ttf"));

export async function getDiffSvg(from: string, to: string): Promise<string> {
  const diffs = diffChars(from, to);
  const foregroundColor = environment.appearance === "light" ? "black" : "white";

  const svg = await satori(
    <div
      style={{
        color: foregroundColor,
        display: "flex",
        flexWrap: "wrap",
        flexDirection: "row",
        alignItems: "flex-start",
        padding: 0,
        paddingTop: 10,
        margin: 0,
        width: "100%",
        fontSize: to.length > 15 ? (to.length > 24 ? 18 : 35) : 50,
      }}
    >
      {diffs
        .filter((diff) => diff.value)
        .map((diff, idx) => {
          const color = diff.added ? "#7AA874" : diff.removed ? "#F96666" : foregroundColor;
          const background = diff.added ? "#7AA87430" : diff.removed ? "#F9666620" : "transparent";
          return (
            <span
              key={idx}
              style={{
                color,
                backgroundColor: background,
                whiteSpace: "pre-wrap",
              }}
            >
              {diff.value}
            </span>
          );
        })}
    </div>,
    {
      width: 830,
      height: 600,
      fonts: [
        {
          name: "Roboto",
          data: await font,
          weight: 400,
          style: "normal",
        },
      ],
    }
  );
  return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
}
