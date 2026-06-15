/**
 * SessionsScreen — session history list with search, bookmarked, and groups.
 *
 * Connected features:
 * - Session list with title, snippet, relative time
 * - Active session indicator (dot + highlighted background)
 * - Search input (client-side filter)
 * - New session button
 * - Session click → switches to chat
 *
 * TODO features (rendered as placeholders, not yet wired):
 * - Bookmarked/pinned section at the top — needs a "pinned" flag on sessions
 * - Rename via swipe/long-press menu — needs a context menu per session
 * - Delete via context menu — needs confirmation dialog
 * - Bookmark toggle — needs a "pinned" flag on ChatSession
 */

import * as React from "react";
import type { ChatSessionSummary } from "@/chat/chatSessions";
import { IconPlus, IconSearch, IconStar } from "@/ui/icons";

type SessionsScreenProps = {
  sessions: ChatSessionSummary[];
  activeSessionId: string;
  onNewSession: () => void;
  onSelectSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, title: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onBack: () => void;
};

// Mock pinned sessions — the mock shows one bookmarked session.
// TODO: Replace with a "pinned" flag on ChatSessionSummary.
const MOCK_PINNED = [
  { title: "Launch checklist", snippet: "Draft the go-live runbook…", meta: "Sonnet · 8 msg" }
];

export function SessionsScreen(props: SessionsScreenProps): JSX.Element {
  const [query, setQuery] = React.useState("");
  const normalized = query.trim().toLowerCase();
  const filtered = normalized
    ? props.sessions.filter((s) => s.title.toLowerCase().includes(normalized))
    : props.sessions;

  const groups = groupSessionsByDate(filtered);

  return (
    <>
      {/* Header */}
      <div className="j-chat-sessions-header">
        <span className="j-chat-sessions-title">Sessions</span>
        <button type="button" className="j-chat-btn-primary" onClick={props.onNewSession}>
          <IconPlus width={12} height={12} strokeWidth={2.4} strokeLinecap="round" />
          New
        </button>
      </div>

      {/* Search */}
      <div className="j-chat-sessions-search">
        <div className="j-chat-sessions-search-box">
          <IconSearch width={15} height={15} style={{ color: "var(--dim)" }} />
          <input
            className="j-chat-sessions-search-input"
            placeholder="Search sessions"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="j-chat-screen-scroll j-chat-scroll" style={{ padding: "2px 14px 14px" }}>
        {/* Bookmarked / pinned */}
        {MOCK_PINNED.length > 0 ? (
          <>
            <div className="flex items-center gap-1.5" style={{ padding: "8px 2px 7px" }}>
              <IconStar width={12} height={12} style={{ color: "var(--star)", fill: "var(--star)" }} strokeWidth={1.5} />
              <span className="j-chat-mono" style={{ fontSize: 9.5, color: "var(--dim)", letterSpacing: "0.05em" }}>BOOKMARKED</span>
            </div>
            {/* TODO: onClick is a stub — it opens the active session, not this
                pinned one, because MOCK_PINNED entries have no real session id.
                Wire to the pinned session's id once sessions carry a pinned flag. */}
            {MOCK_PINNED.map((s, i) => (
              <PinnedCard key={i} title={s.title} snippet={s.snippet} meta={s.meta} onClick={() => props.onSelectSession(props.activeSessionId)} />
            ))}
          </>
        ) : null}

        {/* Date groups */}
        {groups.map((group) =>
          group.items.length === 0 ? null : (
            <React.Fragment key={group.label}>
              <div className="j-chat-section-label" style={{ padding: "12px 2px 7px" }}>
                {group.label}
              </div>
              {group.items.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  isActive={session.id === props.activeSessionId}
                  onClick={() => props.onSelectSession(session.id)}
                />
              ))}
            </React.Fragment>
          )
        )}

        {filtered.length === 0 && MOCK_PINNED.length === 0 ? (
          <div className="j-chat-empty-state" style={{ minHeight: 140 }}>
            <IconSearch width={20} height={20} style={{ color: "var(--faint)" }} />
            <div className="j-chat-empty-state-desc">
              {query ? `No sessions match "${query}"` : "No sessions yet. Start a new chat!"}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

// ─── Pinned session card ──────────────────────────────────────────────────

function PinnedCard({ title, snippet, meta, onClick }: { title: string; snippet: string; meta: string; onClick: () => void }): JSX.Element {
  return (
    <div className="j-chat-session-item" onClick={onClick}>
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
        <div style={{ fontSize: 11.5, color: "var(--faint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{snippet}</div>
      </div>
      <span className="j-chat-mono" style={{ fontSize: 9.5, color: "var(--faint)", alignSelf: "center", whiteSpace: "nowrap" }}>{meta}</span>
    </div>
  );
}

// ─── Session row ───────────────────────────────────────────────────────────

function SessionRow({
  session,
  isActive,
  onClick
}: {
  session: ChatSessionSummary;
  isActive: boolean;
  onClick: () => void;
}): JSX.Element {
  return (
    <div
      className="j-chat-session-item-row"
      style={{ background: isActive ? "var(--chip)" : "transparent" }}
      onClick={onClick}
    >
      <span
        className="j-chat-session-dot"
        style={{ background: isActive ? "var(--accent)" : "transparent" }}
      />
      <div className="flex-1 min-w-0">
        <div className="j-chat-session-item-title">{session.title}</div>
        <div className="j-chat-session-item-snippet">{session.messageCount} messages</div>
      </div>
      <span className="j-chat-session-item-meta" style={{ alignSelf: "flex-start", marginTop: 2 }}>
        {formatRelative(session.updatedAt)}
      </span>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function groupSessionsByDate(sessions: ChatSessionSummary[]): { label: string; items: ChatSessionSummary[] }[] {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const today: ChatSessionSummary[] = [];
  const yesterday: ChatSessionSummary[] = [];
  const earlier: ChatSessionSummary[] = [];

  for (const s of sessions) {
    const age = now - s.updatedAt;
    if (age < oneDay) today.push(s);
    else if (age < 2 * oneDay) yesterday.push(s);
    else earlier.push(s);
  }

  return [
    { label: "TODAY", items: today },
    { label: "YESTERDAY", items: yesterday },
    { label: "EARLIER", items: earlier }
  ];
}

function formatRelative(ts: number): string {
  const delta = Math.max(0, Date.now() - ts);
  const min = Math.floor(delta / 60000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d`;
  return new Date(ts).toLocaleDateString();
}