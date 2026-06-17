// The shareable artifact. A glowing gradient card with a one-word verdict.
// In a real build the gradient animates and reacts to incoming votes — that
// kinetic mutation IS the dopamine loop. Kept static here for the skeleton.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AuraCard({ verdict, vibe, gradient = ['#7928ca', '#ff0080'] }) {
  return (
    <View style={[styles.card, { backgroundColor: gradient[0] }]}>
      <View style={[styles.glow, { backgroundColor: gradient[1] }]} />
      <Text style={styles.verdict}>{verdict || '— — —'}</Text>
      {!!vibe && <Text style={styles.vibe}>{vibe}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '88%',
    aspectRatio: 0.72,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.55,
    top: -40,
  },
  verdict: {
    color: '#fff',
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  vibe: { color: '#ffffffcc', fontSize: 16, marginTop: 12, fontStyle: 'italic' },
});
