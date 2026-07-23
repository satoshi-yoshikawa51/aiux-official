/* ============================================================
   講師ガイドのコース定義（データ駆動）
   - CONTENT_PLAN.md のコース設計をシミュレーターで体験できる形に翻訳
   - target は game.tsx の data-guide 属性名
   - waitFor はシミュレーターの操作イベントによる達成判定
   - skipIf は状況的に不要なステップの自動スキップ（例: すでにPC表示）
   ============================================================ */
import type { SimEvent } from "./game";
import type { SenseiMotion } from "./sensei";

export interface GuideCtx {
  device: "pc" | "sp";
  tab: "chat" | "cowork" | "code";
}

export interface GuideStep {
  text: string;
  motion?: SenseiMotion;
  emote?: string;
  target?: string;
  waitFor?: (e: SimEvent) => boolean;
  onDone?: { motion?: SenseiMotion; emote?: string };
  skipIf?: (ctx: GuideCtx) => boolean;
}

export interface Course {
  id: string;
  emoji: string;
  title: string;
  minutes: number;
  desc: string;
  steps: GuideStep[];
}

/* PC表示への切り替え（スマホ表示だとタブがドロワー内で迷いやすいため、
   ガイドはPC表示ベースで進める。すでにPCならスキップ） */
const ensurePc: GuideStep = {
  motion: "explain",
  target: "device-pc",
  text: "ガイドはPC版の画面で進めます。「💻 PC」をクリックして表示を切り替えてください。",
  waitFor: (e) => e.type === "deviceChange" && e.device === "pc",
  skipIf: (ctx) => ctx.device === "pc",
};

/* ———— コース0: はじめの一歩「3つの入口を開ける」 ———— */
const COURSE_0: Course = {
  id: "start",
  emoji: "🚪",
  title: "はじめの一歩 — 3つの入口",
  minutes: 3,
  desc: "Chat / Cowork / Code の違いは「どこで働かせるか」。判断軸を体で覚える",
  steps: [
    {
      motion: "bow",
      text: "こんにちは！Claude教習所の講師、そらです。最初のコースでは、Claudeの3つの働き場所をぐるっと見て回ります。",
    },
    ensurePc,
    {
      motion: "explain",
      emote: "💡",
      text: "大事なのはこれだけ——中身は同じClaude、違うのは「どこで働くか」。チャットの中・あなたのPCの中・ターミナルの3つです。",
    },
    {
      motion: "explain",
      target: "tab-chat",
      text: "まずは「チャット」タブから。すでに開いていたらそのままクリックでOKです。",
      waitFor: (e) => e.type === "tabChange" && e.tab === "chat",
      skipIf: (ctx) => ctx.tab === "chat",
    },
    {
      motion: "explain",
      target: "new-chat",
      text: "「＋新しいチャット」をクリックして、真っさらな画面にしましょう。",
      waitFor: (e) => e.type === "newChat",
    },
    {
      motion: "explain",
      target: "suggest-0",
      text: "いま開いているのが「チャット」。まずは気軽にひとこと。最初の提案をクリックして送ってみてください。",
      waitFor: (e) => e.type === "send" && e.tab === "chat",
      onDone: { motion: "laugh", emote: "✨" },
    },
    {
      motion: "explain",
      text: "返事が流れるように届きましたね。これがストリーミング。Chatは「その場で終わる相談」の入口です。",
    },
    {
      motion: "explain",
      target: "tab-cowork",
      text: "次は「Cowork」タブへ。ここはClaudeが“あなたのPCの中”で働くモードです。",
      waitFor: (e) => e.type === "tabChange" && e.tab === "cowork",
      onDone: { motion: "laugh", emote: "✨" },
    },
    {
      motion: "explain",
      text: "Coworkはフォルダを渡して仕事を丸ごと任せる場所。ファイルの読み書きも、成果物の保存もPCの中で起きます。「プロジェクトとして進める」ならここ。",
    },
    {
      motion: "explain",
      target: "tab-code",
      text: "最後は「コード」タブ。“実際に何かを作る”ための入口です。",
      waitFor: (e) => e.type === "tabChange" && e.tab === "code",
      onDone: { motion: "laugh", emote: "✨" },
    },
    {
      motion: "explain",
      emote: "💡",
      text: "よくある誤解をひとつ——CodeにGitHubは必須ではありません！フォルダを1つ選べば始められます。GitHubが要るのは公開・共有したくなってから。",
    },
    {
      motion: "bow",
      text: "覚えて帰るのはこの1枚だけ。「その場で終わる相談→Chat」「貯めて進める→Cowork」「作る・動かす→Code」。次のコースで、それぞれを実際に使い込みますよ。",
    },
  ],
};

