import { test, expect } from "@playwright/test";

test("first-run classic, changing heat, history and skip", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /never have/i })).toBeVisible();
  await page.getByRole("button", { name: /start playing/i }).click();
  await expect(page.getByTestId("question-card")).toBeVisible();
  await expect(page.getByTestId("question-card")).toContainText("Never have I ever");
  const first = await page.locator(".question-body strong").innerText();
  await page.getByRole("button", { name: /next question/i }).click();
  await expect(page.locator(".question-body strong")).not.toHaveText(first);
  await page.getByRole("button", { name: /previous question/i }).click();
  await expect(page.locator(".question-body strong")).toHaveText(first);
  await page.getByRole("button", { name: /back to chill/i }).click();
  await expect(page.getByTestId("active-heat")).toContainText("CHILL");
});

test("mature content requires both explicit checks", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /spicy/i }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("button", { name: /unlock this heat/i })).toBeDisabled();
  await page.getByLabel("Everyone playing is at least 18.").check();
  await page.getByLabel(/everyone in the group agrees/i).check();
  await page.getByRole("button", { name: /unlock this heat/i }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.getByRole("button", { name: /start playing/i }).click();
  await expect(page.getByTestId("active-heat")).toContainText("SPICY");
});

test("mobile setup fits and custom question creation works", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /create your own/i }).click();
  await page.getByLabel("Your question").fill("pretended not to recognize a friend at the mall");
  await page.getByRole("button", { name: /add to pack/i }).click();
  await expect(page.getByText(/pretended not to recognize a friend at the mall/i)).toBeVisible();
  await page.getByRole("button", { name: /back to setup/i }).click();
  await expect(page.getByRole("button", { name: /start playing/i })).toBeVisible();
});

test("unavailable topics reset when changing heat level", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("QUESTION CATEGORY").selectOption("School Memories");
  await page.getByRole("button", { name: /after dark/i }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByLabel("Everyone playing is at least 18.").check();
  await page.getByLabel(/everyone in the group agrees/i).check();
  await page.getByRole("button", { name: /unlock this heat/i }).click();
  await expect(page.getByLabel("QUESTION CATEGORY")).toHaveValue("Mixed");
  await page.getByRole("button", { name: /start playing/i }).click();
  await expect(page.getByTestId("active-heat")).toContainText("AFTER DARK");
});
