import type { AttachedFile, ChatItem } from "./chatTypes";

export type ChatSession = {
  id: string;
  title: string;
  items: ChatItem[];
  attachments: AttachedFile[];
  restrictToCurrentFile: boolean;
  createdAt: number;
  updatedAt: number;
};

export type ChatHistoryState = {
  activeSessionId: string;
  sessions: ChatSession[];
};

export type ChatSessionSummary = {
  id: string;
  title: string;
  messageCount: number;
  updatedAt: number;
  isActive: boolean;
};

export function createInitialChatHistory(now = Date.now()): ChatHistoryState {
  const session = createChatSession({ now });
  return {
    activeSessionId: session.id,
    sessions: [session]
  };
}

export function createChatSession(input: { id?: string; title?: string; now?: number } = {}): ChatSession {
  const now = input.now ?? Date.now();
  return {
    id: input.id ?? createSessionId(),
    title: normalizeTitle(input.title, "New chat"),
    items: [],
    attachments: [],
    restrictToCurrentFile: true,
    createdAt: now,
    updatedAt: now
  };
}

export function createNewActiveSession(history: ChatHistoryState, now = Date.now()): ChatHistoryState {
  const session = createChatSession({ now });
  return {
    activeSessionId: session.id,
    sessions: [session, ...history.sessions]
  };
}

export function selectSession(history: ChatHistoryState, sessionId: string): ChatHistoryState {
  if (!history.sessions.some((session) => session.id === sessionId)) return history;
  return { ...history, activeSessionId: sessionId };
}

export function deleteSession(history: ChatHistoryState, sessionId: string): ChatHistoryState {
  if (history.sessions.length <= 1) return history;
  if (!history.sessions.some((session) => session.id === sessionId)) return history;

  const sessions = history.sessions.filter((session) => session.id !== sessionId);
  const activeSessionId =
    history.activeSessionId === sessionId ? pickActiveSessionId(sessions) : history.activeSessionId;

  return { activeSessionId, sessions };
}

export function renameSession(history: ChatHistoryState, sessionId: string, title: string, now = Date.now()): ChatHistoryState {
  return updateSession(history, sessionId, (session) => ({
    ...session,
    title: normalizeTitle(title, session.title),
    updatedAt: now
  }));
}

export function addMessageToActiveSession(history: ChatHistoryState, item: ChatItem, now = Date.now()): ChatHistoryState {
  return updateActiveSession(history, (session) => ({
    ...session,
    title: shouldAutoTitle(session) && item.role === "user" ? titleFromMessage(item.content) : session.title,
    items: [...session.items, item],
    updatedAt: now
  }));
}

export function updateActiveSession(
  history: ChatHistoryState,
  updater: (session: ChatSession) => ChatSession
): ChatHistoryState {
  return updateSession(history, history.activeSessionId, updater);
}

export function summarizeSessions(history: ChatHistoryState): ChatSessionSummary[] {
  return [...history.sessions]
    .sort((left, right) => right.updatedAt - left.updatedAt)
    .map((session) => ({
      id: session.id,
      title: session.title,
      messageCount: session.items.length,
      updatedAt: session.updatedAt,
      isActive: session.id === history.activeSessionId
    }));
}

export function normalizeChatHistory(raw: unknown): ChatHistoryState {
  if (!isRecord(raw) || !Array.isArray(raw.sessions)) return createInitialChatHistory();

  const sessions = raw.sessions.map(normalizeSession).filter((session): session is ChatSession => session !== null);
  if (sessions.length === 0) return createInitialChatHistory();

  const requestedActiveId = typeof raw.activeSessionId === "string" ? raw.activeSessionId : "";
  const activeSessionId = sessions.some((session) => session.id === requestedActiveId) ? requestedActiveId : sessions[0].id;
  return { activeSessionId, sessions };
}

function updateSession(
  history: ChatHistoryState,
  sessionId: string,
  updater: (session: ChatSession) => ChatSession
): ChatHistoryState {
  return {
    ...history,
    sessions: history.sessions.map((session) => (session.id === sessionId ? updater(session) : session))
  };
}

function normalizeSession(value: unknown): ChatSession | null {
  if (!isRecord(value) || typeof value.id !== "string") return null;
  const createdAt = numberOrNow(value.createdAt);
  return {
    id: value.id,
    title: normalizeTitle(value.title, "New chat"),
    items: Array.isArray(value.items) ? value.items.filter(isChatItem) : [],
    attachments: Array.isArray(value.attachments) ? value.attachments.filter(isAttachedFile) : [],
    restrictToCurrentFile: typeof value.restrictToCurrentFile === "boolean" ? value.restrictToCurrentFile : true,
    createdAt,
    updatedAt: numberOrNow(value.updatedAt, createdAt)
  };
}

function isChatItem(value: unknown): value is ChatItem {
  if (!isRecord(value)) return false;
  return typeof value.id === "string"
    && (value.role === "user" || value.role === "assistant" || value.role === "system")
    && typeof value.content === "string"
    && typeof value.createdAt === "number";
}

function isAttachedFile(value: unknown): value is AttachedFile {
  return isRecord(value) && typeof value.path === "string" && typeof value.content === "string";
}

function normalizeTitle(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function shouldAutoTitle(session: ChatSession): boolean {
  return session.items.length === 0 && session.title === "New chat";
}

function titleFromMessage(content: string): string {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized.length === 0) return "New chat";
  return normalized.length <= 42 ? normalized : `${normalized.slice(0, 39)}...`;
}

function numberOrNow(value: unknown, fallback = Date.now()): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function pickActiveSessionId(sessions: ChatSession[]): string {
  const [head] = [...sessions].sort((left, right) => right.updatedAt - left.updatedAt);
  if (!head) throw new Error("pickActiveSessionId requires at least one session");
  return head.id;
}

function createSessionId(): string {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