/* ———— コース1: Chat編「その場で終わる相談」 ———— */
const COURSE_1: Course = {
  id: "chat",
  emoji: "💬",
  title: "Chat編 — その場で終わる相談",
  minutes: 5,
  desc: "壁打ち・注文の重ねがけ・新しいチャットの使い分け。Chatの強みを体感",
  steps: [
    {
      motion: "bow",
      text: "Chat編へようこそ！Chatの合言葉は「その場で終わる相談」。調べ物、壁打ち、文章づくりの入口です。",
    },
    ensurePc,
    {
      motion: "explain",
      target: "tab-chat",
      text: "まず「チャット」タブに切り替えましょう。",
      waitFor: (e) => e.type === "tabChange" && e.tab === "chat",
      skipIf: (ctx) => ctx.tab === "chat",
    },
    {
      motion: "explain",
      target: "new-chat",
      text: "「＋新しいチャット」で新しい会話を始めます。",
      waitFor: (e) => e.type === "newChat",
    },
    {
      motion: "explain",
      target: "suggest-2",
      text: "コツを聞いてみます。「AIを使いこなすコツを3つ教えて」をクリック。",
      waitFor: (e) => e.type === "send" && e.tab === "chat",
      onDone: { motion: "laugh", emote: "✨" },
    },
    {
      motion: "explain",
      emote: "💡",
      text: "ポイントは“一度で完璧を求めない”こと。出てきた答えに注文を重ねられるのがAIとの会話です。",
    },
    {
      motion: "explain",
      target: "input",
      text: "下の入力欄に「もっと短く」と打って送信してみてください。",
      waitFor: (e) => e.type === "send" && e.tab === "chat",
      onDone: { motion: "laugh", emote: "💮" },
    },
    {
      motion: "explain",
      text: "同じチャットの中では、Claudeは前のやりとりを覚えています。だから「さっきのを短く」が通じるんです。",
    },
    {
      motion: "explain",
      target: "new-chat",
      text: "そして大事な習慣——新しい話題は新しいチャットで。「＋新しいチャット」をクリック。",
      waitFor: (e) => e.type === "newChat",
      onDone: { motion: "laugh", emote: "✨" },
    },
    {
      motion: "explain",
      target: "model",
      text: "最後にモデル切替。難しい仕事はOpus、日常はSonnet、軽い作業はHaiku。切り替えてみましょう。",
      waitFor: (e) => e.type === "modelChange",
      onDone: { motion: "laugh", emote: "✨" },
    },
    {
      motion: "bow",
      text: "Chat編、修了です🎉 「背景ごと伝える」「注文を重ねる」「新しい話題は新しいチャットで」——この3つがChatを使いこなすコツです。",
    },
  ],
};

