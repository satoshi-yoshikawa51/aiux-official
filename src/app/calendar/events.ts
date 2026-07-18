/* ============================================================
   AIイベントカレンダー（/calendar）のデータ。
   ・掲載ルール：公式発表済み＋公式サイトURLがあるイベントのみ。
     日付が未確認のイベントは載せない（誤った日程は載せないより悪い）。
   ・イベントを足すときは EVENTS に1件追加（開催順は自動ソート）。
   ・開催済みかどうかはビルド時に日付から自動判定される
     （ニュース自動更新の毎日のデプロイで再判定される）。
   ============================================================ */

export type EventRegion = "world" | "japan";

export interface AiEvent {
  id: string;
  title: string;
  /** 開始日 YYYY-MM-DD。日程未定なら省略して tba を設定 */
  start?: string;
  /** 終了日（1日開催なら省略） */
  end?: string;
  /** 日程未定フラグ。trueなら dateNote を表示 */
  tba?: boolean;
  /** 日程の補足（「日程未定・2026年内」など） */
  dateNote?: string;
  region: EventRegion;
  /** 会場（都市名・施設名） */
  venue: string;
  /** 公式サイトURL */
  url: string;
  /** 一言説明（現場目線で） */
  desc: string;
  /** 参加無料など補足バッジ */
  note?: string;
}

