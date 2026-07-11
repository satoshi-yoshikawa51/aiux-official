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
  /* ————— 第3弾（2026-07）の図解 ————— */
  "deep-research": {
    caption: "即答ではなく「持ち帰って調べてから報告」してくれる",
    render: () => (
      <Svg h={300} title="ディープリサーチのしくみ図解">
        <T x={30} y={40} text="ふつうのチャット" size={15} color={INK} anchor="start" bold />
        <B x={30} y={55} w={130} h={55} label="質問" />
        <AH x1={165} x2={275} y={82} label="数秒" />
        <B x={280} y={55} w={140} h={55} label="即答" dashed />
        <T x={30} y={180} text="ディープリサーチ" size={15} color={INK} anchor="start" bold />
        <B x={30} y={195} w={110} h={60} label="質問" />
        <AH x1={145} x2={185} y={225} />
        <B x={190} y={185} w={170} h={80} label={"大量のWebを\n読み込む"} sub="数分〜数十分" fill={YELLOW} />
        <AH x1={365} x2={405} y={225} />
        <B x={410} y={195} w={165} h={60} label={"出典つき\nレポート"} fill={RED} color="#fff" />
      </Svg>
    ),
  },
  "reasoning-model": {
    caption: "「考える時間」を取るぶん、複雑な問題に強くなる",
    render: () => (
      <Svg h={300} title="推論モデルのしくみ図解">
        <T x={30} y={40} text="従来のLLM：反射で答える" size={15} color={INK} anchor="start" bold />
        <B x={30} y={55} w={130} h={55} label="質問" />
        <AH x1={165} x2={275} y={82} label="即答" />
        <B x={280} y={55} w={160} h={55} label="答え" dashed />
        <T x={30} y={180} text="推論モデル：考えてから答える" size={15} color={INK} anchor="start" bold />
        <B x={30} y={195} w={110} h={60} label="質問" />
        <AH x1={145} x2={185} y={225} />
        <B x={190} y={185} w={170} h={80} label={"頭の中で\n下書き・検算"} sub="思考の連鎖" fill={YELLOW} />
        <AH x1={365} x2={405} y={225} />
        <B x={410} y={195} w={165} h={60} label={"精度の高い\n答え"} fill={RED} color="#fff" />
      </Svg>
    ),
  },
  "ai-browser": {
    caption: "AIがタブを横断して読み、操作まで代行してくれる",
    render: () => (
      <Svg h={280} title="AIブラウザのしくみ図解">
        <B x={20} y={100} w={130} h={70} label={"ユーザー"} sub="「調べて比べて」" />
        <AH x1={155} x2={215} y={135} label="頼む" />
        <rect x={220} y={40} width={360} height={210} rx={12} fill={PAPER} stroke={INK} strokeWidth={3} />
        <T x={400} y={68} text="AIブラウザ" size={15} color={INK} bold />
        <B x={240} y={85} w={100} h={55} label="タブA" dashed />
        <B x={350} y={85} w={100} h={55} label="タブB" dashed />
        <B x={460} y={85} w={100} h={55} label="タブC" dashed />
        <B x={285} y={170} w={270} h={60} label={"AIが横断して読む・操作する"} fill={YELLOW} />
        <AV x={290} y1={143} y2={167} />
        <AV x={400} y1={143} y2={167} />
        <AV x={510} y1={143} y2={167} />
      </Svg>
    ),
  },
  "world-model": {
    caption: "言葉ではなく「世界がどう動くか」を頭の中に持つ",
    render: () => (
      <Svg h={260} title="ワールドモデルのしくみ図解">
        <B x={20} y={95} w={140} h={70} label={"いまの状況"} sub="カメラ・状態" />
        <AH x1={165} x2={225} y={130} />
        <B x={230} y={80} w={180} h={100} label={"ワールドモデル"} sub="頭の中で未来を再生" fill={YELLOW} />
        <AH x1={415} x2={475} y={130} />
        <B x={480} y={95} w={105} h={70} label={"少し先を\n予測"} />
        <T x={300} y={225} text="「落とせば落ちる」を知っているから、試さずに動ける" size={13} />
      </Svg>
    ),
  },
  "context-engineering": {
    caption: "答えの質は、指示文より「机の上に何を載せるか」で決まる",
    render: () => (
      <Svg h={290} title="コンテキストエンジニアリングの図解">
        <rect x={20} y={40} width={340} height={210} rx={12} fill={PAPER} stroke={INK} strokeWidth={3} />
        <T x={190} y={68} text="AIの作業机（コンテキスト）" size={15} color={INK} bold />
        <B x={40} y={85} w={140} h={60} label="指示" />
        <B x={200} y={85} w={140} h={60} label="資料" fill={BLUE} color="#fff" />
        <B x={40} y={160} w={140} h={60} label="これまでの流れ" />
        <B x={200} y={160} w={140} h={60} label="使えるツール" />
        <AH x1={365} x2={425} y={145} label="設計" />
        <B x={430} y={110} w={150} h={70} label={"質の高い\n答え"} fill={YELLOW} />
        <T x={300} y={275} text="何を載せ、何を片付けるか——それが設計の腕" size={13} />
      </Svg>
    ),
  },
  "ai-slop": {
    caption: "量産されたスロップの中で、確かな一皿の価値が上がる",
    render: () => (
      <Svg h={270} title="AIスロップの図解">
        <T x={30} y={40} text="AIで量産された低品質コンテンツ" size={15} color={INK} anchor="start" bold />
        <B x={30} y={55} w={120} h={50} label="量産記事" dashed />
        <B x={160} y={70} w={120} h={50} label="量産記事" dashed />
        <B x={290} y={52} w={120} h={50} label="量産画像" dashed />
        <B x={420} y={68} w={120} h={50} label="量産動画" dashed />
        <T x={300} y={155} text="⋯ネットにあふれて、探す側は疲れる⋯" size={13} />
        <B x={150} y={180} w={300} h={60} label={"一次情報・実体験・検証つき"} sub="価値はむしろ上がる" fill={YELLOW} />
      </Svg>
    ),
  },
  "system-prompt": {
    caption: "ユーザーには見えない「楽屋の指示」がAIの性格を決めている",
    render: () => (
      <Svg h={280} title="システムプロンプトのしくみ図解">
        <B x={40} y={40} w={520} h={70} label={"システムプロンプト（見えない指示）"} sub="役割・口調・禁止事項" dashed />
        <AV x={300} y1={113} y2={140} label="先に効く" />
        <B x={40} y={145} w={220} h={60} label={"ユーザーの入力"} />
        <AH x1={265} x2={315} y={175} />
        <B x={320} y={145} w={110} h={60} label="AI" fill={YELLOW} />
        <AH x1={435} x2={485} y={175} />
        <B x={490} y={145} w={90} h={60} label="答え" />
        <T x={300} y={250} text="丁寧語で話すのも、危険な質問を断るのも、楽屋での申し合わせ" size={13} />
      </Svg>
    ),
  },
  "prompt-injection": {
    caption: "読ませた文章の中の「隠れた指示」に、AIが釣られてしまう",
    render: () => (
      <Svg h={280} title="プロンプトインジェクションのしくみ図解">
        <B x={20} y={60} w={190} h={90} label={"Webページ・メール"} sub="⚠ 隠れた指示入り" dashed />
        <AH x1={215} x2={275} y={105} label="読ませる" />
        <B x={280} y={70} w={130} h={70} label="AI" sub="指示と文章の区別が苦手" fill={YELLOW} />
        <AH x1={415} x2={475} y={105} />
        <B x={480} y={70} w={105} h={70} label={"意図しない\n動作"} fill={RED} color="#fff" />
        <rect x={150} y={200} width={300} height={44} rx={22} fill={INK} />
        <T x={300} y={227} text="対策：強い権限を渡しすぎない＋人間の承認" size={13.5} color="#fff" bold />
      </Svg>
    ),
  },
  "shadow-ai": {
    caption: "「便利だから」が、会社の知らないところで事故になる",
    render: () => (
      <Svg h={300} title="シャドーAIの図解">
        <T x={30} y={40} text="公認ルート" size={15} color={INK} anchor="start" bold />
        <B x={30} y={55} w={130} h={55} label="社員" />
        <AH x1={165} x2={275} y={82} label="ルール内で" />
        <B x={280} y={55} w={180} h={55} label="会社公認のAI" fill={YELLOW} />
        <T x={30} y={180} text="シャドーAI" size={15} color={RED} anchor="start" bold />
        <B x={30} y={195} w={130} h={55} label="社員" />
        <AH x1={165} x2={275} y={222} label="こっそり" />
        <B x={280} y={195} w={150} h={55} label="個人契約のAI" dashed />
        <AH x1={435} x2={465} y={222} />
        <B x={470} y={195} w={110} h={55} label={"機密が\n社外へ"} fill={RED} color="#fff" />
      </Svg>
    ),
  },
  "ai-governance": {
    caption: "国 → 業界 → 社内。重なるルールが「安心して攻める」を支える",
    render: () => (
      <Svg h={290} title="AIガバナンスの図解">
        <rect x={30} y={30} width={540} height={230} rx={12} fill={PAPER} stroke={INK} strokeWidth={3} />
        <T x={300} y={58} text="国・地域のルール（EU AI法・日本のAI法など）" size={14} color={INK} bold />
        <rect x={70} y={75} width={460} height={165} rx={10} fill="#fff7dc" stroke={INK} strokeWidth={3} />
        <T x={300} y={102} text="業界・事業者ガイドライン" size={14} color={INK} bold />
        <rect x={110} y={120} width={380} height={100} rx={10} fill={YELLOW} stroke={INK} strokeWidth={3} />
        <T x={300} y={147} text="会社のAI利用ルール" size={14.5} color={INK} bold />
        <T x={300} y={172} text="入力していい情報／確認する人／使っていいツール" size={12.5} color={INK} />
        <T x={300} y={198} text="＝ AIと働くための「就業規則」" size={12.5} color={INK} />
      </Svg>
    ),
  },
  "ai-copyright": {
    caption: "「学習」と「生成・利用」は分けて考えるのが第一歩",
    render: () => (
      <Svg h={300} title="生成AIと著作権の図解">
        <T x={30} y={40} text="学習の段階" size={15} color={INK} anchor="start" bold />
        <B x={30} y={55} w={150} h={55} label="既存の作品" />
        <AH x1={185} x2={295} y={82} label="学習" />
        <B x={300} y={55} w={130} h={55} label="AI" fill={YELLOW} />
        <T x={455} y={86} text="日本では広く可 ※例外あり" size={12.5} anchor="start" />
        <T x={30} y={180} text="生成・利用の段階" size={15} color={INK} anchor="start" bold />
        <B x={30} y={195} w={130} h={55} label="生成物" />
        <AH x1={165} x2={275} y={222} label="類似＋依拠なら" />
        <B x={280} y={195} w={160} h={55} label={"著作権侵害の\nリスク"} fill={RED} color="#fff" />
        <T x={455} y={218} text="AI製でも" size={12.5} anchor="start" />
        <T x={455} y={234} text="侵害になりうる" size={12.5} anchor="start" />
      </Svg>
    ),
  },
  llmo: {
    caption: "「検索で上位に出る」から「AIの答えに引用される」へ",
    render: () => (
      <Svg h={300} title="LLMO（AI検索最適化）の図解">
        <T x={30} y={40} text="SEO：検索結果で選ばれる" size={15} color={INK} anchor="start" bold />
        <B x={30} y={55} w={130} h={55} label="ユーザー" />
        <AH x1={165} x2={245} y={82} label="検索" />
        <B x={250} y={55} w={150} h={55} label="検索エンジン" />
        <AH x1={405} x2={455} y={82} />
        <B x={460} y={55} w={110} h={55} label="サイト" />
        <T x={30} y={180} text="LLMO：AIの答えの中で引用される" size={15} color={INK} anchor="start" bold />
        <B x={30} y={195} w={130} h={55} label="ユーザー" />
        <AH x1={165} x2={245} y={222} label="質問" />
        <B x={250} y={195} w={150} h={55} label={"AIの答え"} sub="出典として引用" fill={YELLOW} />
        <AH x1={455} x2={405} y={222} label="良質な一次情報" />
        <B x={460} y={195} w={110} h={55} label="サイト" fill={RED} color="#fff" />
      </Svg>
    ),
  },
  "multi-agent": {
    caption: "リーダーが仕事を割り振る「AIのチーム制」",
    render: () => (
      <Svg h={310} title="マルチエージェントのしくみ図解">
        <B x={225} y={30} w={150} h={65} label={"リーダーAI"} sub="タスクを分解" fill={YELLOW} />
        <AV x={150} y1={98} y2={135} />
        <AV x={300} y1={98} y2={135} />
        <AV x={450} y1={98} y2={135} />
        <line x1={150} y1={98} x2={450} y2={98} stroke={INK} strokeWidth={3.5} />
        <B x={85} y={140} w={130} h={60} label="調査係" />
        <B x={235} y={140} w={130} h={60} label="執筆係" />
        <B x={385} y={140} w={130} h={60} label="チェック係" />
        <AV x={300} y1={205} y2={235} label="統合" />
        <B x={210} y={240} w={180} h={55} label="成果物" fill={RED} color="#fff" />
      </Svg>
    ),
  },
  distillation: {
    caption: "大きいモデルの「答え方」をお手本に、小さいモデルを育てる",
    render: () => (
      <Svg h={280} title="蒸留（知識蒸留）のしくみ図解">
        <B x={20} y={60} w={170} h={110} label={"大きいモデル"} sub="教師：賢いが重い" fill={BLUE} color="#fff" />
        <AH x1={195} x2={285} y={115} label="お手本を見せる" />
        <B x={290} y={75} w={150} h={80} label={"小さいモデル"} sub="生徒：軽い" fill={YELLOW} />
        <AH x1={445} x2={495} y={115} />
        <B x={500} y={75} w={85} h={80} label={"軽い\n速い\n安い"} />
        <T x={300} y={225} text="スマホで動くローカルLLMの多くは、この技術の恩恵" size={13} />
      </Svg>
    ),
  },

  /* ═══════ BATCH4（GSC起点の30語） ═══════ */
  prompt: {
    caption: "「目的・条件・形式」の3点セットで、答えの質が一段変わる",
    render: () => (
      <Svg h={280} title="プロンプトの図解">
        <B x={20} y={30} w={150} h={54} label="目的" sub="何のために" fill={YELLOW} />
        <B x={20} y={98} w={150} h={54} label="条件" sub="誰向け・制約" fill={YELLOW} />
        <B x={20} y={166} w={150} h={54} label="形式" sub="表で・3行で" fill={YELLOW} />
        <AH x1={175} x2={235} y={125} label="伝える" />
        <B x={240} y={85} w={140} h={90} label="AI" />
        <AH x1={385} x2={445} y={125} />
        <B x={450} y={85} w={130} h={90} label={"精度の高い\n答え"} fill={RED} color="#fff" />
        <T x={300} y={255} text="新人への仕事の頼み方と同じ。ふわっと頼むと、ふわっと返ってくる" size={13} />
      </Svg>
    ),
  },
  gpt: {
    caption: "名前の3語に、しくみが全部書いてある",
    render: () => (
      <Svg h={300} title="GPTの意味の図解">
        <B x={30} y={40} w={165} h={70} label="Generative" sub="生成する" fill={YELLOW} />
        <B x={218} y={40} w={165} h={70} label="Pre-trained" sub="事前に訓練済み" fill={YELLOW} />
        <B x={406} y={40} w={165} h={70} label="Transformer" sub="土台のしくみ" fill={YELLOW} />
        <AV x={300} y1={118} y2={165} />
        <B x={190} y={170} w={220} h={70} label="GPT" sub="文章を生むAIの系譜" fill={RED} color="#fff" />
        <T x={300} y={278} text="GPTがエンジン、ChatGPTはそれを載せた車" size={13.5} />
      </Svg>
    ),
  },
  parameter: {
    caption: "パラメータ＝AIの中の調整つまみ。数が「脳の大きさ」の目安",
    render: () => (
      <Svg h={270} title="パラメータの図解">
        <B x={40} y={60} w={180} h={110} label="7B" sub="つまみ70億個" />
        <B x={330} y={35} w={230} h={160} label="70B" sub="つまみ700億個" fill={YELLOW} />
        <T x={130} y={205} text="軽い・速い・安い" size={13} />
        <T x={445} y={225} text="賢い・重い・高い" size={13} />
        <T x={300} y={250} text="学習＝膨大なつまみを回して「良い答えが出る位置」を探すこと" size={12.5} />
      </Svg>
    ),
  },
  inference: {
    caption: "私たちが使っているのは、いつも「推論」のほう",
    render: () => (
      <Svg h={260} title="学習と推論の図解">
        <B x={30} y={60} w={220} h={100} label="学習（訓練）" sub="受験勉強。数ヶ月がかり" fill={BLUE} color="#fff" />
        <AH x1={255} x2={315} y={110} label="完成" />
        <B x={320} y={60} w={250} h={100} label="推論（本番）" sub="試験本番。質問に答える" fill={YELLOW} />
        <T x={300} y={205} text="会話してもモデルは学習しない。「使うたび賢くなる」は誤解" size={13} />
        <T x={300} y={232} text="AIサービスの料金は、ほぼ推論の計算コストで決まる" size={12.5} />
      </Svg>
    ),
  },
  "training-data": {
    caption: "AIは学習データの鏡。何を食べたかで性格が決まる",
    render: () => (
      <Svg h={280} title="学習データの図解">
        <B x={25} y={30} w={150} h={50} label="Webの文章" />
        <B x={25} y={92} w={150} h={50} label="書籍・論文" />
        <B x={25} y={154} w={150} h={50} label="画像・コード" />
        <AH x1={180} x2={240} y={115} label="食べる" />
        <B x={245} y={75} w={140} h={90} label="AI" fill={YELLOW} />
        <AH x1={390} x2={450} y={115} />
        <B x={455} y={75} w={125} h={90} label={"データの\n鏡"} sub="偏れば偏る" />
        <T x={300} y={250} text="データにない知識は答えられず、偏りはそのまま答えに出る" size={13} />
      </Svg>
    ),
  },
  "foundation-model": {
    caption: "巨大な土台をひとつ作り、上にいろいろな用途を載せる",
    render: () => (
      <Svg h={280} title="基盤モデルの図解">
        <B x={40} y={30} w={120} h={55} label="会話" />
        <B x={175} y={30} w={120} h={55} label="要約" />
        <B x={310} y={30} w={120} h={55} label="翻訳" />
        <B x={445} y={30} w={120} h={55} label="コード" />
        <AV x={300} y1={95} y2={135} label="ぜんぶ同じ土台の上" />
        <B x={90} y={140} w={420} h={80} label="基盤モデル" sub="GPT / Claude / Gemini…" fill={YELLOW} />
        <T x={300} y={258} text="ゼロから作る時代は終わり、「どの土台に何を載せるか」の時代へ" size={13} />
      </Svg>
    ),
  },
  gpu: {
    caption: "単純計算の同時こなし力が、AIの学習にぴったりだった",
    render: () => (
      <Svg h={290} title="GPUの図解">
        <B x={50} y={45} w={190} h={90} label="CPU" sub="優秀な社員 数人" />
        <B x={330} y={45} w={220} h={90} label="GPU" sub="計算部隊 数千人" fill={YELLOW} />
        <T x={145} y={165} text="順番に器用にこなす" size={13} />
        <T x={440} y={165} text="掛け算を一斉にこなす" size={13} />
        <AV x={440} y1={180} y2={215} />
        <B x={330} y={220} w={220} h={50} label="AIの学習・推論" fill={RED} color="#fff" />
        <T x={165} y={250} text="AI時代の「石油」。覇者はNVIDIA" size={13} />
      </Svg>
    ),
  },
  deepfake: {
    caption: "「見た・聞いた」がもう証拠にならない時代の自衛策",
    render: () => (
      <Svg h={270} title="ディープフェイクの図解">
        <B x={40} y={40} w={230} h={80} label={"本物そっくりの\n偽動画・偽音声"} fill={RED} color="#fff" />
        <AH x1={275} x2={335} y={80} label="届く" />
        <B x={340} y={40} w={220} h={80} label={"目と耳では\n見抜けない"} dashed />
        <AV x={450} y1={125} y2={165} />
        <B x={310} y={170} w={280} h={60} label="別ルートで本人確認" sub="お金の話は特に" fill={YELLOW} />
        <T x={165} y={205} text="「動画があるから本当」は卒業" size={13} />
      </Svg>
    ),
  },
  openai: {
    caption: "ChatGPTで生成AIブームに火を付けた張本人",
    render: () => (
      <Svg h={270} title="OpenAIの図解">
        <B x={200} y={30} w={200} h={70} label="OpenAI" sub="2015年〜 米国" fill={YELLOW} />
        <AV x={150} y1={105} y2={145} />
        <AV x={300} y1={105} y2={145} />
        <AV x={450} y1={105} y2={145} />
        <B x={75} y={150} w={150} h={60} label="ChatGPT" sub="会話" />
        <B x={240} y={150} w={120} h={60} label="DALL·E" sub="画像" />
        <B x={375} y={150} w={150} h={60} label="Sora" sub="動画" />
        <T x={300} y={248} text="Microsoftと提携。Copilotのエンジンにも採用" size={13} />
      </Svg>
    ),
  },
  anthropic: {
    caption: "「安全に、強く」を掲げるClaudeの生みの親",
    render: () => (
      <Svg h={270} title="Anthropicの図解">
        <B x={190} y={30} w={220} h={70} label="Anthropic" sub="安全性重視のAI企業" fill={YELLOW} />
        <AV x={150} y1={105} y2={145} />
        <AV x={300} y1={105} y2={145} />
        <AV x={450} y1={105} y2={145} />
        <B x={70} y={150} w={160} h={60} label="Claude" sub="チャットAI" />
        <B x={245} y={150} w={170} h={60} label="Claude Code" sub="コーディング" />
        <B x={430} y={150} w={110} h={60} label="MCP" sub="接続規格" />
        <T x={300} y={248} text="このサイトもほぼClaude Code製" size={13} />
      </Svg>
    ),
  },
  "zero-shot": {
    caption: "ズレたら例を見せる。それだけで出力が揃う",
    render: () => (
      <Svg h={300} title="ゼロショットとフューショットの図解">
        <T x={30} y={40} text="ゼロショット" size={15} color={INK} anchor="start" bold />
        <B x={30} y={55} w={240} h={60} label="「要約して」" sub="お手本0個でいきなり" />
        <T x={330} y={40} text="フューショット" size={15} color={INK} anchor="start" bold />
        <B x={330} y={55} w={240} h={60} label={"例1→ 例2→ 本番"} sub="お手本を見せてから" fill={YELLOW} />
        <AV x={150} y1={122} y2={162} />
        <AV x={450} y1={122} y2={162} />
        <B x={30} y={167} w={240} h={55} label="形式がブレがち" dashed />
        <B x={330} y={167} w={240} h={55} label="形式ピタッと揃う" fill={RED} color="#fff" />
        <T x={300} y={268} text="理想の出力例を1つ貼るのが、長い説明より速くて確実" size={13} />
      </Svg>
    ),
  },
  "chain-of-thought": {
    caption: "途中式を書かせると、AIも計算ミスが減る",
    render: () => (
      <Svg h={290} title="チェーンオブソートの図解">
        <B x={30} y={40} w={160} h={60} label="質問" />
        <AH x1={195} x2={250} y={70} />
        <B x={255} y={40} w={130} h={60} label="即答" dashed />
        <T x={480} y={78} text="→ ミスしがち" size={14} color={INK} />
        <B x={30} y={140} w={160} h={60} label="質問" />
        <AH x1={195} x2={250} y={170} />
        <B x={255} y={140} w={230} h={60} label={"考える過程を\n順番に書く"} fill={YELLOW} />
        <T x={545} y={178} text="→ 正答率UP" size={14} color={INK} anchor="end" />
        <T x={300} y={260} text="この知見をモデルに組み込んだのが「推論モデル」" size={13} />
      </Svg>
    ),
  },
  "reinforcement-learning": {
    caption: "正解を教えず、ご褒美で行動を磨いていく",
    render: () => (
      <Svg h={290} title="強化学習の図解">
        <B x={60} y={50} w={160} h={70} label="AI" sub="やってみる" fill={YELLOW} />
        <AH x1={225} x2={365} y={85} label="行動" />
        <B x={370} y={50} w={170} h={70} label="環境" sub="ゲーム・現実" />
        <line x1={455} y1={125} x2={455} y2={190} stroke={INK} strokeWidth={3.5} />
        <line x1={455} y1={190} x2={150} y2={190} stroke={INK} strokeWidth={3.5} />
        <AV x={150} y1={190} y2={130} />
        <T x={300} y={182} text="報酬（うまくいったらご褒美）" size={13} color={INK} />
        <T x={300} y={245} text="試行錯誤の果てに、人間が教えていない一手を見つけることも" size={13} />
      </Svg>
    ),
  },
  rlhf: {
    caption: "人間の「こっちが好き」をご褒美にして調教する",
    render: () => (
      <Svg h={290} title="RLHFの図解">
        <B x={30} y={40} w={130} h={55} label="答えA" />
        <B x={30} y={110} w={130} h={55} label="答えB" />
        <AH x1={165} x2={225} y={105} label="比べる" />
        <B x={230} y={70} w={150} h={70} label="人間" sub="Aが好み！" fill={YELLOW} />
        <AH x1={385} x2={445} y={105} label="報酬に" />
        <B x={450} y={70} w={130} h={70} label={"AIを調教"} fill={RED} color="#fff" />
        <T x={300} y={230} text="ChatGPTが「感じのいいAI」になれた立役者" size={13.5} />
        <T x={300} y={258} text="副作用: 好かれようとしてお世辞が増える" size={12.5} />
      </Svg>
    ),
  },
  overfitting: {
    caption: "過去問だけ完璧な受験生は、本番で崩れる",
    render: () => (
      <Svg h={280} title="過学習の図解">
        <B x={45} y={45} w={220} h={70} label="学習データ" sub="過去問" fill={YELLOW} />
        <B x={335} y={45} w={220} h={70} label="初見のデータ" sub="本番の問題" />
        <AV x={155} y1={120} y2={160} />
        <AV x={445} y1={120} y2={160} />
        <B x={45} y={165} w={220} h={55} label="正答率 100点" />
        <B x={335} y={165} w={220} h={55} label="正答率 50点…" fill={RED} color="#fff" />
        <T x={300} y={255} text="パターンではなく「たまたま」まで丸暗記してしまうのが原因" size={13} />
      </Svg>
    ),
  },
  "supervised-learning": {
    caption: "正解ラベル付きで学ぶか、正解なしで構造を見つけるか",
    render: () => (
      <Svg h={300} title="教師あり学習と教師なし学習の図解">
        <T x={30} y={40} text="教師あり学習" size={15} color={INK} anchor="start" bold />
        <B x={30} y={55} w={250} h={65} label={"問題＋正解のセット"} sub="この画像は猫、これは犬…" fill={YELLOW} />
        <AV x={155} y1={127} y2={165} />
        <B x={30} y={170} w={250} h={55} label="分類・予測を覚える" />
        <T x={330} y={40} text="教師なし学習" size={15} color={INK} anchor="start" bold />
        <B x={330} y={55} w={240} h={65} label={"正解なしのデータ"} sub="ラベルなしの山" />
        <AV x={450} y1={127} y2={165} />
        <B x={330} y={170} w={240} h={55} label="グループを自力発見" />
        <T x={300} y={268} text="LLMは「次の単語当て」を自動生成して学ぶ、いいとこ取り方式" size={12.5} />
      </Svg>
    ),
  },
  lora: {
    caption: "本体は凍結、小さな差分パーツだけを追加学習",
    render: () => (
      <Svg h={270} title="LoRAの図解">
        <B x={60} y={60} w={280} h={120} label={"巨大モデル本体"} sub="凍結（そのまま）" />
        <B x={370} y={85} w={170} h={70} label="LoRA" sub="小さなアダプタ" fill={YELLOW} />
        <AH x1={365} x2={345} y={120} />
        <T x={300} y={225} text="ギター本体は改造せず、エフェクターを足す感覚" size={13.5} />
        <T x={300} y={250} text="数十MBで絵柄・キャラ・口調を後付けできる" size={12.5} />
      </Svg>
    ),
  },
  quantization: {
    caption: "精度を少し削って、サイズと計算量を数分の1に",
    render: () => (
      <Svg h={270} title="量子化の図解">
        <B x={40} y={50} w={230} h={110} label={"元のモデル"} sub="小数点16桁の精密さ" />
        <AH x1={275} x2={335} y={105} label="丸める" />
        <B x={340} y={70} w={160} h={70} label={"量子化版"} sub="4桁くらいに" fill={YELLOW} />
        <T x={300} y={205} text="WAV→MP3と同じ発想。質は少し落ちるが劇的に軽い" size={13.5} />
        <T x={300} y={232} text="巨大モデルが家庭のPCで動くのは、たいていコレのおかげ" size={12.5} />
      </Svg>
    ),
  },
  alignment: {
    caption: "賢さの方向を、人間の意図に「揃える」",
    render: () => (
      <Svg h={280} title="アライメントの図解">
        <B x={40} y={45} w={220} h={70} label={"AIの最適化"} sub="言われたことを字義どおり" />
        <B x={340} y={45} w={220} h={70} label={"人間の意図"} sub="行間・常識・価値観" fill={YELLOW} />
        <AH x1={265} x2={335} y={80} label="揃える" />
        <B x={150} y={160} w={300} h={60} label="安全で役に立つAI" fill={RED} color="#fff" />
        <AV x={300} y1={120} y2={155} />
        <T x={300} y={255} text="「テストで高得点を取れ」→カンニング、を防ぐしつけの技術" size={13} />
      </Svg>
    ),
  },
  benchmark: {
    caption: "AIたちの共通テスト。ただし過信は禁物",
    render: () => (
      <Svg h={280} title="ベンチマークの図解">
        <B x={30} y={40} w={130} h={55} label="モデルA" />
        <B x={30} y={105} w={130} h={55} label="モデルB" />
        <B x={30} y={170} w={130} h={55} label="モデルC" />
        <AH x1={165} x2={230} y={132} label="受験" />
        <B x={235} y={95} w={170} h={75} label={"共通テスト"} sub="数学・コード・知識" fill={YELLOW} />
        <AH x1={410} x2={465} y={132} />
        <B x={470} y={95} w={110} h={75} label={"スコア\n比較"} />
        <T x={300} y={258} text="過去問混入や対策済みの「自己ベスト」もある。最後は自分の用途で試す" size={12.5} />
      </Svg>
    ),
  },
  cursor: {
    caption: "エディタの中にAIが同居する「一緒に書く」体験",
    render: () => (
      <Svg h={270} title="Cursorの図解">
        <B x={50} y={50} w={280} h={120} label={"コードエディタ"} sub="VS Code系の見た目" />
        <B x={110} y={95} w={160} h={55} label="AIが同居" fill={YELLOW} />
        <B x={390} y={75} w={160} h={70} label={"人間"} sub="Tabで提案を採用" />
        <AH x1={335} x2={385} y={110} />
        <T x={300} y={225} text="エージェント型（任せて待つ）に対して、エディタ型（隣で一緒に書く）" size={12.5} />
      </Svg>
    ),
  },
  "coding-agent": {
    caption: "書く→動かす→直すのループを自分で回して完成まで",
    render: () => (
      <Svg h={290} title="コーディングエージェントの図解">
        <B x={30} y={70} w={150} h={70} label={"人間の指示"} sub="このアプリ作って" fill={YELLOW} />
        <AH x1={185} x2={240} y={105} />
        <B x={245} y={40} w={130} h={50} label="書く" />
        <B x={245} y={100} w={130} h={50} label="実行する" />
        <B x={245} y={160} w={130} h={50} label="直す" />
        <T x={385} y={110} text="⟳ 自走" size={15} color={INK} anchor="start" bold />
        <AH x1={445} x2={495} y={105} />
        <B x={470} y={70} w={110} h={70} label="完成" fill={RED} color="#fff" />
        <T x={300} y={262} text="人間の仕事は「何を作るか決める」と「レビュー」に変わる" size={13} />
      </Svg>
    ),
  },
  dify: {
    caption: "ブロックを線でつなぐだけでAIアプリの流れを作れる",
    render: () => (
      <Svg h={260} title="Difyの図解">
        <B x={25} y={70} w={125} h={70} label="質問受付" />
        <AH x1={155} x2={195} y={105} />
        <B x={200} y={70} w={130} h={70} label="資料を検索" fill={YELLOW} />
        <AH x1={335} x2={375} y={105} />
        <B x={380} y={70} w={100} h={70} label="LLM" fill={YELLOW} />
        <AH x1={485} x2={520} y={105} />
        <B x={525} y={70} w={55} h={70} label="回答" />
        <T x={300} y={195} text="プログラミングなしでRAGやエージェントを組める" size={13.5} />
        <T x={300} y={222} text="業務部門が試作→当たったら本実装、の分業が広がる" size={12.5} />
      </Svg>
    ),
  },
  "stable-diffusion": {
    caption: "ノイズから少しずつ絵を彫り出す「拡散モデル」",
    render: () => (
      <Svg h={260} title="Stable Diffusionの図解">
        <B x={30} y={60} w={150} h={90} label={"ノイズ"} sub="砂嵐" />
        <AH x1={185} x2={235} y={105} />
        <B x={240} y={60} w={150} h={90} label={"ぼんやり"} sub="形が見えてくる" fill={YELLOW} />
        <AH x1={395} x2={445} y={105} />
        <B x={450} y={60} w={130} h={90} label="完成の絵" fill={RED} color="#fff" />
        <T x={300} y={200} text="モデル自体が公開され、誰でも改造・再配布できたことが革命" size={13} />
      </Svg>
    ),
  },
  grok: {
    caption: "X（旧Twitter）と一体化した「いま」に強いAI",
    render: () => (
      <Svg h={260} title="Grokの図解">
        <B x={60} y={60} w={200} h={90} label="X" sub="いまの投稿・話題" fill={BLUE} color="#fff" />
        <AH x1={265} x2={330} y={90} label="リアルタイム" />
        <AH x1={330} x2={265} y={125} />
        <B x={335} y={60} w={200} h={90} label="Grok" sub="xAIのチャットAI" fill={YELLOW} />
        <T x={300} y={200} text="「今タイムラインで起きていること」への強さが売り" size={13.5} />
        <T x={300} y={227} text="規制の緩さゆえの物議も多く、企業利用は慎重に" size={12.5} />
      </Svg>
    ),
  },
  llama: {
    caption: "「もらって育てる」オープンAI文化の土台",
    render: () => (
      <Svg h={280} title="Llamaの図解">
        <B x={180} y={35} w={240} h={70} label="Llama" sub="Metaが無料公開" fill={YELLOW} />
        <AV x={150} y1={110} y2={150} />
        <AV x={300} y1={110} y2={150} />
        <AV x={450} y1={110} y2={150} />
        <B x={65} y={155} w={170} h={60} label={"自社サーバー\nで動かす"} />
        <B x={250} y={155} w={130} h={60} label={"業界特化に\n改造"} />
        <B x={395} y={155} w={160} h={60} label={"派生モデルを\n公開"} />
        <T x={300} y={255} text="狙いは生態系戦略。「オープン対クローズド」がAI業界の対立軸" size={12.5} />
      </Svg>
    ),
  },
  "music-generation-ai": {
    caption: "雑な注文から、ボーカル入りの完成曲まで数十秒",
    render: () => (
      <Svg h={260} title="音楽生成AIの図解">
        <B x={30} y={55} w={220} h={95} label={"「昭和歌謡風で\n雨の火曜日の曲」"} sub="ことばで注文" />
        <AH x1={255} x2={320} y={100} label="数十秒" />
        <B x={325} y={55} w={250} h={95} label={"完成曲"} sub="歌声＋伴奏＋ミックス" fill={YELLOW} />
        <T x={300} y={200} text="SunoやUdioが代表格。BGMやオリジナル曲づくりが個人の手に" size={13} />
        <T x={300} y={227} text="学習データの著作権をめぐる訴訟も進行中。商用は規約確認を" size={12.5} />
      </Svg>
    ),
  },
  "voice-ai": {
    caption: "聞き取る「耳」と、話す「口」。AIの音声インターフェース",
    render: () => (
      <Svg h={280} title="音声AIの図解">
        <B x={40} y={45} w={230} h={75} label={"音声認識"} sub="声→文字（AIの耳）" fill={YELLOW} />
        <B x={330} y={45} w={230} h={75} label={"音声合成"} sub="文字→声（AIの口）" fill={YELLOW} />
        <AV x={155} y1={125} y2={160} />
        <AV x={445} y1={125} y2={160} />
        <B x={40} y={165} w={230} h={55} label="議事録・文字起こし" />
        <B x={330} y={165} w={230} h={55} label="読み上げ・AI通話" />
        <T x={300} y={258} text="数秒のサンプルで本人そっくりの声も作れる時代。声も証拠にならない" size={12} />
      </Svg>
    ),
  },
  "edge-ai": {
    caption: "クラウドに送らず、手元の機器の中でAIが考える",
    render: () => (
      <Svg h={290} title="エッジAIの図解">
        <T x={30} y={40} text="クラウドAI" size={15} color={INK} anchor="start" bold />
        <B x={30} y={55} w={240} h={60} label={"端末 ⇄ 遠くのサーバー"} sub="往復のぶん遅延・通信費" dashed />
        <T x={330} y={40} text="エッジAI" size={15} color={INK} anchor="start" bold />
        <B x={330} y={55} w={240} h={60} label={"端末の中で完結"} sub="速い・オフラインOK" fill={YELLOW} />
        <B x={330} y={140} w={240} h={55} label={"データが外に出ない"} fill={RED} color="#fff" />
        <AV x={450} y1={122} y2={135} />
        <T x={300} y={250} text="スマホの通訳モードや「AI PC」の正体。NPUという専用チップが担う" size={12.5} />
      </Svg>
    ),
  },
  "physical-ai": {
    caption: "画面の中のAIから、身体を持って働くAIへ",
    render: () => (
      <Svg h={280} title="フィジカルAIの図解">
        <B x={40} y={50} w={220} h={80} label={"これまでのAI"} sub="言葉と画面の世界" />
        <AH x1={265} x2={335} y={90} label="次の波" />
        <B x={340} y={50} w={220} h={80} label={"フィジカルAI"} sub="重力・摩擦のある現実" fill={YELLOW} />
        <B x={40} y={165} w={160} h={55} label="工場ロボット" />
        <B x={215} y={165} w={170} h={55} label="自動運転" />
        <B x={400} y={165} w={160} h={55} label="人型ロボット" />
        <T x={300} y={258} text="物理世界の常識（ワールドモデル）が次の主戦場" size={13} />
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
