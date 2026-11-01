import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { BookMeta } from "../../lib/books";
import { BookSpine } from "./BookSpine";
import BookStage from "./BookStage";
import "../../styles/bookshelf.css";

export type ShelfSection = { key: string; zh: string; en: string; books: BookMeta[]; countLabel?: string };

type Props = { sections: ShelfSection[]; base: string };

type Selection = { book: BookMeta; button: HTMLButtonElement; face: HTMLElement };

function lockScroll(on: boolean) {
  const html = document.documentElement;
  if (on) {
    // keep the layout from shifting when the scrollbar disappears, so the spine stays put
    document.body.style.paddingRight = `${window.innerWidth - html.clientWidth}px`;
    html.style.overflow = "hidden";
  } else {
    html.style.overflow = "";
    document.body.style.paddingRight = "";
  }
}

export default function ImmersiveShelf({ sections, base }: Props) {
  const [selected, setSelected] = useState<Selection | null>(null);
  const returnFocus = useRef<HTMLButtonElement | null>(null);

  // One book at a time: ignore picks while a book is out (the page is also inert then).
  const select = (book: BookMeta, button: HTMLButtonElement) => {
    if (selected) return;
    const face = button.querySelector<HTMLElement>(".spine-face");
    if (!face) return;
    lockScroll(true);
    setSelected({ book, button, face });
  };

  const closed = () => {
    returnFocus.current = selected?.button ?? null;
    lockScroll(false);
    setSelected(null);
  };

  useEffect(() => {
    if (selected || !returnFocus.current) return;
    returnFocus.current.focus({ preventScroll: true });
    returnFocus.current = null;
  }, [selected]);

  useEffect(() => () => lockScroll(false), []);

  return (
    <>
      {sections.map((sec) => (
        <section key={sec.key} className={`shelf-section cat-${sec.key}`} aria-label={sec.zh}>
          <div className="shelf-head">
            <h2>{sec.zh}</h2>
            <span className="shelf-en">{sec.en}</span>
            {sec.countLabel && <span className="shelf-count">{sec.countLabel}</span>}
          </div>
          <div className="shelf">
            {sec.books.map((b) => (
              <BookSpine key={b.slug} book={b} out={selected?.book.slug === b.slug} onSelect={select} />
            ))}
          </div>
        </section>
      ))}
      {selected &&
        createPortal(
          <BookStage key={selected.book.slug} book={selected.book} origin={selected.face} base={base} onClosed={closed} />,
          document.body,
        )}
    </>
  );
}
