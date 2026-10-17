/* ============================================================
   対策書（/taisaku）のデータ。
   質問 → 手順カードの並び替え（buildPlan）→ 前書き（preface）まで、
   AIを使わずにここで決める。

   手順カードは「検証済みの手順をコード側に持つ」のが肝で、
   OSのメニュー名をAIに書かせると誤りが致命的になるため、
   AIにはカード本文を書かせない（いぬがたりと同じ思想）。

   steps の path に出てくる「→」は、画面側で矢印アイコンに置き換えて描く。
   verified は実機で確かめた日。未検証のカードは null にしておき、
   確かめたら日付を入れる（画面には「手順カード更新：YYYY年M月」で出る）。
   ============================================================ */

export const TAISAKU_UPDATED = "2026-10-17";

export type Situation = "anx" | "phish" | "breach" | "hijack";
export type Device = "iphone" | "android" | "windows" | "mac";
export type Role = "personal" | "work";
export type Service = "google" | "apple" | "line" | "shop" | "pay" | "cloud";
export type PwStyle = "reuse" | "memo" | "app" | "unknown";

export interface Answers {
  sit: Situation;
  dev: Device[];
  role: Role;
  svc: Service[];
  pw: PwStyle;
}

export interface Option {
  v: string;
  l: string;
  /** 選択肢の下に出す補足 */
  h?: string;
  /** 立場=仕事のときだけ出す選択肢 */
  onlyWork?: boolean;
}

export interface Question {
  id: keyof Answers;
  type: "single" | "multi";
  /** 回答の控えに出す短い見出し */
  key: string;
  title: string;
  hint?: string;
  icon: string;
  opts: Option[];
}

export const QUESTIONS: Question[] = [
  {
    id: "sit",
    type: "single",
    key: "いまの状況",
    title: "いま、何が起きていますか？",
    icon: "ph-siren",
    opts: [
      { v: "anx", l: "特に何も。ただ不安", h: "ニュースを見て心配になった" },
      { v: "phish", l: "変なメール・SMSが来た", h: "ログインを求める、荷物が届いた、など" },
      { v: "breach", l: "「情報が流出しました」のお知らせが届いた", h: "使っているサービスからの通知" },
      { v: "hijack", l: "乗っ取られたかもしれない", h: "身に覚えのないログイン通知、知らない投稿" },
    ],
  },
  {
    id: "dev",
    type: "multi",
    key: "端末",
    title: "主に使っている端末は？",
    hint: "複数OK",
    icon: "ph-devices",
    opts: [
      { v: "iphone", l: "iPhone" },
      { v: "android", l: "Android" },
      { v: "windows", l: "Windows PC" },
      { v: "mac", l: "Mac" },
    ],
  },
  {
    id: "role",
    type: "single",
    key: "立場",
    title: "仕事で、お客様や社員の個人情報を扱いますか？",
    icon: "ph-briefcase",
    opts: [
      { v: "personal", l: "扱わない（個人として対策したい）" },
      { v: "work", l: "扱う（顧客リスト、社内クラウドなど）", h: "自分が「漏らす側」にならない対策も入ります" },
    ],
  },
  {
    id: "svc",
    type: "multi",
    key: "使うもの",
    title: "使っているものは？",
    hint: "複数OK",
    icon: "ph-squares-four",
    opts: [
      { v: "google", l: "Google / Gmail" },
      { v: "apple", l: "Apple ID（iCloud）" },
      { v: "line", l: "LINE" },
      { v: "shop", l: "Amazon・楽天などの通販" },
      { v: "pay", l: "銀行アプリ・PayPay" },
      { v: "cloud", l: "会社のクラウド（Google Drive、Teams など）", onlyWork: true },
    ],
  },
  {
    id: "pw",
    type: "single",
    key: "パスワード",
    title: "パスワードは、どう管理していますか？",
    icon: "ph-key",
    opts: [
      { v: "reuse", l: "同じものを使い回している" },
      { v: "memo", l: "メモ帳や紙に書いている" },
      { v: "app", l: "管理アプリに任せている", h: "iPhoneのパスワードアプリ、Googleパスワードマネージャー、1Passwordなど" },
      { v: "unknown", l: "正直わからない" },
    ],
  },
];

/** 選択肢の値 → 短い表示名（括弧書きを落としたもの） */
export const LABEL: Record<string, string> = {};
for (const q of QUESTIONS) for (const o of q.opts) LABEL[o.v] = o.l.replace(/（.*?）/g, "");

export const DEVICE_NAME: Record<Device, string> = {
  iphone: "iPhone",
  android: "Android",
  windows: "Windows",
  mac: "Mac",
};

export const DEVICE_ICON: Record<Device, string> = {
  iphone: "ph-device-mobile",
  android: "ph-device-mobile-speaker",
  windows: "ph-desktop",
  mac: "ph-laptop",
};

/* ---------------- 手順カード ---------------- */

export interface Step {
  /** 画面の階層。「→」区切りで書く */
  path: string;
  /** 補足。空でもよい */
  tip: string;
}

export type ServiceTag = Service | "work" | "all";

export interface Card {
  id: string;
  t: string;
  svc: ServiceTag;
  time: string;
  lv: "かんたん" | "ふつう";
  why: string;
  /** 赤枠で先に出す注意 */
  danger?: string;
  /** 端末別の手順。any は端末に依存しない手順 */
  steps: Partial<Record<Device, Step[]>> & { any?: Step[] };
  src?: string;
  srcn?: string;
  /** 実機で確かめた日（YYYY-MM-DD）。未検証なら null */
  verified: string | null;
}

const P = (path: string, tip = ""): Step => ({ path, tip });

