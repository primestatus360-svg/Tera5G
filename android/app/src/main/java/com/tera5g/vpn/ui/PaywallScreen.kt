package com.tera5g.vpn.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tera5g.vpn.data.ApiClient
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

private enum class PaywallView { FORM, PENDING }

@Composable
fun PaywallScreen(
    onSessionActivated: (sessionId: String, plan: String, expiresAt: Long) -> Unit,
) {
    val scope = rememberCoroutineScope()

    var view by remember { mutableStateOf(PaywallView.FORM) }
    var phone by remember { mutableStateOf("") }
    var selectedPlan by remember { mutableStateOf("6H") }
    var selectedProvider by remember { mutableStateOf("MTN") }
    var voucher by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var statusMessage by remember { mutableStateOf("") }
    var pendingSessionId by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.height(52.dp))

        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("Tera", color = OnBackground, fontWeight = FontWeight.Black, fontSize = 26.sp)
            Text("5G", color = Accent, fontWeight = FontWeight.Black, fontSize = 26.sp)
        }

        Spacer(Modifier.height(6.dp))
        Text("Get a browsing plan", color = TextMuted, fontSize = 14.sp)

        Spacer(Modifier.height(32.dp))

        when (view) {
            PaywallView.FORM -> FormView(
                phone = phone,
                onPhoneChange = { phone = it; error = null },
                selectedPlan = selectedPlan,
                onPlanChange = { selectedPlan = it },
                selectedProvider = selectedProvider,
                onProviderChange = { selectedProvider = it },
                voucher = voucher,
                onVoucherChange = { voucher = it; error = null },
                error = error,
                onPay = {
                    scope.launch {
                        error = null
                        val result = ApiClient.initiatePayment(phone, selectedPlan, selectedProvider)
                        result.onSuccess { data ->
                            pendingSessionId = data.sessionId
                            statusMessage = data.message.ifBlank { "Check your phone for the USSD prompt." }
                            view = PaywallView.PENDING
                            // Start polling
                            launch {
                                repeat(60) {
                                    delay(5_000)
                                    val status = ApiClient.checkStatus(pendingSessionId)
                                    status.onSuccess { s ->
                                        if (s.status == "paid" || s.status == "active") {
                                            onSessionActivated(pendingSessionId, s.plan, s.expiresAt)
                                        } else {
                                            statusMessage = "Status: ${s.status} — still waiting…"
                                        }
                                    }
                                }
                            }
                        }.onFailure { e ->
                            error = e.message ?: "Payment failed. Please try again."
                        }
                    }
                },
                onRedeem = {
                    scope.launch {
                        error = null
                        val result = ApiClient.redeemVoucher(voucher.trim())
                        result.onSuccess { r ->
                            if (r.success) {
                                onSessionActivated(r.sessionId, r.plan, r.expiresAt)
                            } else {
                                error = r.error ?: "Invalid voucher code."
                            }
                        }.onFailure { e ->
                            error = e.message ?: "Redeem failed. Please try again."
                        }
                    }
                },
            )

            PaywallView.PENDING -> PendingView(
                statusMessage = statusMessage,
                onCancel = { view = PaywallView.FORM },
            )
        }
    }
}