/* ———— コース2: Cowork編「貯めて進める」 ———— */
const COURSE_2: Course = {
  id: "cowork",
  emoji: "🤝",
  title: "Cowork編 — 貯めて進める",
  minutes: 5,
  desc: "フォルダを渡して仕事を任せ、成果物を受け取り、注文を重ねる",
  steps: [
    {
      motion: "bow",
      text: "Cowork編へようこそ！ここは「プロジェクトとして進める」仕事の場所。実は私が一番よく使うモードです。",
    },
    ensurePc,
    {
      motion: "explain",
      target: "tab-cowork",
      text: "「Cowork」タブに切り替えましょう。",
      waitFor: (e) => e.type === "tabChange" && e.tab === "cowork",
      skipIf: (ctx) => ctx.tab === "cowork",
    },
    {
      motion: "explain",
      target: "new-chat",
      text: "「＋新しいタスク」をクリックして、新しい仕事を始める準備をします。",
      waitFor: (e) => e.type === "newChat",
    },
    {
      motion: "explain",
      target: "folder",
      emote: "📁",
      text: "Coworkは案件ごとにフォルダを渡すのが基本。📁チップから好きなフォルダを選んでください。初めてのフォルダは「アクセス許可」の確認が出ます。",
      waitFor: (e) => e.type === "folderChange",
      onDone: { motion: "laugh", emote: "✨" },
    },
    {
      motion: "explain",
      target: "suggest-1",
      text: "仕事を丸ごと任せてみます。「企画書のたたき台を作って」をクリック。",
      waitFor: (e) => e.type === "send" && e.tab === "cowork",
    },
    {
      motion: "arms-crossed",
      text: "計画 → 作業ログ → 完了、と進んでいくのを見守りましょう。本物のCoworkはクラウドで動くので、この間アプリを閉じてもOKなんです。",
    },
    {
      motion: "explain",
      target: "artifact",
      text: "成果物がファイルとして残りました。カードをクリックして中身をプレビューしてみてください。",
      waitFor: (e) => e.type === "artifactOpen",
      onDone: { motion: "laugh", emote: "🎉" },
    },
    {
      motion: "explain",
      target: "input",
      text: "仕上げの注文もできます。「もっと短く」と送ってみましょう。同じタスクの続きとして反映されます。",
      waitFor: (e) => e.type === "send" && e.tab === "cowork",
      onDone: { motion: "laugh", emote: "💮" },
    },
    {
      motion: "bow",
      text: "Cowork編、修了です🎉 「フォルダごと渡す」「任せて見守る」「成果物に注文を重ねる」。回を重ねるほど文脈が貯まって、どんどん楽になりますよ。",
    },
  ],
};

