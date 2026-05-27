import { describe, expect, it } from "vitest";
import {
  addMessageToActiveSession,
  createChatSession,
  createInitialChatHistory,
  createNewActiveSession,
  renameSession,
  selectSession
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
});
