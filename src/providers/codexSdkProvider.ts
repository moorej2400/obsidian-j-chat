import type { CodexSdkSettings } from "../pluginSettings";
import { SYSTEM_PROMPT } from "./openAICompatibleProvider";
import type { AiProvider, AiProviderRequest, AiProviderResponse } from "./types";

type ApprovalMode = CodexSdkSettings["approvalPolicy"];
type SandboxMode = CodexSdkSettings["sandboxMode"];
type ModelReasoningEffort = CodexSdkSettings["modelReasoningEffort"];

type CodexEvent = {
  type: string;
  item?: { type?: string; text?: string };
  error?: { message?: string };
  message?: string;
};

type NodeRuntime = {
  spawn: typeof import("node:child_process").spawn;
  createInterface: typeof import("node:readline").createInterface;
  fs: typeof import("node:fs");
  os: typeof import("node:os");
  path: typeof import("node:path");
};

type RuntimePath = Pick<NodeRuntime, "path">;

export type CodexRunInput = {
  prompt: string;
  workingDirectory: string;
  runtimeDirectory: string;
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
    private readonly runCodex: CodexRunner = defaultCodexRunner,
    private readonly runtimeDirectory = "",
    private readonly vaultBasePath = ""
  ) {}

  async sendMessage(request: AiProviderRequest): Promise<AiProviderResponse> {
    const prompt = buildCodexPrompt(request);
    const content = await this.runCodex({
      prompt,
      workingDirectory: resolveCodexWorkingDirectory(this.settings.workingDirectory, this.vaultBasePath),
      runtimeDirectory: this.runtimeDirectory,
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
  const runtime = loadNodeRuntime();
  const workingDirectory = await ensureWorkingDirectory(input.workingDirectory, runtime);
  const codexPath = resolveBundledCodexPath(runtime, input.runtimeDirectory);
  await assertPathExists(runtime, codexPath, "Bundled Codex executable not found");
  await assertPathExists(runtime, workingDirectory, "Codex working directory not found");
  const child = runtime.spawn(codexPath, buildCodexExecArgs({ ...input, workingDirectory }), {
    env: buildCodexEnv(input),
    stdio: ["pipe", "pipe", "pipe"]
  });

  let spawnError: Error | null = null;
  child.once("error", (error) => {
    spawnError = error;
  });

  if (!child.stdin || !child.stdout) {
    child.kill();
    throw new Error("Codex CLI process did not expose stdin/stdout.");
  }

  child.stdin.write(input.prompt);
  child.stdin.end();

  const stderrChunks: Buffer[] = [];
  child.stderr?.on("data", (chunk: Buffer) => stderrChunks.push(chunk));

  const exitPromise = new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve) => {
    child.once("exit", (code, signal) => resolve({ code, signal }));
  });

  const rl = runtime.createInterface({ input: child.stdout, crlfDelay: Infinity });
  let finalResponse = "";
  let streamedError: string | null = null;

  try {
    for await (const line of rl) {
      if (line.trim().length === 0) continue;
      const event = parseCodexEvent(line);
      if (event.type === "item.completed" && event.item?.type === "agent_message") {
        finalResponse = event.item.text ?? "";
      } else if (event.type === "turn.failed") {
        streamedError = event.error?.message ?? "Codex turn failed.";
      } else if (event.type === "error") {
        streamedError = event.message ?? "Codex CLI returned an error.";
      }
    }
  } finally {
    rl.close();
  }

  if (spawnError) throw spawnError;
  const exit = await exitPromise;
  const stderr = Buffer.concat(stderrChunks).toString("utf8").trim();
  if (streamedError) throw new Error(formatCodexError(streamedError));
  if (exit.code !== 0 || exit.signal) {
    const detail = exit.signal ? `signal ${exit.signal}` : `code ${exit.code ?? 1}`;
    throw new Error(`Codex CLI exited with ${detail}${stderr ? `: ${stderr}` : ""}`);
  }

  return finalResponse;
}

export function buildCodexExecArgs(input: CodexRunInput): string[] {
  const args = ["exec", "--experimental-json"];
  if (input.baseUrl.trim().length > 0) {
    args.push("--config", `openai_base_url=${JSON.stringify(input.baseUrl)}`);
  }
  if (input.model.trim().length > 0) args.push("--model", input.model);
  args.push("--sandbox", input.sandboxMode);
  args.push("--cd", input.workingDirectory);
  args.push("--skip-git-repo-check");
  args.push("--config", `approval_policy=${JSON.stringify(input.approvalPolicy)}`);
  args.push("--config", `model_reasoning_effort=${JSON.stringify(input.modelReasoningEffort)}`);
  args.push("--config", "sandbox_workspace_write.network_access=false");
  args.push("--config", 'web_search="disabled"');
  return args;
}

