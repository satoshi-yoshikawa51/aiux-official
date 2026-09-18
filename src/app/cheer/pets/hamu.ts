import type { Pet } from "./types";

/* ハムスター — 臆病で、いっしょにふるえてくれる */
export const hamu: Pet = {
  id: "hamu",
  name: "ハムスター",
  ja: "はむすたー",
  voice:
    "小さくて臆病。相手と一緒にふるえる。自分も怖いと正直に言う。語尾は「よ」「かも」。一人称は「ぼく」。",
  color: "#F4DDB5",
  ear: "#E8C48F",
  cheek: "#FFB199",
  draw: (c) => `<g class="bob">
    <ellipse cx="75" cy="100" rx="50" ry="46" fill="${c.color}"/>
    <circle cx="40" cy="58" r="12" fill="${c.ear}"/>
    <circle cx="110" cy="58" r="12" fill="${c.ear}"/>
    <circle class="eye" cx="60" cy="88" r="4.5" fill="#3B3350"/>
    <circle class="eye" cx="90" cy="88" r="4.5" fill="#3B3350"/>
    <ellipse cx="75" cy="100" rx="4" ry="3" fill="#C97F6C"/>
    <ellipse cx="45" cy="108" rx="12" ry="8" fill="${c.cheek}" opacity=".6"/>
    <ellipse cx="105" cy="108" rx="12" ry="8" fill="${c.cheek}" opacity=".6"/>
    <circle cx="62" cy="134" r="6" fill="${c.ear}"/>
    <circle cx="88" cy="134" r="6" fill="${c.ear}"/>
  </g>`,
};
