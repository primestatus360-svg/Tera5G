# Tera5G — Setup & Build Guide

## Project Structure

```
Tera5G/
├── android/          ← Android app (Kotlin + Jetpack Compose)
├── backend/          ← Node.js backend (TypeScript + Express + SQLite)
└── SETUP.md          ← This file
```

---

## Step 1: Download Required Native Libraries

The Android app needs two compiled native libraries that are NOT included in this repo.

### A) libv2ray.aar (V2Ray/Xray core)
1. Go to: https://github.com/2dust/AndroidLibXray/releases/latest
2. Download `libv2ray.aar`
3. Place it at: `android/app/libs/libv2ray.aar`

### B) libtun2socks.so (per ABI)
1. Go to: https://github.com/eycorsican/go-tun2socks/releases
   OR download from the badvpn project: https://github.com/ambrop72/badvpn
2. You need the `.so` compiled for each ABI:
   - `arm64-v8a/libtun2socks.so`
   - `armeabi-v7a/libtun2socks.so`
   - `x86_64/libtun2socks.so`
3. Place them at: `android/app/src/main/jniLibs/<abi>/libtun2socks.so`

Alternative: You can also extract tun2socks from an existing v2rayNG APK release
(open the APK as a ZIP, find `lib/<abi>/libtun2socks.so`).

---

## Step 2: Configure Android Build

Create `android/local.properties` (do NOT commit this file):

```properties
sdk.dir=/path/to/your/Android/SDK
BACKEND_URL=https://api.tera5g.app
CONFIG_AES_KEY=<64-char hex key — must match backend CONFIG_AES_KEY>
```

Generate the AES key:
```bash
openssl rand -hex 32
```

---

## Step 3: Set Up the Database (Supabase)

