import { Tabs, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { View, Text, StyleSheet } from 'react-native'
import { C, F } from '../../constants/theme'

function TabIcon({ name, color, focused }: { name: React.ComponentProps<typeof Ionicons>['name']; color: string; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && { backgroundColor: color + '18' }]}>
      <Ionicons name={name} size={20} color={color} />
    </View>
  )
}

export default function TabsLayout() {
  const params = useLocalSearchParams<{ teamId: string; teamName: string; teamColor: string }>()

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: C.header },
        headerTintColor: C.text,
        headerTitleStyle: {
          fontFamily: F,
          fontWeight: '700',
          fontSize: 16,
        },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: C.header,
          borderTopColor: 'rgba(255,255,255,0.07)',
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
          paddingHorizontal: 8,
        },
        tabBarActiveTintColor: C.blue,
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: F,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginTop: 2,
        },
        tabBarItemStyle: {
          borderRadius: 12,
          marginHorizontal: 2,
        },
      }}
    >
      <Tabs.Screen
        name="connect"
        initialParams={params}
        options={{
          title: 'Browser',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="globe-outline" color={color} focused={focused} />
          ),
          headerTitle: params.teamName ? `${params.teamName}  ·  Relay` : 'Tera5G Browser',
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        initialParams={params}
        options={{
          title: 'Ranking',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="trophy-outline" color={color} focused={focused} />
          ),
          headerTitle: 'Leaderboard',
        }}
      />
      <Tabs.Screen
        name="howto"
        options={{
          title: 'How It Works',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="information-circle-outline" color={color} focused={focused} />
          ),
          headerTitle: 'Domain Fronting',
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 36,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
