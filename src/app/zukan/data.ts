/* ============================================================
   COMIXAI図鑑の台帳。
   category/id は各ゲームの unlock() 呼び出しと一致させること。
   hint は未解除のときに表示される「匂わせ」。

   級・称号があるゲームは「最高位」だけを図鑑対象にする
   （下位の級もunlockされるが、台帳に無いものは表示・集計されない）。
   エンディングや作品を集めるタイプのゲームは全種を載せる。
   ============================================================ */

export interface ZukanItem {
  category: string;
  id: string;
  emoji: string;
  name: string;
  hint: string;
}

export interface ZukanSection {
  category: string;
  title: string;
  sub: string;
  items: ZukanItem[];
}

const rooms: ZukanItem[] = [
  { category: "rooms", id: "tokenizer", emoji: "🔤", name: "トークナイザーの実験室", hint: "「トークン」のページに、扉があるらしい" },
  { category: "rooms", id: "uso", emoji: "🤥", name: "ウソ見抜き道場", hint: "「ハルシネーション」のページに、扉があるらしい" },
  { category: "rooms", id: "vibe", emoji: "🎨", name: "バイブコーディング工房", hint: "「バイブコーディング」のページに、扉があるらしい" },
  { category: "rooms", id: "agent", emoji: "🤖", name: "エージェント見守り室", hint: "「AIエージェント」のページに、扉があるらしい" },
  { category: "rooms", id: "shinjin", emoji: "🧑‍💼", name: "AI新人くんのデスク", hint: "「プロンプトエンジニアリング」のページに、扉があるらしい" },
  { category: "rooms", id: "sodate", emoji: "🍼", name: "AI育成ラボ", hint: "「ファインチューニング」のページに、扉があるらしい" },
  { category: "rooms", id: "slop", emoji: "🗑️", name: "スロップ鑑定所", hint: "「AIスロップ」のページに、扉があるらしい" },
  { category: "rooms", id: "keibi", emoji: "🛡️", name: "エージェント警備室", hint: "「プロンプトインジェクション」のページに、扉があるらしい" },
  { category: "rooms", id: "shacho", emoji: "🏢", name: "AI社長室", hint: "「マルチエージェント」のページに、扉があるらしい" },
  { category: "rooms", id: "tsukue", emoji: "🪑", name: "AIの作業机", hint: "「コンテキストエンジニアリング」のページに、扉があるらしい" },
  { category: "rooms", id: "nou", emoji: "🧠", name: "脳の仕分け所", hint: "「推論モデル」のページに、扉があるらしい" },
  { category: "rooms", id: "gakuya", emoji: "🎭", name: "AIの楽屋", hint: "「システムプロンプト」のページに、扉があるらしい" },
  { category: "rooms", id: "shitsuke", emoji: "🍯", name: "AIしつけ教室", hint: "「RLHF」のページに、扉があるらしい" },
  { category: "rooms", id: "majin", emoji: "🧞", name: "魔神の間", hint: "「アライメント」のページに、扉があるらしい" },
  { category: "rooms", id: "diet", emoji: "⚖️", name: "AIダイエット道場", hint: "「量子化」のページに、扉があるらしい" },
  { category: "rooms", id: "otehon", emoji: "📋", name: "お手本の教室", hint: "「ゼロショット」のページに、扉があるらしい" },
  { category: "rooms", id: "undokai", emoji: "🏅", name: "AI運動会の会場", hint: "「ベンチマーク」のページに、扉があるらしい" },
  { category: "rooms", id: "gohobi", emoji: "🍖", name: "ご褒美の迷路", hint: "「強化学習」のページに、扉があるらしい" },
  { category: "rooms", id: "claude-app", emoji: "🚗", name: "Claudeアプリ教習所", hint: "「Claude Code」のページに、扉があるらしい" },
];

/* 各ゲームの「最高位」だけを集める称号コーナー。
   category/id は各ゲームの最上位グレードの unlock() と一致。 */
