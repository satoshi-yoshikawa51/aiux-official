/* ============================================================
   きょうの きみに — 名言ストック。
   AIはここから「選ぶ」だけで、文章は生成しない（質の安定のため）。

   書き方のルール：
   - lines はぜんぶ ひらがな（カタカナ可・漢字なし）。1行12文字くらいまで。
     文節の間は半角スペース。2〜4行。
   - 実在がたしかな言葉だけを、趣旨をくずさず自分の言葉に直して入れる。
     出どころがあやしい有名フレーズは who を「むかしのひと」にする。
   - feels は合う気持ちのタグ（複数可）。
   ============================================================ */

export type FeelId = "sad" | "tired" | "worry" | "angry" | "happy";

export interface Kotoba {
  id: string;
  who: string;
  lines: string[];
  feels: FeelId[];
}

export const KOTOBA: Kotoba[] = [
  /* —— ゲーテ —— */
  { id: "goethe-1", who: "ゲーテ", lines: ["ひとは", "じぶんににたひとを", "すきになるんだって"], feels: ["sad"] },
  { id: "goethe-2", who: "ゲーテ", lines: ["なきながら たべたぱんの", "あじを しってるひとは", "つよいんだって"], feels: ["sad"] },
  { id: "goethe-3", who: "ゲーテ", lines: ["いそがなくていい", "でも とまらなくていい"], feels: ["tired", "worry"] },
  { id: "goethe-4", who: "ゲーテ", lines: ["まよってるのは", "すすんでるしょうこ", "なんだって"], feels: ["worry"] },
  { id: "goethe-5", who: "ゲーテ", lines: ["ひかりがあたれば", "ちりも かがやくんだって"], feels: ["sad"] },
  { id: "goethe-6", who: "ゲーテ", lines: ["おうちで ほっとできたら", "それが いちばんの", "しあわせなんだって"], feels: ["happy", "tired"] },

  /* —— 徳川家康 —— */
  { id: "ieyasu-1", who: "徳川家康", lines: ["じんせいは おもいにもつを", "せおってあるく とおいみち", "いそがなくていいんだって"], feels: ["tired", "sad"] },
  { id: "ieyasu-2", who: "徳川家康", lines: ["たりないくらいが", "ちょうどいいんだって"], feels: ["sad", "worry"] },

  /* —— 松尾芭蕉 —— */
  { id: "basho-1", who: "松尾芭蕉", lines: ["つきひは たびびとなんだって", "きょうのことも", "とおりすぎていくよ"], feels: ["sad", "tired"] },
  { id: "basho-2", who: "松尾芭蕉", lines: ["よくみると かきねに", "ちいさなはなが", "さいてるんだって"], feels: ["angry", "happy"] },

  /* —— セネカ —— */
  { id: "seneca-1", who: "セネカ", lines: ["ひとは そうぞうのなかで", "くるしみすぎるんだって"], feels: ["worry"] },
  { id: "seneca-2", who: "セネカ", lines: ["いかりのくすりは", "すこし まつことなんだって"], feels: ["angry"] },
  { id: "seneca-3", who: "セネカ", lines: ["いきてるあいだ ずっと", "いきかたを ならってるの", "だから まちがえていいの"], feels: ["worry", "sad"] },
  { id: "seneca-4", who: "セネカ", lines: ["じかんだけは", "きみのものなんだって"], feels: ["tired"] },
  { id: "seneca-5", who: "セネカ", lines: ["むずかしいからじゃなくて", "やらないから むずかしく", "なるんだって"], feels: ["worry"] },

  /* —— マルクス・アウレリウス —— */
  { id: "aurelius-1", who: "マルクス・アウレリウス", lines: ["じゃまなものが", "そのまま みちに", "なるんだって"], feels: ["worry", "angry"] },
  { id: "aurelius-2", who: "マルクス・アウレリウス", lines: ["けさも いきてる", "それだけで すごいんだって"], feels: ["happy", "tired"] },
  { id: "aurelius-3", who: "マルクス・アウレリウス", lines: ["しずかなこころは", "じぶんで つくれるんだって"], feels: ["angry", "worry"] },
  { id: "aurelius-4", who: "マルクス・アウレリウス", lines: ["いやなひとに にないこと", "それが いちばんの", "しかえしなんだって"], feels: ["angry"] },
  { id: "aurelius-5", who: "マルクス・アウレリウス", lines: ["いま このしゅんかんだけ", "みてれば いいんだって"], feels: ["worry"] },
  { id: "aurelius-6", who: "マルクス・アウレリウス", lines: ["かんがえかたが", "きぶんを つくるんだって"], feels: ["worry", "sad"] },

  /* —— エピクテトス —— */
  { id: "epictetus-1", who: "エピクテトス", lines: ["かえられないことは", "そらのてんきと おなじ", "てばなしていいんだって"], feels: ["worry", "sad", "angry"] },
  { id: "epictetus-2", who: "エピクテトス", lines: ["できごとじゃなくて", "うけとりかたが", "きぶんを きめるんだって"], feels: ["sad", "angry"] },
  { id: "epictetus-3", who: "エピクテトス", lines: ["きにしなければ わるぐちは", "ただのおとなんだって"], feels: ["angry"] },
  { id: "epictetus-4", who: "エピクテトス", lines: ["もってないものより", "もってるものを", "かぞえようって"], feels: ["sad", "happy"] },

  /* —— エピクロス —— */
  { id: "epicurus-1", who: "エピクロス", lines: ["ないものを ほしがって", "いまあるものを", "だいなしにしないでって"], feels: ["happy", "sad"] },
  { id: "epicurus-2", who: "エピクロス", lines: ["ともだちは せかいを", "おどってまわるんだって"], feels: ["sad", "happy"] },

  /* —— ニーチェ —— */
  { id: "nietzsche-1", who: "ニーチェ", lines: ["いきるりゆうがあるひとは", "たいていのことに", "たえられるんだって"], feels: ["worry", "sad"] },
  { id: "nietzsche-2", who: "ニーチェ", lines: ["つかれてるときに", "はんせいしちゃ だめだって", "それは あしたのしごと"], feels: ["tired", "sad"] },
  { id: "nietzsche-3", who: "ニーチェ", lines: ["おどるひを ふやそうって", "いってたひとが いるよ"], feels: ["happy"] },
  { id: "nietzsche-4", who: "ニーチェ", lines: ["すきになれないものは", "とおりすぎて いいんだって"], feels: ["angry"] },

  /* —— 孔子 —— */
  { id: "confucius-1", who: "孔子", lines: ["まちがえたことより", "なおさないことのほうが", "まちがいなんだって"], feels: ["sad", "worry"] },
  { id: "confucius-2", who: "孔子", lines: ["とまらなければ", "どんなにおそくても", "いいんだって"], feels: ["tired"] },
  { id: "confucius-3", who: "孔子", lines: ["たのしんでるひとが", "いちばんつよいんだって"], feels: ["happy"] },
  { id: "confucius-4", who: "孔子", lines: ["ちいさないらいらで", "おおきなたいせつを", "こわさないでって"], feels: ["angry"] },

  /* —— 老子・荘子 —— */
  { id: "laozi-1", who: "老子", lines: ["とおいみちも", "さいしょのいっぽから", "なんだって"], feels: ["worry", "tired"] },
  { id: "laozi-2", who: "老子", lines: ["たりるをしってるひとは", "おかねもちなんだって"], feels: ["happy"] },
  { id: "laozi-3", who: "老子", lines: ["やわらかいものが", "ほんとうは つよいんだって", "みずみたいにね"], feels: ["sad", "angry"] },
  { id: "laozi-4", who: "老子", lines: ["おおきなうつわは", "ゆっくり できるんだって"], feels: ["worry", "tired"] },
  { id: "zhuangzi-1", who: "荘子", lines: ["やくにたたないものにも", "ちゃんと いみがあるんだって"], feels: ["sad"] },
  { id: "zhuangzi-2", who: "荘子", lines: ["おおきなとりは", "かぜをまって とぶんだって"], feels: ["worry", "tired"] },

  /* —— ブッダ（法句経） —— */
  { id: "buddha-1", who: "ブッダ", lines: ["じぶんを あかりに", "していいんだって"], feels: ["worry"] },
  { id: "buddha-2", who: "ブッダ", lines: ["いかりを てばなすと", "よくねむれるんだって"], feels: ["angry"] },
  { id: "buddha-3", who: "ブッダ", lines: ["きのうは おいといて", "あしたも おいといて", "いまだけ みてみよう"], feels: ["worry"] },
  { id: "buddha-4", who: "ブッダ", lines: ["まんぞくは さいこうの", "たからものなんだって"], feels: ["happy"] },
  { id: "buddha-5", who: "ブッダ", lines: ["うらみは うらみでは", "きえないんだって"], feels: ["angry"] },

  /* —— 日本の歌人・俳人・文人 —— */
  { id: "ryokan-1", who: "良寛", lines: ["つらいときは つらいままで", "いいんだって"], feels: ["sad"] },
  { id: "ryokan-2", who: "良寛", lines: ["ちるはなも のこるはなも", "おなじはななんだって"], feels: ["sad"] },
  { id: "ikkyu-1", who: "一休さん", lines: ["だいじょうぶ", "なんとかなるって"], feels: ["worry"] },
  { id: "soseki-1", who: "夏目漱石", lines: ["のんきそうにみえるひとも", "たたくと かなしいおとが", "するんだって"], feels: ["sad"] },
  { id: "soseki-2", who: "夏目漱石", lines: ["うしみたいに のっそり", "すすめばいいんだって"], feels: ["tired", "worry"] },
  { id: "soseki-3", who: "夏目漱石", lines: ["どうやっても ひとのよは", "すみにくいものなんだって"], feels: ["sad", "angry"] },
  { id: "takuboku-1", who: "石川啄木", lines: ["はたらいても はたらいても", "らくにならないって", "てをみつめたひとがいるよ"], feels: ["tired"] },
  { id: "takuboku-2", who: "石川啄木", lines: ["みんなが えらくみえるひは", "はなをかって かえったって"], feels: ["sad"] },
  { id: "santoka-1", who: "種田山頭火", lines: ["まっすぐなみちは", "さみしいんだって"], feels: ["sad"] },
  { id: "santoka-2", who: "種田山頭火", lines: ["わけいっても わけいっても", "あおいやま って", "つぶやいたひとがいるよ"], feels: ["tired"] },
  { id: "hosai-1", who: "尾崎放哉", lines: ["せきをしても ひとり って", "かいたひとがいるよ"], feels: ["sad"] },
  { id: "issa-1", who: "小林一茶", lines: ["やせがえる まけるないっさ", "ここにあり って"], feels: ["worry", "sad"] },
  { id: "issa-2", who: "小林一茶", lines: ["つゆのよは つゆのよながら", "さりながら って"], feels: ["sad"] },
  { id: "issa-3", who: "小林一茶", lines: ["めでたさも ちゅうくらい", "それくらいが いいんだって"], feels: ["happy"] },
  { id: "misuzu-1", who: "金子みすゞ", lines: ["みんなちがって", "みんないい って"], feels: ["sad", "worry"] },
  { id: "misuzu-2", who: "金子みすゞ", lines: ["みえないものも", "ちゃんとあるんだって"], feels: ["sad"] },
  { id: "bokusui-1", who: "若山牧水", lines: ["そらのあおにも そまらずに", "ただよってるとりも", "いるんだって"], feels: ["sad"] },
  { id: "dazai-1", who: "太宰治", lines: ["わらわれて わらわれて", "つよくなるんだって"], feels: ["sad"] },
  { id: "dazai-2", who: "太宰治", lines: ["しあわせは ひとばん", "おくれてくるんだって"], feels: ["sad", "worry"] },
  { id: "dogen-1", who: "道元", lines: ["はるははな なつほととぎす", "あきはつき ふゆはゆき", "それだけで いいんだって"], feels: ["happy", "tired"] },
  { id: "rikyu-1", who: "千利休", lines: ["あめのもらないいえと", "あったかいごはんがあれば", "じゅうぶんなんだって"], feels: ["happy"] },
  { id: "sontoku-1", who: "二宮尊徳", lines: ["ちいさなつみかさねが", "おおきくなるんだって"], feels: ["tired", "worry"] },
  { id: "hokusai-1", who: "葛飾北斎", lines: ["ほくさいでさえ", "ななじゅうすぎて やっと", "じょうずになれたんだって"], feels: ["worry", "tired"] },
  { id: "sei-1", who: "清少納言", lines: ["はるは あけぼの って", "すきなものから", "かぞえたひとがいるよ"], feels: ["happy"] },
  { id: "saikontan-1", who: "菜根譚", lines: ["いそがなければ じかんは", "たっぷりあるんだって"], feels: ["tired"] },
  { id: "saikontan-2", who: "菜根譚", lines: ["はんぶんさいたはなが", "いちばんきれいなんだって"], feels: ["worry", "happy"] },

  /* —— 西洋の哲学者・作家 —— */
  { id: "heraclitus-1", who: "ヘラクレイトス", lines: ["おなじかわには", "にどはいれないんだって", "ぜんぶ ながれていくの"], feels: ["sad", "angry"] },
  { id: "socrates-1", who: "ソクラテス", lines: ["いちばんかしこいひとは", "しらないってことを", "しってるひとなんだって"], feels: ["worry"] },
  { id: "aristotle-1", who: "アリストテレス", lines: ["しあわせかどうかは", "じぶんで きめられるんだって"], feels: ["happy", "sad"] },
  { id: "cicero-1", who: "キケロ", lines: ["いきてるかぎり", "きぼうはあるんだって"], feels: ["sad", "worry"] },
  { id: "horatius-1", who: "ホラティウス", lines: ["きょうというひを", "つみとろうって"], feels: ["happy"] },
  { id: "montaigne-1", who: "モンテーニュ", lines: ["おうさまだって じぶんの", "おしりのうえに すわってる", "だけなんだって"], feels: ["sad", "angry"] },
  { id: "pascal-1", who: "パスカル", lines: ["にんげんは かんがえるあし", "よわいけど かんがえられる"], feels: ["sad", "worry"] },
  { id: "pascal-2", who: "パスカル", lines: ["へやで ゆっくりするのは", "だいじなことなんだって"], feels: ["tired"] },
  { id: "shakespeare-1", who: "シェイクスピア", lines: ["いいもわるいも", "かんがえかたひとつ", "なんだって"], feels: ["worry", "angry"] },
  { id: "shakespeare-2", who: "シェイクスピア", lines: ["あけないよるは", "ないんだって"], feels: ["sad", "worry"] },
  { id: "davinci-1", who: "ダ・ヴィンチ", lines: ["よくうごいたひには", "いいねむりが くるんだって"], feels: ["tired"] },
  { id: "aesop-1", who: "イソップ", lines: ["うさぎとかめは", "かめが かったんだよ", "ゆっくりで いいんだって"], feels: ["tired", "worry"] },
  { id: "aesop-2", who: "イソップ", lines: ["とどかないぶどうは", "すっぱいってことに", "していいんだって"], feels: ["angry", "sad"] },
  { id: "andersen-1", who: "アンデルセン", lines: ["みにくいあひるのこは", "ほんとは はくちょうだったの", "しってた？"], feels: ["sad"] },
  { id: "saintex-1", who: "サン・テグジュペリ", lines: ["たいせつなものは", "めにみえないんだって"], feels: ["sad", "happy"] },
  { id: "saintex-2", who: "サン・テグジュペリ", lines: ["かけたじかんが", "たいせつを つくるんだって"], feels: ["sad", "worry"] },
  { id: "rilke-1", who: "リルケ", lines: ["こたえのないといは", "そのまま だいじにして", "いいんだって"], feels: ["worry"] },
  { id: "twain-1", who: "マーク・トウェイン", lines: ["しんぱいごとのほとんどは", "おこらないんだって"], feels: ["worry"] },
  { id: "twain-2", who: "マーク・トウェイン", lines: ["だれかを げんきにすると", "じぶんも げんきになるって"], feels: ["sad"] },
  { id: "lincoln-1", who: "リンカーン", lines: ["しあわせになるって", "きめたぶんだけ", "しあわせになれるんだって"], feels: ["happy", "sad"] },
  { id: "lincoln-2", who: "リンカーン", lines: ["ゆっくりあるいても", "もどらなければ いいんだって"], feels: ["tired"] },
  { id: "lincoln-3", who: "リンカーン", lines: ["おこったてがみは", "おくらずに ひきだしへ って"], feels: ["angry"] },
  { id: "jefferson-1", who: "ジェファーソン", lines: ["おこったら じゅうかぞえる", "すごくおこったら", "ひゃくまで かぞえるんだって"], feels: ["angry"] },
  { id: "emerson-1", who: "エマーソン", lines: ["ざっそうは いいところが", "まだみつかってない", "はなのことなんだって"], feels: ["sad"] },
  { id: "emerson-2", who: "エマーソン", lines: ["しあわせは こうすいみたい", "ひとにかけると", "じぶんにも かかるんだって"], feels: ["happy"] },
  { id: "thoreau-1", who: "ソロー", lines: ["じしんをもって", "ゆめのほうへ あるこうって"], feels: ["worry"] },
  { id: "hugo-1", who: "ユゴー", lines: ["わらいは たいようで", "かおから ふゆを", "おいだすんだって"], feels: ["sad"] },
  { id: "hugo-2", who: "ユゴー", lines: ["うみよりひろいのが そら", "そらよりひろいのが", "こころなんだって"], feels: ["angry", "sad"] },
  { id: "wilde-1", who: "オスカー・ワイルド", lines: ["どぶのなかからでも", "ほしは みえるんだって"], feels: ["sad", "worry"] },
  { id: "wilde-2", who: "オスカー・ワイルド", lines: ["じぶんは じぶんでいい", "ほかのやくは もう", "うまってるんだって"], feels: ["sad"] },
  { id: "alain-1", who: "アラン", lines: ["しあわせだからじゃなくて", "わらうから しあわせに", "なるんだって"], feels: ["sad", "happy"] },
  { id: "hilty-1", who: "ヒルティ", lines: ["とりかかっちゃえば", "はんぶん おわったような", "ものなんだって"], feels: ["tired", "worry"] },
  { id: "gandhi-1", who: "ガンジー", lines: ["はやくすすむだけが", "じんせいじゃ ないんだって"], feels: ["tired"] },
  { id: "adler-1", who: "アドラー", lines: ["もってるものを", "どうつかうかが", "だいじなんだって"], feels: ["worry", "sad"] },
  { id: "freud-1", who: "フロイト", lines: ["いつかふりかえったら", "もがいたひびが いちばん", "きれいにみえるんだって"], feels: ["sad", "tired"] },

  /* —— 出どころがあいまいな有名フレーズは「むかしのひと」名義 —— */
  { id: "mukashi-1", who: "むかしのひと", lines: ["いかりは あついすみ", "なげるまえに じぶんが", "やけどしちゃうんだって"], feels: ["angry"] },
  { id: "mukashi-2", who: "むかしのひと", lines: ["しあわせは ちょうちょみたい", "しずかにしてると", "かたに とまるんだって"], feels: ["happy", "worry"] },
  { id: "mukashi-3", who: "むかしのひと", lines: ["であうひとは みんな", "なにかと たたかってる", "だから やさしくねって"], feels: ["angry", "sad"] },

  /* —— ことわざ —— */
  { id: "kotowaza-1", who: "ことわざ", lines: ["あめふって", "じが かたまるんだって"], feels: ["sad", "angry"] },
  { id: "kotowaza-2", who: "ことわざ", lines: ["わらうかどには", "ふくが くるんだって"], feels: ["sad", "happy"] },
  { id: "kotowaza-3", who: "ことわざ", lines: ["あんずるより", "うむが やすし だって"], feels: ["worry"] },
  { id: "kotowaza-4", who: "ことわざ", lines: ["まてば かいろの", "ひよりあり なんだって"], feels: ["worry", "tired"] },
  { id: "kotowaza-5", who: "ことわざ", lines: ["ちりもつもれば", "やまになるんだって"], feels: ["tired"] },
  { id: "kotowaza-6", who: "ことわざ", lines: ["いそがば まわれ", "なんだって"], feels: ["tired", "worry"] },
  { id: "kotowaza-7", who: "ことわざ", lines: ["あしたは あしたのかぜが", "ふくんだって"], feels: ["worry"] },
  { id: "kotowaza-8", who: "ことわざ", lines: ["たんきは そんき", "っていうもんね"], feels: ["angry"] },
];

/* その気持ちに合う候補（avoid は直前に出したもの） */
export function kotobaFor(feel: string, avoid?: string): Kotoba[] {
  return KOTOBA.filter((k) => k.feels.includes(feel as FeelId) && k.id !== avoid);
}
