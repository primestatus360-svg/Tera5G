const fs   = require('fs')
const path = require('path')

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.error(`\nERROR: Build not found at ${src}\n`)
    process.exit(1)
  }
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name)
    const d = path.join(dest, entry.name)
    if (entry.isDirectory()) copyDir(s, d)
    else fs.copyFileSync(s, d)
  }
}

const root = path.join(__dirname, '..')

// Landing page → public root (main entry point at /)
const landingSrc = path.join(root, 'landing', 'dist')
const publicDest = path.join(root, 'server', 'public')
console.log(`Copying landing page:\n  ${landingSrc}\n  → ${publicDest}`)
copyDir(landingSrc, publicDest)

// Mobile/game client → /play
const mobileSrc = path.join(root, 'mobile', 'dist')
const playDest  = path.join(root, 'server', 'public', 'play')
if (fs.existsSync(mobileSrc)) {
  console.log(`Copying mobile app:\n  ${mobileSrc}\n  → ${playDest}`)
  copyDir(mobileSrc, playDest)
} else {
  console.warn('Warning: mobile/dist not found — skipping /play build.')
}

// Admin dashboard → /admin
const adminSrc  = path.join(root, 'web', 'dist')
const adminDest = path.join(root, 'server', 'public', 'admin')
if (fs.existsSync(adminSrc)) {
  console.log(`Copying admin dashboard:\n  ${adminSrc}\n  → ${adminDest}`)
  copyDir(adminSrc, adminDest)
} else {
  console.warn('Warning: web/dist not found — skipping /admin build.')
}

console.log('\nDone — web builds ready to serve.\n')
