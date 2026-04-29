import { PluginSettingTab, type App } from "obsidian";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import type JChatPlugin from "./main";
import { normalizeSettings } from "./pluginSettings";
import { SettingsPage } from "./ui/SettingsPage";

export class JChatSettingTab extends PluginSettingTab {
  private root: Root | null = null;

  constructor(app: App, private readonly plugin: JChatPlugin) {
    super(app, plugin);
  }

  display(): void {
    this.containerEl.empty();
    const mount = this.containerEl.createDiv();
    this.root?.unmount();
    this.root = createRoot(mount);
    this.render();
  }

  hide(): void {
    this.root?.unmount();
    this.root = null;
  }

  private render(): void {
    this.root?.render(
      createElement(SettingsPage, {
        settings: this.plugin.settings,
        onChange: (settings) => {
          void this.plugin.updateSettings(normalizeSettings(settings));
        }
      })
    );
  }
}

