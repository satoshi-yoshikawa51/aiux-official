/* 犬一覧。新しい子を足すときは 1匹1ファイルで作ってここに並べる */
import { poodle } from "./poodle";
import { chihuahua } from "./chihuahua";
import { mameshiba } from "./mameshiba";
import { pomeranian } from "./pomeranian";
import { dachshund } from "./dachshund";
import { frenchbulldog } from "./frenchbulldog";

export type { Pet } from "./types";
export const PETS = [poodle, chihuahua, mameshiba, pomeranian, dachshund, frenchbulldog];
