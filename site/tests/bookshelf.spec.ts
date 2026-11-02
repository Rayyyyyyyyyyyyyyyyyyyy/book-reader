import { expect, test, type Page } from "@playwright/test";

// Timings follow the GSAP timelines in BookStage: open ≈ 1.7s, close ≈ 1.5s, page turn 0.7s.
const OPENED = 2200;
const CLOSED = 1700;
const TURNED = 900;

const spine = (page: Page, rank: string) => page.locator(`.spine-slot[data-slug^="${rank}"]`);
const pageLabel = async (page: Page) => (await page.locator(".stage-page").textContent())?.replace(/\s/g, "");
const focusedRank = (page: Page) => page.evaluate(() => document.activeElement?.getAttribute("data-slug")?.slice(0, 3));

test.beforeEach(async ({ page }) => {
  await page.goto("./");
  await page.waitForLoadState("networkidle");
});

test("the picked book leaves from its spine and comes back to it, leaving no overlay", async ({ page }) => {
  await spine(page, "060").hover();
  await page.waitForTimeout(300);
  const shelf = await spine(page, "060").locator(".spine-face").boundingBox();
  // React commits the click in a microtask and GSAP sets the start pose synchronously, so measure right after it
  const start = await page.evaluate(async () => {
    document.querySelector<HTMLElement>('.spine-slot[data-slug^="060"]')!.click();
    await Promise.resolve();
    const r = document.querySelector(".b-spine")!.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
  for (const k of ["x", "y", "width", "height"] as const) expect(Math.abs(start[k] - shelf![k])).toBeLessThan(0.5);

  await page.waitForTimeout(OPENED);
  await expect(page.locator(".stage[role=dialog]")).toHaveCount(1);
  await expect(page.locator(".stage-cta")).toHaveAttribute("href", "/book-reader/book/060-the-courage-to-be-disliked");
  await expect(page.locator(".stage-cta")).toContainText("完整書頁");
  expect(await page.evaluate(() => document.querySelector("input")!.closest("[inert]") !== null)).toBe(true);

  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(CLOSED);
  await expect(page.locator(".stage")).toHaveCount(0);
  await expect(spine(page, "060").locator(".spine-face")).toBeVisible();
  expect(await focusedRank(page)).toBe("060");
  expect(await page.evaluate(() => [...document.body.children].some((n) => (n as HTMLElement).inert))).toBe(false);
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("");
});

test("closing mid-extraction cleans up, and a spine opens from the keyboard", async ({ page }) => {
  await spine(page, "001").click();
  await page.waitForTimeout(350);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(CLOSED);
  await expect(page.locator(".stage")).toHaveCount(0);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(OPENED);
  await expect(page.locator(".stage-cta")).toContainText("完整書頁");
  await page.locator(".stage-backdrop").click({ position: { x: 20, y: 20 } });
  await page.waitForTimeout(CLOSED);
  await expect(page.locator(".stage")).toHaveCount(0);
});

test("pages turn by arrows, buttons and clicks on the book, and fall back when it closes", async ({ page }) => {
  await spine(page, "001").click();
  await page.waitForTimeout(OPENED);
  const spreads = Number((await pageLabel(page))!.split("/")[1]);
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(250);
  await page.keyboard.press("ArrowRight"); // ignored while the sheet is still turning
  await page.waitForTimeout(TURNED);
  expect(await pageLabel(page)).toBe(`2/${spreads}`);
  await page.getByRole("button", { name: "下一頁" }).click();
  await page.waitForTimeout(TURNED);
  expect(await pageLabel(page)).toBe(`3/${spreads}`);
  // clicking the right page turns forward, the left page back; neither closes the book
  const r = (await page.locator(".book3d").evaluate((e) => e.getBoundingClientRect().toJSON())) as DOMRect;
  await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
  await page.waitForTimeout(TURNED);
  expect(await pageLabel(page)).toBe(`4/${spreads}`);
  await page.mouse.click(r.x - r.width / 2, r.y + r.height / 2);
  await page.waitForTimeout(TURNED);
  expect(await pageLabel(page)).toBe(`3/${spreads}`);
  await expect(page.locator(".stage")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(CLOSED + 500);
  await expect(page.locator(".stage")).toHaveCount(0);
  expect(await focusedRank(page)).toBe("001");
});

test("a book without a note has a title page and a note-pending page", async ({ page }) => {
  await spine(page, "060").click();
  await page.waitForTimeout(OPENED);
  expect(await pageLabel(page)).toBe("1/2");
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(TURNED);
  expect(await pageLabel(page)).toBe("2/2");
  await expect(page.getByRole("button", { name: "下一頁" })).toBeDisabled();
  await expect(page.locator(".b-base")).toContainText("心得整理中");
});

test("a note is read page by page inside the book", async ({ page }) => {
  await spine(page, "001").click();
  await page.waitForTimeout(OPENED);
  const label = (await pageLabel(page))!;
  const spreads = Number(label.split("/")[1]);
  expect(label).toBe(`1/${spreads}`);
  expect(spreads).toBeGreaterThan(2);
  // every page shows its own column of the note, and together they cover all of it
  const r = await page.evaluate(() => {
    const cols = [...document.querySelectorAll<HTMLElement>(".b-leaf .note-cols")];
    const c = cols[0];
    const step = c.clientWidth + parseFloat(getComputedStyle(c).columnGap);
    return { pages: cols.length, needed: Math.round((c.scrollWidth + step - c.clientWidth) / step), sr: document.querySelector(".sr-only")!.textContent };
  });
  expect(r.pages).toBe(r.needed);
  expect(r.sr).toContain("讀書心得");
  for (let k = 1; k < spreads; k++) {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(TURNED);
  }
  expect(await pageLabel(page)).toBe(`${spreads}/${spreads}`);
  await expect(page.locator(".pg-end")).toHaveText("完");
});

test("a note that fails to load points to the book page", async ({ page }) => {
  await page.route("**/book/001-*", (r) => r.abort());
  await spine(page, "001").click();
  await page.waitForTimeout(OPENED);
  expect(await pageLabel(page)).toBe("1/2");
  await expect(page.locator(".b-base")).toContainText("心得載入失敗");
});

test("search, categories, notes-only and the grid toggle drive the shelf", async ({ page }) => {
  const count = () => page.locator(".spine-slot").count();
  expect(await count()).toBe(111);
  const search = page.getByPlaceholder("搜尋書名、作者或編號…");
  for (const [q, n] of [["被討厭", 1], ["Courage", 1], ["Kahneman", 2], ["060", 1], ["zzzz", 0]] as const) {
    await search.fill(q);
    expect(await count(), `search ${q}`).toBe(n);
  }
  await expect(page.getByText("Nothing here yet.")).toBeVisible();
  await search.fill("");
  await page.getByRole("button", { name: /財經與投資/ }).click();
  expect(await count()).toBe(19);
  await page.getByRole("button", { name: /^全部/ }).click();
  await page.getByRole("button", { name: /篇讀書筆記/ }).click();
  expect(await count()).toBe(14);
  await page.getByRole("button", { name: /篇讀書筆記/ }).click();
  await page.getByRole("button", { name: "列表" }).click();
  expect(await count()).toBe(0);
  await expect(page.locator("main article")).toHaveCount(111);
  await page.getByRole("button", { name: "書架" }).click();
  expect(await count()).toBe(111);
});

test("every spine shows its whole title, tallest books first", async ({ page }) => {
  await page.evaluate(() => document.fonts.ready);
  const r = await page.evaluate(() => ({
    clipped: [...document.querySelectorAll<HTMLElement>(".spine-title")]
      .filter((t) => t.scrollHeight > t.clientHeight + 1 || t.scrollWidth > t.clientWidth + 1)
      .map((t) => t.textContent),
    unsorted: [...document.querySelectorAll(".shelf")].filter((s) => {
      const hs = [...s.querySelectorAll(".spine-face")].map((f) => f.getBoundingClientRect().height);
      return hs.some((h, i) => i > 0 && h > hs[i - 1] + 0.5);
    }).length,
  }));
  expect(r.clipped).toEqual([]);
  expect(r.unsorted).toBe(0);
});

test("static pages, feeds and the sitemap are still served", async ({ request }) => {
  for (const path of ["book/060-the-courage-to-be-disliked", "rss.xml", "sitemap-index.xml", "og/home.png"])
    expect((await request.get(path)).status(), path).toBe(200);
});

test.describe("reduced motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });
  test("opens and closes without animation", async ({ page }) => {
    await spine(page, "001").click();
    await page.waitForTimeout(60);
    expect(await page.evaluate(() => document.querySelector<HTMLElement>(".book3d")!.style.getPropertyValue("--open"))).toBe("-180");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(60);
    await expect(page.locator(".stage")).toHaveCount(0);
  });
});

test.describe("phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test("one sideways row per shelf, a single readable page, swipe to turn", async ({ page }) => {
    const shelf = page.locator(".shelf").first();
    const [scroll, client] = await shelf.evaluate((s) => [s.scrollWidth, s.clientWidth]);
    expect(scroll).toBeGreaterThan(client);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    await spine(page, "016").tap();
    await page.waitForTimeout(OPENED);
    const sheet = (await page.locator(".b-base").boundingBox())!;
    expect(sheet.x).toBeGreaterThanOrEqual(0);
    expect(sheet.x + sheet.width).toBeLessThanOrEqual(390);
    const ui = (await page.locator(".stage-ui").boundingBox())!;
    expect(ui.x + ui.width).toBeLessThanOrEqual(390);
    expect(await page.locator(".pg-desc").first().evaluate((e) => parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(12);

    // a swipe on the backdrop turns the page and must not also close the book
    await page.evaluate(() => {
      const t = document.querySelector<HTMLElement>(".stage-backdrop")!;
      const ev = (type: string, x: number) => t.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: 700, bubbles: true }));
      ev("pointerdown", 300);
      ev("pointerup", 120);
      t.click();
    });
    await page.waitForTimeout(TURNED);
    await expect(page.locator(".stage")).toHaveCount(1);
    expect(await pageLabel(page)).toBe("2/2");
    await page.getByRole("button", { name: "收回書架" }).tap();
    await page.waitForTimeout(CLOSED);
    await expect(page.locator(".stage")).toHaveCount(0);
  });
});
