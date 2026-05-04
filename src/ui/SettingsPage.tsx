import * as React from "react";
import {
  Database,
  Eye,
  EyeOff,
  FileCode2,
  FolderCog,
  KeyRound,
  Settings2,
  SlidersHorizontal,
  Sparkles
} from "lucide-react";
import type {
  CodexSdkSettings,
  ContextSettings,
  EditingSettings,
  JChatSettings,
  OpenAICompatibleSettings,
  ProviderMode
} from "@/pluginSettings";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type SettingsPageProps = {
  settings: JChatSettings;
  onChange: (next: JChatSettings) => void;
};

export function SettingsPage({ settings, onChange }: SettingsPageProps): JSX.Element {
  const updateProvider = (provider: ProviderMode) => onChange({ ...settings, provider });
  const updateOpenAi = (next: Partial<OpenAICompatibleSettings>) =>
    onChange({ ...settings, openai: { ...settings.openai, ...next } });
  const updateCodex = (next: Partial<CodexSdkSettings>) =>
    onChange({ ...settings, codex: { ...settings.codex, ...next } });
  const updateContext = (next: Partial<ContextSettings>) =>
    onChange({ ...settings, context: { ...settings.context, ...next } });
  const updateEditing = (next: Partial<EditingSettings>) =>
    onChange({ ...settings, editing: { ...settings.editing, ...next } });

  return (
    <div className="j-chat-root j-chat-settings-shell w-full max-w-4xl bg-background p-1 text-foreground">
      <header className="j-chat-settings-hero">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="j-chat-mark" aria-hidden>
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold tracking-normal">J Chat settings</h2>
              <p className="max-w-[66ch] text-xs leading-relaxed text-muted-foreground">
                Configure model access, context retrieval, and note editing behavior. Secrets stay in Obsidian plugin data.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline">
              <KeyRound className="h-3 w-3" aria-hidden />
              {settings.provider === "codex-sdk" ? "Codex SDK" : "OpenAI-compatible"}
            </Badge>
            <Badge variant="muted">
              <Database className="h-3 w-3" aria-hidden />
              {settings.context.maxRetrievedFiles} vault matches
            </Badge>
            <Badge variant={settings.editing.directApply ? "success" : "muted"}>
              <FileCode2 className="h-3 w-3" aria-hidden />
              {settings.editing.directApply ? "Direct edits on" : "Direct edits off"}
            </Badge>
          </div>
        </div>
      </header>

      <Tabs defaultValue="provider" className="flex w-full flex-col gap-3">
        <TabsList className="j-chat-settings-tabs">
          <TabsTrigger value="provider">
            <Sparkles className="h-3.5 w-3.5" />
            Provider
          </TabsTrigger>
          <TabsTrigger value="context">
            <FolderCog className="h-3.5 w-3.5" />
            Context
          </TabsTrigger>
          <TabsTrigger value="editing">
            <Settings2 className="h-3.5 w-3.5" />
            Editing
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="provider" className="mt-0">
          <ProviderSection
            settings={settings}
            onProviderChange={updateProvider}
            onOpenAiChange={updateOpenAi}
            onCodexChange={updateCodex}
          />
        </TabsContent>

        <TabsContent value="context" className="mt-0">
          <ContextSection context={settings.context} onChange={updateContext} />
        </TabsContent>

        <TabsContent value="editing" className="mt-0">
          <EditingSection editing={settings.editing} onChange={updateEditing} />
        </TabsContent>

        <TabsContent value="advanced" className="mt-0">
          <AdvancedSection settings={settings} onOpenAiChange={updateOpenAi} onCodexChange={updateCodex} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type ProviderSectionProps = {
  settings: JChatSettings;
  onProviderChange: (mode: ProviderMode) => void;
  onOpenAiChange: (next: Partial<OpenAICompatibleSettings>) => void;
  onCodexChange: (next: Partial<CodexSdkSettings>) => void;
};

function ProviderSection({
  settings,
  onProviderChange,
  onOpenAiChange,
  onCodexChange
}: ProviderSectionProps): JSX.Element {
  return (
    <Card className="j-chat-settings-card">
      <CardHeader>
        <CardTitle>Provider connection</CardTitle>
        <CardDescription>
          Route requests through an OpenAI-compatible endpoint or the Codex SDK without changing chat orchestration.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Field label="Provider mode" htmlFor="j-chat-provider">
          <Select value={settings.provider} onValueChange={(value) => onProviderChange(value as ProviderMode)}>
            <SelectTrigger id="j-chat-provider">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="openai-compatible">OpenAI-compatible API</SelectItem>
                <SelectItem value="codex-sdk">Codex SDK</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Separator />

        {settings.provider === "openai-compatible" ? (
          <OpenAiFields settings={settings.openai} onChange={onOpenAiChange} />
        ) : (
          <CodexFields settings={settings.codex} onChange={onCodexChange} />
        )}
      </CardContent>
    </Card>
  );
}

function OpenAiFields({
  settings,
  onChange
}: {
  settings: OpenAICompatibleSettings;
  onChange: (next: Partial<OpenAICompatibleSettings>) => void;
}): JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <Field label="Base URL" htmlFor="openai-base">
        <Input
          id="openai-base"
          value={settings.baseUrl}
          onChange={(event) => onChange({ baseUrl: event.target.value })}
          placeholder="https://api.openai.com/v1"
        />
      </Field>
      <Field label="API key" htmlFor="openai-key">
        <SecretInput
          id="openai-key"
          value={settings.apiKey}
          onChange={(value) => onChange({ apiKey: value })}
          placeholder="sk-…"
        />
      </Field>
      <Field label="Model" htmlFor="openai-model" className="md:col-span-2">
        <Input
          id="openai-model"
          value={settings.model}
          onChange={(event) => onChange({ model: event.target.value })}
          placeholder="gpt-5.1"
        />
      </Field>
    </div>
  );
}

