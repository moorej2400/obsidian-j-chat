import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  AlertCircle,
  Bot,
  BookMarked,
  Brain,
  CircleDot,
  FileSearch,
  FileText,
  HelpCircle,
  Highlighter,
  History,
  Lightbulb,
  Loader2,
  Menu,
  MessageSquareText,
  Paperclip,
  Pencil,
  Plus,
  RadioTower,
  Search,
  Send,
  Settings,
  SlidersHorizontal,
  Sparkles,
  SquarePen,
  Wand2,
  Wrench,
  X
} from "lucide-react";
import type { AttachedFile, ChatItem, ChatSource } from "@/chat/chatTypes";
import type { ChatSessionSummary } from "@/chat/chatSessions";
import type { AgentActivityEvent } from "@/providers/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

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
  onInsertSelection?: () => string | void | Promise<string | void>;
  onOpenSource?: (path: string) => void;
  onOpenSettings?: () => void;
};

type PanelPage = "chat" | "history" | "prompts" | "settings";

function pageTitle(page: PanelPage): string {
  if (page === "history") return "Chat history";
  if (page === "prompts") return "Prompt templates";
  if (page === "settings") return "Control center";
  return "J Chat";
}

export function ChatPanel(props: ChatPanelProps): JSX.Element {
  const { snapshot, providerStatus } = props;
  const [draft, setDraft] = React.useState("");
  const [page, setPage] = React.useState<PanelPage>("chat");
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [renameDraft, setRenameDraft] = React.useState("");
  const transcriptRef = React.useRef<HTMLDivElement | null>(null);
  const activeSession = snapshot.sessions.find((session) => session.id === snapshot.activeSessionId) ?? snapshot.sessions[0];

  React.useEffect(() => {
    const node = transcriptRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [snapshot.items.length, snapshot.isSending, page]);

  React.useEffect(() => {
    setRenameDraft(activeSession?.title ?? "");
  }, [activeSession?.id, activeSession?.title]);

  const handleSend = React.useCallback(async () => {
    const trimmed = draft.trim();
    if (trimmed.length === 0 || snapshot.isSending) return;
    setDraft("");
    setPage("chat");
    await props.onSend(trimmed);
  }, [draft, snapshot.isSending, props]);

  const insertSelection = React.useCallback(async () => {
    const freshSelection = await props.onInsertSelection?.();
    const selectedText = (typeof freshSelection === "string" ? freshSelection : props.selectedText)?.trim();
    if (!selectedText) return;
    setDraft((current) => `${current}${current.trim().length > 0 ? "\n\n" : ""}${selectedText}`);
    setPage("chat");
  }, [props]);

  const useTemplate = React.useCallback((prompt: string) => {
    setDraft(prompt);
    setPage("chat");
    setDrawerOpen(false);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <section className="j-chat-root j-chat-shell relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-background text-foreground">
      <AppTopBar
        page={page}
        currentSession={activeSession}
        providerStatus={providerStatus}
        onToggleDrawer={() => setDrawerOpen((open) => !open)}
        onNewSession={() => {
          props.onNewSession();
          setPage("chat");
        }}
        onOpenSettings={() => {
          setPage("settings");
        }}
      />

      <SideDrawer
        open={drawerOpen}
        page={page}
        onNavigate={(next) => {
          setPage(next);
          setDrawerOpen(false);
        }}
        onClose={() => setDrawerOpen(false)}
        onOpenSettings={props.onOpenSettings}
      />

      {page === "chat" ? (
        <ChatWorkspace
          {...props}
          transcriptRef={transcriptRef}
          onInsertSelection={insertSelection}
        />
      ) : page === "history" ? (
        <HistoryPane
          sessions={snapshot.sessions}
          activeSessionId={snapshot.activeSessionId}
          renameDraft={renameDraft}
          onRenameDraftChange={setRenameDraft}
          onNewSession={() => {
            props.onNewSession();
            setPage("chat");
          }}
          onSelectSession={(sessionId) => {
            props.onSelectSession(sessionId);
            setPage("chat");
          }}
          onRenameSession={() => {
            props.onRenameSession(snapshot.activeSessionId, renameDraft);
          }}
        />
      ) : page === "prompts" ? (
        <PromptLibrary
          hasSelection={props.hasSelection}
          currentFile={props.currentFile}
          onUseTemplate={useTemplate}
          onOpenSettings={props.onOpenSettings}
        />
      ) : (
        <SettingsHub
          providerStatus={providerStatus}
          snapshot={snapshot}
          currentFile={props.currentFile}
          hasSelection={props.hasSelection}
          selectedText={props.selectedText}
          onOpenSettings={props.onOpenSettings}
          onToggleRestrictToCurrentFile={props.onToggleRestrictToCurrentFile}
        />
      )}

      {page === "chat" ? <BottomNav page={page} onNavigate={setPage} /> : null}

      {page === "chat" ? (
        <Composer
          draft={draft}
          onDraftChange={setDraft}
          onKeyDown={handleKeyDown}
          onSend={handleSend}
          onInsertSelection={insertSelection}
          onAttachFile={props.onAttachFile}
          onRemoveAttachment={props.onRemoveAttachment}
          attachments={snapshot.attachments}
          hasSelection={props.hasSelection}
          isSending={snapshot.isSending}
        />
      ) : null}

      {page !== "chat" ? <BottomNav page={page} onNavigate={setPage} /> : null}
    </section>
  );
}

function AppTopBar({
  page,
  currentSession,
  providerStatus,
  onToggleDrawer,
  onNewSession,
  onOpenSettings
}: {
  page: PanelPage;
  currentSession?: ChatSessionSummary;
  providerStatus: ProviderStatus;
  onToggleDrawer: () => void;
  onNewSession: () => void;
  onOpenSettings: () => void;
}): JSX.Element {
  return (
    <header className="j-chat-app-bar">
      <div className="flex min-w-0 items-center gap-2">
        <Button variant="ghost" size="icon-sm" type="button" onClick={onToggleDrawer} aria-label="Open J Chat menu">
          <Menu className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{pageTitle(page)}</div>
          <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
            {currentSession ? <span className="max-w-[9rem] truncate text-[0.6875rem] text-muted-foreground">{currentSession.title}</span> : null}
            <ProviderStatusBadge status={providerStatus} />
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="icon-sm" type="button" onClick={onNewSession} aria-label="New chat" title="New chat">
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" type="button" onClick={onOpenSettings} aria-label="Open settings">
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

function SideDrawer({
  open,
  page,
  onNavigate,
  onClose,
  onOpenSettings
}: {
  open: boolean;
  page: PanelPage;
  onNavigate: (page: PanelPage) => void;
  onClose: () => void;
  onOpenSettings?: () => void;
}): JSX.Element {
  return (
    <>
      <button
        type="button"
        className={cn("j-chat-drawer-scrim", open && "is-open")}
        aria-label="Close J Chat menu"
        onClick={onClose}
      />
      <aside className={cn("j-chat-drawer", open && "is-open")} aria-hidden={!open}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-sm font-semibold">Knowledge workspace</div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Move between chat, prompt templates, and configuration.
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" type="button" onClick={onClose} aria-label="Close menu">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <nav className="mt-5 flex flex-col gap-1">
          <DrawerItem icon={<MessageSquareText />} label="Chat" active={page === "chat"} onClick={() => onNavigate("chat")} />
          <DrawerItem icon={<BookMarked />} label="Prompt templates" active={page === "prompts"} onClick={() => onNavigate("prompts")} />
          <DrawerItem icon={<Settings />} label="Settings" active={page === "settings"} onClick={() => onNavigate("settings")} />
          <DrawerItem icon={<History />} label="Chat history" active={page === "history"} onClick={() => onNavigate("history")} />
          <DrawerItem icon={<HelpCircle />} label="Help and docs" active={false} onClick={() => onOpenSettings?.()} />
        </nav>
      </aside>
    </>
  );
}

function HistoryPane({
  sessions,
  activeSessionId,
  renameDraft,
  onRenameDraftChange,
  onNewSession,
  onSelectSession,
  onRenameSession
}: {
  sessions: ChatSessionSummary[];
  activeSessionId: string;
  renameDraft: string;
  onRenameDraftChange: (value: string) => void;
  onNewSession: () => void;
  onSelectSession: (sessionId: string) => void;
  onRenameSession: () => void;
}): JSX.Element {
  return (
    <ScrollArea className="min-h-0 flex-1" viewportClassName="j-chat-page-viewport">
      <main className="j-chat-page-stack">
        <PageIntro title="Chat history" description="Start a fresh thread or jump back into a previous conversation." actionLabel="New chat" onAction={onNewSession} />

        <section className="j-chat-settings-panel">
          <Label htmlFor="j-chat-session-name" className="text-xs font-medium">Current chat name</Label>
          <div className="mt-2 flex min-w-0 gap-2">
            <input
              id="j-chat-session-name"
              aria-label="Current chat name"
              className="j-chat-session-name-input"
              value={renameDraft}
              onChange={(event) => onRenameDraftChange(event.target.value)}
            />
            <Button type="button" size="sm" onClick={onRenameSession} aria-label="Save chat name">
              Save
            </Button>
          </div>
        </section>

        <section className="flex flex-col gap-2" aria-label="Chat sessions">
          {sessions.map((session) => (
            <button
              key={session.id}
              type="button"
              className={cn("j-chat-session-row", session.id === activeSessionId && "is-active")}
              onClick={() => onSelectSession(session.id)}
              aria-current={session.id === activeSessionId ? "true" : undefined}
            >
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-sm font-semibold">{session.title}</span>
                <span className="mt-1 block text-[0.6875rem] text-muted-foreground">
                  {session.messageCount} message{session.messageCount === 1 ? "" : "s"}
                </span>
              </span>
              <MessageSquareText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            </button>
          ))}
        </section>
      </main>
    </ScrollArea>
  );
}

function DrawerItem({
  icon,
  label,
  active,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}): JSX.Element {
  return (
    <button type="button" className={cn("j-chat-drawer-item", active && "is-active")} onClick={onClick}>
      <span className="j-chat-nav-icon" aria-hidden>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function ChatWorkspace(
  props: ChatPanelProps & {
    transcriptRef: React.RefObject<HTMLDivElement>;
    onInsertSelection: () => void | Promise<void>;
  }
): JSX.Element {
  const { snapshot } = props;
  return (
    <>
      <ContextCockpit
        currentFile={props.currentFile}
        restrictToCurrentFile={snapshot.restrictToCurrentFile}
        hasSelection={props.hasSelection}
        selectedText={props.selectedText}
        attachmentCount={snapshot.attachments.length}
        onToggleRestrictToCurrentFile={props.onToggleRestrictToCurrentFile}
      />

      <Separator />

      <ScrollArea className="min-h-0 flex-1" viewportClassName="px-3 py-3">
        <div ref={props.transcriptRef} className="flex flex-col gap-3">
          {snapshot.items.length === 0 ? (
            <EmptyState restrictToCurrentFile={snapshot.restrictToCurrentFile} />
          ) : (
            snapshot.items.map((item) => (
              <ChatMessage key={item.id} item={item} onOpenSource={props.onOpenSource} />
            ))
          )}
          {snapshot.isSending ? (
            snapshot.activity.length > 0 ? <AgentActivityRail activity={snapshot.activity} /> : <ThinkingIndicator />
          ) : null}
        </div>
      </ScrollArea>

      {snapshot.error ? (
        <div className="px-3 pb-2">
          <Alert variant="destructive" className="j-chat-alert">
            <AlertCircle className="h-3.5 w-3.5" />
            <AlertDescription className="break-words">{snapshot.error}</AlertDescription>
          </Alert>
        </div>
      ) : null}
    </>
  );
}

function AgentActivityRail({ activity }: { activity: AgentActivityEvent[] }): JSX.Element {
  return (
    <section className="j-chat-agent-activity" aria-label="Agent activity">
      <div className="flex items-center gap-2 px-1">
        <Brain className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground">Agent activity</span>
      </div>
      <div className="mt-2 flex flex-col gap-1.5">
        {activity.map((item) => (
          <AgentActivityRow key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function AgentActivityRow({ item }: { item: AgentActivityEvent }): JSX.Element {
  const isRunning = item.status === "running";
  const isError = item.status === "error";

  return (
    <div className={cn("j-chat-agent-activity-row", isError && "is-error")}>
      <span className="j-chat-agent-activity-icon" aria-hidden>
        {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : item.type === "tool" ? <Wrench className="h-3.5 w-3.5" /> : <CircleDot className="h-3.5 w-3.5" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold">{item.label}</span>
        {item.detail ? <span className="mt-0.5 block truncate text-[0.6875rem] text-muted-foreground">{item.detail}</span> : null}
      </span>
      <span className="j-chat-agent-activity-status">{activityStatusLabel(item.status)}</span>
    </div>
  );
}

function activityStatusLabel(status: AgentActivityEvent["status"]): string {
  if (status === "complete") return "Done";
  if (status === "error") return "Error";
  return "Running";
}

function PromptLibrary({
  hasSelection,
  currentFile,
  onUseTemplate,
  onOpenSettings
}: {
  hasSelection: boolean;
  currentFile: { path: string; basename: string } | null;
  onUseTemplate: (prompt: string) => void;
  onOpenSettings?: () => void;
}): JSX.Element {
  const templates = [
    {
      icon: <Highlighter />,
      title: "Summarize selection",
      description: "Distill highlighted text into decisions, action items, and open questions.",
      tags: ["Productivity", "Text"],
      prompt: "Summarize the selected text. Extract key points, decisions, action items, and unresolved questions."
    },
    {
      icon: <FileSearch />,
      title: "Find related notes",
      description: "Ask J Chat to connect this note with nearby vault context.",
      tags: ["Knowledge", "Context"],
      prompt: "Find related notes and explain why they matter for the current file."
    },
    {
      icon: <Lightbulb />,
      title: "Explain concept",
      description: "Turn dense material into a clear explanation with examples.",
      tags: ["Learning", "Clarify"],
      prompt: "Explain the main concept in this note in plain language, then give practical examples."
    }
  ];

  return (
    <ScrollArea className="min-h-0 flex-1" viewportClassName="j-chat-page-viewport">
      <main className="j-chat-page-stack">
        <PageIntro
          title="Prompt templates"
          description="Reusable instructions for the current note, selected text, and vault context."
          actionLabel="Create template"
          onAction={() => onUseTemplate("Create a reusable prompt template for the workflow in this note.")}
        />

        <div className="j-chat-search-shell">
          <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
          <span className="truncate text-sm text-muted-foreground">Search templates...</span>
        </div>

        <div className="flex flex-col gap-3">
          {templates.map((template) => (
            <TemplateCard key={template.title} {...template} onUse={() => onUseTemplate(template.prompt)} />
          ))}
        </div>

        <section className="j-chat-smart-panel">
          <div className="relative z-10">
            <Brain className="h-5 w-5" aria-hidden />
            <h3 className="mt-3 text-lg font-semibold">Smart composer</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Build prompts from the active note, current selection, attached files, and vault retrieval mode.
            </p>
            <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={onOpenSettings}>
              <Settings className="h-3.5 w-3.5" />
              Settings
            </Button>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <MetricCard icon={<Wand2 />} title="Selection" value={hasSelection ? "Ready" : "None"} />
          <MetricCard icon={<FileText />} title="Active note" value={currentFile?.basename ?? "No note"} />
        </div>
      </main>
    </ScrollArea>
  );
}

function TemplateCard({
  icon,
  title,
  description,
  tags,
  onUse
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  tags: string[];
  onUse: () => void;
}): JSX.Element {
  return (
    <button type="button" className="j-chat-template-card group" onClick={onUse}>
      <span className="j-chat-template-icon" aria-hidden>{icon}</span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block break-words text-sm font-semibold leading-snug">{title}</span>
        <span className="mt-1 block break-words text-xs leading-relaxed text-muted-foreground">{description}</span>
        <span className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span key={tag} className="j-chat-template-tag">{tag}</span>
          ))}
        </span>
      </span>
    </button>
  );
}

function SettingsHub({
  providerStatus,
  snapshot,
  currentFile,
  hasSelection,
  selectedText,
  onOpenSettings,
  onToggleRestrictToCurrentFile
}: {
  providerStatus: ProviderStatus;
  snapshot: ChatPanelSnapshot;
  currentFile: { path: string; basename: string } | null;
  hasSelection: boolean;
  selectedText?: string;
  onOpenSettings?: () => void;
  onToggleRestrictToCurrentFile: (value: boolean) => void;
}): JSX.Element {
  return (
    <ScrollArea className="min-h-0 flex-1" viewportClassName="j-chat-page-viewport">
      <main className="j-chat-page-stack">
        <PageIntro
          title="Control center"
          description="Provider, context, and editing controls for the side-panel assistant."
          actionLabel="Plugin settings"
          onAction={onOpenSettings}
        />

        <section className="j-chat-settings-grid">
          <StatusBlock icon={<CircleDot />} label="Provider" value={providerStatus.label} detail={providerStatus.detail} />
          <StatusBlock icon={<FileText />} label="Active note" value={currentFile?.basename ?? "No active note"} />
          <StatusBlock icon={<Highlighter />} label="Selection" value={hasSelection ? `${selectedText?.trim().length ?? 0} chars` : "None"} />
          <StatusBlock icon={<Paperclip />} label="Attachments" value={`${snapshot.attachments.length} files`} />
        </section>

        <section className="j-chat-settings-panel">
          <div className="flex min-w-0 items-start gap-3">
            <RadioTower className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">Context scope</div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Toggle whether responses stay inside the active file or include vault retrieval.
              </p>
            </div>
            <Switch
              checked={snapshot.restrictToCurrentFile}
              onCheckedChange={(checked) => onToggleRestrictToCurrentFile(Boolean(checked))}
              aria-label="Restrict context to current file"
            />
          </div>
        </section>

        <section className="j-chat-settings-panel">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Advanced configuration</div>
              <p className="mt-1 text-xs text-muted-foreground">API keys, endpoint URLs, Codex SDK options, and edit behavior.</p>
            </div>
            <Button type="button" size="sm" onClick={onOpenSettings}>
              Open
            </Button>
          </div>
        </section>
      </main>
    </ScrollArea>
  );
}

function PageIntro({
  title,
  description,
  actionLabel,
  onAction
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}): JSX.Element {
  return (
    <header className="j-chat-page-intro">
      <div>
        <h2 className="text-lg font-semibold leading-tight">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {actionLabel ? (
        <Button type="button" variant="secondary" size="sm" className="j-chat-page-action" onClick={onAction}>
          <Plus className="h-4 w-4" />
          {actionLabel}
        </Button>
      ) : null}
    </header>
  );
}

function StatusBlock({
  icon,
  label,
  value,
  detail
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string;
}): JSX.Element {
  return (
    <div className="j-chat-status-block">
      <span className="j-chat-nav-icon" aria-hidden>{icon}</span>
      <div className="min-w-0">
        <div className="j-chat-kicker">{label}</div>
        <div className="truncate text-sm font-semibold">{value}</div>
        {detail ? <div className="mt-1 truncate text-[0.6875rem] text-muted-foreground">{detail}</div> : null}
      </div>
    </div>
  );
}

function MetricCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }): JSX.Element {
  return (
    <div className="j-chat-metric-card">
      <span className="j-chat-nav-icon" aria-hidden>{icon}</span>
      <div className="mt-2 text-xs text-muted-foreground">{title}</div>
      <div className="mt-1 truncate text-sm font-semibold">{value}</div>
    </div>
  );
}

function BottomNav({ page, onNavigate }: { page: PanelPage; onNavigate: (page: PanelPage) => void }): JSX.Element {
  return (
    <nav className="j-chat-bottom-nav" aria-label="J Chat navigation">
      <NavButton icon={<MessageSquareText />} label="Chat" active={page === "chat"} onClick={() => onNavigate("chat")} />
      <NavButton icon={<History />} label="History" active={page === "history"} onClick={() => onNavigate("history")} />
      <NavButton icon={<BookMarked />} label="Prompts" active={page === "prompts"} onClick={() => onNavigate("prompts")} />
      <NavButton icon={<Settings />} label="Settings" active={page === "settings"} onClick={() => onNavigate("settings")} />
    </nav>
  );
}

function NavButton({
  icon,
  label,
  active,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}): JSX.Element {
  return (
    <button type="button" className={cn("j-chat-bottom-nav-button", active && "is-active")} onClick={onClick}>
      <span className="j-chat-nav-icon" aria-hidden>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function ProviderStatusBadge({ status }: { status: ProviderStatus }): JSX.Element {
  return (
    <Badge
      variant={status.ready ? "success" : "muted"}
      title={status.detail ?? status.label}
      className="max-w-full border border-border/60 bg-background/70 font-normal backdrop-blur"
    >
      <CircleDot
        className={cn("h-2.5 w-2.5", status.ready ? "text-primary" : "text-muted-foreground")}
        aria-hidden
      />
      <span className="truncate">{status.label}</span>
    </Badge>
  );
}

type ContextCockpitProps = {
  currentFile: { path: string; basename: string } | null;
  restrictToCurrentFile: boolean;
  hasSelection: boolean;
  selectedText?: string;
  attachmentCount: number;
  onToggleRestrictToCurrentFile: (value: boolean) => void;
};

function ContextCockpit({
  currentFile,
  restrictToCurrentFile,
  hasSelection,
  selectedText,
  attachmentCount,
  onToggleRestrictToCurrentFile
}: ContextCockpitProps): JSX.Element {
  const trimmedSelection = selectedText?.trim() ?? "";
  return (
    <div className="relative z-10 px-3 pb-3 pt-3">
      <div className="j-chat-context-grid grid grid-cols-2 gap-1.5">
        <ContextTile
          icon={<FileText className="h-3.5 w-3.5" />}
          label="Active note"
          value={currentFile ? currentFile.basename : "No active note"}
          title={currentFile?.path}
          className="col-span-2"
        />
        <div className="j-chat-context-tile col-span-2">
          <div className="flex min-w-0 items-start gap-2">
            <RadioTower className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="j-chat-kicker">Scope</div>
              <div className="truncate text-xs font-medium">
                {restrictToCurrentFile ? "Current file only" : "Vault retrieval enabled"}
              </div>
            </div>
            <Switch
              checked={restrictToCurrentFile}
              onCheckedChange={(checked) => onToggleRestrictToCurrentFile(Boolean(checked))}
              aria-label="Restrict context to current file"
            />
          </div>
        </div>
        <ContextTile
          icon={<Highlighter className="h-3.5 w-3.5" />}
          label="Selection"
          value={hasSelection ? `${trimmedSelection.length} chars selected` : "None"}
          title={trimmedSelection}
        />
        <ContextTile
          icon={<Paperclip className="h-3.5 w-3.5" />}
          label="Attached"
          value={`${attachmentCount} file${attachmentCount === 1 ? "" : "s"}`}
        />
      </div>
    </div>
  );
}

function ContextTile({
  icon,
  label,
  value,
  title,
  className
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  title?: string;
  className?: string;
}): JSX.Element {
  return (
    <div className={cn("j-chat-context-tile", className)} title={title}>
      <div className="flex min-w-0 items-start gap-2">
        <span className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden>
          {icon}
        </span>
        <div className="min-w-0">
          <div className="j-chat-kicker">{label}</div>
          <div className="truncate text-xs font-medium">{value}</div>
        </div>
      </div>
    </div>
  );
}

type ChatMessageProps = {
  item: ChatItem;
  onOpenSource?: (path: string) => void;
};

function ChatMessage({ item, onOpenSource }: ChatMessageProps): JSX.Element {
  const isUser = item.role === "user";
  const isError = Boolean(item.error);

  return (
    <article className={cn("j-chat-message group", isUser ? "j-chat-message-user" : "j-chat-message-assistant")}>
      <div className="j-chat-message-meta">
        {isUser ? <SquarePen className="h-3.5 w-3.5" aria-hidden /> : <Bot className="h-3.5 w-3.5" aria-hidden />}
        <span>{isError ? "Error" : isUser ? "You" : item.role === "system" ? "System" : "Assistant"}</span>
      </div>
      <div className={cn("j-chat-message-body", isError && "j-chat-message-error")}>
        <MessageBody item={item} isUser={isUser} />
        {item.editCount && item.editCount > 0 ? <EditNotice count={item.editCount} /> : null}
      </div>
      {item.sources && item.sources.length > 0 ? (
        <SourceChips sources={item.sources} onOpen={onOpenSource} />
      ) : null}
    </article>
  );
}

function MessageBody({ item, isUser }: { item: ChatItem; isUser: boolean }): JSX.Element {
  if (isUser || item.error) {
    return <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">{item.content}</div>;
  }
  return (
    <div className="j-chat-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.content}</ReactMarkdown>
    </div>
  );
}

function EditNotice({ count }: { count: number }): JSX.Element {
  return (
    <div className="j-chat-edit-notice">
      <Pencil className="h-3.5 w-3.5" aria-hidden />
      <span>
        Applied {count} edit{count === 1 ? "" : "s"} to active note
      </span>
    </div>
  );
}

function SourceChips({
  sources,
  onOpen
}: {
  sources: ChatSource[];
  onOpen?: (path: string) => void;
}): JSX.Element {
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {sources.map((source, index) => (
        <button
          key={`${source.path}-${index}`}
          type="button"
          onClick={onOpen ? () => onOpen(source.path) : undefined}
          className={cn("j-chat-source-chip", onOpen ? "cursor-pointer" : "cursor-default")}
          title={source.path}
          aria-label={`Source: ${source.path} (${source.label})`}
        >
          <FileText className="h-3 w-3 shrink-0" aria-hidden />
          <span className="max-w-[120px] truncate">{basename(source.path)}</span>
          <span className="j-chat-source-label">{source.label}</span>
        </button>
      ))}
    </div>
  );
}

function ThinkingIndicator(): JSX.Element {
  return (
    <div className="j-chat-thinking">
      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
      <span>Reading context...</span>
    </div>
  );
}

function EmptyState({ restrictToCurrentFile }: { restrictToCurrentFile: boolean }): JSX.Element {
  return (
    <div className="j-chat-empty">
      <Sparkles className="h-5 w-5 text-muted-foreground" aria-hidden />
      <div className="flex flex-col gap-1">
        <div className="text-sm font-semibold text-foreground">Ask about this note</div>
        <p className="mx-auto max-w-[28ch] text-xs leading-relaxed text-muted-foreground">
          {restrictToCurrentFile
            ? "The next answer will stay inside the current file unless you attach more context."
            : "Vault retrieval is on, so relevant notes can be pulled into the answer."}
        </p>
      </div>
    </div>
  );
}

type ComposerProps = {
  draft: string;
  onDraftChange: (value: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void | Promise<void>;
  onAttachFile: () => void | Promise<void>;
  onInsertSelection?: () => string | void | Promise<string | void>;
  onRemoveAttachment: (path: string) => void;
  attachments: AttachedFile[];
  hasSelection: boolean;
  isSending: boolean;
};

function Composer(props: ComposerProps): JSX.Element {
  const canSend = props.draft.trim().length > 0 && !props.isSending;

  return (
    <footer className="j-chat-composer relative z-10 flex flex-col gap-2 px-3 pb-3 pt-2">
      {props.attachments.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {props.attachments.map((file) => (
            <AttachmentChip
              key={file.path}
              path={file.path}
              onRemove={() => props.onRemoveAttachment(file.path)}
            />
          ))}
        </div>
      ) : null}

      <div className="j-chat-input-frame">
        <Textarea
          value={props.draft}
          onChange={(event) => props.onDraftChange(event.target.value)}
          onKeyDown={props.onKeyDown}
          placeholder="Ask J Chat... (Shift+Enter for newline)"
          rows={3}
          className="j-chat-textarea pr-12 text-sm"
          aria-label="Chat message"
          disabled={props.isSending}
        />
        <Button
          type="button"
          size="icon"
          variant="default"
          onClick={() => void props.onSend()}
          disabled={!canSend}
          className="j-chat-send-button absolute bottom-2 right-2"
          aria-label="Send message"
          title="Send (Enter)"
        >
          {props.isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Button
            type="button"
            variant="secondary"
            size="xs"
            onClick={() => void props.onAttachFile()}
            aria-label="Attach vault file"
            title="Attach a vault file"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Attach</span>
          </Button>
          {props.onInsertSelection ? (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => void props.onInsertSelection?.()}
              title={
                props.hasSelection
                  ? "Insert current editor selection into the message"
                  : "Insert selected text from the active note"
              }
            >
              <Highlighter className="h-3.5 w-3.5" />
              <span>Insert selection</span>
            </Button>
          ) : null}
        </div>
        <span className="shrink-0 text-[0.6875rem] text-muted-foreground">
          {props.isSending ? "Sending..." : "Enter to send"}
        </span>
      </div>
    </footer>
  );
}

function AttachmentChip({ path, onRemove }: { path: string; onRemove: () => void }): JSX.Element {
  return (
    <span className="j-chat-attachment-chip" title={path}>
      <Paperclip className="h-3 w-3 shrink-0" aria-hidden />
      <span className="max-w-[140px] truncate">{basename(path)}</span>
      <button
        type="button"
        onClick={onRemove}
        className="j-chat-chip-remove"
        aria-label={`Remove attachment ${path}`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function basename(path: string): string {
  const slash = path.lastIndexOf("/");
  return slash >= 0 ? path.slice(slash + 1) : path;
}

export default ChatPanel;
