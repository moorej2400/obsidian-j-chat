export type ChatSource = {
  path: string;
  label: string;
};

export type AttachedFile = {
  path: string;
  content: string;
};

export type ChatItem = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
  sources?: ChatSource[];
  editCount?: number;
  error?: string;
};

