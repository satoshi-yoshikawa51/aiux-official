"use client";
/* ============================================================
   「スロップ・スワイプ」— AIスロップ鑑定ゲーム。
   流れてくるコンテンツを 左スワイプ=スロップ / 右スワイプ=良質 で
   高速判定する。ドラッグ（タッチ/マウス）とボタンの両対応。
   すべてクライアント完結。
   ============================================================ */
import React from "react";
import { Badge, Button, Card } from "../ds";
import { unlock } from "../zukan/store";
import { ZukanNote } from "../zukan/collection";

interface Post {
  icon: string;
  title: string;
  body: string;
  source: string;
  slop: boolean;
  tell: string; // 見抜きポイント
}

const POSTS: Post[] = [
  { icon: "📰", title: "AIで年収が10倍になる7つの習慣【保存版】", body: "いかがでしたか？今回はAIで年収を上げる方法をご紹介しました。ぜひ参考にしてみてくださいね！", source: "まとめブログ", slop: true, tell: "中身ゼロの「いかがでしたか？」構文。何も紹介してないのに締めている" },
  { icon: "🧪", title: "Claude Codeでニュースアプリを作った3週間の記録", body: "通勤電車の中だけで開発。つまずいたのはSSRのmuted属性で、回避策はrawタグ埋め込みだった。", source: "個人開発者のnote", slop: false, tell: "具体的なつまずきと解決策がある＝実体験の証拠" },
  { icon: "📊", title: "衝撃！日本人の98%がAIを使いこなせていない", body: "ある調査によると、日本人の98%はAIを使いこなせていないことが判明しました。", source: "バイラルメディア", slop: true, tell: "「ある調査」——出典のない衝撃数字は疑うのが基本" },
  { icon: "🍳", title: "肉じゃがのレシピ", body: "じゃがいも3個、牛肉200g、しょうゆ大さじ2。母から教わった分量で、砂糖は控えめが我が家流です。", source: "料理ブログ", slop: false, tell: "具体的な分量と個人の工夫。生活の手触りがある" },
  { icon: "🖼️", title: "感動！雪山で子犬を救助する消防士の写真", body: "SNSで100万いいね。よく見ると消防士の手の指が6本あり、ヘルメットのロゴが溶けている。", source: "拡散ポスト", slop: true, tell: "指が6本・文字が溶ける——AI画像の古典的な破綻ポイント" },
  { icon: "📱", title: "新型スマホ実機レビュー：3日使った正直な感想", body: "カメラは良いがバッテリーは1日持たなかった。外出が多い人は注意。設定画面のスクショつき。", source: "ガジェットブログ", slop: false, tell: "良い点と悪い点の両方＋スクショ。宣伝でなくレビューの体裁" },
  { icon: "💰", title: "誰も知らない副業で月収100万円を確実に稼ぐ方法", body: "この方法を知るだけで、誰でも確実に、リスクゼロで稼げます。今すぐLINEに登録。", source: "広告記事", slop: true, tell: "「誰でも確実にリスクゼロ」——全部言い切る文章は危険信号" },
  { icon: "🏛️", title: "生成AIの業務利用ガイドライン改定まとめ", body: "文化庁の「AIと著作権に関する考え方」を引用し、変更点を新旧対照表で整理した。", source: "法務担当のブログ", slop: false, tell: "一次情報（官公庁資料）への参照が明記されている" },
  { icon: "🤖", title: "AIとは何か？初心者にもわかりやすく解説します", body: "AIとは人工知能のことです。人工知能とはAIのことです。近年、AIが注目されています。", source: "SEO記事", slop: true, tell: "同じことの言い換えだけで進まない。検索順位のためだけの文章" },
  { icon: "🐛", title: "本番DBを消しかけた話——障害対応の一部始終", body: "金曜18時、migrationのミスに気づいた。restoreに使ったコマンドと、二度とやらないための仕組みを書く。", source: "エンジニアブログ", slop: false, tell: "失敗談＋具体的なコマンド。書いた人にしか書けない内容" },
  { icon: "🌟", title: "【2026年最新】おすすめAIツール50選！徹底比較", body: "1. ChatGPT：便利なAIです。2. Claude：便利なAIです。3. Gemini：便利なAIです。（以下47個続く）", source: "アフィリエイトサイト", slop: true, tell: "全部「便利なAIです」。比較と言いながら何も比較していない" },
  { icon: "🎨", title: "Midjourneyでキャラクターを統一する試行錯誤", body: "orefで失敗した設定値とプロンプト全文を載せる。うまくいかなかった生成例も貼っておく。", source: "クリエイターのnote", slop: false, tell: "失敗例まで公開している。二次利用できる具体情報" },
  { icon: "📢", title: "速報：有名企業がAIで全社員を解雇と発表", body: "詳細は不明ですが、SNSで話題になっています。真偽は不明ですが拡散します。", source: "速報アカウント", slop: true, tell: "「真偽は不明ですが拡散」——それを世間ではデマと呼ぶ" },
  { icon: "📚", title: "図書館司書が選ぶ、AI時代に読みたい本5冊", body: "貸出データで実際に予約が伸びた本から選定。各書の「どんな人に刺さるか」を司書目線で書いた。", source: "図書館だより", slop: false, tell: "その人の職業でしか得られないデータと視点" },
  { icon: "✨", title: "朝活×AI×筋トレ×瞑想で人生が変わった件", body: "意識を変えるだけで世界が変わります。あなたも変わりませんか？変わるなら今です。", source: "自己啓発ポスト", slop: true, tell: "「変わる」を7回言っているが、何をどう変えたかが一切ない" },
  { icon: "🗾", title: "ローカル線で行く、平日昼の温泉レポ", body: "運賃1,480円、乗り換え2回。脱衣所のドライヤーは2台で、15時台は貸切だった。", source: "旅ブログ", slop: false, tell: "行った人にしか書けないディテール（ドライヤーの台数！）" },
  { icon: "🧠", title: "ChatGPTが意識を持ったと研究者が認めた", body: "海外の研究者がAIの意識を認めたとのこと。ソースは海外サイトです（リンク切れ）。", source: "オカルト系まとめ", slop: true, tell: "「海外の研究者」＋リンク切れ。確認できない出典は無いのと同じ" },
  { icon: "⚖️", title: "画像生成AIの判例を弁護士が読み解く", body: "判決文の該当パラグラフを引用し、実務にどう影響するかを依頼の多い順に解説する。", source: "法律事務所コラム", slop: false, tell: "判決文の引用＝一次情報。専門家の署名記事" },
  { icon: "🔥", title: "この画像がすごいと話題に！→わかる人にはわかる", body: "話題の画像をご覧ください。すごいですよね。わかる人にはわかると思います。", source: "バズ狙いアカウント", slop: true, tell: "何がどうすごいのか、最後まで一度も説明していない" },
  { icon: "🏫", title: "小学校でAI出前授業をやってみた反省会", body: "「AIは間違える」の実演が一番ウケた。逆に用語解説は3分で集中が切れた。配布資料PDFつき。", source: "教員コミュニティ", slop: false, tell: "うまくいかなかった部分の記録＋資料公開。次の人の役に立つ" },
];

