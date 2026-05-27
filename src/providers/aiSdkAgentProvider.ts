import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { jsonSchema, stepCountIs, tool, ToolLoopAgent, type ToolSet } from "ai";
import type { OpenAICompatibleSettings } from "../pluginSettings";
import { parseExtraHeaders } from "./openAICompatibleProvider";
import type { AgentActivityEvent, AgentToolRuntime, AiProvider, AiProviderRequest, AiProviderResponse, ChatMessage } from "./types";

export type AiSdkAgentRunInput = {
  baseUrl: string;
  apiKey: string;
  model: string;
  extraHeaders: Record<string, string>;
  system: string;
  messages: ChatMessage[];
  context: string;
  tools: ToolSet;
  onActivity?: (event: AgentActivityEvent) => void;
  signal?: AbortSignal;
};

export type AiSdkAgentRunner = (input: AiSdkAgentRunInput) => Promise<AiProviderResponse>;

export class AiSdkAgentProvider implements AiProvider {
  readonly id = "ai-sdk-agent";

  constructor(
    private readonly settings: OpenAICompatibleSettings,
    private readonly runAgent: AiSdkAgentRunner = defaultAiSdkAgentRunner
  ) {}

  async sendMessage(request: AiProviderRequest): Promise<AiProviderResponse> {
    return this.runAgent({
      baseUrl: this.settings.baseUrl.replace(/\/+$/, ""),
      apiKey: this.settings.apiKey,
      model: this.settings.model,
      extraHeaders: parseExtraHeaders(this.settings.extraHeadersJson),
      system: AI_SDK_AGENT_SYSTEM_PROMPT,
      messages: request.messages,
      context: request.context,
      tools: createAiSdkAgentTools(request.agentTools, request.onActivity),
      onActivity: request.onActivity,
      signal: request.signal
    });
  }
}

export function createAiSdkAgentTools(runtime?: AgentToolRuntime, onActivity?: (event: AgentActivityEvent) => void): ToolSet {
  if (!runtime) return {};

  return {
    read_current_file: tool({
      description: "Read the full contents of the currently active Obsidian note.",
      inputSchema: emptyInputSchema(),
      execute: () => runTool("read_current_file", "Read current file", undefined, () => runtime.readCurrentFile(), onActivity)
    }),
    read_note: tool({
      description: "Read the full contents of a Markdown note by vault-relative path.",
      inputSchema: objectInputSchema<{ path: string }>(["path"]),
      execute: ({ path }) => runTool("read_note", "Read note", path, () => runtime.readNote({ path }), onActivity)
    }),
    search_vault: tool({
      description: "Search Markdown notes in the vault and return matching snippets.",
      inputSchema: objectInputSchema<{ query: string }>(["query"]),
      execute: ({ query }) => runTool("search_vault", "Search vault", query, () => runtime.searchVault({ query }), onActivity)
    }),
    replace_selection: tool({
      description: "Replace the selected text in the active note. This tool reports that no selection is available instead of editing the whole file.",
      inputSchema: objectInputSchema<{ text: string }>(["text"]),
      execute: ({ text }) => runTool("replace_selection", "Replace selection", `${text.length} chars`, () => runtime.replaceSelection({ text }), onActivity)
    }),
    replace_current_file: tool({
      description: "Replace the entire active note with new Markdown content.",
      inputSchema: objectInputSchema<{ text: string }>(["text"]),
      execute: ({ text }) => runTool("replace_current_file", "Replace current file", `${text.length} chars`, () => runtime.replaceCurrentFile({ text }), onActivity)
    }),
    append_current_file: tool({
      description: "Append Markdown content to the end of the active note.",
      inputSchema: objectInputSchema<{ text: string }>(["text"]),
      execute: ({ text }) => runTool("append_current_file", "Append current file", `${text.length} chars`, () => runtime.appendCurrentFile({ text }), onActivity)
    }),
    prepend_current_file: tool({
      description: "Prepend Markdown content to the start of the active note.",
      inputSchema: objectInputSchema<{ text: string }>(["text"]),
      execute: ({ text }) => runTool("prepend_current_file", "Prepend current file", `${text.length} chars`, () => runtime.prependCurrentFile({ text }), onActivity)
    }),
    create_note: tool({
      description: "Create a new Markdown note at a vault-relative path.",
      inputSchema: objectInputSchema<{ path: string; content: string }>(["path", "content"]),
      execute: ({ path, content }) => runTool("create_note", "Create note", path, () => runtime.createNote({ path, content }), onActivity)
    })
  };
}

async function runTool<T>(
  toolName: string,
  label: string,
  detail: string | undefined,
  execute: () => Promise<T>,
  onActivity?: (event: AgentActivityEvent) => void
): Promise<T> {
  const id = createActivityId(toolName);
  onActivity?.(createActivityEvent({ id, toolName, label, detail, status: "running" }));

  try {
    const result = await execute();
    onActivity?.(createActivityEvent({ id, toolName, label, detail, status: "complete" }));
    return result;
  } catch (error) {
    onActivity?.(createActivityEvent({
      id,
      toolName,
      label,
      detail: error instanceof Error ? error.message : String(error),
      status: "error"
    }));
    throw error;
  }
}

function createActivityEvent(input: {
  id: string;
  toolName: string;
  label: string;
  detail?: string;
  status: AgentActivityEvent["status"];
}): AgentActivityEvent {
  return {
    id: input.id,
    type: "tool",
    status: input.status,
    toolName: input.toolName,
    label: input.label,
    detail: input.detail,
    createdAt: Date.now()
  };
}

function createActivityId(toolName: string): string {
  return `${toolName}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function defaultAiSdkAgentRunner(input: AiSdkAgentRunInput): Promise<AiProviderResponse> {
  const provider = createOpenAICompatible({
    baseURL: input.baseUrl,
    name: "j-chat",
    apiKey: input.apiKey.length > 0 ? input.apiKey : undefined,
    headers: input.extraHeaders
  });
  const agent = new ToolLoopAgent({
    model: provider(input.model),
    instructions: input.system,
    tools: input.tools,
    stopWhen: stepCountIs(8)
  });
  const result = await agent.generate({
    messages: buildAgentMessages(input.messages, input.context),
    abortSignal: input.signal
  });

  return { content: result.text, raw: result };
}

function buildAgentMessages(messages: ChatMessage[], context: string): ChatMessage[] {
  return [
    {
      role: "user",
      content: `Visible Obsidian context:\n\n${context}`
    },
    ...messages
  ];
}

function emptyInputSchema() {
  return jsonSchema<Record<string, never>>({
    type: "object",
    properties: {},
    additionalProperties: false
  });
}

function objectInputSchema<T>(required: string[]) {
  return jsonSchema<T>({
    type: "object",
    properties: Object.fromEntries(required.map((key) => [key, { type: "string" }])),
    required,
    additionalProperties: false
  });
}

export const AI_SDK_AGENT_SYSTEM_PROMPT = `You are an agentic assistant inside Obsidian.
Use the provided tools whenever the visible context is incomplete or the user asks you to change notes.
Prefer reading the current file or searching the vault before claiming you cannot see enough context.
For edits, call the note editing tools instead of returning j-chat-edit JSON blocks.
Before broad destructive edits, explain the intended operation and ask the user to confirm.`;