/* 手順カードの本文は 2026年10月時点の Apple 公式（HT204915）・Google
   アカウント画面・LINE ヘルプ・IPA の情報をもとに書いたもの。
   実機検証はまだなので verified は全て null。確かめたカードから日付を入れる。 */
export const CARDS: Record<string, Card> = {
  /* --- 緊急判定 --- */
  phish_triage: {
    id: "phish_triage",
    t: "そのメール・SMS、触らずに見分ける",
    svc: "all",
    time: "5分",
    lv: "かんたん",
    why: "本物でも偽物でも、メールの中のリンクから開かないのが正解。見分け方は端末で違います。",
    danger: "もうリンクを開いてログイン情報を入れてしまった人は、下の「入れてしまった時」カードを先に。",
    steps: {
      iphone: [
        P("メールの差出人名をタップ → 本当のアドレスを表示", "表示名が「Amazon」でも、@以降が見慣れないドメインなら偽物です"),
        P("リンクは長押し → 表示されるURLを見る（タップしない）", "公式ドメインと1文字違い、やたら長い、短縮URLは危険"),
        P("SMSなら、メッセージ上部の番号・URLを確認", "宅配業者がSMSにURLを送ることはほぼありません"),
        P("確かめたい時は、公式アプリかブックマークから自分で開く", "メール内のリンクは使わない。これが一番の防御です"),
        P("迷惑と判断したら、メールは「迷惑メール」へ、SMSは「迷惑メッセージを報告」", "返信・開封確認はしない"),
      ],
      android: [
        P("Gmailで差出人名をタップ → メールアドレスを確認", "@以降が公式ドメインか見る"),
        P("リンクを長押し → 「リンクアドレスをコピー」でURLを確認", "Chromeに貼る前に、メモ帳などに貼って読む"),
        P("SMSはメッセージ長押し → 「スパムとして報告」", "Googleメッセージの場合"),
        P("確かめたい時は、公式アプリかブックマークから自分で開く", "メール内のリンクは使わない"),
      ],
      windows: [
        P("リンクにマウスを乗せる → 画面左下に出るURLを読む", "クリックはしない"),
        P("差出人名の右の「<…>」のアドレスを確認", "Outlookは差出人名にカーソルで表示"),
        P("Outlook／Gmailの「迷惑メールとして報告」を使う", "削除だけより、報告した方が次から届きにくい"),
        P("確かめたい時は、ブラウザのブックマークから公式サイトへ"),
      ],
      mac: [
        P("リンクにカーソルを乗せる → 下に出るURLを読む", "Safari・メール共通"),
        P("メールの差出人名にカーソル → 本当のアドレスを表示"),
        P("「迷惑メール」ボタンで報告"),
        P("確かめたい時は、ブックマークから公式サイトへ"),
      ],
    },
    src: "https://www.ipa.go.jp/security/anshin/",
    srcn: "IPA 安心相談窓口",
    verified: null,
  },
  phish_entered: {
    id: "phish_entered",
    t: "ログイン情報を入れてしまった時",
    svc: "all",
    time: "15分",
    lv: "ふつう",
    why: "入力した瞬間に相手は使い始めます。順番は「パスワード変更 → 他の端末を追い出す → カード会社」。",
    steps: {
      any: [
        P("入れてしまったサービスのパスワードを、公式アプリから今すぐ変更", "メール内のリンクではなく、アプリ or ブックマークから"),
        P("同じパスワードを使っている他のサービスも全部変える", "相手は同じ組み合わせを他で試します"),
        P("そのサービスの「ログイン中の端末」を確認して、知らないものをログアウト", "下のサービス別カードに手順があります"),
        P("カード番号を入れたなら、カード会社に電話して利用停止・再発行", "裏面の番号。深夜でもつながります"),
        P("金銭被害が出たら、警察相談専用電話 #9110 へ", "消費者ホットラインは 188"),
      ],
    },
    verified: null,
  },
  breach_triage: {
    id: "breach_triage",
    t: "流出のお知らせ、まず何が漏れたか確かめる",
    svc: "all",
    time: "10分",
    lv: "かんたん",
    why: "「流出しました」の通知そのものが偽物のこともあります。本物なら、漏れた項目で危険度が決まります。",
    steps: {
      any: [
        P("通知のリンクは開かず、そのサービスの公式サイトの「お知らせ」で同じ発表があるか確認", "発表がなければ、通知自体がフィッシングの可能性"),
        P("漏れた項目をメモする：メール／パスワード／住所・電話／カード番号", "パスワードが含まれていたら、次の2枚が最優先"),
        P("そのサービスのパスワードを変更する", "公式アプリから"),
        P("同じパスワードを使い回している他のサービスを変更する", "メールアドレスとパスワードの組み合わせが出回ります"),
        P("カード番号が含まれていたら、カード会社に連絡して再発行", "明細も確認"),
        P("住所・電話が含まれていたら、今後の不審な電話・郵便に注意", "「流出したので確認を」という電話は詐欺です"),
      ],
    },
    verified: null,
  },
  hijack_general: {
    id: "hijack_general",
    t: "乗っ取りかもと思ったら、この順番で",
    svc: "all",
    time: "10分",
    lv: "ふつう",
    why: "焦ってアプリを消しても意味がありません。相手を追い出し、入口を閉める順番が大事です。",
    steps: {
      any: [
        P("その端末で、サービスの公式アプリ or ブックマークからログイン", "メールの通知リンクからは開かない"),
        P("パスワードを変更 → 「ログイン中の端末」から知らないものをログアウト", "サービス別の手順は下のカード"),
        P("復旧用のメールアドレス・電話番号が書き換えられていないか確認", "乗っ取りは、ここを書き換えて居座ります"),
        P("2段階認証をオンにする", "これで相手は戻ってこれません"),
        P("友人・連絡先に「乗っ取られていたので、変なメッセージが届いたら無視して」と伝える", "LINE・SNSは特に"),
      ],
    },
    verified: null,
  },

  /* --- Apple --- */
  apple_2fa: {
    id: "apple_2fa",
    t: "Apple IDに2ファクタ認証をかける",
    svc: "apple",
    time: "3分",
    lv: "かんたん",
    why: "写真・連絡先・パスワードが全部ここに入っています。パスワードが漏れても、iPhoneが手元になければ入れなくなります。",
    steps: {
      iphone: [
        P("設定 → いちばん上の自分の名前 → サインインとセキュリティ"),
        P("「2ファクタ認証」をオン → 案内に従って電話番号を登録", "すでに「オン」なら、このカードは完了です"),
        P("同じ画面で「アカウントの復旧」も開き、復旧用連絡先を1人登録", "家族など。ロックアウト時の保険"),
      ],
      mac: [P("システム設定 → 自分の名前 → サインインとセキュリティ"), P("「2ファクタ認証」をオン")],
      android: [P("ブラウザで account.apple.com を開いてサインイン"), P("「アカウントセキュリティをアップグレード」をタップして案内に従う")],
      windows: [P("ブラウザで account.apple.com を開いてサインイン"), P("「アカウントセキュリティをアップグレード」を選んで案内に従う")],
    },
    src: "https://support.apple.com/ja-jp/HT204915",
    srcn: "Apple公式",
    verified: null,
  },
  apple_devices: {
    id: "apple_devices",
    t: "Apple IDにログイン中の端末を点検する",
    svc: "apple",
    time: "3分",
    lv: "かんたん",
    why: "知らない端末が入っていれば、それが乗っ取りの証拠。削除すれば追い出せます。",
    steps: {
      iphone: [
        P("設定 → 自分の名前 → 下にスクロール → 端末の一覧"),
        P("見覚えのない端末をタップ → 「アカウントから削除」", "自分の古いiPhoneも、手放したなら削除"),
      ],
      mac: [P("システム設定 → 自分の名前 → 下の端末一覧"), P("見覚えのない端末 → 「アカウントから削除」")],
      android: [P("account.apple.com にサインイン → 「デバイス」")],
      windows: [P("account.apple.com にサインイン → 「デバイス」")],
    },
    verified: null,
  },
  apple_pw: {
    id: "apple_pw",
    t: "Apple IDのパスワードを変える",
    svc: "apple",
    time: "3分",
    lv: "かんたん",
    why: "",
    steps: {
      iphone: [P("設定 → 自分の名前 → サインインとセキュリティ → パスワードの変更", "iPhoneのパスコードを聞かれます")],
      mac: [P("システム設定 → 自分の名前 → サインインとセキュリティ → パスワードを変更")],
      android: [P("account.apple.com → サインインとセキュリティ → パスワード")],
      windows: [P("account.apple.com → サインインとセキュリティ → パスワード")],
    },
    verified: null,
  },

  /* --- Google --- */
  google_2fa: {
    id: "google_2fa",
    t: "Googleアカウントに2段階認証をかける",
    svc: "google",
    time: "5分",
    lv: "かんたん",
    why: "Gmailは他のサービスの「パスワード再設定」の入口。ここを取られると全部取られます。",
    steps: {
      iphone: [
        P("Gmailアプリ → 右上の自分のアイコン → Googleアカウントを管理"),
        P("上のタブで「セキュリティ」 → 「2段階認証プロセス」 → 開始", "スマホの通知で承認する方式が楽です"),
        P("同じ画面の「再設定用の電話番号・メール」も確認", "古い番号のままだと復旧できません"),
      ],
      android: [
        P("設定 → Google → Googleアカウントの管理"),
        P("「セキュリティ」タブ → 「2段階認証プロセス」 → 開始"),
        P("「再設定用の電話番号・メール」も確認"),
      ],
      windows: [
        P("ブラウザで myaccount.google.com を開く"),
        P("左の「セキュリティ」 → 「2段階認証プロセス」 → 開始"),
        P("「再設定用の電話番号・メール」も確認"),
      ],
      mac: [
        P("ブラウザで myaccount.google.com を開く"),
        P("左の「セキュリティ」 → 「2段階認証プロセス」 → 開始"),
        P("「再設定用の電話番号・メール」も確認"),
      ],
    },
    src: "https://myaccount.google.com/security",
    srcn: "Google アカウント",
    verified: null,
  },
  google_checkup: {
    id: "google_checkup",
    t: "Googleの「セキュリティ診断」を1周する",
    svc: "google",
    time: "5分",
    lv: "かんたん",
    why: "Googleが「ここが危ない」を赤・黄で並べてくれます。言われた通りに潰すだけ。",
    steps: {
      iphone: [
        P("Gmailアプリ → 右上アイコン → Googleアカウントを管理 → セキュリティ"),
        P("「セキュリティに関する推奨事項」を開き、黄色・赤の項目を上から処理", "「お使いのデバイス」に知らない端末があればログアウト"),
      ],
      android: [P("設定 → Google → Googleアカウントの管理 → セキュリティ"), P("「セキュリティに関する推奨事項」を上から処理")],
      windows: [
        P("ブラウザで myaccount.google.com/security-checkup を開く"),
        P("黄色・赤の項目を上から処理", "知らない端末、使っていない連携アプリは削除"),
      ],
      mac: [P("ブラウザで myaccount.google.com/security-checkup を開く"), P("黄色・赤の項目を上から処理")],
    },
    src: "https://myaccount.google.com/security-checkup",
    srcn: "Google セキュリティ診断",
    verified: null,
  },
  google_devices: {
    id: "google_devices",
    t: "Googleにログイン中の端末を点検・追い出す",
    svc: "google",
    time: "3分",
    lv: "かんたん",
    why: "",
    steps: {
      iphone: [
        P("Gmailアプリ → 右上アイコン → Googleアカウントを管理 → セキュリティ → お使いのデバイス"),
        P("見覚えのない端末 → 「ログアウト」"),
      ],
      android: [P("設定 → Google → Googleアカウントの管理 → セキュリティ → お使いのデバイス"), P("見覚えのない端末 → 「ログアウト」")],
      windows: [P("myaccount.google.com → セキュリティ → お使いのデバイス"), P("見覚えのない端末 → 「ログアウト」")],
      mac: [P("myaccount.google.com → セキュリティ → お使いのデバイス"), P("見覚えのない端末 → 「ログアウト」")],
    },
    verified: null,
  },
  google_pw: {
    id: "google_pw",
    t: "Googleのパスワードを変える",
    svc: "google",
    time: "3分",
    lv: "かんたん",
    why: "",
    steps: {
      iphone: [
        P("Gmailアプリ → 右上アイコン → Googleアカウントを管理 → セキュリティ → パスワード", "変更すると、他の端末は自動でログアウトされます"),
      ],
      android: [P("設定 → Google → Googleアカウントの管理 → セキュリティ → パスワード")],
      windows: [P("myaccount.google.com → セキュリティ → パスワード")],
      mac: [P("myaccount.google.com → セキュリティ → パスワード")],
    },
    verified: null,
  },

  /* --- LINE --- */
  line_login: {
    id: "line_login",
    t: "LINEの乗っ取り口を閉める（ログイン許可とWeb認証）",
    svc: "line",
    time: "3分",
    lv: "かんたん",
    why: "LINEの乗っ取りの多くは、PC版や外部サービスからのログイン。使わないなら入口ごと閉めるのが一番です。",
    steps: {
      iphone: [
        P("LINE → ホーム右上の歯車（設定） → アカウント"),
        P("PC版LINEを使わないなら「ログイン許可」をオフ", "使う人は次の項目を"),
        P("「Webログインの2要素認証」をオン", "ログイン時に、スマホに出る数字の入力が必要になります"),
        P("「ログイン中の端末」を開き、知らない端末があればログアウト"),
      ],
      android: [
        P("LINE → ホーム右上の歯車（設定） → アカウント"),
        P("PC版LINEを使わないなら「ログイン許可」をオフ"),
        P("「Webログインの2要素認証」をオン"),
        P("「ログイン中の端末」を確認して、知らない端末はログアウト"),
      ],
      windows: [P("この設定はスマホのLINEアプリで行います", "PC版LINEからは変更できません")],
      mac: [P("この設定はスマホのLINEアプリで行います")],
    },
    srcn: "LINE ヘルプセンター",
    verified: null,
  },
  line_pw: {
    id: "line_pw",
    t: "LINEのパスワードを変える",
    svc: "line",
    time: "2分",
    lv: "かんたん",
    why: "",
    steps: {
      iphone: [P("LINE → 設定 → アカウント → パスワード", "メールアドレス未登録なら、先に登録を")],
      android: [P("LINE → 設定 → アカウント → パスワード")],
      windows: [P("スマホのLINEアプリで行います")],
      mac: [P("スマホのLINEアプリで行います")],
    },
    verified: null,
  },

  /* --- 通販 --- */
  shop_2fa: {
    id: "shop_2fa",
    t: "Amazon・楽天に2段階認証をかける",
    svc: "shop",
    time: "5分",
    lv: "かんたん",
    why: "カードと住所が登録されたまま。乗っ取られると「勝手に注文」「ギフト券の購入」が起きます。",
    steps: {
      iphone: [
        P("Amazonアプリ → 下の「アカウント」 → アカウントサービス → ログインとセキュリティ"),
        P("「2段階認証」を「有効にする」 → スマホ番号か認証アプリを登録"),
        P("楽天：ブラウザで my.rakuten.co.jp → 会員情報 → ログイン・セキュリティの設定", "項目名は時期で変わります。「2段階認証」「ログイン通知」をオン"),
      ],
      android: [
        P("Amazonアプリ → 「アカウント」 → アカウントサービス → ログインとセキュリティ"),
        P("「2段階認証」を「有効にする」"),
        P("楽天：my.rakuten.co.jp → 会員情報 → ログイン・セキュリティの設定"),
      ],
      windows: [
        P("amazon.co.jp → 右上「アカウント＆リスト」 → ログインとセキュリティ"),
        P("「2段階認証」 → 「有効にする」"),
        P("楽天：my.rakuten.co.jp → 会員情報 → ログイン・セキュリティの設定"),
      ],
      mac: [
        P("amazon.co.jp → 右上「アカウント＆リスト」 → ログインとセキュリティ"),
        P("「2段階認証」 → 「有効にする」"),
        P("楽天：my.rakuten.co.jp → 会員情報 → ログイン・セキュリティの設定"),
      ],
    },
    verified: null,
  },
  shop_orders: {
    id: "shop_orders",
    t: "身に覚えのない注文・ログインがないか見る",
    svc: "shop",
    time: "3分",
    lv: "かんたん",
    why: "",
    steps: {
      any: [
        P("Amazon：アカウント → 注文履歴 で、直近30日に知らない注文がないか", "ギフト券・デジタル商品は特に"),
        P("Amazon：ログインとセキュリティ → 「アカウントのログイン情報の確認」で、不審な端末をサインアウト"),
        P("楽天：購入履歴と、登録メール宛の「ログイン通知」を確認"),
        P("知らない注文があれば、まずパスワード変更 → サービスのサポートへ連絡", "カードも止める"),
      ],
    },
    verified: null,
  },

  /* --- 銀行・決済 --- */
  pay_notify: {
    id: "pay_notify",
    t: "銀行・PayPayの「使ったら通知」をオンにする",
    svc: "pay",
    time: "5分",
    lv: "かんたん",
    why: "お金は、気づくのが早いほど取り戻せます。1円でも動いたら通知が来る状態にします。",
    steps: {
      iphone: [
        P("PayPay → 右下「アカウント」 → セキュリティとプライバシー", "ログイン履歴・端末認証をここで確認。知らない端末はログアウト"),
        P("iPhoneの設定 → 通知 → PayPay・銀行アプリ の通知を許可"),
        P("銀行アプリ：メニュー → 通知設定 → 「入出金通知」「ログイン通知」をオン", "項目名は銀行ごとに違います"),
        P("カード会社のアプリも同様に「利用通知」をオン"),
      ],
      android: [
        P("PayPay → 「アカウント」 → セキュリティとプライバシー"),
        P("Androidの設定 → 通知 で、PayPay・銀行アプリを許可"),
        P("銀行アプリ：通知設定 → 「入出金通知」「ログイン通知」をオン"),
        P("カード会社のアプリも「利用通知」をオン"),
      ],
      windows: [P("通知はスマホ側で設定します。PCでは、ネットバンキングの「ログイン通知メール」をオン")],
      mac: [P("通知はスマホ側で設定します。PCでは、ネットバンキングの「ログイン通知メール」をオン")],
    },
    verified: null,
  },
  pay_check: {
    id: "pay_check",
    t: "直近の明細を1か月分さかのぼる",
    svc: "pay",
    time: "5分",
    lv: "かんたん",
    why: "",
    steps: {
      any: [
        P("銀行・PayPay・カードの明細を、直近30日分スクロールして見る", "数百円の少額決済が「テスト」として使われます"),
        P("知らない決済があれば、そのアプリの「問い合わせ」から即連絡", "カードは裏面の番号へ電話"),
        P("ネットバンキングのパスワードは、他と絶対に使い回さない"),
      ],
    },
    verified: null,
  },

  /* --- パスワード --- */
  pw_reuse: {
    id: "pw_reuse",
    t: "使い回しを、大事な3つから解消する",
    svc: "all",
    time: "15分",
    lv: "ふつう",
    why: "全部変える必要はありません。「メール」「Apple/Google」「お金」の3つを別々にするだけで、連鎖が止まります。",
    steps: {
      iphone: [
        P("まず Gmail / Apple ID のパスワードを、他と違うものに変える", "「文章」にすると覚えやすくて長い。例：犬は朝7時に散歩！"),
        P("変更時、iPhoneが提案する「強力なパスワード」を使ってよい", "設定 → パスワード（iOS 18以降は「パスワード」アプリ）に保存されます"),
        P("パスワードアプリ → 「セキュリティ」で、「使い回し」「漏洩」と警告されたものを順に変える", "上から3つで十分。残りは来週"),
      ],
      android: [
        P("まず Gmail / Googleアカウントのパスワードを、他と違うものに変える", "「文章」にすると覚えやすくて長い"),
        P("設定 → Google → （自動入力） → Googleパスワードマネージャー → パスワードチェックアップ", "機種により場所が少し違います。見つからなければ passwords.google.com"),
        P("「使い回し」「漏洩」と出たものを、上から3つ変える"),
      ],
      windows: [
        P("まず Gmail / Microsoft のパスワードを、他と違うものに変える"),
        P("ブラウザで passwords.google.com → 「パスワードチェックアップ」", "Edgeなら 設定 → プロファイル → パスワード → 「漏洩したパスワード」"),
        P("「使い回し」「漏洩」と出たものを、上から3つ変える"),
      ],
      mac: [
        P("まず Gmail / Apple ID のパスワードを、他と違うものに変える"),
        P("「パスワード」アプリ → セキュリティ", "macOS Sequoia以降。それ以前は Safari → 設定 → パスワード"),
        P("「使い回し」「漏洩」と出たものを、上から3つ変える"),
      ],
    },
    verified: null,
  },
  pw_manager: {
    id: "pw_manager",
    t: "パスワードを「覚えない」仕組みにする",
    svc: "all",
    time: "20分",
    lv: "ふつう",
    why: "紙やメモ帳は、なくす・見られる・古くなる。端末に最初から入っている管理機能で十分です。",
    steps: {
      iphone: [
        P("「パスワード」アプリ（iOS 18以降。なければ 設定 → パスワード）を開く", "Face IDで開く、自分専用の金庫"),
        P("設定 → 一般 → 自動入力とパスワード で「パスワードとパスキーの自動入力」をオン", "次からログイン画面で勝手に入ります"),
        P("メモ帳・紙のパスワードは、使うたびにアプリに移して、紙は捨てる", "一気にやらない。使った時に1つずつ"),
      ],
      android: [
        P("設定 → Google → 自動入力 → Googleでの自動入力 をオン", "Chrome・アプリのログインで勝手に入ります"),
        P("passwords.google.com で保存済みのものを確認"),
        P("メモ帳・紙のパスワードは、使うたびに移して、紙は捨てる"),
      ],
      windows: [
        P("Chrome か Edge の「パスワードを保存しますか？」に「保存」で答えていく", "これだけで管理アプリになります"),
        P("スマホと同じGoogle／Microsoftアカウントでブラウザにログインしておくと、スマホと共有される"),
        P("もっとしっかりやるなら、1Password・Bitwarden など専用アプリ", "月数百円。家族共有もできる"),
      ],
      mac: [
        P("「パスワード」アプリ（macOS Sequoia以降）を開く", "iPhoneと自動で同期"),
        P("Safari → 設定 → 自動入力 で「ユーザ名とパスワード」をオン"),
        P("メモ帳・紙のパスワードは、使うたびに移して、紙は捨てる"),
      ],
    },
    verified: null,
  },
  pw_check: {
    id: "pw_check",
    t: "自分のパスワードが漏れていないか調べる",
    svc: "all",
    time: "5分",
    lv: "かんたん",
    why: "「わからない」なら、端末に聞くのが早い。漏れたパスワードは端末が知っています。",
    steps: {
      iphone: [
        P("「パスワード」アプリ → 「セキュリティ」", "iOS 17以前は 設定 → パスワード → セキュリティに関する勧告"),
        P("「漏洩したデータに含まれています」と出たものから変える"),
      ],
      android: [
        P("設定 → Google → Googleパスワードマネージャー → パスワードチェックアップ", "見つからなければ passwords.google.com"),
        P("「漏洩」と出たものから変える"),
      ],
      windows: [P("passwords.google.com → パスワードチェックアップ", "Edgeは 設定 → プロファイル → パスワード"), P("「漏洩」と出たものから変える")],
      mac: [P("「パスワード」アプリ → セキュリティ"), P("「漏洩」と出たものから変える")],
    },
    verified: null,
  },
  account_inventory: {
    id: "account_inventory",
    t: "登録しっぱなしのサービスを棚卸しする",
    svc: "all",
    time: "20分",
    lv: "ふつう",
    why: "覚えていないサービスが、一番危ない。古いパスワードのまま、カードや住所を抱えています。",
    steps: {
      iphone: [
        P("「パスワード」アプリ を開き、保存されているサイト一覧を眺める", "これが「あなたが登録したものリスト」"),
        P("Gmail／メールで「ご登録ありがとうございます」「アカウント作成」を検索", "登録メールが全部出てきます"),
        P("もう使わないものは、サービスの設定 → 「退会」「アカウント削除」", "退会の場所が見つからなければ、サービス名＋退会 で検索"),
        P("退会できないものは、カード・住所を削除してパスワードだけ長いものに変える"),
      ],
      android: [
        P("passwords.google.com で、保存されているサイト一覧を眺める"),
        P("Gmailで「ご登録ありがとうございます」「アカウント作成」を検索"),
        P("もう使わないものは、設定 → 「退会」「アカウント削除」"),
        P("退会できないものは、カード・住所を削除してパスワードだけ変える"),
      ],
      windows: [
        P("passwords.google.com（または Edge のパスワード一覧）で、サイト一覧を眺める"),
        P("メールで「ご登録ありがとうございます」「アカウント作成」を検索"),
        P("もう使わないものは「退会」「アカウント削除」"),
        P("退会できないものは、カード・住所を削除してパスワードだけ変える"),
      ],
      mac: [
        P("「パスワード」アプリ で、サイト一覧を眺める"),
        P("メールで「ご登録ありがとうございます」「アカウント作成」を検索"),
        P("もう使わないものは「退会」「アカウント削除」"),
        P("退会できないものは、カード・住所を削除してパスワードだけ変える"),
      ],
    },
    verified: null,
  },

  /* --- 仕事 --- */
  work_ai: {
    id: "work_ai",
    t: "AIに貼っていい情報・ダメな情報の線を引く",
    svc: "work",
    time: "5分",
    lv: "かんたん",
    why: "いちばん起きやすい「うっかり」。顧客リストをそのままChatGPTに貼った、が実際の事故になっています。",
    steps: {
      any: [
        P("貼る前に3秒：「氏名・住所・電話・メール・顧客番号・社外秘」が含まれていないか見る", "1つでも含まれていたら、消してから"),
        P("含まれているなら、「Aさん」「X社」に置き換えてから貼る", "分析や要約は置き換えても成立します"),
        P("会社が契約しているAI（学習に使われない設定）かどうか、情報システム担当に確認", "個人契約のAIに業務データは貼らない"),
        P("迷ったら貼らない。貼らずに済む聞き方を考える", "「この形式の表を整える方法は？」と、データなしで聞ける"),
      ],
    },
    verified: null,
  },
  work_share: {
    id: "work_share",
    t: "「リンクを知っている全員」の共有をなくす",
    svc: "cloud",
    time: "10分",
    lv: "ふつう",
    why: "流出の多くは、攻撃ではなく「公開設定のミス」。社内のファイルが検索で見つかる、が現実に起きています。",
    steps: {
      iphone: [
        P("Google Driveアプリ → ファイルの「⋮」 → 共有 → 「一般的なアクセス」"),
        P("「リンクを知っている全員」になっていたら「制限付き」へ", "必要な人だけを個別に追加"),
        P("自分が作ったファイルで、社外に送ったものから順に見直す"),
      ],
      android: [P("Google Driveアプリ → 「⋮」 → 共有 → 「一般的なアクセス」"), P("「リンクを知っている全員」 → 「制限付き」へ")],
      windows: [
        P("Google Drive：ファイルを右クリック → 共有 → 一般的なアクセス を「制限付き」に"),
        P("OneDrive／SharePoint：ファイルを右クリック → 共有 → リンクの設定 を「特定のユーザー」に"),
        P("Google Drive の「共有アイテム」や OneDrive の「共有」から、自分が公開中のものを一覧できる"),
      ],
      mac: [
        P("Google Drive：ファイルを右クリック → 共有 → 一般的なアクセス を「制限付き」に"),
        P("OneDrive：共有 → リンクの設定 を「特定のユーザー」に"),
      ],
    },
    verified: null,
  },
  work_lock: {
    id: "work_lock",
    t: "仕事用PCの「置き忘れ」に備える",
    svc: "work",
    time: "5分",
    lv: "かんたん",
    why: "電車に忘れても、中身が読めなければ「紛失」で済みます。暗号化されていないと「流出」です。",
    steps: {
      windows: [
        P("設定 → プライバシーとセキュリティ → デバイスの暗号化 をオン", "「BitLocker」と表示される機種もあります。会社管理なら情報システムに確認"),
        P("設定 → アカウント → サインインオプション で、復帰時にサインインを「常に」"),
        P("離席時は Windowsキー＋L"),
      ],
      mac: [
        P("システム設定 → プライバシーとセキュリティ → FileVault をオン"),
        P("システム設定 → ロック画面 で、スリープ後にパスワードを要求を「すぐに」"),
        P("離席時は control＋command＋Q"),
      ],
      iphone: [
        P("設定 → Face IDとパスコード で、パスコードを6桁以上に", "iPhoneは標準で暗号化されています"),
        P("設定 → 自分の名前 → 探す → iPhoneを探す をオン", "なくした時に遠隔で消去できる"),
      ],
      android: [
        P("設定 → セキュリティ で、画面ロックをPINか指紋に", "Androidは標準で暗号化されています"),
        P("設定 → セキュリティ → デバイスを探す をオン"),
      ],
    },
    verified: null,
  },
  work_report: {
    id: "work_report",
    t: "「やってしまった」時の報告の順番",
    svc: "work",
    time: "読むだけ",
    lv: "かんたん",
    why: "隠すと、会社も本人も守れなくなります。報告が早いほど被害は小さく、処分も軽い。これは本当です。",
    steps: {
      any: [
        P("まず止める：送ってしまったメールの取り消し、共有リンクの停止、PCならネットワークから切断", "自分で直せる範囲を即やる"),
        P("直属の上司に、口頭か電話で先に伝える", "文章を考えている時間が一番もったいない"),
        P("情報システム／セキュリティ担当に連絡", "「いつ・何を・誰に・どの範囲」をメモして渡す"),
        P("相手先（送り先・顧客）への連絡は、会社の判断を待つ", "個人で謝りに行かない。二次被害になることがある"),
        P("自分を責める時間を、記録を残す時間に使う", "経緯を時系列で書いておくと、あとで必ず役に立つ"),
      ],
    },
    verified: null,
  },
  work_2fa: {
    id: "work_2fa",
    t: "仕事用アカウントの2段階認証を確認する",
    svc: "cloud",
    time: "5分",
    lv: "かんたん",
    why: "",
    steps: {
      any: [
        P("会社の Google Workspace／Microsoft 365 は、管理者が2段階認証を強制していることが多い", "自分の画面で「2段階認証：オン」になっているか見る"),
        P("Google：myaccount.google.com → セキュリティ → 2段階認証プロセス"),
        P("Microsoft：mysignins.microsoft.com → セキュリティ情報 で、認証アプリが登録されているか"),
        P("オフにできる状態なら、情報システム担当に「強制にしてほしい」と伝える"),
      ],
    },
    verified: null,
  },
};

