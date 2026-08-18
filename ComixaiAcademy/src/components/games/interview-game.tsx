/* ============================================================
   聞き出す。ふわっとした依頼を、限られた回数の質問で仕様に落とす。
   SRのおまけ用（→ data/extras/）。

   ▍AIに渡す前の仕事を扱う、唯一の回
   指示がうまく書けないのは書き方の問題ではなく、**決まっていないことが
   決まっていない**から。それは相手に聞かないと埋まらない。
   ほかのゲームは全部「AIに何と言うか」だが、ここだけ相手が人間。

   ▍聞ける回数を絞る
   全部聞けるなら、選ばなくていい＝考えなくていい。回数を絞ると
   「どれから聞くか」を決めることになり、そこに優劣が出る。

   ▍聞いた順に、下の「わかったこと」が埋まっていく
   質問して終わりにせず、**答えが仕様の1行になる**ところまで見せる。
   何のために聞いたのかが画面に残る。
   ============================================================ */
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { PopIn, useSparkBurst, useTap } from '@/components/motion';
import type { InterviewQuestion, LessonInteractive } from '@/data/types';
import { playSound } from '@/lib/sound';
import { BW, C, F, FONT, R, S } from '@/theme';

import { GameButton, GameFrame, GameStatus, TryAgain, useCheer } from './parts';
import { shuffled, useGameClock, type GameScore } from './score';

type Spec = Extract<LessonInteractive, { kind: 'interview' }>;

/** 相手の答えの色。黒地の上で「人がしゃべっている」ことが分かる青 */
const VOICE = '#5cc8ff';

export function InterviewPlay({
  spec,
  onClear,
}: {
  spec: Spec;
  onClear: (score: GameScore) => void;
}) {
  const burst = useSparkBurst();
  const { cheer, node: cheerNode } = useCheer();
  const elapsed = useGameClock();
  const allow = spec.allow ?? 1;

  /* 並び順で答えを覚えられないように、毎回混ぜる（→ score.ts） */
  const [pool] = React.useState<InterviewQuestion[]>(() => shuffled(spec.questions));
  /* 聞いた質問。聞いた順に積む */
  const [asked, setAsked] = React.useState<number[]>([]);
  const [misses, setMisses] = React.useState(0);
  const [failed, setFailed] = React.useState(false);

  const gotCount = asked.filter((i) => pool[i].ok).length;
  const needCount = pool.filter((q) => q.ok).length;
  const left = spec.turns - asked.length;
  /* ▍通るのは「効く質問を全部聞けたとき」だけ
     回数を使い切っただけでは通らない。残り回数と残りの当たりが
     合わなくなった時点で、その場で終わりにする（先が無いのに
     押させ続けない） */
  const cleared = gotCount >= needCount;
  const dead = !cleared && left <= 0;

  const ask = (i: number, x: number, y: number) => {
    if (failed || cleared || asked.includes(i) || left <= 0) return;
    const q = pool[i];
    setAsked((v) => [...v, i]);
    if (q.ok) {
      playSound('right');
      burst(x, y, 1.3);
      cheer(x, y, gotCount + 1);
      return;
    }
    playSound('wrong');
    setMisses((n) => {
      const next = n + 1;
      if (next > allow) setFailed(true);
      return next;
    });
  };

  const retry = () => {
    setAsked([]);
    setMisses(0);
    setFailed(false);
  };

  return (
    <GameFrame
      overlay={cheerNode}
      footer={
        failed || dead ? (
          <GameButton label="もう一度" onPress={retry} />
        ) : cleared ? (
          <GameButton
            label="これで書ける"
            onPress={() => onClear({ misses, allow, ms: elapsed() })}
          />
        ) : undefined
      }>
      <View style={{ gap: S.md }}>
        <Text style={[F.hand, { fontSize: 15, lineHeight: 25, color: C.paper100 }]}>
          {spec.brief}
        </Text>

        <GameStatus
          left={`あと ${Math.max(0, left)}回 聞ける`}
          misses={misses}
          allow={allow}
        />

        {/* 言われたこと。**ずっと出しておく**——これと突き合わせないと選べない */}
        <View
          style={{
            borderWidth: BW.bold,
            borderColor: C.paper100,
            borderRadius: R.md,
            padding: S.md,
            gap: 6,
          }}>
          <Text style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: 1, color: C.ink300 }}>
            言われたこと
          </Text>
          <Text style={{ fontFamily: FONT.body, fontSize: 14, lineHeight: 23, color: C.paper0 }}>
            「{spec.request}」
          </Text>
        </View>

        {/* 聞いたやりとり。聞いた順に増える */}
        {asked.length > 0 ? (
          <View style={{ gap: S.sm }}>
            {asked.map((i) => (
              <Exchange key={i} q={pool[i]} />
            ))}
          </View>
        ) : null}

        {/* まだ聞いていない質問の札 */}
        {!cleared && !failed && !dead ? (
          <View style={{ gap: S.sm }}>
            <Text style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: 1, color: C.ink300 }}>
              何を聞く？
            </Text>
            {pool.map((q, i) =>
              asked.includes(i) ? null : (
                <QuestionCard key={i} text={q.q} onPress={(x, y) => ask(i, x, y)} />
              ),
            )}
          </View>
        ) : null}

        {/* わかったこと。効く質問をするたびに1行ずつ埋まる */}
        {gotCount > 0 ? (
          <PopIn>
            <View
              style={{
                borderWidth: BW.bold,
                borderColor: C.yellow400,
                borderRadius: R.md,
                padding: S.md,
                gap: 7,
              }}>
              <Text
                style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: 1, color: C.yellow400 }}>
                わかったこと {gotCount} / {needCount}
              </Text>
              {asked
                .filter((i) => pool[i].ok)
                .map((i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 7, alignItems: 'flex-start' }}>
                    <Icon name="check" size={13} color={C.yellow400} />
                    <Text
                      style={{
                        fontFamily: FONT.body,
                        fontSize: 13,
                        lineHeight: 21,
                        color: C.paper100,
                        flex: 1,
                      }}>
                      {pool[i].got ?? pool[i].a}
                    </Text>
                  </View>
                ))}
            </View>
          </PopIn>
        ) : null}

        {failed ? (
          <PopIn>
            <TryAgain
              reason={`効かない質問を${misses}回しました。聞くべきは「決まっていないと書けないこと」——誰が読むか、いつ要るか、何をもって良しとするか。好みや感想は、聞いても仕様になりません。`}
            />
          </PopIn>
        ) : dead ? (
          <PopIn>
            <TryAgain
              reason={`聞ける回数を使い切りました。決めどころは${needCount}つあります。「聞かなくても分かること」に回数を使うと、最後まで埋まりません。`}
            />
          </PopIn>
        ) : null}
      </View>
    </GameFrame>
  );
}

