# Vercel AI SDK Agent Implementation Plan

## Goal

Add a third j-chat provider mode, `ai-sdk-agent`, that uses the open-source Vercel AI SDK as the agent loop while keeping MCP as a future tool transport, not the framework layer.

The first implementation should solve the current non-agentic limitation: the assistant must be able to call tools to read/search/edit/create notes instead of relying only on truncated context and fenced edit blocks.

## Constraints

- Preserve the existing `openai-compatible` and `codex-sdk` provider paths.
- Reuse the current OpenAI-compatible settings for base URL, API key, model, and extra headers so the new provider does not require another credentials screen.
- Keep the provider boundary narrow enough to avoid a broad UI rewrite.
- Keep direct file mutation behind existing editing controls and explicit tool implementations.
- Do not use MCP as the agent framework. MCP can later become a source of tools behind the same registry.
- Build, test, and deploy the standalone plugin bundle after code changes.

## Phases

### Phase 1: Provider mode and tests

- Add `ai-sdk-agent` to `ProviderMode`.
- Normalize persisted settings so the new mode survives reloads.
- Add settings UI label/status text for the new provider.
- Add tests that fail before the new provider mode is recognized.

### Phase 2: AI SDK provider adapter

- Add dependencies: `ai` and `@ai-sdk/openai-compatible`.
- Implement `AiSdkAgentProvider` behind the existing `AiProvider` interface.
- Use Vercel AI SDK tool calling with bounded loop control.
- Convert j-chat messages/context into the AI SDK request shape.
- Keep the final response as `{ content, raw }` so existing chat rendering continues to work.

### Phase 3: Obsidian tool registry

- Add an `AgentToolRuntime` passed on each provider request.
- Expose initial tools:
  - `read_current_file`
  - `read_note`
  - `search_vault`
  - `replace_selection`
  - `replace_current_file`
  - `append_current_file`
  - `prepend_current_file`
  - `create_note`
- Implement tools in `ChatController` using existing vault/context/edit helpers.
- Keep edit-block parsing in place for older providers, but instruct the AI SDK agent to use tools for edits.

### Phase 4: Verification and deployment

- Run targeted tests as each slice goes green.
- Run full `npm test`.
- Run `npm run build`.
- Copy runtime artifacts into the target vault plugin folder per `AGENTS.md`.
- Run Obsidian CLI checks if available.

## Teamwork Note

The requested Teamwork run could not be launched because the Codex app MCP dispatcher for `teamwork` is returning `Transport closed` even after the local singleton server was restarted and verified. This implementation proceeds in the parent session so the feature can still be completed, with the blocker reported in the final summary.
