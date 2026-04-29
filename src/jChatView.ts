import { ItemView, Notice, type WorkspaceLeaf } from "obsidian";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ChatController } from "./chat/chatController";
import { FileAttachModal } from "./fileAttachModal";
import { getActiveEditorState } from "./obsidian/activeEditor";
import type { JChatSettings } from "./pluginSettings";
import { ChatPanel } from "./ui/ChatPanel";

export const J_CHAT_VIEW_TYPE = "j-chat-view";

export type JChatViewOptions = {
  controller: ChatController;
  getSettings: () => JChatSettings;
};

export class JChatView extends ItemView {
  private root: Root | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor(leaf: WorkspaceLeaf, private readonly options: JChatViewOptions) {
    super(leaf);
  }

  getViewType(): string {
    return J_CHAT_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "J Chat";
  }

  getIcon(): string {
    return "message-square-text";
  }

  async onOpen(): Promise<void> {
    this.contentEl.empty();
    const mount = this.contentEl.createDiv({ cls: "j-chat-view-host" });
    this.root = createRoot(mount);
    this.unsubscribe = this.options.controller.subscribe(() => this.render());
    this.registerEvent(this.app.workspace.on("active-leaf-change", () => this.render()));
    this.render();
  }

  async onClose(): Promise<void> {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.root?.unmount();
    this.root = null;
    this.contentEl.empty();
  }

  private render(): void {
    if (!this.root) return;
    const settings = this.options.getSettings();
    const active = getActiveEditorState(this.app);
    this.root.render(
      createElement(ChatPanel, {
        snapshot: this.options.controller.getSnapshot(),
        providerStatus: {
          label: settings.provider === "codex-sdk" ? "Codex SDK" : "OpenAI API",
          ready: settings.provider === "codex-sdk"
            ? settings.codex.model.trim().length > 0
            : settings.openai.baseUrl.trim().length > 0 && settings.openai.model.trim().length > 0,
          detail: settings.provider === "codex-sdk" ? settings.codex.model : `${settings.openai.baseUrl} · ${settings.openai.model}`
        },
        currentFile: active.file ? { path: active.file.path, basename: active.file.basename } : null,
        hasSelection: active.selectedText.trim().length > 0,
        selectedText: active.selectedText,
        onSend: (message: string) => {
          void this.options.controller.send(message);
        },
        onToggleRestrictToCurrentFile: (value: boolean) => {
          this.options.controller.setRestrictToCurrentFile(value);
        },
        onAttachFile: () => {
          new FileAttachModal(this.app, (file) => {
            void this.options.controller.addAttachment(file.path).catch((error) => new Notice(error instanceof Error ? error.message : String(error)));
          }).open();
        },
        onRemoveAttachment: (path: string) => {
          this.options.controller.removeAttachment(path);
        },
        onOpenSource: (path: string) => {
          void this.app.workspace.openLinkText(path, "", true);
        }
      })
    );
  }
}