/* ———— コース3: Code編「作る・動かす」 ———— */
const COURSE_3: Course = {
  id: "code",
  emoji: "⌨️",
  title: "Code編 — 作る・動かす",
  minutes: 7,
  desc: "権限モードの使い分け、diff承認、コマンド許可。開発の一連を体験",
  steps: [
    {
      motion: "bow",
      text: "Code編へようこそ！ここは「実際に何かを作る」モード。プログラミング知識ゼロでも大丈夫、進め方を一緒に覚えましょう。",
    },
    ensurePc,
    {
      motion: "explain",
      target: "tab-code",
      text: "「コード」タブに切り替えましょう。",
      waitFor: (e) => e.type === "tabChange" && e.tab === "code",
      skipIf: (ctx) => ctx.tab === "code",
    },
    {
      motion: "explain",
      target: "new-chat",
      text: "「＋新しいセッション」をクリックして、まっさらな状態から始めます。",
      waitFor: (e) => e.type === "newChat",
    },
    {
      motion: "explain",
      target: "folder",
      text: "まずフォルダ選び。GitHubは不要です！📁チップからフォルダを選んでください。",
      waitFor: (e) => e.type === "folderChange",
      onDone: { motion: "laugh", emote: "✨" },
    },
    {
      motion: "explain",
      target: "perm",
      emote: "🛡️",
      text: "Codeの安全装置が「権限モード」。まずは慎重派の使い方から——🛡チップから「Plan」を選んでください。計画だけ立てて、ファイルには触らないモードです。",
      waitFor: (e) => e.type === "permChange" && e.permMode === "plan",
      onDone: { motion: "laugh", emote: "✨" },
    },
    {
      motion: "explain",
      target: "suggest-1",
      text: "Planモードのまま「TODOリストのWebアプリを作って」を送ってみましょう。",
      waitFor: (e) => e.type === "send" && e.tab === "code",
    },
    {
      motion: "explain",
      text: "ほら、計画だけ提案して止まりましたね。方針を安全に確認したいときはPlanが便利。では実装に進みましょう。",
    },
    {
      motion: "explain",
      target: "perm",
      text: "🛡チップから「Manual」に戻してください。編集のたびに承認を求める、初心者に安心のモードです。",
      waitFor: (e) => e.type === "permChange" && e.permMode === "manual",
      onDone: { motion: "laugh", emote: "✨" },
    },
    {
      motion: "explain",
      target: "new-chat",
      text: "新しいセッションで作り直します。「＋新しいセッション」をクリック。",
      waitFor: (e) => e.type === "newChat",
    },
    {
      motion: "explain",
      target: "suggest-0",
      text: "今度は「おみくじアプリを作って」を送信！",
      waitFor: (e) => e.type === "send" && e.tab === "code",
    },
    {
      motion: "arms-crossed",
      target: "accept",
      text: "Claudeが変更内容をdiff（差分）で提案してきます。緑が追加・赤が削除。「✓ Accept」で承認しましょう。",
      waitFor: (e) => e.type === "diffResolved",
      onDone: { motion: "laugh", emote: "✨" },
    },
    {
      motion: "explain",
      target: "approve",
      text: "コマンドの実行にも許可が要ります。「✓ 許可する」をクリック。",
      waitFor: (e) => e.type === "approvalResolved",
    },
    {
      motion: "explain",
      target: "artifact",
      text: "完成です！成果物カードから、実際に動くおみくじを引いてみてください🎋",
      waitFor: (e) => e.type === "artifactOpen",
      onDone: { motion: "laugh", emote: "🎉" },
    },
    {
      motion: "bow",
      text: "Code編、修了です🎉 「自然言語で頼む→diffを承認→コマンドを許可→動くものができる」。この流れさえ覚えれば、アプリもWebサイトも作れます。",
    },
  ],
};

/* ———— コース4: 総まとめ「迷ったら3つの質問」 ———— */
const COURSE_4: Course = {
  id: "matome",
  emoji: "🧭",
  title: "総まとめ — 迷ったら3つの質問",
  minutes: 2,
  desc: "どのモードを使うか迷ったときの判断軸を最終確認",
  steps: [
    {
      motion: "bow",
      text: "総まとめです。ここまでのコース、おつかれさまでした！最後に「どれを使うか」の判断軸を確認しましょう。",
    },
    {
      motion: "explain",
      emote: "1️⃣",
      text: "質問その1——「その場で終わる相談？」ならChat。調べ物・壁打ち・文章化。ChatGPTと同じ感覚で、でも逆質問や図解が返ってきます。",
    },
    {
      motion: "explain",
      emote: "2️⃣",
      text: "質問その2——「続きがある？情報を貯めたい？」ならCowork。案件フォルダを渡して、成果物とやりとりを蓄積。回を重ねるほど賢くなります。",
    },
    {
      motion: "explain",
      emote: "3️⃣",
      text: "質問その3——「作る？動かす?」ならCode。GitHubなしで始めて、diff承認とコマンド許可で安全に。動くものが手に入ります。",
    },
    {
      motion: "explain",
      emote: "💡",
      text: "そして裏ワザ——一度やった手順は「skill」にすれば、どの入口からでも一言で再現できます。手順を貯めれば貯めるほど、次がラクになる。",
    },
    {
      motion: "laugh",
      emote: "🎓",
      text: "全コース修了、おめでとうございます🎉 あとは本物のClaudeで、今日の仕事をひとつ任せてみるだけ。応援しています！",
    },
  ],
};

export const COURSES: Course[] = [COURSE_0, COURSE_1, COURSE_2, COURSE_3, COURSE_4];
