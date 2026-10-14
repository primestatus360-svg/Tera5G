package ug.tera5g.port

import kotlinx.coroutines.*
import ug.tera5g.config.ServerProfile
import java.net.InetSocketAddress
import java.net.Socket

data class TestResult(
    val profile: ServerProfile,
    val latencyMs: Long
)

object PortTester {

    suspend fun testAll(
        profiles: List<ServerProfile>,
        timeoutMs: Int = 3000
    ): List<TestResult> = coroutineScope {
        profiles.map { profile ->
            async(Dispatchers.IO) {
                val latency = measureTcpLatency(profile.address, profile.port, timeoutMs)
                TestResult(profile, latency)
            }
        }.awaitAll()
    }

    private suspend fun measureTcpLatency(
        host: String,
        port: Int,
        timeoutMs: Int
    ): Long = withContext(Dispatchers.IO) {
        try {
            val start = System.currentTimeMillis()
            Socket().use { socket ->
                socket.connect(InetSocketAddress(host, port), timeoutMs)
            }
            System.currentTimeMillis() - start
        } catch (e: Exception) {
            Long.MAX_VALUE // unreachable
        }
    }
}
