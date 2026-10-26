import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useAtlas } from "../atlas/context";
import { isEnglishName, store, type Settings } from "../store/store";

type Book = "eiken45" | "eiken" | "open";

const BOOKS: [Book, string, string][] = [
  ["eiken45", "英検5・4級", "约 960 词 · 日文释义带假名 · 美式拼写"],
  ["eiken", "英検準2級", "约 2,000 词 · 日文释义 · 美式拼写"],
  ["open", "雅思", "7,298 词 · 中文释义 · 英式拼写"],
];

const IELTS_LEVELS = [
  ["A2", "基础", "日常词还不太稳"],
  ["B1", "进阶", "目标 5.5 – 6 分"],
  ["B2", "中高", "目标 6.5 – 7 分"],
  ["C1", "高级", "冲刺 7.5 分以上"],
];

const START: Record<"eiken" | "eiken45", [string, string, string][]> = {
  eiken45: [
    ["5級", "从 5 级开始", "はじめての英単語から"],
    ["4級", "从 4 级开始", "5級の単語はもうわかる"],
  ],
  eiken: [
    ["A1", "从头开始", "英検5〜4級程度の単語から"],
    ["A2", "跳过最基础的词", "英検3級〜準2級の単語から"],
  ],
};

const GLOSSES: [Settings["gloss"], string][] = [
  ["ja", "日本語"],
  ["zh", "中文"],
  ["both", "中日对照"],
];

/** Asks for the learner's English name; shared by onboarding and the one-time prompt. */
export function NameField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const bad = value.length > 0 && !isEnglishName(value);
  return (
    <fieldset>
      <legend>你的英文名字</legend>
      <input
        className="name-input"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/^\s+/, ""))}
        placeholder="e.g. Mimi"
        maxLength={12}
        autoComplete="off"
        autoCapitalize="words"
        spellCheck={false}
        lang="en"
        aria-invalid={bad}
      />
      <small className={bad ? "warn-text" : "muted"}>{bad ? "请只用英文字母（最多 12 个字符）" : "会显示在导航栏，例如 “Mimi's”"}</small>
    </fieldset>
  );
}

export function NamePrompt() {
  const [name, setName] = useState("");
  const ok = isEnglishName(name.trim());
  return (
    <div className="onboard" role="dialog" aria-modal="true" aria-label="填写英文名字">
      <div className="onboard-card onboard-card-small">
        <div className="onboard-body">
          <p className="eyebrow">Hello!</p>
          <h1 className="display">What's your name?</h1>
          <NameField value={name} onChange={setName} />
          <button className="btn btn-primary btn-xl" disabled={!ok} onClick={() => store.settings({ name: name.trim() })}>
            好了 <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function Onboarding() {
  const atlas = useAtlas();
  const [name, setName] = useState(store.get().settings.name);
  const [book, setBook] = useState<Book>("eiken45");
  const [level, setLevel] = useState(0);
  const [ieltsLevel, setIeltsLevel] = useState(1);
  const [gloss, setGloss] = useState<Settings["gloss"]>("ja");
  const [goal, setGoal] = useState(10);
  const ok = isEnglishName(name.trim());
  const finish = () =>
    book === "open"
      ? store.settings({ onboarded: true, name: name.trim(), dataset: "open", startLevel: atlas.cefr.indexOf(IELTS_LEVELS[ieltsLevel][0]), dailyNew: goal })
      : store.settings({ onboarded: true, name: name.trim(), dataset: book, gloss, accent: "us", startLevel: level, dailyNew: goal });
  return (
    <div className="onboard" role="dialog" aria-modal="true" aria-label="欢迎">
      <div className="onboard-card">
        <img className="onboard-art" src={`${import.meta.env.BASE_URL}brand/hero.webp`} alt="" />
        <div className="onboard-body">
          <p className="eyebrow">欢迎来到词光</p>
          <h1 className="display">
            一词一画，
            <br />
            一颗颗点亮。
          </h1>
          <NameField value={name} onChange={setName} />
          <fieldset>
            <legend>选择词库</legend>
            <div className="choice-grid">
              {BOOKS.map(([key, title, desc]) => (
                <button
                  key={key}
                  className={`choice ${book === key ? "is-on" : ""}`}
                  onClick={() => {
                    setBook(key);
                    setLevel(0);
                  }}
                  aria-pressed={book === key}
                >
                  <b>{title}</b>
                  <small>{desc}</small>
                </button>
              ))}
            </div>
          </fieldset>
          {book !== "open" ? (
            <>
              <fieldset>
                <legend>从哪里出发？</legend>
                <div className="choice-grid">
                  {START[book].map(([code, title, desc], i) => (
                    <button key={code} className={`choice ${level === i ? "is-on" : ""}`} onClick={() => setLevel(i)} aria-pressed={level === i}>
                      <span className={`chip chip-level lv-${code}`}>{code}</span>
                      <b>{title}</b>
                      <small>{desc}</small>
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend>释义语言</legend>
                <div className="segmented segmented-wide">
                  {GLOSSES.map(([k, l]) => (
                    <button key={k} className={gloss === k ? "is-on" : ""} onClick={() => setGloss(k)} aria-pressed={gloss === k}>
                      {l}
                    </button>
                  ))}
                </div>
              </fieldset>
            </>
          ) : (
            <fieldset>
              <legend>你从哪里出发？</legend>
              <div className="choice-grid">
                {IELTS_LEVELS.map(([code, title, desc], i) => (
                  <button key={code} className={`choice ${ieltsLevel === i ? "is-on" : ""}`} onClick={() => setIeltsLevel(i)} aria-pressed={ieltsLevel === i}>
                    <span className={`chip chip-level lv-${code}`}>{code}</span>
                    <b>{title}</b>
                    <small>{desc}</small>
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          <fieldset>
            <legend>每天点亮几颗新星？</legend>
            <div className="segmented segmented-wide">
              {[5, 10, 15, 20].map((n) => (
                <button key={n} className={goal === n ? "is-on" : ""} onClick={() => setGoal(n)} aria-pressed={goal === n}>
                  {n} 颗{n === 10 ? " · 推荐" : ""}
                </button>
              ))}
            </div>
          </fieldset>
          <button className="btn btn-primary btn-xl" onClick={finish} disabled={!ok}>
            出发 <ArrowRight size={20} />
          </button>
          <p className="muted">{ok ? "不用注册。进度只留在这台设备上，各个词库的进度各自独立，随时可以在「我的」里切换。" : "先写下你的英文名字，再出发。"}</p>
        </div>
      </div>
    </div>
  );
}
