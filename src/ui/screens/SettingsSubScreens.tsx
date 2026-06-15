/**
 * Settings sub-pages: Context & Retrieval, Edit Behavior, Data & Privacy,
 * Provider Config, Copilot Auth, Modes, Mode Editor, Skills screens,
 * and Onboarding.
 *
 * Each sub-page is a self-contained screen reached from the SettingsScreen.
 * They all use the SubPageHeader for back navigation.
 *
 * TODO: All of these screens use placeholder data and local state. They need
 * to be wired to real settings persistence (pluginSettings.ts) and the
 * controller once the underlying features are implemented.
 */

import * as React from "react";
import {
  IconFile,
  IconLink,
  IconFolder,
  IconDatabase,
  IconTrash,
  IconDownload,
  IconDataPrivacy,
  IconCheck,
  IconChevronRight,
  IconPlus,
  IconSkill,
  IconGithub,
  IconKey,
  IconCheckCircle,
  IconCopy,
  IconExternalLink,
  IconClipboard,
  IconSettings,
  IconMaximize
} from "@/ui/icons";
import {
  SubPageHeader,
  SectionLabel,
  Card,
  CardRow,
  Toggle,
  ToggleRow,
  RadioCard,
  RangeSlider,
  Label,
  TextInput,
  BadgePill,
  StatusDot
} from "@/ui/primitives";
import type { Screen, Mode, ToolKey, ProviderConfig, Skill } from "@/ui/screens/types";

// ═══════════════════════════════════════════════════════════════════════════
// Context & Retrieval
// ═══════════════════════════════════════════════════════════════════════════

