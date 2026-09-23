// Web Audio API Sound Generator for Real-Time Notification Chimes
// Fail-safe and pure client-side without external asset dependencies

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {
        // Ignored if browser blocks autoplay before user interaction
      });
    }
    return audioCtx;
  } catch (e) {
    return null;
  }
}

export function playNotificationChime(type: 'default' | 'urgent' | 'order' | 'visit' = 'default') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    gain.connect(ctx.destination);

    if (type === 'urgent' || type === 'order') {
      // Crisp 3-tone ascending alert chime
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880.0, now + 0.08); // A5
      osc1.frequency.exponentialRampToValueAtTime(1174.66, now + 0.16); // D6

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc1.start(now);
      osc1.stop(now + 0.36);
    } else {
      // Pleasant 2-tone melodic chime
      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(659.25, now); // E5
      osc1.frequency.exponentialRampToValueAtTime(987.77, now + 0.1); // B5

      osc2.frequency.setValueAtTime(329.63, now);
      osc2.frequency.exponentialRampToValueAtTime(493.88, now + 0.1);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.15, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc1.connect(gain);
      osc2.connect(gain);

      osc1.start(now);
      osc2.start(now);

      osc1.stop(now + 0.31);
      osc2.stop(now + 0.31);
    }
  } catch (err) {
    // Ignore audio errors silently
  }
}
