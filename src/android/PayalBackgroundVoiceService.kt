package com.payal.assistant.service

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.util.Log
import androidx.core.app.NotificationCompat
import com.payal.assistant.ui.main.MainActivity
import kotlinx.coroutines.*
import java.util.Locale
import kotlin.math.sqrt

/**
 * 24x7 Native Background Voice Service for PAYAL AI
 * 
 * Features:
 * 1. Continuous Foreground Microphone capture with FOREGROUND_SERVICE_MICROPHONE
 * 2. Real-time Wake Word Detection ("पायल", "Payal", "हे पायल", "सुनो पायल")
 * 3. Keeps CPU active via PARTIAL_WAKE_LOCK even when device screen is turned OFF
 * 4. Haptic vibration feedback & instant voice wake-up
 * 5. Screen WakeUp: Wakes up phone screen upon hearing "पायल"
 * 6. Launches Floating Orb or MainActivity to seamlessly answer user questions
 * 7. START_STICKY with automatic resurrection on low memory or device reboot
 */
class PayalBackgroundVoiceService : Service(), TextToSpeech.OnInitListener {

    companion object {
        private const val TAG = "PayalBackgroundService"
        const val CHANNEL_ID = "payal_background_voice_channel"
        const val NOTIFICATION_ID = 5005

        const val ACTION_START_LISTENING = "com.payal.START_BACKGROUND_LISTENING"
        const val ACTION_STOP_LISTENING = "com.payal.STOP_BACKGROUND_LISTENING"

        private const val SAMPLE_RATE = 16000
        private const val CHUNK_SIZE = 1024
        private const val VAD_ENERGY_THRESHOLD = 0.045f // RMS speech threshold
    }

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var listeningJob: Job? = null

    private var audioRecord: AudioRecord? = null
    private var wakeLock: PowerManager.WakeLock? = null
    private var speechRecognizer: SpeechRecognizer? = null
    private var tts: TextToSpeech? = null
    private var vibrator: Vibrator? = null

    @Volatile private var isRunning = false
    @Volatile private var isRecognizing = false

