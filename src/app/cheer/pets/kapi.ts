import type { Pet } from "./types";

/* カピバラ — 何もしない。ただそばにいる */
export const kapi: Pet = {
  id: "kapi",
  name: "カピバラ",
  ja: "かぴばら",
  voice:
    "何もしない。ゆっくり。言葉が少なく、途中に「……」が入る。ただそばにいる。語尾は「ね」「よ」。",
  intros: [
    ["……"],
    ["……ねえ"],
    ["……きこえたことば", "おすそわけ"],
    ["……おゆに つかりながら", "きいてね"],
  ],
  outros: [
    ["……ゆっくりで いいよ"],
    ["きょうは もう やすもう"],
    ["……そばに いるね"],
    ["……ふう"],
  ],
  color: "#C8A47E",
  ear: "#A9845F",
  cheek: "#FFB199",
  draw: (c) => `<g class="bob">
    <ellipse cx="75" cy="112" rx="52" ry="32" fill="${c.color}"/>
    <rect x="38" y="52" width="74" height="62" rx="30" fill="${c.color}"/>
    <circle cx="48" cy="54" r="7" fill="${c.ear}"/>
    <circle cx="102" cy="54" r="7" fill="${c.ear}"/>
    <rect x="52" y="86" width="46" height="26" rx="13" fill="#B58F6A"/>
    <circle cx="64" cy="98" r="2.5" fill="#3B3350"/>
    <circle cx="86" cy="98" r="2.5" fill="#3B3350"/>
    <circle class="eye" cx="57" cy="76" r="3.5" fill="#3B3350"/>
    <circle class="eye" cx="93" cy="76" r="3.5" fill="#3B3350"/>
    <circle cx="47" cy="84" r="5" fill="${c.cheek}" opacity=".5"/>
    <circle cx="103" cy="84" r="5" fill="${c.cheek}" opacity=".5"/>
  </g>`,
};
