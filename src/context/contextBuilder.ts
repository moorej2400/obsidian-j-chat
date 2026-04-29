import type { ContextSettings } from "../pluginSettings";
import type { VaultSnippet } from "./vaultSearch";

export type ContextFile = {
  path: string;
  content: string;
};

export type BuildChatContextInput = {
  activeFile: ContextFile | null;
  selectedText: string;
  attachments: ContextFile[];
  retrievedSnippets: VaultSnippet[];
  restrictToCurrentFile: boolean;
  limits: Pick<ContextSettings, "maxActiveFileChars" | "maxSnippetChars">;
};

export function buildChatContext(input: BuildChatContextInput): string {
  const parts: string[] = ["# Obsidian Context"];

  if (input.activeFile) {
    parts.push(formatSection(`Current file: ${input.activeFile.path}`, truncateMiddle(input.activeFile.content, input.limits.maxActiveFileChars)));
  } else {
    parts.push("No active markdown file is open.");
  }

  if (input.selectedText.trim().length > 0) {
    parts.push(formatSection("Current editor selection", input.selectedText.trim()));
  }

  if (!input.restrictToCurrentFile) {
    for (const attachment of input.attachments) {
      parts.push(formatSection(`Attached file: ${attachment.path}`, truncateMiddle(attachment.content, input.limits.maxSnippetChars)));
    }

    for (const snippet of input.retrievedSnippets) {
      parts.push(formatSection(`Vault match: ${snippet.path} (score ${snippet.score})`, truncateMiddle(snippet.snippet, input.limits.maxSnippetChars)));
    }
  }

  return parts.join("\n\n");
}

function formatSection(title: string, body: string): string {
  return `## ${title}\n\n${body}`;
}

export function truncateMiddle(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value;
  const half = Math.floor((maxChars - 15) / 2);
  return `${value.slice(0, half)}\n...[truncated]...\n${value.slice(-half)}`;
}