const RUN = 10;
const GRADES = [
  { id: "sommelier", min: 9, emoji: "🍷", name: "スロップ・ソムリエ", comment: "ほぼ完璧な鑑定眼。あなたのタイムラインは今日も健全です。もはや「出典は？」が口癖のはず。" },
  { id: "kanteishi", min: 7, emoji: "🔍", name: "スロップ鑑定士", comment: "十分に実戦レベル。あとは「AI画像の破綻」と「出典のない数字」への嗅覚を磨けば完璧です。" },
  { id: "minarai", min: 5, emoji: "🧹", name: "鑑定見習い", comment: "半分は見抜けています。「いかがでしたか？」と「誰でも確実に」を見たら反射で疑いましょう。" },
  { id: "unomi", min: 0, emoji: "🍽️", name: "スロップ完食", comment: "ぜんぶ美味しくいただいてしまいました…。大丈夫、見抜きポイントを知れば今日から変われます。" },
];

function gradeFor(score: number) {
  return GRADES.find((g) => score >= g.min) ?? GRADES[GRADES.length - 1];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const TIME_MAX = 6.0; // 秒。後半は短くなる

export function SlopGame() {
  const [phase, setPhase] = React.useState<"start" | "play" | "result">("start");
  const [deck, setDeck] = React.useState<Post[]>([]);
  const [idx, setIdx] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const [streak, setStreak] = React.useState(0);
  const [bestStreak, setBestStreak] = React.useState(0);
  const [timeLeft, setTimeLeft] = React.useState(TIME_MAX);
  const [feedback, setFeedback] = React.useState<{ ok: boolean; tell: string; timeout?: boolean } | null>(null);
  const [drag, setDrag] = React.useState(0); // 現在のドラッグ量(px)
  const dragStart = React.useRef<number | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => unlock("rooms", "slop"), []);

  const limitFor = (i: number) => Math.max(3.5, TIME_MAX - i * 0.3);

  const start = () => {
    setDeck(shuffle(POSTS).slice(0, RUN));
    setIdx(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setFeedback(null);
    setDrag(0);
    setTimeLeft(TIME_MAX);
    setPhase("play");
  };

  /* タイマー（フィードバック表示中は止まる） */
  React.useEffect(() => {
    if (phase !== "play" || feedback) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0.05) return 0;
        return t - 0.05;
      });
    }, 50);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, feedback, idx]);

  /* 時間切れ＝じっくり考えすぎ（不正解扱い） */
  React.useEffect(() => {
    if (phase === "play" && !feedback && timeLeft <= 0) {
      const post = deck[idx];
      setStreak(0);
      setFeedback({ ok: false, tell: post.tell, timeout: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const judge = (saysSlop: boolean) => {
    if (feedback || phase !== "play") return;
    const post = deck[idx];
    const ok = saysSlop === post.slop;
    if (ok) {
      setScore((s) => s + 1);
      setStreak((s) => {
        const n = s + 1;
        setBestStreak((b) => Math.max(b, n));
        return n;
      });
    } else setStreak(0);
    setFeedback({ ok, tell: post.tell });
  };

  const next = () => {
    setFeedback(null);
    setDrag(0);
    if (idx + 1 >= deck.length) {
      setPhase("result");
    } else {
      setIdx(idx + 1);
      setTimeLeft(limitFor(idx + 1));
    }
  };

  /* フィードバックは1.4秒で自動送り */
  React.useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(next, 1400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback]);

  /* 結果を図鑑へ */
  const grade = phase === "result" ? gradeFor(score) : null;
  React.useEffect(() => {
    if (grade) unlock("slop", grade.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /* ドラッグ操作 */
  const onPointerDown = (e: React.PointerEvent) => {
    if (feedback) return;
    dragStart.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragStart.current === null || feedback) return;
    setDrag(e.clientX - dragStart.current);
  };
  const onPointerUp = () => {
    if (dragStart.current === null) return;
    dragStart.current = null;
    if (drag <= -80) judge(true);
    else if (drag >= 80) judge(false);
    setDrag(feedback ? drag : 0);
  };

  const post = deck[idx];
  const limit = limitFor(idx);

  if (phase === "start") {
    return (
      <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: "30px 24px 26px", textAlign: "center" }}>
          <div style={{ fontSize: 52 }}>🗑️✨</div>
          <h2 style={{ margin: "8px 0 10px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(22px,3.6vw,28px)" }}>その情報、食べる前に嗅げ。</h2>
          <p style={{ margin: "0 auto 8px", fontSize: 14, lineHeight: 1.9, color: "var(--text-body)", maxWidth: 440 }}>
            流れてくる記事や投稿を、<b>左スワイプ＝スロップ🗑️</b>／<b>右スワイプ＝良質✨</b>で仕分けする鑑定ゲーム。全{RUN}問、後半ほど制限時間が短くなります。
          </p>
          <p style={{ margin: "0 0 18px", fontFamily: "var(--font-hand)", fontSize: 13, color: "var(--text-muted)" }}>※ボタンでも判定できます（スマホはスワイプが気持ちいい）</p>
          <Button variant="primary" size="lg" onClick={start} iconRight={<i className="ph-bold ph-hand-swipe-right" />}>
            鑑定をはじめる
          </Button>
        </div>
      </Card>
    );
  }

  if (phase === "result" && grade) {
    const shareText = `AIスロップ鑑定で【${grade.name}】${grade.emoji}でした（${score}/${RUN}問正解・最大${bestStreak}コンボ）\nあなたのタイムラインは健全？\n#今さら聞けないAI用語集`;
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent("https://comixai.dev/slop")}`;
    return (
      <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: "26px 24px 26px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.14em", color: "var(--red-600)", fontWeight: 700, marginBottom: 8 }}>
            RESULT — 鑑定終了
          </div>
          <div style={{ fontSize: 44, lineHeight: 1 }}>{grade.emoji}</div>
          <h2 style={{ margin: "6px 0 6px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(22px,3.6vw,30px)" }}>{grade.name}</h2>
          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
            {score}/{RUN} 正解　最大{bestStreak}コンボ
          </div>
          <p style={{ margin: "0 auto 14px", fontSize: 14, lineHeight: 1.9, color: "var(--text-body)", maxWidth: 460 }}>{grade.comment}</p>
          <div style={{ textAlign: "left", border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--yellow-400)", padding: "12px 16px", margin: "0 0 18px" }}>
            <Badge tone="ink">まなび</Badge>
            <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.85, fontWeight: 700 }}>
              スロップの共通点は「誰が書いても同じ」なこと。逆に、失敗談・一次情報・具体的な数字は書いた人にしか書けません。発信する側になったら、この鑑定基準がそのまま品質チェックリストになります。
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={intent} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <Button variant="ink" size="md" iconRight={<i className="ph-bold ph-arrow-up-right" />}>
                鑑定結果をXでシェア
              </Button>
            </a>
            <Button variant="secondary" size="md" onClick={start} iconRight={<i className="ph-bold ph-arrows-clockwise" />}>
              もう一度鑑定する
            </Button>
          </div>
          <ZukanNote />
        </div>
      </Card>
    );
  }

  /* —— プレイ画面 —— */
  return (
    <div>
      {/* ステータスバー */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13 }}>
        <span>
          {idx + 1}/{deck.length}　スコア {score}
        </span>
        <span style={{ color: streak >= 3 ? "var(--red-600)" : "var(--text-muted)" }}>{streak >= 2 ? `🔥${streak}コンボ` : " "}</span>
      </div>
      {/* タイマー */}
      <div style={{ height: 8, background: "rgba(20,17,15,0.12)", borderRadius: 4, marginBottom: 14, overflow: "hidden" }}>
        <div
          style={{
            width: `${(timeLeft / limit) * 100}%`,
            height: "100%",
            background: timeLeft / limit < 0.3 ? "var(--red-500)" : "var(--yellow-400)",
            borderRadius: 4,
          }}
        />
      </div>

      {/* カード（ドラッグ可能） */}
      <div style={{ position: "relative", touchAction: "pan-y" }}>
        {/* 判定インジケータ */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", pointerEvents: "none", zIndex: 2 }}>
          <span style={{ fontSize: 34, opacity: Math.min(1, Math.max(0, -drag - 20) / 80), transform: "rotate(-8deg)" }}>🗑️</span>
          <span style={{ fontSize: 34, opacity: Math.min(1, Math.max(0, drag - 20) / 80), transform: "rotate(8deg)" }}>✨</span>
        </div>
        <div
          key={idx}
          className="game-in"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            transform: `translateX(${drag}px) rotate(${drag / 14}deg)`,
            transition: dragStart.current !== null ? "none" : "transform 0.25s var(--ease-pop)",
            cursor: "grab",
            userSelect: "none",
          }}
        >
          <Card variant="pop" padding={0} style={{ overflow: "hidden", background: "var(--paper-0)" }}>
            <div style={{ padding: "16px 18px 14px", borderBottom: "var(--bw-line) solid var(--ink-900)", display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 30, flex: "none" }}>{post?.icon}</span>
              <div>
                <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15.5, lineHeight: 1.5 }}>{post?.title}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>出どころ：{post?.source}</div>
              </div>
            </div>
            <p style={{ margin: 0, padding: "14px 18px 18px", fontSize: 13.5, lineHeight: 1.9, color: "var(--text-body)", minHeight: 92 }}>{post?.body}</p>
          </Card>
        </div>

        {/* フィードバック */}
        {feedback && (
          <div
            className="game-in"
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
              background: "rgba(20,17,15,0.82)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <div style={{ textAlign: "center", color: "var(--paper-50)", maxWidth: 420 }}>
              <div style={{ fontSize: 40 }}>{feedback.ok ? "⭕" : feedback.timeout ? "⏰" : "❌"}</div>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 17, margin: "4px 0 8px" }}>
                {feedback.ok ? "ナイス鑑定！" : feedback.timeout ? "時間切れ！" : `ざんねん…これは${post?.slop ? "スロップ" : "良質"}`}
              </div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.8, color: "rgba(251,247,239,0.85)" }}>💡 {feedback.tell}</p>
            </div>
          </div>
        )}
      </div>

      {/* ボタン操作 */}
      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <button
          type="button"
          onClick={() => judge(true)}
          style={{ flex: 1, fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15, padding: "14px 10px", borderRadius: "var(--radius-md)", border: "var(--bw-line) solid var(--ink-900)", background: "var(--paper-0)", cursor: "pointer", boxShadow: "var(--shadow-pop-sm)" }}
        >
          🗑️ スロップ
        </button>
        <button
          type="button"
          onClick={() => judge(false)}
          style={{ flex: 1, fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15, padding: "14px 10px", borderRadius: "var(--radius-md)", border: "var(--bw-line) solid var(--ink-900)", background: "var(--yellow-400)", cursor: "pointer", boxShadow: "var(--shadow-pop-sm)" }}
        >
          ✨ 良質
        </button>
      </div>
    </div>
  );
}
