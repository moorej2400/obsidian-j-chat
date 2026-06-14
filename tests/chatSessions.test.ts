import { describe, expect, it } from "vitest";
import {
  addMessageToActiveSession,
  createChatSession,
  createInitialChatHistory,
  createNewActiveSession,
  deleteSession,
  renameSession,
  selectSession,
  summarizeSessions
} from "../src/chat/chatSessions";

describe("chat sessions", () => {
  it("creates a new active chat without deleting the previous transcript", () => {
    const initial = createInitialChatHistory();
    const withMessage = addMessageToActiveSession(initial, {
      id: "user-1",
      role: "user",
      content: "First chat",
      createdAt: 1
    });

    const next = createNewActiveSession(withMessage);

    expect(next.sessions).toHaveLength(2);
    expect(next.activeSessionId).not.toBe(withMessage.activeSessionId);
    expect(next.sessions.find((session) => session.id === withMessage.activeSessionId)?.items).toHaveLength(1);
    expect(next.sessions.find((session) => session.id === next.activeSessionId)?.items).toEqual([]);
  });

  it("selects and renames an existing chat session", () => {
    const first = createChatSession({ id: "first", title: "First" });
    const second = createChatSession({ id: "second", title: "Second" });
    const history = {
      activeSessionId: "first",
      sessions: [first, second]
    };

    const selected = selectSession(history, "second");
    const renamed = renameSession(selected, "second", "Research thread");

    expect(selected.activeSessionId).toBe("second");
    expect(renamed.sessions.find((session) => session.id === "second")?.title).toBe("Research thread");
  });

  it("deletes a session and switches active when the active session is removed", () => {
    const first = createChatSession({ id: "first", title: "First", now: 1 });
    const second = createChatSession({ id: "second", title: "Second", now: 2 });
    const history = {
      activeSessionId: "first",
      sessions: [first, second]
    };

    const deleted = deleteSession(history, "first");

    expect(deleted.sessions).toHaveLength(1);
    expect(deleted.activeSessionId).toBe("second");
  });

  it("refuses to delete the last remaining session", () => {
    const history = createInitialChatHistory();
    const deleted = deleteSession(history, history.activeSessionId);

    expect(deleted).toEqual(history);
  });

  it("sorts session summaries by updatedAt descending", () => {
    const older = createChatSession({ id: "older", title: "Older", now: 1 });
    const newer = createChatSession({ id: "newer", title: "Newer", now: 5 });
    const summaries = summarizeSessions({
      activeSessionId: "older",
      sessions: [older, newer]
    });

    expect(summaries.map((session) => session.id)).toEqual(["newer", "older"]);
  });
});
