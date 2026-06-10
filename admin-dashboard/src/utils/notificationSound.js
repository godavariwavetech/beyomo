let _ctx = null;

const getCtx = () => {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  return _ctx;
};

const resume = async ctx => {
  if (ctx.state === 'suspended') await ctx.resume();
};

// Soft chime: major triad arpeggio (C5 → E5 → G5)
const playChime = async () => {
  const ctx = getCtx();
  await resume(ctx);
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  const stepMs = 140;

  notes.forEach((freq, i) => {
    const t = ctx.currentTime + (i * stepMs) / 1000;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    // Add a 2nd harmonic for warmth
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, t);
    gain2.gain.setValueAtTime(0.08, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    osc2.start(t);
    osc2.stop(t + 0.45);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    osc.start(t);
    osc.stop(t + 0.45);
  });
};

// Punchy alert: double-tap (G5 → B5)
const playAlert = async () => {
  const ctx = getCtx();
  await resume(ctx);
  const notes = [783.99, 987.77]; // G5, B5
  const stepMs = 160;

  notes.forEach((freq, i) => {
    const t = ctx.currentTime + (i * stepMs) / 1000;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.start(t);
    osc.stop(t + 0.3);
  });
};

// Soft low note for error
const playError = async () => {
  const ctx = getCtx();
  await resume(ctx);
  const t = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(349.23, t);     // F4
  osc.frequency.linearRampToValueAtTime(293.66, t + 0.25); // D4 — descending
  gain.gain.setValueAtTime(0.2, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  osc.start(t);
  osc.stop(t + 0.5);
};

export const playNotificationChime = type => {
  try {
    if (type === 'error')   { playError();  return; }
    if (type === 'warning') { playAlert();  return; }
    playChime();
  } catch (e) {
    // Web Audio blocked or unavailable — silent fail
  }
};
