package ug.tera5g.config

import com.google.gson.GsonBuilder

object ConfigBuilder {

    private val gson = GsonBuilder().setPrettyPrinting().create()

    fun buildV2RayJson(profile: ServerProfile, mode: RoutingMode, routing: RoutingConfig): String {
        val config = buildMap<String, Any> {
            put("stats", emptyMap<String, Any>())
            put("log", mapOf("loglevel" to "warning"))
            put("policy", mapOf(
                "levels" to mapOf("8" to mapOf(
                    "handshake" to 4, "connIdle" to 300,
                    "uplinkOnly" to 1, "downlinkOnly" to 1
                )),
                "system" to mapOf(
                    "statsOutboundUplink" to true,
                    "statsOutboundDownlink" to true
                )
            ))
            put("inbounds", buildInbounds())
            put("outbounds", buildOutbounds(profile))
            put("routing", buildRouting(mode, routing, profile))
            put("dns", buildDns())
        }
        return gson.toJson(config)
    }

    private fun buildInbounds() = listOf(
        mapOf(
            "tag" to "socks",
            "port" to 10808,
            "listen" to "127.0.0.1",
            "protocol" to "socks",
            "settings" to mapOf("auth" to "noauth", "udp" to true, "userLevel" to 8),
            "sniffing" to mapOf("enabled" to true, "destOverride" to listOf("http", "tls", "quic"))
        ),
        mapOf(
            "tag" to "http",
            "port" to 10809,
            "listen" to "127.0.0.1",
            "protocol" to "http",
            "settings" to mapOf("userLevel" to 8)
        )
    )

    private fun buildOutbounds(profile: ServerProfile): List<Map<String, Any>> {
        val proxyOutbound = when (profile.protocol.lowercase()) {
            "vmess"     -> buildVMessOutbound(profile)
            "vless"     -> buildVLessOutbound(profile)
            "trojan"    -> buildTrojanOutbound(profile)
            "shadowsocks", "ss" -> buildShadowsocksOutbound(profile)
            "hysteria2" -> buildHysteria2Outbound(profile)
            else        -> buildVMessOutbound(profile) // fallback
        }
        return listOf(
            proxyOutbound,
            mapOf("protocol" to "freedom", "tag" to "direct",
                "settings" to mapOf("domainStrategy" to "UseIP")),
            mapOf("protocol" to "blackhole", "tag" to "block",
                "settings" to mapOf("response" to mapOf("type" to "http")))
        )
    }

    private fun buildVMessOutbound(p: ServerProfile) = mapOf(
        "tag" to "proxy",
        "protocol" to "vmess",
        "settings" to mapOf("vnext" to listOf(mapOf(
            "address" to p.address,
            "port" to p.port,
            "users" to listOf(mapOf(
                "id" to p.uuid, "alterId" to p.alterId,
                "security" to p.security, "level" to 8
            ))
        ))),
        "streamSettings" to buildStreamSettings(p),
        "mux" to mapOf("enabled" to p.mux)
    )

    private fun buildVLessOutbound(p: ServerProfile) = mapOf(
        "tag" to "proxy",
        "protocol" to "vless",
        "settings" to mapOf("vnext" to listOf(mapOf(
            "address" to p.address,
            "port" to p.port,
            "users" to listOf(mapOf(
                "id" to p.uuid, "encryption" to "none", "level" to 8,
                // flow required for XTLS-Reality; empty string for non-Reality
                "flow" to if (p.useReality) "xtls-rprx-vision" else ""
            ))
        ))),
        "streamSettings" to buildStreamSettings(p),
        "mux" to mapOf("enabled" to (p.mux && !p.useReality))
    )

    private fun buildTrojanOutbound(p: ServerProfile) = mapOf(
        "tag" to "proxy",
        "protocol" to "trojan",
        "settings" to mapOf("servers" to listOf(mapOf(
            "address" to p.address,
            "port" to p.port,
            "password" to p.password,
            "level" to 8
        ))),
        "streamSettings" to buildStreamSettings(p),
        "mux" to mapOf("enabled" to false)
    )

    private fun buildShadowsocksOutbound(p: ServerProfile) = mapOf(
        "tag" to "proxy",
        "protocol" to "shadowsocks",
        "settings" to mapOf("servers" to listOf(mapOf(
            "address" to p.address,
            "port" to p.port,
            "method" to p.security,
            "password" to p.password,
            "level" to 8
        )))
    )

