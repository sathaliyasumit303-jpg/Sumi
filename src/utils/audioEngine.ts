/**
 * Client Audio Engine for PAYAL
 * Mirrors AudioEngine.kt with Web Audio API:
 * - 16kHz microphone capture & RMS calculation
 * - 24kHz speaker playback
 * - Echo suppression while speaking
 * - Interrupt support
 * - SpeechRecognition integration
 */

import { cleanForSpeech, removeEmojis, convertHinglishToDevanagari } from './textCleaner';

export class WebAudioEngine {
  private micContext: AudioContext | null = null;
  private speakerContext: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;

  private isSpeaking = false;
  private isMuted = false;
  private activeSourceNodes: AudioBufferSourceNode[] = [];
  private nextPlayTime = 0;
  private speakerAnalyser: AnalyserNode | null = null;
  private speakerAnimFrameId: number | null = null;
  private speechSimInterval: any = null;

  // Wake word engine state
  private wakeWord = 'Hey PAYAL';
  private wakeWordEnabled = true;
  private wakeWordRecognition: any = null;
  private isListeningForWakeWord = false;
  private wakeWordCooldown = false;
  private wakeWordRestartTimeout: any = null;

  public onAmplitudeChanged?: (rms: Float32Array | number) => void;
  public onSpeakingStarted?: () => void;
  public onSpeakingStopped?: () => void;
  public onWakeWordDetected?: (detectedWord: string) => void;

  /**
   * Start microphone recording and live RMS calculation
   */
  async startRecording(): Promise<boolean> {
    try {
      if (this.micStream) return true;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.micContext = new AudioCtx({ sampleRate: 16000 });

      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const source = this.micContext.createMediaStreamSource(this.micStream);
      this.analyser = this.micContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      const pcmData = new Uint8Array(this.analyser.frequencyBinCount);

      const loop = () => {
        if (!this.analyser) return;

        if (this.isSpeaking || this.isMuted) {
          // Suppress mic processing while PAYAL speaks or when muted
          this.onAmplitudeChanged?.(0);
        } else {
          this.analyser.getByteTimeDomainData(pcmData);
          // Calculate RMS
          let sumSquares = 0;
          for (let i = 0; i < pcmData.length; i++) {
            const normalized = (pcmData[i] - 128) / 128;
            sumSquares += normalized * normalized;
          }
          const rms = Math.sqrt(sumSquares / pcmData.length);
          // Boost sensitivity for user speech
          const amplifiedRms = Math.min(1.0, rms * 3.2);
          this.onAmplitudeChanged?.(amplifiedRms);
        }

        this.animFrameId = requestAnimationFrame(loop);
      };

      loop();
      return true;
    } catch (err) {
      console.warn('Microphone permission not granted or unavailable:', err);
      return false;
    }
  }

