"use client";
/* ============================================================
   「AIを育てよう」— ファインチューニング体験ゲーム。
   学習データ（餌）を3回与えると、AIの性格がデータに引っ張られて
   変わっていく。同じ系統ばかり与えると過学習を起こす。
   すべてクライアント完結。
   ============================================================ */
import React from "react";
import { Badge, Button, Card } from "../ds";
import { unlock } from "../zukan/store";
import { ZukanNote } from "../zukan/collection";

type FoodKey = "neko" | "biz" | "haiku" | "slang" | "jiten";

const FOODS: { key: FoodKey; icon: string; label: string; sub: string }[] = [
  { key: "neko", icon: "🐱", label: "猫の写真 1万枚", sub: "かわいさの塊" },
  { key: "biz", icon: "📈", label: "ビジネス書 100冊", sub: "意識の高まり" },
  { key: "haiku", icon: "🌸", label: "俳句全集", sub: "五・七・五" },
  { key: "slang", icon: "💬", label: "ネットスラング大辞典", sub: "www" },
  { key: "jiten", icon: "📚", label: "百科事典ぜんぶ", sub: "知の重量挙げ" },
];

const QUESTIONS = ["「おはよう」と話しかけてみた", "「明日の天気は？」と聞いてみた", "「仕事つらい…」と相談してみた"];

/* 食生活（与えた餌の内訳）から返答を決める。
   strong: その系統を2回以上（過学習気味） / mild: 1回 */
const RESPONSES: Record<FoodKey, { strong: string[]; mild: string[] }> = {
  neko: {
    strong: [
      "おはにゃ。……にゃ？（もう猫のことしか考えられない）",
      "にゃあ。（窓の外をじっと見ている。猫的には晴れ）",
      "つらいときは、にゃんこの動画ですにゃ。はい🐾（肉球を差し出された）",
    ],
    mild: ["おはようございます🐱 今日もねこ日和ですね", "明日は晴れの予報です。猫が顔を洗っていないので", "おつかれさまです…そっと猫の画像を貼っておきますね🐈"],
  },
  biz: {
    strong: [
      "おはようございます。本日のKPIを確認しましょう。朝活はROIが高いです",
      "天気予報の確認は前日夜がベストプラクティスです。PDCAを回しましょう",
      "つらさを可視化しましょう。課題を因数分解すれば、打ち手が見えてきます",
    ],
    mild: ["おはようございます。今日のタスク、整理しておきますか？", "明日は晴れ。外回りのチャンスですね", "おつかれさまです。まずは休むのも立派な戦略ですよ"],
  },
  haiku: {
    strong: [
      "あさひさす　まどのむこうに　きみのこえ",
      "あすのそら　きくよりさきに　にしをみよ",
      "つらいよる　ちゃをいっぷくの　ゆげのなか",
    ],
    mild: ["おはようございます。朝の空気は五・七・五が似合いますね", "明日は晴れ。「雲ひとつ　ない空つづく　よい日かな」", "おつかれさまです。一句詠むと、心が少し軽くなりますよ"],
  },
  slang: {
    strong: [
      "おはワロタwww 今日も優勝していこうな✌️",
      "明日の天気？ワンチャン晴れ。外出るのはアリよりのアリ",
      "つらいのは草…じゃなくて、それはガチのやつ。無理せんとこ？",
    ],
    mild: ["おはようです！今日もぼちぼちいきましょ〜", "明日はたぶん晴れっぽいです。知らんけど", "それな…。今日は早く寝るのが正解かもです"],
  },
  jiten: {
    strong: [
      "おはようございます。「朝」とは夜明けから正午までの時間帯を指し、語源は「浅（あさ）」に由来するという説が——",
      "天気とは大気の状態を指す概念であり、気温・湿度・気圧・風などの要素から——（まだ続いている）",
      "「疲労」は生理的疲労と精神的疲労に大別されます。まず1878年の研究によれば——",
    ],
    mild: ["おはようございます。ちなみに今日は歴史的には○○の日です", "明日は晴れ。参考までに、天気予報の的中率は約85%です", "おつかれさまです。休息の効用は科学的にも実証されていますよ"],
  },
};

