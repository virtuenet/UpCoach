package com.upcoach.instant

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.android.gms.instantapps.InstantApps
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Quick check-in activity for Android Instant App
 *
 * Provides lightweight habit tracking without full app install
 */
class QuickCheckInActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Parse habit ID from intent
        val habitId = parseHabitId(intent.data)

        setContentView(
            ComposeView(this).apply {
                setContent {
                    MaterialTheme {
                        QuickCheckInScreen(
                            habitId = habitId,
                            onCheckIn = { checkInHabit(habitId) },
                            onInstallFull = { showInstallPrompt() }
                        )
                    }
                }
            }
        )
    }

    private fun parseHabitId(uri: Uri?): String {
        // Parse URL like: https://upcoach.app/instant/habits/morning-workout
        return uri?.pathSegments?.lastOrNull() ?: "unknown"
    }

    private fun checkInHabit(habitId: String) {
        // Save check-in locally (will sync when full app installed)
        val sharedPrefs = getSharedPreferences("upcoach_instant", MODE_PRIVATE)
        sharedPrefs.edit()
            .putLong("checkin_${habitId}", System.currentTimeMillis())
            .apply()

        // TODO: Call API to record check-in
    }

    private fun showInstallPrompt() {
        InstantApps.showInstallPrompt(
            this,
            /* requestCode= */ 100,
            /* referrer= */ "quick_checkin"
        )
    }
}

@Composable
fun QuickCheckInScreen(
    habitId: String,
    onCheckIn: () -> Unit,
    onInstallFull: () -> Unit
) {
    var showSuccess by remember { mutableStateOf(false) }
    var notes by remember { mutableStateOf("") }
    val coroutineScope = rememberCoroutineScope()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        Color(0xFF4F46E5),
                        Color(0xFF7C3AED)
                    )
                )
            )
    ) {
        if (showSuccess) {
            SuccessAnimation()
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Spacer(modifier = Modifier.weight(1f))

                // Habit icon
                Text(
                    text = "🏃",
                    fontSize = 72.sp
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Habit name
                Text(
                    text = habitId.replace("-", " ").replaceFirstChar { it.uppercase() },
                    fontSize = 32.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "Quick Check-In",
                    fontSize = 18.sp,
                    color = Color.White.copy(alpha = 0.8f)
                )

                Spacer(modifier = Modifier.height(32.dp))

                // Notes field
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    placeholder = { Text("Add a note (optional)") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Color.White,
                        unfocusedBorderColor = Color.White.copy(alpha = 0.5f),
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    )
                )

                Spacer(modifier = Modifier.height(24.dp))

                // Check-in button
                Button(
                    onClick = {
                        onCheckIn()
                        coroutineScope.launch {
                            showSuccess = true
                            delay(2000)
                            onInstallFull()
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color.White,
                        contentColor = Color(0xFF4F46E5)
                    )
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center,
                        modifier = Modifier.padding(vertical = 8.dp)
                    ) {
                        Text(
                            text = "✓ ",
                            fontSize = 24.sp
                        )
                        Text(
                            text = "Check In",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }

                Spacer(modifier = Modifier.weight(1f))

                // Install full app prompt
                TextButton(
                    onClick = onInstallFull,
                    colors = ButtonDefaults.textButtonColors(
                        contentColor = Color.White
                    )
                ) {
                    Text(
                        text = "Get the full app for more features",
                        fontSize = 14.sp
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }
}

@Composable
fun SuccessAnimation() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = "✅",
                fontSize = 100.sp
            )

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "Checked In!",
                fontSize = 32.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        }
    }
}
