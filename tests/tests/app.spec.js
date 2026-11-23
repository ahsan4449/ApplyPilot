import { test, expect } from "@playwright/test";

test("desktop: tracking workflow, local helpers, and screenshots", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => {
    errors.push(e.message);
    console.log("BROWSER ERROR", e.message);
  });
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.goto("/");
  await page.getByLabel("Email address").fill("demo@example.com");
  await page.getByLabel("Password", { exact: true }).fill("demo-password-2026");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Make your next move." }),
  ).toBeVisible();
  await expect(
    page.getByText("Northstar Labs", { exact: true }).first(),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/dashboard.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Add application", exact: true })
    .click();
  await page.getByLabel("Company", { exact: true }).fill("E2E Systems");
  await page.getByLabel("Role", { exact: true }).fill("Graduate Engineer");
  await page.getByLabel("Next action").fill("Prepare portfolio");
  await page.getByRole("button", { name: "Save application" }).click();
  await expect(
    page.getByText("Application saved", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByText("E2E Systems", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Edit E2E Systems" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("Interview");
  await page.getByRole("button", { name: "Save application" }).click();
  await page
    .getByRole("button", { name: "Applications", exact: false })
    .filter({ hasText: "Applications" })
    .first()
    .click();
  await page.getByLabel("Search applications").fill("E2E Systems");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody")).toContainText("Interview");
  await page.getByRole("button", { name: "Edit E2E Systems" }).click();
  await expect(page.getByText("Status history", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Confirm delete" }).click();
  await expect(page.getByText("No matching applications")).toBeVisible();
  await page
    .getByRole("button", { name: "Career studio", exact: true })
    .click();
  await page
    .getByLabel("Your resume text")
    .fill("I build React, Node.js and JavaScript apps. I use MongoDB and Git.");
  await page
    .getByLabel("Job description")
    .fill("Seeking React and Node.js engineers who know SQL, Docker and Git.");
  await page.getByRole("button", { name: "Compare experience" }).click();
  await expect(page.locator(".score")).toContainText("60%");
  await expect(page.getByRole("status")).toHaveCount(0);
  await page.screenshot({
    path: "docs/screenshots/career-studio.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Follow-up draft", exact: true })
    .click();
  await page.getByLabel("Company", { exact: true }).fill("Northstar");
  await page.getByLabel("Role", { exact: true }).fill("Engineer");
  await page.getByRole("button", { name: "Create draft" }).click();
  await expect(
    page.getByRole("textbox", { name: "Editable follow-up draft" }),
  ).toHaveValue(/Northstar team/);
  expect(errors).toEqual([]);
});

test("mobile: sign in, no horizontal overflow, keyboard-close editor", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByLabel("Email address").fill("demo@example.com");
  await page.getByLabel("Password", { exact: true }).fill("demo-password-2026");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Make your next move." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "docs/screenshots/mobile.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Add application", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
