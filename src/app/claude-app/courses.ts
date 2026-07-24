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
    {
      motion: "explain",
      target: "new-chat",
      text: "違いその2。話題が変わるから「＋新しいチャット」——混ぜると答えがぶれるからね。",
      waitFor: (e) => e.type === "newChat",
    },
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
      emote: "📁",
      text: "Coworkの単位は“プロジェクト”。案件ごとにフォルダを1つ。やりとりも成果物もそこに貯まって、回すほど文脈が濃くなる——2回目からどんどん楽になる仕組み。",
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
      target: "input",
      text: "注文もつけられる。「もっと短く」って送って。…ここの返事は台本ね。本物は注文どおりに直してくる。",
      waitFor: (e) => e.type === "send" && e.tab === "cowork",
      onDone: { motion: "laugh", emote: "💮" },
    },
    {
      motion: "explain",
      target: "new-chat",
      text: "もうひとつ、Coworkの得意技を見せる。「＋新しいタスク」。",
      waitFor: (e) => e.type === "newChat",
    },
    {
      motion: "explain",
      target: "suggest-0",
      emote: "🌐",
      text: "「競合3社の料金をブラウザで調べて表にして」——調べ物ごと任せる。押して。",
      waitFor: (e) => e.type === "send" && e.tab === "cowork",
    },
    {
      motion: "arms-crossed",
      text: "ブラウザを開いて、サイトを回って、値段を拾ってる。あなたがタブを行き来してコピペする作業——あれが丸ごと消えるわけ。",
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
      target: "new-chat",
      text: "「＋新しいセッション」。ここから本番。",
      waitFor: (e) => e.type === "newChat",
    },
    {
      motion: "explain",
      target: "suggest-0",
      text: "もう一度「TODOリストのWebアプリを作って」。今度は作り切る。",
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
  minutes: 5,
  desc: "GitHubの本番ソースと連携→変更を承認→git pushで本番公開、までの一本道",
  steps: [
    {
      motion: "bow",
      text: "公開編。作ったものを、世界に出すところまでやる。——ここでGitHubの出番。",
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
      text: "「＋新しいセッション」。",
      waitFor: (e) => e.type === "newChat",
    },
    {
      motion: "explain",
      emote: "💡",
      text: "本番のソース置き場——それがGitHub。Codeはリポジトリと直接つながって、“公開中のファイル”を相手に仕事ができる。",
    },
    {
      motion: "explain",
      target: "env",
      text: "実行環境を🖥チップから「リモート」に。本番まわりはクラウド側でやるのが定石。",
      waitFor: (e) => e.type === "envChange" && e.env === "remote",
      onDone: { motion: "laugh", emote: "✨" },
    },
    {
      motion: "explain",
      target: "suggest-1",
      text: "「本番サイトのおみくじに“大吉演出”を足して」、送信。",
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
      motion: "bow",
      text: "連携、承認、公開。本番までの一本道、通ったね。…この手順、総まとめで“資産”にするよ。",
    },
  ],
};

/* ———— コース5: 総まとめ「3つの質問と、手順の資産化」 ———— */
const COURSE_4: Course = {
  id: "matome",
  emoji: "🧭",
  title: "総まとめ — 3つの質問とskill",
  minutes: 4,
  desc: "判断軸の最終確認と、手順をスキル化して「/」で呼び出す体験",
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
      text: "最後に、一番大事なやつ。公開編でやった“本番公開”の手順——あれを資産にする。",
    },
    ensurePc,
    {
      motion: "explain",
      target: "tab-code",
      text: "「コード」タブへ。",
      waitFor: (e) => e.type === "tabChange" && e.tab === "code",
      skipIf: (ctx) => ctx.tab === "code",
    },
    {
      motion: "explain",
      target: "new-chat",
      text: "「＋新しいセッション」。",
      waitFor: (e) => e.type === "newChat",
    },
    {
      motion: "explain",
      target: "suggest-2",
      text: "「この手順をスキルにして」、送信。",
      waitFor: (e) => e.type === "send" && e.tab === "code",
      onDone: { motion: "laugh", emote: "✨" },
    },
    {
      motion: "explain",
      text: "スキルができた。手順書が“実行できる形”で保存された、と思えばいい。",
    },
    {
      motion: "explain",
      target: "new-chat",
      text: "新しいセッションで試す。「＋新しいセッション」。",
      waitFor: (e) => e.type === "newChat",
    },
    {
      motion: "explain",
      target: "input",
      text: "入力欄に「/」とだけ打ってみて。さっき作ったスキルが出てくるから、選んで実行。",
      waitFor: (e) => e.type === "send" && e.text.startsWith("/"),
      onDone: { motion: "laugh", emote: "🎉" },
    },
    {
      motion: "explain",
      text: "4手順が、ひと言になった。手順は貯めるほど、あなたが速くなる。これが“skill”。",
    },
    {
      motion: "explain",
      emote: "🚀",
      text: "ここから先は本物。claude.aiから無料で始められる。CoworkやCodeは、デスクトップアプリと有料プランで解放されていく。",
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

export const COURSES: Course[] = [COURSE_0, COURSE_1, COURSE_2, COURSE_3, COURSE_DEPLOY, COURSE_4];
