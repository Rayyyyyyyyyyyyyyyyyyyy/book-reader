#!/usr/bin/env python3
"""Download book covers from Open Library into book-png/, in batches.

Usage: python3 fetch_covers.py [batch_size]
Tracks progress by which NNN_*.jpg files already exist in book-png/.
"""
import csv
import json
import os
import re
import ssl
import sys
import time
import urllib.parse
import urllib.request

try:
    import certifi
    SSL_CTX = ssl.create_default_context(cafile=certifi.where())
except Exception:
    SSL_CTX = ssl.create_default_context()
    SSL_CTX.check_hostname = False
    SSL_CTX.verify_mode = ssl.CERT_NONE

ROOT = os.path.dirname(os.path.abspath(__file__))
CSV = os.path.join(ROOT, "bookList.csv")
OUT = os.path.join(ROOT, "book-png")
UA = "Mozilla/5.0 (cover-fetch; contact zxcvbnmjfy518@gmail.com)"


def slug(s):
    s = re.sub(r"[^\w\s-]", "", s, flags=re.UNICODE).strip()
    return re.sub(r"[\s]+", "-", s)[:60]


def get(url, binary=False):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30, context=SSL_CTX) as r:
        return r.read() if binary else r.read().decode("utf-8")


def find_cover(title, author):
    """Return cover image bytes for a book, or None."""
    q = urllib.parse.urlencode({
        "title": title, "author": author,
        "fields": "cover_i,isbn,edition_key",
        "limit": 5,
    })
    try:
        data = json.loads(get("https://openlibrary.org/search.json?" + q))
    except Exception as e:
        print(f"    search failed: {e}")
        return None
    for doc in data.get("docs", []):
        cid = doc.get("cover_i")
        if cid:
            try:
                img = get(f"https://covers.openlibrary.org/b/id/{cid}-L.jpg", binary=True)
                if img and len(img) > 2000:  # skip 1x1 placeholder
                    return img
            except Exception:
                pass
    # fallback: try title only
    try:
        q2 = urllib.parse.urlencode({"title": title, "fields": "cover_i", "limit": 3})
        data = json.loads(get("https://openlibrary.org/search.json?" + q2))
        for doc in data.get("docs", []):
            cid = doc.get("cover_i")
            if cid:
                img = get(f"https://covers.openlibrary.org/b/id/{cid}-L.jpg", binary=True)
                if img and len(img) > 2000:
                    return img
    except Exception:
        pass
    return None


def main():
    batch_size = int(sys.argv[1]) if len(sys.argv) > 1 else 5
    os.makedirs(OUT, exist_ok=True)
    done = {f[:3] for f in os.listdir(OUT) if re.match(r"\d{3}_", f)}

    with open(CSV, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    pending = [r for r in rows if f"{int(r['排名']):03d}" not in done]
    batch = pending[:batch_size]
    if not batch:
        print("ALL DONE — every book cover downloaded.")
        return 0

    print(f"Processing {len(batch)} books (#{batch[0]['排名']}–#{batch[-1]['排名']}), "
          f"{len(pending)-len(batch)} remaining after this batch.")
    ok = 0
    for r in batch:
        rank = int(r["排名"])
        en, author = r["英文書名"], r["作者"]
        print(f"  #{rank:>3} {en} — {author}")
        img = find_cover(en, author)
        if img:
            fn = f"{rank:03d}_{slug(en)}.jpg"
            with open(os.path.join(OUT, fn), "wb") as out:
                out.write(img)
            print(f"      saved {fn} ({len(img)//1024} KB)")
            ok += 1
        else:
            # write a marker so we don't re-attempt forever
            fn = f"{rank:03d}_NOTFOUND.txt"
            with open(os.path.join(OUT, fn), "w") as out:
                out.write(f"no cover found for {en} / {author}\n")
            print(f"      NO COVER — marked {fn}")
        time.sleep(1)

    print(f"Batch complete: {ok}/{len(batch)} covers downloaded.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
