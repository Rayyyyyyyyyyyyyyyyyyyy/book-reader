import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { BookMeta } from "../../lib/books";
import { coverTitle } from "../../data/title-breaks";
import { spineColors, spineLook } from "../../lib/spine";
import { SpineFace } from "./BookSpine";
import "../../styles/stage.css";

gsap.registerPlugin(useGSAP);

type Props = {
  book: BookMeta;
  origin: HTMLElement; // the spine face on the shelf
  base: string;
  next: BookMeta | null; // the next book with a note, offered at the end
  onClosed: (next?: BookMeta) => void; // with `next` when the reader asked to go on to it
};

const UI_SPACE = 76; // room kept under the book for the control bar

// Book size for this viewport. Pivot (transform-origin) is the spine plane, so
// x/y below place the spine; at rotateY(90°) the spine face lies flat on screen
// and, scaled by s, exactly covers the shelf spine. Phones show a single page:
// the book fills the width and the opened cover swings off-screen to the left.
function stageSize() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const single = vw < 640;
  const H = Math.min((vh - UI_SPACE) * 0.78, 520, single ? vw * 0.84 * 1.5 : (vw * 0.92) / (4 / 3));
  return { vw, vh, W: (H * 2) / 3, H, single };
}

function shelfPose(origin: HTMLElement, H: number) {
  const r = origin.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 - H / 2, s: r.height / H, rw: r.width, rh: r.height };
}

