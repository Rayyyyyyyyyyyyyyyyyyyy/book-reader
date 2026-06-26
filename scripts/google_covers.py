#!/usr/bin/env python3
"""Fallback cover fetcher using Google Books API for specific ranks.

Usage: python3 google_covers.py 53 86 103 ...
Pulls the highest-res cover Google Books offers and saves into book-png/,
replacing any existing NNN_* file (jpg or NOTFOUND marker) for that rank.
"""
import csv, json, os, re, ssl, sys, time, urllib.parse, urllib.request

try:
    import certifi
    SSL_CTX = ssl.create_default_context(cafile=certifi.where())
except Exception:
    SSL_CTX = ssl.create_default_context()
    SSL_CTX.check_hostname = False
    SSL_CTX.verify_mode = ssl.CERT_NONE

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
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


def best_image_url(info):
    links = info.get("imageLinks", {})
    # prefer largest available
    for key in ("extraLarge", "large", "medium", "small", "thumbnail", "smallThumbnail"):
        if key in links:
            url = links[key].replace("http://", "https://")
            # bump zoom for bigger render when it's a content URL
            url = re.sub(r"([?&])zoom=\d+", r"\1zoom=3", url)
            url = url.replace("&edge=curl", "")
            return url
    return None


def fetch_google(title, author):
    for q in (f'intitle:"{title}" inauthor:"{author}"', f'{title} {author}', title):
        params = urllib.parse.urlencode({"q": q, "maxResults": 5, "country": "US"})
        try:
            data = json.loads(get("https://www.googleapis.com/books/v1/volumes?" + params))
        except Exception as e:
            print(f"    query failed: {e}")
            continue
        for item in data.get("items", []):
            url = best_image_url(item.get("volumeInfo", {}))
            if not url:
                continue
            try:
                img = get(url, binary=True)
                if img and len(img) > 3000:
                    return img
            except Exception:
                pass
        time.sleep(0.5)
    return None


def main():
    wanted = set(int(x) for x in sys.argv[1:])
    if not wanted:
        print("usage: python3 google_covers.py <rank> [rank...]")
        return 1
    with open(CSV, newline="", encoding="utf-8") as f:
        rows = {int(r["排名"]): r for r in csv.DictReader(f)}

    ok = 0
    for rank in sorted(wanted):
        r = rows.get(rank)
        if not r:
            print(f"  #{rank}: not in list"); continue
        en, author = r["英文書名"], r["作者"]
        print(f"  #{rank:>3} {en} — {author}")
        img = fetch_google(en, author)
        if img:
            # remove old artifacts for this rank
            for old in os.listdir(OUT):
                if re.match(rf"{rank:03d}_", old):
                    os.remove(os.path.join(OUT, old))
            fn = f"{rank:03d}_{slug(en)}.jpg"
            with open(os.path.join(OUT, fn), "wb") as out:
                out.write(img)
            print(f"      ✓ saved {fn} ({len(img)//1024} KB)")
            ok += 1
        else:
            print(f"      ✗ still no cover")
        time.sleep(1)
    print(f"Done: {ok}/{len(wanted)} fetched via Google Books.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
