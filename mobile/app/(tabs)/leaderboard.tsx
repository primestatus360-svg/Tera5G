import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSocket } from '../../hooks/useSocket'
import { C, R, S, F, cardShadow } from '../../constants/theme'

function fmtTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

const RANK_COLORS = ['#f59e0b', '#94a3b8', '#b45309']
const RANK_LABELS = ['1st', '2nd', '3rd']

export default function LeaderboardTab() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>()
  const { scores, firewallMode } = useSocket()
  const bypassing = firewallMode === 'vulnerable'
  const maxPts = scores[0]?.totalPoints ?? 1

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Firewall state banner */}
      <View style={[
        styles.banner,
        bypassing
          ? { backgroundColor: C.redBg,   borderColor: C.redBd }
          : { backgroundColor: C.greenBg, borderColor: C.greenBd },
      ]}>
        <Ionicons
          name={bypassing ? 'shield-outline' : 'shield-checkmark-outline'}
          size={14}
          color={bypassing ? C.red : C.green}
        />
        <Text style={[styles.bannerText, { color: bypassing ? C.red : C.green }]}>
          {bypassing ? 'Firewall vulnerable — bypass active' : 'Firewall patched — relay blocked'}
        </Text>
      </View>

      {scores.length === 0 && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="trophy-outline" size={28} color={C.muted} />
          </View>
          <Text style={styles.emptyTitle}>No teams yet</Text>
          <Text style={styles.emptyBody}>Waiting for first relay connection</Text>
        </View>
      )}

      {scores.map((entry, i) => {
        const isMe   = entry.teamId === teamId
        const pct    = maxPts > 0 ? (entry.totalPoints / maxPts) : 0
        const rankColor = RANK_COLORS[i] ?? C.muted
        const isTop3 = i < 3

        return (
          <View
            key={entry.teamId}
            style={[
              styles.card,
              cardShadow(),
              isMe && { borderColor: entry.color + '45' },
            ]}
          >
            {/* Top accent bar with team color */}
            <View style={[styles.cardAccent, { backgroundColor: entry.color }]} />

            <View style={styles.cardBody}>
              {/* Rank + name row */}
              <View style={styles.cardTop}>
                <View style={styles.rankRow}>
                  {/* Rank badge */}
                  <View style={[
                    styles.rankBadge,
                    isTop3
                      ? { backgroundColor: rankColor + '18', borderColor: rankColor + '40' }
                      : { backgroundColor: C.elevated, borderColor: C.border },
                  ]}>
                    <Text style={[styles.rankText, { color: isTop3 ? rankColor : C.muted }]}>
                      {isTop3 ? RANK_LABELS[i] : `#${i + 1}`}
                    </Text>
                  </View>

                  <Text style={[styles.teamName, { color: entry.color }]} numberOfLines={1}>
                    {entry.teamName}
                  </Text>

                  {isMe && (
                    <View style={[styles.badge, { backgroundColor: entry.color + '18', borderColor: entry.color + '40' }]}>
                      <Text style={[styles.badgeText, { color: entry.color }]}>You</Text>
                    </View>
                  )}
                  {entry.firstConnectBonus && (
                    <View style={[styles.badge, { backgroundColor: C.yellowBg, borderColor: C.yellowBd }]}>
                      <Text style={[styles.badgeText, { color: C.yellow }]}>+15 first</Text>
                    </View>
                  )}
                </View>

                {/* Points */}
                <View style={styles.ptsBox}>
                  <Text style={[styles.ptsValue, { color: entry.color }]}>{entry.totalPoints}</Text>
                  <Text style={styles.ptsLabel}>pts</Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${Math.round(pct * 100)}%` as any,
                      backgroundColor: entry.color,
                    },
                  ]}
                />
              </View>

              {/* Stats row */}
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Ionicons name="time-outline" size={11} color={C.muted} />
                  <Text style={styles.statText}>{fmtTime(entry.activeSeconds)}</Text>
                </View>
                <View style={[styles.statDivider]} />
                <View style={styles.stat}>
                  <Ionicons name="radio-outline" size={11} color={C.muted} />
                  <Text style={styles.statText}>{entry.connectionsAllowed}/{entry.connectionsAttempted}</Text>
                </View>
                <View style={[styles.statDivider]} />
                <View style={styles.stat}>
                  <Ionicons name="trophy-outline" size={11} color={C.muted} />
                  <Text style={styles.statText}>best {fmtTime(entry.longestSession)}</Text>
                </View>
              </View>
            </View>
          </View>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  container: { padding: S.md, gap: 10, paddingBottom: 48 },

  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    borderWidth: 1, borderRadius: R.input,
    paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 4,
  },
  bannerText: { fontSize: 12.5, fontWeight: '500', fontFamily: F },

  emptyState: {
    alignItems: 'center', paddingVertical: 52, gap: 10,
  },
  emptyIcon: {
    width: 60, height: 60, borderRadius: 18,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { color: C.sub, fontSize: 15, fontWeight: '600', fontFamily: F },
  emptyBody:  { color: C.muted, fontSize: 13, fontFamily: F },

  card: {
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.border,
    borderRadius: R.card,
    overflow: 'hidden',
  },
  cardAccent: { height: 3 },
  cardBody:   { padding: 16, gap: 10 },

  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },

  rankBadge: {
    borderWidth: 1, borderRadius: R.badge,
    paddingHorizontal: 9, paddingVertical: 3,
  },
  rankText: { fontSize: 10.5, fontWeight: '700', fontFamily: F },

  teamName: { fontSize: 15, fontWeight: '600', flex: 1, fontFamily: F },

  badge: {
    borderWidth: 1, borderRadius: R.badge,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  badgeText: { fontSize: 10, fontWeight: '600', fontFamily: F },

  ptsBox: { alignItems: 'flex-end', gap: 0 },
  ptsValue: {
    fontSize: 26, fontWeight: '800',
    letterSpacing: -1, fontFamily: F, lineHeight: 30,
  },
  ptsLabel: { fontSize: 10, color: C.muted, fontFamily: F },

  barTrack: {
    height: 3, backgroundColor: C.divider,
    borderRadius: 2, overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 2 },

  statsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { color: C.muted, fontSize: 11, fontFamily: F },
  statDivider: {
    width: 1, height: 10, backgroundColor: C.divider,
  },
})
