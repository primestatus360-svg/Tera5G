#!/usr/bin/env node
/**
 * Manual Windows packaging script.
 * Bypasses electron-builder's unpack-electron step (which Defender deletes)
 * by copying the already-trusted electron binary from node_modules/electron/dist.
 */

const fs   = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const archiver = require('archiver')

const ROOT      = path.resolve(__dirname, '..')
const DIST      = path.join(ROOT, 'dist-app')
const UNPACKED  = path.join(DIST, 'win-unpacked')
const ELECTRON  = path.join(ROOT, 'node_modules', 'electron', 'dist')
const APP_NAME  = 'Tera5G Browser'

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name)
    const d = path.join(dst, entry.name)
    if (entry.isDirectory()) copyDir(s, d)
    else fs.copyFileSync(s, d)
  }
}

// ── 1. Build ──────────────────────────────────────────────────────────────────
console.log('▸ Building with electron-vite…')
execSync('npx electron-vite build', { cwd: ROOT, stdio: 'inherit' })

// ── 2. Prepare output dir ─────────────────────────────────────────────────────
console.log('▸ Preparing win-unpacked…')
fs.rmSync(UNPACKED, { recursive: true, force: true })
fs.mkdirSync(UNPACKED, { recursive: true })

// ── 3. Copy trusted electron distribution ────────────────────────────────────
console.log('▸ Copying electron distribution from node_modules…')
copyDir(ELECTRON, UNPACKED)

// ── 4. Set up app directory inside resources ──────────────────────────────────
const appDir = path.join(UNPACKED, 'resources', 'app')
fs.mkdirSync(appDir, { recursive: true })

// Copy compiled main/preload/renderer
copyDir(path.join(ROOT, 'out'), path.join(appDir, 'out'))

// Minimal package.json so Electron knows the entry point
fs.writeFileSync(path.join(appDir, 'package.json'), JSON.stringify({
  name:    'tera5g-browser',
  version: '1.0.0',
  main:    'out/main/index.js',
}, null, 2))

// ── 5. Copy extra resources (HTML pages) ─────────────────────────────────────
const resDir = path.join(UNPACKED, 'resources')
for (const f of ['newtab.html', 'error.html', 'paywall.html']) {
  fs.copyFileSync(path.join(ROOT, 'resources', f), path.join(resDir, f))
}

// ── 6. Rename electron.exe → app name ────────────────────────────────────────
console.log(`▸ Renaming electron.exe → "${APP_NAME}.exe"…`)
fs.renameSync(
  path.join(UNPACKED, 'electron.exe'),
  path.join(UNPACKED, `${APP_NAME}.exe`)
)

// ── 7. Zip the unpacked folder ────────────────────────────────────────────────
console.log('▸ Zipping…')
const zipPath = path.join(DIST, `${APP_NAME.replace(/ /g, '-')}-win-x64.zip`)

const output = fs.createWriteStream(zipPath)
const archive = archiver('zip', { zlib: { level: 6 } })

output.on('close', () => {
  const mb = (archive.pointer() / 1024 / 1024).toFixed(1)
  console.log(`\n✓ Done → dist-app/${APP_NAME.replace(/ /g, '-')}-win-x64.zip (${mb} MB)`)
})
archive.on('error', err => { throw err })

archive.pipe(output)
archive.directory(UNPACKED, APP_NAME)
archive.finalize()
