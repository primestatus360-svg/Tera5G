import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { C, R, S, F, iconBox } from '../../constants/theme'

const STEPS = [
  {
    icon: 'lock-closed-outline' as const,
    color: C.blue,
    title: 'TLS Handshake',
    body: 'Your device opens a TLS connection. The SNI field in the ClientHello is visible in plaintext — this is what firewalls read to decide whether to allow the connection.',
  },
  {
    icon: 'eye-outline' as const,
    color: C.yellow,
    title: 'Firewall Inspection',
    body: 'A vulnerable firewall only reads the SNI field. If the SNI matches an allowed domain (e.g. free.telecom5g.com), it permits the connection without inspecting what is inside the encrypted tunnel.',
  },
  {
    icon: 'swap-horizontal-outline' as const,
    color: C.purple,
    title: 'Domain Fronting',
    body: 'Once the TLS tunnel is open, the HTTP Host header inside points to a different destination — the blocked site. The firewall sees an allowed SNI but traffic reaches the blocked server.',
  },
  {
    icon: 'shield-checkmark-outline' as const,
    color: C.green,
    title: 'Mitigation: JA3 Fingerprinting',
    body: 'A patched firewall computes a JA3 hash from TLS ClientHello parameters — version, cipher suites, extensions, curves. Hashes matching known domain-fronting tools are blocked regardless of SNI.',
  },
  {
    icon: 'git-compare-outline' as const,
    color: C.red,
    title: 'Mitigation: SNI / Host Correlation',
    body: 'The firewall correlates the TLS SNI with the HTTP Host header inside the tunnel. If they differ (SNI = allowed.com, Host = blocked.com), the connection is dropped.',
  },
]

const JA3_FIELDS = [
  { label: 'TLS Version',      value: '772 (TLS 1.3)' },
  { label: 'Cipher Suites',    value: '4866-4867-4865-…' },
  { label: 'Extensions',       value: '0-23-10-11-35-…' },
  { label: 'Elliptic Curves',  value: '29-23-24' },
  { label: 'EC Point Formats', value: '0' },
]

const FLOW_NODES = [
  { label: 'Your Device', color: C.blue,   sub: 'SNI = allowed.com',     icon: 'phone-portrait-outline' as const },
  { label: 'Firewall',    color: C.yellow,  sub: 'Reads SNI only',        icon: 'shield-outline'         as const },
  { label: 'CDN Edge',    color: C.purple,  sub: 'Forwards Host header',  icon: 'cloud-outline'          as const },
  { label: 'Blocked Site',color: C.red,     sub: 'Actual destination',    icon: 'globe-outline'          as const },
]

