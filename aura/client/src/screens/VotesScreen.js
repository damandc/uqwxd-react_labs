// The cliffhanger. Votes glow in; tapping one tries to reveal the sender and
// collides with the AURA+ paywall (BFF returns 402 with the offer).
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { api } from '../lib/api';
import { getDeviceId } from '../lib/identity';

export default function VotesScreen({ votes = [], onPaywall }) {
  const [revealed, setRevealed] = useState({});

  async function tryReveal(voteId) {
    Haptics.selectionAsync();
    const { status, data } = await api.revealVoter(getDeviceId(), voteId);
    if (status === 402) return onPaywall?.(data.offer); // hit the paywall
    if (status === 200) setRevealed((r) => ({ ...r, [voteId]: data.voter }));
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.h1}>Your aura, rated 👀</Text>
      {votes.map((v) => (
        <Pressable key={v.id} style={styles.row} onPress={() => tryReveal(v.id)}>
          <Text style={styles.word}>{v.word}</Text>
          <Text style={styles.who}>
            {revealed[v.id] ? `from ${revealed[v.id].lastAura}` : 'tap to reveal'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0a0a0f', padding: 20, gap: 12 },
  h1: { color: '#fff', fontSize: 26, fontWeight: '900', marginBottom: 8 },
  row: { backgroundColor: '#16161f', borderRadius: 16, padding: 18, flexDirection: 'row', justifyContent: 'space-between' },
  word: { color: '#fff', fontSize: 20, fontWeight: '800' },
  who: { color: '#ff0080', fontSize: 14, alignSelf: 'center' },
});
