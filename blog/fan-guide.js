const modes = {
  cool: {
    label: 'Cool',
    color: '#abcfe7',
    speed: 0.30,
    spread: 0.19,
    rise: 0,
    streak: 0.15,
    air: 'Steady',
    ionState: 'Off',
    note: 'Cool mode sends a steady stream of air through the loop.',
  },
  sway: {
    label: 'Sway',
    color: '#9ed6da',
    speed: 0.29,
    spread: 0.23,
    rise: 0,
    streak: 0.17,
    air: 'Sweeping',
    ionState: 'Off',
    note: 'Sway sweeps the airflow from side to side for wider coverage.',
  },
  strong: {
    label: 'Strong',
    color: '#d2e7f7',
    speed: 0.65,
    spread: 0.31,
    rise: 0,
    streak: 0.24,
    air: 'Strong',
    ionState: 'Off',
    note: 'Strong mode sends a faster stream of air from the outlet.',
  },
  ion: {
    label: 'Ion',
    color: '#c1bce8',
    speed: 0.33,
    spread: 0.22,
    rise: 0,
    streak: 0.15,
    air: 'Steady',
    ionState: 'On',
    note: 'The plus and minus symbols illustrate the ions released with the airflow.',
  },
  warm: {
    label: 'Warm',
    color: '#e9b58d',
    speed: 0.23,
    spread: 0.22,
    rise: 0.12,
    streak: 0.13,
    air: 'Warm',
    ionState: 'Auto off',
    note: 'Warm wind mode sends out warm air and automatically switches off ion mode on models that support it.',
  },
};

