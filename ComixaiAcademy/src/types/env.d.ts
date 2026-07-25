/* Expoが生成する expo-env.d.ts は .gitignore 対象なので、
   クローン直後でも `npm run typecheck` が通るように同じ参照をここに置いておく。
   （require() でアセットを読む型と、Metro環境のグローバル型が入る） */
/// <reference types="expo/types" />
