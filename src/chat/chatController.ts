import { normalizePath, Notice, type App, type TFile } from "obsidian";
import { buildChatContext } from "../context/contextBuilder";
import { readAllMarkdownDocuments, readMarkdownFile } from "../context/obsidianVaultContext";
import { searchVaultSnippets } from "../context/vaultSearch";
import { parseEditActions, stripEditActionBlocks } from "../editing/editActions";
import { ObsidianEditService } from "../editing/obsidianEditService";
import { getActiveEditorState } from "../obsidian/activeEditor";
import type { JChatSettings } from "../pluginSettings";
import { createAiProvider, type ProviderRuntimeOptions } from "../providers/providerFactory";
import type { AgentActivityEvent, AgentToolRuntime, ChatMessage } from "../providers/types";
import type { AttachedFile, ChatItem } from "./chatTypes";
import {
  addMessageToActiveSession,
  createNewActiveSession,
  deleteSession,
  normalizeChatHistory,
  renameSession,
  selectSession,
  summarizeSessions,
  updateActiveSession,
  type ChatHistoryState,
  type ChatSession
} from "./chatSessions";

export type ChatControllerSnapshot = {
  items: ChatItem[];
  attachments: AttachedFile[];
  restrictToCurrentFile: boolean;
  activeSessionId: string;
  sessions: ReturnType<typeof summarizeSessions>;
  activity: AgentActivityEvent[];
  isSending: boolean;
  error: string | null;
};

export class ChatController {
  private history: ChatHistoryState;
  // Activity is transient run state; persisting it would replay stale tool calls when a chat is reopened.
  private activity: AgentActivityEvent[] = [];
  private isSending = false;
  private error: string | null = null;
  private listeners = new Set<() => void>();

  constructor(
    private readonly app: App,
    private getSettings: () => JChatSettings,
    private readonly providerRuntime: ProviderRuntimeOptions,
    private readonly onHistoryChange?: (history: ChatHistoryState) => void | Promise<void>
  ) {
    this.history = normalizeChatHistory(this.getSettings().history);
  }