// One stroke icon set for the stage controls (drawn, not font glyphs).
const Icon = ({ d }: { d: string }) => (
  <svg className="stage-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

export default function BookStage({ book, origin, base, next, onClosed }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const phase = useRef<"opening" | "opened" | "closing">("opening");
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const leafRefs = useRef<HTMLDivElement[]>([]);
  const spreadRef = useRef(0); // sheets turned; the state copy only drives the label
  const [spread, setSpread] = useState(0);
  const turning = useRef(false);
  const swipe = useRef<{ x: number; moved: boolean } | null>(null);
  // The summary and note are fetched from the book's own page, then cut into pages by CSS columns (see .note-cols).
  const [note, setNote] = useState<{ html: string; pages: number } | "failed" | null>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  // Geometry is fixed for the life of the stage; only the on-screen position follows resizes.
  const [geo] = useState(() => {
    const size = stageSize();
    const start = shelfPose(origin, size.H);
    return { ...size, start, T: start.rw / start.s };
  });

  const center = () => {
    const { vw, vh } = stageSize();
    const xc = vw / 2 - geo.W / 2;
    return { xc, xo: geo.single ? xc : vw / 2, y: (vh - UI_SPACE) / 2 - geo.H / 2 };
  };

  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  const { contextSafe } = useGSAP(
    () => {
      const el = bookRef.current!;
      const { start } = geo;
      const c = center();
      gsap.set(el, { "--x": start.x, "--y": start.y, "--z": 0, "--s": start.s, "--ry": 90, "--open": 0 });
      const tl = gsap.timeline({
        onComplete: () => {
          phase.current = "opened";
          gsap.set(el, { "--x": center().xo, "--y": center().y }); // the viewport may have changed mid-flight
        },
      });
      tl.to(".stage-backdrop", { opacity: 1, duration: 0.5, ease: "power1.out" }, 0)
        // pull the book off the shelf toward the viewer first…
        .to(el, { "--z": 140, "--y": start.y - 12, duration: 0.26, ease: "power2.out" }, 0)
        // …then carry it to the stage, turning the cover to face front
        .to(el, { "--x": c.xc, "--y": c.y, "--z": 0, "--s": 1, "--ry": 0, duration: 0.74, ease: "power3.inOut" }, 0.2)
        // open the cover on its spine hinge while sliding the spread to centre
        .to(el, { "--x": c.xo, "--open": -180, duration: 0.66, ease: "power2.inOut" }, ">+0.06")
        .to(".stage-ui", { opacity: 1, y: 0, duration: 0.3, ease: "power1.out" }, "-=0.25");
      timeline.current = tl;
      if (reduce()) tl.progress(1);
    },
    { scope: rootRef },
  );

  const close = contextSafe((then?: BookMeta) => {
    if (phase.current === "closing") return;
    phase.current = "closing";
    // drop the history entry pushed on open, unless Back closed us or the next book takes it over
    if (!then && !popped.current && history.state?.bookStage === book.slug) history.back();
    timeline.current?.kill();
    gsap.killTweensOf(leafRefs.current);
    const el = bookRef.current!;
    const c = center();
    const openDeg = Math.abs(parseFloat(el.style.getPropertyValue("--open")) || 0);
    // turned sheets fall back first (last turned first), then the cover closes over them
    const turned = leafRefs.current.filter((l) => parseFloat(l.style.getPropertyValue("--f")) > 0).reverse();
    const tl = gsap.timeline({ onComplete: () => onClosed(then) });
    tl.to(".stage-ui", { opacity: 0, duration: 0.15 }, 0);
    if (turned.length) tl.to(turned, { "--f": 0, duration: 0.4, stagger: Math.min(0.1, 0.4 / turned.length), ease: "power2.inOut" }, 0);
    tl.to(el, { "--open": 0, "--x": c.xc, duration: 0.05 + (0.55 * openDeg) / 180, ease: "power2.inOut" }, turned.length ? ">-0.1" : 0);
    if (origin.isConnected) {
      // re-measure: the shelf may have moved since we opened (resize)
      const back = shelfPose(origin, geo.H);
      tl.to(el, { "--x": back.x, "--y": back.y - 12, "--z": 140, "--s": back.s, "--ry": 90, duration: 0.72, ease: "power3.inOut" })
        .to(el, { "--y": back.y, "--z": 0, duration: 0.22, ease: "power2.in" })
        .to(".stage-backdrop", { opacity: 0, duration: 0.5 }, "-=0.6");
    } else {
      // shelf spine is gone (filtered out): sink the book away instead of flying to nowhere
      tl.to(el, { "--s": 0.6, "--z": -200, opacity: 0, duration: 0.45, ease: "power2.in" }).to(
        ".stage-backdrop",
        { opacity: 0, duration: 0.35 },
        "<",
      );
    }
    if (reduce()) tl.progress(1);
  });

  // Turn one sheet forward (+1) or back (-1); ignored mid-animation so a flip always completes.
  const turn = contextSafe((dir: 1 | -1) => {
    const target = spreadRef.current + dir;
    if (phase.current !== "opened" || turning.current || target < 0) return;
    if (target > leafRefs.current.length) return void (next && close(next)); // past the last page: on to the next note
    turning.current = true;
    gsap.to(leafRefs.current[dir > 0 ? spreadRef.current : target], {
      "--f": dir > 0 ? 1 : 0,
      duration: reduce() ? 0 : 0.7,
      ease: "power2.inOut",
      onComplete: () => {
        turning.current = false;
        spreadRef.current = target;
        setSpread(target);
      },
    });
  });

  // Horizontal swipe on the backdrop turns pages; a swipe must not also count as a click that closes.
  const onPointerDown = (e: React.PointerEvent) => void (swipe.current = { x: e.clientX, moved: false });
  const onPointerUp = (e: React.PointerEvent) => {
    const dx = e.clientX - (swipe.current?.x ?? e.clientX);
    if (Math.abs(dx) < 40) return;
    swipe.current = { x: e.clientX, moved: true };
    turn(dx < 0 ? 1 : -1);
  };
  // Where a pointer is over the open book: 1 = forward, -1 = back, 0 = off the book (or not open yet).
  // Desktop: right page forward, left page back. Phones show one page: its left third goes back.
  const pageAt = (e: React.MouseEvent) => {
    const r = bookRef.current!.getBoundingClientRect(); // the right-hand page; the open cover mirrors it on the left
    const onBook = e.clientY >= r.top && e.clientY <= r.bottom && e.clientX >= r.left - r.width && e.clientX <= r.right;
    const split = geo.single ? r.left + r.width / 3 : r.left;
    return phase.current === "opened" && onBook ? (e.clientX >= split ? 1 : -1) : 0;
  };
  // A click on the book turns the page; outside it closes, except on phones, where a stray tap
  // mid-read would lose the page (× , Escape and Back still close).
  const onBackdropClick = (e: React.MouseEvent) => {
    if (swipe.current?.moved) return void (swipe.current = null);
    const side = pageAt(e);
    if (side) return turn(side);
    if (!geo.single) close();
  };
  // The cursor shows which way a click would turn, or that the page cannot turn further.
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const side = pageAt(e);
    const target = spreadRef.current + side;
    const canTurn = side !== 0 && target >= 0 && (target <= leafRefs.current.length || !!next);
    e.currentTarget.dataset.turn = canTurn ? (side > 0 ? "next" : "prev") : side ? "none" : "";
  };

  // Escape closes, arrows turn pages; resize keeps the opened book centred.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        // keep focus inside the dialog: wrap between its first and last controls
        const items = [...rootRef.current!.querySelectorAll<HTMLElement>(".stage-ui button:not(:disabled), .stage-ui a[href]")];
        const at = items.indexOf(document.activeElement as HTMLElement);
        const to = e.shiftKey ? (at <= 0 ? items.length - 1 : at - 1) : at === items.length - 1 || at < 0 ? 0 : at + 1;
        e.preventDefault();
        items[to]?.focus();
      } else if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") turn(1);
      else if (e.key === "ArrowLeft") turn(-1);
    };
    const onResize = () => {
      if (phase.current !== "opened") return;
      const c = center();
      gsap.set(bookRef.current, { "--x": c.xo, "--y": c.y });
    };
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [close, turn]);

  // Opening adds a history entry (same URL), so the browser's Back closes the book instead of leaving the site.
  const popped = useRef(false);
  useEffect(() => {
    // going straight on to the next book reuses the entry, so one Back always returns to the shelf
    if (history.state?.bookStage) history.replaceState({ bookStage: book.slug }, "");
    else history.pushState({ bookStage: book.slug }, "");
    const onPop = () => {
      popped.current = true;
      close();
    };
    // bfcache brings the page back with the book still out: Back from the full page must land on the shelf
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) close();
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("pageshow", onShow);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("pageshow", onShow);
    };
  }, []);

  // Modal: everything else on the page is inert while the book is out.
  useEffect(() => {
    const others = Array.from(document.body.children).filter(
      (n): n is HTMLElement => n instanceof HTMLElement && n !== rootRef.current && !n.inert,
    );
    others.forEach((n) => (n.inert = true));
    closeRef.current?.focus({ preventScroll: true });
    return () => others.forEach((n) => (n.inert = false));
  }, []);

  const href = `${base}book/${book.slug}`;

  useEffect(() => {
    if (!book.hasNote && !book.hasSummary) return;
    const ctl = new AbortController();
    fetch(href, { signal: ctl.signal })
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((text) => {
        // our own built page (same origin), so its HTML is trusted
        const doc = new DOMParser().parseFromString(text, "text/html");
        const summary = doc.querySelector("section.summary");
        const el = doc.querySelector("#note.note");
        if (book.hasNote ? !el : !summary) throw new Error("content missing");
        // the label only tells the note apart from a summary before it
        if (!summary) el!.querySelector(".note-label")?.remove();
        setNote({ html: (summary?.outerHTML ?? "") + (el?.innerHTML ?? ""), pages: 0 });
      })
      .catch((e) => e.name !== "AbortError" && setNote("failed"));
    return () => ctl.abort();
  }, []);

  // Count pages once fonts are in: the columns overflow sideways, one column per page.
  useEffect(() => {
    if (typeof note !== "object" || !note || note.pages) return;
    let live = true;
    document.fonts.ready.then(() => {
      const c = measureRef.current;
      if (!live || !c) return;
      const gap = parseFloat(getComputedStyle(c).columnGap);
      setNote({ ...note, pages: Math.max(1, Math.round((c.scrollWidth + gap) / (c.clientWidth + gap))) });
    });
    return () => void (live = false);
  }, [note]);

  const html = typeof note === "object" && note ? note.html : "";
  const pages = typeof note === "object" && note ? note.pages : 0;
  // i < 0 is the hidden copy that gets measured
  const notePage = (i: number) => (
    <>
      <div className="pg-meta">
        <span>{book.numStr}</span>
        <span>{book.dCover}</span>
      </div>
      <div className="note-flow" aria-hidden="true">
        <div
          className="note-cols"
          ref={i < 0 ? measureRef : undefined}
          style={{ "--pi": Math.max(i, 0) } as React.CSSProperties}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
      {/* the measured copy keeps a line here too (nbsp: plain whitespace has no height), or it counts on taller columns than the real pages */}
      <div className="pg-folio">{i < 0 ? "\u00a0" : i + 1}</div>
    </>
  );
  const notes = Array.from({ length: pages }, (_, i) => notePage(i));
  const titlePage = (
    <>
      <div className="pg-meta">
        <span>{book.numStr}</span>
        <span>{book.catZh}</span>
      </div>
      <h2 className="pg-title">{coverTitle(book)}</h2>
      <div className="pg-caption">{book.dCaption}</div>
      <div className="pg-author">{book.author}</div>
      <p className="pg-desc">{book.desc}</p>
      <div className="pg-foot">{book.hasSummary ? (book.hasNote ? "翻頁閱讀書摘與心得 →" : "翻頁閱讀書本摘要 →") : book.hasNote ? "翻頁閱讀讀書心得 →" : "心得整理中"}</div>
    </>
  );
  // Until (or unless) the note fills it, the page opposite the title holds the catalogue card.
  const catalogCard = (
    <dl className="pg-card">
      <dt>編號</dt>
      <dd>{book.numStr}</dd>
      <dt>分類</dt>
      <dd>{book.catZh}</dd>
      <dt>作者</dt>
      <dd>{book.author}</dd>
      {book.zh && book.en && (
        <>
          <dt>原文書名</dt>
          <dd>{book.en}</dd>
        </>
      )}
    </dl>
  );
  // Turnable sheets, top first. Desktop reads spreads, so the note starts on the back of the
  // title page (left) and continues front (right) / back (left); phones only ever see fronts.
  const sheets: React.ReactNode[][] = geo.single
    ? [[titlePage, null], ...notes.map((p) => [p, null])]
    : [
        [titlePage, notes[0] ?? catalogCard],
        ...Array.from({ length: Math.ceil((notes.length - 1) / 2) }, (_, k) => [notes[2 * k + 1], notes[2 * k + 2] ?? null]),
      ];

  // Where the reader is, in pages: the title page, note pages a–b of N, or the end.
  const atEnd = spread === sheets.length;
  const first = geo.single ? spread : 2 * spread - 1;
  const last = Math.min(geo.single ? spread : 2 * spread, pages);
  const ending = book.hasNote ? { short: "完", long: "心得結束" } : { short: "整理中", long: "心得整理中" };
  const where =
    spread === 0
      ? { short: "書名頁", long: "書名頁" }
      : first <= last
        ? // an odd page count ends with the last page on the left, opposite 完
          {
            short: `${first === last ? first : `${first}–${last}`} / ${pages}${atEnd ? ` · ${ending.short}` : ""}`,
            long: `第 ${first === last ? first : `${first} 到 ${last}`} 頁，共 ${pages} 頁${atEnd ? `，${ending.long}` : ""}`,
          }
        : pages
          ? ending
          : book.hasNote
            ? { short: note === "failed" ? "載入失敗" : "載入中", long: note === "failed" ? "心得載入失敗" : "心得載入中" }
            : { short: "整理中", long: "心得整理中" };

  const { W, H, T, start } = geo;

  return (
    <div ref={rootRef} className="stage" role="dialog" aria-modal="true" aria-label={`${book.dCover} 預覽`}>
      <div className="stage-backdrop" onClick={onBackdropClick} onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerMove={onPointerMove} />
      <div className="stage-scene">
        <div
          ref={bookRef}
          className={`book3d cat-${book.cat}`}
          style={{ "--w": `${W}px`, "--h": `${H}px`, "--t": `${T}px`, "--n": sheets.length } as React.CSSProperties}
        >
          <div className="b-back" />
          <div className="b-edge b-edge-fore" />
          <div className="b-edge b-edge-top" />
          <div className="b-edge b-edge-bottom" />
          <div className="b-spine">
            <SpineFace
              book={book}
              style={{ width: start.rw, height: start.rh, transform: `scale(${1 / start.s})`, transformOrigin: "0 0" }}
            />
          </div>

          {/* last right-hand page: the end of the note, or where it would be */}
          <div className="b-page b-base" aria-hidden={spread !== sheets.length || undefined}>
            <div className="pg-meta">
              <span>{book.numStr}</span>
              <span>讀書心得</span>
            </div>
            {pages && book.hasNote ? (
              <div className="pg-end">完</div>
            ) : (
              <>
                <h3 className="pg-head">{book.hasNote ? "我的讀書心得" : "心得整理中"}</h3>
                <p className="pg-desc">
                  {!book.hasNote
                    ? note === "failed"
                      ? "書本摘要載入失敗，點下方按鈕到書頁閱讀。"
                      : "書頁已建立，心得完成後會發布在那裡。"
                    : note === "failed"
                      ? "心得載入失敗，點下方按鈕到書頁閱讀全文。"
                      : "心得載入中…"}
                </p>
              </>
            )}
            {next ? (
              <div className="pg-next">
                <span>下一本有心得的書</span>
                <strong>{next.dCover}</strong>
              </div>
            ) : (
              <div className="pg-foot">百冊 · One Hundred</div>
            )}
          </div>
          {html && !pages && (
            <div className="b-page b-base note-measure" aria-hidden="true">
              {notePage(-1)}
            </div>
          )}

          {sheets.map(([front, back], i) => (
            <div
              key={i}
              className="b-leaf"
              style={{ "--i": i } as React.CSSProperties}
              ref={(n) => void (n && (leafRefs.current[i] = n))}
            >
              <div className="b-page leaf-face" aria-hidden={i !== spread || undefined}>
                {front}
              </div>
              <div className="b-page leaf-face leaf-back" aria-hidden={geo.single || i + 1 !== spread || undefined}>
                {back}
              </div>
            </div>
          ))}

          <div className="b-front">
            {/* Typeset cover in the spine's colour: the source covers are publisher 3D mockup photos, so they go inside. */}
            <div className={`face face-out tone-${spineLook(book).tone}`} style={spineColors(book.coverColor)} aria-hidden="true">
              <div className="tc-frame">
                <span className="tc-num">{book.numStr}</span>
                <span className="tc-title">{coverTitle(book)}</span>
                {book.zh && <span className="tc-en">{book.en}</span>}
                <span className="tc-author">{book.author}</span>
                <span className="tc-brand">百冊 · One Hundred</span>
              </div>
            </div>
            <div className="face face-in" aria-hidden="true">
              <span className="ex-small">EX LIBRIS · 百冊</span>
              {book.cover ? (
                <img className="in-photo" src={book.cover} alt="" />
              ) : (
                <span className="ex-name">{book.dCover}</span>
              )}
              <span className="ex-small">{book.numStr}</span>
            </div>
          </div>
        </div>
      </div>

      {html && <div className="sr-only" dangerouslySetInnerHTML={{ __html: html }} />}
      <div className="stage-ui">
        <button ref={closeRef} type="button" className="stage-btn" onClick={() => close()} aria-label="收回書架">
          <span className="stage-lbl">收回書架 </span>
          <Icon d="M4 4l8 8M12 4l-8 8" />
        </button>
        <button type="button" className="stage-btn stage-arrow" onClick={() => turn(-1)} disabled={spread === 0} aria-label="上一頁">
          <Icon d="M10 3.5L5.5 8 10 12.5" />
        </button>
        <span className="stage-page" aria-hidden="true" data-spread={`${spread + 1}/${sheets.length + 1}`}>
          {where.short}
        </span>
        <span className="sr-only" aria-live="polite">
          {where.long}
        </span>
        {atEnd && next ? (
          <button type="button" className="stage-btn stage-next" onClick={() => turn(1)} aria-label={`下一本有心得的書：${next.dCover}`}>
            下一本 <Icon d="M6 3.5L10.5 8 6 12.5" />
          </button>
        ) : (
          <button type="button" className="stage-btn stage-arrow" onClick={() => turn(1)} disabled={atEnd} aria-label="下一頁">
            <Icon d="M6 3.5L10.5 8 6 12.5" />
          </button>
        )}
        <a className="stage-cta" href={href}>
          完整書頁 <Icon d="M3 8h10M9 4l4 4-4 4" />
        </a>
      </div>
    </div>
  );
}
