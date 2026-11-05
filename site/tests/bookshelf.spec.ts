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

test("reloading with a book open leaves no dead Back", async ({ page }) => {
  await spine(page, "001").click();
  await page.waitForTimeout(OPENED);
  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(page.locator(".stage")).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => history.state?.bookStage ?? null)).toBeNull();
  await page.goBack();
  expect(page.url()).toBe("about:blank");
});

test("returning from the full book page leaves no dead Back", async ({ page }) => {
  await spine(page, "001").click();
  await page.waitForTimeout(OPENED);
  await page.locator(".stage-cta").click();
  await page.waitForURL(/\/book\//);
  await page.goBack();
  await page.waitForLoadState("networkidle");
  await expect(page.locator(".stage")).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => history.state?.bookStage ?? null)).toBeNull();
  await page.goBack();
  expect(page.url()).toBe("about:blank");
});

test("a page restored from bfcache does not keep the book out", async ({ page }) => {
  await spine(page, "001").click();
  await page.waitForTimeout(OPENED);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })));
  await page.waitForTimeout(CLOSED);
  await expect(page.locator(".stage")).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => history.state?.bookStage ?? null)).toBeNull();
});

test("switching views on desktop does not replay the entrance", async ({ page }) => {
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: "列表" }).click();
  expect(await page.locator(".hero h1").evaluate((el: HTMLElement) => el.style.opacity)).toBe("");
});

test("a remembered list view reloads without the entrance, its chip already selected", async ({ page }) => {
  await page.getByRole("button", { name: "列表" }).click();
  await page.reload();
  const first = page.locator(".catalog-desktop .book-card").first();
  await first.waitFor();
  expect(await first.evaluate((el: HTMLElement) => el.style.opacity)).toBe("");
  await expect(page.locator('.chip[data-view="grid"]').first()).toHaveAttribute("aria-pressed", "true");
});

