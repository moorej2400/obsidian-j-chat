import type { OpenAICompatibleSettings } from "../pluginSettings";
import type { AiProvider, AiProviderRequest, AiProviderResponse, ChatMessage } from "./types";

export type ObsidianRequest = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  throw?: boolean;
};

export type ObsidianRequestResponse = {
  status: number;
  json?: unknown;
  text?: string;
};

export type ObsidianRequestSender = (request: ObsidianRequest) => Promise<ObsidianRequestResponse>;

export class OpenAICompatibleProvider implements AiProvider {
  readonly id = "openai-compatible";

  constructor(
    private readonly settings: OpenAICompatibleSettings,
    private readonly sendRequest: ObsidianRequestSender
  ) {}

  async sendMessage(request: AiProviderRequest): Promise<AiProviderResponse> {
    const url = `${this.settings.baseUrl.replace(/\/+$/, "")}/chat/completions`;
    const headers = this.buildHeaders();
    const body = JSON.stringify({
      model: this.settings.model,
      messages: this.buildMessages(request.messages, request.context)
    });

    const response = await this.sendRequest({ url, method: "POST", headers, body, throw: false });
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`AI endpoint returned HTTP ${response.status}: ${response.text ?? ""}`.trim());
    }

    const content = extractOpenAIContent(response.json);
    return { content, raw: response.json };
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };

    if (this.settings.apiKey.length > 0) {
      headers.Authorization = `Bearer ${this.settings.apiKey}`;
    }

    Object.assign(headers, parseExtraHeaders(this.settings.extraHeadersJson));
    return headers;
  }

  private buildMessages(messages: ChatMessage[], context: string): ChatMessage[] {
    return [
      {
        role: "system",
        content: `${SYSTEM_PROMPT}\n\n${context}`.trim()
      },
      ...messages
    ];
  }
}

export const SYSTEM_PROMPT = `You are an AI assistant inside Obsidian.
Use the provided vault context when answering.
If the user asks you to edit the current note, return the normal explanation plus a fenced j-chat-edit JSON block.
Do not invent additional edit fields because the plugin applies this schema directly.
The edit schema is {"actions":[{"type":"replace-selection"|"replace-file"|"append"|"prepend","text":"..."}]}.`;

export function parseExtraHeaders(value: string): Record<string, string> {
  if (value.trim().length === 0) return {};

  const parsed = JSON.parse(value) as unknown;
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Extra headers must be a JSON object.");
  }

  return Object.fromEntries(
    Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string")
  );
}

export function extractOpenAIContent(value: unknown): string {
  if (!isRecord(value)) return "";
  const choices = value.choices;
  if (!Array.isArray(choices) || choices.length === 0) return "";
  const first = choices[0];
  if (!isRecord(first)) return "";
  const message = first.message;
  if (isRecord(message) && typeof message.content === "string") return message.content;
  if (typeof first.text === "string") return first.text;
  return "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
