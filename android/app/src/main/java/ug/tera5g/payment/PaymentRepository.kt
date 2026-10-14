package ug.tera5g.payment

import android.content.Context
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import ug.tera5g.core.AccessToken
import ug.tera5g.core.DeviceId
import ug.tera5g.core.TokenStore

class PaymentRepository(private val context: Context) {

    private val client     = BackendApiClient()
    private val tokenStore = TokenStore(context)

    fun getLocalToken(): AccessToken? = tokenStore.load()?.takeIf { it.isActive }

    suspend fun verifyWithBackend(): Boolean {
        return try {
            val deviceId = DeviceId.get(context)
            val status   = client.checkAccess(deviceId)
            if (status.status == "active" && status.expiresAt > System.currentTimeMillis()) {
                val local = tokenStore.load()
                if (local == null || local.expiresAt != status.expiresAt) {
                    tokenStore.save(AccessToken(deviceId, status.plan, status.expiresAt, ""))
                }
                true
            } else {
                false
            }
        } catch (e: Exception) {
            // Network failure — trust local token if it's still valid
            tokenStore.load()?.isActive ?: false
        }
    }

    fun initiateAndPoll(phone: String, provider: Provider, plan: Plan): Flow<PaymentResult> = flow {
        val deviceId = DeviceId.get(context)
        val req = PaymentRequest(
            deviceId = deviceId,
            plan     = plan.id,
            phone    = normalizePhone(phone),
            provider = provider.networkCode
        )

        val initResp = client.initiatePayment(req)
        if (!initResp.ok) {
            emit(PaymentResult.Failed(initResp.message.ifBlank { "Payment could not be started. Please try again." }))
            return@flow
        }

        emit(PaymentResult.Initiated(initResp.txRef))

        // Poll for up to 5 minutes (60 × 5 sec)
        repeat(60) { attempt ->
            delay(5_000)
            val status = client.checkStatus(initResp.txRef, deviceId)
            when (status.status) {
                "active" -> {
                    tokenStore.save(
                        AccessToken(deviceId, status.plan, status.expiresAt, initResp.txRef)
                    )
                    emit(PaymentResult.Activated(status.expiresAt, status.plan))
                    return@flow
                }
                "failed" -> {
                    emit(PaymentResult.Failed(status.message.ifBlank { "Payment was not completed." }))
                    return@flow
                }
                else -> emit(PaymentResult.Pending)
            }
        }

        emit(PaymentResult.Failed("Payment timed out. If money was deducted, contact support."))
    }

    private fun normalizePhone(raw: String): String {
        val digits = raw.filter { it.isDigit() }
        return when {
            digits.startsWith("256") -> digits
            digits.startsWith("0")   -> "256${digits.substring(1)}"
            else                     -> "256$digits"
        }
    }
}