const BALANCED = [
  "おはようございます！今日はどんな一日にしましょうか",
  "明日は晴れの予報です。おでかけ日和ですよ",
  "おつかれさまです。話、聞きますよ。ゆっくりいきましょう",
];

function dominant(diet: FoodKey[]): { key: FoodKey | null; count: number } {
  const counts = new Map<FoodKey, number>();
  for (const d of diet) counts.set(d, (counts.get(d) ?? 0) + 1);
  let best: FoodKey | null = null;
  let bestN = 0;
  for (const [k, n] of counts) if (n > bestN) [best, bestN] = [k, n];
  return { key: best, count: bestN };
}

function respond(diet: FoodKey[], qIndex: number): string {
  const { key, count } = dominant(diet);
  if (!key) return "……（まだ何も学習していないので、無の表情をしている）";
  if (count >= 2) return RESPONSES[key].strong[qIndex];
  /* 全部バラバラなら、直近に食べたものの mild 反応 */
  const last = diet[diet.length - 1];
  return RESPONSES[last].mild[qIndex] ?? BALANCED[qIndex];
}

function faceFor(diet: FoodKey[]): string {
  const { key, count } = dominant(diet);
  if (!key) return "🤖";
  if (count >= 3) return { neko: "😺", biz: "🤵", haiku: "🎎", slang: "😎", jiten: "🧐" }[key];
  if (count >= 2) return { neko: "🐱", biz: "📊", haiku: "🌸", slang: "😏", jiten: "📖" }[key];
  return "🤖";
}

function finalResult(diet: FoodKey[]): { id: string; name: string; emoji: string; verdict: string; lesson: string } {
  const { key, count } = dominant(diet);
  const labels: Record<FoodKey, string> = { neko: "ネコ", biz: "ビジネス", haiku: "俳句", slang: "ネットノリ", jiten: "百科事典" };
  if (key && count === 3)
    return {
      id: key,
      name: `${labels[key]}過学習モデル v3`,
      emoji: "🌀",
      verdict: `何を聞いても${labels[key]}の話しかしなくなりました。かわいい（面白い）けど実用性はほぼゼロ。これが「過学習」です。`,
      lesson: "同じ系統のデータばかり学習させると、AIはそれ以外の反応ができなくなります。現実のAI開発でも「学習データの偏り」はそのままAIの偏りになります。",
    };
  if (key && count === 2)
    return {
      id: `almost-${key}`,
      name: `ほぼ${labels[key]}モデル`,
      emoji: "🎭",
      verdict: `${labels[key]}に強く引っ張られた個性派AIになりました。専門特化としてはアリ。ただし他の話題はちょっと苦手そうです。`,
      lesson: "データを寄せれば「その道のAI」が作れる——これがファインチューニングの狙いです。問題は、寄せすぎると戻れないこと。",
    };
  return {
    id: "balance",
    name: "バランス型モデル",
    emoji: "🎓",
    verdict: "幅広い話題にそつなく対応できる、優等生AIに育ちました。とがった芸はないけど、実務ではこういう子がいちばん頼れます。",
    lesson: "多様なデータをバランスよく学習させると、汎用性の高いAIになります。「何を食べさせるか」がAIの人格を決める——それがファインチューニングです。",
  };
}

