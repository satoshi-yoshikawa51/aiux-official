"use client";
/* ============================================================
   「AI新人くんに指示を出せ」— プロンプトエンジニアリング体験。
   指示の部品（誰に・形式・トーン・長さ）を選んで発注すると、
   AI新人くんが額面通りに実行する。指定しなかった項目は
   「いい感じ」に解釈されて事故る（そこが笑いどころ＝学び）。
   ============================================================ */
import React from "react";
import { Badge, Button, Card } from "../ds";
import { unlock } from "../zukan/store";
import { ZukanNote } from "../zukan/collection";

const TASK = {
  title: "明日の定例会議のリマインドを作らせよう",
  info: "明日10:00〜 / 第3会議室 / 資料の持参が必要",
};

type SlotKey = "who" | "format" | "tone" | "length";
const SLOTS: { key: SlotKey; label: string; options: string[] }[] = [
  { key: "who", label: "誰に送る？", options: ["上司に", "取引先に", "チームのみんなに"] },
  { key: "format", label: "形式は？", options: ["メールで", "箇条書きで", "チャットのノリで"] },
  { key: "tone", label: "トーンは？", options: ["きっちり敬語", "フレンドリー", "元気MAX"] },
  { key: "length", label: "長さは？", options: ["3行以内で", "しっかり丁寧に"] },
];

/* —— 指定しなかったときの「いい感じ」解釈（ランダム） —— */
const CHAOS_WHO = ["ひいおばあちゃん宛", "全世界のファンのみなさま宛", "幼稚園のみんな宛"];
const CHAOS_FORMAT = ["詩", "ラップ", "時代劇の口上"];
const CHAOS_TONE = ["武士語", "執事風", "ギャル語"];
const CHAOS_LENGTH = ["5,000字の大作", "俳句サイズ"];

