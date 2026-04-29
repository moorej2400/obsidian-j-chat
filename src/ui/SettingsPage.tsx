import * as React from "react";
import { Eye, EyeOff, FolderCog, Settings2, SlidersHorizontal, Sparkles } from "lucide-react";
import type {
  CodexSdkSettings,
  ContextSettings,
  EditingSettings,
  JChatSettings,
  OpenAICompatibleSettings,
  ProviderMode
} from "@/pluginSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
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
    <div className="j-chat-root w-full max-w-3xl bg-background p-1 text-foreground">
      <Tabs defaultValue="provider" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="provider">
            <Sparkles className="mr-1 h-3 w-3" />
            Provider
          </TabsTrigger>
          <TabsTrigger value="context">
            <FolderCog className="mr-1 h-3 w-3" />
            Context
          </TabsTrigger>
          <TabsTrigger value="editing">
            <Settings2 className="mr-1 h-3 w-3" />
            Editing
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <SlidersHorizontal className="mr-1 h-3 w-3" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="provider">
          <ProviderSection
            settings={settings}
            onProviderChange={updateProvider}
            onOpenAiChange={updateOpenAi}
            onCodexChange={updateCodex}
          />
        </TabsContent>

        <TabsContent value="context">
          <ContextSection context={settings.context} onChange={updateContext} />
        </TabsContent>

        <TabsContent value="editing">
          <EditingSection editing={settings.editing} onChange={updateEditing} />
        </TabsContent>

        <TabsContent value="advanced">
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
    <Card>
      <CardHeader>
        <CardTitle>Provider</CardTitle>
        <CardDescription>
          Choose how J Chat reaches a model. API keys are stored locally in your vault settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field label="Provider mode" htmlFor="j-chat-provider">
          <Select value={settings.provider} onValueChange={(value) => onProviderChange(value as ProviderMode)}>
            <SelectTrigger id="j-chat-provider">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai-compatible">OpenAI-compatible API</SelectItem>
              <SelectItem value="codex-sdk">Codex SDK</SelectItem>
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
    <div className="space-y-3">
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
      <Field label="Model" htmlFor="openai-model">
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
    <div className="space-y-3">
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
      <Field label="Working directory" htmlFor="codex-cwd" hint="Absolute path Codex should treat as the workspace.">
        <Input
          id="codex-cwd"
          value={settings.workingDirectory}
          onChange={(event) => onChange({ workingDirectory: event.target.value })}
          placeholder="/path/to/vault"
        />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Approval policy">
          <Select
            value={settings.approvalPolicy}
            onValueChange={(value) => onChange({ approvalPolicy: value as CodexSdkSettings["approvalPolicy"] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="never">never</SelectItem>
              <SelectItem value="on-request">on request</SelectItem>
              <SelectItem value="on-failure">on failure</SelectItem>
              <SelectItem value="untrusted">untrusted</SelectItem>
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
              <SelectItem value="read-only">read-only</SelectItem>
              <SelectItem value="workspace-write">workspace-write</SelectItem>
              <SelectItem value="danger-full-access">danger-full-access</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Reasoning effort">
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
            <SelectItem value="minimal">minimal</SelectItem>
            <SelectItem value="low">low</SelectItem>
            <SelectItem value="medium">medium</SelectItem>
            <SelectItem value="high">high</SelectItem>
            <SelectItem value="xhigh">xhigh</SelectItem>
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
    <Card>
      <CardHeader>
        <CardTitle>Context</CardTitle>
        <CardDescription>Tune how much vault content is sent with each request.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
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
    <Card>
      <CardHeader>
        <CardTitle>Editing</CardTitle>
        <CardDescription>Control how J Chat applies suggested changes to your notes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
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
    <Card>
      <CardHeader>
        <CardTitle>Advanced</CardTitle>
        <CardDescription>Power-user knobs for the active provider.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
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
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
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
    <div className="flex items-start justify-between gap-3 rounded-md border border-border bg-background px-3 py-2">
      <div className="min-w-0 space-y-0.5">
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
