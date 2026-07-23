/* ============================================================
   体験モードのシナリオ定義 — データ駆動化
   応答を「Step列」で記述する。学習コンテンツ側は ClaudeAppSim の
   `scenarios` prop に Partial<ScenarioSet> を渡すだけで、
   コース専用の台本に差し替えられる（本体コードの変更は不要）。
   ============================================================ */

export type Tab = "chat" | "cowork" | "code";
export type PermMode = "manual" | "acceptEdits" | "plan" | "auto";

export interface DiffLine {
  t: "+" | "-" | " ";
  s: string;
}
export interface DiffSpec {
  file: string;
  add: number;
  del: number;
  lines: DiffLine[];
}

/* 成果物（プレビュー可能）
   - web  … 実際に動くHTMLをiframeで表示
   - doc  … 文書を紙面風にレンダリング（# / ## 見出し対応）
   - sheet… 表テキストを紙面風にレンダリング */
export interface ArtifactSpec {
  title: string;
  kind: "web" | "doc" | "sheet";
  note?: string;
  html?: string; // kind: web
  body?: string; // kind: doc / sheet
}

/* シナリオの1ステップ。diff / approval は分岐を持つ */
export type Step =
  | { type: "text"; text: string }
  | { type: "artifact"; artifact: ArtifactSpec }
  | { type: "diff"; diff: DiffSpec; accept: Step[]; reject: Step[] }
  | { type: "approval"; command: string; note?: string; allow: Step[]; deny: Step[] };

export interface ScenarioCtx {
  text: string; // ユーザーの入力
  isFollowup: boolean; // 同じ会話の2往復目以降か
  firstText: string; // その会話の最初のユーザー発言（台本分岐用）
  permMode: PermMode; // コードタブの権限モード
  folder: string | null; // 選択中のフォルダ
}

export interface ScenarioSet {
  chat: (ctx: ScenarioCtx) => Step[];
  cowork: (ctx: ScenarioCtx) => Step[];
  code: (ctx: ScenarioCtx) => Step[];
}

/* ———— チャット ———— */
/* 提案チップ（game.tsxと共有。台本の分岐キーにも使う） */
export const CHAT_SUGGESTIONS = [
  "Claudeには何ができる？",
  "社内イベントの企画を考えて",
  "AIを使いこなすコツを3つ教えて",
  "Claudeの3つの使い方を図解して",
];

const CHAT_REPLIES: Record<string, string> = {
  "Claudeには何ができる？":
    "こんにちは！Claudeは、文章の作成・要約・翻訳、アイデア出し、表の整理、プログラムを書くことまで、「言葉で頼める仕事」ならたいてい手伝えます。\n\nたとえば——\n・長いメールを3行に要約\n・企画のたたき台を10案\n・ExcelのVLOOKUPの使い方を解説\n\n「こういうことできる？」と気軽に聞いてみるのがいちばんの近道です。",
  "AIを使いこなすコツを3つ教えて":
    "コツは3つあります。\n\n1. 背景ごと伝える —「誰向けに・何のために」を添えると精度が上がる\n2. 一度で完璧を求めない — 出てきたものに「もっと短く」「例を足して」と注文を重ねる\n3. 新しい話題は新しいチャットで — 文脈が混ざると答えもぶれる\n\nまずは小さな頼みごとから試してみてください。",
};

/* 逆質問デモ: 雑な依頼 → Claudeから質問 → 答えると具体化 */
const EVENT_ASK =
  "いいですね、やりましょう。良い企画にするために、先に3つだけ教えてください。\n\n① 目的はどちら寄りですか？（親睦を深める／成果を祝う）\n② 参加人数と場所は？（例: 30人・オフィス）\n③ 予算感は？（例: 1人1,000円）\n\nざっくりで大丈夫です。分かる範囲で返してください。";
const EVENT_PLAN =
  "ありがとうございます、それだけ分かれば組めます。\n\n📋 企画案「持ち寄りランチ＆チーム対抗クイズ」\n・ねらい: 部署を越えた親睦\n・構成: 乾杯(5分) → ランチ歓談(30分) → チーム対抗クイズ(20分) → 表彰・記念撮影(5分)\n・準備: 会場おさえ、クイズ10問、ささやかな景品\n・工夫: 席はくじ引きで混ぜる／クイズは社内ネタ多め\n\n——最初の依頼はざっくりでしたよね。でもこちらから質問して要件を埋めたので、ここまで具体化できました。雑に投げてもらって大丈夫です。";

/* 図解デモ: その場で図を作って成果物カードで返す */
const DIAGRAM_INTRO =
  "図解にしました。下の成果物カードを開いてみてください。\n\n（体験モードのため用意済みの図です。本物のClaudeは、お題に合わせてその場で図や表を作ります）";
