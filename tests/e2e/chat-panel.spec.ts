import { expect, test } from "@playwright/test";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const harnessUrl = pathToFileURL(path.join(__dirname, ".dist", "index.html")).href;

test("side panel sends messages with active note, selection, attachments, and vault context", async ({ page }) => {
  await page.goto(harnessUrl);

  await expect(page.getByText("Project Brief.md")).toBeVisible();
  await expect(page.getByText("Ask about this note")).toBeVisible();

  await page.getByLabel("Chat message").fill("Summarize the active note");
  await page.getByLabel("Send message").click();

  await expect(page.getByText("Summarize the active note")).toBeVisible();
  await expect(page.getByText("Mock AI saw Project Brief.md")).toBeVisible();

  await page.getByRole("button", { name: /insert selection/i }).click();
  await expect(page.getByLabel("Chat message")).toHaveValue(/selected acceptance criteria/i);

  await page.getByRole("button", { name: "Attach vault file" }).click();
  await expect(page.getByRole("button", { name: "Remove attachment Architecture.md" })).toBeVisible();

  await page.getByLabel("Restrict context to current file").click();
  await page.getByLabel("Chat message").fill("Search the vault for auth notes");
  await page.getByLabel("Send message").click();

  await expect(page.getByText("Vault context included Architecture.md and Auth Notes.md")).toBeVisible();
  await expect(page.locator("table")).toContainText("Source");
  await expect(page.getByText("edits applied")).toBeVisible();
});

test("side panel creates, renames, and switches chat sessions", async ({ page }) => {
  await page.goto(harnessUrl);

  await page.getByLabel("Chat message").fill("Remember this first thread");
  await page.getByLabel("Send message").click();
  await expect(page.getByText("Remember this first thread")).toBeVisible();

  await page.getByTitle("New chat").click();
  await expect(page.getByText("Ask about this note")).toBeVisible();
  await expect(page.getByText("Remember this first thread")).not.toBeVisible();

  await page.getByLabel("Open J Chat menu").click();
  const secondThreadRow = page.getByRole("listitem").filter({ hasText: "New chat" }).first();
  await secondThreadRow.hover();
  await secondThreadRow.getByRole("button", { name: "Rename New chat" }).click();
  const renameInput = page.getByRole("textbox", { name: "Rename New chat" });
  await expect(renameInput).toBeVisible();
  await renameInput.fill("Second thread");
  await renameInput.press("Enter");
  await expect(page.getByRole("listitem").filter({ hasText: "Second thread" })).toBeVisible();

  await page.getByRole("button", { name: /Project Brief chat.*message/i }).click();
  await expect(page.getByText("Remember this first thread")).toBeVisible();
});

test("side panel deletes a chat session from the menu drawer", async ({ page }) => {
  await page.goto(harnessUrl);

  await page.getByTitle("New chat").click();
  await page.getByLabel("Open J Chat menu").click();
  await expect(page.getByRole("listitem")).toHaveCount(2);

  const newChatRow = page.getByRole("listitem").filter({ hasText: "New chat" });
  await newChatRow.hover();
  await newChatRow.getByLabel(/Delete New chat/i).click();
  await expect(page.getByRole("listitem")).toHaveCount(1);
  await expect(page.getByRole("listitem").filter({ hasText: "Project Brief chat" })).toBeVisible();
});

test("side panel shows agent activity while a response is running", async ({ page }) => {
  await page.goto(harnessUrl);

  await page.getByLabel("Chat message").fill("Use tools before answering");
  await page.getByLabel("Send message").click();

  await expect(page.getByText("Thinking")).toBeVisible();
  await expect(page.getByText("Search vault")).toBeVisible();
});
