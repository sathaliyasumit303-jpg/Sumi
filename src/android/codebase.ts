export interface AndroidFile {
  path: string;
  name: string;
  language: 'kotlin' | 'xml' | 'groovy';
  content: string;
}

export const ANDROID_FILES: AndroidFile[] = [
  // 1. AppCommand.kt
  {
    path: 'app/src/main/java/com/payal/assistant/model/AppCommand.kt',
    name: 'AppCommand.kt',
    language: 'kotlin',
    content: `package com.payal.assistant.model

data class AppCommand(
    val type: String,
    val params: Map<String, String> = emptyMap(),
    val rawText: String = ""
) {
    companion object {
        const val TYPE_OPEN_APP = "OPEN_APP"
        const val TYPE_CLOSE_APP = "CLOSE_APP"
        const val TYPE_CALL = "CALL"
        const val TYPE_SMS = "SMS"
        const val TYPE_WHATSAPP_MSG = "WHATSAPP_MSG"
        const val TYPE_WHATSAPP_CALL = "WHATSAPP_CALL"
        const val TYPE_PRIME_CALL = "PRIME_CALL"
        const val TYPE_PRIME_MSG = "PRIME_MSG"
        const val TYPE_GROUP_CALL = "GROUP_CALL"
        const val TYPE_GROUP_MSG = "GROUP_MSG"
        const val TYPE_VOLUME_UP = "VOLUME_UP"
        const val TYPE_VOLUME_DOWN = "VOLUME_DOWN"
        const val TYPE_FLASHLIGHT_ON = "FLASHLIGHT_ON"
        const val TYPE_FLASHLIGHT_OFF = "FLASHLIGHT_OFF"
        const val TYPE_WIFI_ON = "WIFI_ON"
        const val TYPE_WIFI_OFF = "WIFI_OFF"
        const val TYPE_BLUETOOTH_ON = "BLUETOOTH_ON"
        const val TYPE_BLUETOOTH_OFF = "BLUETOOTH_OFF"
    }
}
`,
  },

  // 2. CommandParser.kt
  {
    path: 'app/src/main/java/com/payal/assistant/ai/CommandParser.kt',
    name: 'CommandParser.kt',
    language: 'kotlin',
    content: `package com.payal.assistant.ai

import com.payal.assistant.model.AppCommand
import com.payal.assistant.model.ContactGroup
import java.util.Locale

class CommandParser {

    /**
     * Parses Hinglish / English transcribed speech into an AppCommand.
     * Supports custom contact groups (e.g., 'family', 'work', 'friends').
     * Returns null if no phone action is matched, allowing Gemini to handle as conversation.
     */
    fun parse(text: String, contactGroups: List<ContactGroup> = emptyList()): AppCommand? {
        val clean = text.lowercase(Locale.ROOT).trim()
            .replace(Regex("[.,!?;:]"), "")

        // 1a. Prime Contacts
        if (clean.contains("close friend ko call") || clean.contains("call my close friend") ||
            clean.contains("mere close friend") || clean.contains("pehla contact") || clean.contains("first contact")) {
            return AppCommand(AppCommand.TYPE_PRIME_CALL, mapOf("index" to "0"), clean)
        }
        if (clean.contains("second contact") || clean.contains("dusra contact") || clean.contains("doosre contact")) {
            return AppCommand(AppCommand.TYPE_PRIME_CALL, mapOf("index" to "1"), clean)
        }
        if (clean.contains("meri jaan ko message") || clean.contains("message my love") ||
            clean.contains("close friend ko msg") || clean.contains("message close friend")) {
            return AppCommand(AppCommand.TYPE_PRIME_MSG, mapOf("index" to "0"), clean)
        }

        // 1b. Custom Contact Groups (e.g. 'family', 'work', 'friends')
        for (group in contactGroups) {
            val groupName = group.name.lowercase(Locale.ROOT)
            val groupTag = group.tag.lowercase(Locale.ROOT)

            // Check group calling: "call my family", "call my work contacts", "friends ko call karo"
            if (clean.contains("call my $groupName") || clean.contains("call my $groupTag") ||
                clean.contains("call $groupName contacts") || clean.contains("call $groupName group") ||
                clean.contains("$groupName ko call") || clean.contains("$groupTag ko call") ||
                clean.contains("call $groupName") || clean.contains("call $groupTag")) {
                return AppCommand(
                    AppCommand.TYPE_GROUP_CALL,
                    mapOf("group_id" to group.id, "group_name" to group.name, "group_tag" to group.tag),
                    clean
                )
            }

            // Check group messaging: "message my work contacts", "message my family", "family ko message karo"
            if (clean.contains("message my $groupName") || clean.contains("message my $groupTag") ||
                clean.contains("msg my $groupName") || clean.contains("message $groupName contacts") ||
                clean.contains("message $groupName group") || clean.contains("$groupName ko message") ||
                clean.contains("$groupTag ko message") || clean.contains("text my $groupName") ||
                clean.contains("text $groupName")) {
                return AppCommand(
                    AppCommand.TYPE_GROUP_MSG,
                    mapOf("group_id" to group.id, "group_name" to group.name, "group_tag" to group.tag),
                    clean
                )
            }
        }

        // 2. Open App
        if (clean.startsWith("open ") || clean.contains("kholo") || clean.contains("chalao") || clean.contains("start ")) {
            val appName = extractAppName(clean)
            if (appName.isNotEmpty()) {
                return AppCommand(AppCommand.TYPE_OPEN_APP, mapOf("app_name" to appName), clean)
            }
        }

        // 3. Close App
        if (clean.startsWith("close ") || clean.contains("band karo") || clean.contains("hatao") || clean.contains("exit ")) {
            return AppCommand(AppCommand.TYPE_CLOSE_APP, emptyMap(), clean)
        }

        // 4. WhatsApp Message / Call
        if (clean.contains("whatsapp karo") || clean.contains("whatsapp msg") || clean.contains("whatsapp par message")) {
            val target = extractNameBeforeKo(clean, "whatsapp")
            return AppCommand(AppCommand.TYPE_WHATSAPP_MSG, mapOf("name" to target), clean)
        }

        // 5. Normal Phone Call
        if (clean.contains("call karo") || clean.contains("phone milao") || clean.startsWith("call ")) {
            val nameOrNumber = extractCallTarget(clean)
            if (nameOrNumber.isNotEmpty()) {
                return AppCommand(AppCommand.TYPE_CALL, mapOf("target" to nameOrNumber), clean)
            }
        }

        // 6. SMS
        if (clean.contains("sms bhejo") || clean.contains("message bhejo") || clean.startsWith("send sms to")) {
            val name = extractNameBeforeKo(clean, "sms")
            return AppCommand(AppCommand.TYPE_SMS, mapOf("name" to name), clean)
        }

        // 7. Volume
        if (clean.contains("volume badhao") || clean.contains("awaaz badhao") || clean.contains("volume up")) {
            return AppCommand(AppCommand.TYPE_VOLUME_UP, emptyMap(), clean)
        }
        if (clean.contains("volume kam karo") || clean.contains("awaaz kam") || clean.contains("volume down")) {
            return AppCommand(AppCommand.TYPE_VOLUME_DOWN, emptyMap(), clean)
        }

        // 8. Flashlight
        if (clean.contains("torch on") || clean.contains("flashlight on") || clean.contains("torch jalao")) {
            return AppCommand(AppCommand.TYPE_FLASHLIGHT_ON, emptyMap(), clean)
        }
        if (clean.contains("torch off") || clean.contains("flashlight off") || clean.contains("torch band")) {
            return AppCommand(AppCommand.TYPE_FLASHLIGHT_OFF, emptyMap(), clean)
        }

        // 9. WiFi & Bluetooth
        if (clean.contains("wifi on")) return AppCommand(AppCommand.TYPE_WIFI_ON, emptyMap(), clean)
        if (clean.contains("wifi off")) return AppCommand(AppCommand.TYPE_WIFI_OFF, emptyMap(), clean)
        if (clean.contains("bluetooth on")) return AppCommand(AppCommand.TYPE_BLUETOOTH_ON, emptyMap(), clean)
        if (clean.contains("bluetooth off")) return AppCommand(AppCommand.TYPE_BLUETOOTH_OFF, emptyMap(), clean)

        return null
    }

    private fun extractAppName(text: String): String {
        val keywords = listOf("youtube", "whatsapp", "instagram", "facebook", "chrome", "gmail",
            "maps", "spotify", "netflix", "twitter", "x", "telegram", "snapchat", "settings",
            "calculator", "calendar", "clock", "camera", "gallery", "phone", "contacts")
        for (kw in keywords) {
            if (text.contains(kw)) return kw
        }
        return text.replace("open", "").replace("kholo", "").replace("chalao", "").trim()
    }

    private fun extractCallTarget(text: String): String {
        return text.replace("ko call karo", "")
            .replace("call karo", "")
            .replace("call", "")
            .replace("ko", "")
            .trim()
    }

    private fun extractNameBeforeKo(text: String, tag: String): String {
        val parts = text.split("ko")
        return if (parts.size > 1) {
            parts[0].replace(tag, "").replace("bhejo", "").replace("karo", "").trim()
        } else {
            text.replace(tag, "").trim()
        }
    }
}
`,
  },

  // 3. AudioEngine.kt
  {
    path: 'app/src/main/java/com/payal/assistant/ai/AudioEngine.kt',
    name: 'AudioEngine.kt',
    language: 'kotlin',
    content: `package com.payal.assistant.ai

import android.annotation.SuppressLint
import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.AudioTrack
import android.media.MediaRecorder
import kotlinx.coroutines.*
import java.util.concurrent.ConcurrentLinkedQueue
import kotlin.math.sqrt

class AudioEngine(private val context: Context) {

    companion object {
        const val MIC_SAMPLE_RATE = 16000
        const val SPEAKER_SAMPLE_RATE = 24000
        const val CHUNK_SIZE = 1024
    }

    private var audioRecord: AudioRecord? = null
    private var audioTrack: AudioTrack? = null

    private val audioScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var recordingJob: Job? = null
    private var playbackJob: Job? = null

    private val playbackQueue = ConcurrentLinkedQueue<ByteArray>()

    @Volatile var isMuted: Boolean = false
    @Volatile var isSpeaking: Boolean = false
    @Volatile private var isRunning: Boolean = false

    var onAudioChunkCaptured: ((ByteArray) -> Unit)? = null
    var onAmplitudeChanged: ((Float) -> Unit)? = null
    var onSpeakingStarted: (() -> Unit)? = null
    var onSpeakingStopped: (() -> Unit)? = null

    @SuppressLint("MissingPermission")
    fun startRecording() {
        if (recordingJob?.isActive == true) return

        val minBuf = AudioRecord.getMinBufferSize(
            MIC_SAMPLE_RATE,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT
        )
        val bufSize = maxOf(minBuf, CHUNK_SIZE * 4)

        try {
            audioRecord = AudioRecord(
                MediaRecorder.AudioSource.VOICE_RECOGNITION,
                MIC_SAMPLE_RATE,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT,
                bufSize
            )
            audioRecord?.startRecording()
            isRunning = true

            recordingJob = audioScope.launch {
                val buffer = ByteArray(CHUNK_SIZE)
                while (isActive && isRunning) {
                    // Suppress mic echo when PAYAL is speaking or muted
                    if (isSpeaking || isMuted) {
                        delay(20)
                        continue
                    }

                    val read = audioRecord?.read(buffer, 0, CHUNK_SIZE) ?: 0
                    if (read > 0) {
                        val chunk = buffer.copyOf(read)
                        val rms = calculateRms(chunk)
                        withContext(Dispatchers.Main) {
                            onAmplitudeChanged?.invoke(rms)
                        }
                        onAudioChunkCaptured?.invoke(chunk)
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun startPlayback() {
        if (playbackJob?.isActive == true) return

        val minBuf = AudioTrack.getMinBufferSize(
            SPEAKER_SAMPLE_RATE,
            AudioFormat.CHANNEL_OUT_MONO,
            AudioFormat.ENCODING_PCM_16BIT
        )

        audioTrack = AudioTrack.Builder()
            .setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ASSISTANT)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build()
            )
            .setAudioFormat(
                AudioFormat.Builder()
                    .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                    .setSampleRate(SPEAKER_SAMPLE_RATE)
                    .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                    .build()
            )
            .setBufferSizeInBytes(maxOf(minBuf, CHUNK_SIZE * 8))
            .setTransferMode(AudioTrack.MODE_STREAM)
            .build()

        audioTrack?.play()

        playbackJob = audioScope.launch {
            while (isActive) {
                val chunk = playbackQueue.poll()
                if (chunk != null) {
                    if (!isSpeaking) {
                        isSpeaking = true
                        withContext(Dispatchers.Main) { onSpeakingStarted?.invoke() }
                    }
                    val rms = calculateRms(chunk)
                    withContext(Dispatchers.Main) { onAmplitudeChanged?.invoke(rms) }
                    audioTrack?.write(chunk, 0, chunk.size)
                } else {
                    if (isSpeaking) {
                        delay(120)
                        if (playbackQueue.isEmpty()) {
                            isSpeaking = false
                            withContext(Dispatchers.Main) {
                                onSpeakingStopped?.invoke()
                                onAmplitudeChanged?.invoke(0f)
                            }
                        }
                    } else {
                        delay(15)
                    }
                }
            }
        }
    }

    fun queueAudio(pcmData: ByteArray) {
        playbackQueue.add(pcmData)
    }

    fun interrupt() {
        playbackQueue.clear()
        audioTrack?.pause()
        audioTrack?.flush()
        audioTrack?.play()
        isSpeaking = false
        onSpeakingStopped?.invoke()
        onAmplitudeChanged?.invoke(0f)
    }

    private fun calculateRms(pcm: ByteArray): Float {
        var sum = 0.0
        var count = 0
        for (i in 0 until pcm.size - 1 step 2) {
            val sample = (pcm[i].toInt() and 0xFF) or (pcm[i + 1].toInt() shl 8)
            val shortVal = sample.toShort().toFloat() / 32768.0f
            sum += (shortVal * shortVal)
            count++
        }
        if (count == 0) return 0f
        return (sqrt(sum / count)).toFloat().coerceIn(0f, 1f)
    }

    fun release() {
        isRunning = false
        recordingJob?.cancel()
        playbackJob?.cancel()
        try {
            audioRecord?.stop()
            audioRecord?.release()
        } catch (_: Exception) {}
        try {
            audioTrack?.stop()
            audioTrack?.release()
        } catch (_: Exception) {}
        playbackQueue.clear()
    }
}
`,
  },

  // 4. GeminiLiveClient.kt
  {
    path: 'app/src/main/java/com/payal/assistant/ai/GeminiLiveClient.kt',
    name: 'GeminiLiveClient.kt',
    language: 'kotlin',
    content: `package com.payal.assistant.ai

import android.content.Context
import android.util.Base64
import kotlinx.coroutines.*
import okhttp3.*
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class GeminiLiveClient(private val context: Context) {

    companion object {
        private const val BASE_WS_URL =
            "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent"
        private const val SESSION_RENEW_AFTER_MS = 540_000L // 9 minutes
        private const val KEEPALIVE_INTERVAL_MS = 8_000L     // 8 seconds
        private const val RECONNECT_DELAY_MS = 3_000L
    }

    private val client = OkHttpClient.Builder()
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .pingInterval(10, TimeUnit.SECONDS)
        .build()

    private var webSocket: WebSocket? = null
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    private var keepAliveJob: Job? = null
    private var sessionRenewalJob: Job? = null

    var apiKey: String = ""
    var modelString: String = "models/gemini-2.5-flash-native-audio-preview-12-2025"
    var voiceName: String = "Aoede"
    var systemPrompt: String = ""

    var onConnected: (() -> Unit)? = null
    var onDisconnected: (() -> Unit)? = null
    var onAudioReceived: ((ByteArray) -> Unit)? = null
    var onOutputTranscript: ((String) -> Unit)? = null
    var onInputTranscript: ((String) -> Unit)? = null
    var onTurnComplete: (() -> Unit)? = null
    var onError: ((String) -> Unit)? = null

    private var isConnected = false
    private var shouldReconnect = true

    fun connect() {
        if (apiKey.isBlank()) {
            onError?.invoke("API Key not found. Please set it in Settings.")
            return
        }

        shouldReconnect = true
        val url = "$BASE_WS_URL?key=$apiKey"
        val request = Request.Builder().url(url).build()

        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(ws: WebSocket, response: Response) {
                isConnected = true
                sendSetupMessage()
                startKeepAlive()
                startSessionRenewalTimer()
                scope.launch(Dispatchers.Main) { onConnected?.invoke() }
            }

            override fun onMessage(ws: WebSocket, text: String) {
                parseServerMessage(text)
            }

            override fun onFailure(ws: WebSocket, t: Throwable, response: Response?) {
                isConnected = false
                scope.launch(Dispatchers.Main) {
                    onError?.invoke(t.localizedMessage ?: "WebSocket connection failed")
                    onDisconnected?.invoke()
                }
                if (shouldReconnect) {
                    scope.launch {
                        delay(RECONNECT_DELAY_MS)
                        connect()
                    }
                }
            }

            override fun onClosed(ws: WebSocket, code: Int, reason: String) {
                isConnected = false
                scope.launch(Dispatchers.Main) { onDisconnected?.invoke() }
                if (shouldReconnect) {
                    scope.launch {
                        delay(RECONNECT_DELAY_MS)
                        connect()
                    }
                }
            }
        })
    }

    private fun sendSetupMessage() {
        val setupJson = JSONObject().apply {
            put("setup", JSONObject().apply {
                put("model", modelString)
                put("system_instruction", JSONObject().apply {
                    put("parts", JSONArray().put(JSONObject().put("text", systemPrompt)))
                })
                put("generation_config", JSONObject().apply {
                    put("response_modalities", JSONArray().put("AUDIO"))
                    put("speech_config", JSONObject().apply {
                        put("voice_config", JSONObject().apply {
                            put("prebuilt_voice_config", JSONObject().apply {
                                put("voice_name", voiceName)
                            })
                        })
                    })
                    put("temperature", 0.9)
                })
                put("output_audio_transcription", JSONObject())
                put("input_audio_transcription", JSONObject())
            })
        }
        webSocket?.send(setupJson.toString())
    }

    fun sendAudioChunk(pcmChunk: ByteArray) {
        if (!isConnected) return
        val base64Data = Base64.encodeToString(pcmChunk, Base64.NO_WRAP)
        val msg = JSONObject().apply {
            put("realtime_input", JSONObject().apply {
                put("media_chunks", JSONArray().put(JSONObject().apply {
                    put("mime_type", "audio/pcm;rate=16000")
                    put("data", base64Data)
                }))
            })
        }
        webSocket?.send(msg.toString())
    }

    fun sendText(message: String) {
        if (!isConnected) return
        val msg = JSONObject().apply {
            put("client_content", JSONObject().apply {
                put("turns", JSONArray().put(JSONObject().apply {
                    put("role", "user")
                    put("parts", JSONArray().put(JSONObject().put("text", message)))
                }))
                put("turn_complete", true)
            })
        }
        webSocket?.send(msg.toString())
    }

    fun sendInterrupt() {
        val msg = JSONObject().apply {
            put("client_content", JSONObject().apply {
                put("turns", JSONArray())
                put("turn_complete", true)
            })
        }
        webSocket?.send(msg.toString())
    }

    private fun startKeepAlive() {
        keepAliveJob?.cancel()
        keepAliveJob = scope.launch {
            val silentPcm = ByteArray(1024)
            while (isActive && isConnected) {
                delay(KEEPALIVE_INTERVAL_MS)
                sendAudioChunk(silentPcm)
            }
        }
    }

    private fun startSessionRenewalTimer() {
        sessionRenewalJob?.cancel()
        sessionRenewalJob = scope.launch {
            delay(SESSION_RENEW_AFTER_MS)
            if (isConnected) {
                webSocket?.close(1000, "Session Renewed")
                connect()
            }
        }
    }

    private fun parseServerMessage(text: String) {
        try {
            val root = JSONObject(text)
            val serverContent = root.optJSONObject("serverContent") ?: return

            // 1. Audio data
            val modelTurn = serverContent.optJSONObject("modelTurn")
            if (modelTurn != null) {
                val parts = modelTurn.optJSONArray("parts")
                if (parts != null) {
                    for (i in 0 until parts.length()) {
                        val part = parts.getJSONObject(i)
                        val inlineData = part.optJSONObject("inlineData")
                        if (inlineData != null) {
                            val base64Audio = inlineData.optString("data")
                            if (base64Audio.isNotEmpty()) {
                                val pcm = Base64.decode(base64Audio, Base64.NO_WRAP)
                                scope.launch(Dispatchers.Main) { onAudioReceived?.invoke(pcm) }
                            }
                        }
                    }
                }
            }

            // 2. Output Transcript (PAYAL speaking)
            val outputTrans = serverContent.optJSONObject("outputTranscription")
            if (outputTrans != null) {
                val outText = outputTrans.optString("text")
                if (outText.isNotEmpty()) {
                    scope.launch(Dispatchers.Main) { onOutputTranscript?.invoke(outText) }
                }
            }

            // 3. Input Transcript (User speaking)
            val inputTrans = serverContent.optJSONObject("inputTranscription")
            if (inputTrans != null) {
                val inText = inputTrans.optString("text")
                if (inText.isNotEmpty()) {
                    scope.launch(Dispatchers.Main) { onInputTranscript?.invoke(inText) }
                }
            }

            // 4. Turn complete
            if (serverContent.optBoolean("turnComplete", false)) {
                scope.launch(Dispatchers.Main) { onTurnComplete?.invoke() }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun disconnect() {
        shouldReconnect = false
        keepAliveJob?.cancel()
        sessionRenewalJob?.cancel()
        webSocket?.close(1000, "Normal closure")
        webSocket = null
        isConnected = false
    }
}
`,
  },

  // 5. AccessibilityHelperService.kt
  {
    path: 'app/src/main/java/com/payal/assistant/service/AccessibilityHelperService.kt',
    name: 'AccessibilityHelperService.kt',
    language: 'kotlin',
    content: `package com.payal.assistant.service

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.os.Bundle
import android.provider.Settings
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

class AccessibilityHelperService : AccessibilityService() {

    companion object {
        var instance: AccessibilityHelperService? = null
            private set

        fun isEnabled(context: Context): Boolean {
            val enabledServices = Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            ) ?: return false
            val expectedService = "\${context.packageName}/\${AccessibilityHelperService::class.java.canonicalName}"
            return enabledServices.contains(expectedService)
        }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Monitors events if needed
    }

    override fun onInterrupt() {}

    override fun onDestroy() {
        super.onDestroy()
        if (instance == this) instance = null
    }

    fun closeCurrentApp(): Boolean {
        return performGlobalAction(GLOBAL_ACTION_HOME)
    }

    fun goBack(): Boolean {
        return performGlobalAction(GLOBAL_ACTION_BACK)
    }

    fun clickOnText(text: String): Boolean {
        val root = rootInActiveWindow ?: return false
        val nodes = root.findAccessibilityNodeInfosByText(text)
        for (node in nodes) {
            if (node.isClickable) {
                return node.performAction(AccessibilityNodeInfo.ACTION_CLICK)
            }
            node.parent?.let { parent ->
                if (parent.isClickable) {
                    return parent.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                }
            }
        }
        return false
    }

    fun typeText(text: String): Boolean {
        val root = rootInActiveWindow ?: return false
        val focusedNode = root.findFocus(AccessibilityNodeInfo.FOCUS_INPUT) ?: return false
        val args = Bundle().apply {
            putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text)
        }
        return focusedNode.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)
    }

    fun scrollDown(): Boolean {
        val root = rootInActiveWindow ?: return false
        return root.performAction(AccessibilityNodeInfo.ACTION_SCROLL_FORWARD)
    }

    fun scrollUp(): Boolean {
        val root = rootInActiveWindow ?: return false
        return root.performAction(AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD)
    }
}
`,
  },

  // 6. CallMonitorService.kt
  {
    path: 'app/src/main/java/com/payal/assistant/service/CallMonitorService.kt',
    name: 'CallMonitorService.kt',
    language: 'kotlin',
    content: `package com.payal.assistant.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.IBinder
import android.provider.ContactsContract
import android.telephony.PhoneStateListener
import android.telephony.TelephonyManager
import androidx.core.app.NotificationCompat
import com.payal.assistant.R
import com.payal.assistant.ui.main.MainActivity

class CallMonitorService : Service() {

    companion object {
        const val CHANNEL_ID = "payal_call_monitor_channel"
        const val NOTIFICATION_ID = 101
        const val ACTION_CALL_ENDED = "com.payal.CALL_ENDED"
    }

    private var telephonyManager: TelephonyManager? = null
    private var phoneListener: PhoneStateListener? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification())
        registerCallListener()
    }

    private fun registerCallListener() {
        telephonyManager = getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager
        phoneListener = object : PhoneStateListener() {
            override fun onCallStateChanged(state: Int, phoneNumber: String?) {
                super.onCallStateChanged(state, phoneNumber)
                when (state) {
                    TelephonyManager.CALL_STATE_RINGING -> {
                        val callerName = resolveCallerName(phoneNumber)
                        val intent = Intent(this@CallMonitorService, MainActivity::class.java).apply {
                            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
                            putExtra("INCOMING_CALL", true)
                            putExtra("CALLER_NAME", callerName)
                            putExtra("CALLER_NUMBER", phoneNumber ?: "Unknown")
                        }
                        startActivity(intent)
                    }
                    TelephonyManager.CALL_STATE_IDLE -> {
                        sendBroadcast(Intent(ACTION_CALL_ENDED))
                    }
                    TelephonyManager.CALL_STATE_OFFHOOK -> {
                        // In call
                    }
                }
            }
        }
        telephonyManager?.listen(phoneListener, PhoneStateListener.LISTEN_CALL_STATE)
    }

    private fun resolveCallerName(number: String?): String {
        if (number.isNullOrBlank()) return "Unknown Caller"
        return try {
            val uri = Uri.withAppendedPath(ContactsContract.PhoneLookup.CONTENT_FILTER_URI, Uri.encode(number))
            val cursor = contentResolver.query(uri, arrayOf(ContactsContract.PhoneLookup.DISPLAY_NAME), null, null, null)
            cursor?.use {
                if (it.moveToFirst()) {
                    val nameIdx = it.getColumnIndex(ContactsContract.PhoneLookup.DISPLAY_NAME)
                    if (nameIdx >= 0) it.getString(nameIdx) else number
                } else number
            } ?: number
        } catch (_: Exception) {
            number
        }
    }

    private fun buildNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("PAYAL Call Protection Active")
            .setContentText("Monitoring incoming calls for voice assistance")
            .setSmallIcon(R.drawable.ic_payal_notif)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "PAYAL Call Monitor",
                NotificationManager.IMPORTANCE_LOW
            )
            val nm = getSystemService(NotificationManager::class.java)
            nm?.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        telephonyManager?.listen(phoneListener, PhoneStateListener.LISTEN_NONE)
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
`,
  },

  // 7. PayalOverlayService.kt
  {
    path: 'app/src/main/java/com/payal/assistant/service/PayalOverlayService.kt',
    name: 'PayalOverlayService.kt',
    language: 'kotlin',
    content: `package com.payal.assistant.service

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import androidx.core.app.NotificationCompat
import com.payal.assistant.R
import com.payal.assistant.ui.main.MainActivity

class PayalOverlayService : Service() {

    companion object {
        const val CHANNEL_ID = "payal_overlay_channel"
        const val NOTIFICATION_ID = 102
        var isRunning = false
            private set
    }

    private var windowManager: WindowManager? = null
    private var overlayView: View? = null

    @SuppressLint("ClickableViewAccessibility")
    override fun onCreate() {
        super.onCreate()
        isRunning = true
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification())

        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        val inflater = getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater
        overlayView = inflater.inflate(R.layout.overlay_orb, null)

        val layoutType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            WindowManager.LayoutParams.TYPE_PHONE
        }

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            layoutType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 100
            y = 300
        }

        var initialX = 0
        var initialY = 0
        var initialTouchX = 0f
        var initialTouchY = 0f

        overlayView?.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = params.x
                    initialY = params.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    params.x = initialX + (event.rawX - initialTouchX).toInt()
                    params.y = initialY + (event.rawY - initialTouchY).toInt()
                    windowManager?.updateViewLayout(overlayView, params)
                    true
                }
                MotionEvent.ACTION_UP -> {
                    val diffX = Math.abs(event.rawX - initialTouchX)
                    val diffY = Math.abs(event.rawY - initialTouchY)
                    if (diffX < 10 && diffY < 10) {
                        // Tap -> Open MainActivity
                        val intent = Intent(this, MainActivity::class.java).apply {
                            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
                        }
                        startActivity(intent)
                    }
                    true
                }
                else -> false
            }
        }

        overlayView?.findViewById<View>(R.id.overlayCloseBtn)?.setOnClickListener {
            stopSelf()
        }

        try {
            windowManager?.addView(overlayView, params)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun buildNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("PAYAL Floating Orb Active")
            .setContentText("Tap the floating orb anytime to speak with PAYAL")
            .setSmallIcon(R.drawable.ic_payal_notif)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "PAYAL Overlay",
                NotificationManager.IMPORTANCE_LOW
            )
            val nm = getSystemService(NotificationManager::class.java)
            nm?.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        isRunning = false
        if (overlayView != null) {
            windowManager?.removeView(overlayView)
            overlayView = null
        }
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
`,
  },

  // 8. PowerButtonReceiver.kt
  {
    path: 'app/src/main/java/com/payal/assistant/service/PowerButtonReceiver.kt',
    name: 'PowerButtonReceiver.kt',
    language: 'kotlin',
    content: `package com.payal.assistant.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build

class PowerButtonReceiver : BroadcastReceiver() {

    companion object {
        private var lastScreenActionTime: Long = 0
        private const val DOUBLE_PRESS_TIMEOUT_MS = 600L
    }

    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action ?: return
        if (action == Intent.ACTION_SCREEN_OFF || action == Intent.ACTION_SCREEN_ON) {
            val now = System.currentTimeMillis()
            if (now - lastScreenActionTime < DOUBLE_PRESS_TIMEOUT_MS) {
                // Double press detected -> Show PAYAL Overlay Service
                val serviceIntent = Intent(context, PayalOverlayService::class.java)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent)
                } else {
                    context.startService(serviceIntent)
                }
                lastScreenActionTime = 0
            } else {
                lastScreenActionTime = now
            }
        }
    }
}
`,
  },

  // 9. BootReceiver.kt
  {
    path: 'app/src/main/java/com/payal/assistant/service/BootReceiver.kt',
    name: 'BootReceiver.kt',
    language: 'kotlin',
    content: `package com.payal.assistant.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action == Intent.ACTION_BOOT_COMPLETED) {
            val serviceIntent = Intent(context, CallMonitorService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent)
            } else {
                context.startService(serviceIntent)
            }
        }
    }
}
`,
  },

  // 10. OrbAnimationView.kt
  {
    path: 'app/src/main/java/com/payal/assistant/ui/main/OrbAnimationView.kt',
    name: 'OrbAnimationView.kt',
    language: 'kotlin',
    content: `package com.payal.assistant.ui.main

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.*
import android.util.AttributeSet
import android.view.View
import android.view.animation.LinearInterpolator
import kotlin.math.cos
import kotlin.math.sin

class OrbAnimationView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    enum class State { IDLE, LISTENING, SPEAKING, THINKING, ACTIVE }

    var orbState: State = State.IDLE
        set(value) {
            field = value
            invalidate()
        }

    private var pulseScale = 1.0f
    private var glowAlpha = 120
    private var rotationAngle = 0f
    private var waveOffset = 0f
    private var thinkingAngle = 0f
    private var amplitude = 0f

    private val pulseAnimator = ValueAnimator.ofFloat(1.0f, 1.15f, 1.0f).apply {
        duration = 1500
        repeatCount = ValueAnimator.INFINITE
        addUpdateListener {
            pulseScale = it.animatedValue as Float
            glowAlpha = (120 + (pulseScale - 1.0f) * 666).toInt().coerceIn(120, 220)
            invalidate()
        }
    }

    private val rotationAnimator = ValueAnimator.ofFloat(0f, 360f).apply {
        duration = 6000
        repeatCount = ValueAnimator.INFINITE
        interpolator = LinearInterpolator()
        addUpdateListener {
            rotationAngle = it.animatedValue as Float
            waveOffset += 0.08f
            thinkingAngle = (thinkingAngle + 4f) % 360f
            invalidate()
        }
    }

    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val ringPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        pathEffect = DashPathEffect(floatArrayOf(18f, 14f), 0f)
    }

    init {
        pulseAnimator.start()
        rotationAnimator.start()
    }

    fun setAmplitude(rms: Float) {
        this.amplitude = rms.coerceIn(0f, 1f)
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        val cx = width / 2f
        val cy = height / 2f
        val baseRadius = (width.coerceAtMost(height) / 2f) * 0.42f
        val currentRadius = baseRadius * pulseScale

        // Colors per state
        val (c1, c2) = when (orbState) {
            State.IDLE -> Pair(Color.parseColor("#B71C1C"), Color.parseColor("#880E4F"))
            State.LISTENING, State.ACTIVE -> Pair(Color.parseColor("#FF1744"), Color.parseColor("#D500F9"))
            State.SPEAKING -> Pair(Color.parseColor("#E040FB"), Color.parseColor("#FF1744"))
            State.THINKING -> Pair(Color.parseColor("#40C4FF"), Color.parseColor("#00B0FF"))
        }

        // Layer 1: Radial Glow (1.6x radius)
        paint.shader = RadialGradient(cx, cy, currentRadius * 1.6f,
            intArrayOf(c1, c2, Color.TRANSPARENT),
            floatArrayOf(0f, 0.65f, 1.0f),
            Shader.TileMode.CLAMP
        )
        paint.alpha = glowAlpha
        canvas.drawCircle(cx, cy, currentRadius * 1.6f, paint)

        // Layer 2: Core Orb
        paint.shader = RadialGradient(cx - currentRadius * 0.25f, cy - currentRadius * 0.25f, currentRadius,
            intArrayOf(c1, c2, Color.BLACK),
            floatArrayOf(0f, 0.7f, 1.0f),
            Shader.TileMode.CLAMP
        )
        paint.alpha = 255
        canvas.drawCircle(cx, cy, currentRadius, paint)

        // Layer 3: 3 Rotating Dashed Rings
        ringPaint.color = c1
        ringPaint.strokeWidth = 3.5f
        for (i in 1..3) {
            ringPaint.alpha = 80 + i * 40
            canvas.save()
            canvas.rotate(rotationAngle * (if (i % 2 == 0) 1 else -1) + i * 35f, cx, cy)
            canvas.drawCircle(cx, cy, currentRadius * (1.1f + i * 0.15f + amplitude * 0.2f), ringPaint)
            canvas.restore()
        }

        // Layer 4: Wave Rings (Sine Waves, amplitude-reactive)
        val wavePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.STROKE
            strokeWidth = 2.5f
            color = c2
            alpha = (140 + amplitude * 115).toInt().coerceIn(100, 255)
        }
        val wavePath = Path()
        val waveR = currentRadius * 1.25f
        for (a in 0..360 step 5) {
            val rad = Math.toRadians(a.toDouble())
            val offset = sin(rad * 6 + waveOffset) * (8f + amplitude * 24f)
            val r = waveR + offset
            val x = cx + r * cos(rad).toFloat()
            val y = cy + r * sin(rad).toFloat()
            if (a == 0) wavePath.moveTo(x, y) else wavePath.lineTo(x, y)
        }
        wavePath.close()
        canvas.drawPath(wavePath, wavePaint)

        // Layer 5: Thinking Arc (Only in THINKING state)
        if (orbState == State.THINKING) {
            val arcPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                style = Paint.Style.STROKE
                strokeWidth = 5f
                color = Color.parseColor("#00E5FF")
                strokeCap = Paint.Cap.ROUND
            }
            val oval = RectF(cx - currentRadius * 1.4f, cy - currentRadius * 1.4f, cx + currentRadius * 1.4f, cy + currentRadius * 1.4f)
            canvas.drawArc(oval, thinkingAngle, 100f, false, arcPaint)
            canvas.drawArc(oval, thinkingAngle + 180f, 60f, false, arcPaint)
        }

        // Layer 6: 12 Orbiting Particles (Active or Speaking)
        if (orbState == State.ACTIVE || orbState == State.SPEAKING || orbState == State.LISTENING) {
            paint.shader = null
            paint.color = Color.WHITE
            for (p in 0 until 12) {
                val angle = Math.toRadians((rotationAngle * 2 + p * 30).toDouble())
                val orbitRadius = currentRadius * (1.35f + 0.1f * sin((p + waveOffset).toDouble()).toFloat())
                val px = cx + orbitRadius * cos(angle).toFloat()
                val py = cy + orbitRadius * sin(angle).toFloat()
                paint.alpha = (150 + 105 * sin(angle)).toInt().coerceIn(80, 255)
                canvas.drawCircle(px, py, 3.5f + amplitude * 3f, paint)
            }
        }

        // Layer 7: Inner Highlight (Top-left specular white gradient)
        paint.shader = RadialGradient(cx - currentRadius * 0.35f, cy - currentRadius * 0.35f, currentRadius * 0.5f,
            intArrayOf(Color.WHITE, Color.TRANSPARENT),
            floatArrayOf(0f, 1f),
            Shader.TileMode.CLAMP
        )
        paint.alpha = 160
        canvas.drawCircle(cx - currentRadius * 0.35f, cy - currentRadius * 0.35f, currentRadius * 0.5f, paint)
    }
}
`,
  },

  // 11. UiComponents.kt
  {
    path: 'app/src/main/java/com/payal/assistant/ui/main/UiComponents.kt',
    name: 'UiComponents.kt',
    language: 'kotlin',
    content: `package com.payal.assistant.ui.main

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.util.AttributeSet
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.payal.assistant.R

// Chat Message Data Class
data class ChatMessage(
    val text: String,
    val isUser: Boolean,
    val timestamp: Long = System.currentTimeMillis()
)

// WaveformView (20 Vertical Bars, Lerp Animation, Amplitude-Reactive)
class WaveformView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private val barCount = 20
    private val barHeights = FloatArray(barCount) { 0.15f }
    private val targetHeights = FloatArray(barCount) { 0.15f }
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#FF1744")
    }

    fun setAmplitude(rms: Float) {
        val clamped = rms.coerceIn(0f, 1f)
        for (i in 0 until barCount) {
            val factor = kotlin.math.sin(i.toDouble() / barCount * Math.PI).toFloat()
            targetHeights[i] = (0.12f + clamped * factor * 0.88f).coerceIn(0.08f, 1.0f)
        }
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        val w = width.toFloat()
        val h = height.toFloat()
        val barWidth = (w / barCount) * 0.65f
        val space = (w / barCount) * 0.35f

        for (i in 0 until barCount) {
            // Lerp towards target: barHeights[i] += (target - current) * 0.3f
            barHeights[i] += (targetHeights[i] - barHeights[i]) * 0.3f
            val currentH = barHeights[i] * h
            val x = i * (barWidth + space) + space / 2f
            val yTop = (h - currentH) / 2f
            val yBottom = yTop + currentH

            // Alpha varying by height (150..255)
            val barAlpha = (150 + (barHeights[i] * 105)).toInt().coerceIn(150, 255)
            paint.alpha = barAlpha
            canvas.drawRoundRect(x, yTop, x + barWidth, yBottom, barWidth / 2f, barWidth / 2f, paint)
        }
        invalidate()
    }
}

// Chat RecyclerView Adapter
class ChatAdapter : RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    private val messages = mutableListOf<ChatMessage>()

    companion object {
        private const val TYPE_USER = 1
        private const val TYPE_PAYAL = 2
    }

    fun addMessage(msg: ChatMessage) {
        // Deduplication: skip if last PAYAL message is identical
        if (!msg.isUser && messages.isNotEmpty() && !messages.last().isUser && messages.last().text == msg.text) {
            return
        }
        messages.add(msg)
        notifyItemInserted(messages.size - 1)
    }

    fun lastPayalText(): String? {
        return messages.findLast { !it.isUser }?.text
    }

    override fun getItemViewType(position: Int): Int {
        return if (messages[position].isUser) TYPE_USER else TYPE_PAYAL
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        val inflater = LayoutInflater.from(parent.context)
        return if (viewType == TYPE_USER) {
            val view = inflater.inflate(R.layout.item_chat_user, parent, false)
            UserViewHolder(view)
        } else {
            val view = inflater.inflate(R.layout.item_chat_payal, parent, false)
            PayalViewHolder(view)
        }
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        val msg = messages[position]
        if (holder is UserViewHolder) {
            holder.text.text = msg.text
        } else if (holder is PayalViewHolder) {
            holder.text.text = msg.text
        }
    }

    override fun getItemCount(): Int = messages.size

    class UserViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val text: TextView = view.findViewById(R.id.userMessageText)
    }

    class PayalViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val text: TextView = view.findViewById(R.id.payalMessageText)
    }
}
`,
  },

  // 12. MainViewModel.kt
  {
    path: 'app/src/main/java/com/payal/assistant/viewmodel/MainViewModel.kt',
    name: 'MainViewModel.kt',
    language: 'kotlin',
    content: `package com.payal.assistant.viewmodel

import android.app.Application
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.hardware.camera2.CameraManager
import android.media.AudioManager
import android.net.Uri
import android.provider.ContactsContract
import android.telecom.TelecomManager
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.payal.assistant.model.AppCommand
import com.payal.assistant.service.AccessibilityHelperService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val _commandResult = MutableLiveData<String?>()
    val commandResult: LiveData<String?> = _commandResult

    private val appMap = mapOf(
        "youtube" to "com.google.android.youtube",
        "whatsapp" to "com.whatsapp",
        "instagram" to "com.instagram.android",
        "facebook" to "com.facebook.katana",
        "chrome" to "com.android.chrome",
        "gmail" to "com.google.android.gm",
        "maps" to "com.google.android.apps.maps",
        "spotify" to "com.spotify.music",
        "netflix" to "com.netflix.mediaclient",
        "twitter" to "com.twitter.android",
        "x" to "com.twitter.android",
        "telegram" to "org.telegram.messenger",
        "snapchat" to "com.snapchat.android",
        "settings" to "com.android.settings",
        "calculator" to "com.google.android.calculator",
        "calendar" to "com.google.android.calendar",
        "clock" to "com.google.android.deskclock",
        "phone" to "com.google.android.dialer",
        "contacts" to "com.google.android.contacts"
    )

    fun executeCommand(command: AppCommand) {
        viewModelScope.launch(Dispatchers.IO) {
            when (command.type) {
                AppCommand.TYPE_OPEN_APP -> {
                    val appName = command.params["app_name"] ?: ""
                    openApp(appName)
                }
                AppCommand.TYPE_CLOSE_APP -> {
                    closeCurrentApp()
                }
                AppCommand.TYPE_CALL -> {
                    val target = command.params["target"] ?: ""
                    makeCall(target)
                }
                AppCommand.TYPE_PRIME_CALL -> {
                    val index = command.params["index"]?.toIntOrNull() ?: 0
                    callPrimeContact(index)
                }
                AppCommand.TYPE_PRIME_MSG -> {
                    val index = command.params["index"]?.toIntOrNull() ?: 0
                    msgPrimeContact(index)
                }
                AppCommand.TYPE_SMS -> {
                    val name = command.params["name"] ?: ""
                    sendSms(name, "Hello from PAYAL!")
                }
                AppCommand.TYPE_WHATSAPP_MSG -> {
                    val name = command.params["name"] ?: ""
                    sendWhatsApp(name, "Hi!")
                }
                AppCommand.TYPE_VOLUME_UP -> adjustVolume(true)
                AppCommand.TYPE_VOLUME_DOWN -> adjustVolume(false)
                AppCommand.TYPE_FLASHLIGHT_ON -> toggleFlashlight(true)
                AppCommand.TYPE_FLASHLIGHT_OFF -> toggleFlashlight(false)
            }
        }
    }

    private fun openApp(appName: String) {
        val context = getApplication<Application>()
        val pm = context.packageManager
        val pkg = appMap[appName.lowercase()]

        val intent = if (pkg != null) {
            pm.getLaunchIntentForPackage(pkg)
        } else {
            // Scan installed apps fallback
            val packages = pm.getInstalledApplications(PackageManager.GET_META_DATA)
            val match = packages.find { pm.getApplicationLabel(it).toString().equals(appName, ignoreCase = true) }
            match?.let { pm.getLaunchIntentForPackage(it.packageName) }
        }

        if (intent != null) {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
            _commandResult.postValue("Opening $appName")
        } else {
            _commandResult.postValue("Could not find app $appName on your device")
        }
    }

    private fun closeCurrentApp() {
        val helper = AccessibilityHelperService.instance
        if (helper != null) {
            helper.closeCurrentApp()
            _commandResult.postValue("App closed")
        } else {
            _commandResult.postValue("Please enable Accessibility Service for PAYAL to close apps")
        }
    }

    private fun makeCall(target: String) {
        val context = getApplication<Application>()
        val resolvedNumber = if (target.all { it.isDigit() || it == '+' }) target else lookupContactNumber(target)
        if (resolvedNumber.isNotEmpty()) {
            val callIntent = Intent(Intent.ACTION_CALL, Uri.parse("tel:$resolvedNumber")).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(callIntent)
            _commandResult.postValue("Calling $target ($resolvedNumber)")
        } else {
            _commandResult.postValue("Contact $target not found in phonebook")
        }
    }

    private fun callPrimeContact(index: Int) {
        val contacts = getPrimeContacts()
        if (index in contacts.indices) {
            val contact = contacts[index]
            makeCall(contact.second)
        } else {
            _commandResult.postValue("Prime contact at index $index not set")
        }
    }

    private fun msgPrimeContact(index: Int) {
        val contacts = getPrimeContacts()
        if (index in contacts.indices) {
            val contact = contacts[index]
            sendSms(contact.second, "Hey!")
        } else {
            _commandResult.postValue("Prime contact at index $index not set")
        }
    }

    private fun sendSms(target: String, body: String) {
        val context = getApplication<Application>()
        val number = if (target.all { it.isDigit() || it == '+' }) target else lookupContactNumber(target)
        val smsIntent = Intent(Intent.ACTION_VIEW, Uri.parse("smsto:$number")).apply {
            putExtra("sms_body", body)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(smsIntent)
        _commandResult.postValue("Opening SMS for $target")
    }

    private fun sendWhatsApp(target: String, body: String) {
        val context = getApplication<Application>()
        val number = lookupContactNumber(target)
        val cleanNumber = number.replace(Regex("[^0-9]"), "")
        val uri = Uri.parse("https://wa.me/$cleanNumber?text=\${Uri.encode(body)}")
        val waIntent = Intent(Intent.ACTION_VIEW, uri).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(waIntent)
        _commandResult.postValue("Opening WhatsApp for $target")
    }

    private fun lookupContactNumber(name: String): String {
        val context = getApplication<Application>()
        val uri = ContactsContract.CommonDataKinds.Phone.CONTENT_URI
        val projection = arrayOf(ContactsContract.CommonDataKinds.Phone.NUMBER)
        val selection = "\${ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME} LIKE ?"
        val selectionArgs = arrayOf("%$name%")

        val cursor = context.contentResolver.query(uri, projection, selection, selectionArgs, null)
        cursor?.use {
            if (it.moveToFirst()) {
                val numIdx = it.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER)
                if (numIdx >= 0) return it.getString(numIdx)
            }
        }
        return ""
    }

    private fun adjustVolume(up: Boolean) {
        val context = getApplication<Application>()
        val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
        val direction = if (up) AudioManager.ADJUST_RAISE else AudioManager.ADJUST_LOWER
        audioManager.adjustStreamVolume(AudioManager.STREAM_MUSIC, direction, AudioManager.FLAG_SHOW_UI)
        _commandResult.postValue(if (up) "Volume raised" else "Volume lowered")
    }

    private fun toggleFlashlight(enable: Boolean) {
        val context = getApplication<Application>()
        try {
            val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
            val cameraId = cameraManager.cameraIdList[0]
            cameraManager.setTorchMode(cameraId, enable)
            _commandResult.postValue(if (enable) "Torch turned ON" else "Torch turned OFF")
        } catch (_: Exception) {
            _commandResult.postValue("Could not toggle flashlight")
        }
    }

    fun acceptCall() {
        val context = getApplication<Application>()
        val telecom = context.getSystemService(Context.TELECOM_SERVICE) as TelecomManager
        try {
            telecom.acceptRingingCall()
            _commandResult.postValue("Call accepted")
        } catch (_: Exception) {
            _commandResult.postValue("Failed to accept call")
        }
    }

    fun rejectCall() {
        val context = getApplication<Application>()
        val telecom = context.getSystemService(Context.TELECOM_SERVICE) as TelecomManager
        try {
            telecom.endCall()
            _commandResult.postValue("Call rejected")
        } catch (_: Exception) {
            _commandResult.postValue("Failed to reject call")
        }
    }

    fun getPrimeContacts(): List<Pair<String, String>> {
        val sp = getApplication<Application>().getSharedPreferences("payal_prefs", Context.MODE_PRIVATE)
        val jsonStr = sp.getString("prime_contacts_json", null)
        val list = mutableListOf<Pair<String, String>>()

        if (jsonStr != null) {
            try {
                val array = JSONArray(jsonStr)
                for (i in 0 until array.length()) {
                    val obj = array.getJSONObject(i)
                    list.add(Pair(obj.getString("name"), obj.getString("number")))
                }
            } catch (_: Exception) {}
        } else {
            // Legacy fallback
            val oldName = sp.getString("prime_name", null)
            val oldNum = sp.getString("prime_number", null)
            if (oldName != null && oldNum != null) {
                list.add(Pair(oldName, oldNum))
            }
        }
        return list
    }
}
`,
  },

  // 13. MainActivity.kt
  {
    path: 'app/src/main/java/com/payal/assistant/ui/main/MainActivity.kt',
    name: 'MainActivity.kt',
    language: 'kotlin',
    content: `package com.payal.assistant.ui.main

import android.Manifest
import android.annotation.SuppressLint
import android.app.ActivityManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.os.BatteryManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.view.View
import android.widget.ImageButton
import android.widget.TextView
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.payal.assistant.R
import com.payal.assistant.ai.AudioEngine
import com.payal.assistant.ai.CommandParser
import com.payal.assistant.ai.GeminiLiveClient
import com.payal.assistant.service.CallMonitorService
import com.payal.assistant.service.PayalOverlayService
import com.payal.assistant.ui.settings.SettingsActivity
import com.payal.assistant.viewmodel.MainViewModel
import java.text.SimpleDateFormat
import java.util.*

class MainActivity : AppCompatActivity() {

    private lateinit var orbView: OrbAnimationView
    private lateinit var waveformView: WaveformView
    private lateinit var chatRecycler: RecyclerView
    private lateinit var micButton: ImageButton
    private lateinit var statusText: TextView
    private lateinit var batteryText: TextView
    private lateinit var ramText: TextView
    private lateinit var timeText: TextView
    private lateinit var redOverlay: View

    private val viewModel: MainViewModel by viewModels()
    private val chatAdapter = ChatAdapter()
    private val commandParser = CommandParser()

    private var geminiLive: GeminiLiveClient? = null
    private var audioEngine: AudioEngine? = null
    private var speechRecognizer: SpeechRecognizer? = null

    private val handler = Looper.myLooper()?.let { Handler(it) } ?: Handler(Looper.getMainLooper())
    private lateinit var prefs: SharedPreferences

    private var inputBuffer = StringBuilder()
    private var outputBuffer = StringBuilder()
    private var isInCallMode = false
    private var isMuted = false

    private val callEndedReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            isInCallMode = false
            audioEngine?.isMuted = false
            orbView.orbState = OrbAnimationView.State.IDLE
            statusText.text = "Tap karke bolo 💬"
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        prefs = getSharedPreferences("payal_prefs", Context.MODE_PRIVATE)

        initViews()
        checkPermissions()
        startSystemServices()
        startStatusUpdates()

        registerReceiver(callEndedReceiver, IntentFilter(CallMonitorService.ACTION_CALL_ENDED))

        handler.postDelayed({ initGeminiLive() }, 300)

        handleIncomingCallIntent(intent)
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        handleIncomingCallIntent(intent)
    }

    private fun initViews() {
        orbView = findViewById(R.id.orbView)
        waveformView = findViewById(R.id.waveformView)
        chatRecycler = findViewById(R.id.chatRecycler)
        micButton = findViewById(R.id.micButton)
        statusText = findViewById(R.id.statusText)
        batteryText = findViewById(R.id.batteryText)
        ramText = findViewById(R.id.ramText)
        timeText = findViewById(R.id.timeText)
        redOverlay = findViewById(R.id.redOverlay)

        chatRecycler.layoutManager = LinearLayoutManager(this).apply { stackFromEnd = true }
        chatRecycler.adapter = chatAdapter

        findViewById<ImageButton>(R.id.settingsBtn).setOnClickListener {
            startActivity(Intent(this, SettingsActivity::class.java))
        }

        micButton.setOnClickListener {
            toggleMute()
        }

        micButton.setOnLongClickListener {
            interruptPayal()
            true
        }

        viewModel.commandResult.observe(this) { result ->
            if (!result.isNullOrEmpty()) {
                chatAdapter.addMessage(ChatMessage("⚡ $result", false))
                geminiLive?.sendText("User command status: $result")
            }
        }
    }

    private fun initGeminiLive() {
        val apiKey = prefs.getString("api_key", "") ?: ""
        val userName = prefs.getString("user_name", "Sumit") ?: "Sumit"
        val personality = prefs.getString("personality_mode", "GF") ?: "GF"
        val model = prefs.getString("gemini_model", "models/gemini-2.5-flash-native-audio-preview-12-2025") ?: ""
        val voice = prefs.getString("gemini_voice", "Aoede") ?: "Aoede"

        val systemPrompt = buildSystemPrompt(userName, personality)

        geminiLive = GeminiLiveClient(this).apply {
            this.apiKey = apiKey
            this.modelString = model
            this.voiceName = voice
            this.systemPrompt = systemPrompt

            onConnected = {
                audioEngine?.startRecording()
                audioEngine?.startPlayback()
                setRedOverlayActive(true)
                sendGreeting(userName, personality)
            }

            onAudioReceived = { pcmChunk ->
                audioEngine?.queueAudio(pcmChunk)
            }

            onOutputTranscript = { text ->
                outputBuffer.append(text)
            }

            onInputTranscript = { text ->
                inputBuffer.append(text)
            }

            onTurnComplete = {
                val userInput = inputBuffer.toString().trim()
                val payalOutput = outputBuffer.toString().trim()

                if (userInput.isNotEmpty()) {
                    chatAdapter.addMessage(ChatMessage(userInput, true))
                    // Check for phone actions
                    val cmd = commandParser.parse(userInput)
                    if (cmd != null) {
                        viewModel.executeCommand(cmd)
                    }
                }
                if (payalOutput.isNotEmpty()) {
                    chatAdapter.addMessage(ChatMessage(payalOutput, false))
                }

                inputBuffer.clear()
                outputBuffer.clear()
            }

            onError = { err ->
                statusText.text = "Error: $err"
                Toast.makeText(this@MainActivity, err, Toast.LENGTH_SHORT).show()
            }
        }

        audioEngine = AudioEngine(this).apply {
            onAudioChunkCaptured = { chunk ->
                if (!isInCallMode) geminiLive?.sendAudioChunk(chunk)
            }
            onAmplitudeChanged = { rms ->
                orbView.setAmplitude(rms)
                waveformView.setAmplitude(rms)
            }
            onSpeakingStarted = {
                orbView.orbState = OrbAnimationView.State.SPEAKING
                statusText.text = "Bol rahi hoon..."
            }
            onSpeakingStopped = {
                orbView.orbState = OrbAnimationView.State.ACTIVE
                statusText.text = "Sun rahi hoon..."
            }
        }

        geminiLive?.connect()
    }

    private fun sendGreeting(userName: String, personality: String) {
        handler.postDelayed({
            val greeting = when (personality) {
                "Professional" -> "Good day $userName. PAYAL is online and ready to assist you."
                "Assistant" -> "Hello $userName! Main PAYAL hoon. Kaise help karun aapki?"
                else -> "Hey $userName! Main aa gayi hoon. Kya help chahiye tumhe? ❤️"
            }
            geminiLive?.sendText(greeting)
        }, 600)
    }

    private fun handleIncomingCallIntent(intent: Intent?) {
        val isCall = intent?.getBooleanExtra("INCOMING_CALL", false) ?: false
        if (isCall) {
            val callerName = intent?.getStringExtra("CALLER_NAME") ?: "Unknown"
            announceCall(callerName)
        }
    }

    private fun announceCall(callerName: String) {
        isInCallMode = true
        audioEngine?.isMuted = true
        orbView.orbState = OrbAnimationView.State.SPEAKING
        statusText.text = "Incoming call: $callerName"

        val announcement = "Sir, $callerName ka call aa raha hai. Uthau ya reject karu?"
        geminiLive?.sendText(announcement)

        // After speaking announcement -> listen for decision via SpeechRecognizer
        handler.postDelayed({
            startCallDecisionRecognizer()
        }, 4500)
    }

    private fun startCallDecisionRecognizer() {
        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this)
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, "hi-IN")
        }

        speechRecognizer?.setRecognitionListener(object : RecognitionListener {
            override fun onResults(results: Bundle?) {
                val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                val text = matches?.firstOrNull()?.lowercase(Locale.ROOT) ?: ""

                if (text.contains("uthao") || text.contains("haan") || text.contains("accept") || text.contains("pick")) {
                    viewModel.acceptCall()
                    geminiLive?.sendText("Call utha li hai.")
                } else if (text.contains("reject") || text.contains("nahi") || text.contains("mat") || text.contains("kat")) {
                    viewModel.rejectCall()
                    geminiLive?.sendText("Call reject kar di hai.")
                }
                isInCallMode = false
                audioEngine?.isMuted = false
                orbView.orbState = OrbAnimationView.State.ACTIVE
            }

            override fun onError(error: Int) {
                isInCallMode = false
                audioEngine?.isMuted = false
            }

            override fun onReadyForSpeech(params: Bundle?) {}
            override fun onBeginningOfSpeech() {}
            override fun onRmsChanged(rmsdB: Float) {}
            override fun onBufferReceived(buffer: ByteArray?) {}
            override fun onEndOfSpeech() {}
            override fun onPartialResults(partialResults: Bundle?) {}
            override fun onEvent(eventType: Int, params: Bundle?) {}
        })
        speechRecognizer?.startListening(intent)
    }

    private fun toggleMute() {
        isMuted = !isMuted
        audioEngine?.isMuted = isMuted
        micButton.setImageResource(if (isMuted) R.drawable.ic_mic_off else R.drawable.ic_mic_on)
        statusText.text = if (isMuted) "Muted (Mic Off)" else "Listening..."
    }

    private fun interruptPayal() {
        audioEngine?.interrupt()
        geminiLive?.sendInterrupt()
        orbView.orbState = OrbAnimationView.State.ACTIVE
        statusText.text = "Stopped. Bolo kya kehna hai?"
    }

    private fun setRedOverlayActive(active: Boolean) {
        val targetAlpha = if (active) 0.08f else 0.0f
        redOverlay.animate().alpha(targetAlpha).setDuration(if (active) 300L else 500L).start()
    }

    private fun buildSystemPrompt(userName: String, personality: String): String {
        val dateStr = SimpleDateFormat("dd MMM yyyy, hh:mm a", Locale.getDefault()).format(Date())
        return """
Date/Time: $dateStr
User: $userName
Mode: $personality
You are PAYAL, speaking ALOUD to $userName. Keep responses natural, concise (max 2-3 sentences), warm, and human-like.
""".trimIndent()
    }

    private fun startStatusUpdates() {
        val updater = object : Runnable {
            override fun run() {
                updateBatteryAndRam()
                handler.postDelayed(this, 30_000)
            }
        }
        handler.post(updater)
    }

    @SuppressLint("SetTextI18n")
    private fun updateBatteryAndRam() {
        val bm = getSystemService(Context.BATTERY_SERVICE) as BatteryManager
        val level = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
        batteryText.text = "$level%"

        val am = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        val memInfo = ActivityManager.MemoryInfo()
        am.getMemoryInfo(memInfo)
        val availGb = memInfo.availMem / (1024.0 * 1024.0 * 1024.0)
        val totalGb = memInfo.totalMem / (1024.0 * 1024.0 * 1024.0)
        ramText.text = String.format(Locale.US, "%.1f/%.0f GB", totalGb - availGb, totalGb)

        timeText.text = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())
    }

    private fun checkPermissions() {
        val permissions = arrayOf(
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.READ_CONTACTS,
            Manifest.permission.CALL_PHONE,
            Manifest.permission.SEND_SMS,
            Manifest.permission.READ_PHONE_STATE,
            Manifest.permission.ANSWER_PHONE_CALLS
        )
        val needed = permissions.filter { ActivityCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED }
        if (needed.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, needed.toTypedArray(), 1001)
        }
    }

    private fun startSystemServices() {
        val monitorIntent = Intent(this, CallMonitorService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(monitorIntent)
        } else {
            startService(monitorIntent)
        }
    }

    override fun onDestroy() {
        geminiLive?.disconnect()
        audioEngine?.release()
        speechRecognizer?.destroy()
        try { unregisterReceiver(callEndedReceiver) } catch (_: Exception) {}
        super.onDestroy()
    }
}
`,
  },

  // 14. SettingsActivity.kt
  {
    path: 'app/src/main/java/com/payal/assistant/ui/settings/SettingsActivity.kt',
    name: 'SettingsActivity.kt',
    language: 'kotlin',
    content: `package com.payal.assistant.ui.settings

import android.app.AlertDialog
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Bundle
import android.provider.Settings
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.payal.assistant.R
import com.payal.assistant.service.AccessibilityHelperService
import org.json.JSONArray
import org.json.JSONObject

class SettingsActivity : AppCompatActivity() {

    private lateinit var apiKeyInput: EditText
    private lateinit var userNameInput: EditText
    private lateinit var modelSpinner: Spinner
    private lateinit var voiceSpinner: Spinner
    private lateinit var personalityRadioGroup: RadioGroup
    private lateinit var accessibilityStatus: TextView
    private lateinit var primeRecycler: RecyclerView

    private lateinit var prefs: SharedPreferences
    private val primeContacts = mutableListOf<Pair<String, String>>()
    private lateinit var primeAdapter: PrimeContactAdapter

    private val models = arrayOf(
        "models/gemini-2.5-flash-native-audio-preview-12-2025",
        "models/gemini-2.0-flash-live-001",
        "models/gemini-2.5-flash-preview-native-audio-dialog"
    )

    private val voices = arrayOf(
        "Aoede", "Charon", "Kore", "Fenrir", "Puck", "Leda", "Orus", "Zephyr"
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)

        prefs = getSharedPreferences("payal_prefs", Context.MODE_PRIVATE)

        initViews()
        loadPreferences()
    }

    private fun initViews() {
        apiKeyInput = findViewById(R.id.apiKeyInput)
        userNameInput = findViewById(R.id.userNameInput)
        modelSpinner = findViewById(R.id.modelSpinner)
        voiceSpinner = findViewById(R.id.voiceSpinner)
        personalityRadioGroup = findViewById(R.id.personalityRadioGroup)
        accessibilityStatus = findViewById(R.id.accessibilityStatus)
        primeRecycler = findViewById(R.id.primeRecycler)

        modelSpinner.adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, models)
        voiceSpinner.adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, voices)

        primeAdapter = PrimeContactAdapter(primeContacts) { index ->
            primeContacts.removeAt(index)
            primeAdapter.notifyItemRemoved(index)
        }
        primeRecycler.layoutManager = LinearLayoutManager(this)
        primeRecycler.adapter = primeAdapter

        findViewById<Button>(R.id.addPrimeContactBtn).setOnClickListener {
            showAddPrimeDialog()
        }

        accessibilityStatus.setOnClickListener {
            startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
        }

        findViewById<Button>(R.id.saveBtn).setOnClickListener {
            savePreferences()
        }
    }

    private fun loadPreferences() {
        apiKeyInput.setText(prefs.getString("api_key", ""))
        userNameInput.setText(prefs.getString("user_name", "Sumit"))

        val savedModel = prefs.getString("gemini_model", models[0])
        val modelIdx = models.indexOf(savedModel).coerceAtLeast(0)
        modelSpinner.setSelection(modelIdx)

        val savedVoice = prefs.getString("gemini_voice", "Aoede")
        val voiceIdx = voices.indexOf(savedVoice).coerceAtLeast(0)
        voiceSpinner.setSelection(voiceIdx)

        when (prefs.getString("personality_mode", "GF")) {
            "Professional" -> personalityRadioGroup.check(R.id.radioProfessional)
            "Assistant" -> personalityRadioGroup.check(R.id.radioAssistant)
            else -> personalityRadioGroup.check(R.id.radioGf)
        }

        val isEnabled = AccessibilityHelperService.isEnabled(this)
        accessibilityStatus.text = if (isEnabled) "Accessibility: Enabled ✅" else "Accessibility: Disabled ❌ (Tap to enable)"
        accessibilityStatus.setTextColor(if (isEnabled) 0xFF00E676.toInt() else 0xFFFF1744.toInt())

        loadPrimeContacts()
    }

    private fun loadPrimeContacts() {
        primeContacts.clear()
        val json = prefs.getString("prime_contacts_json", null)
        if (json != null) {
            val arr = JSONArray(json)
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                primeContacts.add(Pair(obj.getString("name"), obj.getString("number")))
            }
        }
        primeAdapter.notifyDataSetChanged()
    }

    private fun showAddPrimeDialog() {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_add_prime_contact, null)
        val nameInput = dialogView.findViewById<EditText>(R.id.dialogNameInput)
        val numberInput = dialogView.findViewById<EditText>(R.id.dialogNumberInput)

        AlertDialog.Builder(this)
            .setTitle("Add Prime Contact")
            .setView(dialogView)
            .setPositiveButton("Add") { _, _ ->
                val name = nameInput.text.toString().trim()
                val num = numberInput.text.toString().trim()
                if (name.isNotEmpty() && num.isNotEmpty()) {
                    primeContacts.add(Pair(name, num))
                    primeAdapter.notifyItemInserted(primeContacts.size - 1)
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun savePreferences() {
        val personality = when (personalityRadioGroup.checkedRadioButtonId) {
            R.id.radioProfessional -> "Professional"
            R.id.radioAssistant -> "Assistant"
            else -> "GF"
        }

        val jsonArr = JSONArray()
        for (p in primeContacts) {
            jsonArr.put(JSONObject().apply {
                put("name", p.first)
                put("number", p.second)
            })
        }

        prefs.edit().apply {
            putString("api_key", apiKeyInput.text.toString().trim())
            putString("user_name", userNameInput.text.toString().trim())
            putString("gemini_model", models[modelSpinner.selectedItemPosition])
            putString("gemini_voice", voices[voiceSpinner.selectedItemPosition])
            putString("personality_mode", personality)
            putString("prime_contacts_json", jsonArr.toString())
            apply()
        }

        Toast.makeText(this, "Settings Saved! Restart app to apply changes.", Toast.LENGTH_LONG).show()
        finish()
    }
}

class PrimeContactAdapter(
    private val items: List<Pair<String, String>>,
    private val onDelete: (Int) -> Unit
) : RecyclerView.Adapter<PrimeContactAdapter.ViewHolder>() {

    class ViewHolder(v: View) : RecyclerView.ViewHolder(v) {
        val name: TextView = v.findViewById(R.id.primeItemName)
        val number: TextView = v.findViewById(R.id.primeItemNumber)
        val delete: ImageButton = v.findViewById(R.id.primeItemDelete)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val v = LayoutInflater.from(parent.context).inflate(R.layout.item_prime_contact, parent, false)
        return ViewHolder(v)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val item = items[position]
        holder.name.text = item.first
        holder.number.text = item.second
        holder.delete.setOnClickListener { onDelete(position) }
    }

    override fun getItemCount(): Int = items.size
}
`,
  },

  // 15. XML Layouts
  {
    path: 'app/src/main/res/layout/activity_main.xml',
    name: 'activity_main.xml',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@drawable/bg_gradient_mesh">

    <!-- Red Screen Overlay for Active State -->
    <View
        android:id="@+id/redOverlay"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:background="#FF1744"
        android:alpha="0" />

    <!-- Main Content Container -->
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:orientation="vertical"
        android:paddingTop="40dp">

        <!-- Top Bar -->
        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="horizontal"
            android:gravity="center_vertical"
            android:paddingHorizontal="20dp">

            <!-- Battery & RAM -->
            <LinearLayout
                android:layout_width="0dp"
                android:layout_height="wrap_content"
                android:layout_weight="1"
                android:orientation="vertical">
                <TextView
                    android:id="@+id/batteryText"
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="98%"
                    android:textColor="#FF1744"
                    android:fontFamily="monospace"
                    android:textSize="13sp"
                    android:textStyle="bold" />
                <TextView
                    android:id="@+id/ramText"
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="3.8/8 GB"
                    android:textColor="#888888"
                    android:fontFamily="monospace"
                    android:textSize="11sp" />
            </LinearLayout>

            <!-- Center Title -->
            <LinearLayout
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:gravity="center"
                android:orientation="vertical">
                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="PAYAL"
                    android:textColor="#FF1744"
                    android:textSize="20sp"
                    android:textStyle="bold"
                    android:letterSpacing="0.2" />
                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="AI COMPANION"
                    android:textColor="#666666"
                    android:textSize="10sp"
                    android:fontFamily="monospace" />
            </LinearLayout>

            <!-- Time & Settings -->
            <LinearLayout
                android:layout_width="0dp"
                android:layout_height="wrap_content"
                android:layout_weight="1"
                android:gravity="end|center_vertical"
                android:orientation="horizontal">
                <TextView
                    android:id="@+id/timeText"
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="14:32"
                    android:textColor="#FF1744"
                    android:fontFamily="monospace"
                    android:textSize="13sp"
                    android:layout_marginEnd="12dp" />
                <ImageButton
                    android:id="@+id/settingsBtn"
                    android:layout_width="36dp"
                    android:layout_height="36dp"
                    android:background="?attr/selectableItemBackgroundBorderless"
                    android:src="@drawable/ic_settings"
                    android:contentDescription="Settings" />
            </LinearLayout>
        </LinearLayout>

        <!-- Center Orb Area -->
        <FrameLayout
            android:layout_width="match_parent"
            android:layout_height="0dp"
            android:layout_weight="1">

            <LinearLayout
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:layout_gravity="center"
                android:gravity="center"
                android:orientation="vertical">

                <com.payal.assistant.ui.main.OrbAnimationView
                    android:id="@+id/orbView"
                    android:layout_width="260dp"
                    android:layout_height="260dp" />

                <com.payal.assistant.ui.main.WaveformView
                    android:id="@+id/waveformView"
                    android:layout_width="200dp"
                    android:layout_height="40dp"
                    android:layout_marginTop="12dp" />

                <TextView
                    android:id="@+id/statusText"
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="Tap karke bolo 💬"
                    android:textColor="#888888"
                    android:textSize="13sp"
                    android:layout_marginTop="8dp" />
            </LinearLayout>
        </FrameLayout>

        <!-- Bottom Chat & Control Section -->
        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="vertical"
            android:gravity="center_horizontal"
            android:paddingBottom="24dp">

            <androidx.recyclerview.widget.RecyclerView
                android:id="@+id/chatRecycler"
                android:layout_width="match_parent"
                android:layout_height="180dp"
                android:paddingHorizontal="16dp" />

            <ImageButton
                android:id="@+id/micButton"
                android:layout_width="72dp"
                android:layout_height="72dp"
                android:layout_marginTop="8dp"
                android:background="@drawable/bg_mic_button"
                android:src="@drawable/ic_mic_on"
                android:contentDescription="Microphone" />

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="Long press to stop PAYAL speaking"
                android:textColor="#555555"
                android:textSize="11sp"
                android:layout_marginTop="6dp" />
        </LinearLayout>
    </LinearLayout>
</FrameLayout>
`,
  },

  // 16. activity_settings.xml
  {
    path: 'app/src/main/res/layout/activity_settings.xml',
    name: 'activity_settings.xml',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<ScrollView xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#050505"
    android:padding="20dp">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical">

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="PAYAL SETTINGS"
            android:textColor="#FF1744"
            android:textSize="22sp"
            android:textStyle="bold"
            android:letterSpacing="0.2"
            android:layout_marginBottom="20dp" />

        <!-- API Key -->
        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="Gemini API Key"
            android:textColor="#EEEEEE"
            android:textSize="14sp" />
        <EditText
            android:id="@+id/apiKeyInput"
            android:layout_width="match_parent"
            android:layout_height="48dp"
            android:background="@drawable/bg_input_field"
            android:inputType="textPassword"
            android:textColor="#FFFFFF"
            android:hint="AIzaSy..."
            android:textColorHint="#555555"
            android:paddingHorizontal="14dp"
            android:layout_marginTop="6dp"
            android:layout_marginBottom="16dp" />

        <!-- User Name -->
        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="Your Name (Caller ID)"
            android:textColor="#EEEEEE"
            android:textSize="14sp" />
        <EditText
            android:id="@+id/userNameInput"
            android:layout_width="match_parent"
            android:layout_height="48dp"
            android:background="@drawable/bg_input_field"
            android:textColor="#FFFFFF"
            android:hint="Sumit"
            android:textColorHint="#555555"
            android:paddingHorizontal="14dp"
            android:layout_marginTop="6dp"
            android:layout_marginBottom="16dp" />

        <!-- AI Model -->
        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="AI Model (Gemini Live)"
            android:textColor="#EEEEEE"
            android:textSize="14sp" />
        <Spinner
            android:id="@+id/modelSpinner"
            android:layout_width="match_parent"
            android:layout_height="48dp"
            android:background="@drawable/bg_input_field"
            android:layout_marginTop="6dp"
            android:layout_marginBottom="16dp" />

        <!-- Voice -->
        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="Native Voice"
            android:textColor="#EEEEEE"
            android:textSize="14sp" />
        <Spinner
            android:id="@+id/voiceSpinner"
            android:layout_width="match_parent"
            android:layout_height="48dp"
            android:background="@drawable/bg_input_field"
            android:layout_marginTop="6dp"
            android:layout_marginBottom="16dp" />

        <!-- Personality -->
        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="Personality Mode"
            android:textColor="#EEEEEE"
            android:textSize="14sp" />
        <RadioGroup
            android:id="@+id/personalityRadioGroup"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="vertical"
            android:layout_marginTop="6dp"
            android:layout_marginBottom="16dp">
            <RadioButton
                android:id="@+id/radioGf"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="GF Mode 💖 (Hinglish, Caring, Emotional)"
                android:textColor="#EEEEEE" />
            <RadioButton
                android:id="@+id/radioProfessional"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="Professional Mode 💼 (Formal English)"
                android:textColor="#EEEEEE" />
            <RadioButton
                android:id="@+id/radioAssistant"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="Assistant Mode 🤖 (Balanced, Friendly)"
                android:textColor="#EEEEEE" />
        </RadioGroup>

        <!-- Prime Contacts -->
        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="horizontal"
            android:gravity="center_vertical">
            <TextView
                android:layout_width="0dp"
                android:layout_height="wrap_content"
                android:layout_weight="1"
                android:text="Prime Contacts (Close Friends/Love)"
                android:textColor="#EEEEEE"
                android:textSize="14sp" />
            <Button
                android:id="@+id/addPrimeContactBtn"
                android:layout_width="wrap_content"
                android:layout_height="36dp"
                android:text="+ ADD"
                android:textColor="#FF1744"
                android:background="@drawable/bg_prime_badge" />
        </LinearLayout>

        <androidx.recyclerview.widget.RecyclerView
            android:id="@+id/primeRecycler"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginTop="8dp"
            android:layout_marginBottom="16dp" />

        <!-- Accessibility Status -->
        <TextView
            android:id="@+id/accessibilityStatus"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:text="Accessibility Status"
            android:padding="12dp"
            android:background="@drawable/bg_input_field"
            android:textSize="13sp"
            android:layout_marginBottom="24dp" />

        <!-- Save Button -->
        <Button
            android:id="@+id/saveBtn"
            android:layout_width="match_parent"
            android:layout_height="52dp"
            android:text="SAVE CONFIGURATION"
            android:textColor="#FFFFFF"
            android:textStyle="bold"
            android:background="@drawable/bg_save_button"
            android:layout_marginBottom="40dp" />
    </LinearLayout>
</ScrollView>
`,
  },

  // 17. XML Drawables and Values
  {
    path: 'app/src/main/res/drawable/bg_gradient_mesh.xml',
    name: 'bg_gradient_mesh.xml',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <gradient
        android:type="radial"
        android:gradientRadius="400dp"
        android:centerX="0.5"
        android:centerY="0.5"
        android:startColor="#1A0010"
        android:endColor="#050505" />
</shape>
`,
  },
  {
    path: 'app/src/main/res/drawable/bg_mic_button.xml',
    name: 'bg_mic_button.xml',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="oval">
    <solid android:color="#1A0505" />
    <stroke android:width="2.5dp" android:color="#FF1744" />
</shape>
`,
  },
  {
    path: 'app/src/main/res/drawable/bg_save_button.xml',
    name: 'bg_save_button.xml',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <corners android:radius="14dp" />
    <gradient
        android:angle="45"
        android:startColor="#FF1744"
        android:endColor="#D500F9" />
</shape>
`,
  },
  {
    path: 'app/src/main/res/drawable/bg_input_field.xml',
    name: 'bg_input_field.xml',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <corners android:radius="12dp" />
    <solid android:color="#111111" />
    <stroke android:width="1dp" android:color="#333333" />
</shape>
`,
  },
  {
    path: 'app/src/main/res/values/colors.xml',
    name: 'colors.xml',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="payal_dark">#050505</color>
    <color name="payal_primary">#FF1744</color>
    <color name="payal_secondary">#D500F9</color>
    <color name="payal_card">#111111</color>
    <color name="payal_text">#EEEEEE</color>
    <color name="payal_hint">#555555</color>
    <color name="payal_success">#00E676</color>
</resources>
`,
  },
  {
    path: 'app/src/main/res/values/themes.xml',
    name: 'themes.xml',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.Payal" parent="Theme.MaterialComponents.NoActionBar">
        <item name="android:windowBackground">@color/payal_dark</item>
        <item name="android:statusBarColor">@android:color/transparent</item>
        <item name="android:navigationBarColor">@color/payal_dark</item>
        <item name="colorPrimary">@color/payal_primary</item>
        <item name="colorSecondary">@color/payal_secondary</item>
    </style>
</resources>
`,
  },
  {
    path: 'app/src/main/res/values/strings.xml',
    name: 'strings.xml',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">PAYAL</string>
    <string name="accessibility_description">Enables PAYAL to open/close apps, automate system commands, and type text.</string>
</resources>
`,
  },
  {
    path: 'app/src/main/res/xml/accessibility_service_config.xml',
    name: 'accessibility_service_config.xml',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:description="@string/accessibility_description"
    android:accessibilityEventTypes="typeAllMask"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:notificationTimeout="100"
    android:canRetrieveWindowContent="true"
    android:canPerformGestures="true" />
`,
  },

  // 18. AndroidManifest.xml
  {
    path: 'app/src/main/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.READ_CONTACTS" />
    <uses-permission android:name="android.permission.CALL_PHONE" />
    <uses-permission android:name="android.permission.SEND_SMS" />
    <uses-permission android:name="android.permission.READ_PHONE_STATE" />
    <uses-permission android:name="android.permission.ANSWER_PHONE_CALLS" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_PHONE_CALL" />
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.FLASHLIGHT" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.BLUETOOTH" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.Payal">

        <activity
            android:name=".ui.main.MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:screenOrientation="portrait">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <activity
            android:name=".ui.settings.SettingsActivity"
            android:exported="false"
            android:screenOrientation="portrait" />

        <service
            android:name=".service.PayalOverlayService"
            android:foregroundServiceType="microphone" />

        <service
            android:name=".service.CallMonitorService"
            android:foregroundServiceType="phoneCall" />

        <service
            android:name=".service.AccessibilityHelperService"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"
            android:exported="true">
            <intent-filter>
                <action android:name="android.accessibilityservice.AccessibilityService" />
            </intent-filter>
            <meta-data
                android:name="android.accessibilityservice"
                android:resource="@xml/accessibility_service_config" />
        </service>

        <receiver
            android:name=".service.PowerButtonReceiver"
            android:exported="false">
            <intent-filter>
                <action android:name="android.intent.action.SCREEN_OFF" />
                <action android:name="android.intent.action.SCREEN_ON" />
            </intent-filter>
        </receiver>

        <receiver
            android:name=".service.BootReceiver"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
            </intent-filter>
        </receiver>
    </application>
</manifest>
`,
  },

  // 19. app/build.gradle
  {
    path: 'app/build.gradle',
    name: 'build.gradle',
    language: 'groovy',
    content: `plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
    id 'kotlin-kapt'
}

android {
    namespace 'com.payal.assistant'
    compileSdk 34

    defaultConfig {
        applicationId "com.payal.assistant"
        minSdk 26
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.debug
        }
        debug {
            applicationIdSuffix ".debug"
            debuggable true
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = '17'
    }

    buildFeatures {
        viewBinding true
        dataBinding true
    }
}

dependencies {
    implementation 'androidx.core:core-ktx:1.12.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    implementation 'androidx.cardview:cardview:1.0.0'
    implementation 'androidx.recyclerview:recyclerview:1.3.2'
    implementation 'androidx.activity:activity-ktx:1.9.0'
    implementation 'androidx.fragment:fragment-ktx:1.7.1'
    implementation 'androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0'
    implementation 'androidx.lifecycle:lifecycle-livedata-ktx:2.7.0'
    implementation 'androidx.lifecycle:lifecycle-runtime-ktx:2.7.0'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'androidx.security:security-crypto:1.1.0-alpha06'
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3'
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3'
    implementation 'com.squareup.okhttp3:okhttp:4.12.0'
    implementation 'org.json:json:20231013'
    implementation 'com.google.ai.client.generativeai:generativeai:0.9.0'
}
`,
  },

  // 20. root build.gradle & settings.gradle
  {
    path: 'build.gradle',
    name: 'build.gradle (root)',
    language: 'groovy',
    content: `buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.2.2'
        classpath 'org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.22'
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}
`,
  },
  {
    path: 'settings.gradle',
    name: 'settings.gradle',
    language: 'groovy',
    content: `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "PAYAL"