/* 聞いたやりとり1組。効かなかった質問は、その場でなぜかを言う */
function Exchange({ q }: { q: InterviewQuestion }) {
  return (
    <View style={{ gap: 5 }}>
      <View style={{ flexDirection: 'row', gap: 7, alignItems: 'flex-start' }}>
        <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: C.ink300, marginTop: 2 }}>Q</Text>
        <Text style={{ fontFamily: FONT.body, fontSize: 13, lineHeight: 21, color: C.ink300, flex: 1 }}>
          {q.q}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 7, alignItems: 'flex-start' }}>
        <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: VOICE, marginTop: 2 }}>A</Text>
        <Text
          style={{
            fontFamily: FONT.body,
            fontSize: 13.5,
            lineHeight: 22,
            color: q.ok ? C.paper0 : C.paper100,
            flex: 1,
          }}>
          「{q.a}」
        </Text>
      </View>
      {!q.ok && q.why ? (
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start', paddingLeft: 18 }}>
          <Icon name="bulb" size={13} color={C.red500} />
          <Text style={[F.hand, { fontSize: 12, color: C.red500, flex: 1 }]}>{q.why}</Text>
        </View>
      ) : null}
    </View>
  );
}

/* 質問の札 */
function QuestionCard({ text, onPress }: { text: string; onPress: (x: number, y: number) => void }) {
  /* 判定音とぶつかるのでタップ音は消す（他のゲームと同じ理由） */
  const { pressed, onPressIn, onPressOut } = useTap({ sparks: false, haptic: 'light', sound: 'none' });
  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={(e) => onPress(e.nativeEvent.pageX, e.nativeEvent.pageY)}>
      <View
        style={{
          backgroundColor: pressed ? C.paper100 : C.paper0,
          borderWidth: BW.line,
          borderColor: C.ink900,
          borderRadius: R.sm,
          paddingHorizontal: S.md,
          paddingVertical: 11,
          flexDirection: 'row',
          gap: 8,
          alignItems: 'flex-start',
        }}>
        <Icon name="compass" size={14} color={C.ink500} />
        <Text
          style={{ fontFamily: FONT.body, fontSize: 13, lineHeight: 21, color: C.ink900, flex: 1 }}>
          {text}
        </Text>
      </View>
    </Pressable>
  );
}
