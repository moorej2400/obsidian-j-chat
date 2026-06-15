/**
 * Composer — the bottom input bar with quick-settings panel, context chips,
 * slash autosuggest, textarea, and meta row (model + usage).
 *
 * Connected features:
 * - Text input with Enter-to-send / Shift+Enter for newline
 * - Attach file button (calls onAttachFile → opens FileAttachModal)
 * - Send button (disabled when empty or sending)
 * - Model button + quick-settings expandable panel
 * - Context chips (attached files, current page, active skill)
 * - Model dropdown menu (grouped by provider, staggered animations)
 * - Usage meter + hover detail panel
 * - Slash autosuggest for skills
 *
 * TODO features (rendered as placeholders, not yet wired):
 * - Mode/style/preset dropdowns (only model has a dropdown now)
 * - Menu-aim trapezoid algorithm for usage hover (using simple enter/leave)
 */

import * as React from "react";
import type { AttachedFile } from "@/chat/chatTypes";
import {
  IconAttach,
  IconSkill,
  IconSend,
  IconChevronDown,
  IconX,
  IconPlus,
  IconFile,
  IconCheck,
  type LucideProps
} from "@/ui/icons";
import type { QuickRow, Scope, Skill } from "@/ui/screens/types";

type ModelOption = {
  label: string;
  sub: string;
  dot: string;
  prov: string;
  notFirstGroup: boolean;
  selected: boolean;
  bg: string;
  optOpacity: string;
  optTransform: string;
  optTransition: string;
  onClick: () => void;
  onHover: () => void;
};