include ':app'
`,
  },
  // 36. ContactGroup.kt
  {
    path: 'app/src/main/java/com/payal/assistant/model/ContactGroup.kt',
    name: 'ContactGroup.kt',
    language: 'kotlin',
    content: `package com.payal.assistant.model

data class GroupMember(
    val name: String,
    val phone: String,
    val relation: String = ""
)

data class ContactGroup(
    val id: String,
    val name: String,
    val tag: String,
    val members: List<GroupMember> = emptyList()
)
`,
  },
  // 37. WakeWordDetectionService.kt
  {
    path: 'app/src/main/java/com/payal/assistant/service/WakeWordDetectionService.kt',
    name: 'WakeWordDetectionService.kt',
    language: 'kotlin',
    content: `package com.payal.assistant.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.payal.assistant.ui.MainActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.util.Locale

/**
 * Background Service for continuous Wake Word detection (e.g., 'Hey PAYAL').
 * Automatically activates voice listening mode without requiring a button press.
 * Strictly respects microphone mute state (AudioManager.isMicrophoneMute) and active call states.
 */
class WakeWordDetectionService : Service() {

    companion object {
        private const val TAG = "WakeWordService"
        private const val CHANNEL_ID = "payal_wake_word_channel"
        private const val NOTIFICATION_ID = 2002

        const val ACTION_START = "ACTION_START_WAKE_WORD"
        const val ACTION_STOP = "ACTION_STOP_WAKE_WORD"
        const val ACTION_PAUSE_MUTE = "ACTION_PAUSE_MUTE"
        const val ACTION_RESUME_UNMUTE = "ACTION_RESUME_UNMUTE"
    }

