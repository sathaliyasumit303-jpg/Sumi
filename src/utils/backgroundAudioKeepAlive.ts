/**
 * Background Audio & Microphone Keep-Alive Service
 *
 * Keeps the microphone stream alive and audio processing active even when
 * the browser tab is not in focus (or backgrounded) via 5 Web API mechanisms:
 * 1. Web Audio silent keep-alive loop with MediaSession metadata (prevents tab throttling)
 * 2. Dedicated Web Worker heartbeat (exempt from window timer clamping)
 * 3. Service Worker registration and heartbeat channel (/sw.js)
 * 4. Screen WakeLock API (prevents device sleep during voice listening)
 * 5. Page Visibility watchdog for auto-resuming suspended AudioContext
 */

export class BackgroundAudioKeepAlive {
  private static instance: BackgroundAudioKeepAlive | null = null;

  private isEnabled = false;
  private isTabHidden = document.hidden;
  private worker: Worker | null = null;
  private wakeLock: any = null;
  private silentAudio: HTMLAudioElement | null = null;
  private silentContext: AudioContext | null = null;
  private silentGain: GainNode | null = null;
  private serviceWorkerReg: ServiceWorkerRegistration | null = null;

  // Registered contexts & watchdogs to keep alive in background
  private monitoredContexts: Set<AudioContext> = new Set();
  private watchdogCallbacks: Set<() => void> = new Set();

  private constructor() {
    this.setupVisibilityListener();
    this.setupServiceWorker();
  }

  public static getInstance(): BackgroundAudioKeepAlive {
    if (!BackgroundAudioKeepAlive.instance) {
      BackgroundAudioKeepAlive.instance = new BackgroundAudioKeepAlive();
    }
    return BackgroundAudioKeepAlive.instance;
  }

  /**
   * Register an AudioContext to be kept running and auto-resumed in background
   */
  public registerAudioContext(context: AudioContext): void {
    if (context) {
      this.monitoredContexts.add(context);
    }
  }

  public unregisterAudioContext(context: AudioContext): void {
    this.monitoredContexts.delete(context);
  }

  /**
   * Register a watchdog callback (e.g., SpeechRecognition watchdog) to be invoked
   * on every worker heartbeat tick (~100ms) even when the tab is completely in background
   */
  public registerWatchdog(callback: () => void): () => void {
    this.watchdogCallbacks.add(callback);
    return () => {
      this.watchdogCallbacks.delete(callback);
    };
  }

  /**
   * Start background listening survival system
   */
  public async start(): Promise<void> {
    if (this.isEnabled) return;
    this.isEnabled = true;

    // 1. Start dedicated Web Worker for unthrottled timer ticks
    this.startWorkerHeartbeat();

    // 2. Start silent audio stream to register tab as active media player in browser
    this.startSilentAudioLoop();

    // 3. Configure MediaSession API for OS background media priority
    this.setupMediaSession();

    // 4. Request WakeLock if supported
    this.requestWakeLock();

    // 5. Inform Service Worker
    this.notifyServiceWorker(true);
  }

  /**
   * Stop background listening survival system
   */
  public stop(): void {
    if (!this.isEnabled) return;
    this.isEnabled = false;

    this.stopWorkerHeartbeat();
    this.stopSilentAudioLoop();
    this.releaseWakeLock();
    this.clearMediaSession();
    this.notifyServiceWorker(false);
  }

  public getIsActive(): boolean {
    return this.isEnabled;
  }

  public getIsTabHidden(): boolean {
    return this.isTabHidden;
  }

