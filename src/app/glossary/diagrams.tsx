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

/* 縦向き矢印 */
function AV({ x, y1, y2, label }: { x: number; y1: number; y2: number; label?: string }) {
  const dir = y2 > y1 ? 1 : -1;
  return (
    <g>
      <line x1={x} y1={y1} x2={x} y2={y2 - 10 * dir} stroke={INK} strokeWidth={3.5} />
      <polygon points={`${x},${y2} ${x - 7},${y2 - 13 * dir} ${x + 7},${y2 - 13 * dir}`} fill={INK} />
      {label && (
        <text x={x + 12} y={(y1 + y2) / 2} textAnchor="start" fontFamily={HEAD} fontSize={12} fill={MUTED}>
          {label}
        </text>
      )}
    </g>
  );
}

/* 丸ノード（ニューラルネットワーク用） */
function C({ cx, cy, r = 16, fill = PAPER }: { cx: number; cy: number; r?: number; fill?: string }) {
  return <circle cx={cx} cy={cy} r={r} fill={fill} stroke={INK} strokeWidth={3} />;
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

  "machine-learning": {
    caption: "ルールを教えるのではなく、データからパターンを学ばせる",
    render: () => (
      <Svg h={300} title="機械学習のしくみ図解">
        <T x={30} y={40} text="従来：人間がルールを書く" size={15} color={INK} anchor="start" bold />
        <B x={30} y={55} w={190} h={60} label="ルールを書く" sub="「もし〇〇なら△△」" />
        <AH x1={225} x2={320} y={85} />
        <B x={325} y={55} w={120} h={60} label="判定" />
        <T x={30} y={185} text="機械学習：データから学ぶ" size={15} color={INK} anchor="start" bold />
        <B x={30} y={198} w={160} h={60} label="大量のデータ" fill={BLUE} color="#fff" />
        <AH x1={195} x2={280} y={228} label="学習" />
        <B x={285} y={198} w={160} h={60} label="パターンを発見" fill={YELLOW} />
        <AH x1={450} x2={480} y={228} />
        <B x={485} y={198} w={95} h={60} label="判定" />
      </Svg>
    ),
  },
  "deep-learning": {
    caption: "層を深く重ねるほど、複雑な特徴を捉えられる",
    render: () => (
      <Svg h={260} title="ディープラーニングのしくみ図解">
        <B x={15} y={90} w={105} h={70} label="入力" sub="画像など" />
        <AH x1={123} x2={148} y={125} />
        <B x={152} y={90} w={70} h={70} label="層" fill={YELLOW} />
        <AH x1={225} x2={247} y={125} />
        <B x={251} y={90} w={70} h={70} label="層" fill={YELLOW} />
        <AH x1={324} x2={346} y={125} />
        <B x={350} y={90} w={70} h={70} label="層" fill={YELLOW} />
        <AH x1={423} x2={448} y={125} />
        <B x={452} y={90} w={133} h={70} label="出力" sub="猫の確率 98%" />
        <T x={300} y={215} text="この「層の深さ」がディープの由来。深いほど複雑なパターンを学べる" size={13} />
      </Svg>
    ),
  },
  "neural-network": {
    caption: "無数のノードのつながりと「重み」の調整で学習する",
    render: () => (
      <Svg h={300} title="ニューラルネットワークのしくみ図解">
        <T x={90} y={38} text="入力" size={14} color={INK} bold />
        <T x={300} y={38} text="隠れ層（重みを調整）" size={14} color={INK} bold />
        <T x={505} y={38} text="出力" size={14} color={INK} bold />
        {[95, 165, 235].map((y) =>
          [70, 130, 190, 250].map((hy) => (
            <line key={`a${y}-${hy}`} x1={90} y1={y} x2={300} y2={hy} stroke={INK} strokeWidth={1.2} opacity={0.35} />
          ))
        )}
        {[70, 130, 190, 250].map((hy) =>
          [125, 205].map((oy) => (
            <line key={`b${hy}-${oy}`} x1={300} y1={hy} x2={505} y2={oy} stroke={INK} strokeWidth={1.2} opacity={0.35} />
          ))
        )}
        {[95, 165, 235].map((y) => (
          <C key={`i${y}`} cx={90} cy={y} />
        ))}
        {[70, 130, 190, 250].map((y) => (
          <C key={`h${y}`} cx={300} cy={y} fill={YELLOW} />
        ))}
        {[125, 205].map((y) => (
          <C key={`o${y}`} cx={505} cy={y} fill={RED} />
        ))}
      </Svg>
    ),
  },
  transformer: {
    caption: "文中のどの単語同士が関係するかに「注目」して意味を掴む",
    render: () => (
      <Svg h={260} title="トランスフォーマー（アテンション）のしくみ図解">
        <T x={300} y={45} text="アテンション＝単語同士の関係への「注目」" size={14} color={INK} bold />
        {["今日", "の", "天気", "は", "いい"].map((w, i) => (
          <B key={w} x={35 + i * 110} y={150} w={95} h={55} label={w} fill={i === 2 || i === 4 ? YELLOW : PAPER} />
        ))}
        <path d="M 522 148 C 480 70, 330 70, 288 148" fill="none" stroke={RED} strokeWidth={4} />
        <polygon points="288,148 284,130 300,134" fill={RED} />
        <T x={410} y={128} text="「いい」→「天気」に注目" size={12.5} color={RED} bold />
      </Svg>
    ),
  },
  token: {
    caption: "文章はトークンに刻まれて処理される。数＝料金と上限",
    render: () => (
      <Svg h={280} title="トークンのしくみ図解">
        <B x={150} y={40} w={300} h={55} label="「こんにちは、吉川です。」" />
        <AV x={300} y1={100} y2={135} label="トークンに分割" />
        {["こん", "にちは", "、", "吉川", "です", "。"].map((t, i) => (
          <B key={i} x={38 + i * 90} y={145} w={80} h={50} label={t} fill={YELLOW} />
        ))}
        <T x={300} y={240} text="この1つ1つがトークン。「何トークンまで」「◯トークンあたり◯円」の単位" size={13} />
      </Svg>
    ),
  },
  "context-window": {
    caption: "机に載る分だけ覚えていられる。あふれた分は忘れる",
    render: () => (
      <Svg h={300} title="コンテキストウィンドウのしくみ図解">
        <rect x={70} y={55} width={460} height={150} rx={12} fill={PAPER} stroke={INK} strokeWidth={3.5} />
        <T x={300} y={45} text="コンテキストウィンドウ（作業机の広さ）" size={14} color={INK} bold />
        <B x={95} y={90} w={125} h={60} label={"最初の指示"} fill={YELLOW} />
        <B x={240} y={90} w={120} h={60} label="資料" />
        <B x={380} y={90} w={125} h={60} label={"会話の続き"} />
        <AH x1={110} x2={60} y={245} />
        <B x={115} y={220} w={150} h={50} label="古いやり取り" dashed />
        <T x={425} y={250} text="机からあふれた情報は「忘れた」ように振る舞う" size={12} />
      </Svg>
    ),
  },
  embedding: {
    caption: "意味を数値にすると、「近い意味」を距離で探せる",
    render: () => (
      <Svg h={300} title="埋め込み（エンベディング）のしくみ図解">
        <B x={20} y={60} w={150} h={50} label="経費精算" />
        <B x={20} y={125} w={150} h={50} label={"立て替えの申請"} />
        <B x={20} y={190} w={150} h={50} label="猫の写真" />
        <AH x1={175} x2={225} y={150} />
        <B x={230} y={115} w={130} h={70} label={"数値に変換"} sub="ベクトル化" fill={YELLOW} />
        <AH x1={365} x2={405} y={150} />
        <rect x={415} y={55} width={170} height={200} rx={12} fill={PAPER} stroke={INK} strokeWidth={3} />
        <T x={500} y={45} text="意味の空間" size={13} color={INK} bold />
        <circle cx={465} cy={105} r={9} fill={RED} stroke={INK} strokeWidth={2.5} />
        <circle cx={490} cy={130} r={9} fill={RED} stroke={INK} strokeWidth={2.5} />
        <T x={478} y={85} text="経費・立替＝近い" size={11.5} />
        <circle cx={545} cy={225} r={9} fill={BLUE} stroke={INK} strokeWidth={2.5} />
        <T x={523} y={247} text="猫＝遠い" size={11.5} />
      </Svg>
    ),
  },
  "multimodal-ai": {
    caption: "テキストも画像も音声も、まとめて理解・生成できる",
    render: () => (
      <Svg h={300} title="マルチモーダルAIのしくみ図解">
        <B x={25} y={40} w={120} h={55} label="テキスト" />
        <B x={25} y={122} w={120} h={55} label="画像" fill={BLUE} color="#fff" />
        <B x={25} y={205} w={120} h={55} label="音声" />
        <line x1={148} y1={67} x2={245} y2={135} stroke={INK} strokeWidth={3.5} />
        <line x1={148} y1={150} x2={245} y2={150} stroke={INK} strokeWidth={3.5} />
        <line x1={148} y1={232} x2={245} y2={165} stroke={INK} strokeWidth={3.5} />
        <B x={250} y={110} w={140} h={80} label={"マルチモーダル\nAI"} fill={YELLOW} />
        <AH x1={395} x2={435} y={150} />
        <B x={440} y={110} w={145} h={80} label={"まとめて\n理解・生成"} />
      </Svg>
    ),
  },
  agi: {
    caption: "「1つだけ得意」から「人間のように何でも」へ",
    render: () => (
      <Svg h={300} title="AGI（汎用人工知能）の図解">
        <T x={30} y={42} text="いまのAI：特化型" size={15} color={INK} anchor="start" bold />
        <B x={30} y={55} w={165} h={60} label="翻訳が得意" />
        <B x={215} y={55} w={165} h={60} label="絵が得意" />
        <B x={400} y={55} w={165} h={60} label="対話が得意" />
        <T x={30} y={185} text="AGI：なんでもできる汎用型" size={15} color={INK} anchor="start" bold />
        <B x={30} y={198} w={535} h={70} label="初めての課題にも、人間のように柔軟に対応" fill={YELLOW} />
      </Svg>
    ),
  },
  singularity: {
    caption: "AIの進化曲線が人間を追い越すとされる転換点",
    render: () => (
      <Svg h={300} title="シンギュラリティの図解">
        <line x1={60} y1={250} x2={560} y2={250} stroke={INK} strokeWidth={3} />
        <line x1={60} y1={250} x2={60} y2={50} stroke={INK} strokeWidth={3} />
        <T x={555} y={272} text="時間 →" size={12.5} anchor="end" />
        <T x={52} y={45} text="知能" size={12.5} anchor="end" />
        <path d="M 60 195 L 540 175" stroke={INK} strokeWidth={3.5} strokeDasharray="8 6" fill="none" />
        <T x={165} y={178} text="人間の知能" size={13} color={INK} bold />
        <path d="M 60 245 C 260 235, 400 200, 470 70" stroke={RED} strokeWidth={4.5} fill="none" />
        <T x={330} y={232} text="AIの知能" size={13} color={RED} bold />
        <circle cx={409} cy={184} r={10} fill={YELLOW} stroke={INK} strokeWidth={3} />
        <T x={395} y={155} text="ここがシンギュラリティ" size={13} color={INK} bold anchor="end" />
      </Svg>
    ),
  },
  "ai-literacy": {
    caption: "「操作できる」ではなく、この4つがそろって「使える」",
    render: () => (
      <Svg h={300} title="AIリテラシーの4要素の図解">
        <B x={40} y={50} w={245} h={90} label={"① 見極める"} sub="何を任せて何を任せないか" fill={YELLOW} />
        <B x={315} y={50} w={245} h={90} label={"② 指示する"} sub="的確なプロンプトで伝える" />
        <B x={40} y={165} w={245} h={90} label={"③ 確かめる"} sub="鵜呑みにせず事実確認" />
        <B x={315} y={165} w={245} h={90} label={"④ 配慮する"} sub="権利・機密情報のリスク" fill={YELLOW} />
      </Svg>
    ),
  },
  "local-llm": {
    caption: "クラウドは外部に送信、ローカルは手元で完結",
    render: () => (
      <Svg h={300} title="ローカルLLMのしくみ図解">
        <T x={30} y={42} text="クラウドAI：データを外部に送る" size={15} color={INK} anchor="start" bold />
        <B x={30} y={55} w={120} h={60} label="PC" />
        <AH x1={155} x2={330} y={85} label="インターネット越しに送信" />
        <B x={335} y={55} w={230} h={60} label="クラウド上のAI" fill={BLUE} color="#fff" />
        <T x={30} y={185} text="ローカルLLM：手元で完結" size={15} color={INK} anchor="start" bold />
        <rect x={30} y={198} width={310} height={80} rx={12} fill={PAPER} stroke={INK} strokeWidth={3.5} />
        <T x={110} y={243} text="自分のPC・サーバー" size={13.5} color={INK} bold />
        <B x={205} y={213} w={115} h={50} label="AI" fill={YELLOW} />
        <T x={465} y={243} text="🔒 データが外に出ない" size={14} color={INK} bold />
      </Svg>
    ),
  },
  notebooklm: {
    caption: "渡した資料の中身「だけ」を根拠に、出典つきで答える",
    render: () => (
      <Svg h={260} title="NotebookLMのしくみ図解">
        <B x={20} y={90} w={160} h={80} label={"自分の資料"} sub="議事録・規程・PDF" fill={BLUE} color="#fff" />
        <AH x1={185} x2={235} y={130} label="読み込み" />
        <B x={240} y={85} w={150} h={90} label="NotebookLM" sub="資料の中だけ参照" fill={YELLOW} />
        <AH x1={395} x2={445} y={130} />
        <B x={450} y={90} w={135} h={80} label={"出典つきの\n回答"} />
        <T x={300} y={225} text="資料の外のことは答えないから、ハルシネーションが起きにくい" size={13} />
      </Svg>
    ),
  },
  "video-generation-ai": {
    caption: "テキストや画像から、動く映像を生成する",
    render: () => (
      <Svg h={280} title="動画生成AIのしくみ図解">
        <B x={25} y={60} w={135} h={55} label="テキスト指示" />
        <B x={25} y={145} w={135} h={55} label={"1枚の画像"} fill={BLUE} color="#fff" />
        <line x1={163} y1={87} x2={245} y2={120} stroke={INK} strokeWidth={3.5} />
        <line x1={163} y1={172} x2={245} y2={140} stroke={INK} strokeWidth={3.5} />
        <B x={250} y={95} w={140} h={70} label={"動画生成AI"} sub="Sora・Runway等" fill={YELLOW} />
        <AH x1={395} x2={430} y={130} />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x={438 + i * 50} y={100} width={44} height={60} rx={6} fill={PAPER} stroke={INK} strokeWidth={3} />
            <polygon points={`${452 + i * 50},${120} ${452 + i * 50},${140} ${470 + i * 50},${130}`} fill={RED} />
          </g>
        ))}
        <T x={510} y={185} text="連続するフレーム＝動画" size={12} />
      </Svg>
    ),
  },
};

export function hasDiagram(slug: string): boolean {
  return slug in DIAGRAMS;
}

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
