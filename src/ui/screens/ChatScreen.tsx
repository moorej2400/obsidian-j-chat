/**
 * ChatScreen — the main chat transcript + context banner + empty state.
 *
 * Shows messages (user bubbles, assistant turns with thinking/tool/diff),
 * the context banner at the top, and an empty state when there are no
 * messages. The Composer is rendered separately by the shell.
 *
 * Connected features:
 * - User message bubbles (from ChatItem)
 * - Assistant markdown body (via react-markdown)
 * - Error / retry card (from ChatItem.error)
 * - Source chips (from ChatItem.sources)
 * - Edit notice (from ChatItem.editCount)
 *
 * TODO features (rendered as placeholders, not yet wired):
 * - Thinking pill (collapsible) — needs provider to emit thinking traces
 * - Tool call card (collapsible) — needs agent activity events with I/O
 * - Apply-to-note diff card — needs edit-action diff rendering
 * - Per-message actions (copy, regenerate, insert, more) — needs controller methods
 */

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatItem, ChatSource } from "@/chat/chatTypes";
import type { AgentActivityEvent } from "@/providers/types";
import {
  IconBrain,
  IconWrench,
  IconCheck,
  IconCheckCircle,
  IconAlertCircle,
  IconLoader,
  IconCopy,
  IconRegenerate,
  IconPlus,
  IconMore,
  IconPencil,
  IconFile,
  type LucideProps
} from "@/ui/icons";
import { IconButtonSmall, IconButtonWide } from "@/ui/primitives";

type ChatScreenProps = {
  items: ChatItem[];
  activity: AgentActivityEvent[];
  isSending: boolean;
  error: string | null;
  currentFile: { path: string; basename: string } | null;
  hasSelection: boolean;
  restrictToCurrentFile: boolean;
  onOpenSource?: (path: string) => void;
  /** TODO: Called when the user clicks "Retry" on an error card. */
  onRetry?: () => void;
  /** TODO: Called when the user clicks "Switch model" on an error card. */
  onSwitchModel?: () => void;
};

