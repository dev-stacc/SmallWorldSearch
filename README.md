# SmallWorldSearch

A metasearch frontend: one search box, five verticals, and a server-side
rendered result page that makes no client-side requests at all.

This repository runs with no upstream configured. Every result you see is
generated locally by a fixture layer, and the app never makes an outbound
request.

## Running

```
nix develop
npm install
npm run dev
```

That's it — no services to stand up, no configuration. The app starts in
fixture mode and serves generated results on every vertical.

## Fixture mode

With `SEARCH_UPSTREAM` unset, `search()` returns envelopes built by
`src/lib/fixtures.ts` rather than calling an API, and `/img` draws a
placeholder SVG rather than proxying a thumbnail.

The generator is deterministic: results are seeded from the query, the vertical
and the page token, so the same search always renders the same page. Links
point at [RFC 2606](https://www.rfc-editor.org/rfc/rfc2606) reserved domains
(`example.com` and friends) and resolve to nothing. Pagination is capped at
three pages. The telemetry rail carries a `FIXTURES` marker so a generated page
can't be mistaken for a live one.

Point `SEARCH_UPSTREAM` at a search API and the fixtures drop out of the path
entirely:

```
SEARCH_UPSTREAM=http://127.0.0.1:8099 npm run dev
```

## Environment

| Variable          | Default              |
| ----------------- | -------------------- |
| `SEARCH_UPSTREAM` | unset — fixture mode |
| `SEARCH_SCRAPER`  | `ddg`                |

## Routes

| Route      | Purpose                                     |
| ---------- | ------------------------------------------- |
| `/`        | Empty search box                            |
| `/search`  | Web results, `?q=` `&scraper=` `&npt=`      |
| `/images`  | Image results, same parameters              |
| `/videos`  | Video results, same parameters              |
| `/music`   | Music results, same parameters              |
| `/news`    | News results, same parameters               |
| `/img`     | Server-side image proxy, `?u=<encoded url>` |
| `/healthz` | Liveness probe                              |

Image thumbnails always go through `/img`, so nothing in a result page makes
the browser contact an upstream host. With an upstream configured that keeps it
off the public internet entirely; here it means the page renders with no
network at all.

## Stack

Next.js 16 App Router, React 19, TypeScript in strict mode, no client-side data
fetching and no CSS framework — the whole interface is a hand-written grid in
`src/app/globals.css`.