const DIAGRAM_ARTIFACT: ArtifactSpec = {
  title: "Claudeの3つの使い方.html",
  kind: "web",
  note: "その場で作った図解",
  html: `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:-apple-system,'Hiragino Sans',sans-serif;background:#FAF9F5;color:#3D3929;margin:0;padding:28px 18px;text-align:center}h1{font-size:19px;margin:0 0 20px}.row{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}.card{flex:1;min-width:150px;max-width:200px;background:#fff;border:2px solid #3D3929;border-radius:14px;padding:16px 12px;box-shadow:4px 4px 0 rgba(61,57,41,.9)}.emoji{font-size:30px}.card h2{font-size:15px;margin:8px 0 4px}.card .p{font-size:13px;font-weight:700;color:#B4542F;margin:0 0 6px}.card small{font-size:11px;color:#87826F;line-height:1.6;display:block}.q{margin-top:22px;font-size:12.5px;background:#F0EEE6;border-radius:10px;padding:10px 14px;display:inline-block}</style></head><body><h1>Claudeの3つの使い方 — どこで働かせるか</h1><div class="row"><div class="card"><div class="emoji">💬</div><h2>チャット</h2><p class="p">その場で終わる相談</p><small>調べ物・壁打ち・文章づくり</small></div><div class="card"><div class="emoji">🤝</div><h2>Cowork</h2><p class="p">貯めて進める</p><small>案件フォルダを渡して任せる</small></div><div class="card"><div class="emoji">⌨️</div><h2>コード</h2><p class="p">作る・動かす</p><small>承認制で安全に実装</small></div></div><p class="q">迷ったら…「その場で終わる？」「続きがある？」「作る？」</p></body></html>`,
};
const CHAT_FALLBACK =
  "メッセージありがとうございます。いまは体験モードなので返事は定型文ですが、画面の使い方は本物のClaudeアプリと同じです。\n\n・返事はこうして少しずつ流れてきます（ストリーミング）\n・同じチャットなら文脈も引き継がれます\n・⚙️ 設定でAPIキーを入れると、本物のClaudeがここで答えます";
const CHAT_FOLLOWUP =
  "続けての質問ですね。同じチャットの中では、Claudeは前のやりとりを覚えたまま答えます。だから「さっきのをもっと短く」「それを英語で」のような指示が通じるんです。\n\n（体験モードのため定型の返事です。⚙️ 設定からAPIキーを入れると、この画面のまま本物のClaudeにつながります）";

/* ———— Cowork ———— */
const coworkPlan = (task: string) =>
  `かしこまりました。「${task}」ですね。☁️ クラウド上の専用マシンで作業を始めます。アプリを閉じても作業は続きます。\n\n📋 計画\n ① 関連する資料・情報を収集\n ② たたき台を作成\n ③ 体裁を整えて仕上げ\n\n▸ ① 資料を収集中…\n   関連情報を3件チェックしました\n▸ ② たたき台を作成中…\n   構成（背景 → 本題 → まとめ → 次のアクション）で作成\n▸ ③ 体裁を整えています…`;
const coworkArtifact = (task: string): ArtifactSpec => ({
  title: `${task.slice(0, 12)}${task.length > 12 ? "…" : ""} たたき台.docx`,
  kind: "doc",
  note: "フォルダに保存しました",
  body: `# ${task} — たたき台\n\n## 背景・目的\nこの文書は依頼内容「${task}」のたたき台です。体験モードのためサンプルの構成ですが、APIモードでは本物のClaudeが実際の中身まで書き上げます。\n\n## 本題\n1. 現状の整理 — いま分かっていること・足りないこと\n2. 提案内容 — 進め方の案（A案 / B案）\n3. 期待される効果 — 工数・品質・スピードへの影響\n\n## まとめ\n方向性が固まり次第、詳細版に展開します。\n\n## 次のアクション\n・関係者に共有してフィードバックをもらう\n・「もっと短く」「表を足して」など、このタスクに注文を重ねる`,
});
const coworkDone = (task: string) =>
  `✅ タスク完了！\n📄 成果物：${task.slice(0, 10)}… たたき台.docx\n\n上の成果物カードの「プレビュー」から中身を確認できます。このまま「もっと短く」「表を足して」のように、同じタスクに注文を重ねて仕上げていけます。\n\n（体験モードのため、作業と成果物はサンプルです。⚙️ 設定でAPIキーを入れると、本物のClaudeが実際の中身まで書きます）`;
const COWORK_FOLLOWUP =
  "追加のご注文ですね。同じタスクの続きとして、クラウド側で反映します。\n\n▸ 修正箇所を確認中…\n▸ 反映しています…\n\n✅ 更新しました。Coworkでは、こうして同じタスクに注文を重ねながら仕上げていけます。\n\n（体験モードのため定型の応答です）";

/* ———— コード ———— */
const codePlan = (task: string) =>
  `「${task}」ですね。まずプロジェクトを確認します。\n\n● Read(プロジェクトフォルダ)\n  └ 構成を確認しました\n\n計画：\n 1. index.html にUIを追加\n 2. 動作を確認\n\nそれでは変更を提案します。`;
