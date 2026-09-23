/* 犬（ペット）1匹ぶんの定義。1匹1ファイルで pets/ に置く。
   名言はそのまま見せる方針なので、犬ごとの性格づけ（口調）は持たない。
   動画は public/inugatari/dogs/ に置いた縦型ループ素材（9:16・5秒・無音）。 */
export interface Pet {
  id: string;
  /* 画面に出す犬種名 */
  name: string;
  /* 全画面背景に流すループ動画のパス */
  video: string;
  /* 動画の1フレーム目（読み込み中・動画非対応環境の代役） */
  poster: string;
}
