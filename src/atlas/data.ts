import type { Atlas, Entry, IndexRow, Seg, WordRef } from "./types";
import { MEDIA } from "./types";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const url = (p: string) => `${BASE}/atlas/${p}`;

interface IndexFile {
  id: string;
  name: string;
  count: number;
  examples: number;
  illustrated: number;
  chunk: number;
  topics: [string, string][];
  cefr: string[];
  words: IndexRow[];
}

export async function loadOpenAtlas(): Promise<Atlas> {
  const res = await fetch(url("index.json"));
  if (!res.ok) throw new Error(`词库索引加载失败（${res.status}）`);
  const idx = (await res.json()) as IndexFile;
  const words: WordRef[] = idx.words.map((r, order) => ({
    id: r[0],
    word: r[1],
    zh: r[2],
    ipa: r[3],
    cefr: r[4],
    topic: r[5],
    media: r[6],
    order,
  }));
  const byId = new Map(words.map((w) => [w.id, w]));
  const cache = new Map<string, Entry>();
  const pending = new Map<number, Promise<void>>();

  const loadChunk = (n: number) => {
    let p = pending.get(n);
    if (!p) {
      p = fetch(url(`entries/${n}.json`))
        .then((r) => {
          if (!r.ok) throw new Error(`词条加载失败（${r.status}）`);
          return r.json() as Promise<Entry[]>;
        })
        .then((list) => list.forEach((e) => cache.set(e.id, e)))
        .catch((e) => {
          pending.delete(n);
          throw e;
        });
      pending.set(n, p);
    }
    return p;
  };

  return {
    id: idx.id,
    name: idx.name,
    kind: "open",
    count: idx.count,
    examples: idx.examples,
    illustrated: idx.illustrated,
    topics: idx.topics,
    cefr: idx.cefr,
    words,
    byId,
    peek: (id) => cache.get(id),
    async entry(id) {
      const hit = cache.get(id);
      if (hit) return hit;
      const ref = byId.get(id);
      if (!ref) throw new Error(`没有找到词条 ${id}`);
      await loadChunk(Math.floor(ref.order / idx.chunk));
      const e = cache.get(id);
      if (!e) throw new Error(`没有找到词条 ${id}`);
      return e;
    },
    img: (ref, size = "full") =>
      ("media" in ref && typeof ref.media === "number" ? ref.media : (ref as Entry).m) & MEDIA.img
        ? url(`${size === "thumb" ? "thumb" : "img"}/${ref.id}.webp`)
        : null,
    audio(ref, kind) {
      const m = "media" in ref && typeof ref.media === "number" ? ref.media : (ref as Entry).m;
      const bit = MEDIA[kind];
      return m & bit ? url(`audio/${kind}/${ref.id}.mp3`) : null;
    },
  };
}

/** Rows from the legacy private catalog served only by the local dev server. */
interface PrivateWord {
  id: string;
  seq: number;
  word: string;
  meaning: string;
  phonetic: string;
  sentence: string;
  translation: string;
  hint: string;
  image?: string | null;
  uk?: string | null;
  us?: string | null;
  sentenceAudio?: string | null;
}

