/* ============================================================
   おまけ（→ src/data/extras/）のデータが**解ける形になっているか**を確かめる。

   ▍なぜ要るか
   型チェックは「cost が数字か」までしか見ない。**残さなければいけない行の
   合計が予算を超えている**——つまりどう頑張っても解けない問題——は、
   tsc も expo export も素通りする。実際、最初に書いた3本の「削る」は
   全部これで、遊んでみるまで気づかなかった（残す行の合計50に対して予算40）。

   遊べば分かるが、20本を毎回手で遊ぶのは現実的ではないので、
   **解の存在だけ機械に確かめさせる**。

   使い方:
     node tools/check-extras.mjs

   ▍データのTSを直接読んでいる
   extras の3ファイルは型以外を import していないので、Node の
   --experimental-strip-types でそのまま読める（画像の require が入ると
   読めなくなる。**このファイル群に画像を持ち込まないこと**）。
   ============================================================ */
import { STAGE_EXTRAS } from '../src/data/extras/stages.ts';
import { AVATAR_EXTRAS } from '../src/data/extras/avatars.ts';
import { SR_EXTRAS } from '../src/data/extras/sr.ts';

const ALL = [...STAGE_EXTRAS, ...AVATAR_EXTRAS, ...SR_EXTRAS];
const errors = [];
const warn = [];
const bad = (id, msg) => errors.push(`${id}: ${msg}`);

/* 景品の一覧。data/gacha.ts と data/avatars.ts は画像を require しているので
   直接は読めない。**ここは手で写す**（食い違ったら下の突き合わせで落ちる） */
const PRIZES = [
  'sakura', 'rooftop-sunset', 'neon-rain', 'office-night', 'beach-dawn',
  'festival-night', 'cabin-fire',
  'datacenter', 'above-clouds', 'gold-ink',
  'senpai', 'otenba', 'kanroku', 'neko',
  'ottori-sr', 'nekketsu-sr', 'senpai-sr', 'otenba-sr', 'kanroku-sr', 'neko-sr',
];

/* ---------- 共通 ---------- */
const seen = new Set();
for (const e of ALL) {
  if (seen.has(e.prizeId)) bad(e.prizeId, '同じ prizeId が2本ある');
  seen.add(e.prizeId);
  if (!e.title || !e.point) bad(e.prizeId, 'title か point が空');
  if (!e.say?.length) bad(e.prizeId, 'say が空');
  if (!e.game.takeaway) warn.push(`${e.prizeId}: takeaway（おさらい）が無い`);
}
for (const id of PRIZES) if (!seen.has(id)) bad(id, 'この景品のおまけが無い');
for (const id of seen) if (!PRIZES.includes(id)) bad(id, '景品に無い prizeId');

/* ---------- ゲームごとの「解けるか」 ---------- */
for (const { prizeId: id, game: g } of ALL) {
  switch (g.kind) {
    case 'trim': {
      /* ▍残す行の合計 ≤ 予算 < 全部の合計
         左が破れると解けない。右が破れると、何も削らずに通ってしまう */
      const keep = g.lines.filter((l) => l.keep).reduce((n, l) => n + l.cost, 0);
      const all = g.lines.reduce((n, l) => n + l.cost, 0);
      if (keep > g.budget) bad(id, `解けない（残す行の合計 ${keep} > 予算 ${g.budget}）`);
      if (all <= g.budget) bad(id, `最初から収まっている（全部で ${all} ≤ 予算 ${g.budget}）`);
      if (g.lines.some((l) => !l.why)) bad(id, 'why の無い行がある');
      if (!g.lines.some((l) => l.keep)) bad(id, '残す行（keep）が1つも無い');
      break;
    }
    case 'interview': {
      const ok = g.questions.filter((q) => q.ok).length;
      if (ok === 0) bad(id, '効く質問（ok）が無い');
      if (ok > g.turns) bad(id, `解けない（効く質問 ${ok} > 聞ける回数 ${g.turns}）`);
      if (ok === g.questions.length) bad(id, '全部が効く質問なので、選ぶ意味が無い');
      if (g.questions.some((q) => q.ok && !q.got)) warn.push(`${id}: got の無い効く質問がある`);
      if (g.questions.some((q) => !q.ok && !q.why)) bad(id, 'why の無い外れ質問がある');
      break;
    }
    case 'judge': {
      g.rounds.forEach((r, i) => {
        const at = `${i + 1}問目`;
        if (!!r.a.ok === !!r.b.ok) bad(id, `${at}: 正解がちょうど1つになっていない`);
        const ok = r.reasons.filter((x) => x.ok).length;
        if (ok !== 1) bad(id, `${at}: 理由の正解が ${ok} 個（1個にする）`);
        if (r.reasons.some((x) => !x.why)) bad(id, `${at}: why の無い理由がある`);
        if (!r.wrongPick) bad(id, `${at}: wrongPick が無い`);
      });
      break;
    }
    case 'redline': {
      const need = g.lines.filter((l) => l.fix).length;
      if (need === 0) bad(id, '直す行が無い');
      g.lines.forEach((l, i) => {
        if (!l.fix) return;
        const ok = l.fix.choices.filter((c) => c.ok).length;
        if (ok !== 1) bad(id, `${i + 1}行目: 直し方の正解が ${ok} 個（1個にする）`);
      });
      break;
    }
    case 'fit': {
      const need = g.items.filter((it) => it.needed).reduce((n, it) => n + it.cost, 0);
      if (need > g.capacity) bad(id, `解けない（要るものの合計 ${need} > 机の広さ ${g.capacity}）`);
      if (!g.items.some((it) => !it.needed)) bad(id, '要らないものが無いので、選ぶ意味が無い');
      break;
    }
    case 'sort': {
      const r = g.items.filter((x) => x.right).length;
      if (r === 0 || r === g.items.length) bad(id, '片側だけの札しか無い');
      if (g.items.some((x) => !x.why)) bad(id, 'why の無い札がある');
      break;
    }
    case 'find': {
      const b2 = g.lines.filter((l) => l.bad).length;
      if (b2 === 0) bad(id, '危ない行が無い');
      if (b2 === g.lines.length) bad(id, '全部が危ない行になっている');
      if (g.lines.some((l) => l.bad && !l.why)) bad(id, 'why の無い危ない行がある');
      break;
    }
    case 'build': {
      g.slots.forEach((s, i) => {
        const ok = s.options.filter((o) => o.ok).length;
        if (ok !== 1) bad(id, `${i + 1}軸目「${s.label}」: 正解が ${ok} 個（1個にする）`);
        if (s.options.some((o) => !o.ok && !o.why)) bad(id, `${i + 1}軸目: why の無い外れ札がある`);
      });
      break;
    }
    case 'order': {
      if (g.steps.length < 3) bad(id, '手順が少なすぎる');
      if (g.steps.some((s) => !s.why || !s.tooEarly)) bad(id, 'why か tooEarly が無い手順がある');
      break;
    }
    default:
      break;
  }
}

const kinds = {};
for (const e of ALL) kinds[e.game.kind] = (kinds[e.game.kind] ?? 0) + 1;
console.log(`おまけ ${ALL.length}本 ／ 景品 ${PRIZES.length}件`);
console.log('内訳:', Object.entries(kinds).map(([k, n]) => `${k}×${n}`).join(' '));
for (const w of warn) console.log('・気になる:', w);
if (errors.length) {
  console.error(`\n${errors.length}件おかしい:`);
  for (const e of errors) console.error(' ✗', e);
  process.exit(1);
}
console.log('\n全部通った。');
