export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type AgentToolRuntime = {
  readCurrentFile(): Promise<{ path: string | null; content: string }>;
  readNote(input: { path: string }): Promise<{ path: string; content: string }>;
  searchVault(input: { query: string }): Promise<Array<{ path: string; snippet: string }>>;
  replaceSelection(input: { text: string }): Promise<string>;
  replaceCurrentFile(input: { text: string }): Promise<string>;
  appendCurrentFile(input: { text: string }): Promise<string>;
  prependCurrentFile(input: { text: string }): Promise<string>;
  createNote(input: { path: string; content: string }): Promise<string>;
};

export type AgentActivityEvent = {
  id: string;
  type: "thinking" | "tool";
  status: "running" | "complete" | "error";
  label: string;
  detail?: string;
  toolName?: string;
  createdAt: number;
};

export type AiProviderRequest = {
  messages: ChatMessage[];
  context: string;
  agentTools?: AgentToolRuntime;
  onActivity?: (event: AgentActivityEvent) => void;
  signal?: AbortSignal;
};

export type AiProviderResponse = {
  content: string;
  raw?: unknown;
};

export interface AiProvider {
  readonly id: string;
  sendMessage(request: AiProviderRequest): Promise<AiProviderResponse>;
}
