/* ============================================================
   AI用語集の図解（SVG）。サイトのマンガ調トークンで描く。
   ・viewBox幅は600固定。モバイルでは等倍縮小されるため、
     文字は fontSize 12 以上を保つこと。
   ・用語データ(data.ts)に image が設定されている場合は
     そちら（手描きイラスト）が優先され、このSVGは使われない。
   ============================================================ */

const INK = "var(--ink-900)";
const PAPER = "var(--paper-0)";
const YELLOW = "var(--yellow-400)";
const RED = "var(--red-500)";
const BLUE = "var(--blue-500)";
const MUTED = "var(--text-muted)";
const HEAD = "var(--font-heading)";

/* —— 部品 —— */
function B({
  x, y, w, h, label, sub, fill = PAPER, color = INK, dashed = false,
}: {
  x: number; y: number; w: number; h: number;
  label: string; sub?: string; fill?: string; color?: string; dashed?: boolean;
}) {
  const lines = label.split("\n");
  const baseY = y + h / 2 + (sub ? -6 : 0) - (lines.length - 1) * 10;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} fill={fill} stroke={INK} strokeWidth={3} strokeDasharray={dashed ? "7 5" : undefined} />
      {lines.map((ln, i) => (
        <text key={ln} x={x + w / 2} y={baseY + i * 20} textAnchor="middle" dominantBaseline="middle" fontFamily={HEAD} fontWeight={700} fontSize={16} fill={color}>
          {ln}
        </text>
      ))}
      {sub && (
        <text x={x + w / 2} y={y + h / 2 + 16} textAnchor="middle" dominantBaseline="middle" fontFamily={HEAD} fontSize={11.5} fill={color === "#fff" ? "#fff" : MUTED}>
          {sub}
        </text>
      )}
    </g>
  );
}

/* 横向き矢印 */
function AH({ x1, x2, y, label }: { x1: number; x2: number; y: number; label?: string }) {
  const dir = x2 > x1 ? 1 : -1;
  return (
    <g>
      <line x1={x1} y1={y} x2={x2 - 10 * dir} y2={y} stroke={INK} strokeWidth={3.5} />
      <polygon points={`${x2},${y} ${x2 - 13 * dir},${y - 7} ${x2 - 13 * dir},${y + 7}`} fill={INK} />
      {label && (
        <text x={(x1 + x2) / 2} y={y - 11} textAnchor="middle" fontFamily={HEAD} fontSize={12} fill={MUTED}>
          {label}
        </text>
      )}
    </g>
  );
}

function T({ x, y, text, size = 13, color = MUTED, anchor = "middle", bold = false }: { x: number; y: number; text: string; size?: number; color?: string; anchor?: "start" | "middle" | "end"; bold?: boolean }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontFamily={HEAD} fontSize={size} fontWeight={bold ? 700 : 400} fill={color}>
      {text}
    </text>
  );
}

function Svg({ h, title, children }: { h: number; title: string; children: React.ReactNode }) {
  return (
    <svg viewBox={`0 0 600 ${h}`} width="100%" role="img" aria-label={title} className="diag" style={{ display: "block" }}>
      <title>{title}</title>
      {children}
    </svg>
  );
}

