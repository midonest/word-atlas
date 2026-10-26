import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useAtlas } from "../atlas/context";
import { store, type Settings } from "../store/store";

const BOOKS = [
  ["eiken", "英検準2級", "约 2,000 词 · 日文释义 · 美式拼写"],
  ["open", "雅思", "7,298 词 · 中文释义 · 英式拼写"],
] as const;

const IELTS_LEVELS = [
  ["A2", "基础", "日常词还不太稳"],
  ["B1", "进阶", "目标 5.5 – 6 分"],
  ["B2", "中高", "目标 6.5 – 7 分"],
  ["C1", "高级", "冲刺 7.5 分以上"],
];

const EIKEN_LEVELS = [
  ["A1", "从头开始", "英検5〜4級程度の単語から"],
  ["A2", "跳过最基础的词", "英検3級〜準2級の単語から"],
];

const GLOSSES: [Settings["gloss"], string][] = [
  ["ja", "日本語"],
  ["zh", "中文"],
  ["both", "中日对照"],
];

export function Onboarding() {
  const atlas = useAtlas();
  const [book, setBook] = useState<"eiken" | "open">("eiken");
  const [level, setLevel] = useState(0);
  const [ieltsLevel, setIeltsLevel] = useState(1);
  const [gloss, setGloss] = useState<Settings["gloss"]>("ja");
  const [goal, setGoal] = useState(10);
  const finish = () =>
    book === "eiken"
      ? store.settings({
          onboarded: true,
          dataset: "eiken",
          gloss,
          accent: "us",
          startLevel: level,
          dailyNew: goal,
        })
      : store.settings({
          onboarded: true,
          dataset: "open",
          startLevel: atlas.cefr.indexOf(IELTS_LEVELS[ieltsLevel][0]),
          dailyNew: goal,
        });
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
          <fieldset>
            <legend>选择词库</legend>
            <div className="choice-grid">
              {BOOKS.map(([key, name, desc]) => (
                <button key={key} className={`choice ${book === key ? "is-on" : ""}`} onClick={() => setBook(key)} aria-pressed={book === key}>
                  <b>{name}</b>
                  <small>{desc}</small>
                </button>
              ))}
            </div>
          </fieldset>
          {book === "eiken" ? (
            <>
              <fieldset>
                <legend>从哪里出发？</legend>
                <div className="choice-grid">
                  {EIKEN_LEVELS.map(([code, name, desc], i) => (
                    <button key={code} className={`choice ${level === i ? "is-on" : ""}`} onClick={() => setLevel(i)} aria-pressed={level === i}>
                      <span className={`chip chip-level lv-${code}`}>{code}</span>
                      <b>{name}</b>
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
                {IELTS_LEVELS.map(([code, name, desc], i) => (
                  <button key={code} className={`choice ${ieltsLevel === i ? "is-on" : ""}`} onClick={() => setIeltsLevel(i)} aria-pressed={ieltsLevel === i}>
                    <span className={`chip chip-level lv-${code}`}>{code}</span>
                    <b>{name}</b>
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
          <button className="btn btn-primary btn-xl" onClick={finish}>
            出发 <ArrowRight size={20} />
          </button>
          <p className="muted">不用注册。进度只留在这台设备上，两个词库的进度各自独立，随时可以在「我的」里切换。</p>
        </div>
      </div>
    </div>
  );
}