export const CARD_LIST: Card[] = Object.values(CARDS);

/** 手順カード本文を最後に見直した月（verified が無いカードのフッターに出す） */
export const CARDS_REVISED = "2026年10月";

/* ---------------- 並び替え ---------------- */

export type PhaseKey = "today" | "week" | "inc";

export interface Plan {
  today: string[];
  week: string[];
  inc: string[];
}

export const PHASES: Record<PhaseKey, { t: string; lead: string; icon: string }> = {
  today: { t: "今日の15分", lead: "ここだけで、連鎖する被害の大半は止まります。", icon: "ph-alarm" },
  week: { t: "今週中に", lead: "落ち着いた時に、1日1枚ずつ。", icon: "ph-calendar-check" },
  inc: { t: "もしもの時に", lead: "今は読まなくていい。何か起きたら、ここを開く。", icon: "ph-first-aid-kit" },
};

/** 回答 → 3段階のカードID配列。同じカードが複数段に入ったら今日を優先して1枚にする */
export function buildPlan(a: Answers): Plan {
  const today: string[] = [];
  const week: string[] = [];
  const inc: string[] = [];
  const has = (s: Service) => a.svc.includes(s);

  const twofa = () => {
    if (has("apple")) today.push("apple_2fa");
    if (has("google")) today.push("google_2fa");
    if (has("line")) today.push("line_login");
    if (has("shop")) today.push("shop_2fa");
  };
  const devicesCheck = () => {
    if (has("google")) today.push("google_devices");
    if (has("apple")) today.push("apple_devices");
    if (has("line")) today.push("line_login");
    if (has("shop")) today.push("shop_orders");
    if (has("pay")) today.push("pay_check");
  };
  const pwChange = () => {
    if (has("google")) today.push("google_pw");
    if (has("apple")) today.push("apple_pw");
    if (has("line")) today.push("line_pw");
  };

  if (a.sit === "phish") {
    today.push("phish_triage", "phish_entered");
    twofa();
  } else if (a.sit === "breach") {
    today.push("breach_triage");
    if (a.pw === "reuse" || a.pw === "unknown") today.push("pw_reuse");
    twofa();
    if (has("pay")) today.push("pay_check");
  } else if (a.sit === "hijack") {
    today.push("hijack_general");
    pwChange();
    devicesCheck();
    twofa();
  } else {
    twofa();
    if (a.pw === "reuse") today.push("pw_reuse");
    if (a.pw === "unknown") today.push("pw_check");
    if (has("pay")) today.push("pay_notify");
  }
  if (a.role === "work") today.push("work_ai");

  /* 今週中に */
  if (has("google")) week.push("google_checkup");
  if (a.sit !== "hijack") {
    if (has("google")) week.push("google_devices");
    if (has("apple")) week.push("apple_devices");
  }
  if (has("pay") && a.sit !== "anx") week.push("pay_notify");
  if (a.pw === "memo" || a.pw === "reuse" || a.pw === "unknown") week.push("pw_manager");
  if (a.pw === "app") week.push("pw_check");
  week.push("account_inventory");
  if (a.role === "work") {
    if (has("cloud")) week.push("work_share", "work_2fa");
    week.push("work_lock");
  }

  /* もしもの時に（今日に入らなかった緊急系） */
  if (a.sit !== "phish") inc.push("phish_triage", "phish_entered");
  if (a.sit !== "breach") inc.push("breach_triage");
  if (a.sit !== "hijack") inc.push("hijack_general");
  if (a.role === "work") inc.push("work_report");

  const seen = new Set<string>();
  const uniq = (arr: string[]) =>
    arr.filter((x) => {
      if (seen.has(x)) return false;
      seen.add(x);
      return true;
    });
  return { today: uniq(today), week: uniq(week), inc: uniq(inc) };
}

