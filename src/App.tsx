import React, { useState, useEffect, useRef } from 'react';
import {
  AssistantSettings,
  OrbVisualState,
  ChatMessage,
  AppCommand,
  PersonalityMode,
} from './types';
import { OrbCanvas } from './components/OrbCanvas';
import { PayalAvatarView, getPayalImage } from './components/PayalAvatarView';
import { WaveformBarView } from './components/WaveformBarView';
import { WebAudioEngine } from './utils/audioEngine';
import { parseVoiceCommand } from './utils/commandParser';
import { deduplicateSpeech, removeEmojis, cleanForSpeech } from './utils/textCleaner';
import { backgroundAudioKeepAlive } from './utils/backgroundAudioKeepAlive';
import { CodeExportModal } from './components/CodeExportModal';
import {
  Mic,
  MicOff,
  Square,
  Send,
  Sparkles,
  Settings,
  Download,
  PhoneCall,
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
  Volume1,
  Flashlight,
  FlashlightOff,
  Smartphone,
  Code2,
  Terminal,
  Radio,
  HelpCircle,
  ExternalLink,
  Wifi,
  WifiOff,
  Bluetooth,
  X,
  Check,
  CheckCircle2,
  Play,
  MessageCircle,
} from 'lucide-react';

const DEFAULT_SETTINGS: AssistantSettings = {
  model: 'gemini-flash-latest',
  voice: 'IndianGirl20',
  personality: 'gf',
  primeContacts: [
    { name: 'Sameer (Close Friend)', phone: '+91 98765 11111', relation: 'Jaan / Bestie' },
    { name: 'Rohan Sharma', phone: '+91 98765 22222', relation: 'Brother' },
  ],
  contactGroups: [
    {
      id: 'grp-family',
      name: 'Family',
      tag: 'family',
      members: [
        { name: 'Mataji / Mom', phone: '+91 98765 43210', relation: 'Mother' },
        { name: 'Pitaji / Dad', phone: '+91 98765 43211', relation: 'Father' },
        { name: 'Rohan', phone: '+91 98765 22222', relation: 'Brother' },
      ],
    },
    {
      id: 'grp-work',
      name: 'Work',
      tag: 'work',
      members: [
        { name: 'Vikram (Manager)', phone: '+91 98765 33333', relation: 'Project Lead' },
        { name: 'Ananya (Design)', phone: '+91 98765 44444', relation: 'Colleague' },
      ],
    },
    {
      id: 'grp-friends',
      name: 'Friends',
      tag: 'friends',
      members: [
        { name: 'Sameer', phone: '+91 98765 11111', relation: 'Best Friend' },
        { name: 'Aakash', phone: '+91 98765 55555', relation: 'College Buddy' },
      ],
    },
  ],
  wakeWord: 'Hey PAYAL',
  wakeWordEnabled: false, // Default off to prevent Android mic conflicts and looping
  floatingOverlayEnabled: false,
  accessibilityEnabled: true,
  continuousListening: true,
  callMonitorEnabled: true,
  backgroundListeningEnabled: true,
};