export async function loadPrivateAtlas(open: Atlas | null): Promise<Atlas | null> {
  let res: Response;
  try {
    res = await fetch("/local/catalog.json", { cache: "no-store" });
  } catch {
    return null;
  }
  if (!res.ok || !(res.headers.get("content-type") || "").includes("json")) return null;
  const cat = (await res.json()) as { id: string; name: string; words: PrivateWord[] };
  const entries = new Map<string, Entry>();
  const twins = new Map(open?.words.map((o) => [o.word.toLowerCase(), o]) ?? []);
  const words: WordRef[] = cat.words.map((w, order) => {
    const twin = twins.get(w.word.toLowerCase());
    const pos = (w.meaning.match(/·\s*([a-z]+\.)\s*$/) || [])[1] || "";
    const zh = w.meaning.replace(/\s*·\s*[a-z]+\.\s*$/, "");
    entries.set(w.id, {
      id: w.id,
      w: w.word,
      uk: w.phonetic,
      us: "",
      senses: [{ pos, zh, en: "" }],
      ex: w.sentence ? [{ en: w.sentence, zh: w.translation }] : [],
      col: [],
      fam: [],
      syn: [],
      ant: [],
      tip: w.hint,
      cefr: twin ? (open?.cefr[twin.cefr] ?? "B1") : "B1",
      topic: twin ? (open?.topics[twin.topic]?.[0] ?? "thinking") : "thinking",
      m: (w.image ? MEDIA.img : 0) | (w.uk ? MEDIA.uk : 0) | (w.us ? MEDIA.us : 0) | (w.sentenceAudio ? MEDIA.ex : 0),
      media: { img: w.image, uk: w.uk, us: w.us, ex: w.sentenceAudio },
    });
    return {
      id: w.id,
      word: w.word,
      zh: `${pos} ${zh}`.trim(),
      ipa: w.phonetic,
      cefr: twin?.cefr ?? 2,
      topic: twin?.topic ?? 16,
      media: entries.get(w.id)!.m,
      order,
    };
  });
  const byId = new Map(words.map((w) => [w.id, w]));
  const pick = (ref: WordRef | Entry) => entries.get(ref.id)?.media;
  return {
    id: cat.id,
    name: cat.name,
    kind: "private",
    count: words.length,
    examples: [...entries.values()].reduce((n, e) => n + e.ex.length, 0),
    illustrated: words.filter((w) => w.media & MEDIA.img).length,
    topics: open?.topics ?? [["thinking", "综合"]],
    cefr: open?.cefr ?? ["A1", "A2", "B1", "B2", "C1", "C2"],
    words,
    byId,
    peek: (id) => entries.get(id),
    entry: async (id) => {
      const e = entries.get(id);
      if (!e) throw new Error(`没有找到词条 ${id}`);
      return e;
    },
    img: (ref) => pick(ref)?.img ?? null,
    audio: (ref, kind) => pick(ref)?.[kind] ?? null,
  };
}

/* ---------- 英検 word books (filtered, Japanese-glossed views of the open atlas) ---------- */

export type Gloss = "ja" | "zh" | "both";
export type EikenBook = "eiken" | "eiken45";

export interface EikenData {
  id: string;
  name: string;
  cefr: string[];
  /** [id, American spelling, level index] in learning order. */
  words: [string, string, number][];
  /** Japanese gloss, kana reading and (optionally) furigana segments per kept sense. */
  ja: Record<string, [string, string, Seg[]?][]>;
  /** Example sentences rewritten in American spelling, where they differ. */
  ex: Record<string, string>;
  col: Record<string, string[]>;
  /** Indices of the senses to keep, when not all of them. */
  keep?: Record<string, number[]>;
  /** [pos, zh] of the first kept sense, when it is not the entry's first sense. */
  lab?: Record<string, [string, string]>;
  /** Words whose picture and example belong to a sense that was dropped. */
  noimg?: string[];
  /** Words not in the open atlas: text-only entries, read aloud by the device voice. */
  extra?: Record<string, { pos: string; zh: string; en: string; ipa: string; ex: [string, string]; t: number }>;
}

const EIKEN_FILES: Record<EikenBook, string> = { eiken: "eiken-pre2.json", eiken45: "eiken-45.json" };

export async function loadEikenData(book: EikenBook): Promise<EikenData> {
  const res = await fetch(url(EIKEN_FILES[book]));
  if (!res.ok) throw new Error(`英検词库加载失败（${res.status}）`);
  return (await res.json()) as EikenData;
}

