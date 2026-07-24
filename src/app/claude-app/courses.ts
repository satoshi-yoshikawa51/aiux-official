/* ============================================================
   講師ガイドのコース定義（データ駆動）
   - CONTENT_PLAN.md のコース設計をシミュレーターで体験できる形に翻訳
   - target は game.tsx の data-guide 属性名
   - waitFor はシミュレーターの操作イベントによる達成判定
   - skipIf は状況的に不要なステップの自動スキップ

   PC/スマホ両対応: コースは表示を強制しない。スマホ表示では
   タブ切替・新規作成がドロワー（☰）内にあるため、gotoTab / newSession
   ヘルパーが「☰を開く」ステップを自動で挟む（PC表示では自動スキップ）。

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

/* ———— スマホ対応ヘルパー ———— */
/* スマホ表示ではタブや「＋新規」がドロワー（☰）の中にあるため、
   必要なときだけ「☰を開く」ステップを挟む。PC表示では自動スキップ */
const openMenu = (skipExtra?: (ctx: GuideCtx) => boolean): GuideStep => ({
  motion: "explain",
  target: "menu",
  text: "左上の「☰」を押して、メニューを開いて。",
  waitFor: (e) => e.type === "drawer" && e.open,
  skipIf: (ctx) => ctx.device === "pc" || (skipExtra?.(ctx) ?? false),
});

/* タブ切替（スマホは☰→タブ、PCは上部タブ。すでにそのタブならスキップ） */
const gotoTab = (tab: GuideCtx["tab"], text: string): GuideStep[] => [
  openMenu((ctx) => ctx.tab === tab),
  {
    motion: "explain",
    target: `tab-${tab}`,
    text,
    waitFor: (e) => e.type === "tabChange" && e.tab === tab,
    skipIf: (ctx) => ctx.tab === tab,
  },
];

/* 新しいチャット/タスク/セッション（スマホは☰から） */
const newSession = (text: string): GuideStep[] => [
  openMenu(),
  {
    motion: "explain",
    target: "new-chat",
    text,
    waitFor: (e) => e.type === "newChat",
  },
];

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
    {
      motion: "explain",
      emote: "💡",
      text: "覚えることは1つだけ。中身は同じClaude、違うのは“どこで働くか”。チャットの中、あなたのPCの中、ターミナル。以上。",
    },
    ...gotoTab("chat", "まず「チャット」タブ。開いてたら、そのまま押せばいい。"),
    ...newSession("「＋新しいチャット」。まっさらから始めるのが基本。"),
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
    ...gotoTab("cowork", "次。「Cowork」タブ。"),
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
    ...gotoTab("code", "最後。「コード」タブ。"),
    {
      motion: "explain",
      emote: "💡",
      text: "Codeは“実際に作る”モード。最初はフォルダ1つで始められる。GitHubは“本番に公開するとき”の相棒——それは公開編でやる。",
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
  minutes: 6,
  desc: "雑に頼むと選択肢つきの質問が返ってくる・その場で図解——他のAIとの体感差を味わう",
  steps: [
    {
      motion: "bow",
      text: "Chat編。Chatの仕事は“その場で終わる相談”。今日は、他のAIとの違いを2つ、体で覚えてもらう。",
    },
    ...gotoTab("chat", "「チャット」タブに切り替えて。"),
    ...newSession("まず「＋新しいチャット」。"),
    {
      motion: "explain",
      target: "suggest-1",
      text: "違いその1、いくよ。わざと雑に頼んでみて。「社内イベントの企画を考えて」——丸投げでいい。",
      waitFor: (e) => e.type === "send" && e.tab === "chat",
    },
    {
      motion: "explain",
      emote: "💡",
      text: "…ほら、向こうから質問してきた。しかも“選択肢つき”。雑な依頼ほど、Claudeは先に聞いてくる。こっちが完璧な指示を考えなくていいの。",
    },
    {
      motion: "explain",
      target: "choices",
      text: "選んで「回答を送る」を押すだけ。入力すらしなくていい。",
      waitFor: (e) => e.type === "send" && e.tab === "chat",
      onDone: { motion: "laugh", emote: "✨" },
    },
    {
      motion: "explain",
      text: "選んだだけで、ちゃんと形になったでしょ。雑に投げても、質問に答えていけば答えにたどり着く——これが違いその1。",
    },
    ...newSession("違いその2。話題が変わるから「＋新しいチャット」——混ぜると答えがぶれるからね。"),
    {
      motion: "explain",
      target: "suggest-3",
      text: "「Claudeの3つの使い方を図解して」、押して。",
      waitFor: (e) => e.type === "send" && e.tab === "chat",
    },
    {
      motion: "laugh",
      emote: "🎉",
      target: "figure",
      text: "見て。文章じゃなくて、チャットの中にそのまま“図”で返してきた。",
    },
    {
      motion: "explain",
      text: "説明はその場で図解・表に整形してくれる。会議資料の下書きがチャットで済むってこと——これが違いその2。",
    },
    {
      motion: "explain",
      target: "model",
      text: "最後にモデルの使い分け。難しい仕事はOpus、日常はSonnet、軽いのはHaiku。試しに切り替えてみて。",
      waitFor: (e) => e.type === "modelChange",
      onDone: { motion: "laugh", emote: "✨" },
    },
    {
      motion: "bow",
      text: "Chat編、終わり。“雑に投げて、選んで答える。図解も頼む。話題ごとにチャットを分ける”。…飲み込み、早いじゃない。",
    },
  ],
};

