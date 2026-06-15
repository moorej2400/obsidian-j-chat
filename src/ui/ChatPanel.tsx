/**
 * ChatPanel — the root navigation shell for the J Chat side panel.
 *
 * This component owns the current screen (chat, sessions, settings, etc.)
 * and renders the appropriate screen component. The header is always
 * visible; the content below it swaps based on the active screen.
 *
 * Architecture:
 * - Header: logo, session title, sessions/settings/new-chat buttons
 * - Content: the active screen (chat transcript, sessions list, settings, etc.)
 * - Composer: only visible on the chat screen
 *
 * The shell receives a ChatPanelSnapshot from the controller (via JChatView)
 * plus callbacks for all user actions. Screen-local state (which sub-page
 * is open, quick-settings panel, etc.) lives here in React state.
 *
 * TODO: The mock data (skills, modes, providers) is placeholder. When the
 * underlying features are implemented, these should come from settings or
 * a dedicated store. For now they're passed in as props or use defaults.
 */

import * as React from "react";
import type { AttachedFile, ChatItem } from "@/chat/chatTypes";
import type { ChatSessionSummary } from "@/chat/chatSessions";
import type { AgentActivityEvent } from "@/providers/types";
import {
  IconChevronRight,
  IconPlus,
  IconMenu,
  IconSettings,
  IconSend
} from "@/ui/icons";
import type { Screen, Skill, Mode, ProviderConfig, QuickRow, Scope } from "@/ui/screens/types";
import { ChatScreen } from "@/ui/screens/ChatScreen";
import { Composer } from "@/ui/screens/Composer";
import { SessionsScreen } from "@/ui/screens/SessionsScreen";
import { SettingsScreen } from "@/ui/screens/SettingsScreen";
import {
  ContextRetrievalScreen,
  EditBehaviorScreen,
  DataPrivacyScreen,
  ProviderConfigScreen,
  CopilotAuthScreen,
  ModesScreen,
  ModeEditorScreen,
  SkillsPickerScreen,
  SkillsManageScreen,
  SkillEditorScreen,
  NewSkillScreen,
  OnboardingScreen
} from "@/ui/screens/SettingsSubScreens";

// ─── Public types (kept compatible with JChatView wiring) ──────────────────

export type ProviderStatus = {
  label: string;
  ready: boolean;
  detail?: string;
};

export type ChatPanelSnapshot = {
  items: ChatItem[];
  attachments: AttachedFile[];
  restrictToCurrentFile: boolean;
  activeSessionId: string;
  sessions: ChatSessionSummary[];
  activity: AgentActivityEvent[];
  isSending: boolean;
  error: string | null;
};

export type ChatPanelProps = {
  snapshot: ChatPanelSnapshot;
  providerStatus: ProviderStatus;
  currentFile: { path: string; basename: string } | null;
  hasSelection: boolean;
  selectedText?: string;
  onSend: (content: string) => void | Promise<void>;
  onToggleRestrictToCurrentFile: (value: boolean) => void;
  onAttachFile: () => void | Promise<void>;
  onRemoveAttachment: (path: string) => void;
  onNewSession: () => void;
  onSelectSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, title: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onInsertSelection?: () => string | void | Promise<string | void>;
  onOpenSource?: (path: string) => void;
  onOpenSettings?: () => void;
};

// ─── Placeholder mock data ────────────────────────────────────────────────

// TODO: Replace these with real data from settings/store once features are
// implemented. They exist so the UI can be built and tested before the
// backend is ready.

