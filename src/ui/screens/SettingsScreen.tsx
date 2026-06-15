/**
 * SettingsScreen — the main settings hub with provider list, workspace
 * groups, and preferences.
 *
 * Connected features:
 * - Provider list (shows configured providers with status dots)
 * - Workspace group (default model, modes, skills, styles, system prompt)
 * - Context & data group (context/retrieval, edit behavior, data & privacy)
 * - Preferences (dark mode toggle, accent color swatches, keyboard shortcuts)
 *
 * The settings row icons use text glyphs (◆ ◑ ◈ ✎ ⌘ ◎ ✓ ◴) matching the
 * mock, not lucide icons.
 *
 * TODO features (rendered as placeholders, not yet wired):
 * - Add provider button (opens onboarding)
 * - Dark mode toggle (needs to toggle Obsidian theme, not just a local var)
 * - Accent color swatches (needs to update --accent hue in settings)
 * - Keyboard shortcuts row (needs a shortcuts config screen)
 */

import * as React from "react";
import type { ProviderConfig } from "@/ui/screens/types";
import {
  IconChevronRight,
  IconPlus
} from "@/ui/icons";
import { CardRow, SectionLabel, Toggle } from "@/ui/primitives";
import type { Screen, EditScope } from "@/ui/screens/types";

type SettingsScreenProps = {
  providers: ProviderConfig[];
  onOpenProvider: (provider: ProviderConfig) => void;
  onAddProvider: () => void;
  onNavigate: (screen: Screen) => void;
  dark: boolean;
  onToggleDark: () => void;
  accentHue: number;
  onAccentChange: (hue: number) => void;
  skillsCount: number;
  modesCount: number;
  ragOn: boolean;
  editScope: EditScope;
  localOnly: boolean;
};

