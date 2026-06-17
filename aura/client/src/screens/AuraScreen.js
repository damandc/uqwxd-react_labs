// The whole first session: tap -> camera -> aura renders. <5s, no signup.
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import AuraCard from '../components/AuraCard';
import { api } from '../lib/api';
import { getDeviceId } from '../lib/identity';

export default function AuraScreen({ onShare }) {
  const [aura, setAura] = useState(null);
  const [loading, setLoading] = useState(false);

  async function seeMyAura() {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    // In a real build: fire expo-camera, capture a selfie, derive a non-PII
    // vibe seed on-device, pass that to the BFF. Stubbed here.
    const seed = 'late-night main character energy';
    const { data } = await api.generateAura(getDeviceId(), seed);
    setAura(data);
    setLoading(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  return (
    <View style={styles.wrap}>
      {aura ? (
        <>
          <AuraCard {...aura} />
          <Pressable style={styles.cta} onPress={() => onShare?.(aura)}>
            <Text style={styles.ctaText}>Get my friends' read →</Text>
          </Pressable>
        </>
      ) : (
        <Pressable style={styles.cta} onPress={seeMyAura} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.ctaText}>See My Aura</Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0a0a0f', alignItems: 'center', justifyContent: 'center', gap: 28 },
  cta: { backgroundColor: '#fff', paddingHorizontal: 36, paddingVertical: 18, borderRadius: 999 },
  ctaText: { fontSize: 20, fontWeight: '800', color: '#000' },
});