const titles: ZukanItem[] = [
  { category: "quiz", id: "kenja", emoji: "👑", name: "AI賢者級", hint: "用語力診断で全問正解する…できる？" },
  { category: "uso", id: "hencho", emoji: "📰", name: "AI編集長級", hint: "ウソ見抜きで全問見抜く…できる？" },
  { category: "slop", id: "sommelier", emoji: "🍷", name: "スロップ・ソムリエ", hint: "スロップ鑑定で9問以上見抜く…できる？" },
  { category: "keibi", id: "teppeki", emoji: "🛡️", name: "鉄壁のセキュリティ", hint: "インジェクション防衛で7通以上を正しく検問…できる？" },
  { category: "tsukue", id: "tatsujin", emoji: "🧘", name: "整頓の達人", hint: "AIの作業机で、3タスクとも完璧な机を作る…できる？" },
  { category: "nou", id: "shirei", emoji: "🎖️", name: "司令塔マスター", hint: "速い脳・遅い脳で、12件すべて正しく振り分ける…できる？" },
  { category: "shitsuke", id: "kouha", emoji: "🧊", name: "硬派AI調教師", hint: "AI調教師で、事実を選び抜いて硬派AIを育てる…できる？" },
  { category: "majin", id: "kenja", emoji: "🧞", name: "魔神使いの賢者", hint: "魔神AIの願い方で、5つの願いをすべて事故なく叶えさせる…できる？" },
  { category: "diet", id: "sommelier", emoji: "🍾", name: "軽量化ソムリエ", hint: "AIダイエットで、5つの現場すべてにジャストフィットさせる…できる？" },
  { category: "otehon", id: "meijin", emoji: "🎯", name: "例示の名人", hint: "お手本ひとつでで、全ラウンド完璧なお手本を選ぶ…できる？" },
  { category: "undokai", id: "yosoya", emoji: "🔮", name: "AI予想屋の神", hint: "AI運動会で、全種目の勝者を的中させる…できる？" },
  { category: "gohobi", id: "sekkeishi", emoji: "🏆", name: "報酬設計士", hint: "ご褒美で導けで、3ラウンドすべてゴールに導く…できる？" },
];

const agent: ZukanItem[] = [
  { category: "agent", id: "kami", emoji: "👑", name: "神マネージャー", hint: "任せるところは任せ、決めるところは決める" },
  { category: "agent", id: "kenjitsu", emoji: "🧱", name: "堅実の人", hint: "こまめな確認も、悪くない" },
  { category: "agent", id: "creep", emoji: "📦", name: "風呂敷たたみきれず", hint: "「ついで」に弱いあなたへ" },
  { category: "agent", id: "fabricated", emoji: "🔥", name: "それっぽい数字事件", hint: "曖昧な指示は、事件のもと" },
  { category: "agent", id: "redo", emoji: "🌀", name: "マイクロマネジメント沼", hint: "やり直しって言いたいだけの日もある" },
  { category: "agent", id: "self", emoji: "🫠", name: "結局自分でやる", hint: "任せられないのも、ひとつの才能" },
];

const sodate: ZukanItem[] = [
  { category: "sodate", id: "neko", emoji: "😺", name: "ネコ過学習モデル", hint: "同じ餌を3回与えると…（猫）" },
  { category: "sodate", id: "biz", emoji: "🤵", name: "ビジネス過学習モデル", hint: "同じ餌を3回与えると…（意識高め）" },
  { category: "sodate", id: "haiku", emoji: "🎎", name: "俳句過学習モデル", hint: "同じ餌を3回与えると…（五・七・五）" },
  { category: "sodate", id: "slang", emoji: "😎", name: "ネットノリ過学習モデル", hint: "同じ餌を3回与えると…（www）" },
  { category: "sodate", id: "jiten", emoji: "🧐", name: "百科事典過学習モデル", hint: "同じ餌を3回与えると…（話が長い）" },
  { category: "sodate", id: "balance", emoji: "🎓", name: "バランス型モデル", hint: "3回とも違う餌を与えて育てる" },
];

const vibe: ZukanItem[] = [
  { category: "vibe", id: "neko", emoji: "🐱", name: "ねこカフェ にゃおん", hint: "バイブコーディングで作れる何か" },
  { category: "vibe", id: "ramen", emoji: "🍜", name: "豚骨タイフーン", hint: "バイブコーディングで作れる何か" },
  { category: "vibe", id: "oshi", emoji: "✨", name: "OshiLog", hint: "バイブコーディングで作れる何か" },
];

