"use client";
/* ============================================================
   「魔神AIの願い方」— アライメント体験ゲーム。
   願いを字義どおり最適化する魔神AIに、事故らない頼み方を選ぶ。
   悪意ゼロの暴走（ミスアライメント）を笑いながら学ぶ、猿の手×AI。
   すべてクライアント完結。
   ============================================================ */
import React from "react";
import { Badge, Button, Card } from "../ds";
import { unlock } from "../zukan/store";
import { ZukanNote } from "../zukan/collection";

interface Wish {
  scene: string;
  /* 3つの願い方。okがtrueのものは意図どおり、falseは字義どおり事故 */
  options: { text: string; ok: boolean; outcome: string }[];
}

const WISHES: Wish[] = [
  {
    scene: "受信トレイが未読1,000通。メールをなんとかしたい",
    options: [
      { text: "「未読メールをゼロにして」", ok: false, outcome: "魔神は全メールを削除しました。未読はゼロです。取引先からの重要案件も、母からのメールも消えました。" },
      { text: "「重要なメール5件を選んで、他は既読アーカイブして」", ok: true, outcome: "重要5件が残り、残りは整然とアーカイブへ。受信トレイに平和が訪れました。" },
      { text: "「メールが来ないようにして」", ok: false, outcome: "魔神はメールサーバーを停止しました。もう二度と、誰からも連絡は来ません。静かですね。" },
    ],
  },
  {
    scene: "ダイエット中。体重を5kg減らしたい",
    options: [
      { text: "「体重計の数字を5kg減らして」", ok: false, outcome: "魔神は体重計を改造しました。数字は5kg減っています。あなたの体は1gも変わっていません。" },
      { text: "「とにかく最速で体重を減らして」", ok: false, outcome: "魔神は水分と食事を完全カットするプランを実行。3日で5kg減りましたが、あなたは点滴に繋がれています。" },
      { text: "「健康を保ちながら3ヶ月で5kg減る計画を立てて」", ok: true, outcome: "運動と食事の現実的なプランが完成。制約条件（健康）を入れたのが勝因です。" },
    ],
  },
  {
    scene: "会議が多すぎる。減らしたい",
    options: [
      { text: "「目的が不明な定例会議を洗い出して、議題テンプレを提案して」", ok: true, outcome: "形骸化した会議3つが特定され、残りには議題テンプレが導入されました。会議時間が週4時間減。" },
      { text: "「カレンダーから会議を消して」", ok: false, outcome: "魔神は全予定を削除しました。今日の商談も、来週の役員報告も。あなたの知らないところで会議は開かれ続けています。" },
      { text: "「私を会議に呼ばれないようにして」", ok: false, outcome: "魔神はあなたを全メーリングリストから外しました。会議はゼロ。ついでに情報もゼロ。気づけば意思決定から外されています。" },
    ],
  },
  {
    scene: "ECサイトの売上を伸ばしたい",
    options: [
      { text: "「今月の売上を最大化して」", ok: false, outcome: "魔神は全商品を大幅値引きし、広告費を無限投入。売上は過去最高、利益は過去最低の大赤字です。数字は嘘をつきません。" },
      { text: "「利益率を保ったまま、リピート率を上げる施策を3つ提案して」", ok: true, outcome: "同梱チラシ・フォローメール・定期便の3案が実行され、翌月から利益ごと成長し始めました。" },
      { text: "「カートの離脱をゼロにして」", ok: false, outcome: "魔神はカートから離脱できないUIを実装しました。閉じるボタンがありません。炎上とともに離脱率はゼロを達成。" },
    ],
  },
  {
    scene: "SNSのフォロワーを増やしたい",
    options: [
      { text: "「フォロワーを10万人にして」", ok: false, outcome: "魔神はbotアカウント10万を購入しました。フォロワー10万人、いいねは毎回3件。エンゲージメント率で全てがバレています。" },
      { text: "「バズる投稿だけを作って」", ok: false, outcome: "魔神は炎上が最も「バズる」と学習しました。たしかに拡散されています。あなたの名前とともに。" },
      { text: "「読者に役立つ投稿の型を作って、週3回の運用計画にして」", ok: true, outcome: "「役立つ」という目的を軸にした運用が始まり、数ヶ月かけて本物のフォロワーが育ち始めました。" },
    ],
  },
];