export const EVENTS: AiEvent[] = [
  /* ═══ 開催予定（公式発表済みのみ） ═══ */
  {
    id: "next-tokyo-2026",
    title: "Google Cloud Next Tokyo '26",
    start: "2026-07-30",
    end: "2026-07-31",
    region: "japan",
    venue: "東京ビッグサイト",
    url: "https://www.googlecloudevents.com/next-tokyo/",
    desc: "GeminiやエージェントAIの企業活用が主役の、Google Cloud最大級の国内イベント。事例セッションが濃い。",
    note: "参加無料（事前登録制）",
  },
  {
    id: "ai-hakurankai-summer-2026",
    title: "AI博覧会 Summer 2026",
    start: "2026-08-27",
    region: "japan",
    venue: "新宿住友ビル 三角広場",
    url: "https://aismiley.co.jp/ai_hakurankai/",
    desc: "国内のAI製品・サービスが一堂に集まる展示会。導入検討の情報収集に向く、現場寄りのイベント。",
    note: "入場無料（事前登録制）",
  },
  {
    id: "meta-connect-2026",
    title: "Meta Connect 2026",
    start: "2026-09-23",
    end: "2026-09-24",
    region: "world",
    venue: "米・メンロパーク（Meta本社）",
    url: "https://www.meta.com/connect/",
    desc: "MetaのAI・スマートグラス・VRの年次発表会。AIデバイスの「次」が見える場として注目度上昇中。",
    note: "基調講演はオンライン視聴可",
  },
  {
    id: "openai-devday-2026",
    title: "OpenAI DevDay 2026",
    start: "2026-09-29",
    region: "world",
    venue: "米・サンフランシスコ（Fort Mason）",
    url: "https://devday.openai.com/",
    desc: "OpenAIの年次開発者イベント。新モデル・新APIの発表が世界のAIニュースを一週間支配する日。",
    note: "基調講演はオンライン視聴可",
  },
  {
    id: "ceatec-2026",
    title: "CEATEC 2026",
    start: "2026-10-13",
    end: "2026-10-16",
    region: "japan",
    venue: "幕張メッセ",
    url: "https://www.ceatec.com/",
    desc: "日本最大級のテック総合展。近年はAI・データ活用が主要テーマで、大手からスタートアップまで揃う。",
    note: "入場無料（全来場者登録制）",
  },
  {
    id: "github-universe-2026",
    title: "GitHub Universe 2026",
    start: "2026-10-28",
    end: "2026-10-29",
    region: "world",
    venue: "米・サンフランシスコ（Fort Mason）",
    url: "https://githubuniverse.com/",
    desc: "GitHubの年次イベント。今年のテーマは「エージェント時代」。Copilot系の新発表はここから出る。",
    note: "オンライン視聴可",
  },
  {
    id: "nextech-week-2026-autumn",
    title: "NexTech Week 2026【秋】（AI・人工知能EXPO）",
    start: "2026-11-11",
    end: "2026-11-13",
    region: "japan",
    venue: "幕張メッセ",
    url: "https://www.nextech-week.jp/autumn/ja-jp.html",
    desc: "AI・人工知能EXPOを中心に、フィジカルAI・ヒューマノイドまで7展同時開催。商談・比較検討の定番展示会。",
    note: "入場無料（事前登録制）",
  },
  {
    id: "ms-ignite-2026",
    title: "Microsoft Ignite 2026",
    start: "2026-11-17",
    end: "2026-11-20",
    region: "world",
    venue: "米・サンフランシスコ（Moscone Center）",
    url: "https://ignite.microsoft.com/",
    desc: "Microsoftの年次テックイベント。Copilot・Azure AIの企業向け新発表が集中する4日間。",
    note: "オンライン参加可",
  },
  {
    id: "aws-reinvent-2026",
    title: "AWS re:Invent 2026",
    start: "2026-11-30",
    end: "2026-12-04",
    region: "world",
    venue: "米・ラスベガス",
    url: "https://aws.amazon.com/events/reinvent/",
    desc: "世界最大級のクラウドイベント。生成AI・機械学習のセッションだけで数百本という物量の祭典。",
  },
  {
    id: "ces-2027",
    title: "CES 2027",
    start: "2027-01-06",
    end: "2027-01-09",
    region: "world",
    venue: "米・ラスベガス",
    url: "https://www.ces.tech/",
    desc: "年始の世界最大テック見本市。AI搭載デバイス・フィジカルAIの「今年のトレンド」が一望できる。",
  },
  {
    id: "nvidia-gtc-2027",
    title: "NVIDIA GTC 2027",
    start: "2027-03-15",
    end: "2027-03-18",
    region: "world",
    venue: "米・サンノゼ",
    url: "https://www.nvidia.com/gtc/",
    desc: "AIインフラの総本山NVIDIAの年次カンファレンス。ジェンスン・フアンの基調講演は業界の羅針盤。",
    note: "基調講演はオンライン視聴可",
  },
  {
    id: "openai-devday-exchange-tokyo",
    title: "OpenAI DevDay Exchange Tokyo",
    tba: true,
    dateNote: "日程未定（2026年内・東京開催が発表済み）",
    region: "japan",
    venue: "東京（詳細未定）",
    url: "https://devday.openai.com/",
    desc: "DevDayの世界巡回版が東京に。国内でOpenAIの開発者イベントに参加できる貴重な機会になりそう。",
  },

  /* ═══ 開催済み（2026年アーカイブ） ═══ */
  {
    id: "ai-hakurankai-osaka-2026",
    title: "AI博覧会 Osaka 2026",
    start: "2026-01-21",
    end: "2026-01-22",
    region: "japan",
    venue: "マイドームおおさか",
    url: "https://aismiley.co.jp/ai_hakurankai/",
    desc: "関西圏最大級のAI展示会。西日本のAI導入熱の高まりを感じるイベント。",
  },
  {
    id: "nvidia-gtc-2026",
    title: "NVIDIA GTC 2026",
    start: "2026-03-16",
    end: "2026-03-19",
    region: "world",
    venue: "米・サンノゼ",
    url: "https://www.nvidia.com/gtc/",
    desc: "3万人が集結。フィジカルAI・AIファクトリー・エージェントが主題だった2026年版。",
  },
  {
    id: "ai-hakurankai-spring-2026",
    title: "AI博覧会 Spring 2026",
    start: "2026-04-07",
    end: "2026-04-08",
    region: "japan",
    venue: "東京国際フォーラム ホールE",
    url: "https://aismiley.co.jp/ai_hakurankai/",
    desc: "AI製品200点以上が集結。フィジカルAI・ロボットゾーンが新設された回。",
  },
];

export const EVENTS_UPDATED = "2026-07-18";

/** JSTの「今日」（YYYY-MM-DD） */
export function todayJst(): string {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

/** 開催済みか（終了日または開始日が今日より前） */
export function isPast(e: AiEvent, today: string = todayJst()): boolean {
  if (e.tba || !e.start) return false;
  return (e.end ?? e.start) < today;
}

/** 表示用の日付ラベル（例：7/30(木) 〜 7/31(金)） */
export function dateLabel(e: AiEvent): string {
  if (e.tba || !e.start) return e.dateNote ?? "日程未定";
  /* サーバーのタイムゾーンに依存しないよう、UTCとして解釈してUTC系APIで読む
     （YYYY-MM-DD自体がJSTのカレンダー日付なので、これで日付・曜日が正しく出る） */
  const fmt = (s: string) => {
    const d = new Date(s + "T00:00:00Z");
    const wd = "日月火水木金土"[d.getUTCDay()];
    return `${d.getUTCMonth() + 1}/${d.getUTCDate()}(${wd})`;
  };
  const year = e.start.slice(0, 4);
  const base = e.end && e.end !== e.start ? `${fmt(e.start)}〜${fmt(e.end)}` : fmt(e.start);
  return `${year}年 ${base}`;
}
