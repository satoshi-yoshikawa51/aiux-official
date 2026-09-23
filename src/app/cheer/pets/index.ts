/* 犬一覧。新しい子を足すときは 1匹1ファイルで作ってここに並べる */
import { poodle } from "./poodle";
import { chihuahua } from "./chihuahua";
import { mameshiba } from "./mameshiba";
import { pomeranian } from "./pomeranian";
import { dachshund } from "./dachshund";
import { frenchbulldog } from "./frenchbulldog";

export type { Pet } from "./types";
export const PETS = [poodle, chihuahua, mameshiba, pomeranian, dachshund, frenchbulldog];

/* 名言idから犬を1匹に決める（結果ページ・OGP用。同じidなら常に同じ子） */
export function dogFor(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 9973;
  return PETS[h % PETS.length];
}