interface Order {
  who: string | null;
  format: string | null;
  tone: string | null;
  length: string | null;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* 発注内容から新人くんの納品物を組み立てる */
function build(order: Order): { output: string; notes: string[]; score: number } {
  const notes: string[] = [];
  const who = order.who ?? pick(CHAOS_WHO);
  const format = order.format ?? pick(CHAOS_FORMAT);
  const tone = order.tone ?? pick(CHAOS_TONE);
  const length = order.length ?? pick(CHAOS_LENGTH);
  if (!order.who) notes.push(`宛先の指定がなかったので、${who}にしておきました！`);
  if (!order.format) notes.push(`形式の指定がなかったので、${format}にしてみました！`);
  if (!order.tone) notes.push(`トーンの指定がなかったので、${tone}でいい感じにしました！`);
  if (!order.length) notes.push(`長さの指定がなかったので、${length}になりました！`);

  /* 宛名 */
  const dear =
    who === "上司に" ? "部長" : who === "取引先に" ? "株式会社〇〇 御中" : who === "チームのみんなに" ? "チーム各位" : who.replace("宛", "");

  /* トーン別の語尾・挨拶 */
  const isChaosTone = !order.tone;
  const greet =
    tone === "きっちり敬語"
      ? "お世話になっております。"
      : tone === "フレンドリー"
        ? "おつかれさまです〜。"
        : tone === "元気MAX"
          ? "おつかれさまですっっ！！🔥"
          : tone === "武士語"
            ? "拙者より火急の知らせにござる。"
            : tone === "執事風"
              ? "ご主人様、僭越ながらご連絡を差し上げます。"
              : "やっほ〜！れんらくでっす💫";

  /* 本文（形式別） */
  let body = "";
  if (format === "メールで") {
    body = `${dear}\n\n${greet}\n明日の定例会議のご連絡です。\n\n・日時：明日 10:00〜\n・場所：第3会議室\n・持ち物：資料\n\n${tone === "元気MAX" ? "全力でお待ちしております！！💪" : tone === "きっちり敬語" ? "ご出席のほど、よろしくお願いいたします。" : "よろしくお願いします〜！"}`;
  } else if (format === "箇条書きで") {
    body = `${dear}${greet ? `（${greet.replace(/。$/, "")}）` : ""}\n\n■ 明日の定例会議\n・10:00 スタート\n・第3会議室\n・資料を忘れずに`;
  } else if (format === "チャットのノリで") {
    body = `${greet}\nあした10時から定例、第3会議室です！資料持ってきてくださいね〜🙌`;
  } else if (format === "詩") {
    body = `${dear}へ\n\n十時という名の約束が\n第三会議室で待っている\n資料を胸に抱きしめて\nわたしたちは明日、集うのだ`;
  } else if (format === "ラップ") {
    body = `Yo, ${dear}！ 聞いてくれこのライム\n明日の10時がミーティングタイム\n場所は第3会議室 それが定め\n資料忘れたら マジで敗北（Uh）`;
  } else {
    body = `とざい、とうざーい。${dear}に申し上げまする。明日十時、ところは第三会議室にて定例の寄り合いこれあり。おのおのがた、資料お忘れなきよう——。`;
  }

  /* 長さ補正 */
  if (length === "俳句サイズ") {
    body = "あす十時　第三会議室　資料もて";
  } else if (length === "5,000字の大作") {
    body += "\n\nさて、ここで会議というものの歴史を紐解きますと、古代ギリシャのアゴラにおいて——（以下4,800字省略）";
  }

  const score = (["who", "format", "tone", "length"] as SlotKey[]).filter((k) => order[k] != null).length * 25;
  return { output: body, notes, score };
}

function verdict(score: number): { title: string; comment: string } {
  if (score === 100) return { title: "名ディレクター🎬", comment: "完璧な指示。新人くんが一発で使えるものを納品しました。この「誰に・形式・トーン・長さ」こそ、プロンプトの基本4点セットです。" };
  if (score >= 75) return { title: "おしい上司👔", comment: "ほぼ伝わってます。ただ、指定しなかった1箇所を新人くんが「いい感じ」に解釈しました。AIの「いい感じ」は、あなたの「いい感じ」とは限りません。" };
  if (score >= 50) return { title: "ふんわり上司☁️", comment: "半分お任せになった結果、納品物にだいぶ個性が出ました。悪気はないんです、指示がなかっただけで。" };
  return { title: "「いい感じにやっといて」の人🎲", comment: "ほぼすべてを新人くんのセンスに委ねました。その結果がこれです。AIも新人も、指示がなければ想像で埋めるしかないのです。" };
}

export function ShinjinGame() {
  const [order, setOrder] = React.useState<Order>({ who: null, format: null, tone: null, length: null });
  const [delivered, setDelivered] = React.useState<ReturnType<typeof build> | null>(null);
  const [working, setWorking] = React.useState(false);

  /* 図鑑：隠し部屋の発見＋実績を記録 */
  React.useEffect(() => unlock("rooms", "shinjin"), []);
  React.useEffect(() => {
    if (delivered?.score === 100) unlock("shinjin", "perfect");
    if (delivered?.score === 0) unlock("shinjin", "marunage");
  }, [delivered]);

  const submit = () => {
    setWorking(true);
    setDelivered(null);
    setTimeout(() => {
      setDelivered(build(order));
      setWorking(false);
    }, 1100);
  };

  const v = delivered ? verdict(delivered.score) : null;
  const shareText = delivered
    ? `AI新人くんに指示を出したら、伝わり度${delivered.score}%で【${v!.title}】判定だった。\nあなたの指示、AIに伝わる自信ある？\n#今さら聞けないAI用語集`
    : "";
  const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent("https://comixai.dev/shinjin")}`;

  return (
    <div>
      <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: "18px 22px", borderBottom: "var(--bw-line) solid var(--ink-900)", background: "var(--paper-100)", display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 30 }}>🧑‍💼</span>
          <div>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15 }}>お題：{TASK.title}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>伝えるべき情報：{TASK.info}</div>
          </div>
        </div>

        {/* 指示ビルダー */}
        <div style={{ padding: "18px 22px 22px" }}>
          <div style={{ display: "grid", gap: 14 }}>
            {SLOTS.map((slot) => (
              <div key={slot.key}>
                <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 13.5, marginBottom: 7 }}>
                  {slot.label}
                  {order[slot.key] == null && <span style={{ fontFamily: "var(--font-hand)", fontWeight: 400, color: "var(--text-muted)", marginLeft: 8 }}>指定しないと…どうなるかな</span>}
                </div>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  {slot.options.map((opt) => {
                    const on = order[slot.key] === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setOrder((o) => ({ ...o, [slot.key]: on ? null : opt }))}
                        style={{
                          fontFamily: "var(--font-heading)",
                          fontWeight: 700,
                          fontSize: 13,
                          padding: "8px 14px",
                          borderRadius: "var(--radius-full)",
                          border: "var(--bw-line) solid var(--ink-900)",
                          background: on ? "var(--ink-900)" : "var(--paper-0)",
                          color: on ? "var(--paper-50)" : "var(--ink-900)",
                          cursor: "pointer",
                          boxShadow: on ? "none" : "var(--shadow-pop-sm)",
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <Button variant="primary" size="lg" onClick={submit} disabled={working} iconRight={<i className="ph-bold ph-paper-plane-tilt" />}>
              {working ? "新人くんが作成中…" : "これで頼む！"}
            </Button>
          </div>
        </div>
      </Card>

      {/* 納品物 */}
      {working && (
        <p style={{ textAlign: "center", fontFamily: "var(--font-hand)", fontSize: 15, color: "var(--text-muted)", marginTop: 18 }}>
          🤖「はいっ！やっておきます！」（カタカタカタ…）
        </p>
      )}
      {delivered && v && (
        <div className="game-in" style={{ marginTop: 22 }}>
          <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
            <div style={{ padding: "12px 18px", borderBottom: "var(--bw-line) solid var(--ink-900)", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 22 }}>🤖</span>
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 14 }}>できました！確認お願いします！</span>
              <Badge tone={delivered.score === 100 ? "yellow" : "red"} style={{ marginLeft: "auto" }}>
                伝わり度 {delivered.score}%
              </Badge>
            </div>
            <pre
              style={{
                margin: 0,
                padding: "18px 20px",
                fontFamily: "var(--font-body)",
                fontSize: 14,
                lineHeight: 1.9,
                whiteSpace: "pre-wrap",
                background: "var(--paper-50)",
              }}
            >
              {delivered.output}
            </pre>
            {delivered.notes.length > 0 && (
              <div style={{ padding: "12px 20px", borderTop: "var(--bw-line) solid var(--ink-900)", background: "var(--paper-100)" }}>
                {delivered.notes.map((n) => (
                  <div key={n} style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.9 }}>
                    ※ {n}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card variant="pop" padding={20} style={{ marginTop: 16, textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, letterSpacing: "0.14em", color: "var(--red-600)", fontWeight: 700, marginBottom: 6 }}>
              JUDGE — あなたの指示力
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 24, marginBottom: 8 }}>{v.title}</div>
            <p style={{ margin: "0 auto 16px", fontSize: 13.5, lineHeight: 1.9, color: "var(--text-body)", maxWidth: 480 }}>{v.comment}</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <a href={intent} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <Button variant="ink" size="md" iconRight={<i className="ph-bold ph-arrow-up-right" />}>
                  結果をXでシェア
                </Button>
              </a>
              <Button variant="secondary" size="md" onClick={submit} iconRight={<i className="ph-bold ph-arrows-clockwise" />}>
                同じ指示でもう一回
              </Button>
            </div>
            {delivered.score < 100 && (
              <p style={{ margin: "14px 0 0", fontFamily: "var(--font-hand)", fontSize: 13.5, color: "var(--text-muted)" }}>
                指定を増やして「これで頼む！」し直すと、伝わり度が上がります
              </p>
            )}
            <ZukanNote />
          </Card>
        </div>
      )}
    </div>
  );
}
