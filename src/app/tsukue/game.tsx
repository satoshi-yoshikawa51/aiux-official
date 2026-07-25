"use client";
/* ============================================================
   「AIの作業机」— コンテキストエンジニアリング体験ゲーム。
   タスクに対して、容量（トークン）制限のある机に何を載せるかを
   選ぶナップサックパズル。要る資料・要らない資料・むしろ有害な
   資料が混ざっている。すべてクライアント完結。
   ============================================================ */
import React from "react";
import { Badge, Button, Card } from "../ds";
import { unlock } from "../zukan/store";
import { ZukanNote } from "../zukan/collection";

type Kind = "essential" | "helpful" | "noise" | "harmful";

interface Item {
  id: string;
  icon: string;
  label: string;
  cost: number; // トークン
  kind: Kind;
  note: string; // 判定後の解説
}
interface Round {
  task: string;
  capacity: number;
  modelName: string;
  items: Item[];
  answers: { great: string; ok: string; bad: string };
}

const ROUNDS: Round[] = [
  {
    task: "取引先への「納期延期のお詫びメール」を書いて",
    capacity: 4000,
    modelName: "小型モデル（机がせまい）",
    items: [
      { id: "shiji", icon: "📝", label: "指示メモ（誰に・何を・いつ）", cost: 500, kind: "essential", note: "5W1Hは最優先。これがないと想像で書き始める" },
      { id: "keii", icon: "📩", label: "経緯がわかる直近のメール2通", cost: 1200, kind: "essential", note: "文脈の核。相手との温度感はここから読み取れる" },
      { id: "kako", icon: "🗂️", label: "過去のお詫びメールの良い例", cost: 800, kind: "helpful", note: "トーンの手本として有効" },
      { id: "gijiroku", icon: "📚", label: "先月の全議事録（全文）", cost: 2600, kind: "noise", note: "関係する1行のために机の6割を占領。典型的な圧迫要因" },
      { id: "kyuryo", icon: "💰", label: "旧・納期スケジュール表", cost: 700, kind: "harmful", note: "古い日付をAIが信じて、間違った納期を書いてしまった" },
      { id: "neko", icon: "🐱", label: "癒やしの猫画像フォルダ", cost: 900, kind: "noise", note: "かわいい。だが今ではない" },
    ],
    answers: {
      great: "経緯を踏まえた誠実なお詫び＋新しい納期の提案まで入った完璧なメールが出てきました。",
      ok: "無難なお詫びメールは出ましたが、経緯への言及が薄く、少し他人事っぽい仕上がりです。",
      bad: "「平素よりお世話になっております（誰だか分かっていない）」——文脈ゼロの定型文が出てきました。しかも納期が古い。",
    },
  },
  {
    task: "自社サービスの「競合比較スライドの構成案」を作って",
    capacity: 6000,
    modelName: "中型モデル",
    items: [
      { id: "mokuteki", icon: "🎯", label: "スライドの目的メモ（誰に見せるか）", cost: 500, kind: "essential", note: "役員向けか営業向けかで構成は別物になる" },
      { id: "hikaku", icon: "📊", label: "競合3社の調査サマリー", cost: 1500, kind: "essential", note: "比較の中身そのもの" },
      { id: "zenbun", icon: "📚", label: "競合3社の調査・全文レポート", cost: 4200, kind: "noise", note: "サマリーと同じ内容の全文版。両方載せると机が窒息する" },
      { id: "template", icon: "📐", label: "社内スライドのテンプレ構成", cost: 800, kind: "helpful", note: "アウトプットの型が揃う" },
      { id: "kessan", icon: "🧾", label: "3年前の決算資料", cost: 1800, kind: "harmful", note: "古い数字が「最新実績」としてスライドに混入した" },
      { id: "kuchikomi", icon: "💬", label: "顧客の生の声（抜粋10件）", cost: 1000, kind: "helpful", note: "説得力が一段上がるスパイス" },
    ],
    answers: {
      great: "目的に沿った構成＋競合比較表＋顧客の声の引用まで入った、そのまま会議に出せる構成案が完成。",
      ok: "構成はまとまりましたが、根拠がやや薄め。「あとは肉付けよろしく」感があります。",
      bad: "全文レポートに溺れて要点を見失い、3年前の数字が堂々と載った構成案が出てきました。",
    },
  },
  {
    task: "障害報告書のドラフトを書いて（顧客提出用）",
    capacity: 8000,
    modelName: "大型モデル（机は広い。でも…）",
    items: [
      { id: "jikeiretsu", icon: "⏱️", label: "障害の時系列メモ", cost: 1200, kind: "essential", note: "報告書の背骨。これなしは論外" },
      { id: "genin", icon: "🔧", label: "原因調査の結論サマリー", cost: 900, kind: "essential", note: "顧客が一番知りたい部分" },
      { id: "log", icon: "🖥️", label: "サーバーログ・生データ48時間分", cost: 5800, kind: "noise", note: "結論サマリーがあれば生ログは不要。机の7割を占領した" },
      { id: "kata", icon: "📄", label: "過去の報告書フォーマット", cost: 700, kind: "helpful", note: "顧客提出用の体裁が整う" },
      { id: "slack", icon: "💬", label: "障害対応中のSlackログ全部", cost: 3500, kind: "harmful", note: "「一旦適当に再起動しよ」という社内の生々しい発言が報告書に引用されかけた" },
      { id: "saihatsu", icon: "🛡️", label: "再発防止策の箇条書き", cost: 800, kind: "helpful", note: "誠意が伝わる締めになる" },
    ],
    answers: {
      great: "時系列・原因・再発防止策がそろった、そのまま提出できる報告書に。顧客からの信頼も回復しそうです。",
      ok: "骨子はできましたが体裁が粗く、上司の赤入れが数往復しそうです。",
      bad: "生ログの海に溺れ、あろうことか社内Slackの「適当に再起動しよ」が引用された報告書が生成されました。提出したら大惨事でした。",
    },
  },
];

