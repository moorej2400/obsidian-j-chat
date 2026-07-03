import { describe, expect, it, vi } from "vitest";
import path from "node:path";
import { buildCodexEnv, buildCodexExecArgs, CodexSdkProvider, resolveBundledCodexPath } from "../src/providers/codexSdkProvider";

describe("CodexSdkProvider", () => {
  it("builds a plugin-mediated prompt without granting vault filesystem access", async () => {
    const runCodex = vi.fn(async () => "answer");
    const provider = new CodexSdkProvider({
      apiKey: "",
      baseUrl: "",
      model: "gpt-5.1-codex",
      workingDirectory: "/tmp/non-vault",
      approvalPolicy: "never",
      sandboxMode: "read-only",
      modelReasoningEffort: "medium"
    }, runCodex);

    const response = await provider.sendMessage({
      messages: [{ role: "user", content: "Edit this" }],
      context: "Current file context"
    });

    expect(response.content).toBe("answer");
    expect(runCodex).toHaveBeenCalledWith(expect.objectContaining({
      prompt: expect.stringContaining("Current file context"),
      workingDirectory: "/tmp/non-vault",
      runtimeDirectory: ""
    }));
  });

  it("uses the Obsidian vault path as the default Codex working directory", async () => {
    const runCodex = vi.fn(async () => "answer");
    const provider = new CodexSdkProvider({
      apiKey: "",
      baseUrl: "",
      model: "",
      workingDirectory: "",
      approvalPolicy: "never",
      sandboxMode: "read-only",
      modelReasoningEffort: "medium"
    }, runCodex, "C:\\Vault\\.obsidian\\plugins\\j-chat", "C:\\Vault");

    await provider.sendMessage({
      messages: [{ role: "user", content: "hello" }],
      context: "Current file context"
    });

    expect(runCodex).toHaveBeenCalledWith(expect.objectContaining({
      workingDirectory: "C:\\Vault"
    }));
  });

  it("keeps an explicit Codex working directory ahead of the vault default", async () => {
    const runCodex = vi.fn(async () => "answer");
    const provider = new CodexSdkProvider({
      apiKey: "",
      baseUrl: "",
      model: "",
      workingDirectory: "D:\\Separate Workspace",
      approvalPolicy: "never",
      sandboxMode: "read-only",
      modelReasoningEffort: "medium"
    }, runCodex, "C:\\Vault\\.obsidian\\plugins\\j-chat", "C:\\Vault");

    await provider.sendMessage({
      messages: [{ role: "user", content: "hello" }],
      context: "Current file context"
    });

    expect(runCodex).toHaveBeenCalledWith(expect.objectContaining({
      workingDirectory: "D:\\Separate Workspace"
    }));
  });

  it("omits --model when model is blank so ChatGPT auth can use the Codex default", () => {
    const args = buildCodexExecArgs({
      prompt: "hello",
      apiKey: "",
      baseUrl: "",
      model: "",
      workingDirectory: "/tmp/j-chat",
      runtimeDirectory: "/tmp/plugin",
      approvalPolicy: "never",
      sandboxMode: "read-only",
      modelReasoningEffort: "medium"
    });

    expect(args).not.toContain("--model");
    expect(args).toContain("--skip-git-repo-check");
  });

  it("preserves Codex auth environment and maps explicit API keys to CODEX_API_KEY", () => {
    const originalHome = process.env.HOME;
    process.env.HOME = "/Users/tester";

    try {
      const env = buildCodexEnv({ apiKey: "secret" });
      expect(env.HOME).toBe("/Users/tester");
      expect(env.CODEX_API_KEY).toBe("secret");
      expect(env.OPENAI_API_KEY).toBe("secret");
    } finally {
      if (originalHome === undefined) {
        delete process.env.HOME;
      } else {
        process.env.HOME = originalHome;
      }
    }
  });

  it("resolves the Windows x64 bundled Codex executable path", () => {
    const runtime = { path: path.win32 };

    expect(resolveBundledCodexPath(
      runtime,
      "C:\\Vault\\.obsidian\\plugins\\j-chat",
      "win32",
      "x64"
    )).toBe("C:\\Vault\\.obsidian\\plugins\\j-chat\\codex-runtime\\x86_64-pc-windows-msvc\\codex\\codex.exe");
  });
});