/* ———— コース2: Cowork編「貯めて進める」 ———— */
const COURSE_2: Course = {
  id: "cowork",
  emoji: "🤝",
  title: "Cowork編 — 貯めて進める",
  minutes: 7,
  desc: "プロジェクトに貯める・仕事を丸ごと任せる・ブラウザの調べ物ごと投げる",
  steps: [
    {
      motion: "bow",
      text: "Cowork編。“貯めて進める”場所。…私が一番使ってるのは、ここ。",
    },
    ...gotoTab("cowork", "「Cowork」タブに切り替えて。"),
    {
      motion: "explain",
      emote: "📁",
      text: "Coworkの単位は“プロジェクト”。案件ごとにフォルダを1つ。やりとりも成果物もそこに貯まって、回すほど文脈が濃くなる——2回目からどんどん楽になる仕組み。",
    },
    ...newSession("「＋新しいタスク」から。"),
    {
      motion: "explain",
      target: "folder",
      text: "案件フォルダを渡す。📁から選んで。初めてのフォルダは許可を聞かれるから、中身を見て許可。",
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
      target: "artifact-close",
      text: "読めた？なら「×」で閉じて。次にいくよ。",
      waitFor: (e) => e.type === "artifactClose",
    },
    {
      motion: "explain",
      target: "input",
      text: "注文もつけられる。「もっと短く」って送って。…ここの返事は台本ね。本物は注文どおりに直してくる。",
      waitFor: (e) => e.type === "send" && e.tab === "cowork",
      onDone: { motion: "laugh", emote: "💮" },
    },
    ...newSession("もうひとつ、Coworkの得意技を見せる。「＋新しいタスク」。"),
    {
      motion: "explain",
      target: "suggest-0",
      emote: "🌐",
      text: "「競合3社の料金をブラウザで調べて表にして」——調べ物ごと任せる。押して。",
      waitFor: (e) => e.type === "send" && e.tab === "cowork",
    },
    {
      motion: "arms-crossed",
      text: "見て。ブラウザが開いて、サイトを回って、値段を拾ってる。あなたがタブを行き来してコピペする作業——あれが丸ごと消えるわけ。",
    },
    {
      motion: "explain",
      target: "figure",
      text: "で、その場で比較表。ブラウザ操作はチャットやコードでも使えるけど、“調べて→まとめて→ファイルに残す”まで任せるなら、Coworkが一番ラク。",
    },
    {
      motion: "bow",
      text: "Cowork編、終わり。プロジェクトに貯める、丸ごと任せる、調べ物ごと投げる。…いい調子。",
    },
  ],
};