1. Go to [supabase.com](https://supabase.com) and create a free project
2. After the project provisions, go to **Project Settings → Database → Connection string → URI**
3. Copy the connection string — it looks like:
   ```
   postgresql://postgres:[password]@[host]:5432/postgres
   ```
4. Set it as `DATABASE_URL` in your `.env`

### Push the schema (first time only):
```bash
cd backend
npm install
npm run db:push    # creates tables in Supabase
```

After schema push, Supabase dashboard will show the `device_access`, `payments`, and `server_configs` tables.

---

## Step 4: Set Up the Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your Supabase URL, Flutterwave keys, and generated secrets
npm install       # also runs prisma generate automatically
npm run dev       # development
npm run build && npm start  # production
```

### Required .env values:
| Key | Where to get it |
|-----|----------------|
| `DATABASE_URL` | Supabase > Project Settings > Database > Connection string (URI) |
| `FLW_SECRET_KEY` | Flutterwave Dashboard > API Keys |
| `FLW_PUBLIC_KEY` | Flutterwave Dashboard > API Keys |
| `FLW_HASH` | Flutterwave Dashboard > Settings > Webhooks |
| `CONFIG_AES_KEY` | `openssl rand -hex 32` — same value as in Android local.properties |
| `ADMIN_KEY` | Any strong random string |

### Configure Flutterwave Webhook:
- URL: `https://your-backend-domain.com/api/pay/webhook`
- Events: `charge.completed`
- Secret Hash: set as `FLW_HASH` in .env

---

## Step 5: Set Up a VPN Server with VLESS+Reality

Install Xray-core on a fresh Ubuntu 22.04 VPS (Hetzner/Vultr, ~€4/month):

```bash
# Install Xray-core
bash -c "$(curl -L https://github.com/XTLS/Xray-install/raw/main/install-release.sh)" @ install

# Generate a VLESS UUID and X25519 keypair
xray uuid           # → your server UUID
xray x25519         # → privateKey + publicKey (save both)

# Generate a shortId (8 hex chars)
openssl rand -hex 4
```

Minimal Xray config at `/usr/local/etc/xray/config.json`:
```json
{
  "inbounds": [{
    "port": 443,
    "protocol": "vless",
    "settings": {
      "clients": [{ "id": "YOUR_UUID", "flow": "xtls-rprx-vision" }],
      "decryption": "none"
    },
    "streamSettings": {
      "network": "tcp",
      "security": "reality",
      "realitySettings": {
        "dest": "www.microsoft.com:443",
        "serverNames": ["www.microsoft.com"],
        "privateKey": "YOUR_PRIVATE_KEY",
        "shortIds": ["YOUR_SHORT_ID"]
      }
    }
  }],
  "outbounds": [{ "protocol": "freedom" }]
}
```

```bash
systemctl restart xray
```

### Add servers to Tera5G backend:

```bash
curl -X POST https://your-backend.com/api/admin/config \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: YOUR_ADMIN_KEY" \
  -d @your_server_config.json
```

Server config format (see `android/app/src/main/assets/emergency_config.json`):
- `group`: `"highspeed"` | `"ultrasecure"` | `"lightning"` | `"fallback"`
- `protocol`: `"vmess"` | `"vless"` | `"trojan"` | `"ss"` | `"hysteria2"` | `"ssh"`
- For VLESS+Reality: set `"useReality": true`, `"realityPublicKey"`, `"realityShortId"`, `"realityServerName"`, `"tls": false`
- Map to UI labels: highspeed→"High Speed", ultrasecure→"Ultra Secure", lightning→"Lightning"

---

## Step 6: Build the Android App

```bash
cd android
./gradlew assembleDebug    # debug APK
./gradlew assembleRelease  # production APK (needs signing config)
```

For release signing, add to `android/local.properties`:
```properties
KEYSTORE_PATH=/path/to/tera5g.keystore
KEYSTORE_PASSWORD=...
KEY_ALIAS=tera5g
KEY_PASSWORD=...
```

---

## Payment Flow (Yo! Uganda)

### Getting Yo! Uganda credentials:
1. Register as a merchant at [yo.co.ug](https://www.yo.co.ug/)
2. Once approved, you receive `YO_API_USERNAME` and `YO_API_PASSWORD`
3. Email Yo! Uganda support with your server's static IP to get it whitelisted
   - Oracle Cloud VPS gives you a static public IP automatically
   - Without whitelisting, all API calls will be rejected

### Configure your webhook URL with Yo!:
Set your `PUBLIC_URL` in `.env` so the backend generates the right webhook URL:
```
PUBLIC_URL=https://api.tera5g.app
```
Yo! Uganda will POST to: `https://api.tera5g.app/api/pay/webhook`

### Testing:
1. Set `YO_API_USERNAME` and `YO_API_PASSWORD` in `.env`
2. Use a real MTN or Airtel Uganda number (Yo! has no sandbox — test with small amounts)
3. User receives a USSD prompt on their phone → approves → webhook fires → access activates
4. App polls `/api/pay/status` and detects `"active"`, navigates to HomeScreen

---

## Granting Free Access (Admin)

```bash
curl -X POST https://your-backend.com/api/admin/grant \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: YOUR_ADMIN_KEY" \
  -d '{"deviceId": "<64-char device hash>", "plan": "24h"}'
```

---

## VPN Architecture Summary

```
User taps "Tap to Protect"
        │
        ▼
DynamicPortManager tests all servers (concurrent TCP connect)
        │
        ▼  picks lowest-latency server for chosen mode
V2RayController.connect()
        │
        ├── ConfigBuilder.buildV2RayJson() → V2Ray JSON config
        │
        ├── Libv2ray.StartV2Ray() → V2Ray core on 127.0.0.1:10808
        │
        ├── VpnService.Builder.establish() → tun interface
        │
        └── tun2socks → routes all device traffic to SOCKS5:10808
                                │
                                ▼
                        V2Ray outbound → your VPN server
                                │
                                ▼
                            Internet
```
