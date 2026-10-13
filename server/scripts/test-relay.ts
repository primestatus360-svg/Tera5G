/**
 * Tera5G Relay Integration Tests
 *
 * Runs against a local dev server (npm run dev in server/).
 * Uses Node 18+ built-in fetch — no extra dependencies.
 *
 * Usage:
 *   npm test                          # hits localhost:3001
 *   TEST_SERVER=http://my-server npm test
 */

const BASE       = process.env.TEST_SERVER ?? `http://localhost:${process.env.PORT ?? 3001}`
const ADMIN_KEY  = process.env.ADMIN_KEY   ?? 'tera5g-admin-2024'

// ── Tiny test runner ─────────────────────────────────────────────────────────

let passed = 0, failed = 0
const failures: string[] = []

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn()
    console.log(`  \x1b[32m✓\x1b[0m  ${name}`)
    passed++
  } catch (e: any) {
    console.log(`  \x1b[31m✗\x1b[0m  ${name}`)
    console.log(`      \x1b[2m${e.message}\x1b[0m`)
    failed++
    failures.push(`${name}: ${e.message}`)
  }
}

function eq(actual: any, expected: any, msg?: string) {
  if (actual !== expected)
    throw new Error(msg ?? `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
}

function ok(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg)
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function get(path: string, timeout = 10_000) {
  return fetch(`${BASE}${path}`, { signal: AbortSignal.timeout(timeout) })
}

async function post(path: string, body: unknown, timeout = 10_000) {
  return fetch(`${BASE}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
    signal:  AbortSignal.timeout(timeout),
  })
}

// ── Pre-flight: make sure server is up ───────────────────────────────────────

async function preflight() {
  try {
    const r = await get('/api/ping', 5_000)
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
  } catch (e: any) {
    console.error(`\n\x1b[31mERROR: Cannot reach server at ${BASE}\x1b[0m`)
    console.error('  Start the server:  cd server && npm run dev\n')
    process.exit(1)
  }
}

// ── Test suites ───────────────────────────────────────────────────────────────

let sessionId = ''

async function suiteConnectivity() {
  console.log('\n\x1b[1mConnectivity\x1b[0m')

  await test('/api/ping returns ok + mode', async () => {
    const r = await get('/api/ping')
    eq(r.status, 200, `HTTP ${r.status}`)
    const d: any = await r.json()
    ok(d.ok === true,          'ok should be true')
    ok(typeof d.ts === 'number', 'ts should be a number')
    ok(d.mode === 'vulnerable' || d.mode === 'patched', `unexpected mode: ${d.mode}`)
  })

  await test('/api/status returns system info', async () => {
    const r = await get('/api/status')
    eq(r.status, 200, `HTTP ${r.status}`)
    const d: any = await r.json()
    ok('firewallMode' in d, 'missing firewallMode')
    ok('activeTeams'  in d, 'missing activeTeams')
  })

  await test('/api/ping is unauthenticated (no session needed)', async () => {
    const r = await get('/api/ping')
    ok(r.status !== 401 && r.status !== 403, `should not need auth, got ${r.status}`)
  })
}

async function suiteSessionValidation() {
  console.log('\n\x1b[1mSession Validation\x1b[0m')

  await test('/api/browse without sessionId returns 400', async () => {
    const r = await get(`/api/browse?url=${encodeURIComponent('https://example.com')}`)
    eq(r.status, 400, `HTTP ${r.status}`)
  })

  await test('/api/browse without url returns 400', async () => {
    const r = await get('/api/browse?sessionId=test')
    eq(r.status, 400, `HTTP ${r.status}`)
  })

  await test('/api/browse with invalid sessionId returns 401', async () => {
    const r = await get(
      `/api/browse?url=${encodeURIComponent('https://example.com')}&sessionId=definitely-invalid`,
    )
    eq(r.status, 401, `HTTP ${r.status}`)
  })

  await test('/api/browse with empty sessionId returns 401', async () => {
    const r = await get(
      `/api/browse?url=${encodeURIComponent('https://example.com')}&sessionId=`,
    )
    eq(r.status, 401, `HTTP ${r.status}`)
  })
}

async function suiteAdminGrant() {
  console.log('\n\x1b[1mAdmin — Session Grant\x1b[0m')

  await test('POST /api/admin/pay/grant rejects wrong admin key', async () => {
    const r = await post('/api/admin/pay/grant', {
      adminKey: 'wrong-key', phone: '256700000001', plan: '6h',
    })
    eq(r.status, 403, `HTTP ${r.status}`)
  })

  await test('POST /api/admin/pay/grant creates active session', async () => {
    const r = await post('/api/admin/pay/grant', {
      adminKey: ADMIN_KEY, phone: '256700000000', plan: '6h',
    })
    eq(r.status, 200, `HTTP ${r.status}`)
    const d: any = await r.json()
    ok(d.ok === true,                   'ok should be true')
    ok(typeof d.sessionId === 'string', 'sessionId should be a string')
    ok(d.sessionId.length > 0,          'sessionId should not be empty')
    ok(d.expiresAt > Date.now(),        'expiresAt should be in the future')
    sessionId = d.sessionId
    console.log(`\x1b[2m      session: ${sessionId.slice(0, 20)}…\x1b[0m`)
  })
}

