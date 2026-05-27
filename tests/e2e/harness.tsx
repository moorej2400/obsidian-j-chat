import * as React from "react";
import { createRoot } from "react-dom/client";
import { ChatPanel, type ChatPanelSnapshot } from "../../src/ui/ChatPanel";
import type { ChatItem } from "../../src/chat/chatTypes";
import type { AgentActivityEvent } from "../../src/providers/types";
import {
  addMessageToActiveSession,
  createInitialChatHistory,
  createNewActiveSession,
  renameSession,
  selectSession,
  summarizeSessions,
  updateActiveSession,
  type ChatHistoryState
} from "../../src/chat/chatSessions";

const activeFile = {
  path: "Projects/Project Brief.md",
  basename: "Project Brief.md",
  content: "# Project Brief\n\nShip the Obsidian side panel with current note context."
};

const selectedText = "selected acceptance criteria: send a chat message and render markdown";

const vaultFiles = [
  {
    path: "Architecture.md",
    content: "# Architecture\n\nThe side panel talks to mocked OpenAI-compatible and Codex providers."
  },
  {
    path: "Auth Notes.md",
    content: "# Auth Notes\n\nCodex SDK auth will need a real local credential before live e2e."
  }
];

function Harness() {
  const [history, setHistory] = React.useState<ChatHistoryState>(() => {
    const initial = createInitialChatHistory();
    return renameSession(initial, initial.activeSessionId, "Project Brief chat");
  });
  const [isSending, setIsSending] = React.useState(false);
  const [activity, setActivity] = React.useState<AgentActivityEvent[]>([]);

  async function sendMessage(content: string) {
    const userItem = createItem("user", content);
    setHistory((current) => addMessageToActiveSession(current, userItem));
    setIsSending(true);
    setActivity([
      {
        id: "thinking",
        type: "thinking",
        status: "running",
        label: "Thinking",
        detail: "Preparing context",
        createdAt: Date.now()
      },
      {
        id: "tool-search",
        type: "tool",
        status: "running",
        label: "Search vault",
        detail: "dispatch",
        toolName: "search_vault",
        createdAt: Date.now()
      }
    ]);

    await new Promise((resolve) => window.setTimeout(resolve, 450));

    setHistory((current) => {
      const active = current.sessions.find((session) => session.id === current.activeSessionId)!;
      const assistant = active.restrictToCurrentFile
        ? createAssistantItem(`Mock AI saw ${activeFile.basename} and the selected text from the editor.`)
        : createAssistantItem(
            `Vault context included Architecture.md and Auth Notes.md.\n\n| Source | Match |\n| --- | --- |\n| Architecture.md | provider wiring |\n| Auth Notes.md | Codex auth scaffold |\n\n2 edits applied through mock edit service.`,
            2
          );

      return addMessageToActiveSession(current, assistant);
    });
    setIsSending(false);
    setActivity([]);
  }

  function attachFile() {
    setHistory((current) =>
      updateActiveSession(current, (session) => ({
        ...session,
        attachments: session.attachments.some((file) => file.path === vaultFiles[0].path)
          ? session.attachments
          : [...session.attachments, vaultFiles[0]]
      }))
    );
  }

  const activeSession = history.sessions.find((session) => session.id === history.activeSessionId)!;
  const snapshot: ChatPanelSnapshot = {
    items: activeSession.items,
    attachments: activeSession.attachments,
    restrictToCurrentFile: activeSession.restrictToCurrentFile,
    activeSessionId: history.activeSessionId,
    sessions: summarizeSessions(history),
    activity,
    isSending,
    error: null
  };

  return (
    <ChatPanel
      snapshot={snapshot}
      providerStatus={{ label: "Mock OpenAI API", ready: true, detail: "Playwright harness provider" }}
      currentFile={{ path: activeFile.path, basename: activeFile.basename }}
      hasSelection={true}
      selectedText={selectedText}
      onSend={sendMessage}
      onToggleRestrictToCurrentFile={(value) =>
        setHistory((current) => updateActiveSession(current, (session) => ({ ...session, restrictToCurrentFile: value })))
      }
      onAttachFile={attachFile}
      onRemoveAttachment={(path) =>
        setHistory((current) =>
          updateActiveSession(current, (session) => ({
            ...session,
            attachments: session.attachments.filter((file) => file.path !== path)
          }))
        )
      }
      onNewSession={() => setHistory((current) => createNewActiveSession(current))}
      onSelectSession={(sessionId) => setHistory((current) => selectSession(current, sessionId))}
      onRenameSession={(sessionId, title) => setHistory((current) => renameSession(current, sessionId, title))}
    />
  );
}

function createAssistantItem(content: string, editCount = 0): ChatItem {
  return {
    ...createItem("assistant", content),
    editCount,
    sources: [
      { path: activeFile.path, label: "current" },
      { path: "Architecture.md", label: "attached" },
      { path: "Auth Notes.md", label: "vault match" }
    ]
  };
}

function createItem(role: ChatItem["role"], content: string): ChatItem {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
    createdAt: Date.now()
  };
}

createRoot(document.getElementById("root")!).render(<Harness />);