const shinjin: ZukanItem[] = [
  { category: "shinjin", id: "perfect", emoji: "🎬", name: "名ディレクター", hint: "AI新人くんへの指示で伝わり度100%を出す" },
  { category: "shinjin", id: "marunage", emoji: "🎲", name: "伝説の丸投げ", hint: "何ひとつ指定せずに発注する勇気" },
];

const shacho: ZukanItem[] = [
  { category: "shacho", id: "kanpeki", emoji: "👑", name: "完璧な分業", hint: "適材適所×正しい順序×並列で納品する" },
  { category: "shacho", id: "kenjitsu", emoji: "🧱", name: "堅実な中間管理職", hint: "破綻のない段取りも立派な才能" },
  { category: "shacho", id: "dengon", emoji: "🌀", name: "伝言ゲーム地獄", hint: "順序を間違えると怪文書が生まれる" },
  { category: "shacho", id: "zangyo", emoji: "🔥", name: "残業まみれの現場", hint: "同じ係に仕事を集めすぎると…" },
  { category: "shacho", id: "wanope", emoji: "🫠", name: "ワンオペ社長", hint: "1体に全部任せる勇気と代償" },
  { category: "shacho", id: "kaigi", emoji: "😵", name: "会議だけで一日が終わった", hint: "段取りの混乱は会議を生む" },
];

const gakuya: ZukanItem[] = [
  { category: "gakuya", id: "kanban", emoji: "✨", name: "名店の看板AI", hint: "守りと親切のバランスが取れた台本を書く" },
  { category: "gakuya", id: "bochi", emoji: "🍵", name: "ぼちぼちの店", hint: "大過なく営業する、味のあるAI窓口" },
  { category: "gakuya", id: "shio", emoji: "🧂", name: "塩対応伝説", hint: "守りを固めすぎるとこうなる" },
  { category: "gakuya", id: "jiko", emoji: "🔥", name: "大事故クロージング", hint: "台本のスキを突かれると…" },
];

const emaki: ZukanItem[] = [
  { category: "emaki", id: "read", emoji: "📜", name: "AI75年史・読破", hint: "AIの歴史絵巻を最後までスクロールする" },
];

const claudeapp: ZukanItem[] = [
  { category: "claudeapp", id: "sotsugyo", emoji: "🎓", name: "教習所 卒業", hint: "Claudeアプリ教習所で8つのミッションをすべてクリアする" },
  { category: "claudeapp", id: "honmono", emoji: "🔑", name: "本物と話した", hint: "教習所のAPIモードで、本物のClaudeと会話する" },
];

export const ZUKAN_SECTIONS: ZukanSection[] = [
  { category: "rooms", title: "隠し部屋の発見", sub: "用語集のどこかに、19の扉がある", items: rooms },
  { category: "titles", title: "最高位の称号", sub: "各ゲームの頂点を獲った証だけが、ここに刻まれる", items: titles },
  { category: "agent", title: "エージェントの結末", sub: "任せ方しだいの6エンディング", items: agent },
  { category: "sodate", title: "育成したAIモデル", sub: "過学習5種＋バランス型", items: sodate },
  { category: "vibe", title: "バイブで作った作品", sub: "3つの題材ぜんぶ作る", items: vibe },
  { category: "shinjin", title: "指示力の実績", sub: "完璧な発注と、伝説の丸投げ", items: shinjin },
  { category: "shacho", title: "AI社長の経営結果", sub: "段取りしだいの6エンディング", items: shacho },
  { category: "gakuya", title: "AI窓口の営業結果", sub: "台本しだいの4エンディング", items: gakuya },
  { category: "emaki", title: "歴史の証人", sub: "AIの75年を見届ける", items: emaki },
  { category: "claudeapp", title: "教習所の実績", sub: "卒業証書と、本物との対話", items: claudeapp },
];

export const ZUKAN_TOTAL = ZUKAN_SECTIONS.reduce((n, s) => n + s.items.length, 0);