    private fun buildHysteria2Outbound(p: ServerProfile) = mapOf(
        "tag" to "proxy",
        "protocol" to "hysteria2",
        "settings" to mapOf("servers" to listOf(mapOf(
            "address" to p.address,
            "port" to p.port,
            "password" to p.password
        ))),
        "streamSettings" to mapOf(
            "network" to "hysteria2",
            "security" to "tls",
            "tlsSettings" to buildTlsSettings(p)
        )
    )

    private fun buildStreamSettings(p: ServerProfile): Map<String, Any> {
        val transport = p.transport.lowercase()
        val base = mutableMapOf<String, Any>("network" to transport)
        when {
            p.useReality -> {
                base["security"] = "reality"
                base["realitySettings"] = buildRealitySettings(p)
            }
            p.tls -> {
                base["security"] = "tls"
                base["tlsSettings"] = buildTlsSettings(p)
            }
        }
        when (transport) {
            "ws" -> base["wsSettings"] = mapOf(
                "path" to p.wsPath,
                "headers" to mapOf("Host" to (p.wsHost.ifBlank { p.address }))
            )
            "grpc" -> base["grpcSettings"] = mapOf(
                "serviceName" to p.grpcService,
                "multiMode" to false
            )
            "h2" -> base["httpSettings"] = mapOf(
                "host" to listOf(p.address),
                "path" to p.wsPath
            )
            "httpupgrade" -> base["httpupgradeSettings"] = mapOf(
                "host" to (p.wsHost.ifBlank { p.address }),
                "path" to p.wsPath
            )
        }
        return base
    }

    private fun buildTlsSettings(p: ServerProfile) = mapOf(
        "serverName"    to (p.tlsSni.ifBlank { p.address }),
        "allowInsecure" to p.allowInsecure,
        "fingerprint"   to "chrome"
    )

    private fun buildRealitySettings(p: ServerProfile) = mapOf(
        "serverName"  to (p.realityServerName.ifBlank { "www.microsoft.com" }),
        "fingerprint" to p.realityFingerprint.ifBlank { "chrome" },
        "shortId"     to p.realityShortId,
        "publicKey"   to p.realityPublicKey,
        "spiderX"     to p.realitySpiderX.ifBlank { "/" }
    )

    private fun buildRouting(mode: RoutingMode, routing: RoutingConfig, p: ServerProfile): Map<String, Any> {
        val rules = mutableListOf<Map<String, Any>>()

        // Always block UDP/443 (QUIC)
        rules.add(mapOf(
            "type" to "field", "outboundTag" to "block",
            "network" to "udp", "port" to "443"
        ))

        val cfg = when (mode) {
            RoutingMode.SMART      -> routing.smart
            RoutingMode.FULL_TUNNEL -> routing.fullTunnel
            RoutingMode.FAST       -> routing.fast
        }

        if (cfg.blockAds) {
            rules.add(mapOf("type" to "field", "outboundTag" to "block",
                "domain" to listOf("geosite:category-ads-all")))
        }
        // Always direct LAN
        rules.add(mapOf("type" to "field", "outboundTag" to "direct",
            "ip" to listOf("geoip:private")))
        rules.add(mapOf("type" to "field", "outboundTag" to "direct",
            "domain" to listOf("geosite:private")))

        if (cfg.bypassDomains.isNotEmpty()) {
            rules.add(mapOf("type" to "field", "outboundTag" to "direct",
                "domain" to cfg.bypassDomains))
        }
        if (cfg.bypassIps.isNotEmpty()) {
            rules.add(mapOf("type" to "field", "outboundTag" to "direct",
                "ip" to cfg.bypassIps))
        }

        // Catch-all: proxy
        rules.add(mapOf("type" to "field", "outboundTag" to "proxy",
            "port" to "0-65535"))

        return mapOf("domainStrategy" to cfg.domainStrategy, "rules" to rules)
    }

    private fun buildDns() = mapOf(
        "hosts" to emptyMap<String, String>(),
        "servers" to listOf("1.1.1.1", "8.8.8.8",
            mapOf("address" to "119.29.29.29", "domains" to listOf("geosite:cn")))
    )
}
