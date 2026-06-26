import { useEffect, useMemo, useRef, useState } from "react";
import type { BookMeta } from "../lib/books";

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

export default function BookGrid({ books, cats, base }: Props) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [notesOnly, setNotesOnly] = useState(false);
  const [selected, setSelected] = useState<BookMeta | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

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
          countLabel: bs.length + (c.key === "soul" ? " 篇筆記" : " 本"),
        };
      })
      .filter((s) => s.books.length > 0);
  }, [books, cats, activeCategory, q, notesOnly]);

  const total = sections.reduce((a, s) => a + s.books.length, 0);
  const hasResults = sections.length > 0;

  // Modal is an ephemeral quick-view (no history entry). The canonical,
  // shareable URL is the full /book/<slug> page that the modal links to —
  // so browser "back" from a book page returns cleanly to the catalog.
  const openBook = (b: BookMeta) => setSelected(b);
  const closeBook = () => setSelected(null);

  // Escape closes the modal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // reveal-on-scroll + cover clip-path + parallax (ported from the prototype,
  // minus the wheel scroll-hijack). Re-armed whenever the visible set changes.
  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = rootRef.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (reduce) {
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
  }, [sections]);

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
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "13px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
          <a href={base} style={{ display: "flex", flexDirection: "column", gap: 1, flex: "0 0 auto", textDecoration: "none", color: "inherit" }}>
            <div style={{ fontWeight: 700, fontSize: 21, letterSpacing: ".14em", color: "var(--ink)" }}>百冊</div>
            <div style={{ fontFamily: "var(--serif-en)", fontStyle: "italic", fontSize: 11.5, letterSpacing: ".2em", color: "#a59b89" }}>ONE HUNDRED · 選書</div>
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "0 1 340px", borderBottom: "1px solid #c9bda6", paddingBottom: 5 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#b3a892" strokeWidth="1.3">
              <circle cx="6" cy="6" r="4.2" />
              <line x1="9.4" y1="9.4" x2="12.6" y2="12.6" strokeLinecap="round" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜尋書名、作者或編號…"
              style={{ border: "none", background: "transparent", outline: "none", fontFamily: "var(--serif-tc)", fontSize: 14, color: "var(--ink)", width: "100%" }}
            />
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px 13px" }}>
          <div className="chips" style={{ display: "flex", gap: 9, overflowX: "auto", paddingBottom: 2 }}>
            <button className={"chip " + (activeCategory === "all" ? "on" : "")} onClick={() => setActiveCategory("all")}>
              <span>全部</span>
              <span className="ct">{books.length}</span>
            </button>
            {cats.map((c) => (
              <button key={c.key} className={"chip " + (activeCategory === c.key ? "on" : "")} onClick={() => setActiveCategory(c.key)}>
                <span>{c.zh}</span>
                <span className="ct">{counts[c.key]}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "88px 28px 64px" }}>
        <div data-reveal="1" style={{ fontFamily: "var(--serif-en)", fontStyle: "italic", letterSpacing: ".32em", fontSize: 13, color: "#a5623f", textTransform: "uppercase", marginBottom: 26 }}>
          A Reading List · 選書清單
        </div>
        <h1 data-reveal="1" style={{ fontWeight: 600, fontSize: "clamp(40px,7vw,82px)", lineHeight: 1.12, letterSpacing: ".01em", color: "var(--ink)", margin: "0 0 26px" }}>
          影響一個世代的<br />一百本書。
        </h1>
        <div data-reveal="1" style={{ fontFamily: "var(--serif-en)", fontStyle: "italic", fontSize: "clamp(18px,2.4vw,25px)", color: "#6f675b", marginBottom: 30 }}>
          One hundred books that shape the way a generation thinks.
        </div>
        <p data-reveal="1" style={{ maxWidth: 560, fontSize: 16, lineHeight: 1.95, color: "#5c544a", fontWeight: 300, margin: "0 0 38px" }}>
          從心理學、商業、投資到腦神經科學——這是我的選書清單，收藏那些真正改變我們思考方式的好書。每本書的背後，連結著我自己的讀書心得；封面與內容，將陸續補上。
        </p>
        <div data-reveal="1" style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", fontFamily: "var(--serif-en)", fontStyle: "italic", fontSize: 15, color: "#9a9183", letterSpacing: ".04em" }}>
          <button
            type="button"
            onClick={() => setNotesOnly((v) => !v)}
            title={notesOnly ? "顯示全部書籍" : "只看有讀書心得的書"}
            style={{
              font: "inherit",
              fontSize: 17,
              color: notesOnly ? "#a5623f" : "var(--ink)",
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              borderBottom: "1px solid",
              borderColor: notesOnly ? "#a5623f" : "transparent",
            }}
          >
            {noteTotal} 篇讀書筆記
          </button>
        </div>
      </section>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "8px 28px 110px" }}>
        {hasQuery && (
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 36, flexWrap: "wrap", borderBottom: "1px solid #e1d8c7", paddingBottom: 18 }}>
            <span style={{ fontSize: 14, color: "#5c544a" }}>
              找到 <strong style={{ fontWeight: 600, color: "var(--ink)" }}>{total}</strong> 本符合「{query}」的書
            </span>
            <button onClick={() => setQuery("")} style={{ fontFamily: "var(--serif-tc)", fontSize: 13, color: "#a5623f", background: "transparent", border: "none", borderBottom: "1px solid #d8b6a6", cursor: "pointer", padding: "0 0 1px" }}>
              清除搜尋
            </button>
          </div>
        )}

        {hasResults ? (
          sections.map((sec) => (
            <section key={sec.key} className={"cat-" + sec.key} style={{ marginBottom: 72 }}>
              <div data-reveal="1" style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 18, flexWrap: "wrap", borderBottom: "1px solid #d6cbb8", paddingBottom: 14, marginBottom: 34 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
                  <h2 style={{ fontWeight: 600, fontSize: "clamp(22px,3vw,30px)", color: "var(--ink)", margin: 0, letterSpacing: ".02em" }}>{sec.zh}</h2>
                  <span style={{ fontFamily: "var(--serif-en)", fontStyle: "italic", fontSize: 18, color: "var(--accent)" }}>{sec.en}</span>
                </div>
                <span style={{ fontFamily: "var(--serif-en)", fontStyle: "italic", fontSize: 15, color: "#9a9183", letterSpacing: ".06em" }}>{sec.countLabel}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(var(--cardmin),1fr))", gap: "38px 28px" }}>
                {sec.books.map((book) => (
                  <article key={book.slug} data-reveal="1" onClick={() => openBook(book)} style={{ display: "flex", flexDirection: "column", gap: 15, cursor: "pointer" }}>
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
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      <div style={{ fontFamily: "var(--serif-en)", fontStyle: "italic", fontSize: 15, color: "#6f675b", lineHeight: 1.35 }}>{book.dCaption}</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <span style={{ fontSize: 12, color: "#9a9183", letterSpacing: ".02em" }}>{book.author}</span>
                        <span style={{ fontFamily: "var(--serif-en)", fontSize: 14, color: "var(--accent)", letterSpacing: ".04em" }}>{book.tagStr}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))
        ) : (
          <div style={{ textAlign: "center", padding: "90px 20px" }}>
            <div style={{ fontFamily: "var(--serif-en)", fontStyle: "italic", fontSize: 30, color: "#bcb19c", marginBottom: 14 }}>Nothing here yet.</div>
            <div style={{ fontSize: 15, color: "#8a8175" }}>找不到符合「{query}」的書，試試其他關鍵字。</div>
          </div>
        )}
      </main>

      {selected && (
        <div onClick={closeBook} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(28,22,16,.52)", backdropFilter: "blur(5px)", WebkitBackdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div className={"cat-" + selected.cat} onClick={(e) => e.stopPropagation()} style={{ background: "#fbf7ee", maxWidth: 720, width: "100%", border: "1px solid #e3dacb", boxShadow: "0 40px 100px rgba(28,22,16,.35)", display: "flex", position: "relative", maxHeight: "90vh", overflow: "auto" }}>
            <button onClick={closeBook} aria-label="關閉" style={{ position: "absolute", top: 16, right: 16, zIndex: 2, width: 34, height: 34, borderRadius: "50%", border: "1px solid #e0d6c4", background: "#fbf7ee", color: "#6f675b", cursor: "pointer", fontSize: 17, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            <div style={{ flex: "0 0 210px", padding: "32px 26px", borderRight: "1px solid #ece3d2", display: "flex", alignItems: "center", justifyContent: "center", background: "#f6f0e4" }}>
              {selected.cover ? (
                <img src={selected.cover} alt={selected.dCover} style={{ width: "100%", aspectRatio: "2/3", objectFit: "cover", border: "1px solid rgba(44,38,32,.14)" }} />
              ) : (
                <div style={{ position: "relative", width: "100%", aspectRatio: "2/3", background: "var(--wash)", border: "1px solid rgba(44,38,32,.14)", display: "flex", alignItems: "center", justifyContent: "center", padding: "22px 16px", textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--serif-tc)", fontWeight: 600, fontSize: 19, lineHeight: 1.42, color: "var(--ink)" }}>{selected.dCover}</div>
                </div>
              )}
            </div>
            <div style={{ flex: 1, padding: "38px 36px 36px", minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                <span style={{ fontSize: 11, letterSpacing: ".14em", color: "var(--accent)", border: "1px solid var(--accent)", borderRadius: 999, padding: "4px 11px" }}>{selected.catZh}</span>
                <span style={{ fontFamily: "var(--serif-en)", fontSize: 15, color: "#a59b89", letterSpacing: ".05em" }}>{selected.numStr}</span>
              </div>
              <h2 style={{ fontFamily: "var(--serif-tc)", fontWeight: 600, fontSize: 28, lineHeight: 1.3, color: "var(--ink)", margin: "0 0 8px" }}>{selected.dCover}</h2>
              <div style={{ fontFamily: "var(--serif-en)", fontStyle: "italic", fontSize: 18, color: "#6f675b", marginBottom: 6 }}>{selected.dCaption}</div>
              <div style={{ fontSize: 13, color: "#9a9183", letterSpacing: ".03em", marginBottom: 24 }}>{selected.author}</div>
              <p style={{ fontSize: 15.5, lineHeight: 1.95, color: "#5c544a", fontWeight: 300, margin: "0 0 30px", borderTop: "1px solid #ece3d2", paddingTop: 24 }}>{selected.desc}</p>
              {selected.hasNote ? (
                <a href={bookHref(base, selected.slug)} style={{ display: "inline-flex", alignItems: "center", gap: 9, fontFamily: "var(--serif-tc)", fontSize: 14, color: "#f3ede1", background: "#2c2620", border: "none", padding: "12px 20px", cursor: "pointer", letterSpacing: ".04em", textDecoration: "none" }}>
                  閱讀我的讀書心得 <span style={{ fontFamily: "var(--serif-en)", fontSize: 16 }}>→</span>
                </a>
              ) : (
                <a href={bookHref(base, selected.slug)} style={{ display: "inline-flex", alignItems: "center", gap: 9, fontFamily: "var(--serif-tc)", fontSize: 14, color: "#6f675b", border: "1px solid #cdc2ad", padding: "12px 20px", letterSpacing: ".04em", textDecoration: "none" }}>
                  查看書籍頁 <span style={{ fontFamily: "var(--serif-en)", fontStyle: "italic", fontSize: 13 }}>整理中</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
