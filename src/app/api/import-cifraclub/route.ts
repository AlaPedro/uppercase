import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED_HOSTS = new Set(["www.cifraclub.com.br", "cifraclub.com.br"]);

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCharCode(parseInt(h, 16)),
    );
}

/**
 * Cifra Club envolve tablaturas em <span class="tablatura">…</span>
 * (às vezes com <span class="cnt">…</span> dentro). Remove o bloco inteiro.
 */
function stripTablaturaSpans(html: string): string {
  let result = html;

  const findNextTablaturaOpen = (from: number): number => {
    let i = from;
    while (i < result.length) {
      const lt = result.indexOf("<span", i);
      if (lt === -1) return -1;
      const gt = result.indexOf(">", lt);
      if (gt === -1) return -1;
      const openTag = result.slice(lt, gt + 1);
      if (/\btablatura\b/i.test(openTag)) return lt;
      i = lt + 5;
    }
    return -1;
  };

  for (;;) {
    const start = findNextTablaturaOpen(0);
    if (start === -1) break;

    const openEnd = result.indexOf(">", start);
    if (openEnd === -1) break;

    let depth = 1;
    let i = openEnd + 1;
    while (i < result.length && depth > 0) {
      const nextOpen = result.indexOf("<span", i);
      const closeLower = result.toLowerCase().indexOf("</span>", i);
      if (closeLower === -1) {
        result = result.slice(0, start);
        return result;
      }
      if (nextOpen !== -1 && nextOpen < closeLower) {
        depth += 1;
        i = nextOpen + 5;
      } else {
        depth -= 1;
        i = closeLower + 7;
      }
    }

    if (depth !== 0) break;
    result = result.slice(0, start) + result.slice(i);
  }

  return result;
}

/** Junta quebras criadas ao remover tablaturas: elimina linhas só com espaço. */
function collapseEmptyLines(s: string): string {
  let out = s.replace(/\r\n/g, "\n").trim();
  let prev = "";
  while (prev !== out) {
    prev = out;
    out = out.replace(/\n[ \t\u00a0]*\n/g, "\n");
  }
  return out;
}

function preInnerHtmlToPlain(html: string): string {
  let s = stripTablaturaSpans(html)
    .replace(/\r\n/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<b[^>]*>/gi, "").replace(/<\/b>/gi, "");
  let prev = "";
  while (prev !== s) {
    prev = s;
    s = s.replace(/<span[^>]*>/gi, "").replace(/<\/span>/gi, "");
  }
  s = s.replace(/<[^>]+>/g, "");
  return decodeHtmlEntities(s);
}

function isChordToken(tok: string): boolean {
  if (!tok || tok === "|") return true;
  if (/^(N\.C\.|N\/C|N\/A|x)$/i.test(tok)) return true;
  if (/^[A-G](?:#|b|bb)?[\w°º#/+().\-]*$/i.test(tok)) {
    if (/[hjktqwxyzHJKTQWXYZ]/.test(tok)) return false;
    return true;
  }
  return false;
}

function isChordOnlyLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (/[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇüÜ]/.test(line)) return false;
  if (/^\s*[A-Ga-g]\|/.test(line)) return false;
  const withoutSections = line.replace(/\[[^\]]+\]/g, " ");
  const wo = withoutSections.trim();
  if (!wo) return false;
  const tokens = wo.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  return tokens.every(isChordToken);
}

function normalizeChordLine(line: string): string {
  return line.replace(/\s+$/, "");
}

type Row = { lyric: string; chord: string };

function parsePrePlainToRows(plain: string): Row[] {
  const lines = plain.replace(/\r\n/g, "\n").split("\n");
  const rows: Row[] = [];
  let pendingChord = "";

  const flushPending = () => {
    if (!pendingChord) return;
    rows.push({ lyric: "", chord: pendingChord });
    pendingChord = "";
  };

  for (const line of lines) {
    const sectionChords = line.match(/^(\[[^\]]+\])\s+(.+)$/);
    if (sectionChords && isChordOnlyLine(sectionChords[2])) {
      flushPending();
      rows.push({
        lyric: sectionChords[1],
        chord: normalizeChordLine(sectionChords[2]),
      });
      continue;
    }

    if (isChordOnlyLine(line)) {
      flushPending();
      pendingChord = normalizeChordLine(line);
      continue;
    }

    if (pendingChord) {
      rows.push({ lyric: line, chord: pendingChord });
      pendingChord = "";
    } else {
      rows.push({ lyric: line, chord: "" });
    }
  }

  flushPending();
  return rows.filter(
    (r) => r.lyric.trim() !== "" || r.chord.trim() !== "",
  );
}

function pickLargestPre(html: string): string | null {
  const matches = [...html.matchAll(/<pre[^>]*>([\s\S]*?)<\/pre>/gi)];
  if (matches.length === 0) return null;
  let best = matches[0]![1];
  for (let i = 1; i < matches.length; i++) {
    const inner = matches[i]![1];
    if (inner.length > best.length) best = inner;
  }
  return best;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const url =
    typeof body === "object" &&
    body !== null &&
    "url" in body &&
    typeof (body as { url: unknown }).url === "string"
      ? (body as { url: string }).url.trim()
      : "";

  if (!url) {
    return NextResponse.json({ error: "URL ausente" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "URL inválida" }, { status: 400 });
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json({ error: "URL inválida" }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    return NextResponse.json(
      { error: "Somente links do cifraclub.com.br" },
      { status: 400 },
    );
  }

  const res = await fetch(parsed.toString(), {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Uppercase/1.0",
      "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: `Não foi possível baixar a página (${res.status})` },
      { status: 502 },
    );
  }

  const html = await res.text();
  const preInner = pickLargestPre(html);
  if (!preInner) {
    return NextResponse.json(
      { error: "Não encontrei o bloco de cifra (<pre>) na página" },
      { status: 422 },
    );
  }

  const plain = collapseEmptyLines(preInnerHtmlToPlain(preInner));
  const rows = parsePrePlainToRows(plain);
  const text = rows.map((r) => r.lyric).join("\n");
  const chordLines = rows.map((r) => r.chord);

  return NextResponse.json({ text, chordLines });
}