  /**
   * Stop microphone recording and release hardware audio capture
   * Crucial for Android to prevent "Chrome is recording" system locks
   */
  stopRecording(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (_e) {}
      });
      this.micStream = null;
    }
    if (this.micContext && this.micContext.state !== 'closed') {
      try {
        this.micContext.close();
      } catch (_e) {}
      this.micContext = null;
    }
    this.analyser = null;
    this.onAmplitudeChanged?.(0);
  }

  /**
   * Play base64 24kHz PCM audio chunk from Gemini Aoede voice model
   * Resolves when audio playback finishes completely
   */
  playPcmChunk(base64Pcm: string, sampleRate = 24000): Promise<void> {
    return new Promise<void>((resolve) => {
      try {
        const binaryString = atob(base64Pcm);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // 16-bit PCM little-endian to float32
        const numSamples = Math.floor(bytes.length / 2);
        const float32Data = new Float32Array(numSamples);
        const dataView = new DataView(bytes.buffer);

        for (let i = 0; i < numSamples; i++) {
          const int16 = dataView.getInt16(i * 2, true);
          float32Data[i] = int16 < 0 ? int16 / 32768 : int16 / 32767;
        }

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!this.speakerContext || this.speakerContext.state === 'closed') {
          this.speakerContext = new AudioCtx({ sampleRate });
        }

        const proceed = () => {
          if (!this.speakerContext) {
            resolve();
            return;
          }

          const audioBuffer = this.speakerContext.createBuffer(1, numSamples, sampleRate);
          audioBuffer.getChannelData(0).set(float32Data);

          const sourceNode = this.speakerContext.createBufferSource();
          sourceNode.buffer = audioBuffer;

          // Connect through speakerAnalyser for real-time visualizer pulsing during Aoede speech
          if (!this.speakerAnalyser) {
            this.speakerAnalyser = this.speakerContext.createAnalyser();
            this.speakerAnalyser.fftSize = 256;
            this.speakerAnalyser.connect(this.speakerContext.destination);
          }
          sourceNode.connect(this.speakerAnalyser);

          const now = this.speakerContext.currentTime;
          const startTime = Math.max(now, this.nextPlayTime);
          sourceNode.start(startTime);
          this.nextPlayTime = startTime + audioBuffer.duration;

          if (!this.isSpeaking) {
            this.isSpeaking = true;
            this.onSpeakingStarted?.();
            this.startSpeakerVisualizerLoop();
          }

          this.activeSourceNodes.push(sourceNode);

          let ended = false;
          const onDone = () => {
            if (ended) return;
            ended = true;
            const idx = this.activeSourceNodes.indexOf(sourceNode);
            if (idx !== -1) this.activeSourceNodes.splice(idx, 1);

            if (this.activeSourceNodes.length === 0) {
              this.stopSpeakerVisualizerLoop();
              this.isSpeaking = false;
              this.onSpeakingStopped?.();
              this.nextPlayTime = 0;
              this.onAmplitudeChanged?.(0);
            }
            resolve();
          };

          sourceNode.onended = onDone;
          // Safety timeout in case onended is dropped by browser
          setTimeout(onDone, Math.ceil(audioBuffer.duration * 1000) + 400);
        };

        if (this.speakerContext.state === 'suspended') {
          this.speakerContext.resume().then(proceed).catch(() => proceed());
        } else {
          proceed();
        }
      } catch (e) {
        console.error('Error playing PCM audio chunk:', e);
        this.stopSpeakerVisualizerLoop();
        this.isSpeaking = false;
        this.onSpeakingStopped?.();
        resolve();
      }
    });
  }

  private startSpeakerVisualizerLoop(): void {
    if (this.speakerAnimFrameId) return;
    const pcmData = new Uint8Array(128);
    const loop = () => {
      if (!this.speakerAnalyser || !this.isSpeaking) {
        this.speakerAnimFrameId = null;
        return;
      }
      this.speakerAnalyser.getByteTimeDomainData(pcmData);
      let sumSquares = 0;
      for (let i = 0; i < pcmData.length; i++) {
        const val = (pcmData[i] - 128) / 128;
        sumSquares += val * val;
      }
      const rms = Math.sqrt(sumSquares / pcmData.length);
      this.onAmplitudeChanged?.(Math.min(1, rms * 3.8));
      this.speakerAnimFrameId = requestAnimationFrame(loop);
    };
    this.speakerAnimFrameId = requestAnimationFrame(loop);
  }

  private stopSpeakerVisualizerLoop(): void {
    if (this.speakerAnimFrameId) {
      cancelAnimationFrame(this.speakerAnimFrameId);
      this.speakerAnimFrameId = null;
    }
  }

  /**
   * Selects the highest quality Indian female voice available on the device
   * Supports Android Google Hindi TTS, Windows Microsoft Swara/Kalpana, iOS Lekha,
   * and fallback Indian English female voices.
   */
  private pickIndianFemaleVoice(
    voices: SpeechSynthesisVoice[],
    preferredName?: string
  ): SpeechSynthesisVoice | null {
    if (!voices || voices.length === 0) return null;

    if (preferredName) {
      const match = voices.find((v) =>
        v.name.toLowerCase().includes(preferredName.toLowerCase())
      );
      if (match) return match;
    }

    const scoreVoice = (v: SpeechSynthesisVoice): number => {
      const lang = (v.lang || '').toLowerCase().replace('_', '-');
      const name = (v.name || '').toLowerCase();
      let score = 0;

      // Heavy penalty for male voices so assistant is always female
      if (
        name.includes('male') ||
        name.includes('david') ||
        name.includes('george') ||
        name.includes('mark') ||
        name.includes('ravi') ||
        name.includes('prabhat') ||
        name.includes('madhav')
      ) {
        score -= 100;
      }

      // Strong bonus for Hindi language
      if (lang === 'hi-in' || lang.startsWith('hi')) {
        score += 80;
      } else if (lang === 'en-in') {
        score += 30;
      }

      // Top priority: Authentic Indian Hindi female voice identifiers
      // Google TTS: 'Google हिन्दी', 'hi-in-x-hie-local', 'hi-in-x-hie-network', 'hi-in-x-cfh-local'
      // Windows: 'Swara', 'Kalpana'
      // Apple: 'Lekha'
      if (
        name.includes('swara') ||
        name.includes('lekha') ||
        name.includes('kalpana') ||
        name.includes('हिन्दी') ||
        name.includes('hindi') ||
        name.includes('hie') ||
        name.includes('cfh')
      ) {
        score += 70;
      } else if (
        name.includes('neerja') ||
        name.includes('kavya') ||
        name.includes('heera') ||
        name.includes('priya')
      ) {
        score += 40;
      } else if (
        name.includes('female') ||
        name.includes('woman') ||
        name.includes('girl') ||
        name.includes('natural')
      ) {
        score += 25;
      }

      return score;
    };

    const sorted = [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a));
    return sorted[0] && scoreVoice(sorted[0]) > 0 ? sorted[0] : null;
  }

  /**
   * Browser Web Speech API for speaking text aloud with an authentic, sweet 20-year-old Indian girl voice
   */
  speakTextAloud(text: string, voiceName?: string): Promise<void> {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();
      if (this.speechSimInterval) {
        clearInterval(this.speechSimInterval);
        this.speechSimInterval = null;
      }

      // Clean text for speech - strip all markdown symbols and all emojis so TTS never speaks emoji names
      let cleanText = cleanForSpeech(text).trim();
      // Crucial: Convert any Roman Hinglish ("Hello mere pyaare Sumit") to Devanagari Hindi
      // so the Indian TTS engine pronounces it in pure, melodious Indian girl voice instead of robotic English phonetics!
      cleanText = convertHinglishToDevanagari(cleanText);

      if (!cleanText) {
        resolve();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Explicitly set language tag to Hindi (India)
      utterance.lang = 'hi-IN';

      // Select authentic Indian female voice (Google हिन्दी, Swara, Kalpana, Lekha)
      const voices = window.speechSynthesis.getVoices();
      const actualVoiceName = voiceName === 'IndianGirl20' ? undefined : voiceName;
      const bestIndianVoice = this.pickIndianFemaleVoice(voices, actualVoiceName);

      if (bestIndianVoice) {
        utterance.voice = bestIndianVoice;
        if (bestIndianVoice.lang) utterance.lang = bestIndianVoice.lang;
      }

      // Pitch: 1.28 gives a youthful, lively, cute 20-year-old Indian girl tone (standard adult is 1.0)
      // Rate: 1.02 delivers sweet, natural, energetic conversational pacing
      utterance.pitch = 1.28;
      utterance.rate = 1.02;

      let hasEnded = false;
      const finishSpeaking = () => {
        if (hasEnded) return;
        hasEnded = true;
        if (this.speechSimInterval) {
          clearInterval(this.speechSimInterval);
          this.speechSimInterval = null;
        }
        this.isSpeaking = false;
        this.onSpeakingStopped?.();
        this.onAmplitudeChanged?.(0);
        resolve();
      };

      const startTime = Date.now();
      utterance.onstart = () => {
        this.isSpeaking = true;
        this.onSpeakingStarted?.();
        // Dynamic waveform pulsing while the 20-year-old Indian girl speaks
        if (this.speechSimInterval) clearInterval(this.speechSimInterval);
        this.speechSimInterval = setInterval(() => {
          if (!this.isSpeaking) {
            if (this.speechSimInterval) clearInterval(this.speechSimInterval);
            this.speechSimInterval = null;
            return;
          }
          const elapsed = (Date.now() - startTime) / 1000;
          // Syllabic envelope modulation (vowels and pauses 6-8Hz)
          const syllabicCadence = (Math.sin(elapsed * 16) + Math.sin(elapsed * 9.5) + 1.8) / 3.8;
          const jitter = 0.6 + Math.random() * 0.4;
          const rms = Math.min(1.0, Math.max(0.15, syllabicCadence * jitter));
          this.onAmplitudeChanged?.(rms);
        }, 35);
      };

      utterance.onend = () => {
        finishSpeaking();
      };

      utterance.onerror = () => {
        finishSpeaking();
      };

      // Safety timeout: on Android Chrome, speech synthesis occasionally drops the onend event
      const maxDuration = Math.max(4000, (cleanText.length / 10) * 1000 + 3000);
      setTimeout(finishSpeaking, maxDuration);

      // Micro-delay avoids race condition with cancel() on WebKit / Android Chrome
      setTimeout(() => {
        try {
          window.speechSynthesis.speak(utterance);
        } catch (_err) {
          finishSpeaking();
        }
      }, 20);
    });
  }

  /**
   * Interrupt PAYAL speaking immediately
   */
  interrupt(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (this.speechSimInterval) {
      clearInterval(this.speechSimInterval);
      this.speechSimInterval = null;
    }

    for (const node of this.activeSourceNodes) {
      try {
        node.stop();
        node.disconnect();
      } catch (_e) {}
    }
    this.activeSourceNodes = [];
    this.nextPlayTime = 0;
    this.stopSpeakerVisualizerLoop();
    this.isSpeaking = false;
    this.onSpeakingStopped?.();
    this.onAmplitudeChanged?.(0);
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.onAmplitudeChanged?.(0);
    }
  }

  getIsMuted(): boolean {
    return this.isMuted;
  }

  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  setWakeWord(word: string): void {
    if (word && word.trim()) {
      this.wakeWord = word.trim();
    }
  }

  getWakeWord(): string {
    return this.wakeWord;
  }

  setWakeWordEnabled(enabled: boolean): void {
    this.wakeWordEnabled = enabled;
    if (!enabled) {
      this.stopWakeWordDetection();
    } else {
      this.startWakeWordDetection();
    }
  }

  /**
   * Start listening for the wake word continuously in the background
   * Respects microphone mute state and speaking state
   */
  startWakeWordDetection(): void {
    if (!this.wakeWordEnabled) return;
    if (this.isListeningForWakeWord) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      if (!this.wakeWordRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'hi-IN';

        recognition.onresult = (event: any) => {
          if (this.isMuted || this.isSpeaking || this.wakeWordCooldown || !this.wakeWordEnabled) {
            return;
          }

          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }

          const cleanTranscript = currentTranscript.toLowerCase().replace(/[.,!?;:]/g, '').trim();
          const targetWake = this.wakeWord.toLowerCase().replace(/[.,!?;:]/g, '').trim();

          const matches =
            cleanTranscript.includes(targetWake) ||
            (targetWake.includes('payal') &&
              (cleanTranscript.includes('hey payal') ||
                cleanTranscript.includes('suno payal') ||
                cleanTranscript.includes('hi payal') ||
                cleanTranscript.includes('hello payal') ||
                cleanTranscript.includes('ok payal')));

          if (matches) {
            this.wakeWordCooldown = true;
            setTimeout(() => {
              this.wakeWordCooldown = false;
            }, 2500);

            this.onWakeWordDetected?.(this.wakeWord);
          }
        };

        recognition.onerror = (event: any) => {
          if (event.error !== 'no-speech') {
            console.debug('Wake word recognition note:', event.error);
          }
        };

        recognition.onend = () => {
          if (
            this.isListeningForWakeWord &&
            this.wakeWordEnabled &&
            !this.isMuted &&
            !this.isSpeaking
          ) {
            if (this.wakeWordRestartTimeout) clearTimeout(this.wakeWordRestartTimeout);
            this.wakeWordRestartTimeout = setTimeout(() => {
              try {
                if (
                  this.isListeningForWakeWord &&
                  this.wakeWordEnabled &&
                  this.wakeWordRecognition &&
                  !this.isMuted &&
                  !this.isSpeaking
                ) {
                  this.wakeWordRecognition.start();
                }
              } catch (_e) {}
            }, 1000);
          }
        };

        this.wakeWordRecognition = recognition;
      }

      this.isListeningForWakeWord = true;
      try {
        this.wakeWordRecognition.start();
      } catch (_e) {}
    } catch (e) {
      console.warn('Could not start wake word recognition:', e);
    }
  }

  stopWakeWordDetection(): void {
    this.isListeningForWakeWord = false;
    if (this.wakeWordRestartTimeout) {
      clearTimeout(this.wakeWordRestartTimeout);
      this.wakeWordRestartTimeout = null;
    }
    if (this.wakeWordRecognition) {
      try {
        this.wakeWordRecognition.onend = null;
        this.wakeWordRecognition.onerror = null;
        this.wakeWordRecognition.onresult = null;
        if (typeof this.wakeWordRecognition.abort === 'function') {
          this.wakeWordRecognition.abort();
        } else {
          this.wakeWordRecognition.stop();
        }
      } catch (_e) {}
      this.wakeWordRecognition = null;
    }
  }

  /**
   * Records a user voice snippet via MediaRecorder for fallback STT transcription
   */
  async startVoiceRecordingSnippet(
    onAmplitude?: (amp: number) => void
  ): Promise<{ stop: () => Promise<{ base64: string; mimeType: string }> }> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx({ sampleRate: 16000 });
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const pcmData = new Uint8Array(analyser.frequencyBinCount);
    let animId: number | null = null;

    const measureLoop = () => {
      analyser.getByteTimeDomainData(pcmData);
      let sum = 0;
      for (let i = 0; i < pcmData.length; i++) {
        const val = (pcmData[i] - 128) / 128;
        sum += val * val;
      }
      const rms = Math.sqrt(sum / pcmData.length);
      onAmplitude?.(Math.min(1.0, rms * 3.5));
      animId = requestAnimationFrame(measureLoop);
    };
    measureLoop();

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/mp4')
      ? 'audio/mp4'
      : 'audio/webm';

    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.start(100);

    return {
      stop: () =>
        new Promise((resolve) => {
          if (animId) cancelAnimationFrame(animId);
          onAmplitude?.(0);

          mediaRecorder.onstop = () => {
            // Clean up audio tracks & context
            stream.getTracks().forEach((t) => {
              try {
                t.stop();
              } catch (_e) {}
            });
            try {
              ctx.close();
            } catch (_e) {}

            const blob = new Blob(chunks, { type: mimeType });
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
              const base64 = (reader.result as string) || '';
              resolve({ base64, mimeType });
            };
          };

          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          } else {
            stream.getTracks().forEach((t) => {
              try {
                t.stop();
              } catch (_e) {}
            });
            try {
              ctx.close();
            } catch (_e) {}
            resolve({ base64: '', mimeType });
          }
        }),
    };
  }

  /**
   * Records a wake word audio sample from the microphone for preview and transcription
   */
  async recordWakeWordSample(
    durationMs = 2800,
    onProgress?: (pct: number) => void
  ): Promise<{ audioUrl: string; transcript: string; base64: string }> {
    // Ensure microphone stream is active
    if (!this.micStream) {
      const ok = await this.startRecording();
      if (!ok || !this.micStream) {
        throw new Error('Microphone permission required');
      }
    }

    return new Promise((resolve, reject) => {
      try {
        const stream = this.micStream!;
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks: Blob[] = [];

        // Simultaneous speech recognition attempt for auto-transcription
        let detectedSpeech = '';
        const SpeechRecognition =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        let tempRecognition: any = null;

        if (SpeechRecognition) {
          try {
            tempRecognition = new SpeechRecognition();
            tempRecognition.continuous = false;
            tempRecognition.interimResults = false;
            tempRecognition.lang = 'hi-IN';
            tempRecognition.onresult = (evt: any) => {
              if (evt.results[0]?.[0]?.transcript) {
                detectedSpeech = evt.results[0][0].transcript.trim();
              }
            };
            tempRecognition.start();
          } catch (_e) {}
        }

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          if (tempRecognition) {
            try {
              tempRecognition.stop();
            } catch (_e) {}
          }

          const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
          const audioUrl = URL.createObjectURL(audioBlob);

          // Convert blob to base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64 = (reader.result as string) || '';
            resolve({
              audioUrl,
              transcript: detectedSpeech || this.wakeWord,
              base64,
            });
          };
        };

        mediaRecorder.start();

        // Progress updates
        const startTime = Date.now();
        const interval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
          onProgress?.(pct);
          if (elapsed >= durationMs) {
            clearInterval(interval);
            if (mediaRecorder.state === 'recording') {
              mediaRecorder.stop();
            }
          }
        }, 100);
      } catch (err) {
        reject(err);
      }
    });
  }

  release(): void {
    this.stopWakeWordDetection();
    this.interrupt();
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.micContext && this.micContext.state !== 'closed') {
      this.micContext.close();
    }
    if (this.speakerContext && this.speakerContext.state !== 'closed') {
      this.speakerContext.close();
    }
  }
}
