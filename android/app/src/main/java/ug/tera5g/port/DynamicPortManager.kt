package ug.tera5g.port

import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import ug.tera5g.config.ConnectionMode
import ug.tera5g.config.ServerProfile

class DynamicPortManager {

    private val scope = CoroutineScope(Dispatchers.Default + SupervisorJob())
    private var monitorJob: Job? = null

    // Score formula — higher is better
    private fun score(result: TestResult): Double {
        if (result.latencyMs == Long.MAX_VALUE) return -1.0
        val latencyScore = 1.0 / result.latencyMs.toDouble()
        val protocolBonus = when (result.profile.protocol.lowercase()) {
            "vless"     -> if (result.profile.useReality) 1.6 else 1.4
            "vmess"     -> when (result.profile.transport) {
                "ws", "grpc", "h2" -> 1.3
                else               -> 1.0
            }
            "trojan"    -> 1.2
            "hysteria2" -> 1.5
            "ss", "shadowsocks" -> 0.9
            "ssh"       -> 0.6
            else        -> 0.8
        }
        val tlsBonus = if (result.profile.tls) 1.1 else 1.0
        val weightFactor = result.profile.weight.toDouble() / 10.0
        return latencyScore * protocolBonus * tlsBonus * weightFactor * 1_000_000
    }

    suspend fun selectBest(
        candidates: List<ServerProfile>,
        preferredMode: ConnectionMode
    ): ServerProfile? {
        if (candidates.isEmpty()) return null

        // First test the preferred mode's candidates
        val preferred = candidates.filter { it.connectionMode == preferredMode }
        val results = PortTester.testAll(
            preferred.ifEmpty { candidates },
            timeoutMs = 3000
        )

        val best = results.maxByOrNull { score(it) }
        if (best != null && best.latencyMs != Long.MAX_VALUE) return best.profile

        // If preferred mode all failed, try the full list
        val fallbackResults = PortTester.testAll(candidates, timeoutMs = 4000)
        return fallbackResults.maxByOrNull { score(it) }?.takeIf {
            it.latencyMs != Long.MAX_VALUE
        }?.profile
    }

    fun startBackgroundMonitoring(
        candidates: List<ServerProfile>,
        currentProfile: () -> ServerProfile?,
        onBetterFound: (ServerProfile) -> Unit
    ) {
        monitorJob?.cancel()
        monitorJob = scope.launch {
            while (isActive) {
                delay(30_000) // check every 30 seconds
                val current = currentProfile() ?: continue
                // Test current server latency
                val currentLatency = PortTester.testAll(listOf(current), 3000)
                    .firstOrNull()?.latencyMs ?: Long.MAX_VALUE

                // If current is degraded (>1500ms), find a better one
                if (currentLatency > 1500) {
                    val results = PortTester.testAll(
                        candidates.filter { it.id != current.id },
                        3000
                    )
                    val better = results.maxByOrNull { score(it) }
                    if (better != null && better.latencyMs != Long.MAX_VALUE
                        && score(better) > score(TestResult(current, currentLatency)) * 1.3
                    ) {
                        onBetterFound(better.profile)
                    }
                }
            }
        }
    }

    fun stopMonitoring() {
        monitorJob?.cancel()
        monitorJob = null
    }

    fun destroy() {
        scope.cancel()
    }
}