export default function HowTo() {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Page header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>How Domain Fronting Works</Text>
        <Text style={styles.pageSubtitle}>
          A firewall bypass technique that exploits the gap between TLS metadata and the encrypted HTTP payload.
        </Text>
      </View>

      {/* Steps */}
      {STEPS.map((step, i) => (
        <View key={step.title} style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={iconBox(step.color)}>
              <Ionicons name={step.icon} size={18} color={step.color} />
            </View>
            <View style={[styles.stepNumBadge, { backgroundColor: step.color + '15', borderColor: step.color + '30' }]}>
              <Text style={[styles.stepNum, { color: step.color }]}>Step {i + 1}</Text>
            </View>
          </View>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepBody}>{step.body}</Text>
        </View>
      ))}

      {/* JA3 breakdown */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="code-outline" size={14} color={C.cyan} />
          <Text style={styles.sectionLabel}>JA3 Fingerprint Anatomy</Text>
        </View>
        <Text style={styles.sectionDesc}>
          JA3 = MD5(TLSVersion, Ciphers, Extensions, EllipticCurves, ECPointFormats)
        </Text>
        <View style={styles.table}>
          {JA3_FIELDS.map((f, idx) => (
            <View
              key={f.label}
              style={[styles.tableRow, idx < JA3_FIELDS.length - 1 && styles.tableRowBorder]}
            >
              <Text style={styles.tableLabel}>{f.label}</Text>
              <Text style={styles.tableValue}>{f.value}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.tableNote}>
          GREASE values (RFC 8701) are filtered before hashing for cross-implementation consistency.
        </Text>
      </View>

      {/* Traffic flow */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="git-branch-outline" size={14} color={C.purple} />
          <Text style={styles.sectionLabel}>Attack Traffic Flow</Text>
        </View>
        <View style={styles.flow}>
          {FLOW_NODES.map((node, i) => (
            <View key={node.label} style={styles.flowItem}>
              <View style={[styles.flowNode, { borderColor: node.color + '45', backgroundColor: node.color + '0e' }]}>
                <Ionicons name={node.icon} size={15} color={node.color} />
                <View>
                  <Text style={[styles.flowNodeText, { color: node.color }]}>{node.label}</Text>
                  <Text style={styles.flowNodeSub}>{node.sub}</Text>
                </View>
              </View>
              {i < FLOW_NODES.length - 1 && (
                <View style={styles.flowArrow}>
                  <View style={[styles.flowLine, { backgroundColor: FLOW_NODES[i + 1].color + '40' }]} />
                  <Ionicons name="chevron-down" size={14} color={C.muted} />
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Ionicons name="information-circle-outline" size={14} color={C.muted} />
        <Text style={styles.footerText}>
          Technique: Domain Fronting · Protocol: TCP/443{'\n'}
          Detection: JA3 fingerprinting + SNI/Host correlation
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  container: { padding: S.md, gap: 12, paddingBottom: 48 },

  pageHeader: {
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.border,
    borderRadius: R.card, padding: 20, gap: 8, marginBottom: 4,
  },
  pageTitle: {
    fontSize: 20, fontWeight: '800', color: C.text,
    letterSpacing: -0.5, fontFamily: F,
  },
  pageSubtitle: {
    fontSize: 13.5, color: C.sub, lineHeight: 21, fontFamily: F,
  },

  stepCard: {
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.border,
    borderRadius: R.card, padding: 18, gap: 6,
  },
  stepHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  stepNumBadge: {
    borderWidth: 1, borderRadius: R.badge,
    paddingHorizontal: 9, paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  stepNum: { fontSize: 10, fontWeight: '700', fontFamily: F },
  stepTitle: {
    fontSize: 15, fontWeight: '700', color: C.text,
    letterSpacing: -0.2, fontFamily: F,
  },
  stepBody: { fontSize: 13, color: C.sub, lineHeight: 20, fontFamily: F },

  section: {
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.border,
    borderRadius: R.card, padding: 18, gap: 12,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sectionLabel: { fontSize: 13.5, fontWeight: '700', color: C.text, fontFamily: F },
  sectionDesc:  { fontSize: 12, color: C.sub, fontFamily: F, lineHeight: 18 },

  table: { gap: 0 },
  tableRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10,
  },
  tableRowBorder: {
    borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  tableLabel: { fontSize: 12, color: C.muted, fontFamily: F },
  tableValue: { fontSize: 12, color: C.text, fontFamily: F, fontWeight: '500' },
  tableNote:  { fontSize: 11, color: C.muted, lineHeight: 17, fontFamily: F },

  flow: { gap: 0, alignItems: 'stretch' },
  flowItem: { alignItems: 'center' },
  flowNode: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderRadius: R.input + 2,
    paddingHorizontal: 16, paddingVertical: 12,
    alignSelf: 'stretch',
  },
  flowNodeText: { fontSize: 13, fontWeight: '600', fontFamily: F },
  flowNodeSub:  { fontSize: 11, color: C.muted, marginTop: 2, fontFamily: F },
  flowArrow: { alignItems: 'center', gap: 0, paddingVertical: 2 },
  flowLine: { width: 2, height: 6, borderRadius: 1 },

  footer: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 9,
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.border,
    borderRadius: R.input, padding: 14,
  },
  footerText: { color: C.muted, fontSize: 12, lineHeight: 19, fontFamily: F, flex: 1 },
})
