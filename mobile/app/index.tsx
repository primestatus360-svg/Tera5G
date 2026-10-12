import { useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { SERVER_URL } from '../constants/config'
import { C } from '../constants/theme'

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
            : { teamId: 'guest', teamName: 'Guest', teamColor: '#1DB814' },
        })
      } catch {
        router.replace({
          pathname: '/(tabs)/connect',
          params: { teamId: 'guest', teamName: 'Guest', teamColor: '#1DB814' },
        })
      }
    }
    join()
  }, [])

  return (
    <View style={styles.container}>
      <ActivityIndicator color={C.green} size="large" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
