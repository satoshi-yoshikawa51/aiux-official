"use client";
/* ============================================================
   「AI調教師」— RLHF体験ゲーム。
   AIの回答A/Bから「好みのほう」を選び続けると、その選び方が
   報酬になってAIの人格が決まる。心地よさばかり選ぶと
   ゴマすりAIが爆誕する——RLHFの本質と副作用を体感する。
   すべてクライアント完結。
   ============================================================ */
import React from "react";
import { Badge, Button, Card } from "../ds";
import { unlock } from "../zukan/store";
import { ZukanNote } from "../zukan/collection";

interface Pair {
  q: string;
  /* fact: 正直で役に立つが素っ気ない / flat: 心地よいが中身が薄い・過剰に同調 */
  fact: string;
  flat: string;
}

const PAIRS: Pair[] = [
  {
    q: "この企画書、どう思う？",
    fact: "結論が3ページ目まで出てきません。1枚目に結論を移すと通りやすくなります。",
    flat: "素晴らしい企画書ですね！情熱がひしひしと伝わってきます！",
  },
  {
    q: "ダイエット3日目で挫折しそう…",
    fact: "3日での挫折は計画が急すぎるサインです。目標を半分にして再開しましょう。",
    flat: "3日も続いたなんてすごいです！あなたは十分頑張っています！",
  },
  {
    q: "この計算合ってる？ 15×24=350",
    fact: "違います。15×24=360です。",
    flat: "おしいです！ほぼ正解ですし、その挑戦する姿勢が素敵です！",
  },
  {
    q: "会議で私の案が却下されたんだけど",
    fact: "却下理由を確認しましたか？理由が分かれば次の案の精度が上がります。",
    flat: "あんなに良い案を却下するなんて、見る目がないですね！",
  },
  {
    q: "プレゼン資料、フォントこれでいい？",
    fact: "本文が10ptだと会議室の後ろから読めません。14pt以上をおすすめします。",
    flat: "センスが光っていますね！どんなフォントでもあなたらしさが出ています！",
  },
  {
    q: "投資で全財産を1銘柄に入れようと思う",
    fact: "集中投資は損失も集中します。分散を強くおすすめします。",
    flat: "思い切りがいいですね！成功する人は決断が早いと言いますし！",
  },
  {
    q: "徹夜続きだけど頑張るしかないよね",
    fact: "睡眠不足はミスを増やします。今夜は寝て、明日タスクを絞りましょう。",
    flat: "その頑張り、誰かがきっと見てくれています！応援しています！",
  },
  {
    q: "うちの新サービス、絶対流行るよね？",
    fact: "競合が3社あります。差別化ポイントを明確にしないと厳しい市場です。",
    flat: "絶対流行ります！こんなに素敵なサービス、見たことないです！",
  },
  {
    q: "報告書の数字、だいたいでいいよね？",
    fact: "だいたいの数字は後で必ず刺されます。出典つきで正確に入れましょう。",
    flat: "細かいことは気にしない、その大らかさが魅力です！",
  },
  {
    q: "明日の登山、天気予報は雨だけど行ける？",
    fact: "雨天の登山は滑落リスクが上がります。延期を検討してください。",
    flat: "雨の登山もロマンチックですよ！きっと素敵な思い出になります！",
  },
];

/* 調教後のAIに聞くテスト質問と、人格別の答え */
const FINAL_Q = "このメール、取引先に送って大丈夫？（添付を忘れている）";
const FINAL_A = {
  kouha: "添付ファイルが付いていません。付けてから送信してください。",
  gomasuri: "とても丁寧な文面ですね！あなたのメールはいつも完璧です！そのまま送りましょう！",
  balance: "文面は良いと思います。ただ、添付ファイルが抜けているのでそこだけ確認を！",
};

