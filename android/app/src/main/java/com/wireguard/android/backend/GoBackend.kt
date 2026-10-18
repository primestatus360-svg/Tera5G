package com.wireguard.android.backend

/**
 * Minimal stub that loads libwg-go.so and exposes the WireGuard-go JNI methods.
 *
 * The tunnel AAR's GoBackend never calls System.loadLibrary in its static initializer;
 * it relies on SharedLibraryLoader called from its constructor — which we never invoke.
 * We bundle libwg-go.so in jniLibs/ and load it here instead.
 *
 * Signatures match the original com.wireguard.android:tunnel:1.0.20230706 declaration.
 */
internal class GoBackend {
    companion object {
        init {
            System.loadLibrary("wg-go")
        }

        @JvmStatic external fun wgTurnOn(ifName: String, tunFd: Int, settings: String): Int
        @JvmStatic external fun wgTurnOff(handle: Int)
        @JvmStatic external fun wgGetSocketV4(handle: Int): Int
        @JvmStatic external fun wgGetSocketV6(handle: Int): Int
        @JvmStatic external fun wgGetConfig(handle: Int): String?
    }
}
