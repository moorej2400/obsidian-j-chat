import { requestUrl } from "obsidian";
import type { JChatSettings } from "../pluginSettings";
import { AiSdkAgentProvider } from "./aiSdkAgentProvider";
import { CodexSdkProvider } from "./codexSdkProvider";
import { OpenAICompatibleProvider } from "./openAICompatibleProvider";
import type { AiProvider } from "./types";

export type ProviderRuntimeOptions = {
  pluginRuntimeDir: string;
  vaultBasePath: string;
};

export function createAiProvider(settings: JChatSettings, runtime: ProviderRuntimeOptions): AiProvider {
  if (settings.provider === "codex-sdk") {
    return new CodexSdkProvider(settings.codex, undefined, runtime.pluginRuntimeDir, runtime.vaultBasePath);
  }

  if (settings.provider === "ai-sdk-agent") {
    return new AiSdkAgentProvider(settings.openai);
  }

  return new OpenAICompatibleProvider(settings.openai, async (request) => requestUrl(request));
}