  // --- 1. UNTHROTTLED WEB WORKER HEARTBEAT ---
  private startWorkerHeartbeat(): void {
    if (this.worker) return;

    try {
      // Inlined worker code: runs on separate OS thread, completely exempt from tab background timer clamping
      const workerCode = `
        let timer = null;
        self.onmessage = function(e) {
          if (e.data.action === 'start') {
            const interval = e.data.interval || 120;
            if (timer) clearInterval(timer);
            timer = setInterval(function() {
              self.postMessage({ type: 'HEARTBEAT_TICK', timestamp: Date.now() });
            }, interval);
          } else if (e.data.action === 'stop') {
            if (timer) clearInterval(timer);
            timer = null;
          }
        };
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      this.worker = new Worker(workerUrl);

      this.worker.onmessage = (event) => {
        if (event.data?.type === 'HEARTBEAT_TICK') {
          this.onHeartbeatTick();
        }
      };

      this.worker.postMessage({ action: 'start', interval: 120 });
    } catch (err) {
      console.warn('Web Worker fallback note:', err);
    }
  }

  private stopWorkerHeartbeat(): void {
    if (this.worker) {
      try {
        this.worker.postMessage({ action: 'stop' });
        this.worker.terminate();
      } catch (_e) {}
      this.worker = null;
    }
  }

  private onHeartbeatTick(): void {
    if (!this.isEnabled) return;

    // Check all monitored AudioContexts: if suspended by browser, wake them up immediately!
    for (const ctx of this.monitoredContexts) {
      if (ctx.state === 'suspended') {
        try {
          ctx.resume().catch(() => {});
        } catch (_e) {}
      }
    }

    // Execute background watchdogs (e.g. SpeechRecognition keep-alive)
    this.watchdogCallbacks.forEach((cb) => {
      try {
        cb();
      } catch (_e) {}
    });
  }

  // --- 2. SILENT AUDIO LOOP (MEDIA SESSION SURVIVAL) ---
  // A browser tab playing audio is marked as an "Active Audio Session",
  // which exempts the tab from process freezing, memory discarding, and mic suspension.
  private startSilentAudioLoop(): void {
    try {
      if (!this.silentContext || this.silentContext.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.silentContext = new AudioCtx();
      }

      if (this.silentContext.state === 'suspended') {
        this.silentContext.resume().catch(() => {});
      }

      // Generate continuous 1-second looping buffer of silence
      const buffer = this.silentContext.createBuffer(1, this.silentContext.sampleRate, this.silentContext.sampleRate);
      const source = this.silentContext.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      // Inaudible gain
      this.silentGain = this.silentContext.createGain();
      this.silentGain.gain.setValueAtTime(0.0001, this.silentContext.currentTime);

      source.connect(this.silentGain);
      this.silentGain.connect(this.silentContext.destination);

      source.start();
    } catch (e) {
      // Fallback: 1-pixel silent WAV loop in HTMLAudioElement
      try {
        if (!this.silentAudio) {
          // 44-byte silent WAV base64
          const silentWav = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
          this.silentAudio = new Audio(silentWav);
          this.silentAudio.loop = true;
          this.silentAudio.volume = 0.01;
        }
        this.silentAudio.play().catch(() => {});
      } catch (_err) {}
    }
  }

  private stopSilentAudioLoop(): void {
    if (this.silentContext && this.silentContext.state !== 'closed') {
      try {
        this.silentContext.close();
      } catch (_e) {}
      this.silentContext = null;
    }
    if (this.silentAudio) {
      try {
        this.silentAudio.pause();
      } catch (_e) {}
    }
  }

  // --- 3. MEDIA SESSION API METADATA & ACTIONS ---
  private setupMediaSession(): void {
    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'PAYAL Voice Assistant',
        artist: 'पायल • बैकग्राउंड में सुन रही हूँ',
        album: 'AI Voice Assistant',
        artwork: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      });

      navigator.mediaSession.playbackState = 'playing';

      navigator.mediaSession.setActionHandler('play', () => {
        this.start();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        // Keeps alive or allows user pause
      });
      navigator.mediaSession.setActionHandler('stop', () => {
        this.stop();
      });
    } catch (_e) {}
  }

  private clearMediaSession(): void {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.playbackState = 'none';
    } catch (_e) {}
  }

  // --- 4. SCREEN WAKE LOCK API ---
  private async requestWakeLock(): Promise<void> {
    if (!('wakeLock' in navigator)) return;

    try {
      if (!this.wakeLock) {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => {
          this.wakeLock = null;
          // Re-acquire if still enabled and tab becomes visible
          if (this.isEnabled && !document.hidden) {
            this.requestWakeLock();
          }
        });
      }
    } catch (_e) {}
  }

  private releaseWakeLock(): void {
    if (this.wakeLock) {
      try {
        this.wakeLock.release();
      } catch (_e) {}
      this.wakeLock = null;
    }
  }

  // --- 5. PAGE VISIBILITY & FOCUS WATCHDOG ---
  private setupVisibilityListener(): void {
    const handleVisibilityChange = () => {
      this.isTabHidden = document.hidden;

      if (this.isEnabled) {
        if (!document.hidden) {
          // Tab returned to foreground: re-acquire WakeLock and resume audio contexts
          this.requestWakeLock();
          for (const ctx of this.monitoredContexts) {
            if (ctx.state === 'suspended') {
              ctx.resume().catch(() => {});
            }
          }
        } else {
          // Tab entered background: ensure silent keep-alive and worker ticks are active
          if (this.silentContext && this.silentContext.state === 'suspended') {
            this.silentContext.resume().catch(() => {});
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', () => {
      this.isTabHidden = false;
      handleVisibilityChange();
    });
    window.addEventListener('blur', () => {
      // Tab lost window focus (switching windows or browser tabs)
      if (this.isEnabled) {
        for (const ctx of this.monitoredContexts) {
          if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
          }
        }
      }
    });
  }

  // --- 6. SERVICE WORKER REGISTRATION & NOTIFICATIONS ---
  private setupServiceWorker(): void {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            this.serviceWorkerReg = reg;
            navigator.serviceWorker.addEventListener('message', (event) => {
              if (event.data?.type === 'SW_BACKGROUND_HEARTBEAT') {
                this.onHeartbeatTick();
              }
            });
          })
          .catch((err) => {
            console.debug('Service Worker register note:', err);
          });
      });
    }
  }

  private notifyServiceWorker(active: boolean): void {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      try {
        navigator.serviceWorker.controller.postMessage({
          type: active ? 'START_BACKGROUND_LISTENING' : 'STOP_BACKGROUND_LISTENING',
        });
      } catch (_e) {}
    }
  }
}

export const backgroundAudioKeepAlive = BackgroundAudioKeepAlive.getInstance();