export function ChatScreen(props: ChatScreenProps): JSX.Element {
  const transcriptRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const node = transcriptRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [props.items.length, props.isSending]);

  return (
    <div className="j-chat-screen-scroll j-chat-scroll" style={{ padding: "18px 14px 8px" }}>
      {/* Context banner */}
      <ContextBanner
        currentFile={props.currentFile}
        hasSelection={props.hasSelection}
        restrictToCurrentFile={props.restrictToCurrentFile}
      />

      {/* Messages */}
      {props.items.length === 0 && !props.isSending ? (
        <EmptyState restrictToCurrentFile={props.restrictToCurrentFile} />
      ) : (
        <div ref={transcriptRef} className="flex flex-col">
          {props.items.map((item) => (
            <Message key={item.id} item={item} onOpenSource={props.onOpenSource} />
          ))}

          {/* Thinking / agent activity while sending */}
          {props.isSending ? (
            props.activity.length > 0 ? (
              <ActivityList activity={props.activity} />
            ) : (
              <ThinkingIndicator />
            )
          ) : null}

          {/* Error card (when not sending and last item has error) */}
          {props.error && !props.isSending ? (
            <ErrorCard
              message={props.error}
              onRetry={props.onRetry}
              onSwitchModel={props.onSwitchModel}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

// ─── Context banner ────────────────────────────────────────────────────────

function ContextBanner({
  currentFile,
  hasSelection,
  restrictToCurrentFile
}: {
  currentFile: { path: string; basename: string } | null;
  hasSelection: boolean;
  restrictToCurrentFile: boolean;
}): JSX.Element {
  if (!currentFile) return <div style={{ marginBottom: 18 }} />;
  // TODO: Show actual context token count once the provider returns usage.
  const ctxLabel = restrictToCurrentFile ? "this page" : "all pages";
  return (
    <div className="j-chat-context-banner">
      <IconFile width={13} height={13} strokeWidth={2} style={{ color: "#8a8478" }} />
      <span className="j-chat-context-banner-text">
        Reading <b style={{ color: "var(--text2)", fontWeight: 600 }}>{currentFile.basename}</b> · {ctxLabel}
      </span>
      {/* TODO: Replace with real token count from provider response */}
      <span className="j-chat-context-banner-meta">4.2k ctx</span>
    </div>
  );
}

// ─── Messages ─────────────────────────────────────────────────────────────

function Message({ item, onOpenSource }: { item: ChatItem; onOpenSource?: (path: string) => void }): JSX.Element {
  if (item.role === "user") {
    return (
      <div className="j-chat-msg-user">
        <div className="j-chat-msg-user-bubble">{item.content}</div>
      </div>
    );
  }

  if (item.error) {
    return <ErrorCard message={item.error} />;
  }

  return (
    <div className="j-chat-msg-assistant">
      {/* TODO: Thinking pill — needs the provider to emit thinking traces.
          The agent activity events already carry "thinking" types, but we
          need to persist them per-message to show after generation completes. */}
      <ThinkingPillPlaceholder />

      {/* TODO: Tool call card — needs the provider to emit structured tool
          events with input/output. AgentActivityEvent has the shape but is
          transient (not persisted). We'd need to snapshot completed tool
          calls into the ChatItem to render them inline. */}
      <ToolCallPlaceholder />
      <div className="j-chat-msg-body j-chat-prose">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.content}</ReactMarkdown>
      </div>

      {/* TODO: Apply-to-note diff card — needs parseEditActions to produce
          a structured diff (old text vs new text) rather than just applying
          silently. Currently edits are applied via ObsidianEditService and
          only an editCount notice is shown. */}
      <DiffCardPlaceholder />

      {/* Edit notice (when edits were auto-applied) */}
      {item.editCount && item.editCount > 0 ? <EditNotice count={item.editCount} /> : null}

      {/* Message actions */}
      {/* TODO: Wire copy, regenerate, insert, and more menu to controller
          methods. Copy needs clipboard API. Regenerate needs controller to
          re-send the last user message. Insert needs the active editor.
          More menu needs a dropdown with delete, branch/fork, etc. */}
      <div className="j-chat-msg-actions">
        <IconButtonSmall icon={IconCopy} title="Copy" />
        <IconButtonSmall icon={IconRegenerate} title="Regenerate" />
        <IconButtonWide icon={IconPlus} label="Insert" title="Insert at cursor" />
        <span style={{ flex: 1 }} />
        <IconButtonSmall icon={IconMore} size={15} title="More" />
      </div>

      {/* Sources */}
      {item.sources && item.sources.length > 0 ? (
        <SourceChips sources={item.sources} onOpen={onOpenSource} />
      ) : null}
    </div>
  );
}

// ─── Thinking pill (placeholder) ──────────────────────────────────────────

function ThinkingPillPlaceholder(): JSX.Element | null {
  // TODO: Replace with a real collapsible thinking pill once the provider
  // emits thinking traces. The mock shows a collapsible card with
  // "Thought for 4s · planned 3 steps" and a detail section.
  // AgentActivityEvent type="thinking" has the raw data; we need to
  // persist the final thinking text into ChatItem and render it here.
  return null;
}

// ─── Tool call card (placeholder) ─────────────────────────────────────────

function ToolCallPlaceholder(): JSX.Element | null {
  // TODO: Replace with real tool call cards once the provider emits
  // structured tool events with input/output. The mock shows a card with
  // a check icon, tool name (e.g. "search_notes"), result count, and a
  // collapsible body showing input JSON and output text.
  // AgentActivityEvent type="tool" has label/detail but not structured I/O.
  // We'd need to extend AgentActivityEvent to include input/output fields
  // and persist completed tool calls per-message.
  return null;
}

// ─── Diff card (placeholder) ──────────────────────────────────────────────

function DiffCardPlaceholder(): JSX.Element | null {
  // TODO: Replace with a real diff card once edit actions produce a
  // structured diff (old lines vs new lines). The mock shows a card with
  // a header ("Proposed edit · Q3 Planning" + "+3 −1"), a diff body with
  // red/green lines, and Apply/Reject buttons.
  // Currently edits are applied silently via ObsidianEditService when
  // editing.directApply is true. To support the preview flow we need to:
  //   1. Parse edit actions from the response
  //   2. Compute a line-level diff between old and new text
  //   3. Show the diff card with Apply/Reject
  //   4. Only apply on user confirmation (when edit scope = "preview")
  return null;
}

// ─── Edit notice ───────────────────────────────────────────────────────────

function EditNotice({ count }: { count: number }): JSX.Element {
  return (
    <div className="j-chat-edit-notice" style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--faint)" }}>
      <IconPencil width={12} height={12} />
      <span>Applied {count} edit{count === 1 ? "" : "s"} to active note</span>
    </div>
  );
}

// ─── Source chips ─────────────────────────────────────────────────────────

function SourceChips({ sources, onOpen }: { sources: ChatSource[]; onOpen?: (path: string) => void }): JSX.Element {
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {sources.map((source, i) => (
        <button
          key={`${source.path}-${i}`}
          type="button"
          onClick={onOpen ? () => onOpen(source.path) : undefined}
          className="j-chat-chip"
          style={{ background: "var(--chip)", borderColor: "var(--border)", color: "var(--mid)" }}
          title={source.path}
        >
          <IconFile width={11} height={11} />
          <span className="truncate" style={{ maxWidth: 120 }}>{basename(source.path)}</span>
          <span style={{ fontSize: 9, opacity: 0.7 }}>{source.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Activity list (while sending) ─────────────────────────────────────────

function ActivityList({ activity }: { activity: AgentActivityEvent[] }): JSX.Element {
  return (
    <div className="j-chat-msg-assistant">
      {activity.map((event) => (
        <ActivityRow key={event.id} event={event} />
      ))}
    </div>
  );
}

function ActivityRow({ event }: { event: AgentActivityEvent }): JSX.Element {
  const isRunning = event.status === "running";
  const isError = event.status === "error";
  const isTool = event.type === "tool";

  return (
    <div
      className="j-chat-tool-card"
      style={isError ? { borderColor: "var(--err-bd)", background: "var(--err-bg)" } : undefined}
    >
      <div className="j-chat-tool-header">
        <span
          style={{
            width: 16,
            height: 16,
            borderRadius: 5,
            background: isError ? "var(--err-bg)" : isRunning ? "var(--accent-tint)" : "var(--ok-tint)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "none"
          }}
        >
          {isRunning ? (
            <IconLoader width={10} height={10} className="j-chat-spin" style={{ color: "var(--accent)" }} />
          ) : isError ? (
            <IconAlertCircle width={10} height={10} style={{ color: "var(--err-btn)" }} />
          ) : isTool ? (
            <IconWrench width={10} height={10} style={{ color: "var(--ok)" }} />
          ) : (
            <IconCheck width={10} height={10} style={{ color: "var(--ok)" }} />
          )}
        </span>
        <span className="j-chat-tool-name">{event.label}</span>
        {event.detail ? <span className="j-chat-tool-detail">{event.detail}</span> : null}
      </div>
    </div>
  );
}

// ─── Thinking indicator ───────────────────────────────────────────────────

function ThinkingIndicator(): JSX.Element {
  return (
    <div className="j-chat-msg-assistant">
      <div className="j-chat-thinking-pill">
        <IconBrain width={13} height={13} style={{ color: "#7a74e0" }} />
        <span className="j-chat-thinking-text">Thought for 4s · planned 3 steps</span>
      </div>
    </div>
  );
}

// ─── Error card ────────────────────────────────────────────────────────────

function ErrorCard({
  message,
  onRetry,
  onSwitchModel
}: {
  message: string;
  onRetry?: () => void;
  onSwitchModel?: () => void;
}): JSX.Element {
  return (
    <div className="j-chat-msg-assistant">
      <div className="j-chat-error-card">
        <IconAlertCircle width={16} height={16} style={{ flex: "none", marginTop: 1, color: "var(--err-btn)" }} />
        <div className="flex-1">
          <div className="j-chat-error-title">{message}</div>
          <div className="j-chat-error-text">Too many requests. Retry in a few seconds or switch model.</div>
          <div className="flex gap-2 mt-2">
            {/* TODO: Wire onRetry to controller re-send last user message. */}
            <button className="j-chat-error-retry" onClick={onRetry}>Retry</button>
            {/* TODO: Wire onSwitchModel to open the model picker. */}
            <button className="j-chat-error-switch" onClick={onSwitchModel}>Switch model</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────

function EmptyState({ restrictToCurrentFile }: { restrictToCurrentFile: boolean }): JSX.Element {
  return (
    <div className="j-chat-empty-state">
      <IconBrain width={24} height={24} style={{ color: "var(--accent)" }} />
      <div className="j-chat-empty-state-title">Ask about this note</div>
      <div className="j-chat-empty-state-desc">
        {restrictToCurrentFile
          ? "The next answer will stay inside the current file unless you add more context."
          : "Vault retrieval is on, so relevant notes can be pulled into the answer."}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function basename(path: string): string {
  const slash = path.lastIndexOf("/");
  return slash >= 0 ? path.slice(slash + 1) : path;
}