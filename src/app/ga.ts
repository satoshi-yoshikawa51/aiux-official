"use client";
/* ============================================================
   Googleアナリティクスのイベント送信。

   layout.tsx の <GoogleAnalytics> はページビューしか送らないので、
   「コースのどこで離脱したか」「何を検索されたか」といった行動は
   ここから明示的に送る。

   使い方は2通り:
     ①クライアントコンポーネントから track("course_start", {...})
     ②サーバーコンポーネントからは data-ga 属性（ga-clicks.tsx が拾う）
       例) <a href="/claude-app" data-ga="cta_click" data-ga-place="top">

   GAは個人情報を送ってはいけない規約なので、氏名・メール・問い合わせ
   本文のような入力値は絶対に載せないこと。サイト内検索の語句は
   site_search として扱う一般的な計測なので送っている。
   ============================================================ */
import { sendGAEvent } from "@next/third-parties/google";

export type GaParams = Record<string, string | number | boolean>;

export function track(name: string, params?: GaParams) {
  try {
    sendGAEvent("event", name, params ?? {});
  } catch {
    /* 計測の失敗で機能を止めない */
  }
}