/* ———— コース3: Code編「作る・動かす」 ———— */
const COURSE_3: Course = {
  id: "code",
  emoji: "⌨️",
  title: "Code編 — 作る・動かす",
  minutes: 7,
  desc: "TODOアプリをゼロから動くまで作り切る。Plan体験・diff承認・コマンド許可",
  steps: [
    {
      motion: "bow",
      text: "Code編。“実際に作る”モード。今日はTODOアプリを、ゼロから動くところまで作り切る。プログラミング未経験？関係ない。",
    },
    ...gotoTab("code", "「コード」タブに切り替えて。"),
    ...newSession("「＋新しいセッション」。まっさらから。"),
    {
      motion: "explain",
      target: "folder",
      text: "フォルダを選ぶ。最初はこれだけでいい。📁から選んで。",
      waitFor: (e) => e.type === "folderChange",
      onDone: { motion: "laugh", emote: "✨" },
    },
    {
      motion: "explain",
      target: "perm",
      emote: "🛡️",
      text: "まずは慎重派の進め方から。🛡から「Plan」にして。計画だけ立てて、ファイルには触らないモード。",
      waitFor: (e) => e.type === "permChange" && e.permMode === "plan",
      onDone: { motion: "laugh", emote: "✨" },
    },
    {
      motion: "explain",
      target: "suggest-0",
      text: "そのまま「TODOリストのWebアプリを作って」を送ってみて。",
      waitFor: (e) => e.type === "send" && e.tab === "code",
    },
    {
      motion: "explain",
      text: "ほら、計画だけ出して止まった。方針を安全に確かめたいときはこれでいい。…よし、実装いくよ。",
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
      target: "input",
      text: "計画はさっきのでOK。同じセッションのまま続きをやる。入力欄に「進めて」と送って。",
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
      text: "できた。カードを開いて、実際に“やること”を追加してみて。項目クリックで完了線も引ける。",
      waitFor: (e) => e.type === "artifactOpen",
      onDone: { motion: "laugh", emote: "🎉" },
    },
    {
      motion: "bow",
      text: "Code編、終わり。頼む、承認する、許可する、動く。…次はこれを“本番に出す”。公開編で待ってる。",
    },
  ],
};

/* ———— コース4: 公開編「本番につなぐ」 ———— */
const COURSE_DEPLOY: Course = {
  id: "deploy",
  emoji: "🚀",
  title: "公開編 — 本番につなぐ",
  minutes: 7,
  desc: "GitHubと連携→承認→git pushで本番公開。仕上げに手順をスキル化して「/」ひと言で再実行",
  steps: [
    {
      motion: "bow",
      text: "公開編。作ったものを、世界に出すところまでやる。——ここでGitHubの出番。",
    },
    ...gotoTab("code", "「コード」タブに切り替えて。"),
    ...newSession("「＋新しいセッション」。"),
    {
      motion: "explain",
      emote: "💡",
      text: "本番のソース置き場——それがGitHub。Codeはリポジトリと連携して、“公開中のファイル”を相手に仕事ができる。",
    },
    {
      motion: "explain",
      target: "env",
      text: "まず実行環境を🖥チップから「リモート」に。本番まわりはクラウド側でやるのが定石。",
      waitFor: (e) => e.type === "envChange" && e.env === "remote",
      onDone: { motion: "laugh", emote: "✨" },
    },
    {
      motion: "explain",
      target: "repo",
      emote: "🐙",
      text: "そして肝心の連携。🐙チップから「omikuji-site」を選んで。初回はGitHub連携の確認が出るから、内容を見て連携する。",
      waitFor: (e) => e.type === "repoChange",
      onDone: { motion: "laugh", emote: "✨" },
    },
    {
      motion: "explain",
      target: "suggest-1",
      text: "繋がった。じゃあ「本番サイトのおみくじに“大吉演出”を足して」、送信。",
      waitFor: (e) => e.type === "send" && e.tab === "code",
    },
    {
      motion: "arms-crossed",
      target: "accept",
      text: "本番のソースを取得して、差分が来た。相手は“公開中”のファイル。だから必ず中身を見て——よければ「✓ Accept」。",
      waitFor: (e) => e.type === "diffResolved",
      onDone: { motion: "laugh", emote: "✨" },
    },
    {
      motion: "explain",
      target: "approve",
      text: "`git push`——これが本番公開の瞬間。ここも許可制。「✓ 許可する」。",
      waitFor: (e) => e.type === "approvalResolved",
      onDone: { motion: "laugh", emote: "🎉" },
    },
    {
      motion: "explain",
      target: "artifact",
      text: "公開された。カードを開いて、大吉が出るまで引いてみて。",
      waitFor: (e) => e.type === "artifactOpen",
      onDone: { motion: "laugh", emote: "🎉" },
    },
    {
      motion: "explain",
      target: "artifact-close",
      text: "遊んだ？なら「×」で閉じて。仕上げがある。",
      waitFor: (e) => e.type === "artifactClose",
    },
    {
      motion: "explain",
      emote: "💡",
      text: "最後にもうひとつ。いまやった一連——取得、承認、公開。この手順、毎回やるのは面倒でしょ。だから“資産”にする。",
    },
    {
      motion: "explain",
      target: "input",
      text: "このセッションのまま、入力欄に「この手順をスキルにして」と送って。いまの作業を見てたClaudeが、手順を書き出してくれる。",
      waitFor: (e) => e.type === "send" && e.tab === "code" && e.text.includes("スキル"),
      onDone: { motion: "laugh", emote: "✨" },
    },
    {
      motion: "explain",
      text: "スキルができた。手順書が“実行できる形”で保存された、と思えばいい。",
    },
    ...newSession("威力を試す。「＋新しいセッション」。"),
    {
      motion: "explain",
      target: "input",
      text: "入力欄に「/」とだけ打ってみて。さっきのスキルが出てくるから、選んで実行。",
      waitFor: (e) => e.type === "send" && e.text.startsWith("/"),
      onDone: { motion: "laugh", emote: "🎉" },
    },
    {
      motion: "explain",
      text: "4手順が、ひと言になった。手順は貯めるほど、あなたが速くなる——これが“skill”。",
    },
    {
      motion: "bow",
      text: "公開編、終わり。連携、承認、公開、そして資産化。…フルコースだったね。上出来。",
    },
  ],
};