const GRADES = [
  { id: "tatsujin", min: 8, emoji: "🧘", name: "整頓の達人", comment: "要るものだけを、要る分だけ。あなたの机は禅の庭です。実務のAI活用でもこの感覚がそのまま効きます。" },
  { id: "minarai", min: 4, emoji: "🧹", name: "片付け見習い", comment: "いい線です。コツは「大きい資料には要約版がないか探す」「古い資料は毒」の2つだけ。" },
  { id: "chirakashi", min: 0, emoji: "🌪️", name: "散らかし屋", comment: "机がカオスでした…。でも「詰め込むほど良いわけじゃない」と体感できたなら、それが今日の収穫です。" },
];

function gradeFor(pts: number) {
  return GRADES.find((g) => pts >= g.min) ?? GRADES[GRADES.length - 1];
}

export function TsukueGame() {
  const [round, setRound] = React.useState(0);
  const [picked, setPicked] = React.useState<Set<string>>(new Set());
  const [judged, setJudged] = React.useState<null | { tier: "great" | "ok" | "bad"; pts: number }>(null);
  const [totalPts, setTotalPts] = React.useState(0);
  const [finished, setFinished] = React.useState(false);

  React.useEffect(() => unlock("rooms", "tsukue"), []);

  const r = ROUNDS[round];
  const used = [...picked].reduce((n, id) => n + (r.items.find((i) => i.id === id)?.cost ?? 0), 0);

  const toggle = (item: Item) => {
    if (judged) return;
    setPicked((p) => {
      const n = new Set(p);
      if (n.has(item.id)) n.delete(item.id);
      else if (used + item.cost <= r.capacity) n.add(item.id);
      return n;
    });
  };

  const submit = () => {
    if (judged) return;
    const sel = r.items.filter((i) => picked.has(i.id));
    const essentials = r.items.filter((i) => i.kind === "essential");
    const gotAllEssential = essentials.every((e) => picked.has(e.id));
    const harmful = sel.some((i) => i.kind === "harmful");
    const noise = sel.filter((i) => i.kind === "noise").length;
    let tier: "great" | "ok" | "bad";
    if (gotAllEssential && !harmful && noise === 0) tier = "great";
    else if (gotAllEssential && !harmful) tier = "ok";
    else tier = "bad";
    const pts = tier === "great" ? 3 : tier === "ok" ? 1 : 0;
    setTotalPts((t) => t + pts);
    setJudged({ tier, pts });
  };

  const next = () => {
    if (round + 1 >= ROUNDS.length) setFinished(true);
    else {
      setRound(round + 1);
      setPicked(new Set());
      setJudged(null);
    }
  };

  const reset = () => {
    setRound(0);
    setPicked(new Set());
    setJudged(null);
    setTotalPts(0);
    setFinished(false);
  };

  const grade = finished ? gradeFor(totalPts) : null;
  React.useEffect(() => {
    if (grade) unlock("tsukue", grade.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  if (finished && grade) {
    const shareText = `AIの作業机（コンテキスト整理ゲーム）で【${grade.name}】${grade.emoji}でした（${totalPts}/9点）\nあなたはAIの机、片づけられる？\n#今さら聞けないAI用語集`;
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent("https://comixai.dev/tsukue")}`;
    return (
      <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: "26px 24px 26px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.14em", color: "var(--red-600)", fontWeight: 700, marginBottom: 8 }}>RESULT — 業務終了</div>
          <div style={{ fontSize: 44, lineHeight: 1 }}>{grade.emoji}</div>
          <h2 style={{ margin: "6px 0 6px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(22px,3.6vw,30px)" }}>{grade.name}</h2>
          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, marginBottom: 10 }}>{totalPts}/9点</div>
          <p style={{ margin: "0 auto 14px", fontSize: 14, lineHeight: 1.9, color: "var(--text-body)", maxWidth: 460 }}>{grade.comment}</p>
          <div style={{ textAlign: "left", border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--yellow-400)", padding: "12px 16px", margin: "0 0 18px" }}>
            <Badge tone="ink">まなび</Badge>
            <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.85, fontWeight: 700 }}>
              AIの答えの質は「何を渡すか」で決まる——これがコンテキストエンジニアリングです。ポイントは3つ：要点版を選ぶ（全文は圧迫）、古い資料は載せない（毒になる）、机が広くても整理は必要（入る≠読める）。
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={intent} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }} data-ga="share_click" data-ga-network="x" data-ga-place="result" data-ga-path="/tsukue">
              <Button variant="ink" size="md" iconRight={<i className="ph-bold ph-arrow-up-right" />}>
                結果をXでシェア
              </Button>
            </a>
            <Button variant="secondary" size="md" onClick={reset} iconRight={<i className="ph-bold ph-arrows-clockwise" />}>
              もう一度片づける
            </Button>
          </div>
          <ZukanNote />
        </div>
      </Card>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13 }}>
        <span>ラウンド {round + 1}/{ROUNDS.length}</span>
        <span>累計 {totalPts}点</span>
      </div>

      <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "var(--bw-line) solid var(--ink-900)", background: "var(--paper-100)" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>{r.modelName}</div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15.5 }}>🎯 {r.task}</div>
        </div>

        {/* 容量ゲージ */}
        <div style={{ padding: "12px 18px 6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: 11.5, fontWeight: 700, marginBottom: 4 }}>
            <span>机の使用量</span>
            <span style={{ color: used > r.capacity * 0.9 ? "var(--red-600)" : "inherit" }}>
              {used.toLocaleString()} / {r.capacity.toLocaleString()} tk
            </span>
          </div>
          <div style={{ height: 12, background: "rgba(20,17,15,0.12)", borderRadius: 6, overflow: "hidden", border: "1.5px solid var(--ink-900)" }}>
            <div style={{ width: `${Math.min(100, (used / r.capacity) * 100)}%`, height: "100%", background: used > r.capacity * 0.9 ? "var(--red-500)" : "var(--yellow-400)", transition: "width 0.25s var(--ease-pop)" }} />
          </div>
        </div>

        {/* アイテム */}
        <div style={{ padding: "12px 14px 16px", display: "grid", gap: 8 }}>
          {r.items.map((item) => {
            const on = picked.has(item.id);
            const wontFit = !on && used + item.cost > r.capacity;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggle(item)}
                disabled={!!judged || wontFit}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  textAlign: "left",
                  fontFamily: "var(--font-heading)",
                  fontWeight: 700,
                  fontSize: 13.5,
                  padding: "10px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "var(--bw-line) solid var(--ink-900)",
                  background: on ? "var(--yellow-400)" : wontFit ? "var(--paper-100)" : "var(--paper-0)",
                  cursor: judged ? "default" : wontFit ? "not-allowed" : "pointer",
                  boxShadow: on ? "none" : "var(--shadow-pop-sm)",
                  opacity: wontFit ? 0.55 : 1,
                }}
              >
                <span style={{ fontSize: 22, flex: "none" }}>{item.icon}</span>
                <span style={{ flex: 1 }}>
                  {item.label}
                  {judged && (
                    <span style={{ display: "block", fontFamily: "var(--font-hand)", fontWeight: 400, fontSize: 12, color: item.kind === "essential" ? "var(--blue-500)" : item.kind === "harmful" ? "var(--red-600)" : "var(--text-muted)", marginTop: 2 }}>
                      {item.kind === "essential" ? "◎必須：" : item.kind === "helpful" ? "○有効：" : item.kind === "noise" ? "△ノイズ：" : "✕有害："}
                      {item.note}
                    </span>
                  )}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-muted)", flex: "none" }}>{item.cost.toLocaleString()}tk</span>
              </button>
            );
          })}
        </div>

        {!judged ? (
          <div style={{ padding: "0 16px 18px", textAlign: "center" }}>
            <Button variant="primary" size="lg" onClick={submit} iconRight={<i className="ph-bold ph-paper-plane-right" />}>
              この机でAIに渡す
            </Button>
          </div>
        ) : (
          <div className="game-in" style={{ borderTop: "var(--bw-line) solid var(--ink-900)", padding: "16px 18px 20px" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15, marginBottom: 6 }}>
              {judged.tier === "great" ? "🌟 完璧な机！（+3点）" : judged.tier === "ok" ? "🙂 まずまずの机（+1点）" : "🌪️ 机がカオス…（0点）"}
            </div>
            <p style={{ margin: "0 0 12px", fontSize: 13.5, lineHeight: 1.85, color: "var(--text-body)" }}>🤖 {r.answers[judged.tier]}</p>
            <Button variant="yellow" size="sm" onClick={next} iconRight={<i className="ph-bold ph-arrow-right" />}>
              {round + 1 >= ROUNDS.length ? "結果を見る" : "次のタスクへ"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
