package ug.tera5g.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import ug.tera5g.payment.*
import ug.tera5g.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PaywallScreen(
    onAccessGranted: () -> Unit,
    onDismiss: () -> Unit
) {
    val context  = LocalContext.current
    val repo     = remember { PaymentRepository(context) }
    val scope    = rememberCoroutineScope()

    var selectedPlan by remember { mutableStateOf<Plan?>(null) }
    var selectedProvider by remember { mutableStateOf(Provider.MTN) }
    var phone by remember { mutableStateOf("") }
    var step  by remember { mutableStateOf(PaywallStep.CHOOSE_PLAN) }
    var errorMsg by remember { mutableStateOf("") }
    var txRef    by remember { mutableStateOf("") }

    Scaffold(
        topBar = {
            TopAppBar(
                navigationIcon = {
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Outlined.Close, contentDescription = "Back")
                    }
                },
                title = {
                    Text(
                        "Get Access",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(Modifier.height(8.dp))

            when (step) {
                PaywallStep.CHOOSE_PLAN -> {
                    PlanChooser(
                        selected = selectedPlan,
                        onSelect = { selectedPlan = it; step = PaywallStep.ENTER_PHONE }
                    )
                }
                PaywallStep.ENTER_PHONE -> {
                    selectedPlan?.let { plan ->
                        PhoneEntry(
                            plan     = plan,
                            phone    = phone,
                            provider = selectedProvider,
                            onPhoneChange    = { phone = it },
                            onProviderChange = { selectedProvider = it },
                            errorMsg = errorMsg,
                            onPay = {
                                if (phone.filter { c -> c.isDigit() }.length < 9) {
                                    errorMsg = "Please enter a valid Ugandan phone number."
                                    return@PhoneEntry
                                }
                                errorMsg = ""
                                step = PaywallStep.WAITING
                                scope.launch {
                                    repo.initiateAndPoll(phone, selectedProvider, plan)
                                        .collect { result ->
                                            when (result) {
                                                is PaymentResult.Initiated -> {
                                                    txRef = result.txRef
                                                }
                                                is PaymentResult.Activated -> {
                                                    step = PaywallStep.SUCCESS
                                                    kotlinx.coroutines.delay(1500)
                                                    onAccessGranted()
                                                }
                                                is PaymentResult.Failed -> {
                                                    errorMsg = result.message
                                                    step = PaywallStep.ENTER_PHONE
                                                }
                                                is PaymentResult.Pending -> { /* stay on waiting */ }
                                            }
                                        }
                                }
                            },
                            onBack = { step = PaywallStep.CHOOSE_PLAN }
                        )
                    }
                }
                PaywallStep.WAITING -> WaitingStep(provider = selectedProvider)
                PaywallStep.SUCCESS  -> SuccessStep()
            }

            Spacer(Modifier.height(32.dp))
        }
    }
}

enum class PaywallStep { CHOOSE_PLAN, ENTER_PHONE, WAITING, SUCCESS }

@Composable
private fun PlanChooser(selected: Plan?, onSelect: (Plan) -> Unit) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            "No account needed.\nJust tap and pay.",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
        Spacer(Modifier.height(32.dp))

        Plan.ALL.forEach { plan ->
            PlanCard(plan = plan, isSelected = selected == plan, onClick = { onSelect(plan) })
            Spacer(Modifier.height(12.dp))
        }

        Spacer(Modifier.height(16.dp))
        Text(
            "Pay with MTN or Airtel Mobile Money.\nNo subscription — one-time payment.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
private fun PlanCard(plan: Plan, isSelected: Boolean, onClick: () -> Unit) {
    val borderColor = if (isSelected) MaterialTheme.colorScheme.primary
                      else MaterialTheme.colorScheme.outlineVariant
    Surface(
        onClick   = onClick,
        shape     = RoundedCornerShape(18.dp),
        color     = if (isSelected) MaterialTheme.colorScheme.primary.copy(0.08f)
                    else MaterialTheme.colorScheme.surface,
        border    = BorderStroke(if (isSelected) 2.dp else 1.dp, borderColor),
        modifier  = Modifier.fillMaxWidth()
    ) {
        Row(
            Modifier.padding(20.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    plan.label,
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                    color = if (isSelected) MaterialTheme.colorScheme.primary
                            else MaterialTheme.colorScheme.onSurface
                )
                Text(
                    plan.description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    "${plan.price} UGX",
                    style = MaterialTheme.typography.displaySmall,
                    fontWeight = FontWeight.Bold,
                    color = if (isSelected) MaterialTheme.colorScheme.primary
                            else MaterialTheme.colorScheme.onSurface
                )
                if (plan.id == "24h") {
                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = MaterialTheme.colorScheme.secondary.copy(0.15f)
                    ) {
                        Text(
                            "Best Value",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.secondary,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun PhoneEntry(
    plan: Plan,
    phone: String,
    provider: Provider,
    onPhoneChange: (String) -> Unit,
    onProviderChange: (Provider) -> Unit,
    errorMsg: String,
    onPay: () -> Unit,
    onBack: () -> Unit
) {
    Column {
        // Summary row
        Surface(
            shape = RoundedCornerShape(14.dp),
            color = MaterialTheme.colorScheme.primaryContainer.copy(0.5f),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                Modifier.padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(plan.label, style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold)
                Text("${plan.price} UGX", style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
            }
        }

        Spacer(Modifier.height(24.dp))

        // Provider chips
        Text("Mobile Money Provider", style = MaterialTheme.typography.headlineSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.height(10.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Provider.values().forEach { p ->
                ProviderChip(
                    provider = p, isSelected = p == provider,
                    onClick = { onProviderChange(p) }
                )
            }
        }

        Spacer(Modifier.height(20.dp))

        // Phone field
        Text("Phone Number", style = MaterialTheme.typography.headlineSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.height(8.dp))
        OutlinedTextField(
            value = phone,
            onValueChange = { onPhoneChange(it.filter { c -> c.isDigit() }.take(12)) },
            placeholder = { Text("07XX XXX XXX") },
            prefix = { Text("+256  ", color = MaterialTheme.colorScheme.onSurfaceVariant) },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
            singleLine = true,
            isError = errorMsg.isNotEmpty(),
            supportingText = if (errorMsg.isNotEmpty()) ({ Text(errorMsg) }) else null,
            shape = RoundedCornerShape(14.dp),
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(Modifier.height(12.dp))
        Surface(
            shape = RoundedCornerShape(10.dp),
            color = MaterialTheme.colorScheme.surfaceVariant
        ) {
            Row(
                Modifier.padding(12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Outlined.Info, contentDescription = null,
                    modifier = Modifier.size(16.dp),
                    tint = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(
                    "You will receive a USSD prompt on your phone to approve the payment of ${plan.price} UGX.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        Spacer(Modifier.height(28.dp))

        Button(
            onClick = onPay,
            modifier = Modifier.fillMaxWidth().height(52.dp),
            shape = RoundedCornerShape(14.dp)
        ) {
            Text("Pay ${plan.price} UGX", style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.SemiBold)
        }

        TextButton(onClick = onBack, modifier = Modifier.fillMaxWidth()) {
            Text("Change Plan")
        }
    }
}

@Composable
private fun ProviderChip(provider: Provider, isSelected: Boolean, onClick: () -> Unit) {
    val bgColor = when {
        isSelected && provider == Provider.MTN    -> MTNYellow
        isSelected && provider == Provider.AIRTEL -> AirtelRed
        else                                      -> MaterialTheme.colorScheme.surfaceVariant
    }
    Surface(
        onClick = onClick,
        shape   = RoundedCornerShape(12.dp),
        color   = bgColor,
        border  = if (isSelected) null
                  else BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        modifier = Modifier.height(44.dp)
    ) {
        Row(
            Modifier.padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(
                provider.label,
                style = MaterialTheme.typography.labelLarge,
                color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface,
                fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal
            )
        }
    }
}

@Composable
private fun WaitingStep(provider: Provider) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp),
        modifier = Modifier.fillMaxWidth().padding(top = 40.dp)
    ) {
        CircularProgressIndicator(
            modifier = Modifier.size(56.dp),
            strokeWidth = 3.dp
        )
        Text(
            "Waiting for payment…",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.SemiBold,
            textAlign = TextAlign.Center
        )
        Text(
            "A USSD prompt has been sent to your phone.\nApprove it to activate your access.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
        if (provider == Provider.MTN) {
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = MTNYellow.copy(alpha = 0.15f)
            ) {
                Text(
                    "MTN: Dial *165# if you don't see a prompt",
                    style = MaterialTheme.typography.labelMedium,
                    color = Color(0xFF8B6500),
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)
                )
            }
        }
    }
}

@Composable
private fun SuccessStep() {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp),
        modifier = Modifier.fillMaxWidth().padding(top = 60.dp)
    ) {
        Surface(
            shape = RoundedCornerShape(50),
            color = MaterialTheme.colorScheme.secondary.copy(0.15f),
            modifier = Modifier.size(80.dp)
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    Icons.Outlined.CheckCircle,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.secondary,
                    modifier = Modifier.size(44.dp)
                )
            }
        }
        Text(
            "Payment Successful!",
            style = MaterialTheme.typography.displaySmall,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center
        )
        Text(
            "Your access is now active.\nEnjoy secure browsing.",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
    }
}