function CodexFields({
  settings,
  onChange
}: {
  settings: CodexSdkSettings;
  onChange: (next: Partial<CodexSdkSettings>) => void;
}): JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <Field label="API key" htmlFor="codex-key">
        <SecretInput
          id="codex-key"
          value={settings.apiKey}
          onChange={(value) => onChange({ apiKey: value })}
          placeholder="codex-…"
        />
      </Field>
      <Field label="Base URL" htmlFor="codex-base" hint="Leave blank for the default Codex endpoint.">
        <Input
          id="codex-base"
          value={settings.baseUrl}
          onChange={(event) => onChange({ baseUrl: event.target.value })}
          placeholder="https://…"
        />
      </Field>
      <Field label="Model" htmlFor="codex-model">
        <Input
          id="codex-model"
          value={settings.model}
          onChange={(event) => onChange({ model: event.target.value })}
          placeholder="gpt-5.1-codex"
        />
      </Field>
      <Field label="Working directory" htmlFor="codex-cwd" hint="Absolute path Codex should treat as the workspace." className="md:col-span-2">
        <Input
          id="codex-cwd"
          value={settings.workingDirectory}
          onChange={(event) => onChange({ workingDirectory: event.target.value })}
          placeholder="/path/to/vault"
        />
      </Field>
      <div className="grid grid-cols-1 gap-3 md:col-span-2 sm:grid-cols-2">
        <Field label="Approval policy">
          <Select
            value={settings.approvalPolicy}
            onValueChange={(value) => onChange({ approvalPolicy: value as CodexSdkSettings["approvalPolicy"] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="never">never</SelectItem>
                <SelectItem value="on-request">on request</SelectItem>
                <SelectItem value="on-failure">on failure</SelectItem>
                <SelectItem value="untrusted">untrusted</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Sandbox mode">
          <Select
            value={settings.sandboxMode}
            onValueChange={(value) => onChange({ sandboxMode: value as CodexSdkSettings["sandboxMode"] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="read-only">read-only</SelectItem>
                <SelectItem value="workspace-write">workspace-write</SelectItem>
                <SelectItem value="danger-full-access">danger-full-access</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Reasoning effort" className="md:col-span-2">
        <Select
          value={settings.modelReasoningEffort}
          onValueChange={(value) =>
            onChange({ modelReasoningEffort: value as CodexSdkSettings["modelReasoningEffort"] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="minimal">minimal</SelectItem>
              <SelectItem value="low">low</SelectItem>
              <SelectItem value="medium">medium</SelectItem>
              <SelectItem value="high">high</SelectItem>
              <SelectItem value="xhigh">xhigh</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}

function ContextSection({
  context,
  onChange
}: {
  context: ContextSettings;
  onChange: (next: Partial<ContextSettings>) => void;
}): JSX.Element {
  return (
    <Card className="j-chat-settings-card">
      <CardHeader>
        <CardTitle>Context budget</CardTitle>
        <CardDescription>Set how aggressively J Chat reads the current note and retrieves related vault snippets.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <NumberField
          label="Max chars from active file"
          hint="Truncate the current note before sending."
          min={1000}
          max={100000}
          step={500}
          value={context.maxActiveFileChars}
          onChange={(value) => onChange({ maxActiveFileChars: value })}
        />
        <NumberField
          label="Max retrieved files"
          hint="When current-file-only is off, include up to this many vault matches."
          min={0}
          max={20}
          step={1}
          value={context.maxRetrievedFiles}
          onChange={(value) => onChange({ maxRetrievedFiles: value })}
        />
        <NumberField
          label="Max snippet chars"
          hint="Each retrieved file is trimmed to this many characters."
          min={200}
          max={12000}
          step={100}
          value={context.maxSnippetChars}
          onChange={(value) => onChange({ maxSnippetChars: value })}
        />
      </CardContent>
    </Card>
  );
}

function EditingSection({
  editing,
  onChange
}: {
  editing: EditingSettings;
  onChange: (next: Partial<EditingSettings>) => void;
}): JSX.Element {
  return (
    <Card className="j-chat-settings-card">
      <CardHeader>
        <CardTitle>Note editing</CardTitle>
        <CardDescription>Control how J Chat applies suggested changes to your notes.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ToggleField
          label="Direct apply edits"
          hint="When enabled, edit blocks returned by the model are applied to the active note automatically."
          checked={editing.directApply}
          onChange={(checked) => onChange({ directApply: checked })}
        />
      </CardContent>
    </Card>
  );
}

function AdvancedSection({
  settings,
  onOpenAiChange,
  onCodexChange
}: {
  settings: JChatSettings;
  onOpenAiChange: (next: Partial<OpenAICompatibleSettings>) => void;
  onCodexChange: (next: Partial<CodexSdkSettings>) => void;
}): JSX.Element {
  return (
    <Card className="j-chat-settings-card">
      <CardHeader>
        <CardTitle>Advanced provider options</CardTitle>
        <CardDescription>Provider-specific fields that should only be changed when the endpoint requires them.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {settings.provider === "openai-compatible" ? (
          <Field
            label="Extra request headers (JSON)"
            htmlFor="openai-headers"
            hint='e.g. {"OpenAI-Organization": "org_…"}'
          >
            <Textarea
              id="openai-headers"
              rows={4}
              value={settings.openai.extraHeadersJson}
              onChange={(event) => onOpenAiChange({ extraHeadersJson: event.target.value })}
              className="font-mono text-xs"
              placeholder="{}"
            />
          </Field>
        ) : (
          <Field label="Working directory" htmlFor="codex-cwd-adv">
            <Input
              id="codex-cwd-adv"
              value={settings.codex.workingDirectory}
              onChange={(event) => onCodexChange({ workingDirectory: event.target.value })}
              placeholder="/path/to/vault"
            />
          </Field>
        )}
      </CardContent>
    </Card>
  );
}

type FieldProps = {
  label: string;
  htmlFor?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
};

function Field({ label, htmlFor, hint, className, children }: FieldProps): JSX.Element {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-xs font-medium">
        {label}
      </Label>
      {children}
      {hint ? <p className="text-[0.6875rem] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

type NumberFieldProps = {
  label: string;
  hint?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
};

function NumberField({ label, hint, min, max, step, value, onChange }: NumberFieldProps): JSX.Element {
  const id = React.useId();
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <Input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => {
          const parsed = Number(event.target.value);
          if (Number.isFinite(parsed)) onChange(parsed);
        }}
      />
    </Field>
  );
}

type ToggleFieldProps = {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

function ToggleField({ label, hint, checked, onChange }: ToggleFieldProps): JSX.Element {
  const id = React.useId();
  return (
    <div className="j-chat-settings-toggle">
      <div className="flex min-w-0 flex-col gap-1">
        <Label htmlFor={id} className="text-sm">
          {label}
        </Label>
        {hint ? <p className="text-[0.6875rem] text-muted-foreground">{hint}</p> : null}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={(value) => onChange(Boolean(value))} />
    </div>
  );
}

type SecretInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

function SecretInput({ id, value, onChange, placeholder }: SecretInputProps): JSX.Element {
  const [revealed, setRevealed] = React.useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={revealed ? "text" : "password"}
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="pr-9 font-mono text-xs"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute right-1 top-1"
        onClick={() => setRevealed((prev) => !prev)}
        aria-label={revealed ? "Hide secret" : "Reveal secret"}
        title={revealed ? "Hide" : "Reveal"}
      >
        {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}

export default SettingsPage;
