/* ============================================================
   用語集 第3波：2026年9月のフロンティアモデル世代（+5語）
   GPT-6 Astra・Claude Fable 5.1・Gemini Omniと、その背景概念。
   方針：特定ベンダーを持ち上げない。各社の強みも制約も、
   出典が取れた事実ベースで書く（ベンチマークは測定条件の注記を添える）。
   ============================================================ */
import type { GlossaryTerm } from "./data";

export const TERMS_WAVE3: GlossaryTerm[] = [
  {
    slug: "gpt-6",
    term: "GPT-6（GPT-6 Astra）",
    yomi: "じーぴーてぃーしっくす あすとら",
    en: "GPT-6 Astra",
    category: "開発・活用",
    short:
      "OpenAIが2026年9月に公開した最上位モデル。数学・科学系ベンチマークやPC自動操作で最高水準を記録した一方、チャットで使えるのは上位プラン中心で、サイバー関連の高度な依頼は安全方針により断る設計になっている。",
    body: [
      "GPT-5.6系の次の世代として登場したのがGPT-6 Astraです。100万トークンの長い文脈を扱え、数学の難問ベンチマーク（FrontierMath Tier 4で97.6%）や抽象推論（ARC-AGI-3で99.9%※OpenAIのアダプタ環境での測定）をほぼ「解き切って」しまい、PCやブラウザの自動操作（OSWorld 2.0で72.6%）でも前世代より大幅に速く正確になりました。ベンチマークの数字だけ見れば、2026年9月時点の最高峰の一角です。",
      "ただし「誰でもすぐチャットで使える」わけではない点に注意。チャット画面のGPT-6 ProはPro以上の上位プランに週あたりの回数制限つきで提供され、Plusでは自律エージェントのChatGPT WorkやCodex経由での利用が入口です。また、サイバーセキュリティ分野でOpenAIの安全基準の「Critical」水準に達したと自己申告されており、攻撃コード作成のような依頼は一般提供版では拒否し、審査を通った組織だけが「Daybreak」プログラムで緩和版を使える二段構えになっています。性能の高さと提供の慎重さがセットになった、フロンティアモデル世代を象徴するモデルです。",
    ],
    links: [
      { label: "比較：ChatGPT・Claude・Gemini どれを使う？（2026年9月版）", href: "/compare" },
      { label: "用語：ベンチマーク（数字の読み方の注意も）", href: "/glossary/benchmark" },
    ],
    relatedSlugs: ["chatgpt", "openai", "frontier-model", "trusted-access", "claude-fable"],
    faq: [
      {
        q: "GPT-6 AstraはChatGPT Plusで使えますか？",
        a: "2026年9月時点では、チャット画面の「GPT-6 Pro」はPro以上の上位プラン向けで、PlusはChatGPT Work（自律エージェント）やCodex経由での利用が入口です。提供範囲は段階的に広がる見込みなので、最新の状況は公式のヘルプで確認してください。",
      },
      {
        q: "GPT-6とClaude Fable 5.1はどちらが賢いですか？",
        a: "分野によります。両社が共通で公表したベンチマークでは数学・科学・PC操作を中心にGPT-6 Astraが優勢、エージェント型コーディングの独立系指標ではFable 5.1が僅差で首位です（ただし測定環境が異なるため単純比較はできません）。日常用途では差を体感しにくい水準で、API価格も同じです。",
      },
    ],
    lastUpdated: "2026-09-06",
  },
  {
    slug: "claude-fable",
    term: "Claude Fable／Claude Mythos",
    yomi: "くろーど ふぇいぶる／みそす",
    en: "Claude Fable / Claude Mythos",
    category: "開発・活用",
    short:
      "AnthropicがOpusの上に新設した最上位モデル階級。2026年9月に5.1へ更新され、エージェント型コーディングの独立系指標で首位級。同じモデルに強い安全対策を載せたのがFable、審査制で提供されるのがMythos。",
    body: [
      "Claudeは長らく「Opusが最上位」でしたが、2026年にその上の階級として登場したのがFableです。9月公開のFable 5.1は、料金を据え置いたままキャッシュ読み取りを75%値下げし、同じ問題を少ない思考量で解けるよう効率が改善されました。独立系の評価（Artificial AnalysisのCoding Agent Index）ではClaude Code上のFable 5.1が首位でしたが、2位のGPT-6 Astraとは3ポイント差で、しかも実行環境が異なるため「僅差・条件付き」と読むのが正確です。数学・科学系の共通ベンチマークではGPT-6 Astraに譲る項目も多く、万能の王者ではありません。",
      "もうひとつの特徴が提供の二段構え。FableとMythosは同じモデルで、違いは安全対策の強さだけです。一般提供のFableはサイバー・生命科学などの危険になりうる依頼を断る設計で、審査を通った組織だけがMythosを使えます。また利用面では、個人プランのProでは使った分だけのクレジット制、Maxでも週間上限の50%までという制約があり、「最上位モデルは気軽に使い放題ではない」のは各社共通の潮流です。",
    ],
    links: [
      { label: "比較：ChatGPT・Claude・Gemini どれを使う？（2026年9月版）", href: "/compare" },
      { label: "用語：Claude（本体サービスの解説）", href: "/glossary/claude" },
    ],
    relatedSlugs: ["claude", "anthropic", "claude-code", "frontier-model", "trusted-access", "gpt-6"],
    faq: [
      {
        q: "FableとOpusは何が違うのですか？",
        a: "階級（ティア）が違います。Opusの上にFableが新設され、より難しい推論や長時間のエージェント作業に向きます。そのぶんAPI価格は高く、個人プランでも利用枠の扱いが別建て（クレジット制など）です。日常用途はOpusやSonnetで十分な場面が多いです。",
      },
      {
        q: "Claude Mythosは誰でも使えますか？",
        a: "使えません。Mythosは審査制のトラステッドアクセスプログラム経由で、主にサイバーセキュリティや生命科学の正当な業務を持つ組織向けです。一般ユーザー向けには同じモデルのFableが提供されています。",
      },
    ],
    lastUpdated: "2026-09-06",
  },
  {
    slug: "gemini-omni",
    term: "Gemini Omni",
    yomi: "じぇみに おむに",
    en: "Gemini Omni",
    category: "開発・活用",
    short:
      "Googleの動画生成・編集AI。2026年8月の1.1 Flashで最大4Kアップスケールや「続きの生成」に対応し、動画分野では3社の中で頭ひとつ抜けた存在。本格利用は上位プランAI Ultraが中心。",
    body: [
      "文章や画像だけでなく動画まで生成できるのがGemini Omniです。2026年8月末の「Omni 1.1 Flash」では、生成した動画を最大4Kまで高解像度化、直前の映像を踏まえた「続きの生成」で最大40秒まで延長、キャラクターの見た目を保つ参照機能——と、単発の短い動画を作るだけの段階から「映像制作の道具」へ踏み出しました。動画生成に関しては、2026年9月時点でOpenAI・Anthropicに対して明確にリードしている分野です。",
      "一方で、テキストの推論力ではGPT-6 AstraやClaude Fable 5.1のようなフロンティア級の看板モデルを同時期に出しておらず（Pro系の最新3.1 Proはプレビュー段階）、Googleの戦力は「無料でも触れる軽量Flash系の高速更新＋動画のOmni＋Workspace連携」に寄っています。得意分野がはっきり分かれているので、「文章はA社、動画はGemini」のような使い分けが現実的です。動画生成をがっつり使うなら上位プランAI Ultraが前提になる点は予算と相談を。",
    ],
    links: [
      { label: "比較：ChatGPT・Claude・Gemini どれを使う？（2026年9月版）", href: "/compare" },
      { label: "用語：動画生成AI（分野全体の解説）", href: "/glossary/video-generation-ai" },
    ],
    relatedSlugs: ["gemini", "video-generation-ai", "multimodal-ai", "frontier-model"],
    faq: [
      {
        q: "Gemini Omniは無料で使えますか？",
        a: "お試し程度なら無料枠やキャンペーンで触れる機会がありますが、本数制限が厳しく、4Kアップスケールなどを日常的に使うには上位プラン（AI Ultra）が中心です。まず無料枠で1本作ってみて、続けたくなったら課金を検討する順番がおすすめです。",
      },
    ],
    lastUpdated: "2026-09-06",
  },
  {
    slug: "frontier-model",
    term: "フロンティアモデル",
    yomi: "ふろんてぃあもでる",
    en: "Frontier Model",
    category: "基礎知識",
    short:
      "その時点で最先端の性能を持つ、各社の看板AIモデルのこと。2026年9月はGPT-6 AstraとClaude Fable 5.1が代表格。性能と引き換えに、料金・利用枠・安全審査の面で「気軽さ」は犠牲になる。",
    body: [
      "「フロンティア（開拓の最前線）」の名のとおり、AIの能力の限界を押し広げている先頭集団のモデルを指します。2026年9月時点ではOpenAIのGPT-6 AstraとAnthropicのClaude Fable 5.1がその代表格で、興味深いことにAPI価格は両者ぴったり同じ（入力100万トークン10ドル・出力50ドル）。性能も、共通ベンチマークではAstra優勢、エージェント型コーディングの独立系指標ではFableが僅差首位と、分野で勝ち負けが分かれる接戦です。",
      "利用者として知っておきたいのは「フロンティア＝普段使いの正解、ではない」こと。この階級のモデルは料金が高く、チャットプランでも回数制限やクレジット制の対象で、難しいベンチマークがほぼ満点に達する（ベンチマーク飽和）せいで数字上の差も読みにくくなっています。日常のメールや要約は1〜2段下のモデルで十分速くて安く、フロンティア級は「難しい推論・長時間のエージェント作業・ここぞの品質」に取っておく——という使い分けが、2026年の現実的な付き合い方です。",
    ],
    links: [
      { label: "比較：ChatGPT・Claude・Gemini どれを使う？（2026年9月版）", href: "/compare" },
      { label: "用語：ベンチマーク（数字の読み方）", href: "/glossary/benchmark" },
    ],
    relatedSlugs: ["gpt-6", "claude-fable", "foundation-model", "benchmark", "trusted-access"],
    lastUpdated: "2026-09-06",
  },
  {
    slug: "trusted-access",
    term: "トラステッドアクセス（審査制提供）",
    yomi: "とらすてっどあくせす",
    en: "Trusted Access",
    category: "基礎知識",
    short:
      "AIの危険になりうる高度な能力を、身元審査を通った組織だけに開放する提供方式。2026年、OpenAIの「Daybreak」やAnthropicの「Mythos」で本格化した、フロンティアモデル時代の新しい安全策。",
    body: [
      "モデルが賢くなるほど、サイバー攻撃や生物学の悪用といった「本物の危険」に近づきます。そこで2026年に主要各社が揃って採用したのが、能力を一律に封じるのでも全開放するのでもなく、審査を通った相手にだけ開ける方式です。OpenAIはGPT-6 Astraが自社安全基準のCritical水準に達したとして、高度なサイバー関連機能を審査制の「Daybreak」プログラム限定にしました。Anthropicは同じモデルを安全対策の強さで2つに分け、一般向けのFableと審査制のMythosとして提供しています。",
      "一般ユーザーへの影響は「たまに断られる」体験として現れます。セキュリティの学習をしていて攻撃コードの説明を断られた——それはモデルが無能なのではなく、この仕組みが働いた結果です。正当な業務（ペネトレーションテスト、ワクチン研究など）で高度な能力が必要な組織は、審査を経て緩和版を使う道があります。「作った側が能力に責任を持つ」方向への転換点として、規制論とも絡む注目の論点です。",
    ],
    links: [
      { label: "用語：ガードレール（出力を制御する仕組み）", href: "/glossary/guardrail" },
      { label: "用語：AIガバナンス（組織側のルール作り）", href: "/glossary/ai-governance" },
    ],
    relatedSlugs: ["gpt-6", "claude-fable", "guardrail", "alignment", "ai-governance", "red-teaming"],
    lastUpdated: "2026-09-06",
  },
];
