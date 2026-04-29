import { describe, expect, it } from "vitest";
import { buildChatContext } from "../src/context/contextBuilder";

describe("buildChatContext", () => {
  it("uses only the current file when restricted", () => {
    const context = buildChatContext({
      activeFile: { path: "Current.md", content: "Current file body" },
      selectedText: "selected passage",
      attachments: [{ path: "Attached.md", content: "attached body" }],
      retrievedSnippets: [{ path: "Other.md", snippet: "other vault body", score: 2 }],
      restrictToCurrentFile: true,
      limits: { maxActiveFileChars: 1000, maxSnippetChars: 1000 }
    });

    expect(context).toContain("Current.md");
    expect(context).toContain("selected passage");
    expect(context).not.toContain("Attached.md");
    expect(context).not.toContain("Other.md");
  });

  it("includes attachments and retrieved snippets when vault context is enabled", () => {
    const context = buildChatContext({
      activeFile: { path: "Current.md", content: "Current file body" },
      selectedText: "",
      attachments: [{ path: "Attached.md", content: "attached body" }],
      retrievedSnippets: [{ path: "Other.md", snippet: "other vault body", score: 2 }],
      restrictToCurrentFile: false,
      limits: { maxActiveFileChars: 1000, maxSnippetChars: 1000 }
    });

    expect(context).toContain("Attached.md");
    expect(context).toContain("Other.md");
  });
});

