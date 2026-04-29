import { Notice, type App } from "obsidian";
import { buildChatContext } from "../context/contextBuilder";
import { readAllMarkdownDocuments, readMarkdownFile } from "../context/obsidianVaultContext";
import { searchVaultSnippets } from "../context/vaultSearch";
import { parseEditActions, stripEditActionBlocks } from "../editing/editActions";
import { ObsidianEditService } from "../editing/obsidianEditService";
import { getActiveEditorState } from "../obsidian/activeEditor";
import type { JChatSettings } from "../pluginSettings";
import { createAiProvider } from "../providers/providerFactory";
import type { ChatMessage } from "../providers/types";
import type { AttachedFile, ChatItem } from "./chatTypes";

export type ChatControllerSnapshot = {
  items: ChatItem[];
  attachments: AttachedFile[];
  restrictToCurrentFile: boolean;
  isSending: boolean;
  error: string | null;
};

export class ChatController {
  private items: ChatItem[] = [];
  private attachments: AttachedFile[] = [];
  private restrictToCurrentFile = true;
  private isSending = false;
  private error: string | null = null;
  private listeners = new Set<() => void>();

  constructor(
    private readonly app: App,
    private getSettings: () => JChatSettings
  ) {}

  getSnapshot(): ChatControllerSnapshot {
    return {
      items: [...this.items],
      attachments: [...this.attachments],
      restrictToCurrentFile: this.restrictToCurrentFile,
      isSending: this.isSending,
      error: this.error
    };
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  setRestrictToCurrentFile(value: boolean): void {
    this.restrictToCurrentFile = value;
    this.emit();
  }

  async addAttachment(filePath: string): Promise<void> {
    const file = this.app.vault.getFileByPath(filePath);
    if (!file) throw new Error(`Could not find ${filePath}`);
    const attached = await readMarkdownFile(this.app, file);
    this.attachments = [...this.attachments.filter((item) => item.path !== attached.path), attached];
    this.emit();
  }

  removeAttachment(path: string): void {
    this.attachments = this.attachments.filter((item) => item.path !== path);
    this.emit();
  }

  async send(content: string): Promise<void> {
    const message = content.trim();
    if (message.length === 0 || this.isSending) return;

    this.error = null;
    this.isSending = true;
    this.items.push(createItem("user", message));
    this.emit();

    try {
      const settings = this.getSettings();
      const active = getActiveEditorState(this.app);
      const activeFile = active.file ? await readMarkdownFile(this.app, active.file) : null;
      const documents = this.restrictToCurrentFile ? [] : await readAllMarkdownDocuments(this.app, active.file?.path);
      const retrievedSnippets = this.restrictToCurrentFile
        ? []
        : searchVaultSnippets(documents, message, {
            maxResults: settings.context.maxRetrievedFiles,
            maxSnippetChars: settings.context.maxSnippetChars
          });
      const context = buildChatContext({
        activeFile,
        selectedText: active.selectedText,
        attachments: this.attachments,
        retrievedSnippets,
        restrictToCurrentFile: this.restrictToCurrentFile,
        limits: settings.context
      });
      const provider = createAiProvider(settings);
      const providerMessages: ChatMessage[] = this.items
        .filter((item) => item.role === "user" || item.role === "assistant")
        .map((item) => ({ role: item.role, content: item.content }));
      const response = await provider.sendMessage({ messages: providerMessages, context });
      const actions = parseEditActions(response.content);

      if (settings.editing.directApply && active.file && actions.length > 0) {
        const editService = new ObsidianEditService(this.app);
        for (const action of actions) {
          await editService.applyToActiveFile(active.file, active.editor, action);
        }
        new Notice(`J Chat applied ${actions.length} edit${actions.length === 1 ? "" : "s"}.`);
      }

      this.items.push({
        ...createItem("assistant", stripEditActionBlocks(response.content)),
        sources: [
          ...(activeFile ? [{ path: activeFile.path, label: "current" }] : []),
          ...this.attachments.map((file) => ({ path: file.path, label: "attached" })),
          ...retrievedSnippets.map((snippet) => ({ path: snippet.path, label: "vault match" }))
        ],
        editCount: actions.length
      });
    } catch (error) {
      const messageText = error instanceof Error ? error.message : String(error);
      this.error = messageText;
      this.items.push({ ...createItem("assistant", messageText), error: messageText });
    } finally {
      this.isSending = false;
      this.emit();
    }
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }
}

function createItem(role: ChatItem["role"], content: string): ChatItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
    createdAt: Date.now()
  };
}

