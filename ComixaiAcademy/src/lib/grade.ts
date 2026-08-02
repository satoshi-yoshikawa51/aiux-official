/* ============================================================
   プロンプトの採点。サイト側の /api/academy/grade に投げる。

   **アプリにAPIキーは置かない。** 鍵はサイト（Vercel）の環境変数にあり、
   費用も吉川持ち。だからアプリ側は「投げて待つ」だけで、
   お題の中身（システムプロンプト）も持たない。持たせると、
   そこを書き換えて鍵をタダ乗りされる。渡すのは exerciseId だけ。

   AIが使えないとき（鍵が無い・上限に達した・通信できない）は
   **AIなしの簡易採点に降格する**。学習は止めない。
   ============================================================ */

/* 本番はサイト本体。ローカルで別の口に向けたいときは
   EXPO_PUBLIC_ACADEMY_API に入れる（Expoは EXPO_PUBLIC_ 付きだけ埋め込む） */
const ENDPOINT =
  process.env.EXPO_PUBLIC_ACADEMY_API ?? 'https://comixai.dev/api/academy/grade';

/** 待ちすぎない。返らないなら簡易採点に落とす */
const TIMEOUT_MS = 20000;

export interface GradeResult {
  /** 実際にAIが書いた成果物 */
  output: string;
  score: number;
  good: string;
  improve: string;
  /** 満たせていない観点 */
  missing: string[];
  /** AIを使わずに出した結果か */
  offline: boolean;
}

/* ———————————————— AIなしの簡易採点 ————————————————
   「4点セット（役割・目的・条件・出力形式）が書けているか」を、
   言葉の有無だけで見る。AIの採点にはまるで及ばないが、
   何が足りないかの当たりは付くし、**遊びが止まらない**のが大事。 */

const MARKERS: { name: string; re: RegExp }[] = [
  { name: '役割', re: /あなたは|きみは|君は|として(振る舞|ふるま)|の専門家|のプロ|のベテラン/ },
  { name: '目的', re: /目的|ために|向けに|読み手|相手は|宛て/ },
  { name: '条件', re: /条件|字以内|字程度|字前後|文字|トーン|禁止|避け|使わない|前提/ },
  { name: '出力形式', re: /出力形式|箇条書き|表に|案出|案を|件名|見出し|番号|フォーマット/ },
];

function offlineGrade(prompt: string): GradeResult {
  const hit = MARKERS.filter((m) => m.re.test(prompt));
  const missing = MARKERS.filter((m) => !m.re.test(prompt)).map((m) => m.name);
  /* 長さも少しだけ見る。1行だけの指示は、何が書いてあっても弱い */
  const lengthBonus = prompt.length >= 60 ? 10 : prompt.length >= 30 ? 5 : 0;
  const score = Math.min(95, hit.length * 20 + lengthBonus);
  return {
    output: '',
    score,
    good:
      hit.length > 0
        ? `${hit.map((h) => h.name).join('・')}が書けている。`
        : 'まずは書いてみたところから。',
    improve:
      missing.length > 0
        ? `${missing[0]}を足すと、返ってくるものが変わる。`
        : '4点セットは揃っている。あとは具体の中身を濃くするだけだ。',
    missing,
    offline: true,
  };
}

export async function gradePrompt(exerciseId: string, prompt: string): Promise<GradeResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ exerciseId, prompt }),
      signal: ctrl.signal,
    });
    const data = (await res.json()) as Partial<GradeResult> & { fallback?: boolean };
    if (data.fallback || typeof data.score !== 'number') return offlineGrade(prompt);
    return {
      output: data.output ?? '',
      score: data.score,
      good: data.good ?? '',
      improve: data.improve ?? '',
      missing: data.missing ?? [],
      offline: false,
    };
  } catch {
    return offlineGrade(prompt);
  } finally {
    clearTimeout(timer);
  }
}
