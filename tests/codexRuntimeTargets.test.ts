import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("codex runtime target manifest", () => {
  it("includes the Windows x64 runtime needed by Obsidian on the Solera PC", async () => {
    const manifestPath = path.resolve("scripts/codex-runtime-targets.json");
    const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8")) as {
      requiredTargets: string[];
      packages: Record<string, string>;
    };

    expect(manifest.requiredTargets).toContain("x86_64-pc-windows-msvc");
    expect(manifest.packages["x86_64-pc-windows-msvc"]).toBe("@openai/codex-win32-x64");
  });
});
