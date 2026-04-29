import { requestUrl } from "obsidian";
import type { JChatSettings } from "../pluginSettings";
import { CodexSdkProvider } from "./codexSdkProvider";
import { OpenAICompatibleProvider } from "./openAICompatibleProvider";
import type { AiProvider } from "./types";

export function createAiProvider(settings: JChatSettings): AiProvider {
  if (settings.provider === "codex-sdk") {
    return new CodexSdkProvider(settings.codex);
  }

  return new OpenAICompatibleProvider(settings.openai, async (request) => requestUrl(request));
}