/* —— 各図解 —— */
const DIAGRAMS: Record<string, { caption: string; render: () => React.ReactNode }> = {
  "generative-ai": {
    caption: "ひとつの指示から、いろいろな形のコンテンツを生成できる",
    render: () => (
      <Svg h={300} title="生成AIのしくみ図解">
        <B x={20} y={115} w={140} h={70} label="プロンプト" sub="「つくって！」" />
        <AH x1={165} x2={225} y={150} label="指示" />
        <B x={230} y={100} w={150} h={100} label={"生成AI"} sub="学んだパターンから生成" fill={YELLOW} />
        <AH x1={385} x2={445} y={55} />
        <AH x1={385} x2={445} y={120} />
        <AH x1={385} x2={445} y={180} />
        <AH x1={385} x2={445} y={245} />
        <B x={450} y={30} w={130} h={50} label="文章" />
        <B x={450} y={95} w={130} h={50} label="画像" />
        <B x={450} y={155} w={130} h={50} label="コード" />
        <B x={450} y={220} w={130} h={50} label="動画" />
      </Svg>
    ),
  },
  llm: {
    caption: "膨大な文章から「言葉のパターン」を学び、次の言葉を予測する",
    render: () => (
      <Svg h={260} title="LLM（大規模言語モデル）のしくみ図解">
        <B x={20} y={95} w={155} h={80} label={"大量の文章"} sub="Web・書籍など" fill={BLUE} color="#fff" />
        <AH x1={180} x2={240} y={135} label="学習" />
        <B x={245} y={85} w={140} h={100} label="LLM" sub="言葉のパターン" fill={YELLOW} />
        <AH x1={390} x2={450} y={135} label="予測" />
        <B x={455} y={95} w={130} h={80} label={"次の言葉を\n生成"} />
        <T x={300} y={230} text="「今日はいい天気…」→「ですね」と続きを予測しつづけて文章になる" size={13} />
      </Svg>
    ),
  },
  "prompt-engineering": {
    caption: "指示の解像度が、答えの解像度になる",
    render: () => (
      <Svg h={300} title="プロンプトエンジニアリングの図解">
        <T x={30} y={40} text="✕ ふわっと頼む" size={15} color={INK} anchor="start" bold />
        <B x={30} y={55} w={200} h={60} label="「いい感じにして」" dashed />
        <AH x1={235} x2={355} y={85} />
        <B x={360} y={55} w={210} h={60} label={"ふわっとした答え"} dashed />
        <T x={30} y={175} text="◎ 役割・条件・形式まで伝える" size={15} color={INK} anchor="start" bold />
        <B x={30} y={190} w={200} h={80} label={"役割＋目的＋\n条件＋出力形式"} fill={YELLOW} />
        <AH x1={235} x2={355} y={230} />
        <B x={360} y={200} w={210} h={60} label="狙いどおりの答え" fill={RED} color="#fff" />
      </Svg>
    ),
  },
  hallucination: {
    caption: "「知らない」ときも、それらしく答えてしまうことがある",
    render: () => (
      <Svg h={270} title="ハルシネーションのしくみ図解">
        <B x={20} y={90} w={160} h={70} label={"質問"} sub="「出典を教えて」" />
        <AH x1={185} x2={245} y={125} />
        <B x={250} y={80} w={130} h={90} label="AI" sub="自然な続きを予測" fill={YELLOW} />
        <AH x1={385} x2={445} y={125} />
        <B x={450} y={85} w={135} h={80} label={"もっともらしい\n答え"} dashed />
        <rect x={355} y={205} width={230} height={42} rx={21} fill={RED} stroke={INK} strokeWidth={3} />
        <T x={470} y={231} text="⚠ 事実確認は人間の仕事！" size={14.5} color="#fff" bold />
        <T x={175} y={228} text="存在しない出典を作ってしまうことも…" size={13} />
      </Svg>
    ),
  },
  rag: {
    caption: "答える前に資料を検索して、根拠ごとAIに渡す",
    render: () => (
      <Svg h={260} title="RAG（検索拡張生成）のしくみ図解">
        <B x={15} y={95} w={110} h={70} label="質問" />
        <AH x1={130} x2={165} y={130} />
        <B x={170} y={85} w={130} h={90} label={"資料を検索"} sub="社内資料・DB" fill={BLUE} color="#fff" />
        <AH x1={305} x2={340} y={130} />
        <B x={345} y={85} w={110} h={90} label={"AIに渡す"} sub="カンペつき" fill={YELLOW} />
        <AH x1={460} x2={495} y={130} />
        <B x={500} y={95} w={85} h={70} label={"根拠つき\n回答"} />
        <T x={300} y={225} text="資料を差し替えるだけで知識を更新できるのが強み" size={13} />
      </Svg>
    ),
  },
  "fine-tuning": {
    caption: "RAGは「カンペを渡す」、ファインチューニングは「特訓する」",
    render: () => (
      <Svg h={300} title="ファインチューニングとRAGの違いの図解">
        <T x={30} y={42} text="RAG：その場で資料を渡す" size={15} color={INK} anchor="start" bold />
        <B x={30} y={55} w={150} h={60} label="カンペ（資料）" fill={BLUE} color="#fff" />
        <AH x1={185} x2={295} y={85} label="その場で渡す" />
        <B x={300} y={55} w={120} h={60} label="AI" />
        <B x={460} y={55} w={110} h={60} label={"すぐ答えに\n反映"} />
        <AH x1={425} x2={455} y={85} />
        <T x={30} y={185} text="ファインチューニング：追加学習で体質を変える" size={15} color={INK} anchor="start" bold />
        <B x={30} y={198} w={150} h={60} label="追加の学習データ" />
        <AH x1={185} x2={295} y={228} label="特訓（再学習）" />
        <B x={300} y={198} w={120} h={60} label="AI 自体が変化" fill={YELLOW} />
        <AH x1={425} x2={455} y={228} />
        <B x={460} y={198} w={110} h={60} label={"口調・様式が\n安定"} />
      </Svg>
    ),
  },
  "ai-agent": {
    caption: "目標を渡すと、計画→実行→確認を自分で繰り返して完了させる",
    render: () => (
      <Svg h={290} title="AIエージェントのしくみ図解">
        <B x={20} y={110} w={130} h={70} label="目標" sub="「〜しておいて」" />
        <AH x1={155} x2={205} y={145} />
        <B x={210} y={95} w={180} h={100} label={"AIエージェント"} sub="計画 → ツール実行 → 確認" fill={YELLOW} />
        <path d="M 250 95 C 250 45, 350 45, 350 95" fill="none" stroke={INK} strokeWidth={3.5} />
        <polygon points="350,95 342,80 357,82" fill={INK} />
        <T x={300} y={38} text="自分で繰り返す" size={13} bold color={INK} />
        <AH x1={395} x2={445} y={145} />
        <B x={450} y={110} w={130} h={70} label="完了報告" fill={RED} color="#fff" />
        <T x={300} y={250} text="一問一答ではなく、複数ステップの仕事をまるごと任せられる" size={13} />
      </Svg>
    ),
  },
  mcp: {
    caption: "MCPが「共通の差し込み口」になって、AIと外部ツールをつなぐ",
    render: () => (
      <Svg h={300} title="MCP（Model Context Protocol）のしくみ図解">
        <B x={25} y={110} w={140} h={80} label="AI" sub="Claude など" fill={YELLOW} />
        <line x1={170} y1={150} x2={245} y2={150} stroke={INK} strokeWidth={3.5} />
        <B x={250} y={105} w={120} h={90} label="MCP" sub="共通規格" fill={RED} color="#fff" />
        <line x1={370} y1={150} x2={445} y2={70} stroke={INK} strokeWidth={3.5} />
        <line x1={370} y1={150} x2={445} y2={150} stroke={INK} strokeWidth={3.5} />
        <line x1={370} y1={150} x2={445} y2={230} stroke={INK} strokeWidth={3.5} />
        <B x={450} y={40} w={125} h={55} label="Figma" fill={BLUE} color="#fff" />
        <B x={450} y={123} w={125} h={55} label="データベース" fill={BLUE} color="#fff" />
        <B x={450} y={205} w={125} h={55} label="ドライブ" fill={BLUE} color="#fff" />
        <T x={207} y={135} text="⇄" size={20} color={INK} />
      </Svg>
    ),
  },
  "claude-code": {
    caption: "日本語で伝えると、実装・確認・修正まで進めてくれる",
    render: () => (
      <Svg h={260} title="Claude Codeのしくみ図解">
        <B x={20} y={95} w={160} h={80} label={"日本語で指示"} sub="「アプリ作って」" />
        <AH x1={185} x2={235} y={135} />
        <B x={240} y={85} w={170} h={100} label="Claude Code" sub="書く → 動かす → 直す" fill={RED} color="#fff" />
        <AH x1={415} x2={465} y={135} />
        <B x={470} y={95} w={115} h={80} label={"アプリ\n完成"} fill={YELLOW} />
        <T x={300} y={230} text="コードが書けなくても、アイデアを形にできる" size={13} />
      </Svg>
    ),
  },
  "vibe-coding": {
    caption: "「伝える→AIが作る→確かめる」のループでソフトウェアができていく",
    render: () => (
      <Svg h={280} title="バイブコーディングの図解">
        <B x={30} y={80} w={160} h={70} label={"イメージを\n伝える"} fill={YELLOW} />
        <AH x1={195} x2={245} y={115} />
        <B x={250} y={80} w={150} h={70} label="AIが実装" fill={RED} color="#fff" />
        <AH x1={405} x2={455} y={115} />
        <B x={460} y={80} w={120} h={70} label={"動きを\n確認"} />
        <path d="M 520 155 C 520 235, 110 235, 110 155" fill="none" stroke={INK} strokeWidth={3.5} />
        <polygon points="110,155 102,171 119,170" fill={INK} />
        <T x={315} y={240} text="「もっとこうして」と繰り返すだけ。コードは書かなくていい" size={13} />
      </Svg>
    ),
  },
  "image-generation-ai": {
    caption: "文章の指示が、数十秒で画像になる",
    render: () => (
      <Svg h={270} title="画像生成AIのしくみ図解">
        <B x={20} y={90} w={190} h={90} label={"テキストで指示"} sub="「夕焼けの街を走る猫」" />
        <AH x1={215} x2={265} y={135} />
        <B x={270} y={90} w={150} h={90} label={"画像生成AI"} sub="Midjourney など" fill={BLUE} color="#fff" />
        <AH x1={425} x2={475} y={135} />
        <g>
          <rect x={480} y={85} width={100} height={100} rx={10} fill={PAPER} stroke={INK} strokeWidth={3} />
          <circle cx={555} cy={112} r={12} fill={YELLOW} stroke={INK} strokeWidth={2.5} />
          <polygon points="490,170 520,130 540,155 552,142 572,170" fill={BLUE} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
        </g>
        <T x={300} y={235} text="たたき台づくりが速くなり、イメージ共有もかんたんに" size={13} />
      </Svg>
    ),
  },
  "ai-workflow": {
    caption: "工程ごとに「AIに任せる／人間が入る」を設計する",
    render: () => (
      <Svg h={280} title="AIワークフローの図解">
        <rect x={168} y={30} width={16} height={16} rx={4} fill={YELLOW} stroke={INK} strokeWidth={2} />
        <T x={192} y={43} text="= AIが担当" size={13} anchor="start" color={INK} />
        <rect x={298} y={30} width={16} height={16} rx={4} fill={PAPER} stroke={INK} strokeWidth={2} />
        <T x={322} y={43} text="= 人間が担当" size={13} anchor="start" color={INK} />
        <B x={15} y={95} w={100} h={75} label="収集" fill={YELLOW} />
        <AH x1={118} x2={131} y={132} />
        <B x={132} y={95} w={100} h={75} label="整理" fill={YELLOW} />
        <AH x1={235} x2={248} y={132} />
        <B x={249} y={95} w={100} h={75} label="たたき台" fill={YELLOW} />
        <AH x1={352} x2={365} y={132} />
        <B x={366} y={95} w={100} h={75} label="レビュー" />
        <AH x1={469} x2={482} y={132} />
        <B x={483} y={95} w={100} h={75} label="仕上げ" />
        <T x={300} y={225} text="単発の「AIに聞く」ではなく、流れ全体をデザインすると効果が跳ねる" size={13} />
      </Svg>
    ),
  },
};

/* —— 図解パネル（用語ページから使う） —— */
export function TermDiagram({ slug }: { slug: string }) {
  const d = DIAGRAMS[slug];
  if (!d) return null;
  return (
    <div style={{ border: "var(--bw-bold) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--paper-0)", boxShadow: "var(--shadow-pop)", overflow: "hidden" }}>
      <div style={{ padding: "12px 18px 0", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", fontWeight: 700, color: "var(--red-600)" }}>
        DIAGRAM — 図解
      </div>
      <div style={{ padding: "6px 14px 4px" }}>{d.render()}</div>
      <div style={{ padding: "0 18px 14px", fontFamily: "var(--font-hand)", fontSize: 13.5, color: "var(--text-muted)", textAlign: "right" }}>
        {d.caption}
      </div>
    </div>
  );
}