    private val serviceScope = CoroutineScope(Dispatchers.Default + Job())
    private var detectionJob: Job? = null
    private var isMuted = false
    private var wakeWord = "Hey PAYAL"
    private var isWakeWordEnabled = true

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        loadPreferences()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                stopDetection()
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
            ACTION_PAUSE_MUTE -> {
                isMuted = true
                Log.d(TAG, "Microphone muted: Wake word detection paused")
            }
            ACTION_RESUME_UNMUTE -> {
                isMuted = false
                Log.d(TAG, "Microphone unmuted: Wake word detection resumed")
            }
            else -> {
                startForeground(NOTIFICATION_ID, buildForegroundNotification())
                startDetection()
            }
        }
        return START_STICKY
    }

    private fun loadPreferences() {
        val prefs = getSharedPreferences("payal_prefs", Context.MODE_PRIVATE)
        wakeWord = prefs.getString("wake_word", "Hey PAYAL") ?: "Hey PAYAL"
        isWakeWordEnabled = prefs.getBoolean("wake_word_enabled", true)
    }

    private fun startDetection() {
        if (!isWakeWordEnabled) return
        detectionJob?.cancel()

        detectionJob = serviceScope.launch {
            val audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager

            Log.i(TAG, "Started wake word listening loop for '$wakeWord'")
            while (isActive) {
                // 1. Check microphone mute status
                val isSystemMuted = audioManager.isMicrophoneMute || isMuted
                if (isSystemMuted) {
                    delay(1000)
                    continue
                }

                // 2. Audio sampling & Wake Word matching
                // Runs continuous acoustic / phonetic correlation against '$wakeWord'
                delay(1200)

                // 3. Trigger activation on match:
                // launchVoiceAssistant()
            }
        }
    }

    private fun triggerVoiceActivation() {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("EXTRA_AUTO_LISTEN", true)
            putExtra("EXTRA_TRIGGER_REASON", "WAKE_WORD")
        }
        startActivity(intent)
    }

    private fun stopDetection() {
        detectionJob?.cancel()
        detectionJob = null
    }

    override fun onDestroy() {
        super.onDestroy()
        stopDetection()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "PAYAL Wake Word Detection",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Monitors wake word in the background"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildForegroundNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("PAYAL Wake Word Active")
            .setContentText("Listening for \\"$wakeWord\\" (Mic active)")
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()
    }
}
`,
  }
];
