/* ============================================================
   致命エラーの受け皿。**黙って落ちる代わりに、何が起きたかを見せる。**

   ▍なぜ要るのか
   リリースビルド（TestFlight）ではJSの致命エラーで即クラッシュし、
   ログはどこにも見えない。実機で「3D表示に失敗→クラッシュ」が
   出たとき、原因の手がかりがゼロだった。エラーの正体を画面に出せば、
   スクショ1枚で調査できる。

   ▍2種類のエラーを両方拾う
   ・描画中のエラー（Reactのrender内） … ErrorBoundary が拾う
   ・それ以外の致命エラー（イベント・非同期） … ErrorUtils の
     グローバルハンドラで拾って、同じ画面に流す

   公開後もこのままでよい——ユーザーにとっても、無言で落ちるより
   「エラーが起きた・再起動してほしい」が出るほうがましで、
   問い合わせにスクショを添えてもらえる。
   ============================================================ */
import React from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';

import { C, FONT, S } from '@/theme';

type Listener = (message: string) => void;
let notify: Listener | null = null;

/* グローバルハンドラは1回だけ仕掛ける。
   RNの ErrorUtils は型に無いので、最低限の形だけ自前で書く */
declare const ErrorUtils:
  | { getGlobalHandler(): (e: unknown, isFatal?: boolean) => void; setGlobalHandler(h: (e: unknown, isFatal?: boolean) => void): void }
  | undefined;

let installed = false;
function install() {
  /* ▍**Webには仕掛けない。** Webの ErrorUtils は「エラー係」ではなく
     分割チャンクの読み込みの一部。import() は「まず同期requireを試す→
     Requiring unknown module を**わざと投げる**→catch側でチャンクを取りに
     いく」という作りで、その throw が reportFatalError（既定＝投げ直すだけ）
     を経由してくる。ここで幕を出して握りつぶすと、**正常な読み込みが
     全部クラッシュ画面になる**（トークナイザーを温める起動4秒後に必ず出た）。
     Webで白画面になる描画中のエラーは ErrorBoundary が拾うので、それで足りる */
  if (installed || Platform.OS === 'web' || typeof ErrorUtils === 'undefined') return;
  installed = true;
  const prev = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((e, isFatal) => {
    if (isFatal && notify) {
      const err = e as Error;
      notify(`${err?.name ?? 'Error'}: ${err?.message ?? String(e)}\n\n${(err?.stack ?? '').slice(0, 1200)}`);
      /* 画面は出したので、既定の処理（＝即クラッシュ）には渡さない。
         非致命はいままでどおり素通し */
      return;
    }
    prev(e, isFatal);
  });
}

function Curtain({ message }: { message: string }) {
  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: C.ink900,
        padding: S.xl,
        paddingTop: 80,
        gap: S.md,
        zIndex: 999,
      }}>
      <Text style={{ fontFamily: FONT.display, fontSize: 22, color: C.paper50 }}>
        ごめんなさい、エラーが起きました
      </Text>
      <Text style={{ fontFamily: FONT.body, fontSize: 13, lineHeight: 21, color: C.paper100 }}>
        アプリを一度閉じて、開き直してください。学習の記録は端末に残っています。
        この画面のスクリーンショットを送ってもらえると、直すのが早くなります。
      </Text>
      <ScrollView
        style={{
          backgroundColor: C.ink800,
          borderRadius: 8,
          padding: S.md,
          maxHeight: 420,
        }}>
        <Text style={{ fontFamily: FONT.mono, fontSize: 10.5, lineHeight: 16, color: C.paper200 }}>
          {message}
        </Text>
      </ScrollView>
    </View>
  );
}

interface State {
  message: string | null;
}

/** ルート（app/_layout.tsx）に1枚だけ置く */
export class CrashScreen extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { message: null };

  static getDerivedStateFromError(e: unknown): State {
    const err = e as Error;
    return { message: `${err?.name ?? 'Error'}: ${err?.message ?? String(e)}\n\n${(err?.stack ?? '').slice(0, 1200)}` };
  }

  componentDidMount() {
    install();
    notify = (message) => this.setState({ message });
  }

  componentWillUnmount() {
    if (notify) notify = null;
  }

  render() {
    return (
      <>
        {this.state.message === null ? this.props.children : null}
        {this.state.message !== null ? <Curtain message={this.state.message} /> : null}
      </>
    );
  }
}