/* ———— コース5: 総まとめ「迷ったら3つの質問」 ———— */
const COURSE_4: Course = {
  id: "matome",
  emoji: "🧭",
  title: "総まとめ — 迷ったら3つの質問",
  minutes: 2,
  desc: "どのモードを使うか迷ったときの判断軸を最終確認して、本物へ",
  steps: [
    {
      motion: "bow",
      text: "総まとめ。ここまで付き合ったんだから、最後まで聞いていって。",
    },
    {
      motion: "explain",
      emote: "1️⃣",
      text: "質問その1。“その場で終わる相談？”ならChat。——ちなみに逆質問も図解も、Chat専用じゃない。CoworkでもCodeでも返ってくる。Chatは一番身軽な入口ってこと。",
    },
    {
      motion: "explain",
      emote: "2️⃣",
      text: "質問その2。“続きがある？情報を貯めたい？”ならCowork。案件フォルダに成果物とやりとりを積んで、ブラウザの調べ物ごと任せる。",
    },
    {
      motion: "explain",
      emote: "3️⃣",
      text: "質問その3。“作る？動かす？”ならCode。フォルダから始めて、本番に出すときはGitHubと連携。承認制だから安全。",
    },
    {
      motion: "explain",
      emote: "💡",
      text: "そして忘れちゃいけないのが“skill”。公開編でやったでしょ——手順をスキルにして、次からは「/」ひと言。手順は貯めるほど、あなたが速くなる。",
    },
    {
      motion: "explain",
      emote: "🚀",
      text: "ここから先は本物。claude.aiから無料で始められる。CoworkやCodeは、デスクトップアプリと有料プランで解放されていく。",
    },
    {
      motion: "explain",
      text: "最初のひとことは、これでいい。“私は◯◯の仕事をしている。△△を手伝って。足りない情報は質問しながら進めて”。——雑でいい。あとは向こうが聞いてくる。",
    },
    {
      motion: "laugh",
      emote: "🎓",
      text: "全コース修了。…よく頑張ったね。あとは今日の仕事をひとつ、Claudeに任せてみるだけ。いってらっしゃい。",
    },
  ],
};

export const COURSES: Course[] = [COURSE_0, COURSE_1, COURSE_2, COURSE_3, COURSE_DEPLOY, COURSE_4];