const CODE_DIFF: DiffSpec = {
  file: "index.html",
  add: 5,
  del: 1,
  lines: [
    { t: " ", s: "<body>" },
    { t: "-", s: "  <p>準備中</p>" },
    { t: "+", s: "  <button id=\"go\">おみくじを引く</button>" },
    { t: "+", s: "  <p id=\"result\"></p>" },
    { t: "+", s: "  <script>" },
    { t: "+", s: "    const R = [\"大吉\",\"中吉\",\"小吉\",\"凶\"];" },
    { t: "+", s: "    go.onclick = () => result.textContent = R[Math.floor(Math.random()*4)];" },
    { t: " ", s: "</body>" },
  ],
};
const CODE_ARTIFACT: ArtifactSpec = {
  title: "index.html",
  kind: "web",
  note: "プレビューで実際に動きます",
  html: `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>おみくじ</title><style>body{font-family:-apple-system,'Hiragino Sans',sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:92vh;margin:0;background:#FAF9F5;color:#3D3929}h1{font-size:22px;letter-spacing:.1em}button{font-size:17px;padding:12px 30px;border-radius:12px;border:none;background:#D97757;color:#fff;cursor:pointer;font-weight:700}button:active{transform:scale(.97)}#result{font-size:54px;font-weight:800;min-height:80px;margin-top:22px}</style></head><body><h1>🎋 今日の運勢</h1><button id="go">おみくじを引く</button><p id="result"></p><script>const R=["大吉","中吉","小吉","末吉","凶"];go.onclick=()=>{result.textContent=R[Math.floor(Math.random()*R.length)]};</script></body></html>`,
};
const CODE_APPLIED =
  "✅ 変更を適用しました。\n\n動作確認のため、プレビュー用のローカルサーバーを起動します。";
const CODE_DONE =
  "● Bash(npx serve .)\n  └ プレビューを起動、表示OK\n\nできあがりです。成果物カードの「プレビュー」で、実際に動くページを確認できます。\n\n（体験モードのためサンプルの実装です。⚙️ 設定でAPIキーを入れると、本物のClaudeがコードまで書きます）";
const CODE_DENY_RUN =
  "了解しました。コマンドは実行せず、変更の適用までで止めておきます。ファイルはできあがっているので、確認したくなったらいつでも実行できます。";
const CODE_DONE_REJECT =
  "了解しました。この変更は破棄します。\n\nどのように進めましょう？ 気になった点を伝えてもらえれば、別のやり方で提案し直します。";
const codePlanOnly = (task: string) =>
  `Planモードなので、まず計画だけ提案します（ファイルは変更しません）。\n\n📋 「${task}」の計画\n 1. index.html にUIを追加\n 2. スタイルを調整\n 3. 動作確認して微修正\n\nこの方針でよければ、権限モードを Manual か Accept edits に切り替えて送信してください。実装に進みます。`;
const CODE_FOLLOWUP =
  "続きの指示ですね。同じセッションの文脈で対応します。\n\n● Edit(index.html)\n  └ ご指示を反映して6行を変更\n\n✅ 更新しました。\n\n（体験モードのため定型の応答です）";

/* ———— 既定のシナリオセット ———— */
export const DEFAULT_SCENARIOS: ScenarioSet = {
  chat: ({ text, isFollowup, firstText }) => {
    /* 逆質問デモ: 雑な依頼→質問が返る→答えると企画が具体化する2往復の台本 */
    if (firstText === CHAT_SUGGESTIONS[1]) {
      return [{ type: "text", text: isFollowup ? EVENT_PLAN : EVENT_ASK }];
    }
    /* 図解デモ: 説明文＋成果物カード（実際に動く図解HTML） */
    if (!isFollowup && text === CHAT_SUGGESTIONS[3]) {
      return [
        { type: "text", text: DIAGRAM_INTRO },
        { type: "artifact", artifact: DIAGRAM_ARTIFACT },
      ];
    }
    return [{ type: "text", text: isFollowup ? CHAT_FOLLOWUP : CHAT_REPLIES[text] ?? CHAT_FALLBACK }];
  },
  cowork: ({ text, isFollowup }) =>
    isFollowup
      ? [{ type: "text", text: COWORK_FOLLOWUP }]
      : [
          { type: "text", text: coworkPlan(text) },
          { type: "artifact", artifact: coworkArtifact(text) },
          { type: "text", text: coworkDone(text) },
        ],
  code: ({ text, isFollowup, permMode }) => {
    if (isFollowup) return [{ type: "text", text: CODE_FOLLOWUP }];
    if (permMode === "plan") return [{ type: "text", text: codePlanOnly(text) }];
    return [
      { type: "text", text: codePlan(text) },
      {
        type: "diff",
        diff: CODE_DIFF,
        accept: [
          { type: "text", text: CODE_APPLIED },
          {
            type: "approval",
            command: "npx serve .",
            note: "プレビュー用のローカルサーバーを起動します",
            allow: [
              { type: "text", text: CODE_DONE },
              { type: "artifact", artifact: CODE_ARTIFACT },
            ],
            deny: [{ type: "text", text: CODE_DENY_RUN }],
          },
        ],
        reject: [{ type: "text", text: CODE_DONE_REJECT }],
      },
    ];
  },
};
