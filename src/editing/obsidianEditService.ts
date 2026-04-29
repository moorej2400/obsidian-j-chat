import type { App, Editor, TFile } from "obsidian";
import { applyEditAction, type EditAction } from "./editActions";

export class ObsidianEditService {
  constructor(private readonly app: App) {}

  async applyToActiveFile(file: TFile, editor: Editor | null, action: EditAction): Promise<void> {
    if (editor && action.type === "replace-selection") {
      editor.replaceSelection(action.text);
      return;
    }

    await this.app.vault.process(file, (content) => {
      const selection = editor && action.type === "replace-selection"
        ? {
            from: editor.posToOffset(editor.getCursor("from")),
            to: editor.posToOffset(editor.getCursor("to"))
          }
        : null;
      return applyEditAction(content, selection, action);
    });
  }
}