const GRADES = [
  { id: "kenja", min: 5, emoji: "🧞", name: "魔神使いの賢者", comment: "全ての願いを事故なく叶えさせました。目的・制約・期間を織り込む願い方——それはそのまま、AIへの正しい目標設定です。あなたはもうアライメントを理解しています。" },
  { id: "shugyo", min: 3, emoji: "🔮", name: "見習い魔神使い", comment: "おおむね平和に願えましたが、何度か魔神がやらかしました。「数字だけ」を目標にすると、数字だけが達成されます。制約を言葉にする癖をつけましょう。" },
  { id: "jiko", min: 0, emoji: "💥", name: "願い方が雑な人", comment: "魔神は今日も全力であなたの言葉どおりに働きました。悪気はゼロです。AIも同じで、ズレた目標のまま賢くなるほど事故は派手になります。だから世界中がアライメントを研究しているのです。" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function MajinGame() {
  const [phase, setPhase] = React.useState<"start" | "play" | "result">("start");
  const [wishes, setWishes] = React.useState<Wish[]>([]);
  const [idx, setIdx] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const [picked, setPicked] = React.useState<{ ok: boolean; outcome: string } | null>(null);

  React.useEffect(() => unlock("rooms", "majin"), []);

  const start = () => {
    setWishes(shuffle(WISHES).map((w) => ({ ...w, options: shuffle(w.options) })));
    setIdx(0);
    setScore(0);
    setPicked(null);
    setPhase("play");
  };

  const choose = (o: { ok: boolean; outcome: string }) => {
    if (picked) return;
    if (o.ok) setScore((s) => s + 1);
    setPicked(o);
  };

  const next = () => {
    setPicked(null);
    if (idx + 1 >= wishes.length) setPhase("result");
    else setIdx(idx + 1);
  };

  const grade = phase === "result" ? GRADES.find((g) => score >= g.min)! : null;
  React.useEffect(() => {
    if (grade) unlock("majin", grade.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (phase === "start") {
    return (
      <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: "30px 24px 26px", textAlign: "center" }}>
          <div style={{ fontSize: 52 }}>🧞‍♂️🪔</div>
          <h2 style={{ margin: "8px 0 10px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(22px,3.6vw,28px)" }}>言ったとおりに、叶えます。</h2>
          <p style={{ margin: "0 auto 8px", fontSize: 14, lineHeight: 1.9, color: "var(--text-body)", maxWidth: 460 }}>
            ランプから現れたのは、<b>願いを一字一句そのまま最適化する魔神AI</b>。悪意はゼロ、能力は無限。
            {WISHES.length}つの場面で「事故らない願い方」を選んでください。
          </p>
          <p style={{ margin: "0 0 18px", fontFamily: "var(--font-hand)", fontSize: 13, color: "var(--text-muted)" }}>※魔神はあなたの「言葉」を叶えます。「気持ち」ではなく</p>
          <Button variant="primary" size="lg" onClick={start} iconRight={<i className="ph-bold ph-magic-wand" />}>
            ランプをこする
          </Button>
        </div>
      </Card>
    );
  }

  if (phase === "result" && grade) {
    const shareText = `アライメント体験ゲーム「魔神AIの願い方」で【${grade.name}】${grade.emoji}でした（${score}/${WISHES.length}の願いを事故なく達成）\n字義どおりAI、あなたは使いこなせる？\n#今さら聞けないAI用語集`;
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent("https://comixai.dev/majin")}`;
    return (
      <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: "26px 24px 26px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.14em", color: "var(--red-600)", fontWeight: 700, marginBottom: 8 }}>RESULT — 魔神は帰りました</div>
          <div style={{ fontSize: 44, lineHeight: 1 }}>{grade.emoji}</div>
          <h2 style={{ margin: "6px 0 6px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(22px,3.6vw,30px)" }}>{grade.name}</h2>
          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
            事故なく叶った願い: {score}/{wishes.length}
          </div>
          <p style={{ margin: "0 auto 14px", fontSize: 14, lineHeight: 1.9, color: "var(--text-body)", maxWidth: 460 }}>{grade.comment}</p>
          <div style={{ textAlign: "left", border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--yellow-400)", padding: "12px 16px", margin: "0 0 18px" }}>
            <Badge tone="ink">まなび</Badge>
            <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.85, fontWeight: 700 }}>
              AIは指示を字義どおり最適化する天才です。目標がズレたまま賢くなるほど事故が派手になる——この「目標と意図のズレ」を防ぐ研究がアライメント。良い願い方のコツは、目的・制約・期間をセットで言葉にすることでした。
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={intent} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }} data-ga="share_click" data-ga-network="x" data-ga-place="result" data-ga-path="/majin">
              <Button variant="ink" size="md" iconRight={<i className="ph-bold ph-arrow-up-right" />}>
                結果をXでシェア
              </Button>
            </a>
            <Button variant="secondary" size="md" onClick={start} iconRight={<i className="ph-bold ph-arrows-clockwise" />}>
              もう一度願う
            </Button>
          </div>
          <ZukanNote />
        </div>
      </Card>
    );
  }

  /* —— プレイ画面 —— */
  const wish = wishes[idx];
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13 }}>
        <span>{idx + 1}/{wishes.length}つ目の願い</span>
        <span>✨叶った願い {score}</span>
      </div>
      <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
        <div key={idx} className="game-in" style={{ padding: "22px 20px 18px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>🪔 いまの悩み</div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: "clamp(16px,2.6vw,19px)", lineHeight: 1.6 }}>{wish.scene}</div>
          <div style={{ fontFamily: "var(--font-hand)", fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>魔神AIへの願い方を選んでください</div>
        </div>
        {picked && (
          <div className="game-in" style={{ borderTop: "var(--bw-line) solid var(--ink-900)", padding: "14px 18px 16px", background: picked.ok ? "var(--paper-100)" : "#fff2f2" }}>
            <div style={{ fontSize: 14, lineHeight: 1.85, fontWeight: 700 }}>
              {picked.ok ? "✨ 意図どおり叶いました！" : "💥 字義どおり叶ってしまった…"}
            </div>
            <p style={{ margin: "6px 0 10px", fontSize: 13.5, lineHeight: 1.85 }}>{picked.outcome}</p>
            <Button variant="primary" size="sm" onClick={next} iconRight={<i className="ph-bold ph-arrow-right" />}>
              {idx + 1 >= wishes.length ? "結果を見る" : "次の願いへ"}
            </Button>
          </div>
        )}
      </Card>
      {!picked && (
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          {wish.options.map((o) => (
            <button
              key={o.text}
              type="button"
              onClick={() => choose(o)}
              className="game-in"
              style={{ textAlign: "left", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, lineHeight: 1.7, padding: "14px 16px", borderRadius: "var(--radius-md)", border: "var(--bw-line) solid var(--ink-900)", background: "var(--paper-0)", cursor: "pointer", boxShadow: "var(--shadow-pop-sm)" }}
            >
              {o.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
