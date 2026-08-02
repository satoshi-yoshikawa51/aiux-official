/* ============================================================
   オープニング。初回起動のときだけ出る「AIの75年」。

   ▍これは「ダウンロード画面」ではない
   一度そう作ろうとしてやめた。ストアから落とした時点で中身は全部
   端末に入っているので、進捗バーを出しても**中身のない演出**になる。
   AIリテラシーを教えるアプリが、入口で嘘の進捗を見せるのは筋が通らない。

   なので**オープニング演出**として作ってある。下のボタンで**いつでも**
   本編に行ける。止めない、急かさない、飛ばせる。

   ▍動画はアプリに積んでいない
   mp4は14本で7MB。1回しか見ない画面のために積むには重いので、
   サイト（comixai.dev/history/）から取りにいく。届くまでは
   アプリに積んである静止画が出ているので、**電波が悪くても絵巻は成立する**
   （動きが無いだけ）。src/data/emaki.ts の video がそのURL。

   裏でホームの重いもの（アバターのGLB・舞台）を先読みしている。
   進捗は**出さない**。見せるほどの待ちではないし、出せば演出になる。
   ============================================================ */
import { Asset } from 'expo-asset';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React from 'react';
import { Image, Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';

import { Icon } from '@/components/icons';
import { Panel, Pill, Row, Screen, ScreenHead } from '@/components/ui';
import { AVATARS } from '@/data/avatars';
import { EMAKI } from '@/data/emaki';
import { STAGE } from '@/data/stage';
import { useProgress } from '@/store/progress';
import { BW, C, F, FONT, POP, R, S, T } from '@/theme';

/** 1コマの持ち時間。動画が5.2秒なので、少し余らせて切り替える */
const AUTO_MS = 6000;

/** 冬の時代は寒色、ブームは暖色でコマの地を染める */
const TONE_BG = { winter: '#e7f0ff', boom: '#fff1db' } as const;

/** ———— コマ絵の縦横比（幅÷高さ）————
    静止画は 1100×829、動画は 720×544。どちらも約1.33の横長。
    **高さを画面の余りで決めると縦長の箱になり、左右が切れる**（絵の端に
    人や機械が寄っているので、切れると何の絵か分からなくなる）。
    なので幅に合わせて高さを決める。余った縦は下のボタン側に渡す */
const MEDIA_RATIO = 1100 / 829;

export default function OpeningScreen() {
  const router = useRouter();
  const { markOpeningSeen } = useProgress();
  const { height } = useWindowDimensions();
  const short = height < 700;

  const [i, setI] = React.useState(0);
  const panel = EMAKI[i];
  const last = i === EMAKI.length - 1;

  /* ———— 動画 ————
     1つのプレイヤーを使い回し、コマが変わったら中身を差し替える。
     コマごとに作ると、そのたびに接続し直しになって余計に待つ */
  const player = useVideoPlayer(panel.video, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  const [videoReady, setVideoReady] = React.useState(false);

  React.useEffect(() => {
    setVideoReady(false);
    try {
      player.replace(panel.video);
      player.play();
    } catch {
      /* 取れなくても静止画のままでいい */
    }
  }, [panel.video, player]);

  React.useEffect(() => {
    const sub = player.addListener('statusChange', ({ status }) => {
      setVideoReady(status === 'readyToPlay');
    });
    return () => sub.remove();
  }, [player]);

  /* ———— 裏でホームの重いものを落としておく ————
     進捗は見せない。飛ばした人がホームで待たされないための用意 */
  React.useEffect(() => {
    const heavy = [STAGE, ...AVATARS.flatMap((a) => (a.model ? [a.model.glb, a.model.texture] : []))];
    Asset.loadAsync(heavy).catch(() => {});
  }, []);

  /* ———— 自動送り ————
     手で送ったときはタイマーを引き直す（読んでいる途中で飛ばさない）。
     最後まで来たら止める。ぐるぐる回さない */
  React.useEffect(() => {
    if (last) return;
    const t = setTimeout(() => setI((n) => Math.min(EMAKI.length - 1, n + 1)), AUTO_MS);
    return () => clearTimeout(t);
  }, [i, last]);

  const tap = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const enter = () => {
    tap();
    markOpeningSeen();
    router.replace('/onboarding/avatar');
  };

  const header = (
    <ScreenHead
      compact={short}
      kicker="OPENING — AIの75年"
      title="AIは、どこから来たか"
      size="md"
      note={`${i + 1} / ${EMAKI.length}`}
      noteRight={panel.year}
    />
  );

  return (
    <Screen
      scroll={false}
      header={header}
      tone="dots"
      edges={['bottom']}
      style={{
        /* ▍縦の間隔は gap に任せず、下の3つの「空き」で決める
           gap を効かせると、空きのまわりに余分な隙間が足されて
           「ボタンの上と下を同じにする」が崩れる。ここは0にして、
           必要なところにだけ marginTop を書く */
        gap: 0,
        padding: short ? S.sm : S.lg,
        paddingBottom: 0,
      }}>
      {/* ———— 空き①：コマの上 ———— */}
      <Gap short={short} />

      {/* ———— コマ ———— */}
      <Panel
        surface={panel.tone ? TONE_BG[panel.tone] : T.surface}
        contentStyle={{ padding: 0, gap: 0 }}>
        {/* 幅いっぱいに置いて、高さは縦横比から決める。
            背の低い端末で入りきらないときだけ縮む（flexShrink） */}
        <View
          style={{ width: '100%', aspectRatio: MEDIA_RATIO, flexShrink: 1, overflow: 'hidden' }}>
          {/* 静止画は常に敷いておく。動画は届いたら上に重ねる */}
          <Image source={panel.image} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
          {/* ▍動画は「箱で囲って、中で100%」にする
              VideoView に上下左右（left/right/top/bottom）だけを指定しても、
              react-native-web は <video> を素の大きさのまま置いてしまい、
              コマからはみ出して下の文章に被る（Imageで踏んだのと同じ）。
              外側の箱で位置と切り抜きを決め、中身は width/height 100% にする */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              right: 0,
              bottom: 0,
              overflow: 'hidden',
              opacity: videoReady ? 1 : 0,
            }}>
            <VideoView
              player={player}
              nativeControls={false}
              contentFit="cover"
              /* ———— コマの中で再生させる ————
                 iOS Safari は playsinline の付いていない <video> を、再生した瞬間に
                 全画面へ持っていく。1コマ進むたびに全画面になってしまうので、
                 ここで止める。全画面ボタンとPiPも要らないので閉じておく */
              playsInline
              fullscreenOptions={{ enable: false }}
              allowsPictureInPicture={false}
              style={{ width: '100%', height: '100%' }}
            />
          </View>

          {/* 左右の送り。コマの上に重ねる */}
          <ArrowTap
            side="left"
            disabled={i === 0}
            onPress={() => {
              tap();
              setI((n) => Math.max(0, n - 1));
            }}
          />
          <ArrowTap
            side="right"
            disabled={last}
            onPress={() => {
              tap();
              setI((n) => Math.min(EMAKI.length - 1, n + 1));
            }}
          />
        </View>

        <View style={{ padding: short ? S.sm : S.md, gap: short ? 4 : 6 }}>
          <Row gap={8}>
            <Pill label={panel.year} />
            <Text style={[F.h2, { flex: 1, fontSize: short ? 15 : 17 }]} numberOfLines={2}>
              {panel.title}
            </Text>
          </Row>
          <Text
            style={[F.body, { fontSize: short ? 12.5 : 14, lineHeight: short ? 20 : 23 }]}
            numberOfLines={short ? 4 : 6}>
            {panel.body}
          </Text>
          {panel.hand ? (
            <Text style={[F.hand, { fontSize: short ? 12 : 13 }]} numberOfLines={2}>
              {panel.hand}
            </Text>
          ) : null}
        </View>
      </Panel>

      {/* ———— 進み具合 ————
           コマの**すぐ下**に置く。離すと、どのコマの話なのか分からない
           ただの点になる。ここはコマに属する表示なので、くっつける */}
      <Row gap={4} style={{ justifyContent: 'center', marginTop: short ? S.xs : S.sm }}>
        {EMAKI.map((_, n) => (
          <View
            key={n}
            style={{
              width: n === i ? 16 : 6,
              height: 6,
              borderRadius: R.full,
              backgroundColor: n === i ? T.accent : n < i ? T.border : T.borderSoft,
            }}
          />
        ))}
      </Row>

      {/* ———— 空き②：ボタンの上 ———— */}
      <Gap short={short} />

      {/* ———— 本編へ ————
           いつでも押せる。読み込みの都合で待たせない */}
      <EnterButton label={last ? 'アプリをはじめる' : '本編にすすむ'} onPress={enter} />

      {/* ———— 空き③：ボタンの下 ————
           ②と同じ幅で伸びるので、ボタンの上下が同じだけ空く。
           画面の paddingBottom を0にしてあるのは、ここで決めたいから */}
      <Gap short={short} />
    </Screen>
  );
}

/* ———— 余った縦をならすための空き ————
   同じものを3つ（コマの上・ボタンの上・ボタンの下）に置く。
   flex が同じなので、余りは**3等分**され、ボタンの上と下が同じ幅になる。
   背の低い端末で余りが無いときは、最低限だけ残して詰まる */
function Gap({ short }: { short: boolean }) {
  return <View style={{ flex: 1, minHeight: short ? S.sm : S.md }} />;
}

/* コマの左右半分にかぶせる送りボタン。
   三角は play アイコンを使い回す（専用の矢印は作っていない） */
function ArrowTap({
  side,
  onPress,
  disabled,
}: {
  side: 'left' | 'right';
  onPress: () => void;
  disabled?: boolean;
}) {
  if (disabled) return null;
  return (
    <Pressable
      onPress={onPress}
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        [side]: 0,
        width: 64,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: R.full,
          backgroundColor: 'rgba(20,17,15,0.55)',
          borderWidth: BW.line,
          borderColor: C.paper50,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ rotate: side === 'left' ? '180deg' : '0deg' }],
        }}>
        <Icon name="play" size={14} color={C.paper50} />
      </View>
    </Pressable>
  );
}

function EnterButton({ label, onPress }: { label: string; onPress: () => void }) {
  const [pressed, setPressed] = React.useState(false);
  return (
    <Pressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}>
      <View
        style={{
          backgroundColor: T.accent,
          borderWidth: BW.bold,
          borderColor: T.border,
          borderRadius: R.sm,
          paddingVertical: 14,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: POP.sm,
          transform: [{ translateX: pressed ? 2 : 0 }, { translateY: pressed ? 2 : 0 }],
        }}>
        <Row gap={7}>
          <Text style={{ fontFamily: FONT.heading, fontSize: 16, color: C.paper0, letterSpacing: 0.4 }}>
            {label}
          </Text>
          <Icon name="play" size={13} color={C.paper0} />
        </Row>
      </View>
      {/* ベタ塗りの影。押すと本体が沈んで影が消える（サイトと同じ挙動） */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: POP.sm,
          top: pressed ? 0 : POP.sm,
          right: -POP.sm,
          bottom: pressed ? POP.sm : 0,
          backgroundColor: T.border,
          borderRadius: R.sm,
          zIndex: -1,
        }}
      />
    </Pressable>
  );
}