/** カード群の所要時間（分）。「読むだけ」のような数字でないものは0 */
export function minutes(ids: string[]): number {
  return ids.reduce((n, id) => n + (parseInt(CARDS[id].time) || 0), 0);
}

/* ---------------- 前書き ---------------- */

export const SIT_TITLE: Record<Situation, string> = {
  anx: "安心のための対策書",
  phish: "不審メールへの対策書",
  breach: "流出通知への対策書",
  hijack: "乗っ取りからの復旧書",
};

/** 回答 → 前書きの段落。状況×パスワード管理の組み合わせからテンプレートで作る（AI不使用） */
export function preface(a: Answers, plan: Plan): string[] {
  const dev = a.dev.map((d) => DEVICE_NAME[d]).join("と");
  const svcs = a.svc.filter((s) => s !== "cloud").map((s) => LABEL[s]).join("、");
  const first: Record<Situation, string> = {
    anx: "今のあなたに事故は起きていません。だから今日やるのは「鍵をかける」作業だけ。",
    phish: "今いちばん大事なのは、そのメールに「触らないこと」。まず本物か偽物かを確かめる手順から。",
    breach: "通知が来た今、相手が持っているのは「あなたのメールアドレスと、たぶんパスワード」。同じ組み合わせを他で使えなくするのが最優先。",
    hijack: "焦ってアプリを消さないで。順番は「相手を追い出す → 入口を閉める」。10分で終わります。",
  };
  const pw: Record<PwStyle, string> = {
    reuse: "パスワードを使い回しているので、1つ漏れると他も連鎖します。全部変える必要はなく、メール・ID・お金の3つを分けるだけで止まります。",
    memo: "紙やメモ帳の管理は、今週「覚えない仕組み」に移します。端末に最初から入っている機能で十分です。",
    app: "管理アプリに任せているのは正解。あとは、アプリが「漏洩」と言ってくるものを見逃さないだけ。",
    unknown: "パスワードの状態がわからない時は、端末に聞くのが早い。漏れたものは端末が知っています。",
  };
  const out = [first[a.sit], `${dev}をお使いで、${svcs || "いくつかのサービス"}に登録。${pw[a.pw]}`];
  if (a.role === "work") {
    out.push("仕事で個人情報を扱うので、「自分が漏らす側にならない」カードも入れました。AIに貼る前の3秒ルールから。");
  }
  out.push(`今日の分は、合計 約${minutes(plan.today)}分。全部で ${plan.today.length + plan.week.length} 枚、やった順にチェックが入ります。`);
  return out;
}

