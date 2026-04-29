export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type AiProviderRequest = {
  messages: ChatMessage[];
  context: string;
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

