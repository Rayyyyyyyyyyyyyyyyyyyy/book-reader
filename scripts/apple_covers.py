#!/usr/bin/env python3
"""Fallback cover fetcher using Apple Books (iTunes Search API).

Usage: python3 apple_covers.py 53 86 103 ...
No API key needed. Upgrades artwork to high-res. Tries US then TW storefront
(TW helps for Chinese-language titles). Replaces existing NNN_* for that rank.
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


def hi_res(art):
    # artworkUrl100 ends in /100x100bb.jpg -> request a big square
    return re.sub(r"/\d+x\d+bb\.(jpg|png)", r"/1200x1200bb.\1", art)


def fetch_apple(title, author):
    queries = [f"{title} {author}", title]
    for country in ("US", "TW"):
        for term in queries:
            params = urllib.parse.urlencode({
                "term": term, "media": "ebook", "limit": 5, "country": country,
            })
            try:
                data = json.loads(get("https://itunes.apple.com/search?" + params))
            except Exception as e:
                print(f"    {country} query failed: {e}")
                continue
            for item in data.get("results", []):
                art = item.get("artworkUrl100") or item.get("artworkUrl60")
                if not art:
                    continue
                try:
                    img = get(hi_res(art), binary=True)
                    if img and len(img) > 3000:
                        return img
                except Exception:
                    pass
            time.sleep(0.4)
    return None


def main():
    wanted = set(int(x) for x in sys.argv[1:])
    if not wanted:
        print("usage: python3 apple_covers.py <rank> [rank...]")
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
        img = fetch_apple(en, author)
        if img:
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
        time.sleep(0.8)
    print(f"Done: {ok}/{len(wanted)} fetched via Apple Books.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
