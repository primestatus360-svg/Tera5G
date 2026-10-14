package ug.tera5g.config

import com.google.gson.annotations.SerializedName

enum class ConnectionMode(val label: String, val description: String) {
    HIGH_SPEED("High Speed", "Optimised for streaming & browsing"),
    ULTRA_SECURE("Ultra Secure", "Maximum encryption & privacy"),
    LIGHTNING("Lightning", "Lowest latency, best for gaming"),
    FALLBACK("Auto", "Automatic fallback")
}

enum class RoutingMode(val label: String) {
    SMART("Smart"),
    FULL_TUNNEL("Full Tunnel"),
    FAST("Fast")
}

data class ServerProfile(
    @SerializedName("id")           val id: String,
    @SerializedName("group")        val group: String,          // "highspeed"|"ultrasecure"|"lightning"|"fallback"
    @SerializedName("protocol")     val protocol: String,       // vmess|vless|trojan|ss|hysteria2|wireguard|ssh|http_inject
    @SerializedName("address")      val address: String,
    @SerializedName("port")         val port: Int,
    @SerializedName("transport")    val transport: String = "tcp",   // tcp|ws|grpc|quic|kcp|h2|httpupgrade
    @SerializedName("wsPath")       val wsPath: String = "/",
    @SerializedName("wsHost")       val wsHost: String = "",
    @SerializedName("grpcService")  val grpcService: String = "",
    @SerializedName("uuid")         val uuid: String = "",
    @SerializedName("alterId")      val alterId: Int = 0,
    @SerializedName("security")     val security: String = "auto",
    @SerializedName("password")     val password: String = "",
    @SerializedName("tls")          val tls: Boolean = true,
    @SerializedName("tlsSni")       val tlsSni: String = "",
    @SerializedName("allowInsecure")       val allowInsecure: Boolean = false,
    @SerializedName("useReality")          val useReality: Boolean = false,
    @SerializedName("realityPublicKey")    val realityPublicKey: String = "",
    @SerializedName("realityShortId")      val realityShortId: String = "",
    @SerializedName("realityFingerprint")  val realityFingerprint: String = "chrome",
    @SerializedName("realityServerName")   val realityServerName: String = "www.microsoft.com",
    @SerializedName("realitySpiderX")      val realitySpiderX: String = "/",
    @SerializedName("mux")                 val mux: Boolean = false,
    @SerializedName("sniffing")     val sniffing: Boolean = true,
    @SerializedName("username")     val username: String = "",     // SSH
    @SerializedName("udpgwPort")    val udpgwPort: Int = 7300,     // SSH badvpn
    @SerializedName("injectHost")   val injectHost: String = "",   // HTTP inject
    @SerializedName("weight")       val weight: Int = 5,
    @SerializedName("locationCode") val locationCode: String = "US", // for flag emoji
    @SerializedName("locationName") val locationName: String = "United States"
) {
    val connectionMode: ConnectionMode get() = when (group) {
        "highspeed"   -> ConnectionMode.HIGH_SPEED
        "ultrasecure" -> ConnectionMode.ULTRA_SECURE
        "lightning"   -> ConnectionMode.LIGHTNING
        else          -> ConnectionMode.FALLBACK
    }
}

data class RoutingConfig(
    @SerializedName("smart")      val smart: RoutingRules,
    @SerializedName("fullTunnel") val fullTunnel: RoutingRules,
    @SerializedName("fast")       val fast: RoutingRules
)

data class RoutingRules(
    @SerializedName("domainStrategy") val domainStrategy: String = "IPIfNonMatch",
    @SerializedName("bypassDomains")  val bypassDomains: List<String> = emptyList(),
    @SerializedName("bypassIps")      val bypassIps: List<String> = emptyList(),
    @SerializedName("blockAds")       val blockAds: Boolean = true
)

data class ServerConfig(
    @SerializedName("version")    val version: Int,
    @SerializedName("updatedAt")  val updatedAt: Long,
    @SerializedName("servers")    val servers: List<ServerProfile>,
    @SerializedName("routing")    val routing: RoutingConfig
)