export function ContextRetrievalScreen({
  onBack,
  flags,
  onToggleFlag,
  ragOn,
  onToggleRag,
  ragTopK,
  onRagTopKChange,
  historyDays,
  onHistoryDaysChange,
  onClearHistory
}: {
  onBack: () => void;
  /** TODO: Flag map for source toggles (page, selection, tabs, linked). */
  flags: Record<string, boolean>;
  onToggleFlag: (key: string) => void;
  ragOn: boolean;
  onToggleRag: () => void;
  ragTopK: number;
  onRagTopKChange: (v: number) => void;
  historyDays: number;
  onHistoryDaysChange: (v: number) => void;
  onClearHistory: () => void;
}): JSX.Element {
  return (
    <>
      <SubPageHeader title="Context & retrieval" onBack={onBack} />
      <div className="j-chat-screen-scroll j-chat-scroll" style={{ padding: "4px 14px 18px" }}>
        <div style={{ fontSize: 11.5, color: "var(--faint)", lineHeight: 1.5, padding: "0 2px" }}>
          Control what J Chat can read by default and how it pulls in extra knowledge.
        </div>

        <SectionLabel>ATTACHED BY DEFAULT</SectionLabel>
        <Card>
          {/* TODO: These toggles should map to settings fields that control
              what gets included in the context sent to the provider.
              Currently only restrictToCurrentFile (a session-level boolean)
              exists. We need persistent defaults for: current page, active
              selection, open tabs, and linked pages. */}
          <ToggleRow icon={<IconFile width={14} height={14} />} iconTint="var(--accent-tint)" iconColor="var(--accent-text)" label="Current page" description="Full text of the page you're on" checked={flags["src_page"] ?? true} onChange={() => onToggleFlag("src_page")} />
          <ToggleRow icon={<IconMaximize width={14} height={14} />} iconTint="var(--blue-tint)" label="Active selection" description="Highlighted text, when present" checked={flags["src_selection"] ?? true} onChange={() => onToggleFlag("src_selection")} />
          <ToggleRow icon={<IconFolder width={14} height={14} />} iconTint="var(--warm-tint)" label="Open tabs" description="Titles & URLs of tabs in this window" checked={flags["src_tabs"] ?? false} onChange={() => onToggleFlag("src_tabs")} />
          <ToggleRow icon={<IconLink width={14} height={14} />} iconTint="var(--ok-tint)" label="Linked pages" description="Pages referenced from this one" checked={flags["src_linked"] ?? false} onChange={() => onToggleFlag("src_linked")} />
        </Card>

        {/* RAG Memory */}
        <div className="flex items-center gap-2 pt-4 pb-2">
          <span className="j-chat-mono" style={{ fontSize: 9.5, color: "var(--dim)", letterSpacing: "0.05em" }}>RAG MEMORY</span>
          <BadgePill variant="accent">BETA</BadgePill>
        </div>
        {/* TODO: RAG memory is not implemented. This card would toggle an
            on-device vector store, show indexing status, let you pick an
            embeddings model, set top-k, enable re-ranking, and auto-index.
            Needs a vector store backend (e.g. transformers.js or a local
            embeddings API) and an indexing pipeline. */}
        <div
          style={{
            border: `1px solid ${ragOn ? "var(--accent-tint-bd)" : "var(--border)"}`,
            borderRadius: 12,
            background: ragOn ? "var(--accent-tint)" : "var(--surface)",
            padding: 12,
            transition: "background 0.18s, border-color 0.18s"
          }}
        >
          <div className="flex items-start gap-3">
            <span className="j-chat-card-row-icon" style={{ background: "var(--accent-tint)", color: "var(--accent-text)", width: 32, height: 32, borderRadius: 9 }}>
              <IconDatabase width={16} height={16} />
            </span>
            <div className="flex-1 min-w-0 pt-px">
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)", marginBottom: 3 }}>Retrieval-augmented memory</div>
              <div style={{ fontSize: 11.5, lineHeight: 1.5, color: "var(--mid)" }}>
                Index your pages into an on-device vector store so the assistant can recall relevant passages automatically — even from chats and pages you've closed.
              </div>
            </div>
            <Toggle checked={ragOn} onChange={onToggleRag} />
          </div>
        </div>

        {/* RAG-on content: status row, config card, clear store button */}
        {ragOn ? (
          <div className="mt-2">
            {/* Status row */}
            <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 11px", border: "1px solid var(--border)", borderRadius: 11, background: "var(--surface)" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--ok)", flex: "none", boxShadow: "0 0 0 3px var(--ok-tint)" }} />
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: 12.5, color: "var(--text2)", fontWeight: 500 }}>1,284 chunks · 18 pages indexed</div>
                <div className="j-chat-mono" style={{ fontSize: 10, color: "var(--faint)" }}>Updated 4 min ago</div>
              </div>
              <button type="button" style={{ height: 28, padding: "0 11px", border: "1px solid var(--border2)", borderRadius: 8, background: "var(--bg)", color: "var(--mid)", fontSize: 11.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Reindex</button>
            </div>

            {/* Config card */}
            <Card>
              <div className="j-chat-card-row" style={{ cursor: "pointer" }}>
                <span className="j-chat-card-row-icon" style={{ background: "var(--accent-tint)", color: "var(--accent-text)" }}><span style={{ fontSize: 13 }}>◆</span></span>
                <span className="flex-1 text-[13px] text-[var(--text2)] font-medium">Embeddings model</span>
                <span className="j-chat-mono" style={{ fontSize: 11, color: "var(--faint)" }}>text-embed-3-sm</span>
                <IconChevronRight width={13} height={13} style={{ color: "var(--dim)" }} />
              </div>
              <div style={{ padding: "12px 11px", borderTop: "1px solid var(--chip)" }}>
                <div className="flex items-center mb-2">
                  <span className="flex-1 text-[13px] text-[var(--text2)] font-medium">Passages retrieved</span>
                  <BadgePill variant="accent">top {ragTopK}</BadgePill>
                </div>
                <RangeSlider min={1} max={12} step={1} value={ragTopK} onChange={onRagTopKChange} />
                <div className="flex justify-between j-chat-mono" style={{ fontSize: 9.5, color: "var(--dim)", marginTop: 4 }}>
                  <span>focused</span><span>broad</span>
                </div>
              </div>
              <ToggleRow label="Re-rank results" description="Second pass to sharpen relevance" checked={flags["rag_rerank"] ?? true} onChange={() => onToggleFlag("rag_rerank")} />
              <ToggleRow label="Auto-index on edit" description="Keep the store fresh as pages change" checked={flags["rag_autoindex"] ?? true} onChange={() => onToggleFlag("rag_autoindex")} />
            </Card>

            {/* Clear memory store */}
            <button type="button" className="j-chat-btn-danger" style={{ marginTop: 9, height: 36, borderRadius: 11 }}>
              <IconTrash width={13} height={13} />
              Clear memory store
            </button>
          </div>
        ) : null}

        {/* Chat history retention */}
        <SectionLabel>CHAT HISTORY</SectionLabel>
        <Card>
          <div style={{ padding: "12px 11px" }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex-1 text-[13px] text-[var(--text2)] font-medium">Auto-delete chats</span>
              <BadgePill variant="accent">{historyDays >= 365 ? "Never" : `${historyDays} days`}</BadgePill>
              {/* TODO: Clear all history now — needs a controller method to
                  delete all sessions. */}
              <button
                type="button"
                onClick={onClearHistory}
                title="Clear all history now"
                className="j-chat-icon-btn"
                style={{ width: 28, height: 24, border: "1px solid var(--err-btn-bd)", borderRadius: 7, background: "var(--err-bg)", color: "var(--err-btn)" }}
              >
                <IconTrash width={13} height={13} />
              </button>
            </div>
            <RangeSlider min={7} max={365} step={1} value={historyDays} onChange={onHistoryDaysChange} />
            <div className="flex justify-between j-chat-mono" style={{ fontSize: 9.5, color: "var(--dim)", marginTop: 4 }}>
              <span>7 days</span><span>never</span>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Edit Behavior
// ═══════════════════════════════════════════════════════════════════════════

export function EditBehaviorScreen({
  onBack,
  editScope,
  onSetEditScope,
  flags,
  onToggleFlag
}: {
  onBack: () => void;
  editScope: "preview" | "ask" | "auto";
  onSetEditScope: (scope: "preview" | "ask" | "auto") => void;
  flags: Record<string, boolean>;
  onToggleFlag: (key: string) => void;
}): JSX.Element {
  return (
    <>
      <SubPageHeader title="Edit behavior" onBack={onBack} />
      <div className="j-chat-screen-scroll j-chat-scroll" style={{ padding: "4px 14px 18px" }}>
        <div style={{ fontSize: 11.5, color: "var(--faint)", lineHeight: 1.5, padding: "0 2px" }}>
          Decide how the assistant applies changes to your pages and notes.
        </div>

        <SectionLabel>WHEN AN EDIT IS PROPOSED</SectionLabel>
        {/* TODO: Wire editScope to editing settings. Currently there's only
            a boolean directApply. This needs to become a three-way enum:
            "preview" (show diff, wait for apply), "ask" (prompt before
            touching the page), "auto" (write immediately). */}
        <div className="flex flex-col gap-2">
          <RadioCard selected={editScope === "preview"} onClick={() => onSetEditScope("preview")} title="Preview diffs" description="Show a tracked diff card and wait for you to apply." />
          <RadioCard selected={editScope === "ask"} onClick={() => onSetEditScope("ask")} title="Ask each time" description="Prompt before touching the page, every time." />
          <RadioCard selected={editScope === "auto"} onClick={() => onSetEditScope("auto")} title="Auto-apply" description="Write changes immediately — undo is still available." badge={<BadgePill variant="danger">RISKY</BadgePill>} />
        </div>

        <SectionLabel>SAFEGUARDS</SectionLabel>
        <Card>
          {/* TODO: Tracked changes — needs Obsidian tracked-changes integration.
              TODO: Confirm multi-block edits — needs a threshold setting. */}
          <ToggleRow label="Tracked changes" description="Record edits as reviewable suggestions" checked={flags["eb_track"] ?? true} onChange={() => onToggleFlag("eb_track")} />
          <ToggleRow label="Confirm multi-block edits" description="Ask when more than 3 blocks change" checked={flags["eb_confirm_multi"] ?? true} onChange={() => onToggleFlag("eb_confirm_multi")} />
        </Card>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Data & Privacy
// ═══════════════════════════════════════════════════════════════════════════

export function DataPrivacyScreen({
  onBack,
  flags,
  onToggleFlag,
  onExportData,
  onDeleteAllData
}: {
  onBack: () => void;
  flags: Record<string, boolean>;
  onToggleFlag: (key: string) => void;
  onExportData: () => void;
  onDeleteAllData: () => void;
}): JSX.Element {
  return (
    <>
      <SubPageHeader title="Data & privacy" onBack={onBack} />
      <div className="j-chat-screen-scroll j-chat-scroll" style={{ padding: "4px 14px 18px" }}>
        {/* Privacy banner */}
        <div style={{ display: "flex", gap: 10, padding: 12, border: "1px solid var(--accent-tint-bd)", borderRadius: 12, background: "var(--accent-tint)" }}>
          <IconDataPrivacy width={17} height={17} style={{ flex: "none", marginTop: 1, color: "var(--accent-text)" }} />
          <div className="flex-1">
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--accent-text)", marginBottom: 2 }}>Your keys and history stay on this device</div>
            <div style={{ fontSize: 11, lineHeight: 1.5, color: "var(--mid)" }}>Nothing is sent anywhere except directly to the providers you configure.</div>
          </div>
        </div>

        <SectionLabel>SHARING</SectionLabel>
        <Card>
          {/* TODO: These toggles should add no-train headers to provider
              requests, redact PII before sending, and control telemetry.
              None of these features are implemented yet. */}
          <ToggleRow label="Opt out of training" description="Send no-train headers to providers" checked={flags["pv_training"] ?? true} onChange={() => onToggleFlag("pv_training")} />
          <ToggleRow label="Redact PII before sending" description="Mask emails, phones & keys in prompts" checked={flags["pv_redact"] ?? false} onChange={() => onToggleFlag("pv_redact")} />
          <ToggleRow label="Anonymous usage stats" description="Share crash & usage telemetry" checked={flags["pv_telemetry"] ?? false} onChange={() => onToggleFlag("pv_telemetry")} />
        </Card>

        <SectionLabel>DANGER ZONE</SectionLabel>
        <div className="flex flex-col gap-2">
          {/* TODO: Export all data — should serialize settings + chat history
              to a JSON file and trigger a download. */}
          <button type="button" className="j-chat-btn-outline" style={{ height: 42, width: "100%", justifyContent: "space-between", color: "var(--text2)" }} onClick={onExportData}>
            <span className="flex items-center gap-2.5">
              <IconDownload width={15} height={15} />
              Export all data
            </span>
            <span className="j-chat-mono" style={{ fontSize: 10, color: "var(--faint)" }}>.json</span>
          </button>
          {/* TODO: Delete all data — should clear all sessions, settings, and
              plugin data. Needs a confirmation dialog. */}
          <button type="button" style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", height: 42, padding: "0 12px", border: "1px solid var(--err-bd)", borderRadius: 11, background: "var(--err-bg)", color: "var(--err-btn)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }} onClick={onDeleteAllData}>
            <IconTrash width={15} height={15} />
            Delete all chats & data
          </button>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Provider Config
// ═══════════════════════════════════════════════════════════════════════════

export function ProviderConfigScreen({
  onBack,
  provider,
  models,
  onToggleModel,
  flags,
  onToggleFlag,
  showKey,
  onToggleKey,
  onTestConnection,
  onRemoveProvider
}: {
  onBack: () => void;
  provider: ProviderConfig;
  models: { id: string; name: string; sub: string; enabled: boolean }[];
  onToggleModel: (id: string) => void;
  flags: Record<string, boolean>;
  onToggleFlag: (key: string) => void;
  showKey: boolean;
  onToggleKey: () => void;
  onTestConnection: () => void;
  onRemoveProvider: () => void;
}): JSX.Element {
  return (
    <>
      <SubPageHeader title={provider.name} onBack={onBack} actionLabel="Done" onAction={onBack} />
      <div className="j-chat-screen-scroll j-chat-scroll" style={{ padding: "4px 14px 18px" }}>
        {/* Provider header card */}
        <div className="j-chat-provider-item" style={{ cursor: "default", border: "1px solid var(--border)", borderRadius: 12 }}>
          <span className="j-chat-provider-initial" style={{ background: provider.tint, width: 38, height: 38, borderRadius: 10, fontSize: 16 }}>{provider.initial}</span>
          <div className="flex-1 min-w-0">
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>{provider.name}</div>
            <span className="inline-flex items-center gap-1.5 mt-1" style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: provider.connected ? "var(--ok-tint)" : "var(--warm-tint)", color: provider.connected ? "var(--ok)" : "var(--dim)", fontWeight: 600 }}>
              <StatusDot color={provider.connected ? "var(--ok)" : "var(--dim)"} />
              {provider.connected ? "Connected" : "Not configured"}
            </span>
          </div>
        </div>

        {/* TODO: Authentication fields should write to the real provider
            settings (openai.apiKey, openai.baseUrl, etc.). Currently they're
            local state only. */}
        <SectionLabel>AUTHENTICATION</SectionLabel>
        <Label>API key</Label>
        <div className="flex gap-2 mb-3">
          <input className="j-chat-input j-chat-input-mono" value={showKey ? provider.keyFull : provider.keyMask} readOnly />
          <button type="button" className="j-chat-icon-btn" style={{ width: 38, height: 38, border: "1px solid var(--border2)", borderRadius: 10, background: "var(--surface)", color: "var(--mid)" }} onClick={onToggleKey} title="Show / hide">
            <IconKey width={16} height={16} />
          </button>
        </div>
        <Label>Base URL</Label>
        <TextInput value={provider.baseUrl} onChange={() => {}} mono />
        <div className="mt-3" />
        <Label hint="optional">Organization ID</Label>
        <TextInput value="" onChange={() => {}} mono placeholder="org-…" />

        {/* Enabled models */}
        {/* TODO: Model list should come from the provider's actual available
            models (fetched via API). Currently hardcoded in the mock. */}
        <SectionLabel>ENABLED MODELS</SectionLabel>
        <Card>
          {models.map((m, i) => (
            <div key={m.id} className="j-chat-card-row" style={{ cursor: "default", borderBottom: i < models.length - 1 ? "1px solid var(--chip)" : "none" }}>
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500 }}>{m.name}</div>
                <div className="j-chat-mono" style={{ fontSize: 10.5, color: "var(--faint)" }}>{m.sub}</div>
              </div>
              <Toggle checked={m.enabled} onChange={() => onToggleModel(m.id)} />
            </div>
          ))}
        </Card>

        {/* Request defaults */}
        <SectionLabel>REQUEST DEFAULTS</SectionLabel>
        <Card>
          {/* TODO: Max output tokens should be a settings field. */}
          <div className="j-chat-card-row" style={{ cursor: "default" }}>
            <span className="flex-1 text-[13px] text-[var(--text2)] font-medium">Max output tokens</span>
            <TextInput value="4096" onChange={() => {}} mono />
          </div>
          <div className="j-chat-card-row" style={{ cursor: "default", borderBottom: "none" }}>
            <span className="flex-1 text-[13px] text-[var(--text2)] font-medium">Stream responses</span>
            <BadgePill variant="ok">on</BadgePill>
          </div>
        </Card>

        {/* Test connection */}
        {/* TODO: Send a test request to the provider to verify credentials. */}
        <button type="button" className="j-chat-btn-accent" style={{ marginTop: 16 }} onClick={onTestConnection}>
          <IconCheckCircle width={15} height={15} />
          Test connection
        </button>
        {/* TODO: Remove provider from settings. */}
        <button type="button" className="j-chat-btn-danger" style={{ marginTop: 9 }} onClick={onRemoveProvider}>
          <IconTrash width={14} height={14} />
          Remove provider
        </button>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Copilot Device Auth
