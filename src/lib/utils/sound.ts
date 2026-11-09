/**
 * Notification Sound Utility
 * Generates an instant high-quality dual-harmonic bell chime using Web Audio API
 * with fallback to audio element for maximum browser reliability.
 */

export function playNotificationChime() {
  if (typeof window === "undefined") return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      const ctx = new AudioContextClass();

      // Resume context if suspended by browser autoplay policy
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Primary chime tone 1 (880 Hz / A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(875, now + 0.6);

      gain1.gain.setValueAtTime(0.45, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Secondary crystal chime tone 2 (1174.66 Hz / D6)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(1174.66, now + 0.18);
      osc2.frequency.exponentialRampToValueAtTime(1170, now + 1.1);

      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.setValueAtTime(0.5, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 1.1);
      return;
    }
  } catch (err) {
    // fallback to HTML5 Audio element
  }

  try {
    const audio = new Audio("/sounds/bell.wav");
    audio.volume = 0.8;
    audio.play().catch(() => {});
  } catch (e) {}
}
