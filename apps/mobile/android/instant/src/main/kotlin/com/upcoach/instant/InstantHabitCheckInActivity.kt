package com.upcoach.instant

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Android Instant App for UpCoach
 * Phase 10 Week 4
 *
 * Lightweight habit check-in experience
 * Size target: <10 MB
 *
 * Entry point: https://upcoach.app/habit?id=abc123
 */
class InstantHabitCheckInActivity : ComponentActivity() {

    private var habitId: String? = null
    private var habitName: String = "Daily Habit"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Parse intent data
        handleIntent(intent)

        setContent {
            UpCoachInstantAppTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    InstantCheckInScreen(
                        habitId = habitId,
                        habitName = habitName,
                        onCheckIn = { id -> checkInHabit(id) },
                        onInstallApp = { openPlayStore() }
                    )
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        intent?.let { handleIntent(it) }
    }

    private fun handleIntent(intent: Intent) {
        val data: Uri? = intent.data
        if (data != null) {
            habitId = data.getQueryParameter("id")
            habitName = data.getQueryParameter("name") ?: "Daily Habit"
        }
    }

    private fun checkInHabit(id: String?) {
        if (id.isNullOrEmpty()) {
            Toast.makeText(this, "Invalid habit ID", Toast.LENGTH_SHORT).show()
            return
        }

        // Record check-in to SharedPreferences
        val prefs = getSharedPreferences("upcoach_instant", MODE_PRIVATE)
        val timestamp = System.currentTimeMillis()

        prefs.edit().apply {
            putString("last_check_in_habit_id", id)
            putLong("last_check_in_timestamp", timestamp)
            putString("last_check_in_source", "instant_app")
            apply()
        }

        // Increment streak
        val currentStreak = prefs.getInt("habit_${id}_streak", 0)
        prefs.edit().putInt("habit_${id}_streak", currentStreak + 1).apply()

        Toast.makeText(this, "✅ Checked in successfully!", Toast.LENGTH_SHORT).show()
    }

    private fun openPlayStore() {
        val intent = Intent(Intent.ACTION_VIEW).apply {
            data = Uri.parse("https://play.google.com/store/apps/details?id=com.upcoach.mobile")
            setPackage("com.android.vending")
        }
        try {
            startActivity(intent)
        } catch (e: Exception) {
            // Fallback to browser
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=com.upcoach.mobile")))
        }
    }
}

@Composable
fun InstantCheckInScreen(
    habitId: String?,
    habitName: String,
    onCheckIn: (String?) -> Unit,
    onInstallApp: () -> Unit
) {
    var isCheckedIn by remember { mutableStateOf(false) }
    var streak by remember { mutableStateOf(0) }
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        Spacer(modifier = Modifier.height(40.dp))

        // Header
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "🎯",
                fontSize = 64.sp
            )

            Text(
                text = "Quick Check-In",
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold
            )

            Text(
                text = "UpCoach Instant Experience",
                fontSize = 14.sp,
                color = Color.Gray
            )
        }

        // Main content
        AnimatedVisibility(
            visible = !isCheckedIn,
            enter = fadeIn(),
            exit = fadeOut()
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text(
                            text = habitName,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.SemiBold
                        )

                        Text(
                            text = "Ready to check in?",
                            fontSize = 14.sp,
                            color = Color.Gray
                        )
                    }
                }

                Button(
                    onClick = {
                        onCheckIn(habitId)
                        isCheckedIn = true
                        streak++

                        scope.launch {
                            delay(2000)
                            // Auto-prompt to install after successful check-in
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp)
                        .height(56.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFF4CAF50)
                    )
                ) {
                    Text(
                        text = "✓ Check In Now",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }

        AnimatedVisibility(
            visible = isCheckedIn,
            enter = fadeIn(),
            exit = fadeOut()
        ) {
            SuccessView(habitName = habitName, streak = streak)
        }

        // Install app prompt
        InstallAppCard(onInstallApp = onInstallApp)
    }
}

@Composable
fun SuccessView(habitName: String, streak: Int) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "✅",
            fontSize = 80.sp
        )

        Text(
            text = "Checked In!",
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFF4CAF50)
        )

        Text(
            text = habitName,
            fontSize = 18.sp,
            color = Color.Gray
        )

        Card(
            colors = CardDefaults.cardColors(
                containerColor = Color(0xFFFFF3E0)
            )
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 20.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = "🔥", fontSize = 24.sp)
                Text(
                    text = "$streak day streak",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }
}

@Composable
fun InstallAppCard(onInstallApp: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = Color(0xFFF5F5F5)
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            HorizontalDivider()

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(
                        text = "Get the full UpCoach app",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Text(
                        text = "Track habits, set goals, and more",
                        fontSize = 12.sp,
                        color = Color.Gray
                    )
                }

                Button(
                    onClick = onInstallApp,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFF2196F3)
                    )
                ) {
                    Text("Install", fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }
}

@Composable
fun UpCoachInstantAppTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = lightColorScheme(
            primary = Color(0xFF2196F3),
            secondary = Color(0xFF4CAF50),
            background = Color.White,
            surface = Color.White
        ),
        content = content
    )
}