const MOCK_SKILLS: Skill[] = [
  {
    id: "summarize",
    title: "Summarize page",
    color: "#6f68e0",
    text: "---\nname: summarize\ndescription: Condense the page or selection into key points\n---\n\n# Summarize page\n\nSummarize {{selection|page}} into 3–5 tight bullet points.\n\nLead with the single most important takeaway, keep it plain-language, and skip any preamble."
  },
  {
    id: "rewrite",
    title: "Rewrite clearly",
    color: "#3f9e5e",
    text: "---\nname: rewrite\ndescription: Improve clarity and concision, keep my voice\n---\n\n# Rewrite clearly\n\nRewrite {{selection}} to be clearer and more concise.\n\nPreserve the author's voice and any domain terms. Return the result as a tracked diff against the selection."
  }
];

const MOCK_MODES: Mode[] = [
  { id: "editor", name: "Editor", icon: "✎", tint: "var(--accent-tint)", iconColor: "var(--accent-text)", desc: "Rewrites and edits inline with tracked diffs", model: "Sonnet 4.5", temp: 0.3, prompt: "You are a precise copy editor. Improve clarity and concision while preserving the author's voice. Always return changes as a tracked diff against the current selection.", tools: { read: true, apply: true, search: false, fetch: false } },
  { id: "researcher", name: "Researcher", icon: "◎", tint: "var(--blue-tint)", iconColor: "var(--text2)", desc: "Searches linked pages and cites its sources", model: "Sonnet 4.5", temp: 0.5, prompt: "You are a research assistant. Gather evidence across the linked pages before answering, and cite each claim with its source page.", tools: { read: true, apply: false, search: true, fetch: true } },
  { id: "quick", name: "Quick", icon: "⚡", tint: "var(--warm-tint)", iconColor: "var(--text2)", desc: "Fast answers, no tools, minimal preamble", model: "Haiku 3.5", temp: 0.7, prompt: "Answer quickly and directly. No preamble and no tools. Keep responses under three sentences whenever possible.", tools: { read: false, apply: false, search: false, fetch: false } },
  { id: "coach", name: "Coach", icon: "◑", tint: "var(--ok-tint)", iconColor: "var(--text2)", desc: "Asks clarifying questions before acting", model: "Sonnet 4.5", temp: 0.6, prompt: "Before taking action, ask up to two clarifying questions. Then proceed with a short, explicit plan.", tools: { read: true, apply: false, search: false, fetch: false } }
];

const MOCK_PROVIDERS: ProviderConfig[] = [
  { name: "Anthropic", detail: "3 models · connected", dot: "var(--ok)", initial: "A", tint: "var(--ok-tint)", connected: true, baseUrl: "https://api.anthropic.com", keyMask: "sk-ant-api03-••••••••••••3f9a", keyFull: "sk-ant-api03-1a2b3c4d5e6f7g8h3f9a" },
  { name: "OpenAI", detail: "2 models · connected", dot: "var(--ok)", initial: "O", tint: "var(--ok-tint)", connected: true, baseUrl: "https://api.openai.com/v1", keyMask: "sk-proj-••••••••••a01c", keyFull: "sk-proj-9f8e7d6c5b4aa01c" },
  { name: "Ollama (local)", detail: "Not configured", dot: "var(--dim)", initial: "L", tint: "var(--chip)", connected: false, baseUrl: "http://localhost:11434", keyMask: "", keyFull: "" },
  { name: "GitHub Copilot", detail: "Device sign-in required", dot: "var(--dim)", initial: "GH", tint: "var(--chip)", connected: false, baseUrl: "", keyMask: "", keyFull: "" }
];

const MOCK_PROVIDER_MODELS: Record<string, { id: string; name: string; sub: string }[]> = {
  "Anthropic": [{ id: "sonnet45", name: "Claude Sonnet 4.5", sub: "200K context · default" }, { id: "opus4", name: "Claude Opus 4", sub: "200K context" }, { id: "haiku35", name: "Claude Haiku 3.5", sub: "Fast · economical" }],
  "OpenAI": [{ id: "gpt4o", name: "GPT-4o", sub: "128K context · default" }, { id: "gpt4omini", name: "GPT-4o mini", sub: "Fast · economical" }],
  "Ollama (local)": [{ id: "llama3", name: "Llama 3 8B", sub: "Local model" }, { id: "mistral", name: "Mistral 7B", sub: "Local model" }]
};

