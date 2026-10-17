package ug.tera5g.freemode

import android.util.Log
import java.lang.reflect.Method

/**
 * Thin JNI shim for wireguard-android's libwg.so.
 *
 * The native methods in libwg.so are statically bound to
 * com.wireguard.android.backend.GoBackend. We reach them via
 * reflection so we don't need to create a class at that exact path.
 * Class.forName triggers GoBackend's static initializer which loads
 * the library.
 *
 * All calls are safe: returns -1 / no-op if the library is unavailable.
 */
internal object WireGuardNative {
    private const val TAG = "WireGuardNative"

    private val goBackend: Class<*>? by lazy {
        try {
            Class.forName("com.wireguard.android.backend.GoBackend")
        } catch (e: Exception) {
            Log.e(TAG, "libwg.so unavailable: ${e.message}")
            null
        }
    }

    private fun find(name: String, vararg types: Class<*>): Method? = try {
        goBackend?.getDeclaredMethod(name, *types)?.also { it.isAccessible = true }
    } catch (_: Exception) { null }

    /** Start a WireGuard tunnel on [tunFd] with UAPI [settings]. Returns a handle >= 0 on success. */
    fun turnOn(ifName: String, tunFd: Int, settings: String): Int {
        // Newer wireguard-android added a logTag 4th parameter; fall back to 3-param signature.
        val m: Method = find("wgTurnOn",
            String::class.java, Int::class.javaPrimitiveType!!, String::class.java, String::class.java)
            ?: find("wgTurnOn",
                String::class.java, Int::class.javaPrimitiveType!!, String::class.java)
            ?: run { Log.e(TAG, "wgTurnOn not found"); return -1 }
        return try {
            val result = if (m.parameterCount == 4)
                m.invoke(null, ifName, tunFd, settings, TAG)
            else
                m.invoke(null, ifName, tunFd, settings)
            (result as? Int) ?: -1
        } catch (e: Exception) {
            Log.e(TAG, "wgTurnOn failed", e); -1
        }
    }

    /** Stop the WireGuard tunnel identified by [handle]. */
    fun turnOff(handle: Int) {
        find("wgTurnOff", Int::class.javaPrimitiveType!!)?.let {
            try { it.invoke(null, handle) } catch (e: Exception) {
                Log.e(TAG, "wgTurnOff failed", e)
            }
        }
    }

    /** Returns the WireGuard UDP IPv4 socket fd (for VpnService.protect). */
    fun getSocketV4(handle: Int): Int =
        find("wgGetSocketV4", Int::class.javaPrimitiveType!!)?.let {
            try { (it.invoke(null, handle) as? Int) ?: -1 } catch (_: Exception) { -1 }
        } ?: -1

    /** Returns the WireGuard UDP IPv6 socket fd (for VpnService.protect). */
    fun getSocketV6(handle: Int): Int =
        find("wgGetSocketV6", Int::class.javaPrimitiveType!!)?.let {
            try { (it.invoke(null, handle) as? Int) ?: -1 } catch (_: Exception) { -1 }
        } ?: -1
}
