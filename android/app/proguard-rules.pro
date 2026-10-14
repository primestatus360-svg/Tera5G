# ── V2Ray / Xray native library ───────────────────────────────────────────────
-keep class libv2ray.** { *; }
-dontwarn libv2ray.**

# ── SSH tunnel ───────────────────────────────────────────────────────────────
-keep class com.trilead.ssh2.** { *; }
-dontwarn com.trilead.**

# ── App data models — Gson deserialises these via reflection ──────────────────
-keep class ug.tera5g.config.** { *; }
-keep class ug.tera5g.payment.** { *; }
-keep class ug.tera5g.core.** { *; }

# ── Keep Gson serialization annotations and generic type info ─────────────────
-keepattributes Signature
-keepattributes *Annotation*
-keepattributes EnclosingMethod
-keep class com.google.gson.** { *; }
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer

# ── Android components that the OS instantiates by name ──────────────────────
-keep public class ug.tera5g.MainActivity
-keep public class ug.tera5g.v2ray.V2RayVpnService
-keep public class ug.tera5g.v2ray.BootReceiver
-keep public class ug.tera5g.tunnel.SshTunnelService
-keep public class ug.tera5g.tunnel.HttpInjectService

# ── OkHttp / Retrofit ────────────────────────────────────────────────────────
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn retrofit2.**
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-keep class retrofit2.** { *; }

# ── Kotlin coroutines ────────────────────────────────────────────────────────
-keep class kotlinx.coroutines.** { *; }
-dontwarn kotlinx.coroutines.**

# ── Jetpack Security (EncryptedSharedPreferences) ───────────────────────────
-keep class androidx.security.** { *; }

# ── Compose (reflection used for previews/tooling — not needed in release) ───
-dontwarn androidx.compose.**
