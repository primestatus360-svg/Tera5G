import { useEffect } from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SERVER_URL } from '../constants/config'
import { C, F } from '../constants/theme'

function randomName() {
  return 'User-' + Math.random().toString(36).slice(2, 6).toUpperCase()
}

export default function AutoJoin() {
  useEffect(() => {
    async function join() {
      try {
        const res = await fetch(`${SERVER_URL}/api/teams`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: randomName() }),
        })
        const data = res.ok ? await res.json() : null
        router.replace({
          pathname: '/(tabs)/connect',
          params: data?.team
            ? { teamId: data.team.id, teamName: data.team.name, teamColor: data.team.color }
            : { teamId: 'guest', teamName: 'Guest', teamColor: C.blue },
        })
      } catch {
        router.replace({
          pathname: '/(tabs)/connect',
          params: { teamId: 'guest', teamName: 'Guest', teamColor: C.blue },
        })
      }
    }
    join()
  }, [])

  return (
    <View style={styles.container}>
      {/* Brand mark */}
      <View style={styles.logoBox}>
        <Ionicons name="flash" size={32} color="#fff" />
      </View>

      {/* Wordmark */}
      <View style={styles.wordmarkRow}>
        <Text style={styles.wordmark}>Tera</Text>
        <Text style={[styles.wordmark, { color: C.green }]}>5G</Text>
      </View>

      <Text style={styles.tagline}>Internet-free relay browser</Text>

      {/* Spinner */}
      <View style={styles.spinnerWrap}>
        <ActivityIndicator color={C.blue} size="small" />
        <Text style={styles.spinnerLabel}>Joining relay…</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logoBox: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: C.blue + '20',
    borderWidth: 1, borderColor: C.blue + '40',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  wordmarkRow: {
    flexDirection: 'row', alignItems: 'baseline',
  },
  wordmark: {
    fontSize: 36, fontWeight: '800', color: C.text,
    letterSpacing: -1.5, fontFamily: F,
  },
  tagline: {
    fontSize: 13, color: C.muted, fontFamily: F, letterSpacing: 0.2,
  },
  spinnerWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 24,
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.border,
    borderRadius: 99, paddingHorizontal: 16, paddingVertical: 9,
  },
  spinnerLabel: {
    fontSize: 12, color: C.sub, fontFamily: F, fontWeight: '500',
  },
})