export function SodateGame() {
  const [diet, setDiet] = React.useState<FoodKey[]>([]);
  const [eating, setEating] = React.useState(false);
  const [log, setLog] = React.useState<{ q: string; a: string }[]>([]);

  const feed = (key: FoodKey) => {
    if (eating || diet.length >= 3) return;
    setEating(true);
    const next = [...diet, key];
    setTimeout(() => {
      setDiet(next);
      setLog((l) => [...l, { q: QUESTIONS[next.length - 1], a: respond(next, next.length - 1) }]);
      setEating(false);
    }, 900);
  };

  const reset = () => {
    setDiet([]);
    setLog([]);
  };

  const done = diet.length >= 3;
  const result = done ? finalResult(diet) : null;

  /* 図鑑：隠し部屋の発見＋育成したモデルを記録 */
  React.useEffect(() => unlock("rooms", "sodate"), []);
  React.useEffect(() => {
    if (result) unlock("sodate", result.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);
  const shareText = result
    ? `AIを育てたら【${result.name}】${result.emoji}になった。\n最後の返事：「${log[2]?.a.slice(0, 40)}…」\nあなたはどんなAIに育てる？\n#今さら聞けないAI用語集`
    : "";
  const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent("https://comixai.dev/sodate")}`;

  return (
    <div>
      <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
        {/* AIの顔 */}
        <div style={{ padding: "26px 24px 20px", textAlign: "center", background: "var(--paper-100)", borderBottom: "var(--bw-line) solid var(--ink-900)" }}>
          <div style={{ fontSize: 64, lineHeight: 1.2 }} className={eating ? "tok-spin" : undefined}>
            {eating ? "😋" : faceFor(diet)}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
            学習回数 {diet.length}/3{eating && "（もぐもぐ…）"}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 8, minHeight: 26 }}>
            {diet.map((d, i) => (
              <span key={i} className="game-in" style={{ fontSize: 20 }}>
                {FOODS.find((f) => f.key === d)?.icon}
              </span>
            ))}
          </div>
        </div>

        {/* 餌選び or 結果 */}
        {!done ? (
          <div style={{ padding: "18px 20px 22px" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15, marginBottom: 12 }}>
              <i className="ph-bold ph-bowl-food" style={{ color: "var(--red-600)" }} /> {diet.length === 0 ? "最初の学習データを与えよう" : "次は何を学習させる？"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
              {FOODS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  disabled={eating}
                  onClick={() => feed(f.key)}
                  style={{
                    textAlign: "center",
                    fontFamily: "var(--font-heading)",
                    fontWeight: 700,
                    fontSize: 13,
                    padding: "12px 10px",
                    borderRadius: "var(--radius-md)",
                    border: "var(--bw-line) solid var(--ink-900)",
                    background: "var(--paper-0)",
                    cursor: eating ? "wait" : "pointer",
                    boxShadow: "var(--shadow-pop-sm)",
                    opacity: eating ? 0.6 : 1,
                  }}
                >
                  <span style={{ fontSize: 26, display: "block", marginBottom: 4 }}>{f.icon}</span>
                  {f.label}
                  <span style={{ display: "block", fontFamily: "var(--font-hand)", fontWeight: 400, fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>{f.sub}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          result && (
            <div style={{ padding: "22px 24px 26px", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.14em", color: "var(--red-600)", fontWeight: 700, marginBottom: 8 }}>
                TRAINING COMPLETE — 育成完了
              </div>
              <div style={{ fontSize: 40, lineHeight: 1 }}>{result.emoji}</div>
              <h2 style={{ margin: "6px 0 10px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(22px,3.6vw,30px)" }}>{result.name}</h2>
              <p style={{ margin: "0 auto 14px", fontSize: 14, lineHeight: 1.9, color: "var(--text-body)", maxWidth: 460 }}>{result.verdict}</p>
              <div style={{ textAlign: "left", border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--yellow-400)", padding: "12px 16px", margin: "0 0 18px" }}>
                <Badge tone="ink">まなび</Badge>
                <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.85, fontWeight: 700 }}>{result.lesson}</p>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <a href={intent} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                  <Button variant="ink" size="md" iconRight={<i className="ph-bold ph-arrow-up-right" />}>
                    育成結果をXでシェア
                  </Button>
                </a>
                <Button variant="secondary" size="md" onClick={reset} iconRight={<i className="ph-bold ph-arrows-clockwise" />}>
                  別の子を育てる
                </Button>
              </div>
              <ZukanNote />
            </div>
          )
        )}
      </Card>

      {/* 会話ログ */}
      {log.length > 0 && (
        <div style={{ marginTop: 20, display: "grid", gap: 12 }}>
          {log.map((entry, i) => (
            <div key={i} className="game-in">
              <div style={{ fontFamily: "var(--font-hand)", fontSize: 14, color: "var(--text-muted)", marginBottom: 4 }}>{entry.q}</div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ flex: "none", fontSize: 24 }}>🤖</span>
                <div style={{ background: "var(--paper-0)", border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: 14, lineHeight: 1.8, boxShadow: "var(--shadow-pop-sm)" }}>
                  {entry.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
