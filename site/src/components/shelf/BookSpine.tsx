import type { BookMeta } from "../../lib/books";
import { coverTitle } from "../../data/title-breaks";
import { spineColors, spineLook } from "../../lib/spine";

// Pure visual spine, shared by the shelf button and the 3D book so the extracted
// book is visibly the same object that left the shelf.
export function SpineFace({ book, style }: { book: BookMeta; style?: React.CSSProperties }) {
  const look = spineLook(book);
  return (
    <div className={`spine-face cat-${book.cat} tone-${look.tone}`} style={{ ...spineColors(book.coverColor), ...style }} aria-hidden="true">
      <span className="spine-title" style={{ fontSize: look.fontSize }} data-cols={look.cols > 1 || undefined}>
        {look.cols > 1 ? coverTitle(book) : book.dCover}
      </span>
      <span className="spine-num">{String(book.rank).padStart(3, "0")}</span>
    </div>
  );
}

type SpineProps = {
  book: BookMeta;
  out: boolean;
  onSelect: (book: BookMeta, button: HTMLButtonElement) => void;
};

export function BookSpine({ book, out, onSelect }: SpineProps) {
  const look = spineLook(book);
  return (
    <button
      type="button"
      className="spine-slot"
      data-out={out || undefined}
      data-slug={book.slug}
      style={{ width: look.width }}
      title={`${book.dCover} · ${book.author}`}
      aria-label={`${book.dCover}，${book.author}，${book.numStr}${book.hasNote ? "，有讀書心得" : ""}`}
      onClick={(e) => onSelect(book, e.currentTarget)}
    >
      <SpineFace book={book} style={{ height: `calc(var(--row) * ${look.height})` }} />
    </button>
  );
}
