/* ============================================================
   COMIXAI図鑑の台帳。全34項目。
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

const emaki: ZukanItem[] = [
  { category: "emaki", id: "read", emoji: "📜", name: "AI75年史・読破", hint: "AIの歴史絵巻を最後までスクロールする" },
];

export const ZUKAN_SECTIONS: ZukanSection[] = [
  { category: "rooms", title: "隠し部屋の発見", sub: "用語集のどこかに、6つの扉がある", items: rooms },
  { category: "quiz", title: "用語力診断の級", sub: "全5階級をコレクション", items: quiz },
  { category: "uso", title: "ウソ見抜きの級", sub: "全5階級をコレクション", items: uso },
  { category: "agent", title: "エージェントの結末", sub: "任せ方しだいの6エンディング", items: agent },
  { category: "sodate", title: "育成したAIモデル", sub: "過学習5種＋バランス型", items: sodate },
  { category: "vibe", title: "バイブで作った作品", sub: "3つの題材ぜんぶ作る", items: vibe },
  { category: "shinjin", title: "指示力の実績", sub: "完璧な発注と、伝説の丸投げ", items: shinjin },
  { category: "emaki", title: "歴史の証人", sub: "AIの75年を見届ける", items: emaki },
];

export const ZUKAN_TOTAL = ZUKAN_SECTIONS.reduce((n, s) => n + s.items.length, 0);
