/* ============================================================
   記録の持ち出し。せっていの中の一節（→ app/(tabs)/settings.tsx）。

   ▍これが無いと、端末を変えた時点で全部消える
   集めた舞台・色違い・復習の進み具合・ガチャP。サーバもアカウントも
   作らない方針なので、**文字列1本で持ち運べる**ようにしてある。

   ▍読み込みは2段階にする
   押した瞬間に入れ替わると、いまの記録が事故で消える。
   中身を検査 → **何が入っているか見せる** → もう一度押す、の順。
   検査は lib/save.ts。壊れていたら理由だけ返って、記録には触らない。
   ============================================================ */
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TextInput, View } from 'react-native';

import { Icon } from '@/components/icons';
import { Button, Card, Row, Tap } from '@/components/ui';
import {
  CAN_USE_FILE,
  decodeSave,
  downloadSave,
  encodeSave,
  pickSaveFile,
  type SaveSummary,
} from '@/lib/save';
import { useProgress, type ProgressState } from '@/store/progress';
import { BW, C, F, FONT, R, S, T } from '@/theme';

type Note = { tone: 'ok' | 'ng'; text: string } | null;

/** settings=書き出しと読み込み / restore=読み込みだけ（→ onboarding/avatar.tsx）。
    まだ何も無い端末で「書き出す」を見せても、空の記録が出てくるだけなので隠す */
type Mode = 'settings' | 'restore';

export function SaveTransfer({ mode = 'settings' }: { mode?: Mode }) {
  const router = useRouter();
  const { state, replaceAll } = useProgress();
  /* idle=たたんである / paste=貼り付け待ち / confirm=入れ替えの確認 */
  const [phase, setPhase] = React.useState<'idle' | 'paste' | 'confirm'>('idle');
  const [text, setText] = React.useState('');
  const [note, setNote] = React.useState<Note>(null);
  const [pending, setPending] = React.useState<{
    state: ProgressState;
    summary: SaveSummary;
  } | null>(null);

  const copy = async () => {
    const save = encodeSave(state);
    /* ▍コピーは断られることがある
       ブラウザはクリップボードへの書き込みを拒める（Safariの設定など）。
       黙って失敗すると「押したのに何も起きない」になるので、逃げ道を言う */
    try {
      await Clipboard.setStringAsync(save);
    } catch {
      setNote({
        tone: 'ng',
        text: CAN_USE_FILE
          ? 'コピーできませんでした。「ファイルに保存」を使ってください。'
          : 'コピーできませんでした。もう一度お試しください。',
      });
      return;
    }
    setNote({
      tone: 'ok',
      text: `コピーしました（${save.length.toLocaleString()}文字）。メモ帳やメールに貼って残してください。`,
    });
  };

  const toFile = () => {
    downloadSave(encodeSave(state));
    setNote({ tone: 'ok', text: 'ファイルに保存しました。「ファイル」アプリなどに置いておけます。' });
  };

  /* 貼り付けた文字列を検査する。ここでは**まだ書き換えない** */
  const check = (raw: string) => {
    const result = decodeSave(raw);
    if (!result.ok) {
      setNote({ tone: 'ng', text: result.reason });
      return;
    }
    setPending({ state: result.state, summary: result.summary });
    setNote(null);
    setPhase('confirm');
  };

  const fromClipboard = async () => {
    // 読み取りも断られることがある（そのときは手で貼ってもらう）
    const raw = await Clipboard.getStringAsync().catch(() => '');
    if (!raw) {
      setNote({ tone: 'ng', text: 'クリップボードが空でした。手で貼り付けてください。' });
      return;
    }
    setText(raw);
    check(raw);
  };

  const fromFile = async () => {
    const raw = await pickSaveFile();
    if (raw === null) return;
    setText(raw);
    check(raw);
  };

  const apply = () => {
    if (!pending) return;
    replaceAll(pending.state);
    setPending(null);
    setText('');
    setPhase('idle');
    setNote({ tone: 'ok', text: '読み込みました。' });
    /* 装備しているアバターも舞台も変わるので、ホームから見直してもらう */
    router.replace('/');
  };

  const cancel = () => {
    setPending(null);
    setPhase('idle');
    setText('');
    setNote(null);
  };

  const restore = mode === 'restore';

  return (
    <Card variant={restore ? 'flat' : 'pop'}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text style={F.h1}>{restore ? '前の端末の記録がある' : '記録の持ち出し'}</Text>
        <Icon name="folder" size={18} color={T.text} />
      </Row>
      <Text style={restore ? F.small : F.body}>
        {restore
          ? '書き出しておいた文字列があれば、ここから戻せます。無い人はそのまま相棒を選んでください。'
          : '記録はこの端末の中にしかありません。書き出しておけば、端末を変えても、入れ直しても、そこから戻せます。'}
      </Text>

      {phase === 'confirm' && pending ? (
        <ConfirmBox summary={pending.summary} onApply={apply} onCancel={cancel} />
      ) : phase === 'paste' ? (
        <View style={{ gap: S.sm }}>
          <View
            style={{
              backgroundColor: T.surface,
              borderWidth: BW.bold,
              borderColor: T.border,
              borderRadius: R.sm,
              overflow: 'hidden',
            }}>
            <TextInput
              value={text}
              onChangeText={setText}
              multiline
              placeholder="書き出した文字列をここに貼り付け"
              placeholderTextColor={T.disabled}
              style={{
                minHeight: 88,
                padding: S.sm,
                fontFamily: FONT.mono,
                fontSize: 12,
                lineHeight: 18,
                color: T.text,
                textAlignVertical: 'top',
              }}
            />
          </View>
          <Row gap={S.sm} style={{ flexWrap: 'wrap' }}>
            <Button label="クリップボードから" onPress={fromClipboard} variant="secondary" size="sm" />
            {CAN_USE_FILE ? (
              <Button label="ファイルから" onPress={fromFile} variant="secondary" size="sm" />
            ) : null}
          </Row>
          <Row gap={S.md} style={{ justifyContent: 'space-between' }}>
            <Tap onPress={cancel} sparks={false} style={{ paddingVertical: S.sm }}>
              <Text style={[F.strong, { color: T.muted }]}>やめる</Text>
            </Tap>
            <Button
              label="中身を見る"
              onPress={() => check(text)}
              size="sm"
              disabled={!text.trim()}
            />
          </Row>
        </View>
      ) : (
        <View style={{ gap: S.sm }}>
          {restore ? null : (
            <Row gap={S.sm} style={{ flexWrap: 'wrap' }}>
              <Button label="記録を書き出す" onPress={copy} variant="secondary" size="sm" />
              {CAN_USE_FILE ? (
                <Button label="ファイルに保存" onPress={toFile} variant="secondary" size="sm" />
              ) : null}
            </Row>
          )}
          <Tap
            onPress={() => {
              setNote(null);
              setPhase('paste');
            }}
            sparks={false}
            style={{ paddingVertical: S.xs }}>
            <Text style={[F.strong, { color: T.link }]}>記録を読み込む →</Text>
          </Tap>
        </View>
      )}

      {note ? (
        <Row gap={6} style={{ alignItems: 'flex-start' }}>
          <Icon
            name={note.tone === 'ok' ? 'check' : 'bang'}
            size={14}
            color={note.tone === 'ok' ? T.ok : C.red500}
          />
          <Text style={[F.tiny, { flex: 1, color: note.tone === 'ok' ? T.text : C.red700 }]}>
            {note.text}
          </Text>
        </Row>
      ) : null}
    </Card>
  );
}

