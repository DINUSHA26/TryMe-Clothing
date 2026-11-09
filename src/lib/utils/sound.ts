/**
 * Notification Sound Utility
 * 
 * Handles browser Autoplay Policy and background tab restrictions:
 * 1. Global pre-warmed AudioContext and HTML5 Audio element.
 * 2. Auto-unlocks on first user interaction (click, keydown, touch) on the dashboard.
 * 3. Dual-harmonic crystal bell chime (880Hz + 1174.66Hz) via Web Audio + HTML5 Audio fallback.
 * 4. 400ms debounce to prevent audio clipping on concurrent triggers.
 */

let sharedAudio: HTMLAudioElement | null = null;
let sharedCtx: AudioContext | null = null;
let isUnlocked = false;
let lastPlayedAt = 0;

/**
 * Initialize audio unlock listeners on the window.
 * Modern browsers require at least one user gesture to allow audio output.
 */
export function initAudioUnlock() {
  if (typeof window === "undefined") return;

  const unlock = () => {
    try {
      // 1. Preload HTML5 Audio
      if (!sharedAudio) {
        sharedAudio = new Audio("/sounds/bell.wav");
        sharedAudio.preload = "auto";
        sharedAudio.load();
      }

      // 2. Pre-warm AudioContext
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass && !sharedCtx) {
        sharedCtx = new AudioContextClass();
      }

      if (sharedCtx && sharedCtx.state === "suspended") {
        sharedCtx.resume().then(() => {
          isUnlocked = true;
          console.log("[NotificationSound] AudioContext unlocked successfully");
        }).catch(() => {});
      } else if (sharedCtx && sharedCtx.state === "running") {
        isUnlocked = true;
      }
    } catch (e) {
      // Non-fatal
    }

    if (isUnlocked) {
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    }
  };

  window.addEventListener("click", unlock, { passive: true });
  window.addEventListener("keydown", unlock, { passive: true });
  window.addEventListener("touchstart", unlock, { passive: true });
}

/**
 * Play pleasant crystal bell chime
 */
export function playNotificationChime(): boolean {
  if (typeof window === "undefined") return false;

  const nowMs = Date.now();
  if (nowMs - lastPlayedAt < 400) return true; // Debounce
  lastPlayedAt = nowMs;

  console.log("[NotificationSound] Playing notification bell chime...");

  // Strategy 1: Synthesize with Web Audio API (instant 0ms response)
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      if (!sharedCtx) {
        sharedCtx = new AudioContextClass();
      }

      if (sharedCtx.state === "suspended") {
        sharedCtx.resume().catch(() => {});
      }

      const ctx = sharedCtx;
      const now = ctx.currentTime;

      // Note 1: 880 Hz (A5 chime)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(875, now + 0.6);

      gain1.gain.setValueAtTime(0.5, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Note 2: 1174.66 Hz (D6 crystal chime)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(1174.66, now + 0.15);
      osc2.frequency.exponentialRampToValueAtTime(1170, now + 1.0);

      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.setValueAtTime(0.55, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 1.0);
    }
  } catch (err) {
    console.warn("[NotificationSound] Web Audio synthesis error:", err);
  }

  // Strategy 2: HTML5 Audio fallback for background tabs and unhandled contexts
  try {
    if (!sharedAudio) {
      sharedAudio = new Audio("/sounds/bell.wav");
    }
    sharedAudio.currentTime = 0;
    sharedAudio.volume = 0.9;
    const playPromise = sharedAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn("[NotificationSound] HTML5 Audio autoplay policy notice:", err?.name, err?.message);
      });
    }
  } catch (audioErr) {
    console.warn("[NotificationSound] HTML5 Audio error:", audioErr);
  }

  return true;
}


