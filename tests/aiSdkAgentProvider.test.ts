import { describe, expect, it, vi } from "vitest";
import { AiSdkAgentProvider, createAiSdkAgentTools } from "../src/providers/aiSdkAgentProvider";
import type { AgentToolRuntime } from "../src/providers/types";

function createRuntime(): AgentToolRuntime {
  return {
    readCurrentFile: vi.fn(async () => ({ path: "current.md", content: "# Current" })),
    readNote: vi.fn(async ({ path }) => ({ path, content: `# ${path}` })),
    searchVault: vi.fn(async ({ query }) => [{ path: "match.md", snippet: `found ${query}` }]),
    replaceSelection: vi.fn(async ({ text }) => `replaced ${text}`),
    replaceCurrentFile: vi.fn(async ({ text }) => `replaced file ${text}`),
    appendCurrentFile: vi.fn(async ({ text }) => `appended ${text}`),
    prependCurrentFile: vi.fn(async ({ text }) => `prepended ${text}`),
    createNote: vi.fn(async ({ path }) => `created ${path}`)
  };
}

describe("AiSdkAgentProvider", () => {
  it("runs the AI SDK adapter with OpenAI-compatible settings and agent tools", async () => {
    const runAgent = vi.fn(async () => ({ content: "done", raw: { stepCount: 2 } }));
    const provider = new AiSdkAgentProvider({
      baseUrl: "https://api.example.test/v1/",
      apiKey: "secret",
      model: "model-a",
      extraHeadersJson: "{\"X-Test\":\"yes\"}"
    }, runAgent);

    const response = await provider.sendMessage({
      messages: [{ role: "user", content: "Update the note" }],
      context: "Visible context",
      agentTools: createRuntime()
    });

    expect(response.content).toBe("done");
    expect(runAgent).toHaveBeenCalledWith(expect.objectContaining({
      baseUrl: "https://api.example.test/v1",
      apiKey: "secret",
      model: "model-a",
      extraHeaders: { "X-Test": "yes" },
      system: expect.stringContaining("Use the provided tools"),
      messages: [{ role: "user", content: "Update the note" }],
      context: "Visible context",
      tools: expect.objectContaining({
        read_current_file: expect.any(Object),
        search_vault: expect.any(Object),
        replace_current_file: expect.any(Object),
        create_note: expect.any(Object)
      })
    }));
  });
});

describe("createAiSdkAgentTools", () => {
  it("exposes Obsidian actions as executable AI SDK tools", async () => {
    const runtime = createRuntime();
    const tools = createAiSdkAgentTools(runtime);

    await expect(tools.read_note.execute?.({ path: "Project.md" }, {} as never)).resolves.toEqual({
      path: "Project.md",
      content: "# Project.md"
    });
    await expect(tools.search_vault.execute?.({ query: "dispatch" }, {} as never)).resolves.toEqual([
      { path: "match.md", snippet: "found dispatch" }
    ]);
    await expect(tools.append_current_file.execute?.({ text: "\nDone" }, {} as never)).resolves.toBe("appended \nDone");

    expect(runtime.readNote).toHaveBeenCalledWith({ path: "Project.md" });
    expect(runtime.searchVault).toHaveBeenCalledWith({ query: "dispatch" });
    expect(runtime.appendCurrentFile).toHaveBeenCalledWith({ text: "\nDone" });
  });

  it("emits activity events around tool execution", async () => {
    const runtime = createRuntime();
    const activity = vi.fn();
    const tools = createAiSdkAgentTools(runtime, activity);

    await expect(tools.search_vault.execute?.({ query: "dispatch" }, {} as never)).resolves.toEqual([
      { path: "match.md", snippet: "found dispatch" }
    ]);

    expect(activity).toHaveBeenCalledWith(expect.objectContaining({
      type: "tool",
      status: "running",
      toolName: "search_vault",
      label: "Search vault"
    }));
    expect(activity).toHaveBeenCalledWith(expect.objectContaining({
      type: "tool",
      status: "complete",
      toolName: "search_vault",
      label: "Search vault"
    }));
  });
});
