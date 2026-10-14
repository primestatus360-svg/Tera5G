package ug.tera5g.payment

import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import ug.tera5g.BuildConfig
import java.util.concurrent.TimeUnit

class BackendApiClient {

    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(10, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()

    private val gson = Gson()
    private val json = "application/json".toMediaType()

    suspend fun initiatePayment(req: PaymentRequest): PaymentInitResponse = withContext(Dispatchers.IO) {
        val body = mapOf(
            "deviceId" to req.deviceId,
            "plan"     to req.plan,
            "phone"    to req.phone,
            "provider" to req.provider
        )
        val request = Request.Builder()
            .url("${BuildConfig.BACKEND_URL}/api/pay/initiate")
            .post(gson.toJson(body).toRequestBody(json))
            .build()
        val response = client.newCall(request).execute()
        gson.fromJson(response.body?.string() ?: "{}", PaymentInitResponse::class.java)
    }

    suspend fun checkStatus(txRef: String, deviceId: String): PaymentStatusResponse = withContext(Dispatchers.IO) {
        val request = Request.Builder()
            .url("${BuildConfig.BACKEND_URL}/api/pay/status?txRef=$txRef&deviceId=$deviceId")
            .get()
            .build()
        val response = client.newCall(request).execute()
        gson.fromJson(response.body?.string() ?: "{}", PaymentStatusResponse::class.java)
    }

    suspend fun checkAccess(deviceId: String): PaymentStatusResponse = withContext(Dispatchers.IO) {
        val request = Request.Builder()
            .url("${BuildConfig.BACKEND_URL}/api/access/check?deviceId=$deviceId")
            .header("X-Device-Id", deviceId)
            .get()
            .build()
        val response = client.newCall(request).execute()
        // Access check returns {active, plan, expiresAt} — map active→status for compatibility
        val raw = response.body?.string() ?: "{}"
        try {
            val map = gson.fromJson(raw, Map::class.java)
            val active = map["active"] as? Boolean ?: false
            val plan   = map["plan"]   as? String  ?: ""
            val exp    = (map["expiresAt"] as? Double)?.toLong() ?: 0L
            PaymentStatusResponse(
                status    = if (active) "active" else "inactive",
                plan      = plan,
                expiresAt = exp
            )
        } catch (_: Exception) {
            gson.fromJson(raw, PaymentStatusResponse::class.java)
        }
    }
}
