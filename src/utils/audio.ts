// Web Audio API Hospital Announcement Chime & Speech Synthesizer

export function playHospitalChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const playTone = (freq: number, startTime: number, duration: number, gainValue: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

      gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
      gain.gain.linearRampToValueAtTime(gainValue, ctx.currentTime + startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };

    // Traditional Two-Tone / Three-Tone Hospital Chime (F5 -> A5 -> C6)
    playTone(698.46, 0.0, 0.6, 0.25);
    playTone(880.00, 0.25, 0.6, 0.25);
    playTone(1046.50, 0.5, 0.9, 0.3);
  } catch (e) {
    console.warn('Audio chime unavailable', e);
  }
}

export function speakTokenAnnouncement(tokenNumber: string, roomNumber: string) {
  playHospitalChime();

  if ('speechSynthesis' in window) {
    setTimeout(() => {
      try {
        const text = `Now calling token ${tokenNumber}. Please proceed to ${roomNumber}.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis error', err);
      }
    }, 700);
  }
}
