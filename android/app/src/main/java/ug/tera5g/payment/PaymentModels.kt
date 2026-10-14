package ug.tera5g.payment

data class Plan(
    val id: String,          // "5h" | "24h"
    val label: String,       // "5 Hours"
    val price: Int,          // UGX
    val description: String
) {
    companion object {
        val FIVE_HOURS = Plan("5h",  "5 Hours",   500,  "Great for a quick session")
        val ONE_DAY    = Plan("24h", "24 Hours", 1000,  "Full day, uninterrupted")
        val ALL = listOf(FIVE_HOURS, ONE_DAY)
    }
}

enum class Provider(val label: String, val networkCode: String) {
    MTN("MTN Mobile Money", "MTN"),
    AIRTEL("Airtel Money",  "AIRTEL")
}

data class PaymentRequest(
    val deviceId: String,
    val plan: String,
    val phone: String,
    val provider: String
)

data class PaymentInitResponse(
    val ok: Boolean,
    val txRef: String,
    val message: String = ""
)

data class PaymentStatusResponse(
    val status: String,    // "pending" | "active" | "failed"
    val plan: String = "",
    val expiresAt: Long = 0L,
    val message: String = ""
)

sealed class PaymentResult {
    data class Initiated(val txRef: String) : PaymentResult()
    data class Activated(val expiresAt: Long, val plan: String) : PaymentResult()
    data class Failed(val message: String) : PaymentResult()
    object Pending : PaymentResult()
}
