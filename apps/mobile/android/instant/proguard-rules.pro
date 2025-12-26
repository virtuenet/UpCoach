# UpCoach Instant App ProGuard Rules
# Optimized for <10 MB size target

# Keep Kotlin metadata
-keep class kotlin.Metadata { *; }

# Keep Compose runtime
-keep class androidx.compose.** { *; }
-dontwarn androidx.compose.**

# Keep Activity
-keep public class * extends android.app.Activity

# Optimize aggressively
-optimizationpasses 5
-dontusemixedcaseclassnames
-verbose

# Remove logging
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}

# Obfuscate
-repackageclasses 'o'
-allowaccessmodification