export function resolveCodexWorkingDirectory(workingDirectory: string, vaultBasePath: string): string {
  const configured = workingDirectory.trim();
  if (configured.length > 0) return configured;
  // Obsidian can launch from C: on Windows even when the vault lives on E:.
  // A blank setting should follow the vault, not Electron's process cwd.
  return vaultBasePath.trim();
}

export function buildCodexEnv(input: Pick<CodexRunInput, "apiKey">): Record<string, string> {
  const env: Record<string, string> = {};
  for (const key of [
    "PATH",
    "HOME",
    "USER",
    "LOGNAME",
    "SHELL",
    "TMPDIR",
    "LANG",
    "LC_ALL",
    "CODEX_HOME",
    "XDG_CONFIG_HOME",
    "XDG_CACHE_HOME",
    "SSL_CERT_FILE",
    "SSL_CERT_DIR",
    "OPENAI_API_KEY",
    "CODEX_API_KEY"
  ]) {
    const value = process.env[key];
    if (value) env[key] = value;
  }

  env.CODEX_INTERNAL_ORIGINATOR_OVERRIDE = "obsidian_j_chat";
  if (input.apiKey.trim().length > 0) {
    env.CODEX_API_KEY = input.apiKey.trim();
    env.OPENAI_API_KEY = input.apiKey.trim();
  }
  return env;
}

function loadNodeRuntime(): NodeRuntime {
  const runtimeRequire = Function("return require")() as NodeRequire;
  return {
    spawn: runtimeRequire("node:child_process").spawn,
    createInterface: runtimeRequire("node:readline").createInterface,
    fs: runtimeRequire("node:fs"),
    os: runtimeRequire("node:os"),
    path: runtimeRequire("node:path")
  };
}

async function ensureWorkingDirectory(workingDirectory: string, runtime: NodeRuntime): Promise<string> {
  if (workingDirectory.trim().length > 0) return workingDirectory;
  const directory = runtime.path.join(runtime.os.tmpdir(), "obsidian-j-chat-codex-workspace");
  await runtime.fs.promises.mkdir(directory, { recursive: true });
  return directory;
}

export function resolveBundledCodexPath(
  runtime: RuntimePath,
  runtimeDirectory: string,
  platform: NodeJS.Platform = process.platform,
  arch: NodeJS.Architecture = process.arch
): string {
  const override = process.env.J_CHAT_CODEX_PATH;
  if (override?.trim()) return override.trim();
  if (!runtimeDirectory.trim()) {
    throw new Error("Codex runtime directory was not provided by the Obsidian plugin host.");
  }
  const binary = platform === "win32" ? "codex.exe" : "codex";
  return runtime.path.join(runtimeDirectory, "codex-runtime", targetTriple(platform, arch), "codex", binary);
}

function targetTriple(platform: NodeJS.Platform, arch: NodeJS.Architecture): string {
  if (platform === "darwin" && arch === "arm64") return "aarch64-apple-darwin";
  if (platform === "darwin" && arch === "x64") return "x86_64-apple-darwin";
  if ((platform === "linux" || platform === "android") && arch === "arm64") return "aarch64-unknown-linux-musl";
  if ((platform === "linux" || platform === "android") && arch === "x64") return "x86_64-unknown-linux-musl";
  if (platform === "win32" && arch === "arm64") return "aarch64-pc-windows-msvc";
  if (platform === "win32" && arch === "x64") return "x86_64-pc-windows-msvc";
  throw new Error(`Codex SDK provider is not available on ${platform}/${arch}.`);
}

async function assertPathExists(runtime: NodeRuntime, path: string, message: string): Promise<void> {
  try {
    await runtime.fs.promises.access(path);
  } catch (error) {
    throw new Error(`${message}: ${path}`, { cause: error });
  }
}

function parseCodexEvent(line: string): CodexEvent {
  try {
    return JSON.parse(line) as CodexEvent;
  } catch (error) {
    throw new Error(`Codex CLI returned non-JSON output: ${line}`, { cause: error });
  }
}

function formatCodexError(message: string): string {
  try {
    const parsed = JSON.parse(message) as { error?: { message?: string } };
    return parsed.error?.message ?? message;
  } catch {
    return message;
  }
}