function createAirflowIllustration(canvas) {
  const context = canvas?.getContext('2d');
  const fan = canvas?.parentElement.querySelector('.stage-fan');
  if (!context || !fan) return () => {};

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const laneCount = 7;
  let modeName = 'cool';
  let mode = modes.cool;
  let width = 0;
  let height = 0;
  let outletX = 0;
  let outletY = 0;
  let outletHeight = 0;
  let ink;
  let visible = true;
  let lastFrame = 0;
  let animationFrame = 0;
  let elapsed = 0.8;

  function setInk() {
    ink = context.createLinearGradient(outletX, 0, width, 0);
    ink.addColorStop(0, mode.color + 'cc');
    ink.addColorStop(0.34, mode.color);
    ink.addColorStop(0.73, mode.color + 'aa');
    ink.addColorStop(1, mode.color + '00');
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    const fanBounds = fan.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(width * pixelRatio));
    canvas.height = Math.max(1, Math.round(height * pixelRatio));
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    // Position the stream over the Q8 PRO's right-hand outlet slots.
    outletX = fanBounds.left - bounds.left + fanBounds.width * 0.92;
    outletY = fanBounds.top - bounds.top + fanBounds.height * 0.28;
    outletHeight = fanBounds.height * 0.26;
    setInk();
    draw();
  }

  function xAt(position) {
    return outletX + (width - outletX) * position;
  }

  function yAt(lane, position, sweep) {
    const wave = Math.sin(lane * 3 + position * 7 - elapsed * 1.1);
    return outletY + lane * outletHeight
      + lane * height * mode.spread * position
      + height * ((sweep * 0.2 - mode.rise) * position ** 1.5 + wave * 0.019 * position);
  }

  function trace(lane, start, end, sweep) {
    context.beginPath();
    context.moveTo(xAt(start), yAt(lane, start, sweep));
    const segments = Math.max(3, Math.ceil((end - start) * 16));
    for (let segment = 1; segment <= segments; segment++) {
      const position = start + (end - start) * segment / segments;
      context.lineTo(xAt(position), yAt(lane, position, sweep));
    }
    context.stroke();
  }

  function draw() {
    if (!ink) return;
    const sweep = modeName === 'sway' ? Math.sin(elapsed * 1.65) : 0;
    context.clearRect(0, 0, width, height);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = ink;

    for (let index = 0; index < laneCount; index++) {
      const lane = index / (laneCount - 1) - 0.5;
      const position = (elapsed * mode.speed + index * 0.37) % 1;
      const centerWeight = 1 - Math.abs(lane);
      context.globalAlpha = 0.09 * centerWeight;
      context.lineWidth = modeName === 'strong' ? 11 : 8;
      trace(lane, 0, 1, sweep);
      context.globalAlpha = 0.36 * centerWeight;
      context.lineWidth = 1;
      trace(lane, 0, 1, sweep);
      context.globalAlpha = 0.9 * centerWeight;
      context.lineWidth = modeName === 'strong' ? 2.2 : 1.45;
      trace(lane, Math.max(0, position - mode.streak), position, sweep);
    }

    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = '700 12px system-ui, sans-serif';
    const dotCount = modeName === 'ion' ? 20 : 9;
    for (let index = 0; index < dotCount; index++) {
      const lane = (index * 0.381966) % 1 - 0.5;
      const position = (elapsed * mode.speed * (0.72 + index % 4 * 0.13) + index * 0.618034) % 1;
      const x = xAt(position);
      const y = yAt(lane, position, sweep);
      context.globalAlpha = Math.sin(position * Math.PI) * 0.86;
      context.fillStyle = index % 4 ? mode.color : '#ffffff';
      if (modeName === 'ion' && index % 3 === 0) {
        context.fillText(index % 2 ? '+' : '−', x, y);
      } else {
        context.beginPath();
        context.arc(x, y, index % 4 ? 1.2 : 1.7, 0, Math.PI * 2);
        context.fill();
      }
    }
    context.globalAlpha = 1;
  }

  function tick(now) {
    elapsed += Math.min((now - lastFrame) / 1000, 0.05);
    lastFrame = now;
    draw();
    animationFrame = requestAnimationFrame(tick);
  }

  function syncAnimation() {
    cancelAnimationFrame(animationFrame);
    if (reducedMotion.matches || !visible || document.hidden) return;
    lastFrame = performance.now();
    animationFrame = requestAnimationFrame(tick);
  }

  resize();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncAnimation();
    }).observe(canvas);
  }
  reducedMotion.addEventListener('change', syncAnimation);
  document.addEventListener('visibilitychange', syncAnimation);
  syncAnimation();

  return (nextMode) => {
    modeName = nextMode;
    mode = modes[nextMode];
    elapsed = 0.8;
    setInk();
    draw();
  };
}

const canvas = document.getElementById('flow');
const stage = canvas?.parentElement;
const modeLabel = stage?.querySelector('.stage-mode');
const updateIllustration = createAirflowIllustration(canvas);
const buttons = document.querySelectorAll('.modes button[data-mode]');
const note = document.getElementById('mode-note');
const airflow = document.getElementById('chip-air');
const ion = document.getElementById('chip-ion');

function applyMode(name) {
  const mode = modes[name];
  buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.mode === name)));
  if (note) note.textContent = mode.note;
  if (airflow) airflow.textContent = `Airflow · ${mode.air}`;
  if (ion) {
    ion.textContent = `Ion · ${mode.ionState}`;
    ion.classList.toggle('on', name === 'ion');
  }
  if (modeLabel) modeLabel.textContent = `${mode.label} mode`;
  stage?.style.setProperty('--stage-accent', mode.color);
  updateIllustration(name);
}

buttons.forEach((button) => button.addEventListener('click', () => applyMode(button.dataset.mode)));
applyMode(canvas?.dataset.mode || 'cool');

const questions = document.querySelectorAll('.faq details');
document.getElementById('expand-all')?.addEventListener('click', () => {
  questions.forEach((question) => { question.open = true; });
});
document.getElementById('collapse-all')?.addEventListener('click', () => {
  questions.forEach((question) => { question.open = false; });
});
