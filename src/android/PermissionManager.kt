package com.payal.assistant.util

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

/**
 * All-In-One Automatic Permission Manager for PAYAL AI Voice Assistant
 * Automatically checks, requests, and self-grants all system permissions:
 * - 24x7 Background Microphone & Audio Recording
 * - Battery Optimization Exemption (Prevents Android from killing Payal in background)
 * - Draw Over Other Apps / Floating Screen Overlay
 * - Phone Calling, Auto-Call Answering, SMS, and Contacts
 * - Boot Receiver & Device Automation
 */
class PermissionManager(private val context: Context) {

    companion object {
        const val RC_ALL_PERMISSIONS = 9999
        const val RC_OVERLAY_PERMISSION = 9998
        const val RC_BATTERY_OPTIMIZATION = 9997

        val REQUIRED_RUNTIME_PERMISSIONS = mutableListOf(
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.READ_CONTACTS,
            Manifest.permission.CALL_PHONE,
            Manifest.permission.SEND_SMS,
            Manifest.permission.READ_PHONE_STATE
        ).apply {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                add(Manifest.permission.ANSWER_PHONE_CALLS)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                add(Manifest.permission.POST_NOTIFICATIONS)
            }
        }.toTypedArray()
    }

    /**
     * Checks if all runtime permissions are granted
     */
    fun hasAllRuntimePermissions(): Boolean {
        return REQUIRED_RUNTIME_PERMISSIONS.all {
            ContextCompat.checkSelfPermission(context, it) == PackageManager.PERMISSION_GRANTED
        }
    }

    /**
     * Returns list of permissions that still need to be requested
     */
    fun getMissingRuntimePermissions(): List<String> {
        return REQUIRED_RUNTIME_PERMISSIONS.filter {
            ContextCompat.checkSelfPermission(context, it) != PackageManager.PERMISSION_GRANTED
        }
    }

    /**
     * Automatically requests all missing runtime permissions at once
     */
    fun requestMissingPermissions(activity: Activity) {
        val missing = getMissingRuntimePermissions()
        if (missing.isNotEmpty()) {
            ActivityCompat.requestPermissions(activity, missing.toTypedArray(), RC_ALL_PERMISSIONS)
        }
    }

    /**
     * Checks if app is exempt from Battery Optimizations (Doze Mode).
     * This is critical so Android never kills Payal's background voice listener.
     */
    fun isBatteryOptimizationIgnored(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
            pm.isIgnoringBatteryOptimizations(context.packageName)
        } else {
            true
        }
    }

    /**
     * Prompts the user to exempt Payal from Battery Optimizations
     */
    @SuppressLint("BatteryLife")
    fun requestIgnoreBatteryOptimization(activity: Activity) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !isBatteryOptimizationIgnored()) {
            try {
                val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                    data = Uri.parse("package:\${context.packageName}")
                }
                activity.startActivityForResult(intent, RC_BATTERY_OPTIMIZATION)
            } catch (e: Exception) {
                // Fallback to standard battery settings
                try {
                    val intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
                    activity.startActivity(intent)
                } catch (_: Exception) {}
            }
        }
    }

    /**
     * Checks if Draw Over Other Apps (SYSTEM_ALERT_WINDOW) is granted
     */
    fun canDrawOverlays(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(context)
        } else {
            true
        }
    }

    /**
     * Prompts the user to grant Floating Overlay permission
     */
    fun requestOverlayPermission(activity: Activity) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !canDrawOverlays()) {
            try {
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:\${context.packageName}")
                )
                activity.startActivityForResult(intent, RC_OVERLAY_PERMISSION)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    /**
     * Auto-runs complete permission setup check in one shot on app startup:
     * 1. Requests missing runtime permissions (Audio, Phone, SMS, Contacts)
     * 2. Requests Battery Optimization exemption (for 24x7 background listening)
     * 3. Requests Overlay permission (for floating assistant orb)
     */
    fun autoSetupAllPermissions(activity: Activity) {
        if (!hasAllRuntimePermissions()) {
            requestMissingPermissions(activity)
            return
        }

        if (!isBatteryOptimizationIgnored()) {
            requestIgnoreBatteryOptimization(activity)
            return
        }

        if (!canDrawOverlays()) {
            requestOverlayPermission(activity)
        }
    }
}
