import { useState, useRef, useCallback, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, Animated,
} from 'react-native'
import { WebView, WebViewNavigation } from 'react-native-webview'
import { useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SERVER_URL } from '../../constants/config'
import { useSocket } from '../../hooks/useSocket'
import { C, R, S, F, glowShadow } from '../../constants/theme'

const PRESET_SITES = [
  { label: 'HTTPBin',   url: 'https://httpbin.org/get',                     icon: 'code-slash-outline'    as const },
  { label: 'Example',   url: 'http://example.com',                          icon: 'globe-outline'         as const },
  { label: 'Speedtest', url: 'https://fast.com',                            icon: 'speedometer-outline'   as const },
  { label: 'Wikipedia', url: 'https://en.m.wikipedia.org/wiki/Main_Page',   icon: 'book-outline'          as const },
  { label: 'IP Check',  url: 'https://api.ipify.org?format=json',           icon: 'location-outline'      as const },
]

function relayUrl(targetUrl: string, teamId: string) {
  return `${SERVER_URL}/api/relay?teamId=${encodeURIComponent(teamId)}&url=${encodeURIComponent(targetUrl)}`
}

function getProtocol(url: string): 'https' | 'http' | null {
  try { return new URL(url).protocol === 'https:' ? 'https' : 'http' }
  catch { return null }
}

// ── Loading progress bar (Animated) ─────────────────────────────────────────
function ProgressBar({ loading, color }: { loading: boolean; color: string }) {
  const progress = useRef(new Animated.Value(0)).current
  const opacity  = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (loading) {
      progress.setValue(0)
      opacity.setValue(1)
      Animated.timing(progress, { toValue: 0.85, duration: 2400, useNativeDriver: false }).start()
    } else {
      Animated.parallel([
        Animated.timing(progress, { toValue: 1, duration: 240, useNativeDriver: false }),
        Animated.sequence([
          Animated.delay(240),
          Animated.timing(opacity, { toValue: 0, duration: 280, useNativeDriver: false }),
        ]),
      ]).start(() => progress.setValue(0))
    }
  }, [loading])

  return (
    <Animated.View style={[styles.progressTrack, { opacity }]}>
      <Animated.View
        style={[
          styles.progressFill,
          {
            backgroundColor: color,
            width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          },
        ]}
      />
    </Animated.View>
  )
}

// ── Status pill ──────────────────────────────────────────────────────────────
function StatusPill({
  color, bg, bd, dot, label,
}: { color: string; bg: string; bd: string; dot?: boolean; label: string }) {
  return (
    <View style={[styles.statusPill, { backgroundColor: bg, borderColor: bd }]}>
      {dot && <View style={[styles.dot, { backgroundColor: color }]} />}
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  )
}

