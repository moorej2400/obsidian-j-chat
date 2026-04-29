export type ProviderMode = "openai-compatible" | "codex-sdk";

export type OpenAICompatibleSettings = {
  baseUrl: string;
  apiKey: string;
  model: string;
  extraHeadersJson: string;
};

export type CodexSdkSettings = {
  apiKey: string;
  baseUrl: string;
  model: string;
  workingDirectory: string;
  approvalPolicy: "never" | "on-request" | "on-failure" | "untrusted";
  sandboxMode: "read-only" | "workspace-write" | "danger-full-access";
  modelReasoningEffort: "minimal" | "low" | "medium" | "high" | "xhigh";
};

export type ContextSettings = {
  maxActiveFileChars: number;
  maxRetrievedFiles: number;
  maxSnippetChars: number;
};

export type EditingSettings = {
  directApply: boolean;
};

export type JChatSettings = {
  provider: ProviderMode;
  openai: OpenAICompatibleSettings;
  codex: CodexSdkSettings;
  context: ContextSettings;
  editing: EditingSettings;
};

export const DEFAULT_SETTINGS: JChatSettings = {
  provider: "openai-compatible",
  openai: {
    baseUrl: "https://api.openai.com/v1",
    apiKey: "",
    model: "gpt-5.1",
    extraHeadersJson: ""
  },
  codex: {
    apiKey: "",
    baseUrl: "",
    model: "gpt-5.1-codex",
    workingDirectory: "",
    approvalPolicy: "never",
    sandboxMode: "read-only",
    modelReasoningEffort: "medium"
  },
  context: {
    maxActiveFileChars: 24000,
    maxRetrievedFiles: 6,
    maxSnippetChars: 2200
  },
  editing: {
    directApply: true
  }
};

const PROVIDERS = new Set<ProviderMode>(["openai-compatible", "codex-sdk"]);
const APPROVAL_POLICIES = new Set<CodexSdkSettings["approvalPolicy"]>(["never", "on-request", "on-failure", "untrusted"]);
const SANDBOX_MODES = new Set<CodexSdkSettings["sandboxMode"]>(["read-only", "workspace-write", "danger-full-access"]);
const REASONING_EFFORTS = new Set<CodexSdkSettings["modelReasoningEffort"]>(["minimal", "low", "medium", "high", "xhigh"]);

export function normalizeSettings(raw: unknown): JChatSettings {
  const value = isRecord(raw) ? raw : {};
  const openai = isRecord(value.openai) ? value.openai : {};
  const codex = isRecord(value.codex) ? value.codex : {};
  const context = isRecord(value.context) ? value.context : {};
  const editing = isRecord(value.editing) ? value.editing : {};

  return {
    provider: enumValue(value.provider, PROVIDERS, DEFAULT_SETTINGS.provider),
    openai: {
      baseUrl: trimmed(openai.baseUrl, DEFAULT_SETTINGS.openai.baseUrl),
      apiKey: trimmed(openai.apiKey, DEFAULT_SETTINGS.openai.apiKey),
      model: trimmed(openai.model, DEFAULT_SETTINGS.openai.model),
      extraHeadersJson: trimmed(openai.extraHeadersJson, DEFAULT_SETTINGS.openai.extraHeadersJson)
    },
    codex: {
      apiKey: trimmed(codex.apiKey, DEFAULT_SETTINGS.codex.apiKey),
      baseUrl: trimmed(codex.baseUrl, DEFAULT_SETTINGS.codex.baseUrl),
      model: trimmed(codex.model, DEFAULT_SETTINGS.codex.model),
      workingDirectory: trimmed(codex.workingDirectory, DEFAULT_SETTINGS.codex.workingDirectory),
      approvalPolicy: enumValue(codex.approvalPolicy, APPROVAL_POLICIES, DEFAULT_SETTINGS.codex.approvalPolicy),
      sandboxMode: enumValue(codex.sandboxMode, SANDBOX_MODES, DEFAULT_SETTINGS.codex.sandboxMode),
      modelReasoningEffort: enumValue(codex.modelReasoningEffort, REASONING_EFFORTS, DEFAULT_SETTINGS.codex.modelReasoningEffort)
    },
    context: {
      maxActiveFileChars: boundedNumber(context.maxActiveFileChars, DEFAULT_SETTINGS.context.maxActiveFileChars, 1000, 100000),
      maxRetrievedFiles: boundedNumber(context.maxRetrievedFiles, DEFAULT_SETTINGS.context.maxRetrievedFiles, 0, 20),
      maxSnippetChars: boundedNumber(context.maxSnippetChars, DEFAULT_SETTINGS.context.maxSnippetChars, 200, 12000)
    },
    editing: {
      directApply: typeof editing.directApply === "boolean" ? editing.directApply : DEFAULT_SETTINGS.editing.directApply
    }
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function trimmed(value: unknown, fallback: string): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function enumValue<T extends string>(value: unknown, values: Set<T>, fallback: T): T {
  return typeof value === "string" && values.has(value as T) ? (value as T) : fallback;
}

function boundedNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  const rounded = Math.round(value);
  return rounded >= min && rounded <= max ? rounded : fallback;
}

