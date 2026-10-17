import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

val localProps = Properties().apply {
    val f = rootProject.file("local.properties")
    if (f.exists()) load(f.inputStream())
}

android {
    namespace = "ug.tera5g"
    compileSdk = 34

    defaultConfig {
        applicationId = "ug.tera5g"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        ndk { abiFilters += listOf("armeabi-v7a", "arm64-v8a", "x86_64") }

        val configAesKey = localProps.getProperty("CONFIG_AES_KEY", "")
        val backendUrl   = localProps.getProperty("BACKEND_URL",   "https://api.tera5g.app")

        buildConfigField("String", "CONFIG_AES_KEY", "\"$configAesKey\"")
        buildConfigField("String", "BACKEND_URL",    "\"$backendUrl\"")
    }

    signingConfigs {
        val keystorePath = localProps.getProperty("KEYSTORE_PATH", "")
        val keystorePass = localProps.getProperty("KEYSTORE_PASSWORD", "")
        val keyAlias     = localProps.getProperty("KEY_ALIAS", "")
        val keyPass      = localProps.getProperty("KEY_PASSWORD", "")
        if (keystorePath.isNotEmpty()) {
            create("release") {
                storeFile     = file(keystorePath)
                storePassword = keystorePass
                this.keyAlias = keyAlias
                keyPassword   = keyPass
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")

            // Only validate the key when actually assembling a release variant.
            // Checking gradle.startParameter avoids throwing during debug builds in CI.
            val isBuildingRelease = gradle.startParameter.taskNames
                .any { it.contains("Release", ignoreCase = true) }
            if (isBuildingRelease) {
                val releaseKey = localProps.getProperty("CONFIG_AES_KEY", "")
                if (releaseKey.isEmpty() || !releaseKey.matches(Regex("[0-9a-fA-F]{64}"))) {
                    throw GradleException(
                        "\n\n❌  CONFIG_AES_KEY is missing or invalid in android/local.properties.\n" +
                        "   Generate with: openssl rand -hex 32\n" +
                        "   Then add:      CONFIG_AES_KEY=<64-char hex result>\n\n"
                    )
                }
            }

            val sc = signingConfigs.findByName("release")
            if (sc != null) signingConfig = sc
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    packaging {
        jniLibs { useLegacyPackaging = true }
        resources { excludes += "/META-INF/{AL2.0,LGPL2.1}" }
    }
}

dependencies {
    // Local V2Ray/Xray AAR — download from:
    // https://github.com/2dust/AndroidLibXray/releases/latest
    // Place in app/libs/libv2ray.aar
    implementation(fileTree(mapOf("dir" to "libs", "include" to listOf("*.aar", "*.jar"))))

    // Compose BOM
    val composeBom = platform("androidx.compose:compose-bom:2024.04.01")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.compose.animation:animation")
    debugImplementation("androidx.compose.ui:ui-tooling")

    // Core Android
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.1")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.1")
    implementation("androidx.activity:activity-compose:1.9.0")
    implementation("androidx.navigation:navigation-compose:2.7.7")
    implementation("androidx.core:core-splashscreen:1.0.1")

    // Encrypted storage
    implementation("androidx.security:security-crypto:1.1.0-alpha06")
    implementation("androidx.datastore:datastore-preferences:1.1.1")

    // Networking
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-gson:2.11.0")
    implementation("com.google.code.gson:gson:2.10.1")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.0")

    // WorkManager for background tasks
    implementation("androidx.work:work-runtime-ktx:2.9.0")

    // SSH tunnel
    implementation("com.trilead:trilead-ssh2:1.0.0-build222")

    // WireGuard native tunnel — provides libwg.so for all ABIs (arm64-v8a, armeabi-v7a, x86_64)
    // Used by Free Browse mode to bypass xray-core's netstack (which crashes on armeabi-v7a)
    implementation("com.wireguard.android:tunnel:1.0.20230706")
}