@Composable
private fun FormView(
    phone: String,
    onPhoneChange: (String) -> Unit,
    selectedPlan: String,
    onPlanChange: (String) -> Unit,
    selectedProvider: String,
    onProviderChange: (String) -> Unit,
    voucher: String,
    onVoucherChange: (String) -> Unit,
    error: String?,
    onPay: () -> Unit,
    onRedeem: () -> Unit,
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        // Phone number
        SectionLabel("Phone Number")
        OutlinedTextField(
            value = phone,
            onValueChange = onPhoneChange,
            placeholder = { Text("07XXXXXXXX", color = TextMuted) },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
            singleLine = true,
            colors = outlinedFieldColors(),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth(),
        )

        // Plan selection
        SectionLabel("Select Plan")
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            for ((label, price) in listOf("6H" to "UGX 500", "24H" to "UGX 1,500")) {
                val selected = selectedPlan == label
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(12.dp))
                        .background(if (selected) Accent.copy(alpha = 0.15f) else Surface)
                        .border(
                            1.dp,
                            if (selected) Accent.copy(alpha = 0.6f) else TextMuted.copy(alpha = 0.2f),
                            RoundedCornerShape(12.dp),
                        )
                        .clickable { onPlanChange(label) }
                        .padding(vertical = 14.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(label, color = if (selected) Accent else OnBackground, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Text(price, color = TextMuted, fontSize = 11.sp)
                    }
                }
            }
        }

        // Provider selection
        SectionLabel("Provider")
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            for (provider in listOf("MTN", "Airtel")) {
                val selected = selectedProvider == provider
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(12.dp))
                        .background(if (selected) Accent.copy(alpha = 0.12f) else Surface)
                        .border(
                            1.dp,
                            if (selected) Accent.copy(alpha = 0.55f) else TextMuted.copy(alpha = 0.2f),
                            RoundedCornerShape(12.dp),
                        )
                        .clickable { onProviderChange(provider) }
                        .padding(vertical = 12.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        provider,
                        color = if (selected) Accent else OnBackground,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp,
                    )
                }
            }
        }

        // Error
        if (error != null) {
            Text(error, color = MaterialTheme.colorScheme.error, fontSize = 13.sp)
        }

        // Pay button
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .background(Accent)
                .clickable { onPay() }
                .padding(vertical = 16.dp),
            contentAlignment = Alignment.Center,
        ) {
            Text("Pay with $selectedProvider", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 15.sp)
        }

        // Divider
        Row(
            Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            HorizontalDivider(Modifier.weight(1f), color = TextMuted.copy(alpha = 0.2f))
            Text("OR", color = TextMuted, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
            HorizontalDivider(Modifier.weight(1f), color = TextMuted.copy(alpha = 0.2f))
        }

        // Voucher
        SectionLabel("Redeem Voucher")
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            OutlinedTextField(
                value = voucher,
                onValueChange = onVoucherChange,
                placeholder = { Text("Enter code", color = TextMuted) },
                singleLine = true,
                colors = outlinedFieldColors(),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.weight(1f),
            )
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(12.dp))
                    .background(if (voucher.isNotBlank()) Accent else Surface)
                    .border(
                        1.dp,
                        if (voucher.isNotBlank()) Accent else TextMuted.copy(alpha = 0.3f),
                        RoundedCornerShape(12.dp),
                    )
                    .clickable(enabled = voucher.isNotBlank()) { onRedeem() }
                    .padding(horizontal = 18.dp, vertical = 16.dp),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    "Redeem",
                    color = if (voucher.isNotBlank()) Color.Black else TextMuted,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 14.sp,
                )
            }
        }

        Spacer(Modifier.height(24.dp))
    }
}

@Composable
private fun PendingView(statusMessage: String, onCancel: () -> Unit) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(20.dp),
        modifier = Modifier.fillMaxWidth().padding(top = 16.dp),
    ) {
        CircularProgressIndicator(color = Accent, strokeWidth = 3.dp, modifier = Modifier.size(52.dp))

        Text(
            "Check your phone for the USSD prompt",
            color = OnBackground,
            fontWeight = FontWeight.SemiBold,
            fontSize = 16.sp,
            textAlign = TextAlign.Center,
        )

        if (statusMessage.isNotBlank()) {
            Text(statusMessage, color = TextMuted, fontSize = 13.sp, textAlign = TextAlign.Center)
        }

        Spacer(Modifier.height(8.dp))

        Box(
            modifier = Modifier
                .clip(RoundedCornerShape(12.dp))
                .background(Surface)
                .border(1.dp, TextMuted.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
                .clickable { onCancel() }
                .padding(horizontal = 28.dp, vertical = 12.dp),
        ) {
            Text("Cancel", color = TextMuted, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
        }
    }
}

@Composable
private fun SectionLabel(text: String) {
    Text(
        text = text,
        color = TextMuted,
        fontSize = 12.sp,
        fontWeight = FontWeight.SemiBold,
        letterSpacing = 0.5.sp,
    )
}

@Composable
private fun outlinedFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = Accent.copy(alpha = 0.7f),
    unfocusedBorderColor = TextMuted.copy(alpha = 0.25f),
    focusedTextColor = OnBackground,
    unfocusedTextColor = OnBackground,
    cursorColor = Accent,
    focusedContainerColor = Surface,
    unfocusedContainerColor = Surface,
)