type ComposerProps = {
  draft: string;
  onDraftChange: (value: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  onAttachFile: () => void;
  onRemoveAttachment: (path: string) => void;
  attachments: AttachedFile[];
  isSending: boolean;
  currentModel: string;
  currentMode?: string;
  currentStyle?: string;
  currentFile?: { path: string; basename: string } | null;
  skills?: Skill[];
  onSelectSkill?: (skillId: string) => void;
  onOpenSkills?: () => void;
  onScopeChange?: (scope: Scope) => void;
  scope?: Scope;
  activeSkillId?: string | null;
  onClearSkill?: () => void;
  quickRows?: QuickRow[];
  quickOpen?: boolean;
  onToggleQuick?: () => void;
  usage?: {
    costUsd: string;
    ctxPct: number;
    ctxUsedTokens: string;
    ctxMaxTokens: string;
    sessionCost: string;
    tokensIO: string;
  };
  modelMenuOpen?: boolean;
  modelOptions?: ModelOption[];
  modelPhase?: "start" | "open" | "out" | null;
  modelRect?: { left: number; bottom: number; width: number } | null;
  onModelRowClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onModelOptionClick?: (label: string) => void;
  onModelOptionHover?: (index: number) => void;
  onModelMenuClose?: () => void;
};

export function Composer(props: ComposerProps): JSX.Element {
  const [focused, setFocused] = React.useState(false);
  const canSend = props.draft.trim().length > 0 && !props.isSending;
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (canSend) props.onSend();
    } else {
      props.onKeyDown(e);
    }
  };

  // Slash autosuggest — derives the slash label from the skill's frontmatter
  // `name:` field (not slugified title) to match the mock's data model.
  const skills = props.skills ?? [];
  const slashActive = props.draft.charAt(0) === "/";
  const slashQuery = slashActive ? props.draft.slice(1).toLowerCase().trim() : "";
  const slashMatches = slashActive
    ? skills.filter((s) => {
        const fmName = parseFMName(s.text);
        const haystack = (fmName + " " + s.title).toLowerCase();
        return haystack.includes(slashQuery);
      })
    : [];
  const slashOpen = slashActive && slashMatches.length > 0;

  const [slashIndex, setSlashIndex] = React.useState(0);
  React.useEffect(() => {
    setSlashIndex(0);
  }, [props.draft]);

  const handleSlashKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!slashOpen) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setSlashIndex((i) => Math.min(i + 1, slashMatches.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSlashIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Tab") {
      e.preventDefault();
      const match = slashMatches[slashIndex];
      if (match && props.onSelectSkill) { props.onSelectSkill(match.id); }
    }
  };

  // Stagger animation values for quick panel rows and scope row.
  const quickOpen = props.quickOpen ?? false;

  return (
    <div className="j-chat-composer">
      {/* Quick settings panel */}
      <QuickPanel
        open={quickOpen}
        rows={props.quickRows}
        scope={props.scope}
        onScopeChange={props.onScopeChange}
        onModelRowClick={props.onModelRowClick}
      />

      {/* Model dropdown — rendered at composer level (position: absolute vs the
          composer) so it isn't clipped/mispositioned by the workspace-leaf's
          `contain: strict`, which would break a viewport-fixed popover.
          Outside-click-to-close is handled by a document listener in ChatPanel
          (see there for why a backdrop <div> can't cover the whole panel). */}
      {props.modelMenuOpen && props.modelRect && props.modelOptions ? (
        <ModelDropdown
          rect={props.modelRect}
          phase={props.modelPhase ?? null}
          options={props.modelOptions}
          onOptionClick={props.onModelOptionClick}
          onOptionHover={props.onModelOptionHover}
        />
      ) : null}

      {/* Context chips */}
      <div className="flex gap-1.5 mb-2 flex-wrap">
        {/* Current page chip (accent-tint, @basename) */}
        {props.currentFile ? (
          <span className="j-chat-chip" title={props.currentFile.path}>
            <IconFile width={11} height={11} strokeWidth={2.2} />
            @{props.currentFile.basename}
          </span>
        ) : null}

        {/* Attached file chips */}
        {props.attachments.map((file) => (
          <span key={file.path} className="j-chat-chip" title={file.path}>
            <IconFile width={11} height={11} strokeWidth={2.2} />
            {basename(file.path)}
            <button
              type="button"
              onClick={() => props.onRemoveAttachment(file.path)}
              className="j-chat-chip-remove"
              aria-label={`Remove ${file.path}`}
            >
              <IconX width={10} height={10} strokeWidth={2.4} />
            </button>
          </span>
        ))}

        {/* Add context button */}
        <button type="button" className="j-chat-chip-dashed" onClick={props.onAttachFile}>
          <IconPlus width={11} height={11} strokeWidth={2.2} strokeLinecap="round" />
          Add context
        </button>

        {/* Active skill chip */}
        {props.activeSkillId && props.skills ? (() => {
          const skill = props.skills.find((s) => s.id === props.activeSkillId);
          if (!skill) return null;
          return (
            <span className="j-chat-chip">
              <IconSkill width={11} height={11} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
              {skill.title}
              <button
                type="button"
                onClick={props.onClearSkill}
                className="j-chat-chip-remove"
                aria-label="Clear skill"
              >
                <IconX width={10} height={10} strokeWidth={2.4} />
              </button>
            </span>
          );
        })() : null}

        {/* Use skill button (when no skill is active) */}
        {!props.activeSkillId && props.onOpenSkills ? (
          <button type="button" className="j-chat-chip-dashed" onClick={props.onOpenSkills}>
            <IconSkill width={11} height={11} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            Use skill
          </button>
        ) : null}
      </div>

      {/* Slash autosuggest */}
      {slashOpen ? (
        <div className="j-chat-slash">
          <div className="j-chat-slash-label">SKILLS</div>
          {slashMatches.map((skill, idx) => {
            const fm = parseFM(skill.text);
            return (
              <button
                key={skill.id}
                type="button"
                className={`j-chat-slash-item ${idx === slashIndex ? "is-active" : ""}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (props.onSelectSkill) props.onSelectSkill(skill.id);
                }}
                onMouseEnter={() => setSlashIndex(idx)}
              >
                <span style={{ width: 8, height: 8, borderRadius: 3, background: skill.color, flex: "none" }} />
                <span className="flex-1 min-w-0">
                  <span className="block j-chat-slash-item-title">{skill.title}</span>
                  <span className="block j-chat-slash-item-desc">{fm.description || "Custom skill"}</span>
                </span>
                <span className="j-chat-slash-item-tag">/{fm.name || slugify(skill.title)}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Input box */}
      <div className={`j-chat-composer-input ${focused ? "is-focused" : ""}`}>
        <textarea
          ref={textareaRef}
          value={props.draft}
          onChange={(e) => props.onDraftChange(e.target.value)}
          onKeyDown={(e) => { handleSlashKey(e); handleKeyDown(e); }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Ask anything, or / for a skill…"
          rows={1}
          className="j-chat-composer-textarea"
          style={{ minHeight: 20, maxHeight: 120 }}
        />
        <div className="j-chat-composer-bar">
          <button type="button" className="j-chat-composer-attach" onClick={props.onAttachFile} title="Attach">
            <IconAttach width={16} height={16} />
          </button>
          {props.onOpenSkills ? (
            <button type="button" className="j-chat-composer-attach" onClick={props.onOpenSkills} title="Skills">
              <IconSkill width={15} height={15} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </button>
          ) : null}
          <span style={{ flex: 1 }} />
          <button
            type="button"
            className="j-chat-composer-send"
            disabled={!canSend}
            onClick={props.onSend}
            title="Send"
            aria-label="Send message"
          >
            <IconSend width={16} height={16} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          </button>
        </div>
      </div>

      {/* Meta row */}
      <div className="j-chat-meta-row">
        <button
          type="button"
          className="j-chat-model-btn"
          onClick={props.onToggleQuick}
          style={{ background: props.quickOpen ? "var(--hover)" : "var(--bg)" }}
        >
          <span className="j-chat-model-btn-dot" />
          <span className="j-chat-model-btn-label">{props.currentModel}</span>
          <IconChevronDown
            width={11}
            height={11}
            strokeWidth={2.4}
            strokeLinecap="round"
            style={{ color: "var(--dim)", transform: props.quickOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
          />
        </button>

        {props.currentMode ? (
          <span className="j-chat-mono" style={{ fontSize: 10, color: "var(--faint)" }}>
            {props.currentMode}{props.currentStyle ? ` · ${props.currentStyle}` : ""}
          </span>
        ) : null}

        <span style={{ flex: 1 }} />

        {props.usage ? (
          <UsageMeter usage={props.usage} />
        ) : null}
      </div>
    </div>
  );
}

// ─── Quick settings panel + model dropdown ──────────────────────────────────

function QuickPanel({
  open,
  rows,
  scope,
  onScopeChange,
  onModelRowClick
}: {
  open: boolean;
  rows?: QuickRow[];
  scope?: Scope;
  onScopeChange?: (scope: Scope) => void;
  onModelRowClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}): JSX.Element {
  return (
    <div
      style={{
        overflow: "hidden",
        minHeight: 0,
        maxHeight: open ? "400px" : "0px",
        opacity: open ? "1" : "0",
        transition: "max-height 0.44s cubic-bezier(0.32,0.72,0,1), opacity 0.3s ease"
      }}
    >
      <div className="j-chat-quick-grid">
        {rows?.map((row, i) => {
          const isOpen = open;
          const itemOpacity = isOpen ? "1" : "0";
          const itemTransform = isOpen ? "translateY(0) scale(1)" : "translateY(10px) scale(0.97)";
          const itemTransition = `opacity 0.34s cubic-bezier(0.22,0.61,0.36,1) ${isOpen ? 60 + i * 65 : 0}ms, transform 0.42s cubic-bezier(0.22,1.2,0.36,1) ${isOpen ? 60 + i * 65 : 0}ms`;
          const isModelRow = row.kind === "model";
          return (
            <button
              key={row.kind}
              type="button"
              className="j-chat-quick-row"
              // Marks the MODEL row so ChatPanel's outside-click listener doesn't
              // treat opening the dropdown as an outside click (which would close
              // it in the same gesture that opened it).
              data-model-trigger={isModelRow ? "" : undefined}
              onClick={(e) => {
                if (isModelRow && onModelRowClick) onModelRowClick(e);
                else row.onClick(e);
              }}
              style={{ opacity: itemOpacity, transform: itemTransform, transition: itemTransition, willChange: "opacity,transform" }}
            >
              <span className="flex items-center gap-1.5">
                <span style={{ width: 6, height: 6, borderRadius: 2, background: row.dot, flex: "none" }} />
                <span className="j-chat-quick-row-label">{row.label}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="j-chat-quick-row-value">{row.value}</span>
                <IconChevronDown width={11} height={11} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--dim)" }} />
              </span>
            </button>
          );
        })}

        {/* Scope toggle row with staggered animation */}
        {scope && onScopeChange ? (() => {
          const scopeOpacity = open ? "1" : "0";
          const scopeTransform = open ? "translateY(0) scale(1)" : "translateY(10px) scale(0.97)";
          const scopeTransition = `opacity 0.34s cubic-bezier(0.22,0.61,0.36,1) ${open ? 320 : 0}ms, transform 0.42s cubic-bezier(0.22,1.2,0.36,1) ${open ? 320 : 0}ms`;
          return (
            <div
              className="j-chat-quick-scope"
              style={{ opacity: scopeOpacity, transform: scopeTransform, transition: scopeTransition, willChange: "opacity,transform" }}
            >
              <span style={{ width: 6, height: 6, borderRadius: 2, background: "oklch(0.70 0.13 190)", flex: "none" }} />
              <span className="j-chat-quick-row-label">SCOPE</span>
              <div className="flex-1 flex gap-1 justify-end">
                <button
                  className={`j-chat-scope-btn ${scope === "page" ? "is-active" : ""}`}
                  onClick={() => onScopeChange("page")}
                >
                  This page
                </button>
                <button
                  className={`j-chat-scope-btn ${scope === "all" ? "is-active" : ""}`}
                  onClick={() => onScopeChange("all")}
                >
                  All pages
                </button>
              </div>
            </div>
          );
        })() : null}
      </div>
    </div>
  );
}

// ─── Model dropdown ──────────────────────────────────────────────────────────

function ModelDropdown({
  rect,
  phase,
  options,
  onOptionClick,
  onOptionHover
}: {
  rect: { left: number; bottom: number; width: number };
  phase: "start" | "open" | "out" | null;
  options: ModelOption[];
  onOptionClick?: (label: string) => void;
  onOptionHover?: (index: number) => void;
}): JSX.Element {
  const panelOpacity = phase === "open" ? "1" : "0";
  const panelTransform = phase === "open"
    ? "translateY(0) scale(1)"
    : phase === "out"
      ? "translateY(-5px) scale(0.97)"
      : "translateY(-8px) scale(0.975)";
  const panelTransition = phase === "out"
    ? "opacity 0.17s cubic-bezier(0.4,0,1,1), transform 0.2s cubic-bezier(0.4,0,1,1)"
    : phase === "open"
      ? "opacity 0.2s ease, transform 0.36s cubic-bezier(0.2,0.9,0.3,1)"
      : "none";

  return (
    <div
      className="j-chat-model-dropdown j-chat-thin j-chat-scroll"
      style={{
        position: "absolute",
        left: rect.left,
        width: Math.max(rect.width, 190),
        top: rect.bottom + 6,
        background: "var(--surface)",
        border: "1px solid var(--border2)",
        borderRadius: 10,
        boxShadow: "0 14px 36px -10px rgba(40,36,30,0.32), 0 0 0 1px rgba(40,36,30,0.04)",
        padding: 5,
        zIndex: 30,
        maxHeight: 300,
        overflowY: "auto",
        transformOrigin: "top center",
        opacity: panelOpacity,
        transform: panelTransform,
        transition: panelTransition,
        willChange: "opacity,transform",
      }}
    >
      {options.map((m, idx) => (
        <React.Fragment key={m.prov + ":" + m.label}>
          {m.notFirstGroup ? (
            <div style={{ height: 1, background: "var(--border)", margin: "4px 8px", transform: "scaleY(0.5)" }} />
          ) : null}
          <button
            type="button"
            onClick={() => onOptionClick ? onOptionClick(m.label) : m.onClick()}
            onMouseEnter={() => onOptionHover ? onOptionHover(idx) : m.onHover()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              margin: "1.5px 0",
              padding: "7px 8px",
              border: "none",
              background: m.bg,
              borderRadius: 7,
              cursor: "pointer",
              textAlign: "left",
              fontFamily: "inherit",
              opacity: m.optOpacity,
              transform: m.optTransform,
              transition: m.optTransition,
              willChange: "opacity,transform",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: 2, background: m.dot, flex: "none" }} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 12, color: "var(--text)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.label}</span>
              <span style={{ display: "block", fontSize: 9, color: "var(--faint)", fontFamily: "'IBM Plex Mono', monospace" }}>{m.sub}</span>
            </span>
            {m.selected ? (
              <IconCheck width={13} height={13} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none", color: "var(--accent-text)" }} />
            ) : null}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Usage meter ───────────────────────────────────────────────────────────

function UsageMeter({ usage }: { usage: NonNullable<ComposerProps["usage"]> }): JSX.Element {
  const [hover, setHover] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const popRef = React.useRef<HTMLDivElement | null>(null);

  return (
    <div
      ref={wrapRef}
      className="j-chat-usage"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {hover ? (
        <div ref={popRef} className="j-chat-usage-pop">
          <div className="flex items-center justify-between mb-2">
            <span className="j-chat-mono" style={{ fontSize: 9.5, color: "var(--dim)", letterSpacing: "0.05em" }}>CONTEXT WINDOW</span>
            <span className="j-chat-mono" style={{ fontSize: 10, color: "var(--accent-text)", fontWeight: 600 }}>{usage.ctxPct}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 99, background: "var(--chip)", overflow: "hidden", marginBottom: 6 }}>
            <div style={{ width: `${usage.ctxPct}%`, height: "100%", background: "var(--accent)", borderRadius: 99 }} />
          </div>
          <div className="flex justify-between j-chat-mono" style={{ fontSize: 10, color: "var(--faint)", marginBottom: 11 }}>
            <span>{usage.ctxUsedTokens} used</span>
            <span>{usage.ctxMaxTokens} limit</span>
          </div>
          <div style={{ height: 1, background: "var(--hover)", margin: "0 -2px 10px" }} />
          <div className="flex flex-col gap-2">
            <UsageRow label="This message" value={usage.costUsd} />
            <UsageRow label="Session total" value={usage.sessionCost} />
            <UsageRow label="Tokens in · out" value={usage.tokensIO} />
          </div>
        </div>
      ) : null}
      <span className="j-chat-usage-cost">{usage.costUsd}</span>
      <span className="j-chat-usage-dot" />
      <span className="j-chat-usage-bar">
        <span className="j-chat-usage-bar-fill" style={{ width: `${usage.ctxPct}%` }} />
      </span>
    </div>
  );
}

function UsageRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="flex items-center justify-between">
      <span style={{ fontSize: 11.5, color: "var(--mid)" }}>{label}</span>
      <span className="j-chat-mono" style={{ fontSize: 11, color: "var(--text2)", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function basename(path: string): string {
  const slash = path.lastIndexOf("/");
  return slash >= 0 ? path.slice(slash + 1) : path;
}

function slugify(str: string): string {
  return String(str).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "skill";
}

// Parse YAML frontmatter `name:` field from skill text.
function parseFMName(text: string): string {
  const m = /^---\s*\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!m) return "";
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0 && line.slice(0, i).trim().toLowerCase() === "name") {
      return line.slice(i + 1).trim();
    }
  }
  return "";
}

// Parse frontmatter into { name, description }.
function parseFM(text: string): { name: string; description: string } {
  const m = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/.exec(text);
  if (!m) return { name: "", description: "" };
  const meta: Record<string, string> = {};
  m[1].split("\n").forEach((line) => {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim();
  });
  const body = m[2] || "";
  const firstBody = (body.split("\n").find((l) => l.trim() && !/^#/.test(l.trim())) || "").slice(0, 80);
  return { name: meta.name || "", description: meta.description || firstBody || "" };
}