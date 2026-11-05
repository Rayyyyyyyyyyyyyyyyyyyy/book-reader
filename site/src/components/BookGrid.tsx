import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import MobileReader, { type MobileSelection } from "./reader/MobileReader";
import type { BookMeta } from "../lib/books";
import { PHONE } from "../lib/phone";
import ImmersiveShelf, { byHeight } from "./shelf/ImmersiveShelf";

type Cat = { key: string; zh: string; en: string };

type Props = {
  books: BookMeta[];
  cats: Cat[];
  base: string; // import.meta.env.BASE_URL, ends with "/"
};

const bookHref = (base: string, slug: string) => `${base}book/${slug}`;

// "109" / "no.109" / "#109" / "第109" / "109本" → 109; non-numeric queries → null
const queryToRank = (s: string): number | null => {
  const m = s.replace(/\s+/g, "").match(/^(?:no\.?|#|第)?0*(\d+)本?$/i);
  return m ? parseInt(m[1], 10) : null;
};

// The return point is for one trip: a later reload must not bring back old filters or scroll.
const clearReturn = () => {
  if (!history.state?.catalogReturn) return;
  const { catalogReturn, ...rest } = history.state;
  history.replaceState(Object.keys(rest).length ? rest : null, "");
};

const phoneOrder = (books: BookMeta[]) => [...books].sort((a, b) => +b.hasNote - +a.hasNote || a.rank - b.rank);

export default function BookGrid({ books, cats, base }: Props) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [notesOnly, setNotesOnly] = useState(false);
  const [view, setView] = useState<"shelf" | "grid" | null>(null);
  const [phone, setPhone] = useState<boolean | null>(null);
  const [selected, setSelected] = useState<MobileSelection | null>(null);
  const selectionRef = useRef<MobileSelection | null>(null);
  const restoreRef = useRef<{ scrollY: number; slug: string; shelves?: Record<string, number> } | null>(null);
  const preferredView = useRef<"shelf" | "grid" | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // SSR renders both responsive variants; the head script selects one before first paint.
  useEffect(() => {
    const media = matchMedia(PHONE);
    const sync = () => {
      let saved: string | null = null;
      try { saved = sessionStorage.getItem("view"); } catch {}
      const v = preferredView.current ?? (saved === "grid" || saved === "shelf" ? saved : media.matches ? "grid" : "shelf");
      document.documentElement.dataset.catalogView = v;
      setView(v);
      setPhone(media.matches);
    };
    sync();
    const saved = history.state?.catalogReturn;
    if (saved) {
      setQuery(saved.query ?? "");
      setActiveCategory(saved.category ?? "all");
      setNotesOnly(!!saved.notesOnly);
      restoreRef.current = saved;
      clearReturn();
    }
    const pop = () => {
      if (!selectionRef.current && history.state?.mobileReader) location.reload();
    };
    const shown = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      if (history.state?.mobileReader) {
        location.reload();
      } else {
        closed();
      }
    };
    media.addEventListener("change", sync);
    window.addEventListener("popstate", pop);
    window.addEventListener("pageshow", shown);
    return () => {
      media.removeEventListener("change", sync);
      window.removeEventListener("popstate", pop);
      window.removeEventListener("pageshow", shown);
    };
  }, []);
  useEffect(() => {
    if (view === null || !restoreRef.current) return;
    const saved = restoreRef.current;
    restoreRef.current = null;
    let live = true;
    document.fonts.ready.then(() => {
      if (!live) return;
      for (const [category, left] of Object.entries(saved.shelves ?? {})) {
        const shelf = rootRef.current?.querySelector<HTMLElement>(`.shelf-section[data-category="${CSS.escape(category)}"] .shelf`);
        if (shelf) shelf.scrollLeft = left;
      }
      window.scrollTo(0, saved.scrollY);
      rootRef.current?.querySelector<HTMLElement>(`[data-slug="${CSS.escape(saved.slug)}"]`)?.focus({ preventScroll: true });
    });
    return () => { live = false; };
  }, [view]);
  const chooseView = (v: "shelf" | "grid") => {
    preferredView.current = v;
    setView(v);
    document.documentElement.dataset.catalogView = v;
    try { sessionStorage.setItem("view", v); } catch {}
  };
  const openMobile = (book: BookMeta, trigger: HTMLElement, origin: HTMLElement) => {
    if (!matchMedia(PHONE).matches || selectionRef.current) return;
    const scrollY = window.scrollY;
    const returnUrl = location.pathname + location.search + location.hash;
    const selection = { book, originSlug: book.slug, trigger, origin, rect: origin.getBoundingClientRect(), scrollY, returnUrl };
    const shelves = Object.fromEntries([...rootRef.current!.querySelectorAll<HTMLElement>(".shelf-section")]
      .map((section) => [section.dataset.category, section.querySelector(".shelf")?.scrollLeft ?? 0]));
    history.replaceState({ ...history.state, catalogReturn: { query, category: activeCategory, notesOnly, scrollY, slug: book.slug, shelves } }, "");
    history.pushState({ mobileReader: { slug: book.slug, returnUrl } }, "", bookHref(base, book.slug));
    selectionRef.current = selection;
    setSelected(selection);
  };
  // Reading on replaces the book entry, so one Back still returns to the catalogue and the book first opened.
  const goNext = (next: BookMeta) => {
    const current = selectionRef.current;
    if (!current) return;
    history.replaceState({ mobileReader: { slug: next.slug, returnUrl: current.returnUrl } }, "", bookHref(base, next.slug));
    const selection = { ...current, book: next };
    selectionRef.current = selection;
    setSelected(selection);
  };
  const closed = () => {
    const previous = selectionRef.current;
    selectionRef.current = null;
    clearReturn();
    setSelected(null);
    requestAnimationFrame(() => {
      if (selectionRef.current || !previous) return;
      window.scrollTo(0, previous.scrollY);
      (previous.trigger.isConnected && previous.trigger.getClientRects().length ? previous.trigger : searchRef.current)?.focus({ preventScroll: true });
    });
  };
  const viewButtons = (
    <span className="view-toggle" role="group" aria-label="檢視方式">
      <button type="button" className={"chip " + (view === "shelf" ? "on" : "")} aria-pressed={view === "shelf"} onClick={() => chooseView("shelf")}>書架</button>
      <button type="button" className={"chip " + (view === "grid" ? "on" : "")} aria-pressed={view === "grid"} onClick={() => chooseView("grid")}>列表</button>
    </span>
  );

  const q = query.trim().toLowerCase();
  const hasQuery = q.length > 0;

  const noteTotal = useMemo(() => books.filter((b) => b.hasNote).length, [books]);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of cats) m[c.key] = books.filter((b) => b.cat === c.key).length;
    return m;
  }, [books, cats]);

  const sections = useMemo(() => {
    const qRank = q ? queryToRank(q) : null;
    return cats
      .filter((c) => activeCategory === "all" || activeCategory === c.key)
      .map((c) => {
        let bs = books.filter((b) => b.cat === c.key);
        if (q)
          bs = bs.filter(
            (b) =>
              (b.zh + " " + b.en + " " + b.author).toLowerCase().includes(q) ||
              (qRank !== null && b.rank === qRank),
          );
        if (notesOnly) bs = bs.filter((b) => b.hasNote);
        return {
          ...c,
          books: bs,
          countLabel: bs.length + " 本",
        };
      })
      .filter((s) => s.books.length > 0);
  }, [books, cats, activeCategory, q, notesOnly]);

  const total = sections.reduce((a, s) => a + s.books.length, 0);

  // Same order the reader sees on screen in the current view.
  const nextNote = (book: BookMeta) => {
    const order = sections.flatMap((sec) => (view === "shelf" ? byHeight(sec.books) : phoneOrder(sec.books)));
    const at = order.findIndex((b) => b.slug === book.slug);
    return [...order.slice(at + 1), ...order.slice(0, at)].find((b) => b.hasNote) ?? null;
  };
  const hasResults = sections.length > 0;

  // reveal-on-scroll + cover clip-path + parallax (ported from the prototype,
  // minus the wheel scroll-hijack). Re-armed whenever the visible set changes.
  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = rootRef.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (reduce || matchMedia(PHONE).matches) {
      items.forEach((el) => {
        el.style.opacity = "";
        el.style.transform = "";
        const c = el.querySelector<HTMLElement>(".cover");
        if (c) c.style.clipPath = "";
      });
      return;
    }

    const hide = (el: HTMLElement) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(26px)";
      const c = el.querySelector<HTMLElement>(".cover");
      if (c) c.style.clipPath = "inset(0 0 100% 0)";
    };
    type RV = HTMLElement & { _rv?: number; _t0?: number; _c?: HTMLElement | null; _ci?: HTMLElement | null };
    const els = items as RV[];
    els.forEach((el) => {
      el._rv = 0;
      hide(el);
    });

    const DUR = 700,
      CLIP = 860,
      ease = (t: number) => 1 - Math.pow(1 - t, 3);
    let raf = 0;
    const tick = (ts: number) => {
      const h = window.innerHeight || 800;
      let nc = 0;
      for (const el of els) {
        const r = el.getBoundingClientRect();
        if (el._rv === 0 && r.top < h * 0.97) {
          el._rv = 1;
          el._t0 = ts + (nc % 6) * 70;
          nc++;
        }
        if (el._rv === 1) {
          const p = Math.min(1, Math.max(0, (ts - (el._t0 ?? ts)) / DUR));
          const e = ease(p);
          el.style.opacity = e.toFixed(3);
          el.style.transform = "translateY(" + ((1 - e) * 26).toFixed(1) + "px)";
          const c = el._c ?? (el._c = el.querySelector<HTMLElement>(".cover"));
          if (c) {
            const cp = Math.min(1, Math.max(0, (ts - (el._t0 ?? ts)) / CLIP));
            c.style.clipPath = "inset(0 0 " + ((1 - ease(cp)) * 100).toFixed(2) + "% 0)";
          }
          if (p >= 1 && (!c || ts - (el._t0 ?? ts) >= CLIP)) {
            el._rv = 2;
            el.style.opacity = "";
            el.style.transform = "";
            if (c) c.style.clipPath = "";
          }
        }
        const inner = el._ci ?? (el._ci = el.querySelector<HTMLElement>(".cover-inner"));
        if (inner && r.bottom > -160 && r.top < h + 160) {
          const center = r.top + r.height / 2;
          const pr = (center - h / 2) / h;
          inner.style.transform = "translateY(" + (pr * -18).toFixed(1) + "px)";
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [sections, phone]);

  const renderGrid = (mobile: boolean) => sections.map((sec) => (
    <section key={sec.key} className={"grid-section cat-" + sec.key} style={{ marginBottom: 72 }}>
      <div className="grid-section-head" data-reveal="1" style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 18, flexWrap: "wrap", borderBottom: "1px solid #d6cbb8", paddingBottom: 14, marginBottom: 34 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
          <h2 style={{ fontWeight: 600, fontSize: "clamp(22px,3vw,30px)", color: "var(--ink)", margin: 0, letterSpacing: ".02em" }}>{sec.zh}</h2>
          <span style={{ fontFamily: "var(--serif-en)", fontStyle: "italic", fontSize: 18, color: "var(--accent-ink)" }}>{sec.en}</span>
        </div>
        <span style={{ fontFamily: "var(--serif-en)", fontStyle: "italic", fontSize: 15, color: "#6f675b", letterSpacing: ".06em" }}>{sec.countLabel}</span>
      </div>
      <div className="cover-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(var(--cardmin),1fr))", gap: "38px 28px" }}>
        {(mobile ? phoneOrder(sec.books) : sec.books).map((book) => (
          <a key={book.slug} href={bookHref(base, book.slug)} className="book-card" data-slug={book.slug} data-note={book.hasNote || undefined} data-out={mobile && selected?.originSlug === book.slug || undefined} data-reveal="1"
            onClick={(e) => {
              if (!mobile || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
              e.preventDefault();
              openMobile(book, e.currentTarget, e.currentTarget.querySelector<HTMLElement>(".cover")!);
            }} style={{ display: "flex", flexDirection: "column", gap: 15, color: "inherit", textDecoration: "none" }}>
            <div className="cover" style={{ position: "relative", aspectRatio: "2/3", border: "1px solid rgba(44,38,32,.12)", overflow: "hidden" }}>
              {book.cover ? (
                <img src={book.cover} alt={book.dCover} loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div className="cover-inner" style={{ position: "absolute", left: 0, right: 0, top: "-9%", bottom: "-9%", background: "var(--wash)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "24px 18px", textAlign: "center" }}>
                  <div style={{ position: "relative", fontFamily: "var(--serif-tc)", fontWeight: 600, fontSize: 18, lineHeight: 1.42, color: "var(--ink)" }}>{book.dCover}</div>
                </div>
              )}
              <div style={{ position: "absolute", inset: 9, border: "1px solid rgba(44,38,32,.13)", pointerEvents: "none", zIndex: 2 }} />
            </div>
            <div className="card-meta" style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {mobile && <div className="card-title">{book.dCover}{book.hasNote && <span className="ribbon-mark" role="img" aria-label="有讀書心得" />}</div>}
              <div style={{ fontFamily: "var(--serif-en)", fontStyle: "italic", fontSize: 15, color: "#6f675b", lineHeight: 1.35 }}>{book.dCaption}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <span style={{ fontSize: 12.5, color: "#6f675b", letterSpacing: ".02em" }}>
                  {book.hasNote && <span className="ribbon-mark" role="img" aria-label="有讀書心得" />}
                  {book.author}
                </span>
                <span style={{ fontFamily: "var(--serif-en)", fontSize: 14, color: "var(--accent-ink)", letterSpacing: ".04em" }}>{book.tagStr}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  ));

  return (
    <div
      id="hundred-root"
      ref={rootRef}
      className="density-roomy"
      style={{ fontFamily: "var(--serif-tc)", background: "var(--paper)", color: "var(--ink)", minHeight: "100vh" }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 60,
          background: "rgba(243,237,225,.86)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderBottom: "1px solid #e1d8c7",
        }}
      >
        <div className="masthead">
          <a href={base} style={{ display: "flex", flexDirection: "column", gap: 1, flex: "0 0 auto", textDecoration: "none", color: "inherit" }}>
            <div style={{ fontWeight: 700, fontSize: 21, letterSpacing: ".14em", color: "var(--ink)" }}>百冊</div>
            <div className="brand-subtitle" style={{ fontFamily: "var(--serif-en)", fontStyle: "italic", fontSize: 11.5, letterSpacing: ".2em", color: "#6f675b" }}>ONE HUNDRED · 選書</div>
          </a>
          <div className="desktop-view-toggle">{viewButtons}</div>
          <div className="search" style={{ display: "flex", alignItems: "center", gap: 10, flex: "0 1 340px", borderBottom: "1px solid #c9bda6", paddingBottom: 5 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#8a8070" strokeWidth="1.3">
              <circle cx="6" cy="6" r="4.2" />
              <line x1="9.4" y1="9.4" x2="12.6" y2="12.6" strokeLinecap="round" />
            </svg>
            <input
              ref={searchRef}
              aria-label="搜尋書籍"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜尋書名、作者或編號…"
              style={{ border: "none", background: "transparent", outline: "none", fontFamily: "var(--serif-tc)", fontSize: 14, color: "var(--ink)", width: "100%" }}
            />
          </div>
        </div>
        <div className="filters">
          <div className="chips" role="group" aria-label="篩選">
            <button
              type="button"
              className={"chip chip-notes " + (notesOnly ? "on" : "")}
              aria-pressed={notesOnly}
              title={notesOnly ? "顯示全部書籍" : "只看有讀書心得的書"}
              onClick={() => setNotesOnly((v) => !v)}
            >
              <span className="ribbon-mark" aria-hidden="true" />
              <span>讀書筆記</span>
              <span className="ct">{noteTotal}</span>
            </button>
            <span className="chips-rule" aria-hidden="true" />
            <button className={"chip " + (activeCategory === "all" ? "on" : "")} aria-pressed={activeCategory === "all"} onClick={() => setActiveCategory("all")}>
              <span>全部</span>
              <span className="ct">{books.length}</span>
            </button>
            {cats.map((c) => (
              <button key={c.key} className={"chip " + (activeCategory === c.key ? "on" : "")} aria-pressed={activeCategory === c.key} onClick={() => setActiveCategory(c.key)}>
                <span>{c.zh}</span>
                <span className="ct">{counts[c.key]}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="mobile-catalog-tools"><h1>我的書目 <span>{total} 本</span></h1>{viewButtons}</div>

      <section className="hero">
        <h1 data-reveal="1">
          影響一個世代的<br />一百本書。
        </h1>
        <div className="hero-en" data-reveal="1">
          One hundred books that shape the way a generation thinks.
        </div>
        <p data-reveal="1">
          從心理學、商業、投資到腦神經科學——這是我的選書清單，收藏那些真正改變我們思考方式的好書。每本書的背後，連結著我自己的讀書心得；封面與內容，將陸續補上。
        </p>
      </section>

      <main className="catalog">
        {hasQuery && (
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 36, flexWrap: "wrap", borderBottom: "1px solid #e1d8c7", paddingBottom: 18 }}>
            <span style={{ fontSize: 14, color: "#5c544a" }}>
              找到 <strong style={{ fontWeight: 600, color: "var(--ink)" }}>{total}</strong> 本符合「{query}」的書
            </span>
            <button className="clear-search" onClick={() => { setQuery(""); searchRef.current?.focus(); }} style={{ fontFamily: "var(--serif-tc)", fontSize: 13, color: "#8f5434", background: "transparent", border: "none", borderBottom: "1px solid #d8b6a6", cursor: "pointer", padding: "0 0 1px" }}>
              清除搜尋
            </button>
          </div>
        )}

        {hasResults ? (
          <>
            {(view === null || view === "shelf") && <div className="catalog-shelf"><ImmersiveShelf sections={sections} base={base} fit={notesOnly} onMobileSelect={openMobile} mobileSlug={selected?.originSlug} /></div>}
            {(view === null || view === "grid") && <div className="catalog-grid">
              {phone !== false && <div className="catalog-mobile">{renderGrid(true)}</div>}
              {phone === false && <div className="catalog-desktop">{renderGrid(false)}</div>}
            </div>}
          </>

        ) : (
          <div className="empty" role="status">
            <h2>{hasQuery ? `找不到符合「${query}」的書` : "這個分類還沒有讀書心得"}</h2>
            <p>{hasQuery ? "試試書名的一部分、作者英文名，或編號（例如 109）。" : "其他分類裡有已完成的心得。"}</p>
            <div className="empty-actions">
              {hasQuery && (
                <button type="button" className="chip" onClick={() => (setQuery(""), searchRef.current?.focus())}>
                  清除搜尋
                </button>
              )}
              {activeCategory !== "all" && (
                <button type="button" className="chip" onClick={() => (setActiveCategory("all"), searchRef.current?.focus())}>
                  看全部分類
                </button>
              )}
              {notesOnly && (
                <button type="button" className="chip" onClick={() => (setNotesOnly(false), searchRef.current?.focus())}>
                  顯示沒有心得的書
                </button>
              )}
            </div>
          </div>
        )}
      </main>
      {selected && createPortal(<MobileReader selection={selected} base={base} next={nextNote(selected.book)} onNext={goNext} onClosed={closed} />, document.body)}

    </div>
  );
}
