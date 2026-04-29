import { Codex, type ApprovalMode, type ModelReasoningEffort, type SandboxMode } from "@openai/codex-sdk";
import type { CodexSdkSettings } from "../pluginSettings";
import { SYSTEM_PROMPT } from "./openAICompatibleProvider";
import type { AiProvider, AiProviderRequest, AiProviderResponse } from "./types";

export type CodexRunInput = {
  prompt: string;
  workingDirectory: string;
  model: string;
  approvalPolicy: ApprovalMode;
  sandboxMode: SandboxMode;
  modelReasoningEffort: ModelReasoningEffort;
  apiKey: string;
  baseUrl: string;
};

export type CodexRunner = (input: CodexRunInput) => Promise<string>;

export class CodexSdkProvider implements AiProvider {
  readonly id = "codex-sdk";

  constructor(
    private readonly settings: CodexSdkSettings,
    private readonly runCodex: CodexRunner = defaultCodexRunner
  ) {}

  async sendMessage(request: AiProviderRequest): Promise<AiProviderResponse> {
    const prompt = buildCodexPrompt(request);
    const content = await this.runCodex({
      prompt,
      workingDirectory: this.settings.workingDirectory || process.cwd(),
      model: this.settings.model,
      approvalPolicy: this.settings.approvalPolicy,
      sandboxMode: this.settings.sandboxMode,
      modelReasoningEffort: this.settings.modelReasoningEffort,
      apiKey: this.settings.apiKey,
      baseUrl: this.settings.baseUrl
    });

    return { content };
  }
}

export function buildCodexPrompt(request: AiProviderRequest): string {
  const transcript = request.messages.map((message) => `${message.role.toUpperCase()}: ${message.content}`).join("\n\n");
  return `${SYSTEM_PROMPT}

The vault context below is the only source material Codex should use in v1.
The plugin is mediating all vault access. Do not assume direct filesystem access to the user's vault.

${request.context}

Conversation:
${transcript}`.trim();
}

async function defaultCodexRunner(input: CodexRunInput): Promise<string> {
  // Electron inherits a large app environment; keep Codex limited to the path
  // and explicit API credentials needed for this desktop-only provider.
  const env: Record<string, string> = {
    PATH: process.env.PATH ?? ""
  };
  if (input.apiKey.length > 0) env.OPENAI_API_KEY = input.apiKey;

  const codex = new Codex({
    apiKey: input.apiKey || undefined,
    baseUrl: input.baseUrl || undefined,
    env
  });
  const thread = codex.startThread({
    model: input.model,
    workingDirectory: input.workingDirectory,
    skipGitRepoCheck: true,
    approvalPolicy: input.approvalPolicy,
    sandboxMode: input.sandboxMode,
    modelReasoningEffort: input.modelReasoningEffort,
    networkAccessEnabled: false,
    webSearchMode: "disabled"
  });
  const turn = await thread.run(input.prompt);
  return turn.finalResponse;
}
