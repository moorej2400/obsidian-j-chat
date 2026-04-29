import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  AlertCircle,
  CircleDot,
  FileText,
  Highlighter,
  Loader2,
  Paperclip,
  Pencil,
  Plus,
  Send,
  Sparkles,
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
  onInsertSelection?: () => void | Promise<void>;
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
    const selectedText = props.selectedText?.trim();
    if (!selectedText) return;
    setDraft((current) => `${current}${current.trim().length > 0 ? "\n\n" : ""}${selectedText}`);
    await props.onInsertSelection?.();
  }, [props]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="j-chat-root flex h-full min-h-0 w-full flex-col bg-background text-foreground">
      <ChatHeader
        providerStatus={providerStatus}
        currentFile={props.currentFile}
        restrictToCurrentFile={snapshot.restrictToCurrentFile}
        onToggleRestrictToCurrentFile={props.onToggleRestrictToCurrentFile}
        onAttachFile={props.onAttachFile}
      />
      <Separator />
      <ScrollArea
        className="flex-1 min-h-0"
        viewportClassName="px-3 py-3"
      >
        <div ref={transcriptRef} className="flex flex-col gap-3">
          {snapshot.items.length === 0 ? (
            <EmptyState />
          ) : (
            snapshot.items.map((item) => (
              <ChatMessage key={item.id} item={item} onOpenSource={props.onOpenSource} />
            ))
          )}
          {snapshot.isSending ? <ThinkingIndicator /> : null}
        </div>
      </ScrollArea>

      {snapshot.error ? (
        <div className="border-t px-3 py-2">
          <Alert variant="destructive">
            <AlertCircle className="h-3.5 w-3.5" />
            <AlertDescription className="break-words">{snapshot.error}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      <Separator />
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
    </div>
  );
}

type ChatHeaderProps = {
  providerStatus: ProviderStatus;
  currentFile: { path: string; basename: string } | null;
  restrictToCurrentFile: boolean;
  onToggleRestrictToCurrentFile: (value: boolean) => void;
  onAttachFile: () => void | Promise<void>;
};

function ChatHeader({
  providerStatus,
  currentFile,
  restrictToCurrentFile,
  onToggleRestrictToCurrentFile,
  onAttachFile
}: ChatHeaderProps): JSX.Element {
  return (
    <div className="flex flex-col gap-2 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate text-sm font-semibold tracking-tight">J Chat</span>
        </div>
        <div className="flex items-center gap-1">
          <ProviderStatusBadge status={providerStatus} />
          <Button
            variant="ghost"
            size="icon-sm"
            type="button"
            onClick={() => void onAttachFile()}
            title="Attach a vault file"
            aria-label="Attach a vault file"
          >
            <Paperclip className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {currentFile ? (
            <span className="truncate" title={currentFile.path}>
              {currentFile.basename}
            </span>
          ) : (
            <span className="italic">No active note</span>
          )}
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs text-foreground">
          <Switch
            checked={restrictToCurrentFile}
            onCheckedChange={(checked) => onToggleRestrictToCurrentFile(Boolean(checked))}
            aria-label="Restrict context to current file"
          />
          <span>Current file only</span>
        </label>
      </div>
    </div>
  );
}

function ProviderStatusBadge({ status }: { status: ProviderStatus }): JSX.Element {
  return (
    <Badge
      variant={status.ready ? "success" : "muted"}
      title={status.detail ?? status.label}
      className="font-normal"
    >
      <CircleDot
        className={cn(
          "h-2.5 w-2.5",
          status.ready ? "text-emerald-500" : "text-muted-foreground"
        )}
        aria-hidden
      />
      <span className="max-w-[120px] truncate">{status.label}</span>
    </Badge>
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
    <div className={cn("flex w-full flex-col", isUser ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-full rounded-md border px-3 py-2 text-sm shadow-sm",
          isUser
            ? "border-primary/30 bg-primary text-primary-foreground"
            : isError
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-border bg-card text-card-foreground"
        )}
      >
        <RoleTag role={item.role} isError={isError} />
        <MessageBody item={item} isUser={isUser} />
        {item.editCount && item.editCount > 0 ? (
          <EditNotice count={item.editCount} />
        ) : null}
      </div>
      {item.sources && item.sources.length > 0 ? (
        <SourceChips sources={item.sources} onOpen={onOpenSource} />
      ) : null}
    </div>
  );
}