    override fun onCreate() {
        super.onCreate()
        Log.i(TAG, "Payal Background Voice Service Created")

        createNotificationChannel()
        acquireWakeLock()
        initTextToSpeech()
        vibrator = getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP_LISTENING -> {
                stopListening()
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
                return START_NOT_STICKY
            }
            else -> {
                startForeground(NOTIFICATION_ID, buildForegroundNotification())
                startContinuousListening()
                return START_STICKY
            }
        }
    }

    private fun acquireWakeLock() {
        try {
            val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
            wakeLock = powerManager.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "PayalAssistant:BackgroundVoiceWakeLock"
            ).apply {
                setReferenceCounted(false)
                acquire(24 * 60 * 60 * 1000L) // 24 hours lock
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to acquire WakeLock: \${e.message}")
        }
    }

    private fun initTextToSpeech() {
        tts = TextToSpeech(this, this)
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            val result = tts?.setLanguage(Locale("hi", "IN"))
            if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                tts?.setLanguage(Locale.ENGLISH)
            }
        }
    }

    /**
     * Continuous background audio capture loop for wake word detection
     */
    @SuppressLint("MissingPermission")
    private fun startContinuousListening() {
        if (isRunning) return
        isRunning = true

        val minBufSize = AudioRecord.getMinBufferSize(
            SAMPLE_RATE,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT
        )
        val bufferSize = maxOf(minBufSize, CHUNK_SIZE * 4)

        try {
            audioRecord = AudioRecord(
                MediaRecorder.AudioSource.VOICE_RECOGNITION,
                SAMPLE_RATE,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT,
                bufferSize
            )
            audioRecord?.startRecording()

            listeningJob = serviceScope.launch {
                val buffer = ByteArray(CHUNK_SIZE)
                var consecutiveSpeechFrames = 0

                while (isActive && isRunning) {
                    if (isRecognizing) {
                        delay(200)
                        continue
                    }

                    val read = audioRecord?.read(buffer, 0, CHUNK_SIZE) ?: 0
                    if (read > 0) {
                        val rms = calculateRms(buffer, read)
                        
                        // Voice activity detected in background
                        if (rms > VAD_ENERGY_THRESHOLD) {
                            consecutiveSpeechFrames++
                            if (consecutiveSpeechFrames >= 3) {
                                consecutiveSpeechFrames = 0
                                onPotentialWakeWordDetected()
                            }
                        } else {
                            consecutiveSpeechFrames = 0
                        }
                    }
                    delay(25)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error starting AudioRecord: \${e.message}")
        }
    }

    /**
     * Triggered when speech energy is detected in background.
     * Starts lightweight Android SpeechRecognizer to check if user said "Payal" / "पायल"
     */
    private fun onPotentialWakeWordDetected() {
        if (isRecognizing) return
        isRecognizing = true

        serviceScope.launch(Dispatchers.Main) {
            try {
                speechRecognizer?.destroy()
                speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this@PayalBackgroundVoiceService)

                val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, "hi-IN")
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "hi-IN")
                    putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                    putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 1500L)
                }

                speechRecognizer?.setRecognitionListener(object : RecognitionListener {
                    override fun onResults(results: android.os.Bundle?) {
                        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        val spoken = matches?.joinToString(" ")?.lowercase(Locale.ROOT) ?: ""
                        checkWakeWordAndRespond(spoken)
                        isRecognizing = false
                    }

                    override fun onPartialResults(partialResults: android.os.Bundle?) {
                        val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        val partial = matches?.firstOrNull()?.lowercase(Locale.ROOT) ?: ""
                        if (containsPayalWakeWord(partial)) {
                            speechRecognizer?.stopListening()
                            checkWakeWordAndRespond(partial)
                            isRecognizing = false
                        }
                    }

                    override fun onError(error: Int) {
                        isRecognizing = false
                    }

                    override fun onReadyForSpeech(params: android.os.Bundle?) {}
                    override fun onBeginningOfSpeech() {}
                    override fun onRmsChanged(rmsdB: Float) {}
                    override fun onBufferReceived(buffer: ByteArray?) {}
                    override fun onEndOfSpeech() {}
                    override fun onEvent(eventType: Int, params: android.os.Bundle?) {}
                })

                speechRecognizer?.startListening(intent)
            } catch (e: Exception) {
                isRecognizing = false
            }
        }
    }

    private fun containsPayalWakeWord(text: String): Boolean {
        val clean = text.lowercase(Locale.ROOT).trim()
        val keywords = listOf(
            "payal", "पायल", "hey payal", "हे पायल",
            "hello payal", "हेलो पायल", "suno payal", "सुनो पायल",
            "batao payal", "payal suno"
        )
        return keywords.any { clean.contains(it) }
    }

    /**
     * Wakes up the device and executes response when wake word is confirmed
     */
    private fun checkWakeWordAndRespond(speechText: String) {
        if (containsPayalWakeWord(speechText)) {
            Log.i(TAG, "Wake Word 'PAYAL' detected in background! Text: $speechText")

            // 1. Haptic Feedback (Double pulse vibration)
            triggerHapticFeedback()

            // 2. Wake Screen if locked / off
            wakeUpScreen()

            // 3. Spoken Response from Payal
            speakConfirmation()

            // 4. Launch Main App / Floating Overlay
            val launchIntent = Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
                putExtra("WAKE_WORD_TRIGGERED", true)
                putExtra("USER_SPEECH_QUERY", speechText)
            }
            startActivity(launchIntent)
        }
    }

    private fun triggerHapticFeedback() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator?.vibrate(
                    VibrationEffect.createWaveform(longArrayOf(0, 120, 80, 180), -1)
                )
            } else {
                vibrator?.vibrate(250)
            }
        } catch (_: Exception) {}
    }

    private fun wakeUpScreen() {
        try {
            val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
            @Suppress("DEPRECATION")
            val screenWakeLock = pm.newWakeLock(
                PowerManager.SCREEN_BRIGHT_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP,
                "PayalAssistant:ScreenWakeLock"
            )
            screenWakeLock.acquire(4000L)
        } catch (_: Exception) {}
    }

    private fun speakConfirmation() {
        val greetings = listOf(
            "हाँ जी, मैं सुन रही हूँ!",
            "हाँ बोलिए, क्या मदद करूँ?",
            "पायल हाज़िर है, आदेश दीजिए!"
        )
        val selected = greetings.random()
        tts?.speak(selected, TextToSpeech.QUEUE_FLUSH, null, "PAYAL_WAKE_RESPONSE")
    }

    private fun calculateRms(pcm: ByteArray, length: Int): Float {
        var sum = 0.0
        var count = 0
        for (i in 0 until length - 1 step 2) {
            val sample = (pcm[i].toInt() and 0xFF) or (pcm[i + 1].toInt() shl 8)
            val normalized = sample.toShort().toFloat() / 32768.0f
            sum += (normalized * normalized)
            count++
        }
        if (count == 0) return 0f
        return sqrt(sum / count).toFloat().coerceIn(0f, 1f)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "PAYAL Background Voice Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps PAYAL listening for 'पायल' wake word in the background 24x7"
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    private fun buildForegroundNotification(): Notification {
        val launchIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("पायल एआई बैकग्राउंड में सक्रिय है")
            .setContentText("कभी भी 'पायल' बोलें, मैं तुरंत सुनूँगी 🎙️")
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun stopListening() {
        isRunning = false
        listeningJob?.cancel()
        listeningJob = null

        try {
            audioRecord?.stop()
            audioRecord?.release()
            audioRecord = null
        } catch (_: Exception) {}

        try {
            wakeLock?.release()
            wakeLock = null
        } catch (_: Exception) {}

        speechRecognizer?.destroy()
        speechRecognizer = null
    }

    override fun onDestroy() {
        stopListening()
        tts?.stop()
        tts?.shutdown()
        super.onDestroy()
        Log.i(TAG, "Payal Background Voice Service Destroyed")
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
