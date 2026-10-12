import { app, BrowserWindow, WebContentsView, ipcMain } from 'electron'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { is } from '@electron-toolkit/utils'

const TABBAR_H   = 32
const NAVBAR_H   = 40
const TOOLBAR_H  = TABBAR_H + NAVBAR_H   // 72 px total
const PROXY      = process.env.TERA5G_PROXY  ?? 'http://127.0.0.1:8080'
const SERVER_URL = process.env.TERA5G_SERVER ?? (is.dev ? 'http://localhost:3001' : 'https://your-app.up.railway.app')

interface Tab {
  id:      string
  view:    WebContentsView
  url:     string
  title:   string
  loading: boolean
}

interface StoredSession {
  sessionId: string
  plan:      string
  expiresAt: number
}

let win: BrowserWindow
const tabs   = new Map<string, Tab>()
let activeId = ''
let sessionActive = false

// ── Session helpers ───────────────────────────────────────────────────────────

function sessionFilePath(): string {
  return join(app.getPath('userData'), 'tera5g-session.json')
}

function readStoredSession(): StoredSession | null {
  try {
    const p = sessionFilePath()
    if (!existsSync(p)) return null
    const s: StoredSession = JSON.parse(readFileSync(p, 'utf-8'))
    if (!s.expiresAt || s.expiresAt < Date.now()) return null
    return s
  } catch { return null }
}

function writeStoredSession(s: StoredSession): void {
  try { writeFileSync(sessionFilePath(), JSON.stringify(s)) } catch { /* ignore */ }
}

function clearStoredSession(): void {
  try {
    const p = sessionFilePath()
    if (existsSync(p)) { writeFileSync(p, '{}') }
  } catch { /* ignore */ }
}

// ── Path helpers ──────────────────────────────────────────────────────────────

function newtabPath(): string {
  return is.dev
    ? join(__dirname, '../../resources/newtab.html')
    : join(process.resourcesPath, 'newtab.html')
}

function paywallPath(): string {
  return is.dev
    ? join(__dirname, '../../resources/paywall.html')
    : join(process.resourcesPath, 'paywall.html')
}

function errorPath(): string {
  return is.dev
    ? join(__dirname, '../../resources/error.html')
    : join(process.resourcesPath, 'error.html')
}

// ── Push helpers ──────────────────────────────────────────────────────────────

function push(channel: string, payload?: unknown): void {
  if (!win.isDestroyed()) win.webContents.send(channel, payload)
}

function pushTabs(): void {
  push('tabs', {
    list:     Array.from(tabs.values()).map(t => ({ id: t.id, url: t.url, title: t.title, loading: t.loading })),
    activeId,
  })
}

function pushNav(t: Tab): void {
  push('nav', {
    url:     t.url,
    canBack: t.view.webContents.navigationHistory.canGoBack(),
    canFwd:  t.view.webContents.navigationHistory.canGoForward(),
    loading: t.loading,
  })
}

function layout(): void {
  if (!win || !activeId) return
  const tab = tabs.get(activeId)
  if (!tab) return
  const { width, height } = win.getContentBounds()
  tab.view.setBounds({ x: 0, y: TOOLBAR_H, width, height: Math.max(0, height - TOOLBAR_H) })
}

// ── Session activation ────────────────────────────────────────────────────────

function activateSession(data: StoredSession): void {
  sessionActive = true
  writeStoredSession(data)
  // Reload all tabs that are still showing the paywall → go to newtab
  for (const tab of tabs.values()) {
    const cur = tab.view.webContents.getURL()
    if (cur.startsWith('file://') && cur.includes('paywall')) {
      tab.view.webContents.loadFile(newtabPath())
    }
  }
  // Broadcast pay-confirmed to all tab renderers
  for (const tab of tabs.values()) {
    if (!tab.view.webContents.isDestroyed()) {
      tab.view.webContents.send('pay-confirmed', { plan: data.plan, expiresAt: data.expiresAt })
    }
  }
}

// ── Tab management ────────────────────────────────────────────────────────────

function createTab(url?: string): string {
  const id         = randomUUID()
  const tabPreload = join(__dirname, '../preload/tab.js')
  const view       = new WebContentsView({ webPreferences: { contextIsolation: true, sandbox: true, preload: tabPreload } })
  view.setBackgroundColor('#000000')

  const tab: Tab = { id, view, url: '', title: 'New Tab', loading: false }
  tabs.set(id, tab)
  win.contentView.addChildView(view)
  view.setBounds({ x: 0, y: TOOLBAR_H, width: 0, height: 0 })

  view.webContents.session.setProxy({ proxyRules: PROXY })

  view.webContents.on('did-navigate', (_, u) => {
    if (!u.startsWith('file://')) tab.url = u
    tab.loading = false; pushTabs()
    if (id === activeId) pushNav(tab)
  })
  view.webContents.on('did-navigate-in-page', (_, u) => {
    if (!u.startsWith('file://')) tab.url = u
    pushTabs()
    if (id === activeId) pushNav(tab)
  })
  view.webContents.on('did-start-loading', () => {
    tab.loading = true; pushTabs()
    if (id === activeId) push('nav', { loading: true })
  })
  view.webContents.on('did-stop-loading', () => {
    tab.loading = false
    const cur = view.webContents.getURL()
    if (!cur.startsWith('file://')) tab.url = cur
    pushTabs()
    if (id === activeId) pushNav(tab)
  })
  view.webContents.on('page-title-updated', (_, title) => {
    tab.title = title || 'New Tab'; pushTabs()
    if (id === activeId) win.setTitle(`${title} — Tera5G`)
  })
  view.webContents.on('did-fail-load', (_, code, _desc, u) => {
    if (code === -3 || u?.startsWith('file://')) return
    tab.loading = false
    if (u) tab.url = u
    pushTabs()
    if (id === activeId) pushNav(tab)
    view.webContents.loadFile(errorPath(), { query: { url: u ?? '' } }).catch(() => {})
  })
  view.webContents.setWindowOpenHandler(({ url: u }) => {
    const nid = createTab(u)
    switchTab(nid)
    return { action: 'deny' }
  })

  if (url) {
    view.webContents.loadURL(url)
  } else if (!sessionActive) {
    view.webContents.loadFile(paywallPath())
  } else {
    view.webContents.loadFile(newtabPath())
  }
  return id
}