function RoleTag({ role, isError }: { role: ChatItem["role"]; isError: boolean }): JSX.Element {
  if (role === "user") return <></>;
  return (
    <div className="mb-1 flex items-center gap-1 text-[0.6875rem] uppercase tracking-wide opacity-70">
      {isError ? <AlertCircle className="h-3 w-3" aria-hidden /> : <Sparkles className="h-3 w-3" aria-hidden />}
      <span>{isError ? "Error" : role === "system" ? "System" : "Assistant"}</span>
    </div>
  );
}

function MessageBody({ item, isUser }: { item: ChatItem; isUser: boolean }): JSX.Element {
  if (isUser) {
    return <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">{item.content}</div>;
  }
  if (item.error) {
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
    <div className="mt-2 flex items-center gap-1.5 rounded-sm border border-border/60 bg-muted/40 px-2 py-1 text-[0.6875rem] text-muted-foreground">
      <Pencil className="h-3 w-3" aria-hidden />
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
    <div className="mt-1.5 flex flex-wrap gap-1">
      {sources.map((source, index) => (
        <button
          key={`${source.path}-${index}`}
          type="button"
          onClick={onOpen ? () => onOpen(source.path) : undefined}
          className={cn(
            "inline-flex max-w-full items-center gap-1 rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-[0.6875rem] text-muted-foreground transition-colors",
            onOpen ? "hover:bg-muted hover:text-foreground" : "cursor-default"
          )}
          title={source.path}
          aria-label={`Source: ${source.path} (${source.label})`}
        >
          <FileText className="h-3 w-3 shrink-0" aria-hidden />
          <span className="max-w-[140px] truncate">{basename(source.path)}</span>
          <span className="text-[0.625rem] uppercase tracking-wide opacity-70">{source.label}</span>
        </button>
      ))}
    </div>
  );
}

function ThinkingIndicator(): JSX.Element {
  return (
    <div className="flex items-center gap-2 self-start rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
      <span>Thinking…</span>
    </div>
  );
}

function EmptyState(): JSX.Element {
  return (
    <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border px-4 py-8 text-center text-xs text-muted-foreground">
      <Sparkles className="h-5 w-5 opacity-60" aria-hidden />
      <div className="space-y-1">
        <div className="font-medium text-foreground">Ask about this note</div>
        <p className="leading-relaxed">
          Toggle off <em>Current file only</em> to search the vault, or attach files for richer context.
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
  onInsertSelection?: () => void | Promise<void>;
  onRemoveAttachment: (path: string) => void;
  attachments: AttachedFile[];
  hasSelection: boolean;
  isSending: boolean;
};

function Composer(props: ComposerProps): JSX.Element {
  const canSend = props.draft.trim().length > 0 && !props.isSending;
  return (
    <div className="flex flex-col gap-2 px-3 py-2">
      {props.attachments.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {props.attachments.map((file) => (
            <AttachmentChip
              key={file.path}
              path={file.path}
              onRemove={() => props.onRemoveAttachment(file.path)}
            />
          ))}
        </div>
      ) : null}
      <div className="relative">
        <Textarea
          value={props.draft}
          onChange={(event) => props.onDraftChange(event.target.value)}
          onKeyDown={props.onKeyDown}
          placeholder="Ask J Chat… (Shift+Enter for newline)"
          rows={3}
          className="pr-10 text-sm"
          aria-label="Chat message"
          disabled={props.isSending}
        />
        <Button
          type="button"
          size="icon-sm"
          variant="default"
          onClick={() => void props.onSend()}
          disabled={!canSend}
          className="absolute bottom-1.5 right-1.5"
          aria-label="Send message"
          title="Send (Enter)"
        >
          {props.isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        </Button>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => void props.onAttachFile()}
            title="Attach a vault file"
          >
            <Plus className="h-3 w-3" />
            <span>Attach</span>
          </Button>
          {props.onInsertSelection ? (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => void props.onInsertSelection?.()}
              disabled={!props.hasSelection}
              title={
                props.hasSelection
                  ? "Insert current editor selection into the message"
                  : "Select text in the active note to enable"
              }
            >
              <Highlighter className="h-3 w-3" />
              <span>Insert selection</span>
            </Button>
          ) : null}
        </div>
        <span className="text-[0.6875rem] text-muted-foreground">
          {props.isSending ? "Sending…" : "Enter to send"}
        </span>
      </div>
    </div>
  );
}

function AttachmentChip({ path, onRemove }: { path: string; onRemove: () => void }): JSX.Element {
  return (
    <span
      className="inline-flex max-w-full items-center gap-1 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[0.6875rem] text-foreground"
      title={path}
    >
      <Paperclip className="h-3 w-3 shrink-0" aria-hidden />
      <span className="max-w-[140px] truncate">{basename(path)}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-sm text-muted-foreground hover:bg-background hover:text-foreground"
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