export function SettingsScreen(props: SettingsScreenProps): JSX.Element {
  const swatchHues = [286, 252, 215, 152, 75, 18];
  const swatchNames: Record<number, string> = {
    286: "Violet", 252: "Blue", 215: "Cyan", 152: "Green", 75: "Amber", 18: "Rose"
  };

  const editScopeValue = ({ preview: "Preview diffs", auto: "Auto-apply", ask: "Ask each time" } as const)[props.editScope];

  return (
    <>
      {/* Header (fixed, outside scroll) */}
      <div className="j-chat-settings-header">
        <span className="j-chat-settings-title">Settings</span>
      </div>

      <div className="j-chat-screen-scroll j-chat-scroll" style={{ padding: "0 14px 16px" }}>
        {/* AI Providers */}
        <SectionLabel>AI PROVIDERS</SectionLabel>
        {props.providers.map((p) => (
          <div key={p.name} className="j-chat-provider-item" onClick={() => props.onOpenProvider(p)}>
            <span className="j-chat-provider-initial" style={{ background: p.tint }}>{p.initial}</span>
            <div className="flex-1 min-w-0">
              <div className="j-chat-provider-name">{p.name}</div>
              <div className="j-chat-provider-detail">
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.dot }} />
                {p.detail}
              </div>
            </div>
            <IconChevronRight width={14} height={14} style={{ color: "var(--dim)" }} />
          </div>
        ))}
        {/* Add provider */}
        <button type="button" className="j-chat-btn-dashed" onClick={props.onAddProvider} style={{ marginBottom: 4 }}>
          <IconPlus width={14} height={14} />
          Add provider
        </button>

        {/* Workspace group */}
        <SectionLabel>WORKSPACE</SectionLabel>
        <div className="j-chat-card">
          {/* TODO: Default model row should open a model picker. */}
          <CardRow
            icon={<span style={{ fontSize: 13 }}>◆</span>}
            iconTint="var(--accent-tint)"
            iconColor="var(--accent-text)"
            label="Default model"
            value="Sonnet 4.5"
            onClick={() => {}}
          />
          {/* TODO: Modes row should open the ModesScreen. */}
          <CardRow
            icon={<span style={{ fontSize: 13 }}>◑</span>}
            iconTint="var(--ok-tint)"
            label="Modes"
            value={`${props.modesCount} custom`}
            onClick={() => props.onNavigate("modes")}
          />
          {/* TODO: Skills row should open the SkillsManageScreen. */}
          <CardRow
            icon={<span style={{ fontSize: 13 }}>◈</span>}
            iconTint="var(--blue-tint)"
            label="Skills"
            value={`${props.skillsCount} installed`}
            onClick={() => props.onNavigate("skillsManage")}
          />
          {/* TODO: Styles row — styles not yet implemented. */}
          <CardRow
            icon={<span style={{ fontSize: 13 }}>✎</span>}
            iconTint="var(--warm-tint)"
            label="Styles"
            value="3 custom"
            onClick={() => {}}
          />
          {/* TODO: System prompt row — should open an editor. */}
          <CardRow
            icon={<span style={{ fontSize: 13 }}>⌘</span>}
            iconTint="var(--accent-tint)"
            label="System prompt"
            value="Edited"
            onClick={() => {}}
          />
        </div>

        {/* Context & data group */}
        <SectionLabel>CONTEXT &amp; DATA</SectionLabel>
        <div className="j-chat-card">
          <CardRow
            icon={<span style={{ fontSize: 13 }}>◎</span>}
            iconTint="var(--blue-tint)"
            label="Context & retrieval"
            value={props.ragOn ? "RAG memory on" : "Page + selection"}
            onClick={() => props.onNavigate("context")}
          />
          <CardRow
            icon={<span style={{ fontSize: 13 }}>✓</span>}
            iconTint="var(--ok-tint)"
            label="Edit behavior"
            value={editScopeValue}
            onClick={() => props.onNavigate("editbeh")}
          />
          <CardRow
            icon={<span style={{ fontSize: 13 }}>◴</span>}
            iconTint="var(--warm-tint)"
            label="Data & privacy"
            value={props.localOnly ? "Local only" : "Cloud sync"}
            onClick={() => props.onNavigate("privacy")}
          />
        </div>

        {/* Preferences */}
        <SectionLabel>PREFERENCES</SectionLabel>
        <div className="j-chat-card">
          {/* TODO: Toggle Obsidian's theme. */}
          <div className="j-chat-card-row" style={{ cursor: "default" }}>
            <span className="j-chat-card-row-icon" style={{ background: "var(--accent-tint)", color: "var(--text2)" }}>☾</span>
            <span className="j-chat-card-row-label">Dark mode</span>
            <Toggle checked={props.dark} onChange={props.onToggleDark} />
          </div>
          {/* Accent color */}
          <div style={{ padding: 11, borderTop: "1px solid var(--chip)" }}>
            <div className="flex items-center gap-3 mb-3">
              <span className="j-chat-card-row-icon" style={{ background: "var(--accent-tint)", color: "var(--accent-text)" }}>◐</span>
              <span className="j-chat-card-row-label">Accent color</span>
            </div>
            {/* TODO: Swatches should update the --accent CSS variables. */}
            <div className="flex gap-3" style={{ paddingLeft: 37 }}>
              {swatchHues.map((hue) => (
                <button
                  key={hue}
                  type="button"
                  title={swatchNames[hue]}
                  onClick={() => props.onAccentChange(hue)}
                  style={{
                    width: 24, height: 24, borderRadius: "50%", border: "none", padding: 0, cursor: "pointer",
                    background: `oklch(0.62 0.18 ${hue})`,
                    boxShadow: hue === props.accentHue
                      ? `0 0 0 2px var(--surface), 0 0 0 4px oklch(0.62 0.18 ${hue})`
                      : "none",
                    transition: "box-shadow 0.15s"
                  }}
                />
              ))}
            </div>
          </div>
          {/* Keyboard shortcuts */}
          {/* TODO: Open a keyboard shortcuts config screen. */}
          <div className="j-chat-card-row" style={{ borderTop: "1px solid var(--chip)" }} onClick={() => {}}>
            <span className="j-chat-card-row-icon" style={{ background: "var(--warm-tint)", color: "var(--text2)" }}>⌘</span>
            <span className="j-chat-card-row-label">Keyboard shortcuts</span>
            <span className="j-chat-mono" style={{ fontSize: 11, color: "var(--faint)" }}>⌘ J</span>
            <IconChevronRight width={13} height={13} style={{ color: "var(--dim)" }} />
          </div>
        </div>
      </div>
    </>
  );
}