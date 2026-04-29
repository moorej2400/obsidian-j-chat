export type EditAction =
  | { type: "replace-selection"; text: string }
  | { type: "replace-file"; text: string }
  | { type: "append"; text: string }
  | { type: "prepend"; text: string };

export type SelectionRange = {
  from: number;
  to: number;
};

const EDIT_BLOCK_PATTERN = /```j-chat-edit\s*([\s\S]*?)```/g;

export function parseEditActions(content: string): EditAction[] {
  const actions: EditAction[] = [];
  for (const match of content.matchAll(EDIT_BLOCK_PATTERN)) {
    const parsed = JSON.parse(match[1].trim()) as unknown;
    if (!isRecord(parsed) || !Array.isArray(parsed.actions)) continue;
    actions.push(...parsed.actions.filter(isEditAction));
  }
  return actions;
}

export function stripEditActionBlocks(content: string): string {
  return content.replace(EDIT_BLOCK_PATTERN, "").trim();
}

export function applyEditAction(content: string, selection: SelectionRange | null, action: EditAction): string {
  switch (action.type) {
    case "replace-file":
      return action.text;
    case "append":
      return `${content}${action.text}`;
    case "prepend":
      return `${action.text}${content}`;
    case "replace-selection": {
      const range = selection ?? { from: 0, to: content.length };
      return `${content.slice(0, range.from)}${action.text}${content.slice(range.to)}`;
    }
  }
}

function isEditAction(value: unknown): value is EditAction {
  if (!isRecord(value) || typeof value.type !== "string" || typeof value.text !== "string") return false;
  return value.type === "replace-selection" || value.type === "replace-file" || value.type === "append" || value.type === "prepend";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

