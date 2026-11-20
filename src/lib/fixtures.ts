import type {
    Envelope,
    ImageResult,
    NewsResult,
    SongResult,
    Vertical,
    VideoResult,
    WebResult,
} from "@/lib/upstream";

// Everything in this file is invented. SmallWorldSearch ships without an
// upstream, so the pages are fed deterministic placeholder envelopes shaped
// exactly like the search API's `/api/v1/*` responses. Same query in, same
// results out.

export const FIXTURE_PAGES = 3;

const HOSTS = [
    "example.com",
    "www.example.org",
    "docs.example.net",
    "wiki.example.com",
    "notes.example.org",
    "archive.example.net",
    "handbook.example.com",
    "paste.example.org",
] as const;

const SUFFIXES = [
    "reference",
    "field notes",
    "a short guide",
    "release notes",
    "frequently asked questions",
    "design journal",
    "cheat sheet",
    "deep dive",
    "post-mortem",
    "annotated bibliography",
] as const;

const OPENERS = [
    "A placeholder record generated locally",
    "Sample copy standing in for an upstream result",
    "Filler text with no connection to anything real",
    "Synthetic result produced by the fixture layer",
    "Dummy entry rendered without contacting a network",
] as const;

const CLOSERS = [
    "so the layout can be reviewed without a live backend.",
    "because the real deployment is not reachable from here.",
    "which keeps the demo deterministic across reloads.",
    "and every field below is fabricated.",
    "exercising the same code path as a real envelope.",
] as const;

const AUTHORS = [
    "A. Placeholder",
    "Fixture Collective",
    "Example Newsroom",
    "Sample Archive",
    "Dummy Data Dept.",
] as const;

const SECTIONS = ["index", "docs", "notes", "log", "page", "entry"] as const;

function hash(input: string): number {
    let value = 2166136261;
    for (let index = 0; index < input.length; index += 1) {
        value ^= input.charCodeAt(index);
        value = Math.imul(value, 16777619);
    }
    return value >>> 0;
}

function rng(seed: number): () => number {
    let state = seed || 1;
    return () => {
        state ^= state << 13;
        state >>>= 0;
        state ^= state >>> 17;
        state ^= state << 5;
        state >>>= 0;
        return state / 4294967296;
    };
}

function pick<T>(next: () => number, list: readonly T[], fallback: T): T {
    return list[Math.floor(next() * list.length)] ?? fallback;
}

function between(next: () => number, low: number, high: number): number {
    return low + Math.floor(next() * (high - low + 1));
}

