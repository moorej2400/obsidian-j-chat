import type { App, TFile } from "obsidian";
import type { ContextFile } from "./contextBuilder";
import type { VaultDocument } from "./vaultSearch";

export async function readMarkdownFile(app: App, file: TFile): Promise<ContextFile> {
  return {
    path: file.path,
    content: await app.vault.cachedRead(file)
  };
}

export async function readAllMarkdownDocuments(app: App, excludePath?: string): Promise<VaultDocument[]> {
  const files = app.vault.getMarkdownFiles().filter((file) => file.path !== excludePath);
  return Promise.all(files.map((file) => readMarkdownFile(app, file)));
}

