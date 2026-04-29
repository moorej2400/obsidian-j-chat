import { MarkdownView, type App, type Editor, type TFile } from "obsidian";

export type ActiveEditorState = {
  file: TFile | null;
  editor: Editor | null;
  selectedText: string;
};

export function getActiveEditorState(app: App): ActiveEditorState {
  const view = app.workspace.getActiveViewOfType(MarkdownView);
  const editor = view?.editor ?? null;
  return {
    file: view?.file ?? null,
    editor,
    selectedText: editor?.getSelection() ?? ""
  };
}

