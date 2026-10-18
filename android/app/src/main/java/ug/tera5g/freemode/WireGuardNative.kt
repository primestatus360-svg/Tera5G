package ug.tera5g.freemode

import android.util.Log
import com.wireguard.android.backend.GoBackend

/**
 * Thin wrapper around GoBackend's JNI methods (libwg-go.so).
 * All calls are safe: returns -1 / no-op on any error.
 * The first call to any method triggers GoBackend companion init → loadLibrary("wg-go").
 */
internal object WireGuardNative {
    private const val TAG = "WireGuardNative"

    fun turnOn(ifName: String, tunFd: Int, settings: String): Int =
        try {
            GoBackend.wgTurnOn(ifName, tunFd, settings)
        } catch (e: Throwable) {
            Log.e(TAG, "wgTurnOn failed", e); -1
        }

    fun turnOff(handle: Int) =
        try {
            GoBackend.wgTurnOff(handle)
        } catch (e: Throwable) {
            Log.e(TAG, "wgTurnOff failed", e)
        }

    fun getSocketV4(handle: Int): Int =
        try {
            GoBackend.wgGetSocketV4(handle)
        } catch (e: Throwable) {
            Log.e(TAG, "wgGetSocketV4 failed", e); -1
        }

    fun getSocketV6(handle: Int): Int =
        try {
            GoBackend.wgGetSocketV6(handle)
        } catch (e: Throwable) {
            Log.e(TAG, "wgGetSocketV6 failed", e); -1
        }

    /** Returns the raw UAPI config string for [handle], or null on failure. */
    fun getConfig(handle: Int): String? =
        try {
            GoBackend.wgGetConfig(handle)
        } catch (e: Throwable) {
            Log.e(TAG, "wgGetConfig failed", e); null
        }

    /**
     * Returns true if the WireGuard peer has completed a handshake
     * (last_handshake_time_sec > 0 in the UAPI config output).
     */
    fun hasHandshake(handle: Int): Boolean {
        val cfg = getConfig(handle) ?: return false
        return cfg.lineSequence().any { line ->
            line.startsWith("last_handshake_time_sec=") &&
            (line.substringAfter("=").toLongOrNull() ?: 0L) > 0L
        }
    }
}
