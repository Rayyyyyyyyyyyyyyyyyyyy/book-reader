import { expect, test, type Page } from "@playwright/test";

// Timings follow the GSAP timelines in BookStage: open ≈ 1.7s, close ≈ 1.5s, page turn 0.7s.
const OPENED = 2200;
const CLOSED = 1700;
const TURNED = 900;

const spine = (page: Page, rank: string) => page.locator(`.spine-slot[data-slug^="${rank}"]`);
// spread position "n/N" (the visible counter shows pages: 書名頁, "3–4 / 11", 完)
const pageLabel = (page: Page) => page.locator(".stage-page").getAttribute("data-spread");
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
  // the cursor tells which way a click turns: forward on the right page, nothing back on the first spread
  const book = (await page.locator(".book3d").evaluate((e) => e.getBoundingClientRect().toJSON())) as DOMRect;
  const turnCursor = () => page.locator(".stage-backdrop").getAttribute("data-turn");
  await page.mouse.move(book.x + book.width / 2, book.y + book.height / 2);
  expect(await turnCursor()).toBe("next");
  await page.mouse.move(book.x - book.width / 2, book.y + book.height / 2);
  expect(await turnCursor()).toBe("none");
  await page.mouse.move(5, 5);
  expect(await turnCursor()).toBe("");
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

test("a book without a note shows its summary, then a note-pending page", async ({ page }) => {
  await spine(page, "060").click();
  await page.waitForTimeout(OPENED);
  await expect(page.locator(".b-leaf .note-cols").first()).toContainText("書本摘要");
  const spreads = Number((await pageLabel(page))!.split("/")[1]);
  for (let k = 1; k < spreads; k++) {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(TURNED);
  }
  expect(await pageLabel(page)).toBe(`${spreads}/${spreads}`);
  await expect(page.locator(".stage-page")).toHaveText(/整理中$/);
  await expect(page.locator(".b-base")).toContainText("心得整理中");
  // the end offers the next book that has a note, and going on opens it
  const next = (await page.locator(".pg-next strong").textContent())!;
  await page.getByRole("button", { name: `下一本有心得的書：${next}` }).click();
  await page.waitForTimeout(CLOSED + OPENED);
  await expect(page.locator(".stage[role=dialog]")).toHaveAttribute("aria-label", `${next} 預覽`);
  await expect(page.locator(".stage-page")).toHaveText("書名頁");
});

test("a note is read page by page inside the book", async ({ page }) => {
  await spine(page, "001").click();
  await page.waitForTimeout(OPENED);
  const label = (await pageLabel(page))!;
  const spreads = Number(label.split("/")[1]);
  expect(label).toBe(`1/${spreads}`);
  expect(spreads).toBeGreaterThan(2);
  await expect(page.locator(".stage-page")).toHaveText("書名頁");
  // every page shows its own column of the note, and together they cover all of it
  const r = await page.evaluate(() => {
    const cols = [...document.querySelectorAll<HTMLElement>(".b-leaf .note-cols")];
    const c = cols[0];
    const step = c.clientWidth + parseFloat(getComputedStyle(c).columnGap);
    return { pages: cols.length, needed: Math.round((c.scrollWidth + step - c.clientWidth) / step), sr: document.querySelector(".sr-only")!.textContent };
  });
  expect(r.pages).toBe(r.needed);
  expect(r.sr).toContain("書本摘要");
  expect(r.sr).toContain("讀書筆記");
  for (let k = 1; k < spreads; k++) {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(TURNED);
  }
  expect(await pageLabel(page)).toBe(`${spreads}/${spreads}`);
  await expect(page.locator(".pg-end")).toHaveText("完");
  // an odd page count ends with the last page on the left, opposite 完
  await expect(page.locator(".stage-page")).toHaveText(/^(完|(\d+) \/ \2 · 完)$/);
});

test("Back closes the book, focus stays in it, and the list view survives a visit to a book page", async ({ page }) => {
  await spine(page, "001").click();
  await page.waitForTimeout(OPENED);
  // Tab cycles inside the dialog and never reaches the page behind it
  for (let k = 0; k < 8; k++) {
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => !!document.activeElement?.closest(".stage"))).toBe(true);
  }
  await page.goBack();
  await page.waitForTimeout(CLOSED);
  await expect(page.locator(".stage")).toHaveCount(0);
  expect(page.url()).toMatch(/\/book-reader\/$/);
  // one Back closes the book; the history entry is gone again
  expect(await page.evaluate(() => history.state?.bookStage ?? null)).toBeNull();

  await page.getByRole("button", { name: "列表" }).click();
  await page.locator("main a.book-card").first().click();
  await page.waitForURL(/\/book\//);
  await page.goBack();
  await expect(page.getByRole("button", { name: "列表" })).toHaveAttribute("aria-pressed", "true");
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
  await expect(page.getByRole("heading", { name: "找不到符合「zzzz」的書" })).toBeVisible();
  await expect(page.getByRole("button", { name: "清除搜尋" }).last()).toBeVisible();
  await search.fill("");
  await page.getByRole("button", { name: /財經與投資/ }).click();
  expect(await count()).toBe(19);
  await page.getByRole("button", { name: /^全部/ }).click();
  await page.getByRole("button", { name: /讀書筆記/ }).click();
  expect(await count()).toBe(14);
  await page.getByRole("button", { name: /讀書筆記/ }).click();
  await page.getByRole("button", { name: "列表" }).click();
  expect(await count()).toBe(0);
  // list cards are plain links to the book page (no second, different "open a book" modal)
  await expect(page.locator("main a.book-card")).toHaveCount(111);
  await expect(page.locator("main a.book-card").first()).toHaveAttribute("href", /\/book-reader\/book\/\d{3}/);
  await page.getByRole("button", { name: "書架" }).click();
  expect(await count()).toBe(111);
});

test("every spine shows its whole title; books with a note first, each group tallest first", async ({ page }) => {
  await page.evaluate(() => document.fonts.ready);
  const r = await page.evaluate(() => ({
    clipped: [...document.querySelectorAll<HTMLElement>(".spine-title")]
      .filter((t) => t.scrollHeight > t.clientHeight + 1 || t.scrollWidth > t.clientWidth + 1)
      .map((t) => t.textContent),
    unsorted: [...document.querySelectorAll(".shelf")].filter((s) => {
      const books = [...s.querySelectorAll(".spine-slot")].map((b) => ({
        note: !!b.querySelector(".ribbon"),
        h: b.querySelector(".spine-face")!.getBoundingClientRect().height,
      }));
      return books.some((b, i) => i > 0 && (b.note && !books[i - 1].note || (b.note === books[i - 1].note && b.h > books[i - 1].h + 0.5)));
    }).length,
  }));
  expect(r.clipped).toEqual([]);
  expect(await page.locator(".spine-slot .ribbon").count()).toBe(14);
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
    // a stray tap above the page does not close the book; the page's left third goes back
    await page.touchscreen.tap(195, 60);
    await page.waitForTimeout(400);
    await expect(page.locator(".stage")).toHaveCount(1);
    const pg = (await page.locator(".book3d").evaluate((e) => e.getBoundingClientRect().toJSON())) as DOMRect;
    await page.touchscreen.tap(pg.x + pg.width / 6, pg.y + pg.height / 2);
    await page.waitForTimeout(TURNED);
    expect(await pageLabel(page)).toBe("1/2");
    await page.getByRole("button", { name: "收回書架" }).tap();
    await page.waitForTimeout(CLOSED);
    await expect(page.locator(".stage")).toHaveCount(0);
  });
});
