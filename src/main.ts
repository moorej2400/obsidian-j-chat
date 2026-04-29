import { Notice, Plugin, type WorkspaceLeaf } from "obsidian";
import { ChatController } from "./chat/chatController";
import { JChatSettingTab } from "./settingsTab";
import { J_CHAT_VIEW_TYPE, JChatView } from "./jChatView";
import { DEFAULT_SETTINGS, normalizeSettings, type JChatSettings } from "./pluginSettings";

export default class JChatPlugin extends Plugin {
  settings: JChatSettings = DEFAULT_SETTINGS;
  private controller: ChatController | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.controller = new ChatController(this.app, () => this.settings);

    this.registerView(
      J_CHAT_VIEW_TYPE,
      (leaf) => new JChatView(leaf, {
        controller: this.requireController(),
        getSettings: () => this.settings
      })
    );

    this.addRibbonIcon("message-square-text", "Open J Chat", () => {
      void this.activateView();
    });

    this.addCommand({
      id: "open-j-chat",
      name: "Open J Chat",
      callback: () => {
        void this.activateView();
      }
    });

    this.addSettingTab(new JChatSettingTab(this.app, this));
  }

  onunload(): void {
    this.app.workspace.detachLeavesOfType(J_CHAT_VIEW_TYPE);
  }

  async updateSettings(settings: JChatSettings): Promise<void> {
    this.settings = normalizeSettings(settings);
    await this.saveData(this.settings);
  }

  private async loadSettings(): Promise<void> {
    this.settings = normalizeSettings({
      ...DEFAULT_SETTINGS,
      ...(await this.loadData())
    });
  }

  private async activateView(): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(J_CHAT_VIEW_TYPE)[0];
    if (existing) {
      this.app.workspace.revealLeaf(existing);
      return;
    }

    const leaf = this.getOrCreateRightLeaf();
    await leaf.setViewState({ type: J_CHAT_VIEW_TYPE, active: true });
    this.app.workspace.revealLeaf(leaf);
  }

  private getOrCreateRightLeaf(): WorkspaceLeaf {
    const leaf = this.app.workspace.getRightLeaf(false);
    if (!leaf) {
      new Notice("Could not open the J Chat side panel.");
      throw new Error("Obsidian did not provide a right leaf for J Chat.");
    }
    return leaf;
  }

  private requireController(): ChatController {
    if (!this.controller) throw new Error("J Chat controller is not initialized.");
    return this.controller;
  }
}

