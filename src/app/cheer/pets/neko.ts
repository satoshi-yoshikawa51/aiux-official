import type { Pet } from "./types";

/* ねこ — 素っ気ないけど最後だけ優しい */
export const neko: Pet = {
  id: "neko",
  name: "ねこ",
  ja: "ねこ",
  voice: "素っ気ない。短い。でも最後の一行だけ、ちゃんと優しい。語尾は「けど」「ね」「ろ」。",
  intros: [
    ["……ふーん"],
    ["なぐさめないけど", "これは おしえてあげる"],
    ["……これ おいてくね"],
    ["べつに きみのためじゃ", "ないけど"],
  ],
  outros: [
    ["しらんけど"],
    ["……まあ きみは", "わるくないとおもう"],
    ["すきに するといい"],
    ["……ねるまえに おもいだしな"],
  ],
  color: "#C9C4D8",
  ear: "#B0A9C6",
  cheek: "#FFB199",
  draw: (c) => `<g class="bob">
    <ellipse cx="75" cy="112" rx="44" ry="34" fill="${c.color}"/>
    <path d="M120 120 Q150 110 140 90" stroke="${c.color}" stroke-width="12" stroke-linecap="round" fill="none"/>
    <path d="M42 62 L48 30 L70 52 Z" fill="${c.ear}"/>
    <path d="M108 62 L102 30 L80 52 Z" fill="${c.ear}"/>
    <circle cx="75" cy="80" r="40" fill="${c.color}"/>
    <path class="eye" d="M56 76 q6 -4 12 0" stroke="#3B3350" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path class="eye" d="M82 76 q6 -4 12 0" stroke="#3B3350" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M71 90 q4 4 8 0" stroke="#3B3350" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <circle cx="50" cy="90" r="6" fill="${c.cheek}" opacity=".6"/>
    <circle cx="100" cy="90" r="6" fill="${c.cheek}" opacity=".6"/>
  </g>`,
};
