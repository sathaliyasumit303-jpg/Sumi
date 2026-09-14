package com.payal.assistant.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

/**
 * Boot Receiver for PAYAL AI
 * 
 * Automatically triggers upon:
 * - Intent.ACTION_BOOT_COMPLETED (Phone rebooted / switched on)
 * - "android.intent.action.QUICKBOOT_POWERON" (Fast boot)
 * - Intent.ACTION_MY_PACKAGE_REPLACED (App updated)
 * 
 * Launches PayalBackgroundVoiceService so PAYAL is always ready and listening
 * for "पायल" without having to manually open the app!
 */
class BootReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "PayalBootReceiver"
    }

    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action ?: return
        Log.i(TAG, "BootReceiver received action: \$action")

        if (action == Intent.ACTION_BOOT_COMPLETED ||
            action == "android.intent.action.QUICKBOOT_POWERON" ||
            action == Intent.ACTION_MY_PACKAGE_REPLACED
        ) {
            // 1. Start 24x7 Background Voice Service
            val voiceServiceIntent = Intent(context, PayalBackgroundVoiceService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(voiceServiceIntent)
            } else {
                context.startService(voiceServiceIntent)
            }
            Log.i(TAG, "Successfully auto-started PayalBackgroundVoiceService on device boot!")

            // 2. Start Call Monitor Service
            val callServiceIntent = Intent(context, CallMonitorService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(callServiceIntent)
            } else {
                context.startService(callServiceIntent)
            }
            Log.i(TAG, "Successfully auto-started CallMonitorService on device boot!")
        }
    }
}