// Model menu data grouped by provider — matches the mock's modelMenuData.
// Used by the composer's model dropdown.
const MOCK_MODEL_MENU: { prov: string; dot: string; items: { label: string; sub: string }[] }[] = [
  { prov: "Anthropic", dot: "oklch(0.70 0.13 300)", items: [
    { label: "Sonnet 4.5", sub: "200K · balanced" },
    { label: "Opus 4", sub: "200K · most capable" },
    { label: "Haiku 3.5", sub: "fast · economical" },
  ] },
  { prov: "OpenAI", dot: "oklch(0.70 0.13 150)", items: [
    { label: "GPT-4o", sub: "128K context" },
    { label: "GPT-4o mini", sub: "fast · economical" },
  ] },
];

// All model labels flattened (for keyboard navigation index).
const MOCK_MODEL_LABELS: string[] = MOCK_MODEL_MENU.flatMap((g) => g.items.map((m) => m.label));

// Mock usage data — matches the mock's costUsd, ctxPct, etc.
const MOCK_USAGE = {
  costUsd: "$0.42",
  ctxPct: 21,
  ctxUsedTokens: "43.2k",
  ctxMaxTokens: "200K",
  sessionCost: "$1.86",
  tokensIO: "38.4k · 4.8k"
};

// Mock pinned sessions — the mock shows one bookmarked session.
const MOCK_PINNED = [
  { title: "Launch checklist", snippet: "Draft the go-live runbook…", meta: "Sonnet · 8 msg" }
];

// ─── ChatPanel ─────────────────────────────────────────────────────────────

