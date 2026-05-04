import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  AlertCircle,
  Bot,
  CircleDot,
  FileText,
  Highlighter,
  Loader2,
  MessageSquareText,
  Paperclip,
  Pencil,
  Plus,
  RadioTower,
  Send,
  Sparkles,
  SquarePen,
  X
} from "lucide-react";
import type { AttachedFile, ChatItem, ChatSource } from "@/chat/chatTypes";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  onInsertSelection?: () => string | void | Promise<string | void>;
  onOpenSource?: (path: string) => void;
};

export function ChatPanel(props: ChatPanelProps): JSX.Element {
  const { snapshot, providerStatus } = props;
  const [draft, setDraft] = React.useState("");
  const transcriptRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const node = transcriptRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [snapshot.items.length, snapshot.isSending]);

  const handleSend = React.useCallback(async () => {
    const trimmed = draft.trim();
    if (trimmed.length === 0 || snapshot.isSending) return;
    setDraft("");
    await props.onSend(trimmed);
  }, [draft, snapshot.isSending, props]);

  const insertSelection = React.useCallback(async () => {
    const freshSelection = await props.onInsertSelection?.();
    const selectedText = (typeof freshSelection === "string" ? freshSelection : props.selectedText)?.trim();
    if (!selectedText) return;
    setDraft((current) => `${current}${current.trim().length > 0 ? "\n\n" : ""}${selectedText}`);
  }, [props]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <section className="j-chat-root j-chat-shell relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-background text-foreground">
      <PanelHeader providerStatus={providerStatus} onAttachFile={props.onAttachFile} />

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
        <div ref={transcriptRef} className="flex flex-col gap-3">
          {snapshot.items.length === 0 ? (
            <EmptyState restrictToCurrentFile={snapshot.restrictToCurrentFile} />
          ) : (
            snapshot.items.map((item) => (
              <ChatMessage key={item.id} item={item} onOpenSource={props.onOpenSource} />
            ))
          )}
          {snapshot.isSending ? <ThinkingIndicator /> : null}
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
    </section>
  );
}

function PanelHeader({
  providerStatus,
  onAttachFile
}: {
  providerStatus: ProviderStatus;
  onAttachFile: () => void | Promise<void>;
}): JSX.Element {
  return (
    <header className="relative z-10 flex items-start justify-between gap-2 px-3 pb-2 pt-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="j-chat-mark" aria-hidden>
            <MessageSquareText className="h-3.5 w-3.5" />
          </span>
          <div className="truncate text-[0.9375rem] font-semibold leading-none tracking-normal">
            J Chat
          </div>
        </div>
        <div className="mt-1.5 flex min-w-0 items-center gap-1.5">
          <ProviderStatusBadge status={providerStatus} />
        </div>
      </div>
      <Button
        variant="secondary"
        size="icon"
        type="button"
        onClick={() => void onAttachFile()}
        title="Attach a vault file"
        aria-label="Attach a vault file"
        className="j-chat-icon-button shrink-0"
      >
        <Paperclip className="h-4 w-4" />
      </Button>
    </header>
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
    <div className="relative z-10 px-3 pb-3">
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
          rows={4}
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
