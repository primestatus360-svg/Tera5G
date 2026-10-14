package ug.tera5g.v2ray

import android.content.Context
import java.io.File

object V2RayAssets {

    private val GEO_FILES = listOf("geoip.dat", "geosite.dat")

    fun copyToFilesDir(context: Context) {
        GEO_FILES.forEach { name ->
            val dest = File(context.filesDir, name)
            if (!dest.exists() || isStale(context, dest)) {
                context.assets.open(name).use { input ->
                    dest.outputStream().use { output -> input.copyTo(output) }
                }
            }
        }
    }

    private fun isStale(context: Context, file: File): Boolean {
        return try {
            val apkModified = context.packageManager
                .getPackageInfo(context.packageName, 0).lastUpdateTime
            file.lastModified() < apkModified
        } catch (e: Exception) { true }
    }
}
