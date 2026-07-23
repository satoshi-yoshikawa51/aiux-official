/* ============================================================
   講師ガイドのコース定義（データ駆動）
   - CONTENT_PLAN.md のコース設計をシミュレーターで体験できる形に翻訳
   - target は game.tsx の data-guide 属性名
   - waitFor はシミュレーターの操作イベントによる達成判定
   - skipIf は状況的に不要なステップの自動スキップ（例: すでにPC表示）

   講師のキャラクター: ちょっとぶっきらぼうで口数少なめ、
   でも要所ではちゃんと褒めて、最後は優しく送り出す女性上司。
   短文・言い切り・照れ隠し気味の労いが基本。絵文字は使わない。
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
  text: "先にPC画面にして。「💻 PC」を押す。話はそれから。",
  waitFor: (e) => e.type === "deviceChange" && e.device === "pc",
  skipIf: (ctx) => ctx.device === "pc",
};

/* ———— コース0: はじめの一歩「3つの入口を開ける」 ———— */
const COURSE_0: Course = {
  id: "start",
  emoji: "🚪",
  title: "はじめの一歩 — 3つの入口",
  minutes: 4,
  desc: "Chat / Cowork / Code の違いは「どこで働かせるか」。3つとも軽くさわって判断軸を体で覚える",
  steps: [
    {
      motion: "bow",
      text: "…来たね。ここはClaude教習所。教えるのは私。最初は、Claudeの3つの働き場所をひと回りする。ついてきて。",
    },
    ensurePc,
    {
      motion: "explain",
      emote: "💡",
      text: "覚えることは1つだけ。中身は同じClaude、違うのは“どこで働くか”。チャットの中、あなたのPCの中、ターミナル。以上。",
    },
    {
      motion: "explain",
      target: "tab-chat",
      text: "まず「チャット」タブ。開いてたら、そのまま押せばいい。",
      waitFor: (e) => e.type === "tabChange" && e.tab === "chat",
      skipIf: (ctx) => ctx.tab === "chat",
    },
    {
      motion: "explain",
      target: "new-chat",
      text: "「＋新しいチャット」。まっさらから始めるのが基本。",
      waitFor: (e) => e.type === "newChat",
    },
    {
      motion: "explain",
      target: "suggest-0",
      text: "挨拶でもしてみたら。最初の提案、押してみて。",
      waitFor: (e) => e.type === "send" && e.tab === "chat",
      onDone: { motion: "laugh", emote: "✨" },
    },
    {
      motion: "explain",
      text: "…返ってきたでしょ。これがストリーミング。Chatは“その場で終わる相談”の入口。",
    },
    {
      motion: "explain",
      target: "tab-cowork",
      text: "次。「Cowork」タブ。",
      waitFor: (e) => e.type === "tabChange" && e.tab === "cowork",
      onDone: { motion: "laugh", emote: "✨" },
    },
    {
      motion: "explain",
      emote: "📁",
      text: "ここはあなたのPCの中で働くモード。案件ごとにフォルダを渡す——それが“プロジェクト”。やりとりも成果物も、ぜんぶそこに貯まっていく。",
    },
    {
      motion: "explain",
      target: "folder",
      text: "試しに渡してみて。📁からフォルダを選ぶ。初めてなら許可を聞かれるから、中身を見て、許可。",
      waitFor: (e) => e.type === "folderChange",
      onDone: { motion: "laugh", emote: "✨" },
    },
    {
      motion: "explain",
      text: "これで準備完了。あとは仕事を頼むだけ。ここが“貯めて進める”の入口。…続きはCowork編でやる。",
    },
    {
      motion: "explain",
      target: "tab-code",
      text: "最後。「コード」タブ。",
      waitFor: (e) => e.type === "tabChange" && e.tab === "code",
      onDone: { motion: "laugh", emote: "✨" },
    },
    {
      motion: "explain",
      emote: "💡",
      text: "言っとくけど、CodeにGitHubは要らないから。フォルダ1つで始められる。公開したくなってから考えれば十分。",
    },
    {
      motion: "explain",
      target: "perm",
      emote: "🛡️",
      text: "そしてCodeだけの装備が、これ。“権限モード”。🛡を開いて「Plan」にしてみて。",
      waitFor: (e) => e.type === "permChange" && e.permMode === "plan",
      onDone: { motion: "laugh", emote: "✨" },
    },
    {
      motion: "explain",
      text: "なぜ承認制か。Codeは“本物のファイル”を直接書き換えるモードだから。公開中のサイトも、大事な書類も対象になる。面倒に見える？——これが命綱。だから編集も実行も、あなたが承認するまで一切動かない。",
    },
    {
      motion: "explain",
      target: "perm",
      text: "見たら「Manual」に戻しておいて。基本はそれで進める。",
      waitFor: (e) => e.type === "permChange" && e.permMode === "manual",
      onDone: { motion: "laugh", emote: "✨" },
    },
    {
      motion: "bow",
      text: "今日はここまで。“その場で終わる→Chat、貯めて進める→Cowork、作る→Code”。これだけ覚えて帰って。…最初にしては、悪くなかった。",
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
      text: "Chat編。Chatの仕事は“その場で終わる相談”。調べ物、壁打ち、文章。さっさと覚えよう。",
    },
    ensurePc,
    {
      motion: "explain",
      target: "tab-chat",
      text: "「チャット」タブに切り替えて。",
      waitFor: (e) => e.type === "tabChange" && e.tab === "chat",
      skipIf: (ctx) => ctx.tab === "chat",
    },
    {
      motion: "explain",
      target: "new-chat",
      text: "まず「＋新しいチャット」。",
      waitFor: (e) => e.type === "newChat",
    },
    {
      motion: "explain",
      target: "suggest-2",
      text: "コツでも聞いてみれば。「AIを使いこなすコツを3つ教えて」、押して。",
      waitFor: (e) => e.type === "send" && e.tab === "chat",
      onDone: { motion: "laugh", emote: "✨" },
    },
    {
      motion: "explain",
      emote: "💡",
      text: "いい？一度で完璧を求めない。出てきたものに注文をつける。それがAIと仕事するときの基本。",
    },
    {
      motion: "explain",
      target: "input",
      text: "入力欄に「もっと短く」って打って、送信。…ああ、ここの返事は台本だから。本物は内容に合わせて返してくる。",
      waitFor: (e) => e.type === "send" && e.tab === "chat",
      onDone: { motion: "laugh", emote: "💮" },
    },
    {
      motion: "explain",
      text: "同じチャットの中なら、前の話を覚えてる。だから“さっきのを短く”が通じる。",
    },
    {
      motion: "explain",
      target: "new-chat",
      text: "話題を変えるときは新しいチャット。混ぜると答えがぶれる。押して。",
      waitFor: (e) => e.type === "newChat",
      onDone: { motion: "laugh", emote: "✨" },
    },
    {
      motion: "explain",
      target: "model",
      text: "モデルの使い分け。難しい仕事はOpus、日常はSonnet、軽いのはHaiku。試しに切り替えてみて。",
      waitFor: (e) => e.type === "modelChange",
      onDone: { motion: "laugh", emote: "✨" },
    },
    {
      motion: "bow",
      text: "Chat編、終わり。“背景ごと伝える・注文を重ねる・話題ごとに分ける”。…飲み込み、早いじゃない。",
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
      text: "Cowork編。“貯めて進める”場所。…私が一番使ってるのは、ここ。",
    },
    ensurePc,
    {
      motion: "explain",
      target: "tab-cowork",
      text: "「Cowork」タブに切り替えて。",
      waitFor: (e) => e.type === "tabChange" && e.tab === "cowork",
      skipIf: (ctx) => ctx.tab === "cowork",
    },
    {
      motion: "explain",
      target: "new-chat",
      text: "「＋新しいタスク」から。",
      waitFor: (e) => e.type === "newChat",
    },
    {
      motion: "explain",
      target: "folder",
      emote: "📁",
      text: "Coworkは案件ごとにフォルダを渡す。📁から選んで。初めてのフォルダは許可を聞かれるから、内容を見て許可する。",
      waitFor: (e) => e.type === "folderChange",
      onDone: { motion: "laugh", emote: "✨" },
    },
    {
      motion: "explain",
      target: "suggest-1",
      text: "仕事を丸ごと任せてみようか。「企画書のたたき台を作って」、押して。",
      waitFor: (e) => e.type === "send" && e.tab === "cowork",
    },
    {
      motion: "arms-crossed",
      text: "計画、作業、完了。見てるだけでいい。本物はクラウドで動くから、この間アプリを閉じてても勝手に進む。",
    },
    {
      motion: "explain",
      target: "artifact",
      text: "成果物がファイルで残った。カードを押して、中身を確認して。",
      waitFor: (e) => e.type === "artifactOpen",
      onDone: { motion: "laugh", emote: "🎉" },
    },
    {
      motion: "explain",
      target: "input",
      text: "注文もつけられる。「もっと短く」って送って。…ここの返事は台本ね。本物は注文どおりに直してくる。",
      waitFor: (e) => e.type === "send" && e.tab === "cowork",
      onDone: { motion: "laugh", emote: "💮" },
    },
    {
      motion: "bow",
      text: "Cowork編、終わり。フォルダごと渡す、任せる、注文する。回を重ねるほど文脈が貯まって楽になる。…いい調子。",
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
      text: "Code編。“実際に作る”モード。プログラミング未経験？関係ない。手順だけ覚えて。",
    },
    ensurePc,
    {
      motion: "explain",
      target: "tab-code",
      text: "「コード」タブに切り替えて。",
      waitFor: (e) => e.type === "tabChange" && e.tab === "code",
      skipIf: (ctx) => ctx.tab === "code",
    },
    {
      motion: "explain",
      target: "new-chat",
      text: "「＋新しいセッション」。まっさらから。",
      waitFor: (e) => e.type === "newChat",
    },
    {
      motion: "explain",
      target: "folder",
      text: "フォルダを選ぶ。GitHub？要らないって言ったでしょ。📁から選んで。",
      waitFor: (e) => e.type === "folderChange",
      onDone: { motion: "laugh", emote: "✨" },
    },
    {
      motion: "explain",
      target: "perm",
      emote: "🛡️",
      text: "Codeの安全装置、“権限モード”。まず🛡から「Plan」にして。計画だけ立てて、ファイルには触らないモード。",
      waitFor: (e) => e.type === "permChange" && e.permMode === "plan",
      onDone: { motion: "laugh", emote: "✨" },
    },
    {
      motion: "explain",
      target: "suggest-1",
      text: "そのまま「TODOリストのWebアプリを作って」を送ってみて。",
      waitFor: (e) => e.type === "send" && e.tab === "code",
    },
    {
      motion: "explain",
      text: "ほら、計画だけ出して止まった。方針を安全に確かめたいときはこれでいい。…じゃ、実装いくよ。",
    },
    {
      motion: "explain",
      target: "perm",
      text: "🛡から「Manual」に戻して。編集のたびに確認してくるモード。最初はこれで十分。",
      waitFor: (e) => e.type === "permChange" && e.permMode === "manual",
      onDone: { motion: "laugh", emote: "✨" },
    },
    {
      motion: "explain",
      target: "new-chat",
      text: "「＋新しいセッション」。",
      waitFor: (e) => e.type === "newChat",
    },
    {
      motion: "explain",
      target: "suggest-0",
      text: "本命。「おみくじアプリを作って」、送信。",
      waitFor: (e) => e.type === "send" && e.tab === "code",
    },
    {
      motion: "arms-crossed",
      target: "accept",
      text: "変更の提案が来た。緑が追加、赤が削除。相手は本物のファイルだからね——中身を見て「✓ Accept」。承認するまで、1文字も書き換わらない。",
      waitFor: (e) => e.type === "diffResolved",
      onDone: { motion: "laugh", emote: "✨" },
    },
    {
      motion: "explain",
      target: "approve",
      text: "コマンドも許可制。間違ったコマンドは、公開中のものだって壊せる。だから中身を確認して「✓ 許可する」。この一手間が、あなたを守る。",
      waitFor: (e) => e.type === "approvalResolved",
    },
    {
      motion: "explain",
      target: "artifact",
      text: "できた。成果物カードから動かしてみて。",
      waitFor: (e) => e.type === "artifactOpen",
      onDone: { motion: "laugh", emote: "🎉" },
    },
    {
      motion: "bow",
      text: "Code編、終わり。頼む、承認する、許可する、動く。この流れだけ。…正直、ここまで来られるとは思ってなかった。上出来。",
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
      text: "総まとめ。ここまで付き合ったんだから、最後まで聞いていって。",
    },
    {
      motion: "explain",
      emote: "1️⃣",
      text: "質問その1。“その場で終わる相談？”ならChat。ChatGPTと同じ感覚でいい。ただ、向こうから逆質問と図解が返ってくるのはこっちだけ。",
    },
    {
      motion: "explain",
      emote: "2️⃣",
      text: "質問その2。“続きがある？情報を貯めたい？”ならCowork。案件フォルダを渡して、成果物とやりとりを積んでいく。",
    },
    {
      motion: "explain",
      emote: "3️⃣",
      text: "質問その3。“作る？動かす？”ならCode。GitHubなしで始めて、承認制で安全に。動くものが手に入る。",
    },
    {
      motion: "explain",
      emote: "💡",
      text: "おまけ。一度やった手順は“skill”にしておくと、次から一言で再現できる。手順は資産。貯めなさい。",
    },
    {
      motion: "explain",
      emote: "🚀",
      text: "ここから先は本物。claude.aiから無料で始められる。CoworkとCodeは、デスクトップアプリと有料プランで解放されていく。",
    },
    {
      motion: "explain",
      text: "この画面を閉じたすぐ下に、“本物のClaudeをはじめる”を置いといた。リンクも最初のひとことテンプレも揃えてある。…ここまでやったんだから、使いなさい。",
    },
    {
      motion: "laugh",
      emote: "🎓",
      text: "全コース修了。…よく頑張ったね。あとは今日の仕事をひとつ、Claudeに任せてみるだけ。いってらっしゃい。",
    },
  ],
};

export const COURSES: Course[] = [COURSE_0, COURSE_1, COURSE_2, COURSE_3, COURSE_4];
