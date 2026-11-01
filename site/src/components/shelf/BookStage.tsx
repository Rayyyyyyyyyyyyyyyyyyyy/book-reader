import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { BookMeta } from "../../lib/books";
import { coverTitle } from "../../data/title-breaks";
import { spineColors, spineLook } from "../../lib/spine";
import { SpineFace } from "./BookSpine";

gsap.registerPlugin(useGSAP);

type Props = {
  book: BookMeta;
  origin: HTMLElement; // the spine face on the shelf
  base: string;
  onClosed: () => void;
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

export default function BookStage({ book, origin, base, onClosed }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const phase = useRef<"opening" | "opened" | "closing">("opening");
  const timeline = useRef<gsap.core.Timeline | null>(null);

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
      const tl = gsap.timeline({ onComplete: () => void (phase.current = "opened") });
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

  const close = contextSafe(() => {
    if (phase.current === "closing") return;
    phase.current = "closing";
    timeline.current?.kill();
    const el = bookRef.current!;
    const c = center();
    const openDeg = Math.abs(parseFloat(el.style.getPropertyValue("--open")) || 0);
    const tl = gsap.timeline({ onComplete: onClosed });
    tl.to(".stage-ui", { opacity: 0, duration: 0.15 }, 0).to(
      el,
      { "--open": 0, "--x": c.xc, duration: 0.05 + (0.55 * openDeg) / 180, ease: "power2.inOut" },
      0,
    );
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

  // Escape closes; resize keeps the opened book centred.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
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
  }, [close]);

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
  const { W, H, T, start } = geo;

  return (
    <div ref={rootRef} className="stage" role="dialog" aria-modal="true" aria-label={`${book.dCover} 預覽`}>
      <div className="stage-backdrop" onClick={close} />
      <div className="stage-scene">
        <div
          ref={bookRef}
          className={`book3d cat-${book.cat}`}
          style={{ "--w": `${W}px`, "--h": `${H}px`, "--t": `${T}px` } as React.CSSProperties}
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

          <div className="b-page b-page-right">
            <div className="pg-meta">
              <span>{book.numStr}</span>
              <span>{book.catZh}</span>
            </div>
            <h2 className="pg-title">{coverTitle(book)}</h2>
            <div className="pg-caption">{book.dCaption}</div>
            <div className="pg-author">{book.author}</div>
            <p className="pg-desc">{book.desc}</p>
            <div className="pg-note">{book.hasNote ? "已收錄讀書心得" : "心得整理中"}</div>
          </div>

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

      <div className="stage-ui">
        <button ref={closeRef} type="button" className="stage-btn" onClick={close}>
          收回書架 <span aria-hidden="true">×</span>
        </button>
        <a className={"stage-cta" + (book.hasNote ? " has-note" : "")} href={href}>
          {book.hasNote ? "閱讀我的讀書心得" : "查看書頁 · 整理中"} <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  );
}