  getSnapshot(): ChatControllerSnapshot {
    const activeSession = this.getActiveSession();
    return {
      items: [...activeSession.items],
      attachments: [...activeSession.attachments],
      restrictToCurrentFile: activeSession.restrictToCurrentFile,
      activeSessionId: this.history.activeSessionId,
      sessions: summarizeSessions(this.history),
      activity: [...this.activity],
      isSending: this.isSending,
      error: this.error
    };
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  setRestrictToCurrentFile(value: boolean): void {
    this.history = updateActiveSession(this.history, (session) => ({
      ...session,
      restrictToCurrentFile: value,
      updatedAt: Date.now()
    }));
    this.persistHistory();
    this.emit();
  }

  startNewSession(): void {
    this.error = null;
    this.history = createNewActiveSession(this.history);
    this.persistHistory();
    this.emit();
  }

  selectSession(sessionId: string): void {
    this.error = null;
    this.history = selectSession(this.history, sessionId);
    this.persistHistory();
    this.emit();
  }

  renameSession(sessionId: string, title: string): void {
    this.history = renameSession(this.history, sessionId, title);
    this.persistHistory();
    this.emit();
  }

  deleteSession(sessionId: string): void {
    this.error = null;
    this.history = deleteSession(this.history, sessionId);
    this.persistHistory();
    this.emit();
  }

  async addAttachment(filePath: string): Promise<void> {
    const file = this.app.vault.getFileByPath(filePath);
    if (!file) throw new Error(`Could not find ${filePath}`);
    const attached = await readMarkdownFile(this.app, file);
    this.history = updateActiveSession(this.history, (session) => ({
      ...session,
      attachments: [...session.attachments.filter((item) => item.path !== attached.path), attached],
      updatedAt: Date.now()
    }));
    this.persistHistory();
    this.emit();
  }

  removeAttachment(path: string): void {
    this.history = updateActiveSession(this.history, (session) => ({
      ...session,
      attachments: session.attachments.filter((item) => item.path !== path),
      updatedAt: Date.now()
    }));
    this.persistHistory();
    this.emit();
  }

  async send(content: string): Promise<void> {
    const message = content.trim();
    if (message.length === 0 || this.isSending) return;

    this.error = null;
    this.isSending = true;
    this.activity = [createThinkingActivity()];
    const activeSessionId = this.history.activeSessionId;
    this.history = addMessageToActiveSession(this.history, createItem("user", message));
    this.persistHistory();
    this.emit();

    try {
      const settings = this.getSettings();
      const requestSession = this.getSession(activeSessionId);
      const active = getActiveEditorState(this.app);
      const activeFile = active.file ? await readMarkdownFile(this.app, active.file) : null;
      const documents = requestSession.restrictToCurrentFile ? [] : await readAllMarkdownDocuments(this.app, active.file?.path);
      const retrievedSnippets = requestSession.restrictToCurrentFile
        ? []
        : searchVaultSnippets(documents, message, {
            maxResults: settings.context.maxRetrievedFiles,
            maxSnippetChars: settings.context.maxSnippetChars
          });
      const context = buildChatContext({
        activeFile,
        selectedText: active.selectedText,
        attachments: requestSession.attachments,
        retrievedSnippets,
        restrictToCurrentFile: requestSession.restrictToCurrentFile,
        limits: settings.context
      });
      const provider = createAiProvider(settings, this.providerRuntime);
      const providerMessages: ChatMessage[] = requestSession.items
        .filter((item) => item.role === "user" || item.role === "assistant")
        .map((item) => ({ role: item.role, content: item.content }));
      const response = await provider.sendMessage({
        messages: providerMessages,
        context,
        agentTools: this.createAgentToolRuntime(active.file, active.editor, active.selectedText, settings),
        onActivity: (event) => this.addActivity(event)
      });
      const actions = parseEditActions(response.content);

      if (settings.editing.directApply && active.file && actions.length > 0) {
        const editService = new ObsidianEditService(this.app);
        for (const action of actions) {
          await editService.applyToActiveFile(active.file, active.editor, action);
        }
        new Notice(`J Chat applied ${actions.length} edit${actions.length === 1 ? "" : "s"}.`);
      }

      this.history = this.appendToSession(activeSessionId, {
        ...createItem("assistant", stripEditActionBlocks(response.content)),
        sources: [
          ...(activeFile ? [{ path: activeFile.path, label: "current" }] : []),
          ...requestSession.attachments.map((file) => ({ path: file.path, label: "attached" })),
          ...retrievedSnippets.map((snippet) => ({ path: snippet.path, label: "vault match" }))
        ],
        editCount: actions.length
      });
      this.persistHistory();
    } catch (error) {
      const messageText = error instanceof Error ? error.message : String(error);
      this.error = messageText;
      this.history = this.appendToSession(activeSessionId, { ...createItem("assistant", messageText), error: messageText });
      this.persistHistory();
    } finally {
      this.isSending = false;
      this.activity = [];
      this.emit();
    }
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }

  private addActivity(event: AgentActivityEvent): void {
    this.activity = upsertActivity(this.activity, event);
    this.emit();
  }

  private getActiveSession(): ChatSession {
    return this.getSession(this.history.activeSessionId);
  }

  private getSession(sessionId: string): ChatSession {
    return this.history.sessions.find((session) => session.id === sessionId) ?? this.history.sessions[0];
  }

  private appendToSession(sessionId: string, item: ChatItem): ChatHistoryState {
    return {
      ...this.history,
      sessions: this.history.sessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              items: [...session.items, item],
              updatedAt: Date.now()
            }
          : session
      )
    };
  }

  private persistHistory(): void {
    void Promise.resolve(this.onHistoryChange?.(this.history)).catch((error) => {
      this.error = error instanceof Error ? error.message : String(error);
      this.emit();
    });
  }

  private createAgentToolRuntime(
    activeFile: TFile | null,
    editor: ReturnType<typeof getActiveEditorState>["editor"],
    selectedText: string,
    settings: JChatSettings
  ): AgentToolRuntime {
    const editService = new ObsidianEditService(this.app);
    const requireActiveFile = () => {
      if (!activeFile) throw new Error("No active Markdown file is open.");
      return activeFile;
    };
    const applyEdit = async (type: "replace-selection" | "replace-file" | "append" | "prepend", text: string, label: string) => {
      if (!settings.editing.directApply) return "Direct edits are disabled in J Chat settings.";
      const file = requireActiveFile();
      await editService.applyToActiveFile(file, editor, { type, text });
      return `${label} ${file.path}`;
    };

    return {
      readCurrentFile: async () => {
        if (!activeFile) return { path: null, content: "" };
        const file = await readMarkdownFile(this.app, activeFile);
        return { path: file.path, content: file.content };
      },
      readNote: async ({ path }) => {
        const file = this.getMarkdownFile(path);
        const note = await readMarkdownFile(this.app, file);
        return { path: note.path, content: note.content };
      },
      searchVault: async ({ query }) => {
        const documents = await readAllMarkdownDocuments(this.app, activeFile?.path);
        return searchVaultSnippets(documents, query, {
          maxResults: settings.context.maxRetrievedFiles,
          maxSnippetChars: settings.context.maxSnippetChars
        }).map(({ path, snippet }) => ({ path, snippet }));
      },
      replaceSelection: ({ text }) => {
        if (!editor || selectedText.length === 0) return Promise.resolve("No active text selection is available.");
        return applyEdit("replace-selection", text, "Replaced selection in");
      },
      replaceCurrentFile: ({ text }) => applyEdit("replace-file", text, "Replaced"),
      appendCurrentFile: ({ text }) => applyEdit("append", text, "Appended to"),
      prependCurrentFile: ({ text }) => applyEdit("prepend", text, "Prepended to"),
      createNote: async ({ path, content }) => {
        if (!settings.editing.directApply) return "Direct edits are disabled in J Chat settings.";
        const notePath = normalizeCreatedNotePath(path);
        if (this.app.vault.getAbstractFileByPath(notePath)) throw new Error(`${notePath} already exists.`);
        await this.ensureParentFolder(notePath);
        await this.app.vault.create(notePath, content);
        return `Created ${notePath}`;
      }
    };
  }

  private getMarkdownFile(path: string): TFile {
    const normalized = normalizePath(path.trim());
    const file = this.app.vault.getFileByPath(normalized);
    if (!file) throw new Error(`Could not find ${normalized}`);
    return file;
  }

  private async ensureParentFolder(path: string): Promise<void> {
    const parts = path.split("/");
    parts.pop();
    let current = "";

    for (const part of parts) {
      current = current.length === 0 ? part : `${current}/${part}`;
      if (!this.app.vault.getAbstractFileByPath(current)) await this.app.vault.createFolder(current);
    }
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

function normalizeCreatedNotePath(path: string): string {
  const trimmed = path.trim().replace(/^\/+/, "");
  const normalized = normalizePath(trimmed.length > 0 ? trimmed : "Untitled.md");
  return normalized.endsWith(".md") ? normalized : `${normalized}.md`;
}

function createThinkingActivity(): AgentActivityEvent {
  return {
    id: `thinking-${Date.now()}`,
    type: "thinking",
    status: "running",
    label: "Thinking",
    detail: "Preparing context and deciding whether tools are needed",
    createdAt: Date.now()
  };
}

function upsertActivity(activity: AgentActivityEvent[], event: AgentActivityEvent): AgentActivityEvent[] {
  const index = activity.findIndex((item) => item.id === event.id);
  if (index < 0) return [...activity, event];
  return activity.map((item, itemIndex) => (itemIndex === index ? event : item));
}
