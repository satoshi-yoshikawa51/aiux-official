/* ペット一覧。新しい子を足すときは 1匹1ファイルで作ってここに並べる */
import { inu } from "./inu";
import { neko } from "./neko";
import { hamu } from "./hamu";
import { kapi } from "./kapi";

export type { Pet } from "./types";
export const PETS = [inu, neko, hamu, kapi];