/* 入れ替える前の一枚。**いま何が入ってくるか**を数で見せてから押させる */
function ConfirmBox({
  summary,
  onApply,
  onCancel,
}: {
  summary: SaveSummary;
  onApply: () => void;
  onCancel: () => void;
}) {
  const when = summary.savedAt ? new Date(summary.savedAt) : null;
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    <View
      style={{
        borderWidth: BW.bold,
        borderColor: T.border,
        borderRadius: R.sm,
        backgroundColor: T.sunk,
        padding: S.md,
        gap: S.sm,
      }}>
      <Text style={F.strong}>この記録を読み込みます</Text>
      <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: T.text, lineHeight: 20 }}>
        レッスン {summary.lessons} ・ バッジ {summary.badges} ・ ガチャP {summary.coins}
        {'\n'}舞台 {summary.themes} ・ アバター {summary.avatars}
        {when
          ? `\n書き出し ${when.getFullYear()}/${p(when.getMonth() + 1)}/${p(when.getDate())} ${p(when.getHours())}:${p(when.getMinutes())}`
          : ''}
      </Text>
      <Row gap={6} style={{ alignItems: 'flex-start' }}>
        <Icon name="bang" size={14} color={C.red500} />
        <Text style={[F.tiny, { flex: 1, color: C.red700 }]}>
          いまこの端末に入っている記録は消えます。心配なら、先に書き出しておいてください。
        </Text>
      </Row>
      {/* 取り消せない操作なので、押すところは離しておく */}
      <Row gap={S.xl} style={{ justifyContent: 'space-between' }}>
        <Tap onPress={onCancel} sparks={false} style={{ paddingVertical: S.sm }}>
          <Text style={[F.strong, { color: T.muted }]}>やめる</Text>
        </Tap>
        <Button label="入れ替える" onPress={onApply} size="sm" />
      </Row>
    </View>
  );
}
