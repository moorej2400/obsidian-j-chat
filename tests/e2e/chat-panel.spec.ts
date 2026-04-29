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

  await page.getByRole("button", { name: /attach/i }).first().click();
  await expect(page.getByRole("button", { name: "Remove attachment Architecture.md" })).toBeVisible();

  await page.getByLabel("Restrict context to current file").click();
  await page.getByLabel("Chat message").fill("Search the vault for auth notes");
  await page.getByLabel("Send message").click();

  await expect(page.getByText("Vault context included Architecture.md and Auth Notes.md")).toBeVisible();
  await expect(page.locator("table")).toContainText("Source");
  await expect(page.getByText("edits applied")).toBeVisible();
});