// ═══════════════════════════════════════════════════════════════════════════

export function CopilotAuthScreen({
  onBack,
  code,
  copied,
  onCopyCode,
  onOpenDevice
}: {
  onBack: () => void;
  code: string;
  copied: boolean;
  onCopyCode: () => void;
  onOpenDevice: () => void;
}): JSX.Element {
  return (
    <>
      <SubPageHeader title="GitHub Copilot" onBack={onBack} />
      <div className="j-chat-screen-scroll j-chat-scroll" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "18px 22px 24px" }}>
        {/* TODO: This screen implements the GitHub Copilot device-code OAuth
            flow. It needs to: 1) request a device code from GitHub, 2) show
            the code + link, 3) poll for authorization, 4) store the token.
            Currently all of this is placeholder. */}
        <div style={{ width: 52, height: 52, borderRadius: 15, background: "var(--chip)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <IconGithub width={28} height={28} style={{ color: "var(--text2)" }} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 7, textAlign: "center" }}>Connect with device code</div>
        <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--mid)", textAlign: "center", maxWidth: 262, marginBottom: 22 }}>
          Open the GitHub device page and enter the code below to authorize J Chat for Copilot.
        </div>

        <div style={{ width: "100%" }} className="j-chat-mono">
          <div style={{ fontSize: 9.5, color: "var(--dim)", letterSpacing: "0.05em", marginBottom: 8 }}>YOUR DEVICE CODE</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "5px 5px 5px 16px", border: "1px solid var(--border2)", borderRadius: 13, background: "var(--surface)", marginBottom: 16 }}>
          <span className="j-chat-mono" style={{ flex: 1, fontSize: 26, fontWeight: 600, letterSpacing: "0.14em", color: "var(--text)", textAlign: "center" }}>{code}</span>
          <button type="button" onClick={onCopyCode} title="Copy code" style={{ width: 42, height: 42, border: "none", borderRadius: 9, background: "var(--chip)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--mid)", flex: "none" }}>
            {copied ? <IconCheck width={18} height={18} style={{ color: "var(--ok)" }} /> : <IconCopy width={16} height={16} />}
          </button>
        </div>

        <button type="button" className="j-chat-btn-primary" style={{ width: "100%", height: 44, borderRadius: 12, fontSize: 13, boxShadow: "0 4px 14px -4px var(--accent-glow)", gap: 8 }} onClick={onOpenDevice}>
          Open github.com/login/device
          <IconExternalLink width={15} height={15} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        </button>

        <div className="flex items-center gap-2 mt-4 j-chat-mono" style={{ fontSize: 11.5, color: "var(--faint)" }}>
          <span className="j-chat-blink" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)" }} />
          Waiting for authorization…
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Modes List
// ═══════════════════════════════════════════════════════════════════════════

