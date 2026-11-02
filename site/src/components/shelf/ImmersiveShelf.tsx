import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { BookMeta } from "../../lib/books";
import { SHELF_ROW, spineLook } from "../../lib/spine";
import { BookSpine } from "./BookSpine";
import BookStage from "./BookStage";
import "../../styles/shelf.css";

export type ShelfSection = { key: string; zh: string; en: string; books: BookMeta[]; countLabel?: string };

type Props = { sections: ShelfSection[]; base: string };

type Selection = { book: BookMeta; button: HTMLButtonElement; face: HTMLElement };

// Books with a note stand at the front of each shelf; within each group tallest first, like a real
// shelf, and rank breaks ties so the order is stable.
const byHeight = (books: BookMeta[]) =>
  [...books].sort((a, b) => +b.hasNote - +a.hasNote || spineLook(b).height - spineLook(a).height || a.rank - b.rank);

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

  // The end of a book offers the next book with a note, in the order they stand on the shelves.
  const order = sections.flatMap((sec) => byHeight(sec.books));
  const nextNote = (book: BookMeta) => {
    const at = order.findIndex((b) => b.slug === book.slug);
    return [...order.slice(at + 1), ...order.slice(0, at)].find((b) => b.hasNote) ?? null;
  };

  const closed = (next?: BookMeta) => {
    const button = next && document.querySelector<HTMLButtonElement>(`.spine-slot[data-slug="${next.slug}"]`);
    const face = button?.querySelector<HTMLElement>(".spine-face");
    if (button && face && next) {
      // straight on to the next book: bring its spine into view, then pull it out
      button.scrollIntoView({ block: "center", inline: "center" });
      return setSelected({ book: next, button, face });
    }
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
          <div className="shelf" style={{ "--row": `${SHELF_ROW}px` } as React.CSSProperties}>
            {byHeight(sec.books).map((b) => (
              <BookSpine key={b.slug} book={b} out={selected?.book.slug === b.slug} onSelect={select} />
            ))}
          </div>
        </section>
      ))}
      {selected &&
        createPortal(
          <BookStage
            key={selected.book.slug}
            book={selected.book}
            origin={selected.face}
            base={base}
            next={nextNote(selected.book)}
            onClosed={closed}
          />,
          document.body,
        )}
    </>
  );
}
