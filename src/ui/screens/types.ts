/**
 * Screen navigation model for the J Chat side panel.
 *
 * The panel is a single React tree that swaps between named "screens".
 * Most screens are sub-pages reached from the chat screen or settings.
 * The ChatPanel component owns the current screen in React state and
 * renders the appropriate screen component.
 *
 * TODO: When wiring real data, replace the placeholder types below with
 * actual settings/provider/session types from pluginSettings.ts and
 * chatSessions.ts. The current types mirror the mock's data shape so the
 * UI can be built before the backend is ready.
 */

/** Top-level screens accessible from the header or bottom nav. */
export type Screen =
  | "chat"
  | "sessions"
  | "settings"
  | "onboarding"
  // Settings sub-pages
  | "provider"
  | "context"
  | "editbeh"
  | "privacy"
  | "copilot"
  | "modes"
  | "modeEdit"
  | "skillsManage"
  | "skillEdit"
  | "skillNew"
  // Chat-adjacent
  | "skills";

// ─────────────────────────────────────────────────────────────────────────
// Skills (slash commands / custom instructions)
// TODO: Move this type into a dedicated skills module once persistence is added.
// ─────────────────────────────────────────────────────────────────────────

export type Skill = {
  id: string;
  title: string;
  /** Hex or oklch color for the skill's accent dot. */
  color: string;
  /** Full markdown text including front matter (name:, description:). */
  text: string;
};

// ─────────────────────────────────────────────────────────────────────────
// Modes (bundles of system prompt + model + tools + temperature)
// TODO: Move this type into a dedicated modes module once persistence is added.
// ─────────────────────────────────────────────────────────────────────────

export type ToolKey = "read" | "apply" | "search" | "fetch";

export type Mode = {
  id: string;
  name: string;
  /** Emoji or single-char icon. */
  icon: string;
  /** CSS color or var() for the icon background. */
  tint: string;
  iconColor: string;
  desc: string;
  model: string;
  temp: number;
  prompt: string;
  tools: Record<ToolKey, boolean>;
};

// ─────────────────────────────────────────────────────────────────────────
// Provider config (mock shape — will be replaced by real provider settings)
// TODO: Unify with pluginSettings.ts when multi-provider support is added.
// ─────────────────────────────────────────────────────────────────────────

export type ProviderConfig = {
  name: string;
  detail: string;
  /** Status dot color: "var(--ok)" when connected, "var(--dim)" when not. */
  dot: string;
  initial: string;
  tint: string;
  connected: boolean;
  baseUrl: string;
  /** Masked key for display, e.g. "sk-ant-api03-••••••3f9a". */
  keyMask: string;
  /** Full key (only shown when user reveals). */
  keyFull: string;
};

// ─────────────────────────────────────────────────────────────────────────
// Quick settings row (composer expandable panel)
// TODO: Wire to real session-level settings (model, mode, style, preset).
// ─────────────────────────────────────────────────────────────────────────

export type QuickRowKind = "model" | "mode" | "style" | "preset";

export type QuickRow = {
  kind: QuickRowKind;
  label: string;
  value: string;
  /** Color dot for the row. */
  dot: string;
  onClick: (e?: React.MouseEvent<HTMLButtonElement>) => void;
};

// ─────────────────────────────────────────────────────────────────────────
// Context scope
// ─────────────────────────────────────────────────────────────────────────

export type Scope = "page" | "all";

// ─────────────────────────────────────────────────────────────────────────
// Edit behavior mode
// TODO: Wire to editing settings (replace the current boolean directApply).
// ─────────────────────────────────────────────────────────────────────────

export type EditScope = "preview" | "ask" | "auto";