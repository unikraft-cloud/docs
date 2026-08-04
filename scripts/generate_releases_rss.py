#!/usr/bin/env python3
"""
Generate an RSS 2.0 feed for the Releases section from the MDX files in
pages/releases/.

Each release MDX file (everything except index.mdx) must have a `title`,
`description`, and `date` (YYYY-MM-DD) field in its YAML front-matter. Items
are sorted by date, newest first.

Usage: generate_releases_rss.py RELEASES_DIR OUTPUT_FILE
"""
from __future__ import annotations

import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from xml.sax.saxutils import escape

SITE_URL = "https://unikraft.com"
BASE_PATH = "/docs"
FEED_TITLE = "Unikraft Cloud Releases"
FEED_DESCRIPTION = "Release notes and changelog for Unikraft Cloud."

FRONT_MATTER_FIELD = re.compile(
    r'^{field}:\s*["\']?(.+?)["\']?\s*$', re.MULTILINE
)


def extract_field(text: str, field: str) -> str | None:
    m = re.compile(FRONT_MATTER_FIELD.pattern.format(field=field), re.MULTILINE).search(text)
    return m.group(1).strip() if m else None


def load_releases(releases_dir: Path) -> list[dict]:
    releases = []
    for mdx in releases_dir.glob("*.mdx"):
        if mdx.stem == "index":
            continue
        text = mdx.read_text(encoding="utf-8")
        title = extract_field(text, "title")
        description = extract_field(text, "description")
        date = extract_field(text, "date")
        if not (title and date):
            print(f"⚠️  Skipping {mdx.name}: missing title or date front-matter", file=sys.stderr)
            continue
        releases.append({
            "title": title,
            "description": description or "",
            "date": datetime.strptime(date, "%Y-%m-%d").replace(tzinfo=timezone.utc),
            "slug": mdx.stem,
        })
    releases.sort(key=lambda r: r["date"], reverse=True)
    return releases


def build_rss(releases: list[dict], now: datetime) -> str:
    feed_url = f"{SITE_URL}{BASE_PATH}/releases/index"
    rss_url = f"{SITE_URL}{BASE_PATH}/releases/rss.xml"

    items = []
    for r in releases:
        item_url = f"{SITE_URL}{BASE_PATH}/releases/{r['slug']}"
        items.append(f"""    <item>
      <title>{escape(r['title'])}</title>
      <link>{escape(item_url)}</link>
      <guid>{escape(item_url)}</guid>
      <pubDate>{r['date'].strftime('%a, %d %b %Y %H:%M:%S %z')}</pubDate>
      <description>{escape(r['description'])}</description>
    </item>""")

    return f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>{escape(FEED_TITLE)}</title>
    <link>{escape(feed_url)}</link>
    <description>{escape(FEED_DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>{now.strftime('%a, %d %b %Y %H:%M:%S %z')}</lastBuildDate>
    <atom:link href="{escape(rss_url)}" rel="self" type="application/rss+xml" />
{chr(10).join(items)}
  </channel>
</rss>
"""


def main() -> int:
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} RELEASES_DIR OUTPUT_FILE", file=sys.stderr)
        return 1

    releases_dir = Path(sys.argv[1])
    output_file = Path(sys.argv[2])

    if not releases_dir.is_dir():
        print(f"❌  Releases directory not found: {releases_dir}", file=sys.stderr)
        return 1

    releases = load_releases(releases_dir)
    if not releases:
        print("❌  No releases with valid front-matter found", file=sys.stderr)
        return 1

    rss = build_rss(releases, datetime.now(timezone.utc))

    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.write_text(rss, encoding="utf-8")
    print(f"  ✅ Generated RSS feed with {len(releases)} release(s) -> {output_file}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
