// Minimal three-state shell: aura -> share -> votes(+paywall).
// A real build wires this to a navigator + the share sheet / Story sticker.
import React, { useState } from 'react';
import { SafeAreaView, Alert, StyleSheet } from 'react-native';
import AuraScreen from './src/screens/AuraScreen';
import VotesScreen from './src/screens/VotesScreen';

export default function App() {
  const [screen, setScreen] = useState('aura');

  // Demo votes — in production these stream from the BFF in real time.
  const demoVotes = [
    { id: 'v1', word: 'OBSESSED' },
    { id: 'v2', word: 'MENACE' },
  ];

  function onShare() {
    // Real build: generate aura.app/u/<id>, drop into native IG/Snap link
    // sticker with the card as background. Then surface incoming votes.
    setScreen('votes');
  }

  function onPaywall(offer) {
    Alert.alert('AURA+', `Unlock who voted — ${offer.price}`);
    // Real build: present the weekly-sub paywall, verify receipt -> BFF entitlement.
  }

  return (
    <SafeAreaView style={styles.root}>
      {screen === 'aura' ? (
        <AuraScreen onShare={onShare} />
      ) : (
        <VotesScreen votes={demoVotes} onPaywall={onPaywall} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: '#0a0a0f' } });