test.describe("landscape phone", () => {
  test.use({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
  test("opens the scrolling reader, not the 3D book", async ({ page }) => {
    await page.locator('.catalog-mobile .book-card[data-slug^="001"]').click();
    await expect(page.getByRole("dialog")).toHaveCount(1);
    await expect(page.locator(".book3d")).toHaveCount(0);
    await expect(page.locator(".reader-content .summary")).toBeVisible();
    const size = await page.locator(".reader-content .summary p").evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
    expect(size).toBeGreaterThanOrEqual(16);
  });
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
  const card = (page: Page, rank: string) => page.locator(`.catalog-mobile .book-card[data-slug^="${rank}"]`);
  const reader = (page: Page) => page.getByRole("dialog");
  const home = /\/book-reader\/$/;

  test("SSR and hydration default to two columns, with notes first and all 111 books", async ({ page }) => {
    // Block only hydration modules: the head script and SSR must already choose the right view.
    await page.route(/\.m?js(?:\?|$)/, (route) => route.abort());
    await page.reload();
    await expect(page.locator(".catalog-shelf")).toBeHidden();
    await expect(page.locator(".catalog-mobile")).toBeVisible();
    await expect(card(page, "001")).toBeVisible();
    await page.unroute(/\.m?js(?:\?|$)/);
    await page.reload();
    await expect(page.getByRole("button", { name: "列表", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".catalog-mobile .book-card")).toHaveCount(111);
    expect(await page.locator(".cover-grid").first().evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length)).toBe(2);
    const sorted = await page.locator(".catalog-mobile .cover-grid").evaluateAll((grids) => grids.every((grid) => {
      let seenWithoutNote = false;
      return [...grid.children].every((card) => {
        const note = card.hasAttribute("data-note");
        if (note && seenWithoutNote) return false;
        if (!note) seenWithoutNote = true;
        return true;
      });
    }));
    expect(sorted).toBe(true);
    await expect(page.locator(".catalog-mobile .card-title .ribbon-mark")).toHaveCount(14);
    expect(await card(page, "001").locator(".cover").evaluate((el) => el.getBoundingClientRect().top)).toBeLessThan(844);
    await page.getByRole("textbox", { name: "搜尋書籍" }).fill("zzzz");
    await expect(page.getByRole("status")).toContainText("找不到");
    await page.getByRole("button", { name: "清除搜尋" }).last().click();
    await expect(page.getByRole("textbox", { name: "搜尋書籍" })).toBeFocused();
    await expect(page.locator(".catalog-mobile .book-card")).toHaveCount(111);
  });

  test("only one sticky row, large targets, and no horizontal page overflow", async ({ page }) => {
    await page.evaluate(() => scrollTo(0, 600));
    const search = await page.getByRole("textbox", { name: "搜尋書籍" }).boundingBox();
    expect(search!.y).toBeGreaterThanOrEqual(0);
    expect(search!.y + search!.height).toBeLessThan(90);
    expect(await page.locator(".filters").evaluate((el) => el.getBoundingClientRect().bottom)).toBeLessThan(0);
    const small = await page.locator("#hundred-root button, #hundred-root input, #hundred-root a").evaluateAll((elements) => elements.filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44);
    }).map((el) => el.textContent));
    expect(small).toEqual([]);
    // the 44px floor must not squeeze a chip below its text
    await page.evaluate(() => scrollTo(0, 0));
    const clipped = await page.locator(".filters .chip").evaluateAll((chips) => chips.filter((c) => c.scrollWidth > c.clientWidth).map((c) => c.textContent));
    expect(clipped).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });

  test("cover opens at its own bounds, changes URL, and Back restores scroll and focus", async ({ page }) => {
    await card(page, "060").scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => scrollY);
    const origin = await card(page, "060").locator(".cover").boundingBox();
    const start = await page.evaluate(async () => {
      document.querySelector<HTMLElement>('.catalog-mobile [data-slug^="060"]')!.click();
      await Promise.resolve();
      return document.querySelector(".mobile-flight")!.getBoundingClientRect().toJSON();
    });
    for (const k of ["x", "y", "width", "height"] as const) expect(Math.abs(start[k] - origin![k])).toBeLessThan(1);
    await expect(page).toHaveURL(/\/book\/060-/);
    await expect(reader(page)).toHaveCount(1);
    await expect(reader(page)).toHaveAttribute("aria-modal", "true");
    await expect(page.locator(".reader-content .summary")).toContainText("書本摘要");
    await expect(page.locator(".reader-content .note-pending")).toContainText("整理中");
    await page.goBack();
    await expect(reader(page)).toHaveCount(0);
    await expect(page).toHaveURL(home);
    await expect(card(page, "060")).toBeFocused();
    expect(Math.abs(await page.evaluate(() => scrollY) - before)).toBeLessThan(2);
    expect(await page.evaluate(() => document.body.style.position)).toBe("");
    // Closing must consume the book entry; another Back leaves the catalogue.
    await page.goBack();
    expect(page.url()).toBe("about:blank");
  });

  test("full text scrolls at 17px, traps focus, and Escape returns to the cover", async ({ page }) => {
    await card(page, "001").click();
    await expect(page.locator(".reader-content #note.note")).toBeVisible();
    await page.waitForTimeout(1100);
    const content = await page.locator(".reader-content").evaluate((el) => ({
      order: [...el.querySelectorAll(".reader-meta, .summary, #note")].map((n) => n.className),
      fonts: [...el.querySelectorAll(".desc, .summary p, .note p")].map((n) => parseFloat(getComputedStyle(n).fontSize)),
    }));
    expect(content.order[0]).toBe("reader-meta");
    expect(content.order[1]).toBe("summary");
    expect(content.order[2]).toBe("note");
    expect(Math.min(...content.fonts)).toBeGreaterThanOrEqual(16);
    const scroll = await page.locator(".reader-scroll").evaluate((el) => ({ height: el.clientHeight, total: el.scrollHeight }));
    expect(scroll.total).toBeGreaterThan(scroll.height);
    await expect(page.locator(".book3d, .stage-arrow")).toHaveCount(0);
    // a native modal hands Tab to the browser UI past its last control, but never to the page behind it
    for (let k = 0; k < 5; k++) {
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => !!document.activeElement?.closest("#hundred-root"))).toBe(false);
    }
    const target = await reader(page).getByRole("button", { name: "回到書目" }).boundingBox();
    expect(target!.width).toBeGreaterThanOrEqual(44);
    expect(target!.height).toBeGreaterThanOrEqual(44);
    await page.keyboard.press("Escape");
    await expect(reader(page)).toHaveCount(0);
    await expect(card(page, "001")).toBeFocused();
  });

  test("reload stays on the static book, and its back link restores catalogue state", async ({ page }) => {
    await page.getByRole("textbox", { name: "搜尋書籍" }).fill("001");
    await card(page, "001").click();
    await page.reload();
    await expect(page).toHaveURL(/\/book\/001-/);
    await expect(page.locator(".detail h1")).toBeVisible();
    await expect(page.locator("#note.note")).toBeVisible();
    await expect(reader(page)).toHaveCount(0);
    await page.getByRole("link", { name: "回到書目" }).click();
    await expect(page).toHaveURL(home);
    await expect(reader(page)).toHaveCount(0);
    await expect(page.getByRole("textbox", { name: "搜尋書籍" })).toHaveValue("001");
    await expect(card(page, "001")).toBeFocused();
    await page.goBack();
    expect(page.url()).toBe("about:blank");
  });

  test("direct shared link uses the catalogue without a return loop", async ({ page }) => {
    await page.goto("about:blank");
    await page.goto("./book/060-the-courage-to-be-disliked");
    await expect(reader(page)).toHaveCount(0);
    await expect(page.locator("section.summary")).toBeVisible();
    await page.getByRole("link", { name: "回到書目" }).click();
    await expect(page).toHaveURL(home);
    await page.goBack();
    expect(page.url()).toBe("about:blank");
  });

  test("shelf choice survives reload and its spine opens the same reader", async ({ page }) => {
    await page.getByRole("button", { name: "書架", exact: true }).click();
    await page.reload();
    await expect(page.getByRole("button", { name: "書架", exact: true })).toHaveAttribute("aria-pressed", "true");
    expect(await spine(page, "001").evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThanOrEqual(44);
    const shelf = page.locator(".shelf").first();
    expect(await shelf.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    await spine(page, "001").click();
    await expect(reader(page)).toHaveCount(1);
    await expect(page).toHaveURL(/\/book\/001-/);
    await reader(page).getByRole("button", { name: "回到書目" }).click();
    await expect(reader(page)).toHaveCount(0);
    await expect(spine(page, "001")).toBeFocused();
  });

  test("Back mid-animation, repeated activation, resize and a missing origin clean up", async ({ page }) => {
    await card(page, "001").evaluate((el: HTMLElement) => { el.click(); el.click(); });
    await expect(reader(page)).toHaveCount(1);
    await page.goBack();
    await page.setViewportSize({ width: 580, height: 390 });
    await expect(reader(page)).toHaveCount(0);
    await expect(page).toHaveURL(home);
    await card(page, "001").click();
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(page.locator(".reader-sheet")).toHaveCSS("opacity", "1");
    await page.setViewportSize({ width: 390, height: 844 });
    // Model a filter result removing the original trigger while the modal owns focus.
    await card(page, "001").evaluate((el) => el.remove());
    await page.keyboard.press("Escape");
    await expect(reader(page)).toHaveCount(0);
    await expect(page.getByRole("textbox", { name: "搜尋書籍" })).toBeFocused();
  });

  test("loading, failure and recovery use the real book without another history entry", async ({ page }) => {
    let fail: (() => void) | undefined;
    await page.route("**/book/001-*", async (route) => {
      if (route.request().resourceType() === "document") return route.continue();
      await new Promise<void>((resolve) => { fail = resolve; });
      await route.abort();
    });
    await card(page, "001").click();
    await expect(reader(page).getByRole("status")).toHaveText("內容載入中…");
    await expect.poll(() => fail).toBeTruthy();
    fail!();
    await expect(reader(page).getByRole("alert")).toContainText("載入失敗");
    await page.getByRole("link", { name: "到書頁閱讀" }).click();
    await expect(page.locator(".detail h1")).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(home);
    await expect(reader(page)).toHaveCount(0);
  });

  test("pageshow removes stale previews, and Forward loads the static book", async ({ page }) => {
    await card(page, "001").click();
    await page.goBack();
    await expect(reader(page)).toHaveCount(0);
    await page.goForward();
    await expect(page.locator(".detail h1")).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(home);
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })));
    await expect(reader(page)).toHaveCount(0);
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await card(page, "001").click();
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })));
    await expect(page.locator(".detail h1")).toBeVisible();
    await expect(reader(page)).toHaveCount(0);
  });

  test("note-only and empty content keep the correct sections without changing source books", async ({ page }) => {
    // Modify the serialized island props for fixtures, leaving published content untouched.
    for (const hasNote of [true, false]) {
      await page.route("**/book-reader/", async (route) => {
        const response = await route.fetch();
        const html = await response.text();
        const modified = html.replace(/(&quot;hasSummary&quot;:\[0,)true/g, "$1false");
        await route.fulfill({ response, body: hasNote ? modified : modified.replace(/(&quot;hasNote&quot;:\[0,)true/g, "$1false") });
      });
      await page.goto("./");
      await expect(page.getByRole("button", { name: "列表", exact: true })).toHaveAttribute("aria-pressed", "true");
      await page.route("**/book/001-*", async (route) => {
        const response = await route.fetch();
        await route.fulfill({ response, body: (await response.text()).replace(/<section class="summary"[\s\S]*?<\/section>/, "") });
      });
      await card(page, "001").click();
      if (hasNote) await expect(page.locator(".reader-content .note")).toBeVisible();
      else await expect(page.locator(".reader-content .note-pending")).toBeVisible();
      await expect(page.locator(".reader-content .summary")).toHaveCount(0);
      await expect(reader(page).getByRole("status")).toHaveCount(0);
      await page.keyboard.press("Escape");
      await expect(reader(page)).toHaveCount(0);
      await page.unrouteAll();
    }
  });

  test("the end of a book goes on to the next note, and one Back returns to the book first opened", async ({ page }) => {
    await card(page, "001").click();
    const next = reader(page).locator(".reader-next");
    await expect(next).toBeVisible();
    const box = await next.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    const before = page.url();
    await next.click();
    await expect.poll(() => page.url()).not.toBe(before);
    await expect(page.url()).toMatch(/\/book\//);
    await expect(reader(page).locator("#reader-title")).toBeFocused();
    await page.goBack();
    await expect(reader(page)).toHaveCount(0);
    await expect(page).toHaveURL(home);
    await expect(card(page, "001")).toBeFocused();
  });

  test("a later reload does not bring back an old search or scroll", async ({ page }) => {
    await page.getByRole("textbox", { name: "搜尋書籍" }).fill("001");
    await card(page, "001").click();
    await expect(reader(page)).toHaveCount(1);
    await page.goBack();
    await expect(reader(page)).toHaveCount(0);
    expect(await page.evaluate(() => history.state?.catalogReturn ?? null)).toBeNull();
    await page.getByRole("textbox", { name: "搜尋書籍" }).fill("");
    await page.reload();
    await expect(page.getByRole("textbox", { name: "搜尋書籍" })).toHaveValue("");
  });

  test.describe("reduced motion", () => {
    test.use({ contextOptions: { reducedMotion: "reduce" } });
    test("opens and closes immediately with the same URL and focus behavior", async ({ page }) => {
      await card(page, "001").click();
      await expect(page.locator(".reader-sheet")).toHaveCSS("opacity", "1");
      await expect(page.locator(".mobile-flight")).toHaveCSS("visibility", "hidden");
      await expect(page).toHaveURL(/\/book\/001-/);
      await page.keyboard.press("Escape");
      await expect(reader(page)).toHaveCount(0);
      await expect(card(page, "001")).toBeFocused();
    });
  });
});
