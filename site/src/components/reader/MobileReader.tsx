import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { BookMeta } from "../../lib/books";
import "../../styles/mobile-reader.css";

export type MobileSelection = {
  book: BookMeta; // the book being read
  originSlug: string; // the book first opened, where closing returns to
  trigger: HTMLElement;
  scrollY: number;
  returnUrl: string;
};

type Props = { selection: MobileSelection; base: string; next: BookMeta | null; onNext: (next: BookMeta) => void; onClosed: () => void };

export default function MobileReader({ selection, base, next, onNext, onClosed }: Props) {
  const { book, returnUrl, scrollY } = selection;
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const reading = useRef(book.slug);
  const closeAction = useRef<() => void>(() => {});
  const [content, setContent] = useState<string | "failed" | null>(null);
  const href = `${base}book/${book.slug}`;

  useLayoutEffect(() => {
    const el = dialog.current!;
    const bodyStyle = document.body.getAttribute("style");
    // Fixed body also locks the background on iOS; restore its exact inline styles on exit.
    Object.assign(document.body.style, { position: "fixed", top: `-${scrollY}px`, width: "100%" });
    el.showModal();
    closeButton.current?.focus({ preventScroll: true });
    let requested = false;
    closeAction.current = () => {
      if (requested) return;
      requested = true;
      if (history.state?.mobileReader?.returnUrl === returnUrl && history.length > 1) {
        history.back();
      } else {
        history.replaceState(null, "", returnUrl);
        onClosed();
      }
    };
    const pop = () => {
      if (location.pathname + location.search + location.hash !== returnUrl) {
        // Forward to a book: load the actual destination.
        location.reload();
        return;
      }
      onClosed();
    };
    window.addEventListener("popstate", pop);
    return () => {
      window.removeEventListener("popstate", pop);
      el.close();
      if (bodyStyle === null) document.body.removeAttribute("style");
      else document.body.setAttribute("style", bodyStyle);
      window.scrollTo(0, scrollY);
    };
  }, []);

  // On to the next book: before paint, so its title never shows over the last book's text.
  useLayoutEffect(() => {
    if (reading.current === book.slug) return;
    reading.current = book.slug;
    setContent(null);
    scroller.current?.scrollTo(0, 0);
    title.current?.focus({ preventScroll: true });
  }, [book.slug]);

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
      <div className="reader-sheet">
        <header className="reader-bar">
          <button ref={closeButton} type="button" onClick={() => closeAction.current()}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M10 4 5 9l5 5M5 9h11" /></svg>
            回到書目
          </button>
          <span>{book.catZh}</span>
        </header>
        <div ref={scroller} className="reader-scroll" role="region" tabIndex={0} aria-label="書籍全文">
          <div className="reader-content">
            <article className="reader-meta">
              <h1 ref={title} id="reader-title" tabIndex={-1}>{book.dCover}</h1>
              <p className="caption">{book.dCaption}</p>
              <p className="author">{book.author} · {book.numStr}</p>
              <p className="desc">{book.desc}</p>
            </article>
            {(book.hasNote || book.hasSummary) && content === null && <p role="status">內容載入中…</p>}
            {content === "failed" ? <p role="alert">內容載入失敗，請<a className="reader-recover" href={href} onClick={(e) => { if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); location.reload(); } }}>到書頁閱讀</a>。</p> : content && <div className="reading-body" dangerouslySetInnerHTML={{ __html: content }} />}
            {!book.hasNote && <p className="note-pending">讀書心得整理中</p>}
            {next && (content || (!book.hasNote && !book.hasSummary)) && content !== "failed" && (
              <button type="button" className="reader-next" onClick={() => onNext(next)}>
                <span>下一本有心得的書</span>
                <strong>{next.dCover}</strong>
              </button>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}
