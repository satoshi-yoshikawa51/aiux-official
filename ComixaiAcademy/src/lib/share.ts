/* ============================================================
   SNSへのシェア。節目でだけ出す。

   ▍「本当に投稿したか」は取れない
   OSの共有シートは、送り先アプリに渡した時点で「完了」を返す。
   書きかけでやめても分からない。Xの投稿を確認するにはAPI（有料）と
   本人のXログインが要るので、このアプリではやらない。

   だから**押しただけでPが入る**作りにしかできない。
   前提を変えて、**不正しても壊れない額**にしてある：
   1日1回まで+1P（ログインボーナスと同額）、初回だけ+3P。
   → store/progress.tsx の claimShareBonus

   ▍X専用ボタンにしない
   共有シートを出せば、X・LINE・Instagram・Threads・メールに1つの
   ボタンで流れる。日本ではLINEの拡散力も侮れないので、選ばせる。
   共有シートが無い環境（古いブラウザ）だけ、Xの投稿画面を直接開く。

   ▍効果はGA4で測る
   誰が押したかは測れないが、**リンクから来た人は数えられる**。
   `?from=academy` を付けてあるので、サイト側のGA4で見る。
   ============================================================ */
import { Platform, Share } from 'react-native';

/* ▍貼るURL。**受け皿のページができたら、ここだけ差し替える**
   いまはサイトのトップ。アカデミーの紹介ページを作ったらそちらへ */
export const SHARE_URL = 'https://comixai.dev/?from=academy';

const TAG = '#COMIXAIアカデミー';

export type ShareReason =
  | { kind: 'title'; name: string }
  | { kind: 'prize'; name: string; rarity: string }
  | { kind: 'exam'; course: string }
  | { kind: 'all-clear' };

/** 何を自慢するか。**結果を1行目に置く**（リンクだけの投稿は読まれない） */
export function shareText(reason: ShareReason, extra?: { done?: number; total?: number }): string {
  const head =
    reason.kind === 'title'
      ? `「${reason.name}」に昇格しました。`
      : reason.kind === 'prize'
        ? `${reason.rarity}の「${reason.name}」を当てました。`
        : reason.kind === 'exam'
          ? `「${reason.course}」の修了試験に合格しました。`
          : '全課程、修了しました。';
  const body =
    extra?.done && extra?.total
      ? `AIの使い方を、先生と一緒に${extra.done}/${extra.total}本ぶん。`
      : 'スマホでAIの使い方を学べるアプリです。';
  return `${head}\n${body}\n\n${TAG}\n${SHARE_URL}`;
}

/** 共有シートを開く。**開けたら true**（投稿したかどうかは分からない） */
export async function share(text: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    const nav = navigator as Navigator & {
      share?: (data: { text?: string; url?: string; title?: string }) => Promise<void>;
    };
    if (nav.share) {
      try {
        /* url は渡さない。**text の末尾に入れてある**ので、両方渡すと
           送り先によってはURLが2回出る */
        await nav.share({ text });
        return true;
      } catch {
        /* 閉じた・断られた。Pは出さない */
        return false;
      }
    }
    /* 共有シートの無い環境。Xの投稿画面を直接開く */
    window.open(
      `https://x.com/intent/post?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer',
    );
    return true;
  }

  const res = await Share.share({ message: text }).catch(() => null);
  return res?.action === Share.sharedAction;
}
