/* ============================================================
   本文の中の用語を、押せるようにする。

   ▍なぜ要るのか
   「トークン」「RAG」「プロンプトインジェクション」は初出の回で説明して
   いるが、**あとの回で出てきたときに戻る手段が無かった**。読み飛ばした人と、
   順番どおりに進まなかった人がそこで置いていかれる。

   ▍リンクは「その本文の中で最初の1回だけ」
   同じ語が3回出る本文で3回とも下線が引かれると、本文が下線だらけになって
   かえって読めない。**知らせたいのは「ここは押せる」という事実**なので、
   1回出ていれば足りる。

   ▍長い語から当てる
   「AIエージェント」と「エージェント」のように片方がもう片方を含むものが
   あるので、短いほうから当てると長いほうが二度と出てこない。
   `TERMS_BY_LENGTH`（data/terms.ts）が長い順に並べてある。

   ▍見た目は下線ではなく「うすい下敷き＋点線」
   マンガの紙に青い下線を引くとWebのリンクに見えてしまう。地の色を少し
   変えて、下に点線を敷く。押せることは伝わるが、読みの流れは切らない。

   ▍シートは根元に1枚だけ持つ
   本文のあちこちに Modal を置くと、そのぶん窓が増える。開く合図だけを
   Context で配って、描くのは `TermSheetProvider`（app/_layout.tsx）。
   ============================================================ */
import React from 'react';
import { Linking, Modal, Platform, Pressable, StyleProp, Text, TextStyle, View } from 'react-native';

import { Icon } from '@/components/icons';
import { Button, Panel, Row, Tap } from '@/components/ui';
import { TERMS_BY_LENGTH, termUrl, type Term } from '@/data/terms';
import { BW, C, F, R, S, T } from '@/theme';

/* ———————————————— シート ———————————————— */

const TermCtx = React.createContext<(t: Term) => void>(() => {});

/** 本文から用語シートを開く。Provider の外では何も起きない */
export const useTermSheet = () => React.useContext(TermCtx);

export function TermSheetProvider({ children }: { children: React.ReactNode }) {
  const [term, setTerm] = React.useState<Term | null>(null);
  const open = React.useCallback((t: Term) => setTerm(t), []);
  const url = term ? termUrl(term) : null;

  return (
    <TermCtx.Provider value={open}>
      {children}
      {term ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setTerm(null)}>
          {/* 外側を押しても閉じる。読むだけのつもりで開いた人の逃げ道 */}
          <Pressable
            onPress={() => setTerm(null)}
            style={{
              flex: 1,
              backgroundColor: 'rgba(20,17,15,0.55)',
              justifyContent: 'center',
              padding: S.lg,
            }}>
            <Pressable onPress={() => {}}>
              <Panel contentStyle={{ gap: S.sm, padding: S.lg }}>
                <Row gap={8}>
                  <Icon name="bulb" size={22} color={T.accent} />
                  <Text style={[F.h1, { flex: 1 }]}>{term.title ?? term.word}</Text>
                  <Tap onPress={() => setTerm(null)} sparks={false} hitSlop={12}>
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: R.full,
                        borderWidth: BW.line,
                        borderColor: T.border,
                        backgroundColor: T.sunk,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <Icon name="close" size={13} color={T.text} />
                    </View>
                  </Tap>
                </Row>
                <Text style={F.body}>{term.body}</Text>
                {/* 詳しい話はサイトの用語集に置いてある。ここに全文を持ってくると
                    レッスン本文と用語集の二重管理になる */}
                {url ? (
                  <Button
                    label="用語集でくわしく"
                    variant="secondary"
                    size="sm"
                    onPress={() => {
                      Linking.openURL(url).catch(() => {
                        /* ブラウザが開けなくても、上の説明で足りている */
                      });
                    }}
                    style={{ alignSelf: 'flex-start' }}
                  />
                ) : null}
              </Panel>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </TermCtx.Provider>
  );
}

/* ———————————————— 本文 ———————————————— */

interface Hit {
  start: number;
  end: number;
  term: Term;
}

/** その本文の中で最初に出てくる用語を拾う。重なったものは捨てる */
function findTerms(text: string): Hit[] {
  const hits: Hit[] = [];
  for (const term of TERMS_BY_LENGTH) {
    for (const word of [term.word, ...(term.also ?? [])]) {
      const i = text.indexOf(word);
      if (i < 0) continue;
      const end = i + word.length;
      /* 長い語が先に取っているところには重ねない */
      if (hits.some((h) => i < h.end && end > h.start)) continue;
      hits.push({ start: i, end, term });
      break;
    }
  }
  return hits.sort((a, b) => a.start - b.start);
}

/**
 * 本文。中に用語があれば押せるようにする。
 * 使い方は素の `<Text>` と同じで、`F.body` などをそのまま渡せる。
 */
export function TermText({
  children,
  style,
  numberOfLines,
}: {
  children: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  const open = useTermSheet();
  const hits = React.useMemo(() => findTerms(children), [children]);

  if (hits.length === 0) {
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {children}
      </Text>
    );
  }

  const parts: React.ReactNode[] = [];
  let at = 0;
  hits.forEach((h, i) => {
    if (h.start > at) parts.push(children.slice(at, h.start));
    parts.push(
      <Text
        key={`t${i}`}
        onPress={() => open(h.term)}
        /* Webでは指の形が変わらないと押せると分からない */
        style={[
          {
            backgroundColor: T.accentSoft,
            borderBottomWidth: 1,
            borderBottomColor: T.accent,
            color: T.text,
          },
          Platform.OS === 'web' ? ({ cursor: 'pointer' } as TextStyle) : null,
        ]}>
        {children.slice(h.start, h.end)}
      </Text>,
    );
    at = h.end;
  });
  if (at < children.length) parts.push(children.slice(at));

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts}
    </Text>
  );
}

/** 「押すと説明が出ます」の案内。用語のあるカードの下に一度だけ出す */
export function TermHint() {
  return (
    <Row gap={6}>
      <Icon name="bulb" size={13} color={T.muted} />
      <Text style={[F.tiny, { flex: 1, color: C.ink500 }]}>
        色のついた言葉を押すと、その場で説明が出ます
      </Text>
    </Row>
  );
}

/** その本文に用語が含まれているか（案内を出すかの判定に使う） */
export function hasTerm(text: string | undefined): boolean {
  return !!text && findTerms(text).length > 0;
}
