/* ============================================================
   COMIXAI図鑑の台帳。
   category/id は各ゲームの unlock() 呼び出しと一致させること。
   hint は未解除のときに表示される「匂わせ」。
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
];

const quiz: ZukanItem[] = [
  { category: "quiz", id: "hiyoko", emoji: "🐣", name: "AIヒヨコ級", hint: "用語力診断で判定される（伸びしろMAX）" },
  { category: "quiz", id: "minarai", emoji: "📖", name: "AI見習い級", hint: "用語力診断で判定される" },
  { category: "quiz", id: "tsukaite", emoji: "⚡", name: "AI使い級", hint: "用語力診断で判定される" },
  { category: "quiz", id: "master", emoji: "🔥", name: "AIマスター級", hint: "用語力診断で10問以上正解" },
  { category: "quiz", id: "kenja", emoji: "👑", name: "AI賢者級", hint: "用語力診断で全問正解…できる？" },
];

const uso: ZukanItem[] = [
  { category: "uso", id: "unomi", emoji: "🐥", name: "鵜呑みヒヨコ級", hint: "ウソ見抜きで判定される（騙されがち）" },
  { category: "uso", id: "minarai", emoji: "📖", name: "校閲見習い級", hint: "ウソ見抜きで判定される" },
  { category: "uso", id: "mekiki", emoji: "🔍", name: "目利き級", hint: "ウソ見抜きで判定される" },
  { category: "uso", id: "desk", emoji: "🖋️", name: "敏腕デスク級", hint: "ウソ見抜きで7問見抜く" },
  { category: "uso", id: "hencho", emoji: "📰", name: "AI編集長級", hint: "ウソ見抜きで全問見抜く…できる？" },
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

const slop: ZukanItem[] = [
  { category: "slop", id: "unomi", emoji: "🍽️", name: "スロップ完食", hint: "スロップ鑑定で判定される（食べすぎ注意）" },
  { category: "slop", id: "minarai", emoji: "🧹", name: "鑑定見習い", hint: "スロップ鑑定で判定される" },
  { category: "slop", id: "kanteishi", emoji: "🔍", name: "スロップ鑑定士", hint: "スロップ鑑定で7問見抜く" },
  { category: "slop", id: "sommelier", emoji: "🍷", name: "スロップ・ソムリエ", hint: "スロップ鑑定で9問以上見抜く…できる？" },
];

const keibi: ZukanItem[] = [
  { category: "keibi", id: "zaru", emoji: "🕳️", name: "ザル警備", hint: "インジェクション防衛で判定される" },
  { category: "keibi", id: "shinmai", emoji: "👮", name: "新米警備員", hint: "インジェクション防衛で判定される" },
  { category: "keibi", id: "teppeki", emoji: "🛡️", name: "鉄壁のセキュリティ", hint: "インジェクション防衛で7通以上を正しく検問" },
];

const shacho: ZukanItem[] = [
  { category: "shacho", id: "kanpeki", emoji: "👑", name: "完璧な分業", hint: "適材適所×正しい順序×並列で納品する" },
  { category: "shacho", id: "kenjitsu", emoji: "🧱", name: "堅実な中間管理職", hint: "破綻のない段取りも立派な才能" },
  { category: "shacho", id: "dengon", emoji: "🌀", name: "伝言ゲーム地獄", hint: "順序を間違えると怪文書が生まれる" },
  { category: "shacho", id: "zangyo", emoji: "🔥", name: "残業まみれの現場", hint: "同じ係に仕事を集めすぎると…" },
  { category: "shacho", id: "wanope", emoji: "🫠", name: "ワンオペ社長", hint: "1体に全部任せる勇気と代償" },
  { category: "shacho", id: "kaigi", emoji: "😵", name: "会議だけで一日が終わった", hint: "段取りの混乱は会議を生む" },
];

const tsukue: ZukanItem[] = [
  { category: "tsukue", id: "chirakashi", emoji: "🌪️", name: "散らかし屋", hint: "AIの作業机で判定される" },
  { category: "tsukue", id: "minarai", emoji: "🧹", name: "片付け見習い", hint: "AIの作業机で判定される" },
  { category: "tsukue", id: "tatsujin", emoji: "🧘", name: "整頓の達人", hint: "3タスクとも完璧な机を作る…できる？" },
];

const nou: ZukanItem[] = [
  { category: "nou", id: "noukin", emoji: "💪", name: "脳筋ディスパッチャ", hint: "速い脳・遅い脳で判定される" },
  { category: "nou", id: "balance", emoji: "⚖️", name: "バランス派", hint: "速い脳・遅い脳で判定される" },
  { category: "nou", id: "shirei", emoji: "🎖️", name: "司令塔マスター", hint: "12件すべて正しい脳に振り分ける…できる？" },
];

const gakuya: ZukanItem[] = [
  { category: "gakuya", id: "kanban", emoji: "✨", name: "名店の看板AI", hint: "守りと親切のバランスが取れた台本を書く" },
  { category: "gakuya", id: "bochi", emoji: "🍵", name: "ぼちぼちの店", hint: "大過なく営業する、味のあるAI窓口" },
  { category: "gakuya", id: "shio", emoji: "🧂", name: "塩対応伝説", hint: "守りを固めすぎるとこうなる" },
  { category: "gakuya", id: "jiko", emoji: "🔥", name: "大事故クロージング", hint: "台本のスキを突かれると…" },
];

const shitsuke: ZukanItem[] = [
  { category: "shitsuke", id: "kouha", emoji: "🧊", name: "硬派AI調教師", hint: "事実を選び続けるとこう育つ" },
  { category: "shitsuke", id: "balance", emoji: "🎓", name: "バランス調教師", hint: "事実と心地よさの、ほどよい配合" },
  { category: "shitsuke", id: "gomasuri", emoji: "🍯", name: "ゴマすりAI製造者", hint: "心地よさを選び続けると…" },
];

const majin: ZukanItem[] = [
  { category: "majin", id: "kenja", emoji: "🧞", name: "魔神使いの賢者", hint: "5つの願いをすべて事故なく叶えさせる…できる？" },
  { category: "majin", id: "shugyo", emoji: "🔮", name: "見習い魔神使い", hint: "魔神AIの願い方で判定される" },
  { category: "majin", id: "jiko", emoji: "💥", name: "願い方が雑な人", hint: "魔神は言葉どおりに全力で働きます" },
];

const diet: ZukanItem[] = [
  { category: "diet", id: "sommelier", emoji: "🍷", name: "軽量化ソムリエ", hint: "3台すべてにジャストフィットさせる…できる？" },
  { category: "diet", id: "fitting", emoji: "🧵", name: "見習いフィッター", hint: "AIダイエットで判定される" },
  { category: "diet", id: "kowashiya", emoji: "🔨", name: "圧縮のこわし屋", hint: "絞りすぎると首都がおにぎりになる" },
];

const otehon: ZukanItem[] = [
  { category: "otehon", id: "meijin", emoji: "🎯", name: "例示の名人", hint: "全ラウンドで完璧なお手本を選ぶ…できる？" },
  { category: "otehon", id: "minarai", emoji: "📋", name: "お手本見習い", hint: "お手本ひとつでで判定される" },
  { category: "otehon", id: "burebure", emoji: "🌀", name: "ブレブレ製造機", hint: "悪いお手本は悪癖ごと量産される" },
];

const undokai: ZukanItem[] = [
  { category: "undokai", id: "yosoya", emoji: "🔮", name: "AI予想屋の神", hint: "全種目の勝者を的中させる…できる？" },
  { category: "undokai", id: "kansen", emoji: "🎌", name: "目の肥えた観客", hint: "AI運動会で判定される" },
  { category: "undokai", id: "oana", emoji: "🎫", name: "大穴ハンター", hint: "スコアの数字だけでは、勝者は当てられない" },
];

const gohobi: ZukanItem[] = [
  { category: "gohobi", id: "sekkeishi", emoji: "🏆", name: "報酬設計士", hint: "3ラウンドすべてAIをゴールに導く…できる？" },
  { category: "gohobi", id: "kainushi", emoji: "🦴", name: "見習い飼い主", hint: "ご褒美で導けで判定される" },
  { category: "gohobi", id: "hack", emoji: "🌀", name: "ハック誘発者", hint: "ご褒美を食べ尽くして、AIは昼寝した" },
];

const emaki: ZukanItem[] = [
  { category: "emaki", id: "read", emoji: "📜", name: "AI75年史・読破", hint: "AIの歴史絵巻を最後までスクロールする" },
];

export const ZUKAN_SECTIONS: ZukanSection[] = [
  { category: "rooms", title: "隠し部屋の発見", sub: "用語集のどこかに、18の扉がある", items: rooms },
  { category: "quiz", title: "用語力診断の級", sub: "全5階級をコレクション", items: quiz },
  { category: "uso", title: "ウソ見抜きの級", sub: "全5階級をコレクション", items: uso },
  { category: "agent", title: "エージェントの結末", sub: "任せ方しだいの6エンディング", items: agent },
  { category: "sodate", title: "育成したAIモデル", sub: "過学習5種＋バランス型", items: sodate },
  { category: "vibe", title: "バイブで作った作品", sub: "3つの題材ぜんぶ作る", items: vibe },
  { category: "shinjin", title: "指示力の実績", sub: "完璧な発注と、伝説の丸投げ", items: shinjin },
  { category: "slop", title: "スロップ鑑定の腕前", sub: "タイムラインを守る鑑定眼", items: slop },
  { category: "keibi", title: "警備員の勤務成績", sub: "インジェクションから守り切れ", items: keibi },
  { category: "shacho", title: "AI社長の経営結果", sub: "段取りしだいの6エンディング", items: shacho },
  { category: "tsukue", title: "作業机の整頓レベル", sub: "何を載せるかが答えを決める", items: tsukue },
  { category: "nou", title: "脳の采配力", sub: "速い脳と遅い脳の使い分け", items: nou },
  { category: "gakuya", title: "AI窓口の営業結果", sub: "台本しだいの4エンディング", items: gakuya },
  { category: "shitsuke", title: "調教したAIのタイプ", sub: "10回の「好み」が人格を決める", items: shitsuke },
  { category: "majin", title: "魔神使いの位", sub: "願い方しだいで事故は防げる", items: majin },
  { category: "diet", title: "軽量化の腕前", sub: "入る中で最高品質を狙え", items: diet },
  { category: "otehon", title: "お手本選びの腕前", sub: "良い例は一撃、悪い例は悪夢", items: otehon },
  { category: "undokai", title: "AI運動会の予想成績", sub: "スコアに出ない実力がある", items: undokai },
  { category: "gohobi", title: "報酬設計の腕前", sub: "ご褒美の置き方が行動を作る", items: gohobi },
  { category: "emaki", title: "歴史の証人", sub: "AIの75年を見届ける", items: emaki },
];

export const ZUKAN_TOTAL = ZUKAN_SECTIONS.reduce((n, s) => n + s.items.length, 0);