export default function BrowserTab() {
  const { teamId, teamName, teamColor } = useLocalSearchParams<{
    teamId: string; teamName: string; teamColor: string
  }>()

  const {
    firewallMode, scores, connected, alert, clearAlert,
    adminPushUrl, clearAdminPush, emitBrowserRegister, emitBrowserState,
    browserLocked, kicked,
  } = useSocket()

  const [inputUrl,         setInputUrl]         = useState('https://httpbin.org/get')
  const [currentRelayUrl,  setCurrentRelayUrl]  = useState(
    relayUrl('https://httpbin.org/get', teamId ?? '')
  )
  const [loading,   setLoading]   = useState(false)
  const [canGoBack, setCanGoBack] = useState(false)
  const [editing,   setEditing]   = useState(false)
  const webViewRef = useRef<WebView>(null)

  const myScore    = scores.find(s => s.teamId === teamId)
  const bypassing  = firewallMode === 'vulnerable'
  const proto      = getProtocol(inputUrl)
  const accentColor = teamColor ?? C.blue

  useEffect(() => {
    if (connected && teamId) emitBrowserRegister(teamId)
  }, [connected, teamId])

  useEffect(() => {
    if (!connected || !teamId) return
    const t = setTimeout(() => {
      emitBrowserState({ teamId, url: inputUrl, title: '', loading })
    }, 400)
    return () => clearTimeout(t)
  }, [inputUrl, loading, connected, teamId])

  useEffect(() => {
    if (adminPushUrl) {
      navigate(adminPushUrl)
      clearAdminPush()
    }
  }, [adminPushUrl])

  function navigate(url: string) {
    const clean = url.trim()
    if (!clean) return
    const full = clean.startsWith('http') ? clean : `https://${clean}`
    setInputUrl(full)
    setCurrentRelayUrl(relayUrl(full, teamId ?? ''))
    setEditing(false)
  }

  const onNavStateChange = useCallback((navState: WebViewNavigation) => {
    setLoading(navState.loading)
    setCanGoBack(navState.canGoBack)
  }, [])

  const onShouldStartLoadWithRequest = useCallback((request: { url: string }) => {
    const { url } = request
    if (url.startsWith(SERVER_URL + '/api/relay')) return true
    if (url.startsWith('data:') || url.startsWith('about:')) return true
    if (url.startsWith('http://') || url.startsWith('https://')) {
      setCurrentRelayUrl(relayUrl(url, teamId ?? ''))
      setInputUrl(url)
      return false
    }
    return true
  }, [teamId])

  return (
    <View style={styles.container}>

      {/* ── Kicked overlay ── */}
      {kicked && (
        <View style={styles.kickedOverlay}>
          <View style={styles.kickedIconBox}>
            <Ionicons name="ban-outline" size={36} color={C.red} />
          </View>
          <Text style={styles.kickedTitle}>Session Ended</Text>
          <Text style={styles.kickedBody}>The admin has ended your relay session.</Text>
        </View>
      )}

      {/* ── Locked banner ── */}
      {browserLocked && (
        <View style={styles.lockedBanner}>
          <Ionicons name="lock-closed" size={12} color={C.yellow} />
          <Text style={styles.lockedText}>Browser locked by administrator</Text>
        </View>
      )}

      {/* ── Alert banner ── */}
      {alert && (
        <TouchableOpacity style={styles.alertBanner} onPress={clearAlert} activeOpacity={0.8}>
          <Ionicons name="warning-outline" size={13} color={C.yellow} />
          <Text style={styles.alertText} numberOfLines={1}>{alert}</Text>
          <Ionicons name="close-outline" size={14} color={C.yellow} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      )}

      {/* ── Status row ── */}
      <View style={styles.statusRow}>
        <StatusPill
          color={bypassing ? C.red : C.green}
          bg={bypassing ? C.redBg : C.greenBg}
          bd={bypassing ? C.redBd : C.greenBd}
          dot
          label={bypassing ? 'Bypass Active' : 'Relay Blocked'}
        />
        <StatusPill
          color={connected ? C.green : C.red}
          bg={connected ? C.greenBg : C.redBg}
          bd={connected ? C.greenBd : C.redBd}
          dot
          label={connected ? 'Live' : 'Offline'}
        />
        {myScore != null && (
          <StatusPill
            color={accentColor}
            bg={accentColor + '15'}
            bd={accentColor + '35'}
            label={`${myScore.totalPoints} pts`}
          />
        )}
      </View>

      {/* ── Browser toolbar ── */}
      <View style={styles.toolbar}>
        {/* Back button */}
        <TouchableOpacity
          onPress={() => canGoBack && webViewRef.current?.goBack()}
          disabled={!canGoBack}
          style={[styles.navBtn, { opacity: canGoBack ? 1 : 0.3 }]}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={19} color={C.sub} />
        </TouchableOpacity>

        {/* Address bar */}
        <TouchableOpacity
          style={[
            styles.addressBar,
            browserLocked && styles.addressBarLocked,
            editing && styles.addressBarFocused,
          ]}
          onPress={() => !browserLocked && setEditing(true)}
          activeOpacity={0.85}
        >
          {/* Protocol / lock icon */}
          <Ionicons
            name={
              browserLocked ? 'lock-closed'
              : proto === 'https' ? 'lock-closed'
              : 'globe-outline'
            }
            size={12}
            color={
              browserLocked ? C.yellow
              : proto === 'https' ? C.green
              : C.muted
            }
          />

          {editing ? (
            <TextInput
              style={styles.urlInput}
              value={inputUrl}
              onChangeText={setInputUrl}
              onSubmitEditing={() => navigate(inputUrl)}
              onBlur={() => setEditing(false)}
              returnKeyType="go"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              selectTextOnFocus
              autoFocus
              placeholderTextColor={C.muted}
              editable={!browserLocked}
            />
          ) : (
            <Text style={styles.urlDisplay} numberOfLines={1}>
              {inputUrl || 'Enter URL…'}
            </Text>
          )}

          {/* Reload / clear */}
          {!browserLocked && (
            <TouchableOpacity
              onPress={() => {
                if (editing) {
                  setInputUrl('')
                } else {
                  webViewRef.current?.reload()
                }
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={editing ? 'close-circle' : 'refresh-outline'}
                size={14}
                color={C.muted}
              />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Go button */}
        <TouchableOpacity
          style={[
            styles.goBtn,
            { backgroundColor: accentColor },
            browserLocked && { opacity: 0.35 },
            ...( (!browserLocked) ? [glowShadow(accentColor)] : [] ),
          ]}
          onPress={browserLocked ? undefined : () => navigate(inputUrl)}
          disabled={browserLocked}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator size="small" color="#fff" style={{ transform: [{ scale: 0.7 }] }} />
            : <Ionicons name="arrow-forward" size={16} color="#fff" />
          }
        </TouchableOpacity>
      </View>

      {/* Loading progress bar */}
      <ProgressBar loading={loading} color={accentColor} />

      {/* ── Speed dial / Quick sites ── */}
      <View style={styles.speedDialContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.speedDialScroll}
        >
          {PRESET_SITES.map(site => (
            <TouchableOpacity
              key={site.url}
              style={styles.speedDialChip}
              onPress={() => navigate(site.url)}
              activeOpacity={0.7}
            >
              <Ionicons name={site.icon} size={12} color={C.blue} />
              <Text style={styles.speedDialLabel}>{site.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── WebView ── */}
      <WebView
        ref={webViewRef}
        source={{ uri: currentRelayUrl }}
        style={styles.webview}
        onNavigationStateChange={onNavStateChange}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingSpinnerBox}>
              <ActivityIndicator color={accentColor} size="large" />
            </View>
            <Text style={styles.loadingTitle}>Routing through tunnel</Text>
            <Text style={styles.loadingBody}>Internet-free · Domain fronting relay active</Text>
          </View>
        )}
        renderError={(errorDomain, errorCode) => (
          <View style={styles.errorOverlay}>
            <View style={[styles.errorIconBox, { borderColor: C.redBd, backgroundColor: C.redBg }]}>
              <Ionicons name="alert-circle-outline" size={30} color={C.red} />
            </View>
            <Text style={styles.errorTitle}>Relay error</Text>
            <Text style={styles.errorBody}>
              {errorCode === -1
                ? 'Cannot reach the relay server. Check your connection.'
                : `Error ${errorCode}: ${errorDomain}`}
            </Text>
            <TouchableOpacity
              style={[styles.retryBtn, { borderColor: C.redBd, backgroundColor: C.redBg }]}
              onPress={() => webViewRef.current?.reload()}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh-outline" size={14} color={C.red} />
              <Text style={[styles.retryText, { color: C.red }]}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}
      />

    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  // ── Overlays ──
  kickedOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
    backgroundColor: C.bg,
    alignItems: 'center', justifyContent: 'center', gap: 14, padding: S.xl,
  },
  kickedIconBox: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: C.redBg, borderWidth: 1, borderColor: C.redBd,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  kickedTitle: { color: C.text, fontSize: 20, fontWeight: '700', fontFamily: F, letterSpacing: -0.4 },
  kickedBody: { color: C.sub, fontSize: 14, fontFamily: F, textAlign: 'center', lineHeight: 21 },

  lockedBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: 'rgba(245,158,11,0.10)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(245,158,11,0.22)',
    paddingHorizontal: 14, paddingVertical: 7,
  },
  lockedText: { color: C.yellow, fontSize: 11.5, fontWeight: '600', fontFamily: F },

  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(245,158,11,0.20)',
    paddingHorizontal: 14, paddingVertical: 9,
  },
  alertText: { flex: 1, color: C.yellow, fontSize: 12, fontFamily: F },

  // ── Status row ──
  statusRow: {
    flexDirection: 'row', gap: 6, flexWrap: 'wrap',
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: R.chip,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 11, fontWeight: '600', fontFamily: F },

  // ── Browser toolbar ──
  toolbar: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 12, paddingVertical: 9,
    backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  navBtn: {
    width: 34, height: 34, borderRadius: R.sm + 2,
    backgroundColor: C.elevated,
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  addressBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.elevated,
    borderWidth: 1, borderColor: C.border,
    borderRadius: R.input + 2,
    paddingHorizontal: 12, paddingVertical: 9,
    minHeight: 38,
  },
  addressBarLocked: {
    borderColor: 'rgba(245,158,11,0.35)',
    backgroundColor: 'rgba(245,158,11,0.07)',
  },
  addressBarFocused: {
    borderColor: 'rgba(59,130,246,0.45)',
    backgroundColor: '#10111f',
  },
  urlInput: {
    flex: 1, color: C.text, fontSize: 13, fontFamily: F, padding: 0,
  },
  urlDisplay: {
    flex: 1, color: C.sub, fontSize: 13, fontFamily: F,
  },
  goBtn: {
    width: 38, height: 38,
    borderRadius: R.input + 2,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Progress bar ──
  progressTrack: {
    height: 2,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // ── Speed dial ──
  speedDialContainer: {
    backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  speedDialScroll: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 7,
  },
  speedDialChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderColor: C.border,
    borderRadius: R.chip,
    paddingHorizontal: 12, paddingVertical: 5,
    backgroundColor: C.elevated,
  },
  speedDialLabel: { color: C.sub, fontSize: 11.5, fontWeight: '500', fontFamily: F },

  // ── WebView ──
  webview: { flex: 1, backgroundColor: C.bg },

  // ── Loading overlay ──
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center',
    gap: 14, padding: S.xl,
  },
  loadingSpinnerBox: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  loadingTitle: { color: C.text, fontSize: 15, fontWeight: '600', fontFamily: F, letterSpacing: -0.2 },
  loadingBody: { color: C.muted, fontSize: 12, fontFamily: F, textAlign: 'center' },

  // ── Error overlay ──
  errorOverlay: {
    flex: 1, backgroundColor: C.bg,
    alignItems: 'center', justifyContent: 'center',
    padding: S.xl, gap: S.md,
  },
  errorIconBox: {
    width: 72, height: 72, borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  errorTitle: { color: C.text, fontSize: 17, fontWeight: '700', fontFamily: F, letterSpacing: -0.3 },
  errorBody: { color: C.sub, fontSize: 13, textAlign: 'center', fontFamily: F, lineHeight: 20 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 6, borderWidth: 1, borderRadius: R.button,
    paddingHorizontal: 18, paddingVertical: 9,
  },
  retryText: { fontSize: 13, fontWeight: '600', fontFamily: F },
})
