import { describe, expect, it } from "vitest";
import type { App, Editor, TFile } from "obsidian";
import { getActiveEditorState } from "../src/obsidian/activeEditor";

describe("getActiveEditorState", () => {
  it("uses the most recent root markdown editor when the sidebar is active", () => {
    const file = { path: "Current.md" } as TFile;
    const editor = { getSelection: () => "selected passage" } as Editor;
    const markdownView = {
      getViewType: () => "markdown",
      file,
      editor
    };
    const app = {
      workspace: {
        rootSplit: {},
        getActiveViewOfType: () => null,
        getMostRecentLeaf: () => ({ view: markdownView }),
        iterateRootLeaves: () => undefined,
        getActiveFile: () => file
      }
    } as unknown as App;

    expect(getActiveEditorState(app)).toEqual({
      file,
      editor,
      selectedText: "selected passage"
    });
  });
});
