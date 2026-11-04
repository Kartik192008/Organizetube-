const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const VIDEO_ID = /^[\w-]{11}$/;
const PLAYLIST_ID = /^[\w-]{10,64}$/;
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const MAX_PLAYLIST_PAGES = 20;

type Parsed = { kind: "video" | "playlist"; id: string };
type Lesson = { youtubeId: string; title: string };
type ImportResult = {
  kind: "video" | "playlist";
  title: string;
  thumbnailUrl: string;
  lessons: Lesson[];
};

class ImportError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function parseYouTubeUrl(raw: string): Parsed | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www|m)\./, "");
  const list = url.searchParams.get("list");
  const v = url.searchParams.get("v");

  if (host === "youtu.be") {
    const id = url.pathname.slice(1);
    return VIDEO_ID.test(id) ? { kind: "video", id } : null;
  }
  if (host !== "youtube.com") return null;

  if (url.pathname === "/playlist" && list && PLAYLIST_ID.test(list)) {
    return { kind: "playlist", id: list };
  }
  if (v && VIDEO_ID.test(v)) return { kind: "video", id: v };

  const shortMatch = url.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})/);
  if (shortMatch) return { kind: "video", id: shortMatch[1] };

  if (list && PLAYLIST_ID.test(list)) return { kind: "playlist", id: list };
  return null;
}