export function ChatPanel(props: ChatPanelProps): JSX.Element {
  const { snapshot } = props;
  const [screen, setScreen] = React.useState<Screen>("chat");
  const [draft, setDraft] = React.useState("");
  const [quickOpen, setQuickOpen] = React.useState(false);

  // Model selection state — the current model name (e.g. "Sonnet 4.5").
  // TODO: Wire to real session-level model selection once multi-model is added.
  const [currentModel, setCurrentModel] = React.useState("Sonnet 4.5");
  const [modelMenuOpen, setModelMenuOpen] = React.useState(false);
  const [modelPhase, setModelPhase] = React.useState<"start" | "open" | "out" | null>(null);
  const [modelRect, setModelRect] = React.useState<{ left: number; bottom: number; width: number } | null>(null);
  const [modelIndex, setModelIndex] = React.useState(0);
  const modelCloseTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // TODO: These are ephemeral, in-memory UI states for features not yet wired.
  // They reset on every reload and do not read from or write to plugin settings
  // — the Preferences/Context/Edit-behavior/Privacy toggles below (flags, ragOn,
  // ragTopK, editScope, historyDays, dark, accentHue) currently change nothing
  // beyond this component. Persist them via PluginSettings and make dark/accent
  // drive the real Obsidian theme + --accent tokens when those features land.
  const [activeSkillId, setActiveSkillId] = React.useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = React.useState<ProviderConfig | null>(null);
  const [showKey, setShowKey] = React.useState(false);
  const [editingMode, setEditingMode] = React.useState<Mode | null>(null);
  const [editingSkillId, setEditingSkillId] = React.useState<string | null>(null);
  const [newSkillTitle, setNewSkillTitle] = React.useState("");
  const [newSkillText, setNewSkillText] = React.useState("");
  const [newSkillMethod, setNewSkillMethod] = React.useState<"paste" | "upload">("paste");
  const [copilotCopied, setCopilotCopied] = React.useState(false);
  const [flags, setFlags] = React.useState<Record<string, boolean>>({});
  const [ragOn, setRagOn] = React.useState(false);
  const [ragTopK, setRagTopK] = React.useState(6);
  const [editScope, setEditScope] = React.useState<"preview" | "ask" | "auto">("preview");
  const [historyDays, setHistoryDays] = React.useState(365);
  const [dark, setDark] = React.useState(false);
  const [accentHue, setAccentHue] = React.useState(286);

  const flagOn = (key: string, def: boolean) => (key in flags ? flags[key] : def);
  const toggleFlag = (key: string) => setFlags((prev) => ({ ...prev, [key]: !(key in prev ? prev[key] : true) }));

  const activeSession = snapshot.sessions.find((s) => s.id === snapshot.activeSessionId) ?? snapshot.sessions[0];
  const editingSkill = MOCK_SKILLS.find((s) => s.id === editingSkillId) ?? null;

  // ─── Model menu handlers ───
  // Defined before openModelMenu so it can be listed as a stable dependency
  // without hitting a temporal-dead-zone error in the deps array.
  const closeModelMenu = React.useCallback(() => {
    setModelPhase("out");
    if (modelCloseTimer.current) clearTimeout(modelCloseTimer.current);
    modelCloseTimer.current = setTimeout(() => {
      modelCloseTimer.current = null;
      setModelMenuOpen(false);
      setModelPhase(null);
    }, 200);
  }, []);

  const openModelMenu = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (modelMenuOpen) { closeModelMenu(); return; }
    // Read the trigger's geometry synchronously, while the synthetic event is
    // still live. React nulls out `e.currentTarget` once the handler returns,
    // so reading it later (e.g. inside a setState updater) throws and crashes
    // the whole tree.
    //
    // Position the dropdown relative to the composer, not the viewport: Obsidian
    // gives `.workspace-leaf` `contain: strict`, which makes it the containing
    // block for `position: fixed` descendants (and paint-clips them). So the
    // dropdown is rendered `position: absolute` inside `.j-chat-composer` (which
    // is `position: relative`) using composer-relative coordinates.
    const r = e.currentTarget.getBoundingClientRect();
    const composer = e.currentTarget.closest(".j-chat-composer");
    const base = composer ? composer.getBoundingClientRect() : { left: 0, top: 0 };
    const idx = Math.max(0, MOCK_MODEL_LABELS.indexOf(currentModel));
    setModelRect({ left: r.left - base.left, bottom: r.bottom - base.top, width: r.width });
    setModelIndex(idx);
    setModelMenuOpen(true);
    setModelPhase("start");
    requestAnimationFrame(() => requestAnimationFrame(() => setModelPhase("open")));
  }, [modelMenuOpen, currentModel, closeModelMenu]);

  const onModelKey = React.useCallback((e: KeyboardEvent) => {
    if (!MOCK_MODEL_LABELS.length) return;
    const i = modelIndex || 0;
    if (e.key === "ArrowDown") { e.preventDefault(); setModelIndex(Math.min(i + 1, MOCK_MODEL_LABELS.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setModelIndex(Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); setCurrentModel(MOCK_MODEL_LABELS[i]); closeModelMenu(); }
    else if (e.key === "Escape") { e.preventDefault(); closeModelMenu(); }
  }, [modelIndex, closeModelMenu]);

  React.useEffect(() => {
    if (modelMenuOpen) {
      document.addEventListener("keydown", onModelKey, true);
      return () => document.removeEventListener("keydown", onModelKey, true);
    }
  }, [modelMenuOpen, onModelKey]);

  // Close on any click outside the dropdown. A backdrop <div> can't cover the
  // whole panel here — the dropdown renders inside .j-chat-composer (bottom of
  // the leaf), so an absolute backdrop only masks the composer, leaving the
  // message area above it unclickable-to-close. A document-level listener
  // catches clicks anywhere. Routing through closeModelMenu keeps the exit
  // animation (a plain unmount would just vanish). Clicks on the dropdown or the
  // MODEL trigger are ignored so their own handlers (select / toggle) run.
  React.useEffect(() => {
    if (!modelMenuOpen) return;
    const onOutsidePointerDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.(".j-chat-model-dropdown") || target?.closest?.("[data-model-trigger]")) return;
      closeModelMenu();
    };
    document.addEventListener("mousedown", onOutsidePointerDown, true);
    return () => document.removeEventListener("mousedown", onOutsidePointerDown, true);
  }, [modelMenuOpen, closeModelMenu]);

  React.useEffect(() => () => { if (modelCloseTimer.current) clearTimeout(modelCloseTimer.current); }, []);

  const handleSend = React.useCallback(async () => {
    const trimmed = draft.trim();
    if (trimmed.length === 0 || snapshot.isSending) return;
    setDraft("");
    setScreen("chat");
    // TODO: The selected model (currentModel), active skill (activeSkillId), and
    // mode/style are cosmetic only — onSend takes just the text, so none of them
    // reach the provider. Wire these into the request: thread the model + a
    // resolved system/skill prompt through onSend (or a richer send payload) once
    // the controller supports per-message model/skill selection.
    await props.onSend(trimmed);
  }, [draft, snapshot.isSending, props]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Slash autosuggest keyboard handling is done inside Composer.
    // This is a no-op fallback for non-slash key events.
  };

  const goBackToSettings = () => setScreen("settings");
  const goBackToModes = () => setScreen("modes");
  const goBackToSkillsManage = () => setScreen("skillsManage");
  const goChat = () => setScreen("chat");

  // Quick settings rows — the MODEL row opens the model dropdown; others are
  // display-only for now (TODO: wire mode/style/preset dropdowns).
  const quickRows: QuickRow[] = [
    { kind: "model", label: "MODEL", value: currentModel, dot: "oklch(0.70 0.13 300)", onClick: (e) => { if (e) openModelMenu(e); } },
    { kind: "mode", label: "MODE", value: "Researcher", dot: "oklch(0.70 0.13 150)", onClick: () => {} },
    { kind: "style", label: "STYLE", value: "Concise", dot: "oklch(0.70 0.13 65)", onClick: () => {} },
    { kind: "preset", label: "PRESET", value: "Doc researcher", dot: "oklch(0.70 0.13 240)", onClick: () => {} }
  ];

  // Build model options for the dropdown (grouped by provider with stagger data).
  const modelOptions = React.useMemo(() => {
    const opts: { label: string; sub: string; dot: string; prov: string; notFirstGroup: boolean; selected: boolean; bg: string; optOpacity: string; optTransform: string; optTransition: string; onClick: () => void; onHover: () => void }[] = [];
    let flatIdx = 0;
    MOCK_MODEL_MENU.forEach((g, gi) => {
      g.items.forEach((m, mi) => {
        const selected = m.label === currentModel;
        const active = modelMenuOpen && flatIdx === modelIndex;
        let optOpacity = "0", optTransform = "translateY(-10px)", optTransition = "none";
        if (modelPhase === "open") {
          const d = 45 + flatIdx * 33;
          optOpacity = "1"; optTransform = "translateY(0)";
          optTransition = `opacity 0.3s ease ${d}ms, transform 0.44s cubic-bezier(0.22,1.32,0.36,1) ${d}ms`;
        } else if (modelPhase === "out") {
          optOpacity = "0"; optTransform = "translateY(0)"; optTransition = "opacity 0.12s ease";
        }
        opts.push({
          label: m.label, sub: m.sub, dot: g.dot, prov: g.prov,
          notFirstGroup: gi > 0 && mi === 0,
          selected,
          bg: active ? "var(--hover)" : (selected ? "var(--accent-tint)" : "transparent"),
          optOpacity, optTransform, optTransition,
          onClick: () => { setCurrentModel(m.label); closeModelMenu(); },
          onHover: () => setModelIndex(flatIdx),
        });
        flatIdx++;
      });
    });
    return opts;
  }, [currentModel, modelMenuOpen, modelPhase, modelIndex, closeModelMenu]);

  return (
    <section className="j-chat-root j-chat-shell">
      {/* ─── Header ─── */}
      <header className="j-chat-header">
        {/* Logo → go to chat */}
        <button type="button" className="j-chat-logo" onClick={goChat} title="Home">J</button>
        <div className="flex-1 min-w-0">
          <div className="j-chat-header-title">
            {screen === "chat" ? (activeSession?.title ?? "New chat") : screenTitle(screen)}
          </div>
          {/* Header meta: model name · message count (chat screen only). */}
          {screen === "chat" && activeSession ? (
            <div className="j-chat-header-meta">{currentModel} · {activeSession.messageCount} messages</div>
          ) : null}
        </div>
        {/* Sessions button */}
        <button type="button" className="j-chat-icon-btn" onClick={() => setScreen("sessions")} title="Sessions">
          <IconMenu width={17} height={17} />
        </button>
        {/* New chat button */}
        <button type="button" className="j-chat-icon-btn" onClick={() => { props.onNewSession(); setScreen("chat"); }} title="New chat">
          <IconPlus width={18} height={18} />
        </button>
        {/* Settings button */}
        <button type="button" className="j-chat-icon-btn" onClick={() => setScreen("settings")} title="Settings">
          <IconSettings width={17} height={17} />
        </button>
      </header>

      {/* ─── Screen content ─── */}
      {renderScreen()}

      {/* ─── Composer (chat screen only) ─── */}
      {screen === "chat" ? (
        <Composer
          draft={draft}
          onDraftChange={setDraft}
          onKeyDown={handleKeyDown}
          onSend={handleSend}
          onAttachFile={props.onAttachFile}
          onRemoveAttachment={props.onRemoveAttachment}
          attachments={snapshot.attachments}
          isSending={snapshot.isSending}
          currentModel={currentModel}
          currentFile={props.currentFile}
          skills={MOCK_SKILLS}
          activeSkillId={activeSkillId}
          onSelectSkill={(id) => { setActiveSkillId(id); setDraft(""); setScreen("chat"); }}
          onClearSkill={() => setActiveSkillId(null)}
          onOpenSkills={() => setScreen("skills")}
          scope={snapshot.restrictToCurrentFile ? "page" : "all"}
          onScopeChange={(scope) => props.onToggleRestrictToCurrentFile(scope === "page")}
          quickRows={quickRows}
          quickOpen={quickOpen}
          onToggleQuick={() => setQuickOpen((v) => !v)}
          usage={MOCK_USAGE}
          currentMode="Researcher"
          currentStyle="Concise"
          modelMenuOpen={modelMenuOpen}
          modelOptions={modelOptions}
          modelPhase={modelPhase}
          modelRect={modelRect}
          onModelRowClick={openModelMenu}
          onModelOptionClick={(label) => { setCurrentModel(label); closeModelMenu(); }}
          onModelOptionHover={setModelIndex}
          onModelMenuClose={closeModelMenu}
        />
      ) : null}
    </section>
  );

  // ─── Screen router ──────────────────────────────────────────────────────

  function renderScreen(): JSX.Element {
    switch (screen) {
      case "chat":
        return (
          <ChatScreen
            items={snapshot.items}
            activity={snapshot.activity}
            isSending={snapshot.isSending}
            error={snapshot.error}
            currentFile={props.currentFile}
            hasSelection={props.hasSelection}
            restrictToCurrentFile={snapshot.restrictToCurrentFile}
            onOpenSource={props.onOpenSource}
          />
        );

      case "sessions":
        return (
          <SessionsScreen
            sessions={snapshot.sessions}
            activeSessionId={snapshot.activeSessionId}
            onNewSession={() => { props.onNewSession(); setScreen("chat"); }}
            onSelectSession={(id) => { props.onSelectSession(id); setScreen("chat"); }}
            onRenameSession={props.onRenameSession}
            onDeleteSession={props.onDeleteSession}
            onBack={() => setScreen("chat")}
          />
        );

      case "settings":
        return (
          <SettingsScreen
            providers={MOCK_PROVIDERS}
            onOpenProvider={(p) => {
              if (p.name === "GitHub Copilot") {
                setCopilotCopied(false);
                setScreen("copilot");
              } else {
                setSelectedProvider(p);
                setShowKey(false);
                setScreen("provider");
              }
            }}
            onAddProvider={() => setScreen("onboarding")}
            onNavigate={setScreen}
            dark={dark}
            onToggleDark={() => setDark((v) => !v)}
            accentHue={accentHue}
            onAccentChange={setAccentHue}
            skillsCount={MOCK_SKILLS.length}
            modesCount={MOCK_MODES.length}
            ragOn={ragOn}
            editScope={editScope}
            localOnly={flagOn("localOnly", true)}
          />
        );

      case "provider":
        return selectedProvider ? (
          <ProviderConfigScreen
            onBack={goBackToSettings}
            provider={selectedProvider}
            models={(MOCK_PROVIDER_MODELS[selectedProvider.name] ?? []).map((m) => ({ ...m, enabled: flagOn(`${selectedProvider.name}:${m.id}`, true) }))}
            onToggleModel={(id) => toggleFlag(`${selectedProvider.name}:${id}`)}
            flags={flags}
            onToggleFlag={toggleFlag}
            showKey={showKey}
            onToggleKey={() => setShowKey((v) => !v)}
            // TODO: no-op — should send a probe request to the provider and
            // surface success/failure inline.
            onTestConnection={() => {}}
            // TODO: only navigates back; should actually delete the provider
            // from plugin settings and refresh the provider list.
            onRemoveProvider={() => setScreen("settings")}
          />
        ) : <div />;

      case "context":
        return (
          <ContextRetrievalScreen
            onBack={goBackToSettings}
            flags={flags}
            onToggleFlag={toggleFlag}
            ragOn={ragOn}
            onToggleRag={() => setRagOn((v) => !v)}
            ragTopK={ragTopK}
            onRagTopKChange={setRagTopK}
            historyDays={historyDays}
            onHistoryDaysChange={setHistoryDays}
            // TODO: no-op — should delete stored chat sessions older than the
            // retention window via the sessions store.
            onClearHistory={() => {}}
          />
        );

      case "editbeh":
        return (
          <EditBehaviorScreen
            onBack={goBackToSettings}
            editScope={editScope}
            onSetEditScope={setEditScope}
            flags={flags}
            onToggleFlag={toggleFlag}
          />
        );

      case "privacy":
        return (
          <DataPrivacyScreen
            onBack={goBackToSettings}
            flags={flags}
            onToggleFlag={toggleFlag}
            // TODO: both no-ops — export should serialize sessions/settings to a
            // JSON download; delete should wipe all stored sessions + settings
            // (behind a confirmation).
            onExportData={() => {}}
            onDeleteAllData={() => {}}
          />
        );

      case "copilot":
        return (
          <CopilotAuthScreen
            onBack={goBackToSettings}
            code="CCD6-E4C9"
            copied={copilotCopied}
            onCopyCode={() => {
              try { navigator.clipboard?.writeText("CCD6-E4C9"); } catch { /* ignore */ }
              setCopilotCopied(true);
              setTimeout(() => setCopilotCopied(false), 1600);
            }}
            onOpenDevice={() => { try { window.open("https://github.com/login/device", "_blank", "noopener"); } catch { /* ignore */ } }}
          />
        );

      case "modes":
        return (
          <ModesScreen
            onBack={goBackToSettings}
            modes={MOCK_MODES}
            onOpenMode={(m) => { setEditingMode(m); setScreen("modeEdit"); }}
            onCreateMode={() => {
              const newMode: Mode = { id: `m${Date.now()}`, name: "New mode", icon: "✎", tint: "var(--accent-tint)", iconColor: "var(--accent-text)", desc: "", model: "Sonnet 4.5", temp: 0.3, prompt: "", tools: { read: true, apply: false, search: false, fetch: false } };
              setEditingMode(newMode);
              setScreen("modeEdit");
            }}
          />
        );

      case "modeEdit":
        return editingMode ? (
          <ModeEditorScreen
            onBack={goBackToModes}
            mode={editingMode}
            onChange={setEditingMode}
            // TODO: save/delete only navigate — edits live in `editingMode`
            // local state and are discarded. Modes need a real store (they're
            // MOCK_MODES today); persist on save and remove on delete there.
            onSave={() => setScreen("modes")}
            onDelete={() => setScreen("modes")}
          />
        ) : <div />;

      case "skills":
        return (
          <SkillsPickerScreen
            onBack={goChat}
            skills={MOCK_SKILLS}
            activeSkillId={activeSkillId}
            onRunSkill={(id) => { setActiveSkillId(id); setScreen("chat"); }}
            onManage={() => setScreen("skillsManage")}
          />
        );

      case "skillsManage":
        return (
          <SkillsManageScreen
            onBack={goBackToSettings}
            skills={MOCK_SKILLS}
            onOpenSkill={(id) => { setEditingSkillId(id); setScreen("skillEdit"); }}
            onCreateSkill={() => { setNewSkillTitle(""); setNewSkillText(""); setNewSkillMethod("paste"); setScreen("skillNew"); }}
          />
        );

      case "skillEdit":
        return editingSkill ? (
          <SkillEditorScreen
            onBack={goBackToSkillsManage}
            skill={editingSkill}
            onChange={(updated) => {
              // TODO: Persist skill changes once skills storage is added.
              // For now this is local-only and won't survive re-render.
            }}
            // TODO: only navigates — should delete the skill from the skills
            // store (skills are MOCK_SKILLS today).
            onDelete={() => setScreen("skillsManage")}
          />
        ) : <div />;

      case "skillNew":
        return (
          <NewSkillScreen
            onBack={goBackToSkillsManage}
            title={newSkillTitle}
            onTitleChange={setNewSkillTitle}
            text={newSkillText}
            onTextChange={setNewSkillText}
            method={newSkillMethod}
            onMethodChange={setNewSkillMethod}
            onCreate={() => {
              // TODO: Create skill and persist once storage is added.
              setScreen("skillsManage");
            }}
            onMdDrop={(file) => {
              const reader = new FileReader();
              reader.onload = () => {
                const text = String(reader.result ?? "");
                setNewSkillText(text);
                if (!newSkillTitle) setNewSkillTitle(file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
              };
              reader.readAsText(file);
            }}
          />
        );

      case "onboarding":
        return (
          <OnboardingScreen
            providers={MOCK_PROVIDERS}
            onOpenProvider={(p) => {
              if (p.name === "GitHub Copilot") {
                setCopilotCopied(false);
                setScreen("copilot");
              } else {
                setSelectedProvider(p);
                setShowKey(false);
                setScreen("provider");
              }
            }}
            onSkip={goChat}
          />
        );

      default:
        return <div />;
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function screenTitle(screen: Screen): string {
  const titles: Partial<Record<Screen, string>> = {
    sessions: "Sessions",
    settings: "Settings",
    provider: "Provider",
    context: "Context & retrieval",
    editbeh: "Edit behavior",
    privacy: "Data & privacy",
    copilot: "GitHub Copilot",
    modes: "Modes",
    modeEdit: "Edit mode",
    skills: "Skills",
    skillsManage: "Skills",
    skillEdit: "Edit skill",
    skillNew: "New skill",
    onboarding: "Welcome"
  };
  return titles[screen] ?? "J Chat";
}

export default ChatPanel;