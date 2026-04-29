import { describe, expect, it, vi } from "vitest";
import { CodexSdkProvider } from "../src/providers/codexSdkProvider";

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
      workingDirectory: "/tmp/non-vault"
    }));
  });
});
