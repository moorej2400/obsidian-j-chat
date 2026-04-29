import { describe, expect, it, vi } from "vitest";
import { OpenAICompatibleProvider } from "../src/providers/openAICompatibleProvider";

describe("OpenAICompatibleProvider", () => {
  it("posts ChatGPT-compatible messages to a configurable base URL", async () => {
    const send = vi.fn(async () => ({
      status: 200,
      json: {
        choices: [{ message: { content: "hello" } }]
      }
    }));
    const provider = new OpenAICompatibleProvider({
      baseUrl: "https://api.example.test/v1",
      apiKey: "secret",
      model: "model-a",
      extraHeadersJson: "{\"X-Test\":\"yes\"}"
    }, send);

    const response = await provider.sendMessage({
      messages: [{ role: "user", content: "Hi" }],
      context: "Context"
    });

    expect(response.content).toBe("hello");
    expect(send).toHaveBeenCalledWith(expect.objectContaining({
      url: "https://api.example.test/v1/chat/completions",
      method: "POST",
      headers: expect.objectContaining({
        Authorization: "Bearer secret",
        "X-Test": "yes"
      })
    }));
  });
});

