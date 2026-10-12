# ── Stage 1: Compile TypeScript server ───────────────────────────────────────
FROM node:20-alpine AS server-build
WORKDIR /build
COPY server/package*.json server/
RUN cd server && npm ci
COPY server/ server/
RUN cd server && npm run build

# ── Stage 2: Build landing page ───────────────────────────────────────────────
FROM node:20-alpine AS landing-build
WORKDIR /build
COPY landing/package*.json landing/
RUN cd landing && npm ci
COPY landing/ landing/
RUN cd landing && npm run build

# ── Stage 3: Export Expo web app ──────────────────────────────────────────────
FROM node:20-alpine AS mobile-build
WORKDIR /build
RUN apk add --no-cache git
ENV CI=1
ENV NODE_OPTIONS="--max-old-space-size=2048"

COPY mobile/package*.json mobile/
RUN cd mobile && npm ci

# react-native-webview has no web implementation — replace with a no-op stub
# so the Expo web export can proceed (metro.config.js also aliases this on web)
RUN printf 'const React=require("react");const {View}=require("react-native");\nfunction WebView(p){return React.createElement(View,p)}\nmodule.exports=WebView;\nmodule.exports.WebView=WebView;\nmodule.exports.default=WebView;\n' \
    > mobile/node_modules/react-native-webview/index.js

COPY mobile/ mobile/
RUN cd mobile && npx expo export --platform web

# ── Stage 4: Build admin dashboard ───────────────────────────────────────────
FROM node:20-alpine AS admin-build
WORKDIR /build
COPY web/package*.json web/
RUN cd web && npm ci
COPY web/ web/
RUN cd web && npm run build

# ── Stage 5: Production runtime ───────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

COPY server/package*.json server/
RUN cd server && npm ci --omit=dev && npm cache clean --force

COPY --from=server-build  /build/server/dist    server/dist
COPY --from=landing-build /build/landing/dist   server/public
COPY --from=mobile-build  /build/mobile/dist    server/public/play
COPY --from=admin-build   /build/web/dist       server/public/admin

RUN addgroup -g 1001 -S nodejs && \
    adduser  -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3001

CMD ["node", "server/dist/index.js"]