const thumbnailFor = (videoId: string) => `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function decodeJsonString(raw: string): string {
  try {
    return JSON.parse(`"${raw}"`);
  } catch {
    return raw;
  }
}

async function importVideo(id: string): Promise<ImportResult> {
  const watchUrl = `https://www.youtube.com/watch?v=${id}`;
  const res = await fetch(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`,
  );
  if (res.status === 404 || res.status === 401) {
    throw new ImportError(404, "That video could not be found. Check the link and try again.");
  }
  if (!res.ok) throw new Error(`oEmbed responded with ${res.status}`);

  const data = await res.json();
  const title = typeof data?.title === "string" && data.title.trim() ? data.title : "Untitled video";
  return {
    kind: "video",
    title,
    thumbnailUrl: thumbnailFor(id),
    lessons: [{ youtubeId: id, title }],
  };
}

// Playlist items arrive as "lockupViewModel" blocks, both in the page HTML and in
// continuation responses. Each block carries its video ID and its title.
function extractLockupVideos(text: string): Lesson[] {
  const found: Lesson[] = [];
  // Try multiple patterns for different YouTube layouts
  const patterns = [
    /"videoId":"([\w-]{11})".*?"title":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/gs,
    /"videoId":"([\w-]{11})","title":\{"simpleText":"((?:[^"\\]|\\.)*)"/gs,
    /"contentId":"([\w-]{11})".*?"title":\{"content":"((?:[^"\\]|\\.)*)"/gs,
    /"lockupViewModel":\{[^}]*?"contentId":"([\w-]{11})"[^}]*?"title":\{[^}]*?"content":"((?:[^"\\]|\\.)*)"/gs,
  ];
  
  for (const pattern of patterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      const title = match[2] ? decodeJsonString(match[2]).trim().replace(/\\n/g, ' ') || "Untitled video" : "Untitled video";
      found.push({
        youtubeId: match[1],
        title,
      });
    }
  }
  
  // Fallback: look for videoRenderer
  if (found.length === 0) {
    const blocks = text.split('"videoRenderer":{').slice(1);
    for (const block of blocks) {
      const idMatch = block.match(/"videoId":"([\w-]{11})"/);
      const titleMatch = block.match(/"title":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/);
      if (!idMatch) continue;
      const title = titleMatch ? decodeJsonString(titleMatch[1]).trim().replace(/\\n/g, ' ') || "Untitled video" : "Untitled video";
      found.push({
        youtubeId: idMatch[1],
        title,
      });
    }
  }
  
  // Another fallback: look for playlistVideoRenderer
  if (found.length === 0) {
    const blocks = text.split('"playlistVideoRenderer":{').slice(1);
    for (const block of blocks) {
      const idMatch = block.match(/"videoId":"([\w-]{11})"/);
      const titleMatch = block.match(/"title":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/);
      if (!idMatch) continue;
      const title = titleMatch ? decodeJsonString(titleMatch[1]).trim().replace(/\\n/g, ' ') || "Untitled video" : "Untitled video";
      found.push({
        youtubeId: idMatch[1],
        title,
      });
    }
  }
  
  return found;
}

function findContinuationToken(text: string): string | null {
  const matches = [
    ...text.matchAll(/"continuationCommand":\{"token":"((?:[^"\\]|\\.)*)"/g),
    ...text.matchAll(/"nextContinuationData":\{"continuation":"((?:[^"\\]|\\.)*)"/g),
    ...text.matchAll(/continuation":"((?:[^"\\]|\\.)*)"/g),
  ];
  return matches.length > 0 ? matches[matches.length - 1][1] : null;
}

async function importPlaylist(id: string): Promise<ImportResult> {
  const res = await fetch(`https://www.youtube.com/playlist?list=${id}`, {
    headers: { "User-Agent": BROWSER_USER_AGENT, "Accept-Language": "en-US,en;q=0.9" },
  });
  if (!res.ok) throw new Error(`Playlist page responded with ${res.status}`);

  const html = await res.text();
  const pageTitle = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
  const title =
    decodeEntities(pageTitle.replace(/\s*-\s*YouTube\s*$/, "")).trim() || "Untitled playlist";
  const apiKey = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1];
  const clientVersion = html.match(/"clientVersion":"([^"]+)"/)?.[1] ?? "2.20240101.00.00";

  const seen = new Set<string>();
  const lessons: Lesson[] = [];
  const addAll = (items: Lesson[]) => {
    for (const item of items) {
      if (seen.has(item.youtubeId)) continue;
      seen.add(item.youtubeId);
      lessons.push(item);
    }
  };

  addAll(extractLockupVideos(html));
  let token = findContinuationToken(html);

  for (let page = 0; token && apiKey && page < MAX_PLAYLIST_PAGES; page++) {
    const pageRes = await fetch(`https://www.youtube.com/youtubei/v1/browse?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": BROWSER_USER_AGENT,
        "Accept-Language": "en-US,en;q=0.9",
      },
      body: JSON.stringify({
        context: { client: { clientName: "WEB", clientVersion } },
        continuation: token,
      }),
    });
    if (!pageRes.ok) break;

    const pageText = await pageRes.text();
    const before = lessons.length;
    addAll(extractLockupVideos(pageText));
    if (lessons.length === before) break;
    token = findContinuationToken(pageText);
  }

  if (lessons.length === 0) {
    // Try alternative approach: fetch with different headers
    const res2 = await fetch(`https://www.youtube.com/playlist?list=${id}&hl=en`, {
      headers: { "User-Agent": BROWSER_USER_AGENT, "Accept-Language": "en-US,en;q=0.9" },
    });
    if (res2.ok) {
      const html2 = await res2.text();
      addAll(extractLockupVideos(html2));
    }
  }

  if (lessons.length === 0) {
    throw new ImportError(
      404,
      "No videos were found in that playlist. Make sure it is public and try again.",
    );
  }

  return {
    kind: "playlist",
    title,
    thumbnailUrl: thumbnailFor(lessons[0].youtubeId),
    lessons,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const body = await req.json().catch(() => null);
    const rawUrl = typeof body?.url === "string" ? body.url : "";
    const parsed = parseYouTubeUrl(rawUrl);
    if (!parsed) {
      return json({ error: "Paste a valid YouTube video or playlist link." }, 400);
    }

    const result =
      parsed.kind === "video" ? await importVideo(parsed.id) : await importPlaylist(parsed.id);
    return json(result);
  } catch (err) {
    if (err instanceof ImportError) return json({ error: err.message }, err.status);
    console.error(err);
    return json({ error: "Could not reach YouTube. Please try again." }, 502);
  }
});
