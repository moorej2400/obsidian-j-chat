import type { App, Editor, TFile } from "obsidian";

export type ActiveEditorState = {
  file: TFile | null;
  editor: Editor | null;
  selectedText: string;
};

export function getActiveEditorState(app: App): ActiveEditorState {
  const view = getMostRecentRootMarkdownView(app);
  const editor = view?.editor ?? null;
  return {
    file: view?.file ?? app.workspace.getActiveFile(),
    editor,
    selectedText: editor?.getSelection() ?? ""
  };
}

type MarkdownEditorView = {
  getViewType?: () => string;
  editor?: Editor;
  file?: TFile | null;
};

function getMostRecentRootMarkdownView(app: App): MarkdownEditorView | null {
  const recentLeaf = app.workspace.getMostRecentLeaf(app.workspace.rootSplit);
  if (isMarkdownView(recentLeaf?.view)) return recentLeaf.view;

  let found: MarkdownEditorView | null = null;
  app.workspace.iterateRootLeaves((leaf) => {
    if (!found && isMarkdownView(leaf.view)) found = leaf.view;
  });
  return found;
}

function isMarkdownView(view: unknown): view is MarkdownEditorView {
  if (!view || typeof view !== "object") return false;
  const candidate = view as MarkdownEditorView;
  return candidate.getViewType?.() === "markdown" && Boolean(candidate.editor);
}
