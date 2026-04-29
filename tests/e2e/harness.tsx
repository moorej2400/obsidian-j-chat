import * as React from "react";
import { createRoot } from "react-dom/client";
import { ChatPanel, type ChatPanelSnapshot } from "../../src/ui/ChatPanel";
import type { ChatItem } from "../../src/chat/chatTypes";

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
  const [snapshot, setSnapshot] = React.useState<ChatPanelSnapshot>({
    items: [],
    attachments: [],
    restrictToCurrentFile: true,
    isSending: false,
    error: null
  });

  async function sendMessage(content: string) {
    const userItem = createItem("user", content);
    setSnapshot((current) => ({ ...current, items: [...current.items, userItem], isSending: true }));

    await new Promise((resolve) => window.setTimeout(resolve, 80));

    setSnapshot((current) => {
      const assistant = current.restrictToCurrentFile
        ? createAssistantItem(`Mock AI saw ${activeFile.basename} and the selected text from the editor.`)
        : createAssistantItem(
            `Vault context included Architecture.md and Auth Notes.md.\n\n| Source | Match |\n| --- | --- |\n| Architecture.md | provider wiring |\n| Auth Notes.md | Codex auth scaffold |\n\n2 edits applied through mock edit service.`,
            2
          );

      return {
        ...current,
        items: [...current.items, assistant],
        isSending: false
      };
    });
  }

  function attachFile() {
    setSnapshot((current) => ({
      ...current,
      attachments: current.attachments.some((file) => file.path === vaultFiles[0].path)
        ? current.attachments
        : [...current.attachments, vaultFiles[0]]
    }));
  }

  return (
    <ChatPanel
      snapshot={snapshot}
      providerStatus={{ label: "Mock OpenAI API", ready: true, detail: "Playwright harness provider" }}
      currentFile={{ path: activeFile.path, basename: activeFile.basename }}
      hasSelection={true}
      selectedText={selectedText}
      onSend={sendMessage}
      onToggleRestrictToCurrentFile={(value) => setSnapshot((current) => ({ ...current, restrictToCurrentFile: value }))}
      onAttachFile={attachFile}
      onRemoveAttachment={(path) =>
        setSnapshot((current) => ({
          ...current,
          attachments: current.attachments.filter((file) => file.path !== path)
        }))
      }
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