export function buildEikenAtlas(open: Atlas, data: EikenData, gloss: Gloss): Atlas {
  const spelling = new Map(data.words.map(([id, us]) => [id, us]));
  const noimg = new Set(data.noimg ?? []);
  const extra = data.extra ?? {};
  const label = (id: string, zh: string): [string, Seg[] | undefined] => {
    const lab = data.lab?.[id];
    const base = lab ? `${lab[0]} ${lab[1]}` : zh;
    const ja = data.ja[id]?.[0];
    if (!ja || gloss === "zh") return [base, undefined];
    const pos = (base.match(/^[a-z]+\.(?:\s|$)/) || [""])[0];
    return [`${pos}${ja[0]}`.trim(), ja[2] ? [pos, ...ja[2]] : undefined];
  };
  const words: WordRef[] = [];
  data.words.forEach(([id, us, level]) => {
    const x = extra[id];
    const ref: WordRef | undefined = x ? { id, word: us, zh: `${x.pos} ${x.zh}`, ipa: x.ipa, cefr: 0, topic: x.t, media: 0, order: 0 } : open.byId.get(id);
    if (!ref) return;
    const [zh, rb] = label(id, ref.zh);
    const media = noimg.has(id) ? ref.media & ~(MEDIA.img | MEDIA.ex | MEDIA.ex2) : ref.media;
    words.push({ ...ref, word: us, zh, rb, cefr: level, media, order: words.length });
  });
  const byId = new Map(words.map((w) => [w.id, w]));
  const cache = new Map<string, Entry>();
  const rawExtra = (id: string): Entry => {
    const x = extra[id];
    return { id, w: spelling.get(id) ?? id, uk: x.ipa, us: x.ipa, senses: [{ pos: x.pos, zh: x.zh, en: x.en }], ex: [{ en: x.ex[0], zh: x.ex[1] }], col: [], fam: [], syn: [], ant: [], tip: "", cefr: "", topic: "", m: 0 };
  };
  const adapt = (e: Entry): Entry => {
    const hit = cache.get(e.id);
    if (hit) return hit;
    const ja = data.ja[e.id] ?? [];
    const keep = data.keep?.[e.id];
    const kept = keep ? keep.map((i) => e.senses[i]).filter(Boolean) : e.senses;
    const senses = kept.map((s, i) => {
      const j = ja[i];
      if (!j || gloss === "zh") return s;
      return { ...s, zh: gloss === "both" ? `${j[0]} ｜ ${s.zh}` : j[0], yomi: j[2] ? undefined : j[1] || undefined, ruby: j[2] && gloss === "both" ? [...j[2], ` ｜ ${s.zh}`] : j[2] };
    });
    const pictured = !noimg.has(e.id);
    const ex = pictured ? e.ex.slice(0, 1).map((x) => ({ en: data.ex[e.id] ?? x.en, zh: gloss === "ja" ? "" : x.zh })) : [];
    const out: Entry = {
      ...e,
      w: spelling.get(e.id) ?? e.w,
      senses,
      ex,
      col: data.col[e.id] ?? e.col,
      tip: gloss === "ja" ? "" : e.tip,
      cefr: data.cefr[byId.get(e.id)?.cefr ?? 0],
      m: pictured ? e.m & ~MEDIA.ex2 : e.m & ~(MEDIA.img | MEDIA.ex | MEDIA.ex2),
    };
    cache.set(e.id, out);
    return out;
  };
  return {
    ...open,
    id: data.id,
    name: data.name,
    count: words.length,
    examples: words.length,
    illustrated: words.filter((w) => w.media & MEDIA.img).length,
    cefr: data.cefr,
    words,
    byId,
    peek: (id) => {
      if (!byId.has(id)) return undefined;
      if (extra[id]) return adapt(rawExtra(id));
      const e = open.peek(id);
      return e ? adapt(e) : undefined;
    },
    async entry(id) {
      if (!byId.has(id)) throw new Error(`没有找到词条 ${id}`);
      return adapt(extra[id] ? rawExtra(id) : await open.entry(id));
    },
    img: (ref, size) => (noimg.has(ref.id) || extra[ref.id] ? null : open.img(ref, size)),
    audio: (ref, kind) => (extra[ref.id] || (noimg.has(ref.id) && kind !== "uk" && kind !== "us") ? null : open.audio(ref, kind)),
  };
}
