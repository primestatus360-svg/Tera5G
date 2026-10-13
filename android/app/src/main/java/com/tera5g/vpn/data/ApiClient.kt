package com.tera5g.vpn.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

data class InitiateResult(val sessionId: String, val message: String)
data class StatusResult(val status: String, val plan: String, val expiresAt: Long)
data class RedeemResult(
    val success: Boolean,
    val sessionId: String,
    val plan: String,
    val expiresAt: Long,
    val error: String?,
)

object ApiClient {
    const val SERVER = "https://tera5g.world"

    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    private val JSON_TYPE = "application/json; charset=utf-8".toMediaType()

    suspend fun initiatePayment(
        phone: String,
        plan: String,
        provider: String,
    ): Result<InitiateResult> = withContext(Dispatchers.IO) {
        runCatching {
            val body = JSONObject().apply {
                put("phone", phone)
                put("plan", plan)
                put("provider", provider)
            }.toString().toRequestBody(JSON_TYPE)

            val request = Request.Builder()
                .url("$SERVER/api/pay/initiate")
                .post(body)
                .build()

            client.newCall(request).execute().use { resp ->
                val json = JSONObject(resp.body!!.string())
                InitiateResult(
                    sessionId = json.getString("sessionId"),
                    message = json.optString("message", ""),
                )
            }
        }
    }

    suspend fun checkStatus(sessionId: String): Result<StatusResult> = withContext(Dispatchers.IO) {
        runCatching {
            val request = Request.Builder()
                .url("$SERVER/api/pay/status/$sessionId")
                .get()
                .build()

            client.newCall(request).execute().use { resp ->
                val json = JSONObject(resp.body!!.string())
                StatusResult(
                    status = json.getString("status"),
                    plan = json.optString("plan", ""),
                    expiresAt = json.optLong("expiresAt", 0L),
                )
            }
        }
    }

    suspend fun redeemVoucher(code: String): Result<RedeemResult> = withContext(Dispatchers.IO) {
        runCatching {
            val body = JSONObject().apply {
                put("code", code)
            }.toString().toRequestBody(JSON_TYPE)

            val request = Request.Builder()
                .url("$SERVER/api/pay/redeem")
                .post(body)
                .build()

            client.newCall(request).execute().use { resp ->
                val json = JSONObject(resp.body!!.string())
                RedeemResult(
                    success = json.optBoolean("success", false),
                    sessionId = json.optString("sessionId", ""),
                    plan = json.optString("plan", ""),
                    expiresAt = json.optLong("expiresAt", 0L),
                    error = if (json.has("error")) json.getString("error") else null,
                )
            }
        }
    }
}
