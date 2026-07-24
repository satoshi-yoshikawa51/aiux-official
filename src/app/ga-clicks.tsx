"use client";
/* ============================================================
   data-ga 属性のついた要素のクリックをまとめて計測する。

   クリックをdocumentで1つだけ拾うので、計測したい箇所を
   クライアントコンポーネントに変換しなくてよい（サーバー
   コンポーネントのままdata-ga属性を足すだけで済む）。

     <a href="/claude-app" data-ga="cta_click" data-ga-place="top-banner">

   → event名 "cta_click"、パラメータ { place: "top-banner" } を送る。
   data-ga-xxx-yyy は xxx_yyy に変換される（GAのパラメータ名は
   ハイフンを使えないため）。
   ============================================================ */
import { useEffect } from "react";
import { track, type GaParams } from "./ga";

export function GaClicks() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const el = target.closest("[data-ga]");
      if (!el) return;
      const name = el.getAttribute("data-ga");
      if (!name) return;

      const params: GaParams = {};
      for (const attr of Array.from(el.attributes)) {
        if (!attr.name.startsWith("data-ga-")) continue;
        params[attr.name.slice("data-ga-".length).replace(/-/g, "_")] = attr.value;
      }
      track(name, params);
    };
    /* 遷移で止められないよう capture 側で拾う */
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
