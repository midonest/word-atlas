import type { Seg } from "../atlas/types";

/** A meaning label; Japanese glosses with furigana render every kanji with its reading. */
export function Gloss({ text, ruby }: { text: string; ruby?: Seg[] }) {
  if (!ruby) return <>{text}</>;
  return (
    <span className="gloss" lang="ja">
      {ruby.map((s, i) =>
        typeof s === "string" ? (
          <span key={i}>{s}</span>
        ) : (
          <ruby key={i}>
            {s[0]}
            <rt>{s[1]}</rt>
          </ruby>
        ),
      )}
    </span>
  );
}
