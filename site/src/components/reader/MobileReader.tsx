import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import type { BookMeta } from "../../lib/books";
import "../../styles/mobile-reader.css";

export type MobileSelection = {
  book: BookMeta;
  trigger: HTMLElement;
  origin: HTMLElement;
  rect: DOMRect;
  scrollY: number;
  returnUrl: string;
};

type Props = { selection: MobileSelection; base: string; onClosed: () => void };

export default function MobileReader({ selection, base, onClosed }: Props) {
  const { book, origin, rect, returnUrl, scrollY } = selection;
  const dialog = useRef<HTMLDialogElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const flight = useRef<HTMLDivElement>(null);
  const front = useRef<HTMLDivElement>(null);
  const source = useRef<HTMLDivElement>(null);
  const cover = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const closeAction = useRef<() => void>(() => {});
  const [content, setContent] = useState<string | "failed" | null>(null);
  const href = `${base}book/${book.slug}`;

  useLayoutEffect(() => {
    const el = dialog.current!;
    const bodyStyle = document.body.getAttribute("style");
    const scrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";
    // Fixed body also locks the background on iOS; restore its exact inline styles on exit.
    Object.assign(document.body.style, { position: "fixed", top: `-${scrollY}px`, width: "100%" });
    el.showModal();
    closeButton.current?.focus({ preventScroll: true });
    const clone = origin.cloneNode(true) as HTMLElement;
    clone.removeAttribute("id");
    Object.assign(clone.style, { width: "100%", height: "100%", transform: "none", visibility: "visible", position: "relative" });
    source.current!.append(clone);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let phase: "opening" | "opened" | "closing" = "opening";
    let requested = false;
    const finishOpen = () => {
      phase = "opened";
      gsap.set(sheet.current, { opacity: 1 });
      gsap.set(flight.current, { visibility: "hidden" });
    };
    const width = Math.min(innerWidth * 0.72, 260, innerHeight * 0.42);
    const height = width * 1.5;
    gsap.set(flight.current, { left: rect.left, top: rect.top, width: rect.width, height: rect.height });
    gsap.set(sheet.current, { opacity: 0 });
    const opening = gsap.timeline({ onComplete: finishOpen });
    opening.to(flight.current, { left: (innerWidth - width) / 2, top: (innerHeight - height) / 2, width, height, duration: 0.55, ease: "power3.inOut" })
      .to(source.current, { opacity: 0, duration: 0.25 }, 0.15)
      .fromTo(cover.current, { opacity: 0 }, { opacity: 1, duration: 0.25 }, 0.15)
      .to(front.current, { rotateY: -115, duration: 0.4, ease: "power2.inOut" })
      .to(sheet.current, { opacity: 1, duration: 0.18 }, "-=0.12");
    if (reduced.matches) opening.progress(1);
    let closing: gsap.core.Timeline | null = null;
    const close = () => {
      if (phase === "closing") return;
      const wasOpen = phase === "opened";
      phase = "closing";
      opening.kill();
      gsap.set(flight.current, { visibility: "visible" });
      if (wasOpen) gsap.set(sheet.current, { opacity: 0 });
      const back = origin.getBoundingClientRect();
      const visible = origin.isConnected && back.width > 0 && back.height > 0 && back.bottom > 0 && back.top < innerHeight && back.right > 0 && back.left < innerWidth;
      closing = gsap.timeline({ onComplete: onClosed });
      closing.to(sheet.current, { opacity: 0, duration: 0.12 }, 0)
        .to(front.current, { rotateY: 0, duration: 0.25, ease: "power2.out" }, 0);
      if (visible) {
        closing.to(flight.current, { left: back.left, top: back.top, width: back.width, height: back.height, duration: 0.45, ease: "power3.inOut" })
          .to(source.current, { opacity: 1, duration: 0.2 }, "-=0.2")
          .to(cover.current, { opacity: 0, duration: 0.2 }, "<");
      } else {
        closing.to(flight.current, { opacity: 0, duration: 0.2 });
      }
      if (reduced.matches) closing.progress(1);
    };
    closeAction.current = () => {
      if (requested || phase === "closing") return;
      requested = true;
      if (history.state?.mobileReader?.slug === book.slug && history.state.mobileReader.returnUrl === returnUrl && history.length > 1) {
        history.back();
      } else {
        history.replaceState(null, "", returnUrl);
        close();
      }
    };
    const pop = () => {
      if (location.pathname + location.search + location.hash !== returnUrl) {
        // Forward to a book, or a second Back during closing: load the actual destination.
        location.reload();
        return;
      }
      close();
    };
    const resize = () => {
      if (phase === "opening") opening.progress(1);
      else if (phase === "closing") closing?.progress(1);
    };
    const motion = () => {
      if (reduced.matches) resize();
    };
    window.addEventListener("popstate", pop);
    window.addEventListener("resize", resize);
    reduced.addEventListener("change", motion);
    return () => {
      opening.kill();
      closing?.kill();
      window.removeEventListener("popstate", pop);
      window.removeEventListener("resize", resize);
      reduced.removeEventListener("change", motion);
      el.close();
      if (bodyStyle === null) document.body.removeAttribute("style");
      else document.body.setAttribute("style", bodyStyle);
      window.scrollTo(0, scrollY);
      document.documentElement.style.scrollBehavior = scrollBehavior;
    };
  }, []);

  useEffect(() => {
    if (!book.hasNote && !book.hasSummary) return;
    const ctl = new AbortController();
    fetch(href, { signal: ctl.signal })
      .then((r) => r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then((text) => {
        // Only our own statically rendered, same-origin book HTML is inserted.
        const doc = new DOMParser().parseFromString(text, "text/html");
        const summary = doc.querySelector("section.summary");
        const note = doc.querySelector("#note.note");
        if ((book.hasSummary && !summary) || (book.hasNote && !note)) throw new Error("content missing");
        setContent((summary?.outerHTML ?? "") + (note?.outerHTML ?? ""));
      })
      .catch((e) => { if (e.name !== "AbortError") setContent("failed"); });
    return () => ctl.abort();
  }, [href, book.hasSummary, book.hasNote]);

  return (
    <dialog ref={dialog} className={`mobile-reader mobile-reading cat-${book.cat}`} aria-modal="true" aria-labelledby="reader-title" onCancel={(e) => { e.preventDefault(); closeAction.current(); }}>
      <div ref={sheet} className="reader-sheet">
        <header className="reader-bar">
          <button ref={closeButton} type="button" onClick={() => closeAction.current()}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M10 4 5 9l5 5M5 9h11" /></svg>
            回到書目
          </button>
          <span>{book.catZh}</span>
        </header>
        <div className="reader-scroll" tabIndex={0} aria-label="書籍全文">
          <div className="reader-content">
            <article className="reader-meta">
              <h1 id="reader-title">{book.dCover}</h1>
              <p className="caption">{book.dCaption}</p>
              <p className="author">{book.author} · {book.numStr}</p>
              <p className="desc">{book.desc}</p>
            </article>
            {(book.hasNote || book.hasSummary) && content === null && <p role="status">內容載入中…</p>}
            {content === "failed" ? <p role="alert">內容載入失敗，請<a className="reader-recover" href={href} onClick={(e) => { if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); location.reload(); } }}>到書頁閱讀</a>。</p> : content && <div className="reading-body" dangerouslySetInnerHTML={{ __html: content }} />}
            {!book.hasNote && <p className="note-pending">讀書心得整理中</p>}
          </div>
        </div>
      </div>
      <div ref={flight} className="mobile-flight" aria-hidden="true">
        <div ref={front} className="mobile-flight-front">
          <div ref={source} className="mobile-flight-source" />
          <div ref={cover} className="mobile-flight-cover">{book.cover ? <img src={book.cover} alt="" /> : <span>{book.dCover}</span>}</div>
        </div>
      </div>
    </dialog>
  );
}