/* ---------------- 共有URL（ハッシュ） ---------------- */

/** 回答 → `s=..&d=..&r=..&v=..&p=..`。進捗の localStorage キーにも使う */
export function encodeAnswers(a: Answers): string {
  return `s=${a.sit}&d=${a.dev.join(",")}&r=${a.role}&v=${a.svc.join(",")}&p=${a.pw}`;
}

/** ハッシュ → 回答。選択肢に無い値が1つでもあれば null（質問から始める） */
export function decodeAnswers(hash: string): Answers | null {
  const p = new URLSearchParams(hash.replace(/^#/, ""));
  const ok = (v: string | null, qid: keyof Answers) =>
    v != null && QUESTIONS.find((q) => q.id === qid)!.opts.some((o) => o.v === v);
  const dev = (p.get("d") || "").split(",").filter(Boolean);
  const svc = (p.get("v") || "").split(",").filter(Boolean);
  const sit = p.get("s");
  const role = p.get("r");
  const pw = p.get("p");
  if (
    !ok(sit, "sit") ||
    !dev.length ||
    !dev.every((d) => ok(d, "dev")) ||
    !ok(role, "role") ||
    !svc.every((s) => ok(s, "svc")) ||
    !ok(pw, "pw")
  ) {
    return null;
  }
  return { sit: sit as Situation, dev: dev as Device[], role: role as Role, svc: svc as Service[], pw: pw as PwStyle };
}
