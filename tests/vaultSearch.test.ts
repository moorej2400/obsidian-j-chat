import { describe, expect, it } from "vitest";
import { searchVaultSnippets } from "../src/context/vaultSearch";

describe("searchVaultSnippets", () => {
  it("ranks markdown snippets lexically by query terms", () => {
    const results = searchVaultSnippets(
      [
        { path: "daily.md", content: "Breakfast and errands" },
        { path: "project.md", content: "Codex SDK provider and Obsidian plugin architecture" },
        { path: "ideas.md", content: "Plugin panels and settings" }
      ],
      "codex plugin provider",
      { maxResults: 2, maxSnippetChars: 80 }
    );

    expect(results.map((result) => result.path)).toEqual(["project.md", "ideas.md"]);
    expect(results[0].snippet).toContain("Codex SDK provider");
  });
});