export function App() {
  const [settings, setSettings] = useState<AssistantSettings>(() => {
    try {
      const saved = localStorage.getItem('payal_assistant_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        const validModels = ['gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-3.1-pro-preview'];
        const cleanModel =
          parsed.model && validModels.includes(parsed.model) && parsed.model !== 'gemini-3.8-flash'
            ? parsed.model
            : 'gemini-flash-latest';
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          voice: parsed.voice && parsed.voice !== 'Aoede' ? parsed.voice : 'IndianGirl20',
          floatingOverlayEnabled: false, // Keep floating circle removed as requested
          model: cleanModel,
          contactGroups:
            parsed.contactGroups && parsed.contactGroups.length > 0
              ? parsed.contactGroups
              : DEFAULT_SETTINGS.contactGroups,
          wakeWord: parsed.wakeWord || DEFAULT_SETTINGS.wakeWord,
          wakeWordEnabled: false, // Explicitly keep wake word off by default for rock-solid mic
          backgroundListeningEnabled:
            parsed.backgroundListeningEnabled !== undefined ? parsed.backgroundListeningEnabled : true,
          continuousListening:
            parsed.continuousListening !== undefined ? parsed.continuousListening : true,
        };
      }
    } catch (_e) {}
    return DEFAULT_SETTINGS;
  });

  // Assistant State
  const [orbState, setOrbState] = useState<OrbVisualState>('idle');
  const [amplitude, setAmplitude] = useState<number>(0.05);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [listeningNote, setListeningNote] = useState<string>('');
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      text: 'नमस्ते! मैं हूँ पायल — आपकी पर्सनल एआई वॉइस साथी। आप मुझसे हिंदी में बात कर सकते हैं या फ़ोन का कोई भी काम करवा सकते हैं!',
      timestamp: Date.now(),
    },
  ]);

  // Device simulation states
  const [activeApp, setActiveApp] = useState<string>('home');
  const [volume, setVolume] = useState<number>(75);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [wifiOn, setWifiOn] = useState(true);
  const [bluetoothOn, setBluetoothOn] = useState(true);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [lastExecutedCommand, setLastExecutedCommand] = useState<AppCommand | null>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);

  const audioEngineRef = useRef<WebAudioEngine | null>(null);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const pulseTimerRef = useRef<any>(null);
  const fallbackRecorderRef = useRef<{ stop: () => Promise<{ base64: string; mimeType: string }> } | null>(null);

  // Smart Speech & Turn-taking Refs
  const accumulatedSpeechRef = useRef<string>('');
  const silenceTimerRef = useRef<any>(null);
  const isProcessingRef = useRef<boolean>(false);
  const lastSubmittedTextRef = useRef<string>('');
  const lastSubmitTimeRef = useRef<number>(0);
  const autoListenLoopRef = useRef<boolean>(true); // default true for continuous conversational loop
  const autoListenTimeoutRef = useRef<any>(null);
  const isListeningSessionActiveRef = useRef<boolean>(false);
  const startListeningRef = useRef<() => void>();
  const backgroundWatchdogUnregisterRef = useRef<(() => void) | null>(null);
  const [isBackgrounded, setIsBackgrounded] = useState<boolean>(
    typeof document !== 'undefined' ? document.hidden : false
  );

  // Background tab visibility watchdog
  useEffect(() => {
    const handleVisChange = () => {
      const hidden = document.hidden;
      setIsBackgrounded(hidden);
      if (hidden && isListeningSessionActiveRef.current) {
        setListeningNote('🎙️ बैकग्राउंड लिसनिंग चालू (PAYAL दूसरे टैब में भी सुन रही है)');
      }
    };
    document.addEventListener('visibilitychange', handleVisChange);
    return () => document.removeEventListener('visibilitychange', handleVisChange);
  }, []);

  const isMicMutedRef = useRef(isMicMuted);
  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  const isIncomingCallRef = useRef(isIncomingCall);
  useEffect(() => {
    isIncomingCallRef.current = isIncomingCall;
  }, [isIncomingCall]);

  const continuousListeningRef = useRef(settings.continuousListening ?? true);
  useEffect(() => {
    continuousListeningRef.current = settings.continuousListening ?? true;
  }, [settings.continuousListening]);

  // Triggers automatic microphone reactivation as soon as PAYAL finishes speaking
  const triggerAutoListenNextTurn = () => {
    if (
      !autoListenLoopRef.current ||
      !continuousListeningRef.current ||
      isMicMutedRef.current ||
      isIncomingCallRef.current ||
      isProcessingRef.current ||
      isListeningSessionActiveRef.current
    ) {
      return;
    }
    if (autoListenTimeoutRef.current) {
      clearTimeout(autoListenTimeoutRef.current);
      autoListenTimeoutRef.current = null;
    }
    setOrbState('idle');
    setAmplitude(0.05);
    setListeningNote('🎙️ बात पूरी हुई... आपका माइक स्वतः चालू हो रहा है');
    autoListenTimeoutRef.current = setTimeout(() => {
      if (
        autoListenLoopRef.current &&
        continuousListeningRef.current &&
        !isMicMutedRef.current &&
        !isIncomingCallRef.current &&
        !isProcessingRef.current &&
        !isListeningSessionActiveRef.current
      ) {
        startListeningRef.current?.();
      }
    }, 450);
  };

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize Web Audio Engine
  useEffect(() => {
    const engine = new WebAudioEngine();
    audioEngineRef.current = engine;

    engine.setWakeWord(settings.wakeWord);
    engine.setWakeWordEnabled(settings.wakeWordEnabled);
    engine.setMuted(isMicMuted || isIncomingCall);

    engine.onAmplitudeChanged = (amp) => {
      if (typeof amp === 'number') {
        setAmplitude(amp);
      }
    };

    engine.onSpeakingStarted = () => {
      setOrbState('speaking');
    };

    engine.onSpeakingStopped = () => {
      setOrbState('idle');
      setAmplitude(0.05);
      isProcessingRef.current = false;
      triggerAutoListenNextTurn();
    };

    // Wake word detected callback
    engine.onWakeWordDetected = (detectedPhrase) => {
      if (engine.getIsMuted() || isMicMuted || isIncomingCall) return;
      if (engine.getIsSpeaking() || isMicActive || isProcessingRef.current) return;

      console.log('Wake word detected:', detectedPhrase);
      setLastExecutedCommand({
        type: 'OPEN_APP',
        params: { wake_word: detectedPhrase },
        description: `Wake word "${detectedPhrase}" detected! Listening automatically...`,
      });
      startListening();
    };

    if ((settings.wakeWordEnabled || settings.backgroundListeningEnabled) && !isMicMuted && !isIncomingCall) {
      backgroundAudioKeepAlive.start();
      if (settings.wakeWordEnabled) {
        engine.startWakeWordDetection();
      }
    }

    return () => {
      stopListening(true);
      backgroundAudioKeepAlive.stop();
      engine.release();
    };
  }, []);

  // Synchronize microphone mute state with audio engine
  useEffect(() => {
    if (audioEngineRef.current) {
      const muted = isMicMuted || isIncomingCall;
      audioEngineRef.current.setMuted(muted);
      if (muted) {
        autoListenLoopRef.current = false;
        setAmplitude(0);
        if (isMicActive) {
          stopListening(true);
        }
      }
    }
  }, [isMicMuted, isIncomingCall]);

  const restartWakeWordIfAllowed = () => {
    setTimeout(() => {
      if (
        audioEngineRef.current &&
        settings.wakeWordEnabled &&
        !isMicMuted &&
        !isIncomingCall &&
        !isMicActive &&
        !isProcessingRef.current &&
        orbState === 'idle'
      ) {
        audioEngineRef.current.startWakeWordDetection();
      }
    }, 800);
  };

  const stopListening = (cancelOnly = false) => {
    isListeningSessionActiveRef.current = false;
    if (backgroundWatchdogUnregisterRef.current) {
      backgroundWatchdogUnregisterRef.current();
      backgroundWatchdogUnregisterRef.current = null;
    }
    if (!settings.wakeWordEnabled) {
      backgroundAudioKeepAlive.stop();
    }
    if (cancelOnly) {
      autoListenLoopRef.current = false;
      if (autoListenTimeoutRef.current) {
        clearTimeout(autoListenTimeoutRef.current);
        autoListenTimeoutRef.current = null;
      }
    }
    setIsMicActive(false);
    if (pulseTimerRef.current) {
      clearInterval(pulseTimerRef.current);
      pulseTimerRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (fallbackRecorderRef.current) {
      try {
        fallbackRecorderRef.current.stop();
      } catch (_e) {}
      fallbackRecorderRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        if (typeof recognitionRef.current.abort === 'function') {
          recognitionRef.current.abort();
        } else {
          recognitionRef.current.stop();
        }
      } catch (_e) {}
      recognitionRef.current = null;
    }
    if (audioEngineRef.current) {
      audioEngineRef.current.stopRecording();
    }
    if (cancelOnly) {
      accumulatedSpeechRef.current = '';
      setLiveTranscript('');
      setInputQuery('');
      setListeningNote('');
      setOrbState('idle');
      setAmplitude(0.05);
    }
  };

  // Commit speech: stops mic and immediately passes query to assistant
  const commitSpeechAndSend = (overrideText?: string) => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    const raw = overrideText ?? accumulatedSpeechRef.current;
    const textToSend = deduplicateSpeech(raw).trim();
    stopListening(false);

    if (textToSend) {
      setListeningNote(`आपकी बात सुन ली: "${textToSend}"`);
      handleUserMessage(textToSend);
    } else {
      setOrbState('idle');
      setAmplitude(0.05);
      setListeningNote('');
      restartWakeWordIfAllowed();
    }
  };

  const startListening = async () => {
    startListeningRef.current = startListening;

    // Avoid starting if already speaking or processing
    if (isProcessingRef.current || orbState === 'speaking') {
      return;
    }

    if (isMicMuted || isIncomingCall) {
      setIsMicMuted(false);
    }
    if (!audioEngineRef.current) return;

    // Interrupt any ongoing assistant speech & turn off wake word
    audioEngineRef.current.interrupt();
    audioEngineRef.current.stopWakeWordDetection();
    audioEngineRef.current.stopRecording();

    // Start background keep-alive loop
    if (settings.backgroundListeningEnabled) {
      backgroundAudioKeepAlive.start();
    }

    if (backgroundWatchdogUnregisterRef.current) {
      backgroundWatchdogUnregisterRef.current();
      backgroundWatchdogUnregisterRef.current = null;
    }

    // Mark that listening is now active and in user conversational loop
    autoListenLoopRef.current = true;
    isListeningSessionActiveRef.current = true;
    accumulatedSpeechRef.current = '';
    setLiveTranscript('');
    setListeningNote(
      document.hidden
        ? '🎙️ बैकग्राउंड लिसनिंग चालू... बोलिए'
        : '🎙️ सुन रही हूँ... पूरी बात बोलिए (माइक चालू है)'
    );
    setIsMicActive(true);
    setOrbState('listening');

    // Visual breathing pulse for the Orb while listening
    let pulseVal = 0.25;
    let step = 0.05;
    if (pulseTimerRef.current) clearInterval(pulseTimerRef.current);
    pulseTimerRef.current = setInterval(() => {
      pulseVal += step;
      if (pulseVal >= 0.55) step = -0.04;
      if (pulseVal <= 0.20) step = 0.04;
      setAmplitude(pulseVal);
    }, 120);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'hi-IN';

        recognition.onstart = () => {
          setListeningNote('🎙️ सुन रही हूँ... पूरी बात बोलिए');
        };

        recognition.onspeechstart = () => {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
          setListeningNote('🎙️ आपकी आवाज़ सुन रही हूँ... (बोलते रहिए)');
          setAmplitude(0.75);
        };

        recognition.onresult = (event: any) => {
          let sessionFinal = '';
          let interim = '';

          for (let i = 0; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              sessionFinal += transcript + ' ';
            } else {
              interim += transcript;
            }
          }

          const trimmedFinal = sessionFinal.trim();
          const trimmedInterim = interim.trim();

          let rawCombined = '';
          if (trimmedFinal && trimmedInterim) {
            // Guard against Android Web Speech API duplicating interim on top of finalized speech
            if (
              trimmedFinal.toLowerCase().endsWith(trimmedInterim.toLowerCase()) ||
              trimmedFinal.toLowerCase() === trimmedInterim.toLowerCase()
            ) {
              rawCombined = trimmedFinal;
            } else {
              rawCombined = `${trimmedFinal} ${trimmedInterim}`;
            }
          } else {
            rawCombined = trimmedFinal || trimmedInterim;
          }

          // Deduplicate spoken text (prevents double words like "हेलो हेलो" or repeated phrases)
          const fullCombined = deduplicateSpeech(rawCombined);
          if (fullCombined) {
            accumulatedSpeechRef.current = fullCombined;
            setLiveTranscript(fullCombined);
            setInputQuery(fullCombined);
            setAmplitude(0.85);

            // Natural conversational pause: 1800ms gives plenty of time for pauses and breaths
            // so PAYAL listens to the user's entire statement before answering
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
              if (isListeningSessionActiveRef.current && accumulatedSpeechRef.current.trim()) {
                commitSpeechAndSend();
              }
            }, 1800);
          }
        };

        // When speech pauses, wait 1600ms before committing to give user time to complete sentence
        recognition.onspeechend = () => {
          if (isListeningSessionActiveRef.current && accumulatedSpeechRef.current.trim()) {
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
              if (isListeningSessionActiveRef.current && accumulatedSpeechRef.current.trim()) {
                commitSpeechAndSend();
              }
            }, 1600);
          }
        };

        recognition.onerror = async (event: any) => {
          console.warn('SpeechRecognition event/error:', event.error);
          if (event.error === 'no-speech') {
            // DO NOT STOP ON NO-SPEECH: keep listening alive while user pauses
            return;
          }
          // On mobile Android or WebView: 'network', 'audio-capture', 'not-allowed', 'service-not-allowed', 'aborted'
          // Switch automatically and seamlessly to our high-compatibility MediaRecorder + Gemini STT!
          try {
            recognition.abort();
          } catch (_e) {}
          recognitionRef.current = null;
          setListeningNote('🎙️ बैकअप ऑडियो रिकॉर्डर चालू... पूरी बात बोलिए');
          await startFallbackAudioRecorder();
        };

        recognition.onend = () => {
          // If the recognition stopped while user was still in listening mode:
          if (isListeningSessionActiveRef.current && !isProcessingRef.current) {
            if (accumulatedSpeechRef.current.trim()) {
              // Spoken words exist: give a 1400ms pause window before committing
              if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = setTimeout(() => {
                if (isListeningSessionActiveRef.current && accumulatedSpeechRef.current.trim()) {
                  commitSpeechAndSend();
                }
              }, 1400);
            } else {
              // Nothing spoken yet: quietly restart so the mic stays ON and doesn't flicker!
              try {
                if (isListeningSessionActiveRef.current) {
                  recognition.start();
                }
              } catch (_e) {}
            }
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
        return;
      } catch (err) {
        console.warn('SpeechRecognition failed to start, using fallback:', err);
      }
    }

    // Fallback if SpeechRecognition is not supported or threw error
    await startFallbackAudioRecorder();
  };

  const startFallbackAudioRecorder = async () => {
    try {
      setListeningNote('🎙️ सुन रही हूँ... पूरी बात बोलिए (माइक चालू है)');
      setIsMicActive(true);
      setOrbState('listening');

      const recorder = await audioEngineRef.current!.startVoiceRecordingSnippet(
        (amp) => {
          setAmplitude(amp);
        },
        () => {
          // Speech detected by VAD
          setListeningNote('🎙️ आपकी आवाज़ सुन रही हूँ... (बोलते रहिए)');
        },
        () => {
          // Silence detected after speech by VAD - automatically send!
          if (isListeningSessionActiveRef.current && !isProcessingRef.current) {
            handleDoneSpeaking();
          }
        }
      );
      fallbackRecorderRef.current = recorder;
    } catch (err: any) {
      console.error('Audio recorder failed:', err);
      setListeningNote('Microphone access blocked. Check browser permissions or type below.');
      stopListening(true);
      setOrbState('idle');
      setAmplitude(0.05);
    }
  };

  const handleDoneSpeaking = async () => {
    // If fallback recorder was running
    if (fallbackRecorderRef.current) {
      setListeningNote('आपकी बात प्रोसेस हो रही है...');
      setOrbState('thinking');
      const rec = fallbackRecorderRef.current;
      fallbackRecorderRef.current = null;
      try {
        const { base64, mimeType } = await rec.stop();
        if (base64) {
          const res = await fetch('/api/payal/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioData: base64, mimeType }),
          });
          const data = await res.json();
          if (data.transcript && data.transcript.trim()) {
            stopListening(false);
            handleUserMessage(data.transcript.trim());
            return;
          }
        }
      } catch (err) {
        console.warn('Fallback transcription failed:', err);
      }
    }

    // Immediately commit whatever was accumulated
    commitSpeechAndSend();
  };

  const toggleMic = () => {
    if (orbState === 'speaking') {
      handleInterrupt();
      return;
    }
    if (isMicActive) {
      handleDoneSpeaking();
    } else {
      startListening();
    }
  };

  const executeCommand = (cmd: AppCommand) => {
    setLastExecutedCommand(cmd);

    switch (cmd.type) {
      case 'GROUP_CALL': {
        setActiveApp('phone');
        break;
      }
      case 'GROUP_MSG': {
        setActiveApp('whatsapp');
        break;
      }
      case 'PRIME_CALL': {
        const contactIdx = parseInt(cmd.params.index || '0', 10);
        const contact = settings.primeContacts[contactIdx] || settings.primeContacts[0];
        setActiveApp('phone');
        break;
      }
      case 'PRIME_MSG': {
        setActiveApp('whatsapp');
        break;
      }
      case 'OPEN_APP': {
        const target = (cmd.params.app_name || '').toLowerCase();
        if (target.includes('youtube')) setActiveApp('youtube');
        else if (target.includes('whatsapp')) setActiveApp('whatsapp');
        else setActiveApp('home');
        break;
      }
      case 'CLOSE_APP': {
        setActiveApp('home');
        break;
      }
      case 'WHATSAPP_MSG': {
        setActiveApp('whatsapp');
        break;
      }
      case 'CALL': {
        setActiveApp('phone');
        break;
      }
      case 'VOLUME_UP': {
        setVolume((v) => Math.min(100, v + 15));
        break;
      }
      case 'VOLUME_DOWN': {
        setVolume((v) => Math.max(0, v - 15));
        break;
      }
      case 'FLASHLIGHT_ON': {
        setFlashlightOn(true);
        break;
      }
      case 'FLASHLIGHT_OFF': {
        setFlashlightOn(false);
        break;
      }
      case 'WIFI_ON': {
        setWifiOn(true);
        break;
      }
      case 'WIFI_OFF': {
        setWifiOn(false);
        break;
      }
      case 'BLUETOOTH_ON': {
        setBluetoothOn(true);
        break;
      }
      case 'BLUETOOTH_OFF': {
        setBluetoothOn(false);
        break;
      }
    }

    setTimeout(() => setLastExecutedCommand(null), 4000);
  };

  const handleUserMessage = async (queryText: string) => {
    const cleanText = deduplicateSpeech(queryText).trim();
    if (!cleanText) return;

    // Deduplication check: Prevent repeating the same message twice
    const now = Date.now();
    const lower = cleanText.toLowerCase();
    if (isProcessingRef.current) {
      console.log('Already processing a message, dropping duplicate request');
      return;
    }
    if (
      lastSubmittedTextRef.current === lower &&
      now - lastSubmitTimeRef.current < 3500
    ) {
      console.log('Dropping rapid duplicate submission:', lower);
      return;
    }
    lastSubmittedTextRef.current = lower;
    lastSubmitTimeRef.current = now;
    isProcessingRef.current = true;

    // Stop listening & shut down mic completely while processing and replying
    stopListening();
    setLiveTranscript('');
    setListeningNote('');

    // 1. Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: cleanText,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');

    // 2. Parse command (device automation with custom contact groups)
    const detectedCmd = parseVoiceCommand(cleanText, settings.contactGroups);
    if (detectedCmd) {
      executeCommand(detectedCmd);
    }

    // 3. Set visual state to thinking
    setOrbState('thinking');

    try {
      // Send to server Gemini API with safe fallback handling
      let replyText = 'Ji, maine samajh liya!';
      let nativeAudio: string | null = null;
      let sampleRate = 24000;
      const isGeminiStudioVoice = Boolean(settings.voice && settings.voice !== 'IndianGirl20');

      try {
        // Send recent conversation history so PAYAL retains full memory across turns
        const history = messages.slice(-14).map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          text: m.text,
        }));

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: cleanText,
            history,
            userName: 'Sumit',
            personality: settings.personality,
            voice: settings.voice || 'IndianGirl20',
            wantNativeAudio: isGeminiStudioVoice,
            model: settings.model,
            primeContacts: settings.primeContacts,
            contactGroups: settings.contactGroups,
          }),
        });

        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();
            if (data.text) replyText = removeEmojis(data.text);
            if (data.audio && isGeminiStudioVoice) {
              nativeAudio = data.audio;
              if (data.sampleRate) sampleRate = data.sampleRate;
            }
          }
        }
      } catch (fetchErr) {
        console.warn('Backend chat API reached fallback:', fetchErr);
        if (settings.personality === 'gf') {
          replyText = 'हाँ मेरी जान, मैं हमेशा आपके साथ हूँ! बताइए और क्या करूँ?';
        } else if (settings.personality === 'professional') {
          replyText = 'कमांड प्राप्त हुई। सिस्टम सक्रिय है।';
        } else {
          replyText = 'जी! आपकी कमांड पूरी हो चुकी है।';
        }
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: removeEmojis(replyText),
        timestamp: Date.now(),
        command: detectedCmd || undefined,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // 4. Speak response aloud with WebAudioEngine (emojis stripped, mic is strictly OFF while speaking)
      setOrbState('speaking');
      if (audioEngineRef.current) {
        if (nativeAudio && isGeminiStudioVoice) {
          await audioEngineRef.current.playPcmChunk(nativeAudio, sampleRate);
        } else {
          await audioEngineRef.current.speakTextAloud(cleanForSpeech(replyText), settings.voice);
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      // Fallback local response
      let fallbackText = 'जी! आपकी रिक्वेस्ट पूरी हो चुकी है।';
      if (settings.personality === 'gf') {
        fallbackText = 'हाँ मेरी जान, मैं हमेशा तुम्हारे साथ हूँ! बताओ और क्या करूँ?';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `fallback-${Date.now()}`,
          role: 'assistant',
          text: removeEmojis(fallbackText),
          timestamp: Date.now(),
          command: detectedCmd || undefined,
        },
      ]);

      setOrbState('speaking');
      if (audioEngineRef.current) {
        await audioEngineRef.current.speakTextAloud(cleanForSpeech(fallbackText));
      }
    } finally {
      isProcessingRef.current = false;
      triggerAutoListenNextTurn();
    }
  };

  const handleInterrupt = () => {
    autoListenLoopRef.current = false;
    if (autoListenTimeoutRef.current) {
      clearTimeout(autoListenTimeoutRef.current);
      autoListenTimeoutRef.current = null;
    }
    if (audioEngineRef.current) {
      audioEngineRef.current.interrupt();
    }
    setOrbState('idle');
    setAmplitude(0.05);
    setListeningNote('बातचीत रोकी गई (Tap orb to speak)');
  };

  const handleSpeakDialogue = async (textToSpeak: string) => {
    if (!textToSpeak.trim()) return;
    if (orbState === 'speaking') {
      handleInterrupt();
      return;
    }
    stopListening(true);
    
    const assistantMsg: ChatMessage = {
      id: `spoken-${Date.now()}`,
      role: 'assistant',
      text: textToSpeak,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setOrbState('speaking');
    if (audioEngineRef.current) {
      await audioEngineRef.current.speakTextAloud(textToSpeak, settings.voice);
    }
  };

  const handleLiveVoiceDemo = async () => {
    await handleSpeakDialogue('नमस्ते सुमित जी! मैं आपकी पायल हूँ। देखिए, अब मैं बिल्कुल सजीव वीडियो की तरह आपसे बात कर रही हूँ, पलकें झपका रही हूँ और बात करने के साथ मुस्कुरा रही हूँ! बताइए, आज मैं आपके लिए क्या करूँ?');
  };

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-red-900 selection:text-white">
      {/* Top Navigation Bar - Clean, minimal, no confusing options */}
      <header className="sticky top-0 z-40 bg-neutral-950/85 backdrop-blur-xl border-b border-neutral-800/80 px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-rose-500 via-red-500 to-amber-400 shadow-lg shadow-rose-950/50 overflow-hidden flex items-center justify-center">
            <img
              src={getPayalImage()}
              alt="Payal Voice Assistant"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-full"
            />
            <span
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-neutral-950 ${
                isMicActive
                  ? 'bg-red-500 animate-ping'
                  : orbState === 'speaking'
                  ? 'bg-rose-400 animate-pulse'
                  : 'bg-emerald-400'
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-white font-mono">PAYAL</h1>
              <span className="text-[10px] bg-red-950 text-red-400 border border-red-800/60 px-2 py-0.5 rounded-full font-mono font-medium">
                AI Voice Assistant
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">Hindi Voice Assistant (Live Talking)</p>
          </div>
        </div>

        {/* Status Badges & Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCodeModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-all shadow-md shadow-red-950/50 cursor-pointer active:scale-95"
            title="पायल एआई का पूरा कोड डाउनलोड या कॉपी करें"
          >
            <Download className="w-3.5 h-3.5" />
            <span>कोड डाउनलोड करें</span>
          </button>

          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-colors ${
              isBackgrounded
                ? 'bg-amber-950/50 border-amber-800/60 text-amber-300'
                : 'bg-neutral-900 border-neutral-800 text-neutral-300'
            }`}
            title="Service Worker & Web Audio keep-alive: Tab switch करने पर भी माइक चालू रहता है"
          >
            <Radio className={`w-3.5 h-3.5 ${isMicActive ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`} />
            <span className="hidden sm:inline text-neutral-400">Background:</span>
            <span className={isMicActive ? 'text-emerald-400 font-medium' : 'text-neutral-300 font-medium'}>
              {isBackgrounded ? 'Background Tab' : 'Active'}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isMicActive
                  ? 'bg-red-500 animate-ping'
                  : orbState === 'speaking'
                  ? 'bg-rose-400 animate-pulse'
                  : 'bg-emerald-500'
              }`}
            />
            <span className="text-neutral-300 font-medium">
              {isMicActive ? 'Listening...' : orbState === 'speaking' ? 'Speaking...' : 'Ready'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-6 flex-1">
            {/* Incoming Call Alert Card (High Priority Call Simulation) */}
            {isIncomingCall && (
              <div className="bg-red-950/80 border-2 border-red-600/80 rounded-2xl p-4 shadow-xl shadow-red-950/50 flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-red-600 flex items-center justify-center text-white animate-bounce shadow-lg shadow-red-600/50">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-red-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      Incoming Phone Call
                    </div>
                    <div className="text-base font-bold text-white">Mataji / Mom (+91 98765 43210)</div>
                    <div className="text-[11px] text-red-200/80">
                      PAYAL mic auto-muted & speaking paused (CallMonitorService active)
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsIncomingCall(false);
                      setActiveApp('phone');
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-emerald-900/50 transition-all"
                  >
                    <Phone className="w-3.5 h-3.5" /> Accept Call
                  </button>
                  <button
                    onClick={() => {
                      setIsIncomingCall(false);
                      setActiveApp('home');
                    }}
                    className="px-4 py-2 rounded-xl bg-red-800 hover:bg-red-700 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-red-950/50 transition-all"
                  >
                    <PhoneOff className="w-3.5 h-3.5" /> Decline
                  </button>
                </div>
              </div>
            )}

            {/* Ongoing Device Automation / Call / App Banner */}
            {(activeApp !== 'home' || lastExecutedCommand) && !isIncomingCall && (
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    {activeApp === 'phone' ? (
                      <span className="text-white font-medium">
                        Outgoing Phone Call Active (Dialing / Connected)
                      </span>
                    ) : activeApp === 'whatsapp' ? (
                      <span className="text-white font-medium">
                        WhatsApp Active (Message sent to recipient)
                      </span>
                    ) : activeApp === 'youtube' ? (
                      <span className="text-white font-medium">
                        YouTube Active (Media player running)
                      </span>
                    ) : lastExecutedCommand ? (
                      <span className="text-neutral-200">
                        Action: <strong className="text-red-400">{lastExecutedCommand.description}</strong>
                      </span>
                    ) : null}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveApp('home');
                    setLastExecutedCommand(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] flex items-center gap-1 transition-colors"
                >
                  <X className="w-3 h-3" /> Dismiss
                </button>
              </div>
            )}

            {/* Hero Voice Interaction Console */}
            <div className="bg-neutral-900/50 border border-neutral-800/80 rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center relative shadow-2xl backdrop-blur-sm">
              {/* Central Payal Avatar View - Directly Tap to Open Mic */}
              <div
                className="relative flex flex-col items-center justify-center cursor-pointer group"
                onClick={toggleMic}
                title={
                  orbState === 'speaking'
                    ? 'पायल को रोकें / Tap to Stop'
                    : isMicActive
                    ? 'बोलना पूरा करें और भेजें / Tap to Send'
                    : 'माइक चालू करें / Tap to Speak'
                }
              >
                <div className="relative">
                  <PayalAvatarView
                    state={orbState}
                    amplitude={amplitude}
                    size={280}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[11px] text-white font-medium border border-white/20">
                      {isMicActive ? 'Tap to Send' : 'Tap to Speak'}
                    </span>
                  </div>
                </div>

                <div className="mt-5">
                  <WaveformBarView amplitude={amplitude} width={240} height={36} />
                </div>

                {/* State Badge & Tap Hint */}
                <div className="mt-3 flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 text-xs font-mono tracking-wider uppercase">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        orbState === 'listening'
                          ? 'bg-red-500 animate-ping'
                          : orbState === 'speaking'
                          ? 'bg-emerald-400 animate-pulse'
                          : orbState === 'thinking'
                          ? 'bg-amber-400 animate-spin'
                          : 'bg-neutral-500'
                      }`}
                    />
                    <span className="text-neutral-400">Status:</span>
                    <strong
                      className={`font-bold ${
                        orbState === 'listening'
                          ? 'text-red-400'
                          : orbState === 'speaking'
                          ? 'text-emerald-400'
                          : orbState === 'thinking'
                          ? 'text-amber-300'
                          : 'text-neutral-300'
                      }`}
                    >
                      {orbState === 'listening'
                        ? '● LISTENING (आपकी बात सुन रही हूँ...)'
                        : orbState === 'speaking'
                        ? '● SPEAKING (पायल बोल रही हैं...)'
                        : orbState === 'thinking'
                        ? '● THINKING (प्रोसेस हो रहा है...)'
                        : '● READY (तैयार)'}
                    </strong>
                  </div>

                  {/* Primary Mic Action Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMic();
                    }}
                    className={`px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all shadow-lg cursor-pointer ${
                      isMicActive
                        ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/50 animate-pulse'
                        : orbState === 'speaking'
                        ? 'bg-rose-900/90 hover:bg-rose-800 border border-rose-700 text-rose-200'
                        : orbState === 'thinking'
                        ? 'bg-amber-900/80 border border-amber-700 text-amber-200'
                        : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/40 active:scale-95'
                    }`}
                  >
                    {isMicActive ? (
                      <>
                        <Mic className="w-4 h-4 text-white animate-bounce" />
                        <span>सुन रही हूँ... (बोलना पूरा होने पर टैप करें)</span>
                      </>
                    ) : orbState === 'speaking' ? (
                      <>
                        <Square className="w-4 h-4 fill-current text-rose-300" />
                        <span>पायल को रोकें (Stop)</span>
                      </>
                    ) : orbState === 'thinking' ? (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                        <span>प्रोसेस हो रहा है...</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 text-white" />
                        <span>माइक चालू करें / बोलें (Tap to Speak)</span>
                      </>
                    )}
                  </button>

                  {/* Auto-Mic Continuous Hands-free Loop Indicator & Toggle */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = !settings.continuousListening;
                      setSettings((prev) => {
                        const updated = { ...prev, continuousListening: next };
                        try {
                          localStorage.setItem('payal_assistant_settings', JSON.stringify(updated));
                        } catch (_e) {}
                        return updated;
                      });
                      autoListenLoopRef.current = next;
                      if (!next && isMicActive) {
                        stopListening(true);
                      }
                    }}
                    className={`mt-1.5 px-3 py-1 rounded-full border text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                      settings.continuousListening
                        ? 'border-red-600/80 bg-red-950/80 text-red-300 shadow-sm shadow-red-950/50'
                        : 'border-neutral-800 bg-neutral-900/90 text-neutral-400 hover:text-neutral-300'
                    }`}
                    title="ऑटो-माइक टॉगल करें"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        settings.continuousListening ? 'bg-red-400 animate-ping' : 'bg-neutral-600'
                      }`}
                    />
                    <span>
                      {settings.continuousListening
                        ? '🔄 ऑटो-माइक लूप: चालू (बोलने के बाद माइक खुद खुलेगा)'
                        : '🔄 ऑटो-माइक लूप: बंद (मैनुअल मोड)'}
                    </span>
                  </button>
                </div>

                {orbState === 'speaking' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInterrupt();
                    }}
                    className="mt-2 px-3 py-1 rounded-xl bg-red-950/90 border border-red-800 text-red-300 hover:bg-red-900 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-md shadow-red-950/60 cursor-pointer"
                  >
                    <Square className="w-3 h-3 fill-current" /> Stop / Interrupt Speaking
                  </button>
                )}
              </div>

              {/* Live Real-time Transcription Box */}
              {(isMicActive || liveTranscript || listeningNote) && (
                <div className="w-full max-w-xl mt-5 p-3.5 rounded-2xl bg-neutral-950/80 border border-red-900/40 text-center shadow-lg animate-in fade-in duration-200">
                  <div className="text-[11px] font-mono text-red-400/90 flex items-center justify-center gap-1.5 mb-1">
                    <Mic className="w-3.5 h-3.5 animate-pulse" />
                    <span>{listeningNote || 'Microphone Live:'}</span>
                  </div>
                  <div className="text-sm font-medium text-white min-h-[22px]">
                    {liveTranscript ? (
                      <span className="text-red-300 font-semibold">&ldquo;{liveTranscript}&rdquo;</span>
                    ) : (
                      <span className="text-neutral-500 italic">Abhi boliye... Aapki aawaz direct suni ja rahi hai</span>
                    )}
                  </div>
                  {isMicActive && (
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <button
                        onClick={handleDoneSpeaking}
                        className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>बोल लिया? भेजें (Send)</span>
                      </button>
                      <button
                        onClick={() => stopListening(true)}
                        className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-medium flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>रद्द करें</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Chat & Automation History Log */}
            <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-3xl p-4 md:p-6 flex flex-col gap-4">
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-red-400" /> Conversation & Activity Log
                </span>
                <span className="text-[11px] text-neutral-500 font-normal">
                  {messages.length} message{messages.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-3 p-3 bg-neutral-950/70 border border-neutral-800/80 rounded-2xl text-xs font-mono">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${
                      m.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl ${
                        m.role === 'user'
                          ? 'bg-red-600 text-white rounded-tr-none'
                          : 'bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-tl-none'
                      }`}
                    >
                      <div className="font-sans leading-relaxed">{m.text}</div>
                      {m.command && (
                        <div className="mt-2 pt-1.5 border-t border-neutral-800 text-[10px] text-red-300 flex items-center gap-1">
                          <Terminal className="w-3 h-3" />
                          <span>Action: {m.command.description}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Bottom Query Input Box */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMic}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                    isMicActive
                      ? 'bg-red-600 text-white ring-2 ring-red-500/50 animate-pulse'
                      : orbState === 'speaking'
                      ? 'bg-rose-950/80 border border-rose-800 text-rose-300'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                  }`}
                  title={
                    orbState === 'speaking'
                      ? 'पायल को रोकें / Tap to Stop'
                      : isMicActive
                      ? 'बोलना पूरा करें और भेजें / Send'
                      : 'माइक चालू करें / Speak'
                  }
                >
                  {orbState === 'speaking' ? (
                    <Square className="w-4 h-4 fill-current text-rose-300" />
                  ) : isMicActive ? (
                    <Mic className="w-5 h-5 text-white animate-pulse" />
                  ) : (
                    <Mic className="w-5 h-5 text-neutral-400" />
                  )}
                </button>

                <div className="flex-1 flex items-center bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 focus-within:border-red-500 transition-colors">
                  <input
                    type="text"
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUserMessage(inputQuery);
                    }}
                    placeholder={
                      isMicActive
                        ? 'Sun rahi hoon... Boliye...'
                        : "माइक दबाकर बोलें या टाइप करें (e.g. 'YouTube kholo')..."
                    }
                    className="w-full bg-transparent text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none"
                  />
                  {isMicActive ? (
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        onClick={handleDoneSpeaking}
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow-sm"
                        title="भेजें / Send"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </button>
                      <button
                        onClick={() => stopListening(true)}
                        className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                        title="रद्द करें / Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUserMessage(inputQuery)}
                      disabled={!inputQuery.trim()}
                      className="p-1 text-red-500 hover:text-red-400 disabled:opacity-30 transition-colors shrink-0 cursor-pointer"
                      title="Send message"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
      </main>

      {/* Code Export & Download Modal */}
      <CodeExportModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
      />
    </div>
  );
}

export default App;