export function ModesScreen({
  onBack,
  modes,
  onOpenMode,
  onCreateMode
}: {
  onBack: () => void;
  modes: Mode[];
  onOpenMode: (mode: Mode) => void;
  onCreateMode: () => void;
}): JSX.Element {
  return (
    <>
      <SubPageHeader title="Modes" onBack={onBack} actionLabel="New" onAction={onCreateMode} actionIcon={<IconPlus width={12} height={12} strokeWidth={2.4} strokeLinecap="round" />} />
      <div style={{ padding: "0 14px 6px" }}>
        <div style={{ fontSize: 11.5, color: "var(--faint)", lineHeight: 1.5 }}>
          Each mode bundles a system prompt, model, tools, and temperature. Switch between them from the composer.
        </div>
      </div>
      <div className="j-chat-screen-scroll j-chat-scroll" style={{ padding: "8px 14px 14px" }}>
        {modes.map((m) => {
          const toolCount = Object.values(m.tools).filter(Boolean).length;
          return (
            <div key={m.id} className="j-chat-skill-card" onClick={() => onOpenMode(m)}>
              <div className="flex items-center gap-3 mb-1.5">
                <span style={{ width: 34, height: 34, borderRadius: 9, background: m.tint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: m.iconColor, flex: "none" }}>{m.icon}</span>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>{m.name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--faint)", lineHeight: 1.4 }}>{m.desc}</div>
                  <div className="flex gap-1.5" style={{ marginTop: 7 }}>
                    <span className="j-chat-skill-tag">{m.model}</span>
                    <span className="j-chat-skill-tag">{toolCount === 0 ? "no tools" : `${toolCount} tool${toolCount === 1 ? "" : "s"}`}</span>
                  </div>
                </div>
                <IconChevronRight width={15} height={15} style={{ color: "var(--dim)", alignSelf: "center" }} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Mode Editor
// ═══════════════════════════════════════════════════════════════════════════

export function ModeEditorScreen({
  onBack,
  mode,
  onChange,
  onSave,
  onDelete
}: {
  onBack: () => void;
  mode: Mode;
  onChange: (mode: Mode) => void;
  onSave: () => void;
  onDelete: () => void;
}): JSX.Element {
  const toolMeta: { key: ToolKey; label: string; sub: string }[] = [
    { key: "read", label: "Read document", sub: "Access the current page text" },
    { key: "apply", label: "Apply edits", sub: "Propose tracked diffs to the note" },
    { key: "search", label: "Search notes", sub: "Query across linked pages" },
    { key: "fetch", label: "Fetch URLs", sub: "Read linked external pages" }
  ];

  return (
    <>
      <SubPageHeader title={mode.name} onBack={onBack} actionLabel="Save" onAction={onSave} />
      <div className="j-chat-screen-scroll j-chat-scroll" style={{ padding: "6px 14px 18px" }}>
        <div className="flex gap-3 items-center mb-3.5">
          {/* TODO: Icon picker — clicking should open an emoji picker. */}
          <span style={{ width: 44, height: 44, borderRadius: 11, background: mode.tint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, color: mode.iconColor, flex: "none", cursor: "pointer" }}>{mode.icon}</span>
          <input value={mode.name} onChange={(e) => onChange({ ...mode, name: e.target.value })} placeholder="Mode name" className="j-chat-input j-chat-input-title" style={{ flex: 1, minWidth: 0, height: 38, padding: "0 12px" }} />
        </div>

        <Label>Description</Label>
        <input value={mode.desc} onChange={(e) => onChange({ ...mode, desc: e.target.value })} placeholder="What this mode is good for" className="j-chat-input" style={{ fontSize: 13 }} />

        <SectionLabel>SYSTEM PROMPT</SectionLabel>
        {/* TODO: System prompt editor — should support markdown and template
            variables like {{selection}}, {{page}}, {{vault}}. */}
        <textarea className="j-chat-textarea j-chat-scroll" value={mode.prompt} onChange={(e) => onChange({ ...mode, prompt: e.target.value })} rows={6} style={{ minHeight: 124, resize: "vertical", fontFamily: "inherit", fontSize: 12.5, lineHeight: 1.6 }} />

        <SectionLabel>MODEL &amp; SAMPLING</SectionLabel>
        <Card>
          {/* TODO: Model picker — should open a dropdown of enabled models. */}
          <CardRow icon={<span style={{ fontSize: 13 }}>◆</span>} iconTint="var(--accent-tint)" iconColor="var(--accent-text)" label="Model" value={mode.model} onClick={() => {}} />
          <div style={{ padding: "12px 11px", borderTop: "1px solid var(--chip)" }}>
            <div className="flex items-center mb-2">
              <span className="flex-1 text-[13px] text-[var(--text2)] font-medium">Temperature</span>
              <BadgePill variant="accent">{mode.temp.toFixed(1)}</BadgePill>
            </div>
            <RangeSlider min={0} max={1} step={0.1} value={mode.temp} onChange={(v) => onChange({ ...mode, temp: v })} />
            <div className="flex justify-between j-chat-mono" style={{ fontSize: 9.5, color: "var(--dim)", marginTop: 4 }}>
              <span>precise</span><span>creative</span>
            </div>
          </div>
        </Card>

        <SectionLabel>TOOLS</SectionLabel>
        <Card>
          {toolMeta.map((t, i) => (
            <div key={t.key} style={{ display: "flex", alignItems: "center", gap: 11, padding: 11, borderBottom: i < toolMeta.length - 1 ? "1px solid var(--chip)" : "none" }}>
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500 }}>{t.label}</div>
                <div style={{ fontSize: 10.5, color: "var(--faint)" }}>{t.sub}</div>
              </div>
              <Toggle checked={!!mode.tools[t.key]} onChange={() => onChange({ ...mode, tools: { ...mode.tools, [t.key]: !mode.tools[t.key] } })} />
            </div>
          ))}
        </Card>

        <button type="button" className="j-chat-btn-danger" style={{ marginTop: 16 }} onClick={onDelete}>
          <IconTrash width={14} height={14} />
          Delete mode
        </button>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Skills Picker
// ═══════════════════════════════════════════════════════════════════════════

export function SkillsPickerScreen({
  onBack,
  skills,
  activeSkillId,
  onRunSkill,
  onManage
}: {
  onBack: () => void;
  skills: Skill[];
  activeSkillId: string | null;
  onRunSkill: (skillId: string) => void;
  onManage: () => void;
}): JSX.Element {
  return (
    <>
      <SubPageHeader title="Skills" onBack={onBack} actionLabel="Manage" actionVariant="outline" onAction={onManage} actionIcon={<IconSettings width={13} height={13} />} />
      <div style={{ padding: "0 14px 6px" }}>
        <div style={{ fontSize: 11.5, color: "var(--faint)", lineHeight: 1.5 }}>
          Click a skill to steer the next reply, or type <span className="j-chat-mono" style={{ color: "var(--mid)", background: "var(--chip)", padding: "1px 5px", borderRadius: 5, fontSize: 10.5 }}>/</span> in the composer.
        </div>
      </div>
      <div className="j-chat-screen-scroll j-chat-scroll" style={{ padding: "8px 14px 14px" }}>
        {skills.map((sk) => (
          <div
            key={sk.id}
            className={`j-chat-skill-card ${sk.id === activeSkillId ? "is-active" : ""}`}
            onClick={() => onRunSkill(sk.id)}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span style={{ width: 8, height: 8, borderRadius: 3, background: sk.color, flex: "none" }} />
              <span className="flex-1 text-[13px] font-semibold text-[var(--text)]">{sk.title}</span>
              <span className="j-chat-skill-tag">/{slugify(sk.title)}</span>
            </div>
            <div className="j-chat-skill-card-desc">{firstBodyLine(sk.text)}</div>
          </div>
        ))}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Skills Manage
// ═══════════════════════════════════════════════════════════════════════════

export function SkillsManageScreen({
  onBack,
  skills,
  onOpenSkill,
  onCreateSkill
}: {
  onBack: () => void;
  skills: Skill[];
  onOpenSkill: (skillId: string) => void;
  onCreateSkill: () => void;
}): JSX.Element {
  return (
    <>
      <SubPageHeader title="Skills" onBack={onBack} actionLabel="Add skill" onAction={onCreateSkill} actionIcon={<IconPlus width={12} height={12} strokeWidth={2.4} strokeLinecap="round" />} />
      <div className="j-chat-screen-scroll j-chat-scroll" style={{ padding: "8px 14px 16px" }}>
        {skills.map((sk) => (
          <div key={sk.id} className="j-chat-skill-card" onClick={() => onOpenSkill(sk.id)}>
            <div className="flex items-center gap-3">
              <span style={{ width: 30, height: 30, borderRadius: 8, background: sk.color, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                <IconSkill width={15} height={15} style={{ color: "#fff" }} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{sk.title}</span>
                  <span className="j-chat-skill-tag">/{slugify(sk.title)}</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--faint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{firstBodyLine(sk.text)}</div>
              </div>
              <IconChevronRight width={14} height={14} style={{ color: "var(--dim)" }} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Skill Editor
// ═══════════════════════════════════════════════════════════════════════════

export function SkillEditorScreen({
  onBack,
  skill,
  onChange,
  onDelete
}: {
  onBack: () => void;
  skill: Skill;
  onChange: (skill: Skill) => void;
  onDelete: () => void;
}): JSX.Element {
  return (
    <>
      <SubPageHeader title="Edit skill" onBack={onBack} actionLabel="Done" onAction={onBack} />
      <div className="j-chat-screen-scroll j-chat-scroll" style={{ padding: "4px 14px 18px", display: "flex", flexDirection: "column" }}>
        <div className="flex items-center gap-2 mb-3.5">
          <span style={{ width: 34, height: 34, borderRadius: 9, background: skill.color, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            <IconSkill width={17} height={17} style={{ color: "#fff" }} />
          </span>
          <span className="j-chat-skill-tag" style={{ padding: "4px 9px", borderRadius: 7, fontSize: 11 }}>/{slugify(skill.title)}</span>
        </div>
        <Label>Title</Label>
        <input value={skill.title} onChange={(e) => onChange({ ...skill, title: e.target.value })} className="j-chat-input j-chat-input-title" style={{ marginBottom: 14 }} />
        <Label hint="· Markdown">Instructions</Label>
        <div style={{ fontSize: 10.5, color: "var(--faint)", lineHeight: 1.5, margin: "0 2px 7px" }}>
          Front matter is required. The <span className="j-chat-mono" style={{ color: "var(--mid)", background: "var(--chip)", padding: "1px 5px", borderRadius: 5 }}>name:</span> field becomes the <span className="j-chat-mono" style={{ color: "var(--mid)" }}>/command</span>.
        </div>
        <textarea
          className="j-chat-textarea j-chat-scroll"
          value={skill.text}
          onChange={(e) => onChange({ ...skill, text: e.target.value })}
          placeholder={"---\nname: my-skill\ndescription: When to use this skill\n---\n\n# My Skill\n\nInstructions in Markdown…"}
          style={{ flex: 1, minHeight: 260 }}
        />
        <button type="button" className="j-chat-btn-danger" style={{ marginTop: 14 }} onClick={onDelete}>
          <IconTrash width={14} height={14} />
          Delete skill
        </button>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// New Skill
// ═══════════════════════════════════════════════════════════════════════════

export function NewSkillScreen({
  onBack,
  title,
  onTitleChange,
  text,
  onTextChange,
  method,
  onMethodChange,
  onCreate,
  onMdDrop
}: {
  onBack: () => void;
  title: string;
  onTitleChange: (v: string) => void;
  text: string;
  onTextChange: (v: string) => void;
  method: "paste" | "upload";
  onMethodChange: (m: "paste" | "upload") => void;
  onCreate: () => void;
  onMdDrop: (file: File) => void;
}): JSX.Element {
  const [dragging, setDragging] = React.useState(false);

  return (
    <>
      <SubPageHeader title="New skill" onBack={onBack} actionLabel="Create" onAction={onCreate} />
      <div className="j-chat-screen-scroll j-chat-scroll" style={{ padding: "4px 14px 18px", display: "flex", flexDirection: "column" }}>
        <Label>Title</Label>
        <input value={title} onChange={(e) => onTitleChange(e.target.value)} placeholder="e.g. Translate to French" className="j-chat-input j-chat-input-title" style={{ marginBottom: 16 }} />

        <div className="j-chat-mono mt-4 mb-1.5" style={{ fontSize: 9.5, color: "var(--dim)", letterSpacing: "0.05em" }}>HOW TO ADD THE INSTRUCTIONS</div>
        <div style={{ fontSize: 10.5, color: "var(--faint)", lineHeight: 1.5, marginBottom: 9 }}>
          Front matter is required. The <span className="j-chat-mono" style={{ color: "var(--mid)", background: "var(--chip)", padding: "1px 5px", borderRadius: 5 }}>name:</span> field becomes the <span className="j-chat-mono" style={{ color: "var(--mid)" }}>/command</span>.
        </div>

        {/* Method toggle */}
        <div className="flex gap-1 p-1 mb-3" style={{ background: "var(--raised)", border: "1px solid var(--border)", borderRadius: 10 }}>
          <button type="button" style={{ flex: 1, height: 32, border: "none", borderRadius: 7, background: method === "paste" ? "var(--surface)" : "transparent", color: method === "paste" ? "var(--text)" : "var(--mid)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }} onClick={() => onMethodChange("paste")}>
            <IconClipboard width={13} height={13} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            Paste text
          </button>
          <button type="button" style={{ flex: 1, height: 32, border: "none", borderRadius: 7, background: method === "upload" ? "var(--surface)" : "transparent", color: method === "upload" ? "var(--text)" : "var(--mid)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }} onClick={() => onMethodChange("upload")}>
            <IconDownload width={13} height={13} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            Upload file
          </button>
        </div>

        {method === "paste" ? (
          <textarea
            className="j-chat-textarea j-chat-scroll"
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder={"---\nname: my-skill\ndescription: When to use this skill\n---\n\n# My Skill\n\nInstructions in Markdown…"}
            style={{ flex: 1, minHeight: 240 }}
          />
        ) : (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) onMdDrop(f);
            }}
            style={{
              flex: 1, minHeight: 240, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 7, padding: 24,
              border: `1.5px dashed ${dragging ? "var(--accent)" : "var(--border2)"}`,
              borderRadius: 13, background: dragging ? "var(--accent-tint)" : "var(--surface)",
              transition: "border-color 0.15s, background 0.15s", textAlign: "center"
            }}
          >
            <IconDownload width={26} height={26} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--mid)" }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)" }}>Drop a Markdown file</div>
            <div className="j-chat-mono" style={{ fontSize: 11, color: "var(--faint)" }}>a .md file fills in the instructions below</div>
            {text ? (
              <div style={{ marginTop: 6, fontSize: 11, color: "var(--accent-text)", display: "flex", alignItems: "center", gap: 5 }}>
                <IconCheck width={13} height={13} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                Loaded — press Create
              </div>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Onboarding
// ═══════════════════════════════════════════════════════════════════════════

export function OnboardingScreen({
  providers,
  onOpenProvider,
  onSkip
}: {
  providers: ProviderConfig[];
  onOpenProvider: (provider: ProviderConfig) => void;
  onSkip: () => void;
}): JSX.Element {
  return (
    <div className="j-chat-onboarding j-chat-scroll">
      <div className="j-chat-onboarding-logo">J</div>
      <div style={{ fontSize: 21, fontWeight: 700, color: "var(--text)", lineHeight: 1.2, marginBottom: 8 }}>Welcome to J Chat</div>
      <div style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--mid)", marginBottom: 22 }}>
        Connect an AI provider to start chatting with any page you're on. Your keys stay on this device.
      </div>

      <div className="j-chat-mono" style={{ fontSize: 9.5, color: "var(--dim)", letterSpacing: "0.05em", marginBottom: 10 }}>CONNECT A PROVIDER</div>
      {providers.map((p) => (
        <button key={p.name} type="button" className="j-chat-onboarding-provider" onClick={() => onOpenProvider(p)}>
          <span style={{ width: 32, height: 32, borderRadius: 9, background: p.tint, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "IBM Plex Mono, monospace", fontWeight: 600, fontSize: 14, color: "var(--text2)", flex: "none" }}>{p.initial}</span>
          <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>{p.name}</span>
          <IconChevronRight width={15} height={15} style={{ color: "var(--dim)" }} />
        </button>
      ))}
      <button type="button" className="j-chat-onboarding-skip" onClick={onSkip}>
        Skip for now →
      </button>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function slugify(str: string): string {
  return String(str).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "skill";
}

function firstBodyLine(text: string): string {
  const body = text.replace(/^---[\s\S]*?---\s*\n?/, "");
  const line = body.split("\n").find((l) => l.trim() && !l.startsWith("#"));
  return line?.slice(0, 80) || "Custom skill";
}