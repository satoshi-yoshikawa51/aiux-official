/* おまけの一覧。まなぶタブから来る画面（→ components/extra-list.tsx）。

   ガチャの中にも同じ棚があるが、あちらは**当てた直後に気づくため**の置き場。
   遊ぶものを探すときはこちら側から入る（実機で「おまけが気づきにくい」）。 */
import React from 'react';
import { Text, View } from 'react-native';

import { ExtraList, ownedExtras } from '@/components/extra-list';
import { Icon } from '@/components/icons';
import { Button, Card, Row, Screen } from '@/components/ui';
import { EXTRA_TOTAL } from '@/data/extras';
import { useProgress } from '@/store/progress';
import { useRouter } from 'expo-router';
import { F, S, T } from '@/theme';

export default function ExtrasScreen() {
  const router = useRouter();
  const { state } = useProgress();
  const owned = ownedExtras(state);
  const done = Object.keys(state.extras).length;
  const left = owned.length - owned.filter((p) => state.extras[p.id]).length;

  return (
    <Screen tone="dots" style={{ gap: S.md }}>
      <Card>
        <Row gap={7}>
          <Icon name="egg" size={18} color={T.accent} />
          <Text style={[F.strong, { flex: 1 }]}>
            {left > 0 ? `まだ遊んでいないおまけが ${left}本` : 'いま持っているぶんは、ぜんぶ遊びました'}
          </Text>
        </Row>
        <Text style={F.small}>
          ガチャで当てたR以上の景品には、それぞれ遊べる回が1本ついています。
          当てた舞台やキャラが、そのまま出てきます（ぜんぶで{EXTRA_TOTAL}本・クリア{done}本）。
        </Text>
        <Button
          label="ガチャへ"
          variant="secondary"
          size="sm"
          onPress={() => router.push('/gacha')}
          style={{ alignSelf: 'flex-start' }}
        />
      </Card>

      <View style={{ gap: S.sm }}>
        <ExtraList heading={false} />
      </View>
    </Screen>
  );
}
