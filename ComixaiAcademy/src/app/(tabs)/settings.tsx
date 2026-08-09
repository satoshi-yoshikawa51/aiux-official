/* せってい。アバター・職種の変更と、記録のリセット。

   見た目の作法はホームに揃えてある（黒帯・網点の紙・黒いカセット）。
   この画面には「次にやること」が無いので、**黄色いピルは置かない**。
   黒いカセットは記録（消すと戻せないもの）に使う。 */
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { RolePicker } from '@/components/role-picker';
import { Spotlight } from '@/components/spotlight';
import { Badge, Card, Cassette, Panel, PressCard, Row, Screen, ScreenHead, Tap } from '@/components/ui';
import { AVATARS, getAvatar, isReady } from '@/data/avatars';
import { getRole } from '@/data/roles';
import { useProgress, useStats } from '@/store/progress';
import { BW, C, F, FONT, R, S, T } from '@/theme';

const SITE = 'https://comixai.dev';

export default function SettingsScreen() {
  const router = useRouter();
  const { state, setAvatar, setRole, setSoundOn, reset } = useProgress();
  const stats = useStats();
  const avatar = getAvatar(state.avatarId);
  const role = getRole(state.roleId);

  /* ▍確認は画面の中で出す。Alert.alert は使わない
     react-native-web の Alert は **中身が空のメソッド**で、
     Webでは押しても何も起きない（このアプリはWebでも配っている）。
     出す／出さないが端末で変わってしまうので、自前の2段階にする */
  const [asking, setAsking] = React.useState(false);

  const doReset = () => {
    setAsking(false);
    reset();
    /* オープニングから通し直す。ルートの振り分けも同じ判断をするが、
       ここで先に飛ばしておくと1フレームぶん待たない */
    router.replace('/opening');
  };

  const header = (
    <ScreenHead
      kicker="SETTINGS"
      title="せってい"
      note={`${avatar.name} ・ ${role?.name ?? '職種えらび中'}`}
      noteRight="いつでも変えられます"
    />
  );

  return (
    <Screen header={header} tone="dots">
      {/* アバター */}
      <View style={{ gap: S.md }}>
        {/* ▍囲うのは**見出しだけ**にする
            節そのものを囲うと、アバター5枚で画面の高さを超えてしまい、
            「枠」ではなくページの縁に見える（職種の節はもっと長い）。
            どこの話かが分かればいいので、見出しに絞る */}
        <Spotlight name="settings-avatar" radius={R.xs} inset={-6} room={8}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={F.h1}>アバター</Text>
            <Text style={F.hand}>いま：{avatar.name}</Text>
          </Row>
        </Spotlight>
        {AVATARS.map((a) => {
          const selected = a.id === state.avatarId;
          const ready = isReady(a);
          return (
            <PressCard key={a.id} disabled={!ready} selected={selected} onPress={() => setAvatar(a.id)}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Row gap={S.sm} style={{ flex: 1 }}>
                  <Icon name={a.icon} size={22} color={T.text} />
                  <View style={{ flex: 1 }}>
                    <Text style={F.strong}>{a.name}</Text>
                    <Text style={F.tiny}>{a.tagline}</Text>
                  </View>
                </Row>
                {!ready ? (
                  <Badge tone="paper">準備中</Badge>
                ) : selected ? (
                  <Badge tone="red">選択中</Badge>
                ) : null}
              </Row>
            </PressCard>
          );
        })}
      </View>

      {/* 職種 */}
      <View style={{ gap: S.md }}>
        {/* ここは案内で光らせない。アバター5枚ぶん下にあってフキダシの
            下敷きになるため（→ store/tutorial.tsx の5歩目） */}
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={F.h1}>職種</Text>
          <Text style={F.hand}>変えると、レッスンの内容が変わります</Text>
        </Row>
        <RolePicker value={state.roleId} onPick={setRole} />
      </View>

      {/* ———— 音 ————
           触覚と同じで、あれば嬉しく無くても困らないもの。
           **既定はオン**だが、電車で開く人のために切れるようにしておく */}
      <Panel contentStyle={{ padding: S.md, gap: S.sm }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Row gap={8} style={{ flex: 1 }}>
            <Icon name="sparkle" size={18} color={T.text} />
            <View style={{ flex: 1 }}>
              <Text style={F.strong}>効果音</Text>
              <Text style={F.tiny}>
                正解・クリア・昇格で鳴ります。端末を消音にしていれば鳴りません
              </Text>
            </View>
          </Row>
          <Tap
            onPress={() => setSoundOn(!state.soundOn)}
            sparks={false}
            /* 切るときに音が鳴ると滑稽なので、押した音も止める */
            sound={state.soundOn ? 'none' : 'tap'}>
            <View
              style={{
                borderWidth: BW.bold,
                borderColor: T.border,
                borderRadius: R.full,
                backgroundColor: state.soundOn ? T.accent : T.sunk,
                paddingHorizontal: S.md,
                paddingVertical: 7,
                minWidth: 64,
                alignItems: 'center',
              }}>
              <Text
                style={{
                  fontFamily: FONT.heading,
                  fontSize: 13,
                  color: state.soundOn ? C.paper0 : T.muted,
                }}>
                {state.soundOn ? 'オン' : 'オフ'}
              </Text>
            </View>
          </Tap>
        </Row>
      </Panel>

      {/* 記録 */}
      <Cassette>
        <Text style={[F.h1, { color: C.paper50 }]}>記録</Text>
        <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: C.paper100, lineHeight: 20 }}>
          DONE {stats.doneCount}/{stats.total} ・ BADGE {stats.badgeCount}/{stats.badgeTotal} ・ STREAK{' '}
          {stats.streak}
        </Text>
        <Text style={[F.hand, { color: C.ink300 }]}>
          この端末の中だけに保存されます。アプリを消すと一緒に消えます。
        </Text>
        {/* 消すのは取り消せないので、赤いボタンの見た目にはしない。
            黒の上では red500 が沈むので、文字は red100 で出す */}
        {asking ? (
          <View style={{ gap: S.sm, paddingTop: S.xs }}>
            <Text style={[F.strong, { color: C.paper50 }]}>
              ぜんぶ消して、オープニングからやり直す。いいか？
            </Text>
            {/* 取り消せない操作なので、2つの文字は離しておく。
                指で押すものが並ぶと、隣を巻き込む */}
            <Row gap={S.xl}>
              <Tap onPress={() => setAsking(false)} sparks={false} style={{ paddingVertical: S.sm }}>
                <Text style={[F.strong, { color: C.paper100 }]}>やめる</Text>
              </Tap>
              {/* 記録が消える口。**星は出さない**（祝うところではない） */}
              <Tap onPress={doReset} sparks={false} style={{ paddingVertical: S.sm }}>
                <Row gap={6}>
                  <Icon name="bang" size={15} color={C.red100} />
                  <Text style={[F.strong, { color: C.red100 }]}>消す</Text>
                </Row>
              </Tap>
            </Row>
          </View>
        ) : (
          <Tap onPress={() => setAsking(true)} sparks={false} scale={0.97} style={{ paddingVertical: S.sm }}>
            <Row gap={6}>
              <Icon name="bang" size={15} color={C.red100} />
              <Text style={[F.strong, { color: C.red100 }]}>
                記録をぜんぶ消す（オープニングからやり直します）
              </Text>
            </Row>
          </Tap>
        )}
      </Cassette>

      {/* リンク */}
      <Card>
        <Text style={F.h1}>このアプリについて</Text>
        <Text style={F.body}>
          COMIXAI（comixai.dev）の用語集・職種別ガイド・プロンプト集をもとにした学習アプリです。
        </Text>
        <Tap onPress={() => WebBrowser.openBrowserAsync(SITE)} style={{ paddingVertical: S.xs }}>
          <Text style={[F.strong, { color: T.link }]}>COMIXAI を開く →</Text>
        </Tap>
      </Card>
    </Screen>
  );
}