function titleCase(query: string): string {
    const trimmed = query.trim() || "untitled";
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function slug(query: string): string {
    const cleaned = query
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    return cleaned || "query";
}

function pageOf(npt: string | null | undefined): number {
    if (!npt) {
        return 1;
    }
    const parsed = Number.parseInt(npt.replace(/^p/, ""), 10);
    return Number.isFinite(parsed) && parsed > 1 ? Math.min(parsed, FIXTURE_PAGES) : 1;
}

function nextToken(page: number): string | null {
    return page < FIXTURE_PAGES ? `p${page + 1}` : null;
}

function describe(next: () => number, query: string): string {
    const opener = pick(next, OPENERS, OPENERS[0]);
    const closer = pick(next, CLOSERS, CLOSERS[0]);
    return `${opener} for "${query}", ${closer}`;
}

function link(next: () => number, query: string, index: number): string {
    const host = pick(next, HOSTS, HOSTS[0]);
    const section = pick(next, SECTIONS, SECTIONS[0]);
    return `https://${host}/${section}/${slug(query)}-${index + 1}`;
}

function heading(next: () => number, query: string, index: number): string {
    const suffix = pick(next, SUFFIXES, SUFFIXES[0]);
    return `${titleCase(query)} ${suffix} (${index + 1})`;
}

// Thumbnails point at a reserved domain and are only ever resolved by /img,
// which draws a placeholder instead of making a request.
function thumbUrl(next: () => number, seed: string): string {
    const width = between(next, 2, 5) * 160;
    const height = between(next, 2, 4) * 120;
    return `https://thumb.example.net/i/${seed}/${width}x${height}.png`;
}

function timestamp(next: () => number): number {
    const nowDays = Math.floor(Date.UTC(2026, 0, 1) / 86400000);
    return (nowDays - between(next, 1, 900)) * 86400;
}

function webResults(query: string, page: number): WebResult[] {
    const next = rng(hash(`web:${query}:${page}`));
    return Array.from({ length: 10 }, (_, index) => ({
        title: heading(next, query, index + (page - 1) * 10),
        description: describe(next, query),
        url: link(next, query, index + (page - 1) * 10),
        date: next() > 0.5 ? timestamp(next) : null,
        type: "web",
        thumb: { ratio: null, url: null },
        sublink: [],
        table: {},
    }));
}

function imageResults(query: string, page: number): ImageResult[] {
    const next = rng(hash(`images:${query}:${page}`));
    return Array.from({ length: 24 }, (_, index) => {
        const position = index + (page - 1) * 24;
        const width = between(next, 2, 5) * 320;
        const height = between(next, 2, 4) * 240;
        const seed = `${slug(query)}-${position + 1}`;
        return {
            title: `${titleCase(query)} plate ${position + 1}`,
            url: link(next, query, position),
            source: [
                {
                    url: `https://thumb.example.net/i/${seed}/${width}x${height}.png`,
                    width,
                    height,
                },
                {
                    url: `https://thumb.example.net/i/${seed}/${Math.round(width / 4)}x${Math.round(height / 4)}.png`,
                    width: Math.round(width / 4),
                    height: Math.round(height / 4),
                },
            ],
        };
    });
}

function videoResults(query: string, page: number): VideoResult[] {
    const next = rng(hash(`videos:${query}:${page}`));
    return Array.from({ length: 10 }, (_, index) => {
        const position = index + (page - 1) * 10;
        const name = pick(next, AUTHORS, AUTHORS[0]);
        return {
            title: heading(next, query, position),
            description: describe(next, query),
            author: {
                name,
                url: `https://${pick(next, HOSTS, HOSTS[0])}/@${slug(name)}`,
                avatar: null,
            },
            date: timestamp(next),
            duration: between(next, 45, 4200),
            views: between(next, 120, 2_400_000),
            thumb: {
                ratio: "16/9",
                url: thumbUrl(next, `${slug(query)}-v${position + 1}`),
            },
            url: link(next, query, position),
        };
    });
}

function newsResults(query: string, page: number): NewsResult[] {
    const next = rng(hash(`news:${query}:${page}`));
    return Array.from({ length: 8 }, (_, index) => {
        const position = index + (page - 1) * 8;
        return {
            title: heading(next, query, position),
            author: pick(next, AUTHORS, AUTHORS[0]),
            description: describe(next, query),
            date: timestamp(next),
            thumb: {
                ratio: "16/9",
                url:
                    next() > 0.35
                        ? thumbUrl(next, `${slug(query)}-n${position + 1}`)
                        : null,
            },
            url: link(next, query, position),
        };
    });
}

function songResults(query: string, page: number): SongResult[] {
    const next = rng(hash(`music:${query}:${page}`));
    return Array.from({ length: 10 }, (_, index) => {
        const position = index + (page - 1) * 10;
        const name = pick(next, AUTHORS, AUTHORS[0]);
        return {
            title: `${titleCase(query)} (take ${position + 1})`,
            description: null,
            author: {
                name,
                url: `https://${pick(next, HOSTS, HOSTS[0])}/@${slug(name)}`,
                avatar: null,
            },
            date: timestamp(next),
            duration: between(next, 90, 480),
            views: between(next, 40, 900_000),
            thumb: {
                ratio: "1/1",
                url: thumbUrl(next, `${slug(query)}-s${position + 1}`),
            },
            url: link(next, query, position),
        };
    });
}

export function fixtureEnvelope(
    vertical: Vertical,
    query: string,
    npt: string | null | undefined,
): Envelope {
    const page = pageOf(npt);
    const base: Envelope = { status: "ok", npt: nextToken(page) };

    switch (vertical) {
        case "web":
            return { ...base, web: webResults(query, page), related: [] };
        case "images":
            return { ...base, image: imageResults(query, page) };
        case "videos":
            return { ...base, video: videoResults(query, page) };
        case "news":
            return { ...base, news: newsResults(query, page) };
        case "music":
            return { ...base, song: songResults(query, page) };
    }
}

// Stand-in for the upstream thumbnail proxy. Dimensions are read back out of
// the fixture URL
// so the grid keeps the aspect ratio it was promised.
export function fixtureImage(target: string): Response {
    const matched = /\/(\d+)x(\d+)\.png$/.exec(target);
    const width = Number(matched?.[1] ?? 480);
    const height = Number(matched?.[2] ?? 360);
    const hue = hash(target) % 360;
    const step = Math.max(24, Math.round(Math.min(width, height) / 6));

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect width="${width}" height="${height}" fill="hsl(${hue} 28% 9%)"/>
<g stroke="hsl(${hue} 60% 42%)" stroke-width="1" opacity="0.45">
${Array.from({ length: Math.floor(width / step) }, (_, i) => `<line x1="${(i + 1) * step}" y1="0" x2="${(i + 1) * step}" y2="${height}"/>`).join("")}
${Array.from({ length: Math.floor(height / step) }, (_, i) => `<line x1="0" y1="${(i + 1) * step}" x2="${width}" y2="${(i + 1) * step}"/>`).join("")}
</g>
<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" fill="none" stroke="hsl(${hue} 70% 55%)" stroke-width="2"/>
<text x="50%" y="50%" fill="hsl(${hue} 80% 72%)" font-family="monospace" font-size="${Math.max(11, Math.round(Math.min(width, height) / 9))}" text-anchor="middle" dominant-baseline="middle" letter-spacing="2">FIXTURE ${width}x${height}</text>
</svg>`;

    return new Response(svg, {
        headers: {
            "content-type": "image/svg+xml",
            "cache-control": "public, max-age=3600",
            "content-security-policy": "default-src 'none'; sandbox",
        },
    });
}
