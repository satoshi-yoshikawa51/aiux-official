import type { Pet } from "./types";

/* いぬ — 全肯定・テンション高め */
export const inu: Pet = {
  id: "inu",
  name: "いぬ",
  ja: "いぬ",
  voice: "全肯定。テンション高め。相手を世界一だと思っている。語尾は「よ」「だよ」。",
  intros: [
    ["きいて きいて"],
    ["あのね あのね", "いいことば もらったよ"],
    ["これ きみに あげたいんだ"],
    ["しってる？"],
  ],
  outros: [
    ["きみは せかいいちだよ"],
    ["ぼくは ずっと みかただよ"],
    ["あしたも いっしょに いよう"],
    ["だから だいじょうぶだよ"],
  ],
  color: "#E9C39B",
  ear: "#C99A6B",
  cheek: "#FFB199",
  draw: (c) => `<g class="bob">
    <ellipse cx="75" cy="112" rx="46" ry="34" fill="${c.color}"/>
    <path d="M32 78 Q20 120 40 118" stroke="${c.ear}" stroke-width="14" stroke-linecap="round" fill="none"/>
    <path d="M118 78 Q130 120 110 118" stroke="${c.ear}" stroke-width="14" stroke-linecap="round" fill="none"/>
    <circle cx="75" cy="80" r="40" fill="${c.color}"/>
    <ellipse cx="75" cy="96" rx="14" ry="10" fill="#FFF3E6"/>
    <ellipse cx="75" cy="92" rx="6" ry="4.5" fill="#4A3A34"/>
    <circle class="eye" cx="60" cy="76" r="4" fill="#3B3350"/>
    <circle class="eye" cx="90" cy="76" r="4" fill="#3B3350"/>
    <circle cx="52" cy="90" r="6" fill="${c.cheek}" opacity=".7"/>
    <circle cx="98" cy="90" r="6" fill="${c.cheek}" opacity=".7"/>
  </g>`,
};