function switchTab(id: string): void {
  if (!tabs.has(id)) return
  const prev = tabs.get(activeId)
  if (prev) prev.view.setBounds({ x: 0, y: TOOLBAR_H, width: 0, height: 0 })
  activeId = id
  layout()
  const tab = tabs.get(id)!
  tab.view.webContents.focus()
  pushNav(tab)
  pushTabs()
}

function closeTab(id: string): void {
  const tab = tabs.get(id)
  if (!tab) return
  win.contentView.removeChildView(tab.view)
  try { tab.view.webContents.close() } catch { /* already closed */ }
  tabs.delete(id)

  if (tabs.size === 0) { switchTab(createTab()); return }
  if (activeId === id) switchTab(Array.from(tabs.keys()).at(-1)!)
  else pushTabs()
}

// ── Window ────────────────────────────────────────────────────────────────────

function createWindow(): void {
  // Check persisted session before opening the window
  const stored = readStoredSession()
  if (stored) sessionActive = true

  win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 500,
    backgroundColor: '#000000',
    titleBarStyle:   process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    titleBarOverlay: process.platform !== 'darwin'
      ? { color: '#000000', symbolColor: 'rgba(255,255,255,0.85)', height: TABBAR_H }
      : false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: false,
    },
  })

  win.on('resize',             layout)
  win.on('enter-full-screen',  layout)
  win.on('leave-full-screen',  layout)

  // ── IPC ──────────────────────────────────────────────────────────────────

  ipcMain.handle('get-proxy', () => PROXY)

  ipcMain.on('new-tab',    () => switchTab(createTab()))
  ipcMain.on('close-tab',  (_, id: string) => closeTab(id))
  ipcMain.on('switch-tab', (_, id: string) => switchTab(id))

  ipcMain.on('go', (_, url: string) => {
    const t = url.trim()
    if (!t) return
    if (!sessionActive) {
      tabs.get(activeId)?.view.webContents.loadFile(paywallPath())
      return
    }
    const full = /^[a-z][a-z0-9+\-.]*:\/\//i.test(t) ? t : `https://${t}`
    tabs.get(activeId)?.view.webContents.loadURL(full)
  })

  ipcMain.on('back',   () => tabs.get(activeId)?.view.webContents.navigationHistory.goBack())
  ipcMain.on('fwd',    () => tabs.get(activeId)?.view.webContents.navigationHistory.goForward())
  ipcMain.on('reload', () => tabs.get(activeId)?.view.webContents.reload())
  ipcMain.on('stop',   () => tabs.get(activeId)?.view.webContents.stop())
  ipcMain.on('home',   () => {
    if (!sessionActive) {
      tabs.get(activeId)?.view.webContents.loadFile(paywallPath())
    } else {
      tabs.get(activeId)?.view.webContents.loadFile(newtabPath())
    }
  })
  ipcMain.on('tab-devtools', () => tabs.get(activeId)?.view.webContents.openDevTools())

  // ── Payment IPC ───────────────────────────────────────────────────────────

  ipcMain.handle('pay-initiate', async (_, data: { phone: string; plan: string; provider: string }) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/pay/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (err) {
      return { error: 'Could not reach payment server. Check your connection.' }
    }
  })

  ipcMain.handle('pay-redeem', async (_, code: string) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/pay/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const result = await res.json() as { success?: boolean; sessionId?: string; plan?: string; expiresAt?: number; error?: string }
      if (result.success && result.sessionId && result.plan && result.expiresAt) {
        activateSession({ sessionId: result.sessionId, plan: result.plan, expiresAt: result.expiresAt })
      }
      return result
    } catch {
      return { error: 'Could not reach server.' }
    }
  })

  ipcMain.handle('pay-status', async (_, sessionId: string) => {
    try {
      const res    = await fetch(`${SERVER_URL}/api/pay/status/${sessionId}`)
      const result = await res.json() as { status: string; plan: string; expiresAt: number }

      if (result.status === 'active') {
        activateSession({ sessionId, plan: result.plan, expiresAt: result.expiresAt })
      }
      return result
    } catch {
      return { status: 'pending' }
    }
  })

  // ── Session expiry watchdog ───────────────────────────────────────────────

  setInterval(() => {
    if (!sessionActive) return
    const s = readStoredSession()
    if (!s) {
      sessionActive = false
      clearStoredSession()
      for (const tab of tabs.values()) {
        tab.view.webContents.loadFile(paywallPath())
      }
    }
  }, 60_000)

  // ── Boot ─────────────────────────────────────────────────────────────────

  const firstId = createTab()
  switchTab(firstId)

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
