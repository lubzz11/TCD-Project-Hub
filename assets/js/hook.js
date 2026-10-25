/* Animated hook "video": scenes with motion, progress bar, optional narration and fullscreen. */
window.HookPlayer = function (el, lesson, project) {
  const PICON = { 'candle-making': 'Fire', 'matatalab-pro': 'Robot', 'term1-showcase': 'Award', 'junior-designer': 'Cube', 'maker-mark': 'Stamp', 'photon-ai-mission': 'Microchip', 'photon-eco-mission': 'Leaf', 'junior-engineer': 'Cogs', 'junior-innovator': 'Lightbulb', 'safety-induction': 'HardHat', 'soap-making': 'Water' };
  const SICON = ['Lightbulb', 'Cogs', 'Bolt', 'Bullseye', 'Star', 'FlagCheckered'];
  const main = PICON[lesson.project] || 'Tools';
  const scenes = [{ kicker: project.name, title: lesson.title, text: `Grade ${lesson.grade} | Week ${lesson.week}`, icon: main }]
    .concat(lesson.hook.scenes.map((s, i) => ({ kicker: 'Scene ' + (i + 1), title: s.title, text: s.text, icon: i === lesson.hook.scenes.length - 1 ? 'FlagCheckered' : SICON[i % SICON.length] })))
    .concat([{ kicker: 'Think about it', title: lesson.hook.question, text: 'Talk to your partner for 30 seconds.', icon: 'QuestionCircle', q: true }]);
  const DUR = 6000;
  let i = 0, t0 = 0, elapsed = 0, playing = false, raf = 0, narrate = false;
  el.innerHTML = `<div class="hook" tabindex="0" aria-label="Hook video">
      <div class="stagewrap"></div>
      <div class="brandmark"><img src="assets/img/tcd-logo.png" alt=""></div>
      <div class="ctrls"><button data-a="play" aria-label="Play">${icon('Play')}</button><button data-a="restart" aria-label="Restart">${icon('Redo')}</button><button data-a="voice" aria-label="Narration">${icon('VolumeMute')}</button><button data-a="full" aria-label="Fullscreen">${icon('Expand')}</button></div>
      <div class="count"></div><div class="prog"><i></i></div>
      <div class="startover"><button class="btn gold lg" data-a="play">${icon('Play')} Play hook video</button></div>
    </div>`;
  const box = el.querySelector('.hook'), stage = el.querySelector('.stagewrap'), bar = el.querySelector('.prog i'), count = el.querySelector('.count'), cover = el.querySelector('.startover');
  const total = scenes.length * DUR;
  function render() {
    const s = scenes[i];
    stage.innerHTML = `<div class="scene in"><div class="art"><div class="disc">${icon(s.icon)}</div></div><div><div class="kicker">${esc(s.kicker)}</div><h2>${esc(s.title)}</h2><p>${esc(s.text)}</p></div></div>`;
    count.textContent = `${i + 1} / ${scenes.length}`;
    if (narrate && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance((s.q ? '' : s.title + '. ') + (s.q ? s.title : s.text));
      u.lang = 'en-GB'; u.rate = 0.95; speechSynthesis.speak(u);
    }
  }
  function tick(ts) {
    if (!playing) return;
    const e = elapsed + (ts - t0);
    const idx = Math.min(scenes.length - 1, Math.floor(e / DUR));
    if (idx !== i) { i = idx; render(); }
    bar.style.width = Math.min(100, (e / total) * 100) + '%';
    if (e >= total) { pause(); elapsed = total; cover.classList.remove('hidden'); cover.querySelector('button').innerHTML = icon('Redo') + ' Watch again'; return; }
    raf = requestAnimationFrame(tick);
  }
  function play() {
    if (elapsed >= total) { elapsed = 0; i = 0; render(); }
    cover.classList.add('hidden'); playing = true; t0 = performance.now(); raf = requestAnimationFrame(tick);
    box.querySelector('[data-a=play]').innerHTML = icon('Pause');
  }
  function pause() {
    if (playing) elapsed += performance.now() - t0;
    playing = false; cancelAnimationFrame(raf);
    box.querySelector('[data-a=play]').innerHTML = icon('Play');
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  }
  box.addEventListener('click', (e) => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const a = b.dataset.a;
    if (a === 'play') playing ? pause() : play();
    if (a === 'restart') { pause(); elapsed = 0; i = 0; render(); bar.style.width = '0'; play(); }
    if (a === 'voice') { narrate = !narrate; b.innerHTML = icon(narrate ? 'VolumeUp' : 'VolumeMute'); if (narrate && playing) render(); }
    if (a === 'full') { document.fullscreenElement ? document.exitFullscreen() : box.requestFullscreen && box.requestFullscreen(); }
  });
  box.addEventListener('keydown', (e) => { if (e.key === ' ') { e.preventDefault(); playing ? pause() : play(); } });
  render();
  return { destroy() { pause(); } };
};
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