async function suiteRelayChain() {
  console.log('\n\x1b[1mRelay Chain  (requires internet on server)\x1b[0m')

  if (!sessionId) {
    console.log('  \x1b[33m⚠\x1b[0m  Skipped — no session (admin grant test must pass first)')
    return
  }

  await test('Relay fetches example.com and returns 200', async () => {
    const url = encodeURIComponent('https://example.com')
    const r = await get(`/api/browse?url=${url}&sessionId=${sessionId}`, 30_000)
    eq(r.status, 200, `HTTP ${r.status}`)
  })

  await test('Relay HTML response contains <html> tag', async () => {
    const url = encodeURIComponent('https://example.com')
    const r = await get(`/api/browse?url=${url}&sessionId=${sessionId}`, 30_000)
    const html = await r.text()
    ok(html.toLowerCase().includes('<html'), 'response should contain <html>')
  })

  await test('Relay injects <base> tag into HTML', async () => {
    const url = encodeURIComponent('https://example.com')
    const r = await get(`/api/browse?url=${url}&sessionId=${sessionId}`, 30_000)
    const html = await r.text()
    ok(html.toLowerCase().includes('<base '), 'response should contain <base> tag')
  })

  await test('Relay strips X-Frame-Options header', async () => {
    const url = encodeURIComponent('https://example.com')
    const r = await get(`/api/browse?url=${url}&sessionId=${sessionId}`, 30_000)
    ok(!r.headers.has('x-frame-options'), 'X-Frame-Options should be stripped')
  })

  await test('Relay sets X-Tera5G-Relay: cloudflare header', async () => {
    const url = encodeURIComponent('https://example.com')
    const r = await get(`/api/browse?url=${url}&sessionId=${sessionId}`, 30_000)
    eq(r.headers.get('x-tera5g-relay'), 'cloudflare', 'missing relay header')
  })

  await test('Relay proxies JSON sub-resource (httpbin)', async () => {
    const url = encodeURIComponent('https://httpbin.org/json')
    const r = await get(`/api/browse?url=${url}&sessionId=${sessionId}`, 30_000)
    eq(r.status, 200, `HTTP ${r.status}`)
    const ct = r.headers.get('content-type') ?? ''
    ok(ct.includes('json'), `expected JSON content-type, got ${ct}`)
  })

  await test('Relay handles redirect (HTTP → HTTPS)', async () => {
    // http://example.com redirects to https://example.com
    const url = encodeURIComponent('http://example.com')
    const r = await get(`/api/browse?url=${url}&sessionId=${sessionId}`, 30_000)
    // Node http.request follows redirects through our logic
    eq(r.status, 200, `HTTP ${r.status}`)
  })
}

async function suiteVouchers() {
  console.log('\n\x1b[1mVoucher System\x1b[0m')

  await test('POST /api/pay/redeem with invalid code returns 400', async () => {
    const r = await post('/api/pay/redeem', { code: 'TOTALLY-FAKE-CODE-XYZ' })
    eq(r.status, 400, `HTTP ${r.status}`)
  })

  await test('POST /api/pay/redeem with empty code returns 400', async () => {
    const r = await post('/api/pay/redeem', { code: '' })
    eq(r.status, 400, `HTTP ${r.status}`)
  })
}

async function suiteFirewall() {
  console.log('\n\x1b[1mFirewall\x1b[0m')

  await test('GET /api/firewall returns current mode', async () => {
    const r = await get('/api/firewall')
    eq(r.status, 200, `HTTP ${r.status}`)
    const d: any = await r.json()
    ok('mode' in d, 'missing mode field')
  })
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n\x1b[1m━━━  Tera5G Relay System — Integration Tests  ━━━\x1b[0m')
  console.log(`  Server : \x1b[2m${BASE}\x1b[0m`)
  console.log(`  Admin  : \x1b[2m${ADMIN_KEY.slice(0, 6)}…\x1b[0m`)

  await preflight()

  await suiteConnectivity()
  await suiteSessionValidation()
  await suiteAdminGrant()
  await suiteRelayChain()
  await suiteVouchers()
  await suiteFirewall()

  // ── Summary ───────────────────────────────────────────────────────────────
  const total = passed + failed
  console.log(`\n${'━'.repeat(50)}`)
  if (failed === 0) {
    console.log(`\x1b[32m✓  All ${total} tests passed\x1b[0m\n`)
  } else {
    console.log(`\x1b[31m✗  ${failed} / ${total} tests failed\x1b[0m`)
    failures.forEach(f => console.log(`   \x1b[2m• ${f}\x1b[0m`))
    console.log('')
  }

  process.exit(failed > 0 ? 1 : 0)
}

main().catch(err => {
  console.error(`\n\x1b[31mFatal: ${err.message}\x1b[0m\n`)
  process.exit(1)
})
