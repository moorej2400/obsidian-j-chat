import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, normalizeSettings } from "../src/pluginSettings";

describe("normalizeSettings", () => {
  it("keeps OpenAI-compatible endpoint settings configurable and trims unsafe whitespace", () => {
    const settings = normalizeSettings({
      provider: "openai-compatible",
      openai: {
        baseUrl: " https://api.example.test/v1/ ",
        apiKey: " secret ",
        model: " custom-model ",
        extraHeadersJson: " {\"X-Test\":\"yes\"} "
      }
    });

    expect(settings.provider).toBe("openai-compatible");
    expect(settings.openai.baseUrl).toBe("https://api.example.test/v1");
    expect(settings.openai.apiKey).toBe("secret");
    expect(settings.openai.model).toBe("custom-model");
    expect(settings.openai.extraHeadersJson).toBe("{\"X-Test\":\"yes\"}");
  });

  it("normalizes invalid numeric context limits back to safe defaults", () => {
    const settings = normalizeSettings({
      context: {
        maxActiveFileChars: -1,
        maxRetrievedFiles: 99,
        maxSnippetChars: 0
      }
    });

    expect(settings.context.maxActiveFileChars).toBe(DEFAULT_SETTINGS.context.maxActiveFileChars);
    expect(settings.context.maxRetrievedFiles).toBe(DEFAULT_SETTINGS.context.maxRetrievedFiles);
    expect(settings.context.maxSnippetChars).toBe(DEFAULT_SETTINGS.context.maxSnippetChars);
  });
});