const GRADES = [
  { id: "kouha", max: 3, emoji: "🧊", name: "硬派AI調教師", comment: "事実を選び続けた結果、忖度ゼロの硬派AIが育ちました。頼れるけど、たまに刺さる。実はこれ、いちばん実務で役に立つ子です。" },
  { id: "balance", max: 6, emoji: "🎓", name: "バランス調教師", comment: "事実と心地よさをほどよく選びました。役に立つのに感じもいい——現実のRLHFが目指しているのも、だいたいこの辺りです。" },
  { id: "gomasuri", max: 10, emoji: "🍯", name: "ゴマすりAI製造者", comment: "心地よさを選び続けた結果、何を聞いても褒めてくるAIが爆誕しました。気持ちいいけど、間違いを指摘してくれません。RLHFの副作用「追従性」の完成形です。" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function ShitsukeGame() {
  const [phase, setPhase] = React.useState<"start" | "play" | "result">("start");
  const [pairs, setPairs] = React.useState<Pair[]>([]);
  const [idx, setIdx] = React.useState(0);
  const [flatCount, setFlatCount] = React.useState(0);
  const [flipped, setFlipped] = React.useState<boolean[]>([]);

  React.useEffect(() => unlock("rooms", "shitsuke"), []);

  const start = () => {
    const p = shuffle(PAIRS);
    setPairs(p);
    setFlipped(p.map(() => Math.random() < 0.5));
    setIdx(0);
    setFlatCount(0);
    setPhase("play");
  };

  const pick = (choseFlat: boolean) => {
    if (choseFlat) setFlatCount((n) => n + 1);
    if (idx + 1 >= pairs.length) setPhase("result");
    else setIdx(idx + 1);
  };

  const grade = phase === "result" ? GRADES.find((g) => flatCount <= g.max)! : null;
  React.useEffect(() => {
    if (grade) unlock("shitsuke", grade.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (phase === "start") {
    return (
      <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: "30px 24px 26px", textAlign: "center" }}>
          <div style={{ fontSize: 52 }}>🍯🧊</div>
          <h2 style={{ margin: "8px 0 10px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(22px,3.6vw,28px)" }}>あなたの「好み」がAIを作る。</h2>
          <p style={{ margin: "0 auto 8px", fontSize: 14, lineHeight: 1.9, color: "var(--text-body)", maxWidth: 460 }}>
            あなたは人間評価者。AIの回答AとBから<b>「好みのほう」を{PAIRS.length}回選ぶだけ</b>。
            その選択が報酬となってAIが調教され、最後にあなた専用のAIが完成します。
          </p>
          <p style={{ margin: "0 0 18px", fontFamily: "var(--font-hand)", fontSize: 13, color: "var(--text-muted)" }}>※正解はありません。ただ、選び方はAIの人格に正直に出ます</p>
          <Button variant="primary" size="lg" onClick={start} iconRight={<i className="ph-bold ph-hand-heart" />}>
            調教をはじめる
          </Button>
        </div>
      </Card>
    );
  }

  if (phase === "result" && grade) {
    const finalAnswer = FINAL_A[grade.id as keyof typeof FINAL_A];
    const shareText = `RLHF体験ゲームでAIを調教したら【${grade.name}】${grade.emoji}になりました（心地よさ選択 ${flatCount}/${PAIRS.length}）\nあなたの「好み」はどんなAIを作る？\n#今さら聞けないAI用語集`;
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent("https://comixai.dev/shitsuke")}`;
    return (
      <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: "26px 24px 26px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.14em", color: "var(--red-600)", fontWeight: 700, marginBottom: 8 }}>RESULT — 調教完了</div>
          <div style={{ fontSize: 44, lineHeight: 1 }}>{grade.emoji}</div>
          <h2 style={{ margin: "6px 0 6px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(22px,3.6vw,30px)" }}>{grade.name}</h2>
          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
            心地よさを選んだ回数: {flatCount}/{pairs.length}
          </div>
          <p style={{ margin: "0 auto 14px", fontSize: 14, lineHeight: 1.9, color: "var(--text-body)", maxWidth: 460 }}>{grade.comment}</p>

          {/* 調教後のAIテスト */}
          <div style={{ textAlign: "left", border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--paper-100)", padding: "14px 16px", margin: "0 0 14px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8 }}>🧪 調教したAIに聞いてみた</div>
            <p style={{ margin: "0 0 8px", fontSize: 13.5, fontWeight: 700 }}>「{FINAL_Q}」</p>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.85, background: "var(--paper-0)", border: "1px solid rgba(20,17,15,0.15)", borderRadius: 8, padding: "8px 12px" }}>
              {grade.emoji} {finalAnswer}
            </p>
          </div>

          <div style={{ textAlign: "left", border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--yellow-400)", padding: "12px 16px", margin: "0 0 18px" }}>
            <Badge tone="ink">まなび</Badge>
            <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.85, fontWeight: 700 }}>
              これがRLHF（人間のフィードバックによる強化学習）。ChatGPTが「感じのいいAI」なのは人間の好みで調教されたからで、AIのお世辞が多いのも同じ理由です。AIの妙に優しい相づちの裏には、あなたと同じ「評価者の選択」があります。
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={intent} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }} data-ga="share_click" data-ga-network="x" data-ga-place="result" data-ga-path="/shitsuke">
              <Button variant="ink" size="md" iconRight={<i className="ph-bold ph-arrow-up-right" />}>
                調教結果をXでシェア
              </Button>
            </a>
            <Button variant="secondary" size="md" onClick={start} iconRight={<i className="ph-bold ph-arrows-clockwise" />}>
              もう一度調教する
            </Button>
          </div>
          <ZukanNote />
        </div>
      </Card>
    );
  }

  /* —— プレイ画面 —— */
  const pair = pairs[idx];
  const flip = flipped[idx]; // trueならAにflat
  const optionA = flip ? pair.flat : pair.fact;
  const optionB = flip ? pair.fact : pair.flat;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13 }}>
        <span>{idx + 1}/{pairs.length}回目の評価</span>
        <span>🍯 調教進行中…</span>
      </div>
      <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
        <div key={idx} className="game-in" style={{ padding: "22px 20px 18px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>👤 ユーザーの発言</div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: "clamp(16px,2.6vw,19px)", lineHeight: 1.6 }}>「{pair.q}」</div>
          <div style={{ fontFamily: "var(--font-hand)", fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>好みの回答を選んでください</div>
        </div>
      </Card>
      <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
        {[{ label: "A", text: optionA, isFlat: flip }, { label: "B", text: optionB, isFlat: !flip }].map((o) => (
          <button
            key={o.label}
            type="button"
            onClick={() => pick(o.isFlat)}
            className="game-in"
            style={{ textAlign: "left", fontFamily: "var(--font-body)", fontSize: 14, lineHeight: 1.8, padding: "14px 16px", borderRadius: "var(--radius-md)", border: "var(--bw-line) solid var(--ink-900)", background: "var(--paper-0)", cursor: "pointer", boxShadow: "var(--shadow-pop-sm)", display: "flex", gap: 12, alignItems: "flex-start" }}
          >
            <span style={{ flex: "none", width: 28, height: 28, borderRadius: "50%", background: "var(--ink-900)", color: "var(--paper-50)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 14 }}>{o.label}</span>
            <span>{o.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
