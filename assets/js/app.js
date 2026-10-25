/* TCD Project Hub: routing and views. */
(function () {
  const D = window.TCD;
  const app = document.getElementById('app');
  const nav = document.getElementById('nav');
  const h = (s) => esc(s);
  const store = { get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }, del(k) { try { localStorage.removeItem(k); } catch (e) { } } };
  const PCOL = { 'safety-induction': '#6B7A84', 'junior-innovator': '#3A6EA5', 'junior-engineer': '#3A6EA5', 'junior-designer': '#3A6EA5', 'candle-making': '#C2671B', 'matatalab-pro': '#2E8B57', 'photon-eco-mission': '#2E8B57', 'photon-ai-mission': '#2E8B57', 'maker-mark': '#9E1B4B', 'term1-showcase': '#D49A12', 'soap-making': '#C2671B', 'laser-metal-studio': '#9E1B4B' };
  const PICON = { 'candle-making': 'Fire', 'matatalab-pro': 'Robot', 'term1-showcase': 'Award', 'junior-designer': 'Cube', 'maker-mark': 'Stamp', 'photon-ai-mission': 'Microchip', 'photon-eco-mission': 'Leaf', 'junior-engineer': 'Cogs', 'junior-innovator': 'Lightbulb', 'safety-induction': 'HardHat', 'soap-making': 'Water', 'laser-metal-studio': 'Cut', 'classroom-helper': 'HandsHelping', 'simple-machine-playground': 'Cogs', 'mini-garden-eco-robot': 'Seedling', 'solar-mini-device': 'SolarPanel', 'gear-machine': 'Cogs', 'eco-robot-campaign': 'Leaf', 'robotics-first-coding': 'Robot', 'design-for-real-user': 'PencilRuler', 'smart-school-garden': 'Seedling', 'safety-passport-mini-maker': 'ShieldAlt', 'robot-mission-welcome': 'Robot', 'smart-city-crossing': 'City', 'load-bearing-bridge': 'Tools', 'upcycled-textile': 'Tshirt', 'mechanical-mobility': 'CarSide', 'media-production-studio': 'Film', 'sustainable-enterprise': 'Store', 'pathway-engineering': 'Cogs', 'pathway-creative': 'Palette', 'pathway-capstone': 'Award', 'future-dubai-smart-city': 'City' };
  const pcol = (id) => PCOL[id] || '#0E7C80';
  let auth = store.get('tcd_auth');
  if (auth && Date.now() - auth.at > 6 * 3600e3) { auth = null; store.del('tcd_auth'); }
  let current = null; // active component with destroy()

  if (API.DEMO) document.getElementById('demo').classList.remove('hidden');
  document.getElementById('menuBtn').onclick = () => nav.classList.toggle('open');

  function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2800); }
  const isInst = () => auth && auth.user.role === 'instructor';
  const isStaff = () => !!auth;

  // ---------- dates ----------
  const MON = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  function weekRange(w) { const m = /(\d+) (\w+) to (\d+) (\w+)/.exec(D.weeks[w]); if (!m) return null; const y = 2026; return [new Date(y, MON[m[2]], +m[1]), new Date(y, MON[m[4]], +m[3], 23, 59)]; }
  function currentWeek() { const n = new Date(); for (const w of Object.keys(D.weeks)) { const r = weekRange(w); if (r && n >= new Date(r[0].getTime() - 2 * 864e5) && n <= r[1]) return +w; } return null; }
  function nextTeachingWeek() { const n = new Date(); for (const w of Object.keys(D.weeks).map(Number).sort((a, b) => a - b)) { const r = weekRange(w); if (r && r[1] >= n && w !== 7 && w !== 15) return w; } return 14; }

  // ---------- nav ----------
  function drawNav(route) {
    const link = (href, label, ic, key) => `<a href="${href}" class="${route === key ? 'on' : ''}">${icon(ic)} ${label}</a>`;
    let s = '';
    if (isStaff()) {
      s += link('#/', 'Home', 'Home', 'home') + link('#/grade/4', 'Grade 4', 'LayerGroup', 'g4') + link('#/grade/5', 'Grade 5', 'LayerGroup', 'g5') + link('#/grade/6', 'Grade 6', 'LayerGroup', 'g6') + link('#/pool', 'Project Pool', 'Tools', 'pool') + link('#/instructors', 'Instructors', 'ChalkboardTeacher', 'inst');
      if (isInst()) s += link('#/results', 'Results', 'ChartBar', 'results');
      s += link('#/join', 'Join Quiz', 'Gamepad', 'join');
      s += `<span class="userchip">${icon(isInst() ? 'UserTie' : 'Eye')} ${h(auth.user.name)}</span><button class="linkish" id="logout">${icon('SignOutAlt')} Log out</button>`;
    } else {
      s += link('#/', 'Home', 'Home', 'home') + link('#/join', 'Join a Quiz', 'Gamepad', 'join') + link('#/me', 'My Results', 'UserGraduate', 'me') + link('#/instructors', 'Instructors', 'ChalkboardTeacher', 'inst') + link('#/login', 'Staff and Guest Login', 'SignInAlt', 'login');
    }
    nav.innerHTML = s; nav.classList.remove('open');
    const lo = document.getElementById('logout'); if (lo) lo.onclick = () => { auth = null; store.del('tcd_auth'); location.hash = '#/'; };
  }

  // ---------- router ----------
  function route() {
    if (current && current.destroy) current.destroy(); current = null;
    Quiz.clearTimers();
    const parts = (location.hash.replace(/^#\/?/, '') || '').split('/');
    const [p0, p1] = parts;
    const needStaff = ['grade', 'lesson', 'week', 'project', 'pool', 'results', 'host'];
    if (needStaff.includes(p0) && !isStaff()) { location.hash = '#/login'; return; }
    if ((p0 === 'results' || p0 === 'host') && !isInst()) { app.innerHTML = `<div class="err">This page is for instructors only.</div>`; drawNav(''); return; }
    window.scrollTo(0, 0);
    const map = {
      '': () => (isStaff() ? home() : landing()), login: login, grade: () => grade(p1), lesson: () => lesson(p1, parts[2]), week: () => week(p1, parts[2]),
      project: () => project(p1), pool: pool, instructors: instructors, join: () => { drawNav('join'); Quiz.join(app, p1); }, me: me, results: results, host: () => { drawNav(''); Quiz.host(app, p1, auth.token); },
    };
    (map[p0] || (() => { app.innerHTML = '<h1>Page not found</h1><p><a href="#/">Go home</a></p>'; }))();
  }
  window.addEventListener('hashchange', route);

  // ---------- landing (public) ----------
  function landing() {
    drawNav('home');
    app.innerHTML = `
      <section class="hero"><div class="dots"></div>
        <span class="eyebrow">Emirates National Schools | Dubai</span>
        <h1>Technology and Career Centre Project Hub</h1>
        <p>Hands-on projects, lessons and live quizzes for Grades 4, 5 and 6. Explore your creativity. Build your future.</p>
      </section>
      <div class="grid g3" style="margin-top:22px">
        <a class="card action-card g" href="#/join"><div class="big-ic">${icon('Gamepad')}</div><h3>Join a Quiz</h3><p class="muted">Students: enter the code on the board with your Student ID and name. No email needed.</p><span class="btn gold sm" style="align-self:flex-start">Join now ${icon('ArrowRight')}</span></a>
        <a class="card action-card m" href="#/me"><div class="big-ic">${icon('UserGraduate')}</div><h3>My Results</h3><p class="muted">Students: see your quiz scores and download your score reports and certificates.</p><span class="btn maroon sm" style="align-self:flex-start">View results ${icon('ArrowRight')}</span></a>
        <a class="card action-card" href="#/login"><div class="big-ic">${icon('ChalkboardTeacher')}</div><h3>Staff and Guest Login</h3><p class="muted">TCD instructors and guests: projects, term plans, lessons and resources.</p><span class="btn sm" style="align-self:flex-start">Log in ${icon('ArrowRight')}</span></a>
      </div>
      <div class="section-title"><h2>What is TCD?</h2></div>
      <div class="grid g2">
        <div class="card pad-l"><p class="justify">TCD is the applied-learning engine of ENS Dubai. It is not an extra activity: it is the curriculum made visible. Students design, make, test, troubleshoot, reflect and present, turning science, maths, literacy and digital skills into real products, systems and prototypes.</p><p class="justify" style="margin:0">Every unit begins with theory and ends with visible evidence of learning, following the TCD Applied Design, Skills and Technologies Framework.</p></div>
        <div class="card pad-l"><h3>Our six-stage learning model</h3><div class="grid g2" style="gap:10px;margin-top:10px">${['Context and Problem', 'Define and Plan', 'Ideate and Prototype', 'Test and Improve', 'Make and Share', 'Reflect and Transfer'].map((s, i) => `<div style="display:flex;gap:10px;align-items:center"><span class="chip ${i % 2 ? 'm' : ''}">${i + 1}</span><span>${s}</span></div>`).join('')}</div></div>
      </div>
      <div class="logos"><img src="assets/img/ens-logo.png" alt="Emirates National Schools"><img src="assets/img/tcc-logo.png" alt="Technology and Career Centers"><img src="assets/img/discover.png" alt="Discover your talents and develop your skills"></div>`;
  }

  // ---------- login ----------
  function login() {
    drawNav('login');
    let who = 'lubna';
    app.innerHTML = `<div style="max-width:560px;margin:0 auto"><div class="card pad-l">
      <h1>Staff and Guest Login</h1><p class="muted">Choose your account and enter your password.</p>
      <div id="err"></div>
      <div class="grid g3" id="who" style="margin-bottom:16px;gap:10px">
        ${[['lubna', 'Ms. Lubna', 'Instructor', 'UserTie'], ['dilan', 'Mr. Dilan', 'Instructor', 'UserTie'], ['guest', 'Guest', 'View only', 'Eye']].map(([k, n, r, ic]) => `<button type="button" class="card" data-k="${k}" style="cursor:pointer;text-align:center;padding:14px;border-width:2px;${k === who ? 'border-color:var(--teal)' : ''}"><div style="font-size:24px;color:var(--teal)">${icon(ic)}</div><b style="font-family:var(--head)">${n}</b><div class="small muted">${r}</div></button>`).join('')}
      </div>
      <form id="f"><div class="field"><label class="f" for="pw">Password</label><input class="i" type="password" id="pw" required autocomplete="current-password"></div>
      <button class="btn lg" style="width:100%" id="go">${icon('SignInAlt')} Log in</button></form>
      <p class="small muted" style="margin-top:14px">Students do not need to log in. Use <a href="#/join">Join a Quiz</a> or <a href="#/me">My Results</a>.</p></div></div>`;
    app.querySelectorAll('#who [data-k]').forEach((b) => (b.onclick = () => { who = b.dataset.k; app.querySelectorAll('#who [data-k]').forEach((x) => (x.style.borderColor = x === b ? 'var(--teal)' : '')); app.querySelector('#pw').focus(); }));
    app.querySelector('#f').onsubmit = async (e) => {
      e.preventDefault(); const go = app.querySelector('#go'); go.disabled = true;
      try { const r = await API.call('login', { user: who, password: app.querySelector('#pw').value }); auth = { token: r.token, user: r.user, at: Date.now() }; store.set('tcd_auth', auth); location.hash = '#/'; }
      catch (er) { app.querySelector('#err').innerHTML = `<div class="err">${h(er.message)}</div>`; go.disabled = false; }
    };
  }

  // ---------- home (staff) ----------
  function home() {
    drawNav('home');
    const cw = currentWeek(); const nw = nextTeachingWeek();
    const wk = cw && cw !== 7 && cw !== 15 ? cw : nw;
    const cards = ['4', '5', '6'].map((g) => {
      const e = D.grades[g].plan.find((x) => x.week === wk) || {};
      const P = D.projects[e.project] || {};
      const href = e.lessonId ? `#/lesson/${e.lessonId}` : `#/week/${g}/${wk}`;
      return `<a class="card" href="${href}"><div style="display:flex;justify-content:space-between;align-items:center"><span class="chip">Grade ${g}</span><span class="chip grey">${h(D.grades[g].session)}</span></div>
        <h3 style="margin-top:12px">${h(e.title || '')}</h3><p class="small" style="color:${pcol(e.project)};font-weight:600;margin-bottom:6px">${icon(PICON[e.project] || 'Tools')} ${h(P.name || '')}</p><p class="muted small" style="margin:0">${h(e.text || '')}</p></a>`;
    }).join('');
    const nLessons = Object.keys(D.lessons).length;
    app.innerHTML = `
      <section class="hero" style="padding:clamp(24px,4vw,40px)"><div class="dots"></div><span class="eyebrow">Welcome, ${h(auth.user.name)}</span>
        <h1 style="max-width:none">TCD Project Hub</h1><p>Term 1, ${D.year}. ${cw === 7 ? 'Mid-term break.' : ''} Showing <b>Week ${wk}</b> (${h(D.weeks[wk])}).</p>
        <div class="btns" style="margin-top:16px"><a class="btn gold" href="#/grade/4">Grade 4 plan</a><a class="btn alt" href="#/grade/5">Grade 5 plan</a><a class="btn alt" href="#/grade/6">Grade 6 plan</a></div></section>
      <div class="section-title"><h2>Week ${wk} at a glance</h2><span class="muted small">${h(D.notes[wk] || '')}</span></div>
      <div class="grid g3">${cards}</div>
      <div class="section-title"><h2>Quick links</h2></div>
      <div class="grid g4">
        <a class="card" href="#/pool"><div style="font-size:26px;color:var(--teal)">${icon('Tools')}</div><h3>TCD Project Pool</h3><p class="muted small">${Object.values(D.projects).filter((p) => p.pool !== 'none').length} projects from the TCD Framework and the TCD team.</p></a>
        ${isInst() ? `<a class="card" href="#/results"><div style="font-size:26px;color:var(--maroon)">${icon('ChartBar')}</div><h3>Results and Reports</h3><p class="muted small">Class lists, behaviour points, certificates and report cards.</p></a>` : ''}
        <a class="card" href="#/join"><div style="font-size:26px;color:var(--gold)">${icon('Gamepad')}</div><h3>Live Quiz</h3><p class="muted small">Start a quiz from any lesson page. Students join with a code.</p></a>
        <a class="card" href="#/instructors"><div style="font-size:26px;color:var(--teal)">${icon('ChalkboardTeacher')}</div><h3>Instructors</h3><p class="muted small">Ms. Lubna Kakkengal and Mr. Dilan Devendra.</p></a>
      </div>
      <p class="small muted" style="margin-top:22px">${nLessons} full lesson packs are ready (Weeks 9 to 14, Grades 4 to 6). Weeks 1 to 8 show the plan and the files already in use; their full packs are being added.</p>`;
  }

  // ---------- grade term plan ----------
  function grade(g) {
    drawNav('g' + g);
    const G = D.grades[g]; if (!G) { app.innerHTML = '<p>Grade not found.</p>'; return; }
    const cw = currentWeek();
    const projs = []; G.plan.forEach((w) => { if (w.project && !projs.includes(w.project)) projs.push(w.project); });
    const legend = projs.map((p) => `<a href="#/project/${p}" class="chip" style="background:${pcol(p)}1a;color:${pcol(p)}">${icon(PICON[p] || 'Tools')} ${h(D.projects[p].name)}</a>`).join('');
    const weeks = G.plan.map((w) => {
      if (w.break) return `<div class="wk brk"><div class="wnum"><b>${w.week}</b><span>${h(w.dates)}</span></div><div><h3>Mid-term break</h3><p>${h(D.notes[w.week] || '')}</p></div><div class="status"><span class="chip grey">No lessons</span></div></div>`;
      const href = w.lessonId ? `#/lesson/${w.lessonId}` : `#/week/${g}/${w.week}`;
      const st = w.lessonId ? `<span class="chip green">${icon('Check')} Full lesson pack</span>` : w.files.length ? `<span class="chip">${w.files.length} files</span>` : `<span class="chip grey">Plan</span>`;
      return `<a class="wk" href="${href}"><span class="dot" style="background:${pcol(w.project)}"></span><div class="wnum"><b>${w.week}</b><span>${h(w.dates)}</span></div>
        <div><div class="small" style="color:${pcol(w.project)};font-weight:700;font-family:var(--head)">${h(D.projects[w.project].name)}</div><h3>${h(w.title)}</h3><p>${h(w.text)}</p>${D.notes[w.week] ? `<p class="small muted" style="margin-top:4px">${h(D.notes[w.week])}</p>` : ''}</div>
        <div class="status">${cw === w.week ? '<span class="chip now-tag">This week</span>' : ''}${st}</div></a>`;
    }).join('');
    app.innerHTML = `<div class="crumbs"><a href="#/">Home</a> / Grade ${g}</div>
      <div class="lesson-head"><div><h1>Grade ${g}: Term 1 Plan</h1><p class="muted" style="margin:0">${h(G.course)} | Each session: ${h(G.session)}</p></div>
      <div class="btns"><a class="btn alt" href="#/pool">${icon('Tools')} Project Pool</a></div></div>
      <div class="card" style="margin-bottom:18px"><p class="justify" style="margin-bottom:10px">${h(G.summary)}</p><div class="legend">${legend}</div></div>
      <div class="seg" style="margin-bottom:14px"><button class="on">Term 1</button><button disabled title="Coming soon">Term 2</button><button disabled title="Coming soon">Term 3</button></div>
      <div class="timeline">${weeks}<div class="wk brk"><div class="wnum"><b>15</b><span>${h(D.weeks[15])}</span></div><div><h3>Term 1 assessments</h3><p>${h(D.notes[15])}</p></div><div class="status"><span class="chip grey">No lessons</span></div></div></div>`;
  }

  // ---------- week without a full pack ----------
  function week(g, w) {
    drawNav('g' + g);
    const e = (D.grades[g] || { plan: [] }).plan.find((x) => x.week == w);
    if (!e) { app.innerHTML = '<p>Week not found.</p>'; return; }
    const P = D.projects[e.project];
    app.innerHTML = `<div class="crumbs"><a href="#/grade/${g}">Grade ${g}</a> / Week ${w}</div>
      <div class="chip" style="background:${pcol(e.project)}1a;color:${pcol(e.project)}">${h(P.name)}</div>
      <h1 style="margin-top:10px">${h(e.title)}</h1><div class="meta"><span class="chip grey">${icon('CalendarAlt')} Week ${w} | ${h(e.dates)}</span><span class="chip grey">${icon('RegClock')} ${h(D.grades[g].session)}</span></div>
      <div class="grid g2" style="margin-top:20px"><div class="card pad-l"><h3>Plan</h3><p class="justify">${h(e.text)}</p><p class="small muted">This week was taught before the hub went live. Its full lesson pack (slides, lesson plan, planner, worksheet, hook video and quiz) is being added.</p><a class="btn alt sm" href="#/project/${e.project}">About this project</a></div>
      <div class="card pad-l"><h3>Files in use</h3>${e.files.length ? `<div class="downloads">${e.files.map((f) => dl(f.file, f.label)).join('')}</div>` : '<p class="muted">No files uploaded for this week yet.</p>'}</div></div>`;
  }

  function dl(file, label) {
    if (!file) return '';
    const ext = file.split('.').pop().toLowerCase();
    const cls = { docx: 'w', pptx: 'p', pdf: 'pdf', xlsx: 'x' }[ext] || 'w';
    const ic = { docx: 'FileWord', pptx: 'FilePowerpoint', pdf: 'FilePdf', xlsx: 'FileExcel' }[ext] || 'Download';
    return `<a class="dl" href="files/${encodeURIComponent(file)}" download><span class="fi ${cls}">${icon(ic)}</span><span><b>${h(label)}</b><span>${h(file)}</span></span></a>`;
  }

  // ---------- lesson ----------
  const TABS = [['overview', 'Overview', 'InfoCircle'], ['hook', 'Hook Video', 'Play'], ['slides', 'Slides', 'FilePowerpoint'], ['plan', 'Lesson Plan', 'FileWord'], ['planner', 'Weekly Planner', 'CalendarAlt'], ['study', 'Study Material', 'BookOpen'], ['warmup', 'Warm-up', 'Running'], ['worksheet', 'Worksheet', 'ClipboardList'], ['quiz', 'Quiz', 'Gamepad']];
  function lesson(id, tab) {
    const L = D.lessons[id]; if (!L) { app.innerHTML = '<p>Lesson not found.</p>'; return; }
    drawNav('g' + L.grade);
    const P = D.projects[L.project];
    tab = tab || 'overview';
    const grd = D.grades[L.grade];
    const projWeeks = grd.plan.filter((w) => w.project === L.project);
    app.innerHTML = `<div class="crumbs"><a href="#/grade/${L.grade}">Grade ${L.grade}</a> / <a href="#/project/${L.project}">${h(P.name)}</a> / Week ${L.week}</div>
      <div class="lesson-head"><div>
        <div class="chip" style="background:${pcol(L.project)}1a;color:${pcol(L.project)}">${icon(PICON[L.project] || 'Tools')} ${h(P.name)}</div>
        <h1 style="margin-top:10px">${h(L.title)}</h1>
        <div class="meta"><span class="chip grey">Grade ${L.grade}</span><span class="chip grey">${icon('CalendarAlt')} Week ${L.week} | ${h(L.dates)}</span><span class="chip grey">${icon('RegClock')} ${L.minutes} minutes</span><span class="chip grey">Session ${projWeeks.findIndex((w) => w.week === L.week) + 1} of ${projWeeks.length}</span></div>
      </div><div class="btns">${isInst() ? `<button class="btn gold" id="startQuiz">${icon('Gamepad')} Start live quiz</button>` : ''}<button class="btn alt" id="present">${icon('Expand')} Present slides</button></div></div>
      <div class="tabs" role="tablist">${TABS.map(([k, n, ic]) => `<button role="tab" data-t="${k}" class="${k === tab ? 'on' : ''}">${icon(ic)} ${n}</button>`).join('')}</div>
      <div id="tab"></div>`;
    app.querySelectorAll('.tabs button').forEach((b) => (b.onclick = () => { history.replaceState(null, '', `#/lesson/${id}/${b.dataset.t}`); app.querySelectorAll('.tabs button').forEach((x) => x.classList.toggle('on', x === b)); showTab(L, P, b.dataset.t); }));
    const sq = app.querySelector('#startQuiz'); if (sq) sq.onclick = () => startQuiz(L);
    app.querySelector('#present').onclick = () => { app.querySelector('[data-t=slides]').click(); setTimeout(() => { const v = app.querySelector('.viewer'); v && v.requestFullscreen && v.requestFullscreen(); }, 50); };
    showTab(L, P, tab);
  }

  function startQuiz(L) {
    const m = document.createElement('div'); m.className = 'modal';
    m.innerHTML = `<div class="box"><h2>Start a live quiz</h2><p class="muted">Week ${L.week}: ${h(L.title)} | ${L.quiz.length} questions</p>
      <div class="field"><label class="f">Class section (optional)</label><input class="i" id="sec" placeholder="For example ${L.grade}BA"></div>
      <div class="btns"><button class="btn alt" id="c">Cancel</button><button class="btn gold" id="ok">${icon('Play')} Create quiz code</button></div></div>`;
    document.body.appendChild(m);
    m.querySelector('#c').onclick = () => m.remove();
    m.querySelector('#ok').onclick = async () => {
      try { const r = await API.call('createSession', { token: auth.token, lessonId: L.id, projectId: L.project, grade: L.grade, section: m.querySelector('#sec').value }); m.remove(); location.hash = '#/host/' + r.session.code; }
      catch (e) { if (/log in/i.test(e.message)) { auth = null; store.del('tcd_auth'); m.remove(); location.hash = '#/login'; } else toast(e.message); }
    };
  }

  function showTab(L, P, t) {
    if (current && current.destroy) current.destroy(); current = null;
    const el = app.querySelector('#tab'); const F = L.files;
    const S = L.structure; const order = [['starter', 'Starter', '#0A5C5F'], ['ido', 'I Do', '#0E7C80'], ['wedo', 'We Do', '#3A6EA5'], ['youdo', 'You Do', '#9E1B4B'], ['closure', 'Closure', '#D49A12']];
    const views = {
      overview() {
        const tot = order.reduce((s, [k]) => s + S[k].minutes, 0);
        el.innerHTML = `<div class="grid" style="grid-template-columns:1.5fr 1fr;align-items:start" id="ovg">
          <div class="grid">
            <div class="card pad-l"><h3>Project plan for this session</h3><p class="justify">${h(L.description)}</p>
              <h3 style="margin-top:16px">Learning objective (WALT)</h3><p>${h(L.walt)}</p>
              <h3>Success criteria (WILF)</h3><ul class="ticks">${L.wilf.map((x) => `<li>${h(x)}</li>`).join('')}</ul></div>
            <div class="card pad-l"><h3>Timeline (${tot} minutes)</h3>
              <div class="struct">${order.map(([k, n, c]) => `<div style="flex:${S[k].minutes};background:${c}" title="${n}: ${S[k].minutes} min">${n} ${S[k].minutes}'</div>`).join('')}</div>
              ${order.map(([k, n, c]) => `<p style="margin-bottom:8px"><b style="color:${c}">${n} (${S[k].minutes} min):</b> ${h(S[k].text.join(' '))}</p>`).join('')}</div>
          </div>
          <div class="grid">
            <div class="card"><h3>Required materials</h3><ul class="clean">${L.resources.map((x) => `<li>${h(x)}</li>`).join('')}</ul></div>
            <div class="card"><h3>Downloads</h3><div class="downloads" style="grid-template-columns:1fr">${dl(F.pptx, 'Slides (PowerPoint)')}${dl(F.planDocx, 'Lesson Plan (Word)')}${dl(F.planPdf, 'Lesson Plan (PDF)')}${dl(F.plannerDocx, 'Weekly Planner (Word)')}${dl(F.plannerPdf, 'Weekly Planner (PDF)')}${dl(F.wsDocx, 'Worksheet (Word)')}${dl(F.wsPdf, 'Worksheet (PDF)')}</div></div>
            <div class="card"><h3>Project timeline</h3>${D.grades[L.grade].plan.filter((w) => w.project === L.project).map((w) => `<p style="margin-bottom:6px">${w.week === L.week ? '<b>' : ''}<a href="${w.lessonId ? '#/lesson/' + w.lessonId : '#/week/' + L.grade + '/' + w.week}">Week ${w.week}</a>: ${h(w.title)}${w.week === L.week ? '</b>' : ''}</p>`).join('')}</div>
          </div></div>`;
        if (window.innerWidth < 900) el.querySelector('#ovg').style.gridTemplateColumns = '1fr';
      },
      hook() {
        const key = 'yt:' + L.id;
        el.innerHTML = `<div id="hp"></div>
          <div class="grid g2" style="margin-top:18px">
            <div class="card"><h3>${icon('QuestionCircle')} Hook question</h3><p style="font-size:1.1rem">${h(L.hook.question)}</p><p class="small muted">Play the hook video on the board, then give pairs 30 seconds to discuss. Turn on narration with the speaker button.</p></div>
            <div class="card"><h3>${icon('Youtube')} Optional YouTube video</h3><div id="yt"><p class="muted small">Loading...</p></div>
              <p class="small" style="margin:10px 0 0"><a href="https://www.youtube.com/results?search_query=${encodeURIComponent(L.hook.video_search)}" target="_blank" rel="noopener">Search YouTube for "${h(L.hook.video_search)}"</a></p>
              <p class="small muted" style="margin:6px 0 0">Always watch a video in full and check it against school and UAE norms before showing it to students.</p></div>
          </div>`;
        current = HookPlayer(el.querySelector('#hp'), L, P);
        API.call('settings', {}).then((r) => {
          const url = r.settings[key] || ''; const yt = el.querySelector('#yt'); if (!yt) return;
          const idm = /(?:v=|youtu\.be\/|embed\/)([\w-]{11})/.exec(url);
          yt.innerHTML = (idm ? `<div style="aspect-ratio:16/9;border-radius:10px;overflow:hidden;margin-bottom:10px"><iframe src="https://www.youtube-nocookie.com/embed/${idm[1]}" style="width:100%;height:100%;border:0" allowfullscreen title="Hook video"></iframe></div>` : '<p class="muted small">No video chosen yet.</p>') +
            (isInst() ? `<div style="display:flex;gap:8px"><input class="i" id="ytu" placeholder="Paste a checked YouTube link" value="${h(url)}"><button class="btn sm" id="yts">Save</button></div>` : '');
          const b = yt.querySelector('#yts'); if (b) b.onclick = async () => { try { await API.call('setSetting', { token: auth.token, key, value: yt.querySelector('#ytu').value.trim() }); toast('Video saved'); showTab(L, P, 'hook'); } catch (e) { toast(e.message); } };
        }).catch(() => { const yt = el.querySelector('#yt'); if (yt) yt.innerHTML = '<p class="muted small">Could not load the saved video.</p>'; });
      },
      slides() {
        const n = L.slides; let i = 1;
        const src = (k) => `${L.slideDir}/s-${String(k).padStart(2, '0')}.jpg`;
        el.innerHTML = `<div class="viewer" tabindex="0"><div class="stage"><img id="si" src="${src(1)}" alt="Slide 1"></div>
          <div class="bar"><button class="btn alt sm" id="pv">${icon('ChevronLeft')}</button><span id="sn">1 / ${n}</span><button class="btn alt sm" id="nx">${icon('ChevronRight')}</button>
          <span style="flex:1"></span><button class="btn alt sm" id="fs">${icon('Expand')} Full screen</button>${F.pptx ? `<a class="btn gold sm" href="files/${F.pptx}" download>${icon('Download')} PowerPoint</a>` : ''}</div>
          <div class="thumbs">${Array.from({ length: n }, (_, k) => `<img src="${src(k + 1)}" data-k="${k + 1}" alt="Slide ${k + 1}" loading="lazy" class="${k === 0 ? 'on' : ''}">`).join('')}</div></div>
          <p class="small muted" style="margin-top:10px">Use the arrow keys to move between slides. Speaker notes are inside the PowerPoint file.</p>`;
        const v = el.querySelector('.viewer');
        const go = (k) => { i = Math.min(n, Math.max(1, k)); el.querySelector('#si').src = src(i); el.querySelector('#sn').textContent = `${i} / ${n}`; el.querySelectorAll('.thumbs img').forEach((t) => t.classList.toggle('on', +t.dataset.k === i)); };
        el.querySelector('#pv').onclick = () => go(i - 1); el.querySelector('#nx').onclick = () => go(i + 1);
        el.querySelector('#si').onclick = () => go(i + 1);
        el.querySelectorAll('.thumbs img').forEach((t) => (t.onclick = () => go(+t.dataset.k)));
        el.querySelector('#fs').onclick = () => (document.fullscreenElement ? document.exitFullscreen() : v.requestFullscreen && v.requestFullscreen());
        const key = (e) => { if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); go(i + 1); } if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(i - 1); };
        document.addEventListener('keydown', key); current = { destroy() { document.removeEventListener('keydown', key); } };
      },
      plan() {
        el.innerHTML = `<div class="btns" style="margin-bottom:14px">${F.planDocx ? `<a class="btn" href="files/${F.planDocx}" download>${icon('FileWord')} Download Word</a>` : ''}${F.planPdf ? `<a class="btn maroon" href="files/${F.planPdf}" download>${icon('FilePdf')} Download PDF</a>` : ''}</div>
        <div class="doc"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><img src="assets/img/ens-logo.png" style="height:34px" alt="ENS"><h2 style="margin:0">Lesson Plan</h2></div>
          <table><tr><td><b>Teacher Name:</b><br>Ms. Lubna Kakkengal and Mr. Dilan Devendra</td><td><b>Class/Section:</b><br>Grade ${L.grade}</td></tr><tr><td><b>Subject:</b><br>TCD: ${h(P.name)}</td><td><b>Date:</b> Week ${L.week} (${h(L.dates)})</td></tr><tr><td colspan="2"><b>Class Description:</b><br><span class="justify">${h(L.description)}</span></td></tr></table>
          <table class="groups"><tr><th colspan="4">Differentiated Learning Groups (Data)</th></tr><tr><td style="background:#00a2e8">Desert Fox</td><td style="background:#92d050">Camel</td><td style="background:#ffc000">Oryx</td><td style="background:#ff0000">Falcon</td></tr></table>
          <table><tr><th colspan="2">Lesson Overview</th></tr>
            ${[['Lesson Topic', L.title], ['Standard(s)', L.standards], ['Learning Objective (WALT)', L.walt], ['Success Criteria (WILF)', L.wilf.join(' | ')], ['Literacy Strategies', L.literacy], ['Assessment', L.assessment], ['Targeted Vocabulary', L.vocab.join(', ')], ['Skills', L.skills], ['National Identity Integration', L.national_identity], ['AI/Digital Learning', L.digital]].map(([k, v]) => `<tr><td class="k">${k}</td><td>${h(v)}</td></tr>`).join('')}</table>
          <table><tr><th colspan="2">Lesson Structure</th></tr>
            ${order.map(([k, n]) => `<tr><td class="k">${n}<br><span class="muted">(${S[k].minutes} minutes)</span></td><td>${S[k].text.map((x) => `<p>${h(x)}</p>`).join('')}</td></tr>`).join('')}
            <tr><td class="k">Differentiated Instruction</td><td><p><b>Beginning:</b> ${h(L.levels.beginning)}</p><p><b>On:</b> ${h(L.levels.on)}</p><p><b>Above:</b> ${h(L.levels.above)}</p></td></tr></table>
          <table><tr><th colspan="2">Inclusive Planning</th></tr><tr><td class="k">Notes</td><td>${h(L.inclusive_notes)}</td></tr><tr><td class="k">Inclusion / EAL Support</td><td>${h(L.inclusion.join(', '))}</td></tr><tr><td class="k">G&amp;T / Extension</td><td>${h(L.gt.join(', '))}</td></tr></table></div>`;
      },
      planner() {
        el.innerHTML = `<div class="btns" style="margin-bottom:14px">${F.plannerDocx ? `<a class="btn" href="files/${F.plannerDocx}" download>${icon('FileWord')} Download Word</a>` : ''}${F.plannerPdf ? `<a class="btn maroon" href="files/${F.plannerPdf}" download>${icon('FilePdf')} Download PDF</a>` : ''}</div>
          <div class="doc"><p><b>Grade: ${L.grade} | Term 1, Week ${L.week} (${h(L.dates)}) | TCD: ${h(D.grades[L.grade].course)} | Session length: ${L.minutes} minutes</b></p>
          <table>${[['T1 WEEK: ' + L.week, 'Lesson 1: ' + L.title], ['Standard(s)', L.standards], ['Literacy Strategies', L.literacy], ['Assessment', L.assessment], ['WALT (Learning Target)', L.walt], ['WILF (Success Criteria)', L.wilf.join(' | ')], ['Targeted Vocabulary', L.vocab.join(', ')], ['Resources', L.resources.join(', ')], ['National Identity Integration', L.national_identity], ['AI/Digital Learning', L.digital], ['I Do', S.ido.text.join(' ')], ['We Do', S.wedo.text.join(' ')], ['You Do', S.youdo.text.join(' ')], ['Differentiated Instruction', `Beginning: ${L.levels.beginning} On: ${L.levels.on} Above: ${L.levels.above}`], ['Closure/Reflection', S.closure.text.join(' ')], ['Inclusion / EAL Support', L.inclusion.join(', ')], ['G&T / Extension', L.gt.join(', ')]].map(([k, v], i) => `<tr><td class="k">${h(k)}</td><td>${i === 0 ? '<b>' + h(v) + '</b>' : h(v)}</td></tr>`).join('')}</table></div>`;
      },
      study() {
        el.innerHTML = `<div class="grid" style="grid-template-columns:1.5fr 1fr;align-items:start" id="sg"><div class="card pad-l"><h2>Study material</h2>${L.notes.map((p) => `<p class="justify" style="font-size:1.05rem">${h(p)}</p>`).join('')}
          ${L.teach.map((t) => `<h3 style="margin-top:16px">${h(t.title)}</h3><ul class="ticks">${t.points.map((x) => `<li>${h(x)}</li>`).join('')}</ul>`).join('')}</div>
          <div class="grid"><div class="card"><h3>Key words</h3><div class="btns">${L.vocab.map((v) => `<span class="chip">${h(v)}</span>`).join('')}</div></div>
          ${L.safety && L.safety.length ? `<div class="card" style="background:var(--maroon-l);border-color:#f2cad7"><h3 style="color:var(--maroon)">${icon('HardHat')} Safety rules</h3><ul class="clean">${L.safety.map((x) => `<li>${h(x)}</li>`).join('')}</ul></div>` : ''}
          <div class="card"><h3>Steps</h3><ol class="clean">${L.steps.items.map((x) => `<li>${h(x)}</li>`).join('')}</ol></div></div></div>`;
        if (window.innerWidth < 900) el.querySelector('#sg').style.gridTemplateColumns = '1fr';
      },
      warmup() {
        el.innerHTML = `<div class="card pad-l" style="max-width:820px"><div class="chip g">${icon('Running')} ${L.warmup.minutes} minutes</div><h2 style="margin-top:10px">${h(L.warmup.title)}</h2>
          <ol style="font-size:1.1rem;padding-left:1.2em">${L.warmup.steps.map((x) => `<li style="margin-bottom:10px">${h(x)}</li>`).join('')}</ol>
          <div style="display:flex;align-items:center;gap:16px;margin-top:10px"><div class="bigcode" id="tm" style="font-size:3rem;letter-spacing:.04em">${L.warmup.minutes}:00</div><button class="btn gold" id="ts">${icon('Play')} Start timer</button><button class="btn alt" id="tr">${icon('Redo')}</button></div></div>`;
        let left = L.warmup.minutes * 60, t = null;
        const show = () => (el.querySelector('#tm').textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`);
        el.querySelector('#ts').onclick = (e) => { if (t) { clearInterval(t); t = null; e.currentTarget.innerHTML = icon('Play') + ' Start timer'; return; } e.currentTarget.innerHTML = icon('Pause') + ' Pause'; t = setInterval(() => { left = Math.max(0, left - 1); show(); if (!left) { clearInterval(t); t = null; toast("Time's up!"); } }, 1000); };
        el.querySelector('#tr').onclick = () => { left = L.warmup.minutes * 60; show(); };
        current = { destroy() { clearInterval(t); } };
      },
      worksheet() {
        const W = L.worksheet;
        el.innerHTML = `<div class="btns" style="margin-bottom:14px">${F.wsDocx ? `<a class="btn" href="files/${F.wsDocx}" download>${icon('FileWord')} Download Word</a>` : ''}${F.wsPdf ? `<a class="btn maroon" href="files/${F.wsPdf}" download>${icon('FilePdf')} Download PDF (print)</a>` : ''}</div>
          <div class="doc" style="max-width:820px"><div class="small" style="color:var(--teal);font-weight:700;letter-spacing:.06em">${h(P.name.toUpperCase())}</div><h2 style="margin:4px 0 0">${h(W.title)}</h2><p style="color:var(--maroon)">${h(W.subtitle)}</p><p class="justify">${h(W.intro)}</p>
          ${W.parts.map((p) => `<h3 style="color:var(--teal);margin-top:16px">${h(p.heading)}</h3>${p.text ? `<p>${h(p.text)}</p>` : ''}${p.items ? `<ul class="clean">${p.items.map((x) => `<li>${h(x)}</li>`).join('')}</ul>` : ''}${p.cols ? `<table><tr>${p.cols.map((c) => `<th>${h(c)}</th>`).join('')}</tr>${p.rows.map((r) => `<tr>${r.map((c) => `<td>${h(c)}&nbsp;</td>`).join('')}</tr>`).join('')}</table>` : ''}${p.type === 'draw' ? '<div style="height:110px;border:1px dashed #9ab7b8;border-radius:8px"></div>' : ''}`).join('')}</div>`;
      },
      quiz() {
        el.innerHTML = `<div class="card pad-l" style="max-width:900px"><div class="section-title" style="margin-top:0"><h2>Live quiz: ${L.quiz.length} questions</h2>${isInst() ? `<button class="btn gold" id="sq2">${icon('Gamepad')} Start live quiz</button>` : ''}</div>
          <p class="muted">Students join with the quiz code, their Student ID and their first and last name. Each question has a ${L.grade == 4 ? 25 : 20}-second timer; faster correct answers score more game points. Marks are the number of correct answers.</p>
          <ol style="padding-left:1.2em">${L.quiz.map((q) => `<li style="margin-bottom:14px"><b>${h(q.q)}</b><div class="btns" style="margin-top:6px">${q.o.map((o, i) => `<span class="chip ${isInst() && i === q.a ? 'green' : 'grey'}">${isInst() && i === q.a ? icon('Check') + ' ' : ''}${h(o)}</span>`).join('')}</div>${isInst() ? `<div class="small muted" style="margin-top:4px">${h(q.e)}</div>` : ''}</li>`).join('')}</ol>
          ${!isInst() ? '<p class="small muted">Answers are visible to instructors only.</p>' : ''}</div>`;
        const b = el.querySelector('#sq2'); if (b) b.onclick = () => startQuiz(L);
      },
    };
    (views[t] || views.overview)();
  }

  // ---------- project ----------
  function project(id) {
    drawNav('pool');
    const P = D.projects[id]; if (!P) { app.innerHTML = '<p>Project not found.</p>'; return; }
    const uses = [];
    Object.entries(D.grades).forEach(([g, G]) => G.plan.forEach((w) => { if (w.project === id) uses.push(Object.assign({ grade: g }, w)); }));
    const full = P.pool === 'full';
    app.innerHTML = `<div class="crumbs"><a href="#/pool">Project Pool</a> / ${h(P.name)}</div>
      <div class="card pad-l" style="display:grid;grid-template-columns:auto 1fr;gap:22px;align-items:center;margin-bottom:18px"><div style="width:84px;height:84px;border-radius:22px;background:${pcol(id)};color:#fff;display:grid;place-items:center;font-size:40px">${icon(PICON[id] || 'Tools')}</div>
        <div><div class="meta" style="margin:0 0 6px"><span class="chip">${h(P.area)}</span><span class="chip grey">${/to/.test(P.grades) ? 'Grades' : 'Grade'} ${h(P.grades)}</span>${P.sessions ? `<span class="chip grey">${P.sessions} session${P.sessions > 1 ? 's' : ''} (2 periods each)</span>` : ''}<span class="chip ${P.source === 'framework' ? 'm' : 'g'}">${P.source === 'framework' ? 'TCD Framework' : 'TCD team project'}</span></div><h1 style="margin:0">${h(P.name)}</h1></div></div>
      <div class="grid g2" style="align-items:start">
        <div class="grid"><div class="card pad-l"><h3>About the project</h3><p class="justify">${h(P.summary)}</p>${P.outcomes ? `<h3>Learning outcomes</h3><ul class="ticks">${P.outcomes.map((x) => `<li>${h(x)}</li>`).join('')}</ul>` : ''}<p class="small muted" style="margin:10px 0 0">Framework link: ${h(P.framework || '')}</p></div>
          ${uses.length ? `<div class="card pad-l"><h3>Lessons and timeline</h3>${uses.map((w) => `<a class="wk" href="${w.lessonId ? '#/lesson/' + w.lessonId : '#/week/' + w.grade + '/' + w.week}" style="margin-bottom:10px"><span class="dot" style="background:${pcol(id)}"></span><div class="wnum"><b>${w.week}</b><span>Grade ${w.grade}</span></div><div><h3>${h(w.title)}</h3><p class="small">${h(w.dates)}</p></div><div class="status">${w.lessonId ? `<span class="chip green">${icon('Check')} Full pack</span>` : '<span class="chip grey">Plan</span>'}</div></a>`).join('')}</div>` : `<div class="card pad-l"><h3>Materials</h3><p class="muted">${full ? 'The full lesson pack for this pool project (slides, lesson plans, quizzes, hook videos and worksheets) is being prepared and will appear here.' : 'Grades 7 to 9 projects are listed for information and planning. Full materials are prepared for Grades 4 to 6.'}</p></div>`}</div>
        <div class="grid"><div class="card"><h3>Tools and materials</h3><ul class="clean">${(P.materials || []).map((x) => `<li>${h(x)}</li>`).join('')}</ul></div>
          <div class="card" style="background:var(--teal-ll)"><h3>Assessment (TCD Framework rubric)</h3><table class="t" style="font-size:.85rem"><tr><th>Criterion</th><th>Weight</th></tr>${Docs.CRIT.map(([, n, w]) => `<tr><td>${n}</td><td>${w}</td></tr>`).join('')}</table><p class="small muted" style="margin:8px 0 0">Levels: Emerging, Developing, Proficient, Advanced.</p></div></div>
      </div>`;
  }

  // ---------- pool ----------
  function pool() {
    drawNav('pool');
    let f = 'all', q = '';
    const list = Object.entries(D.projects).filter(([, p]) => p.pool !== 'none');
    app.innerHTML = `<div class="lesson-head"><div><h1>TCD Project Pool</h1><p class="muted" style="margin:0">Every project in the TCD Applied Design, Skills and Technologies Framework, plus the TCD team's own projects. Full materials for Grades 4 to 6; details for Grades 7 to 9.</p></div></div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:18px"><div class="seg" id="fl">${[['all', 'All'], ['full', 'Grades 4 to 6'], ['overview', 'Grades 7 to 9'], ['tcd', 'TCD team'], ['framework', 'Framework']].map(([k, n]) => `<button data-f="${k}" class="${k === f ? 'on' : ''}">${n}</button>`).join('')}</div>
      <input class="i" id="q" placeholder="Search projects" style="max-width:280px"></div><div class="grid g3" id="pl"></div>`;
    const draw = () => {
      const items = list.filter(([, p]) => (f === 'all' || p.pool === f || p.source === f) && (!q || (p.name + ' ' + p.summary + ' ' + p.area).toLowerCase().includes(q)));
      app.querySelector('#pl').innerHTML = items.map(([id, p]) => `<a class="card" href="#/project/${id}" style="display:flex;flex-direction:column;gap:8px"><div style="display:flex;gap:12px;align-items:center"><div style="width:46px;height:46px;border-radius:13px;background:${pcol(id)};color:#fff;display:grid;place-items:center;font-size:22px;flex:none">${icon(PICON[id] || 'Tools')}</div><div><h3 style="margin:0">${h(p.name)}</h3><span class="small muted">${h(p.area)}</span></div></div>
        <p class="small" style="margin:0;color:var(--ink-2)">${h(p.summary)}</p><div class="meta" style="margin-top:auto"><span class="chip grey">${/to/.test(p.grades) ? 'Grades' : 'Grade'} ${h(p.grades)}</span><span class="chip ${p.source === 'framework' ? 'm' : 'g'}">${p.source === 'framework' ? 'Framework' : 'TCD team'}</span>${p.pool === 'overview' ? '<span class="chip grey">Details only</span>' : ''}</div></a>`).join('') || '<p class="muted">No projects match.</p>';
    };
    app.querySelectorAll('#fl button').forEach((b) => (b.onclick = () => { f = b.dataset.f; app.querySelectorAll('#fl button').forEach((x) => x.classList.toggle('on', x === b)); draw(); }));
    app.querySelector('#q').oninput = (e) => { q = e.target.value.trim().toLowerCase(); draw(); };
    draw();
  }

  // ---------- instructors ----------
  function instructors() {
    drawNav('inst');
    app.innerHTML = `<h1>Our TCD Instructors</h1><p class="muted">Technology and Career Centre, Emirates National Schools, Dubai</p>
      <div class="grid" style="margin-top:18px">${D.instructors.map((p) => `<div class="card pad-l prof"><div class="ph">${p.photo ? `<img src="${p.photo}" alt="${h(p.name)}">` : icon('UserTie')}</div>
        <div><h2 style="margin-bottom:2px">${h(p.name)}</h2><p class="muted">${h(p.title)}${p.email ? ` | <a href="mailto:${h(p.email)}">${icon('Envelope')} ${h(p.email)}</a>` : ''}</p>${p.bio.map((b) => `<p class="justify">${h(b)}</p>`).join('')}</div></div>`).join('')}</div>`;
  }

  // ---------- student portal ----------
  function me() {
    drawNav('me');
    const s = store.get('tcd_student') || {};
    app.innerHTML = `<div style="max-width:560px;margin:0 auto" id="mw"><div class="card pad-l"><h1>My Results</h1><p class="muted">Enter your Student ID and your name exactly as you used them in the quiz.</p><div id="err"></div>
      <form id="f"><div class="field"><label class="f">Student ID</label><input class="i" id="sid" value="${h(s.studentId || '')}" required></div>
      <div class="row2"><div class="field"><label class="f">First name</label><input class="i" id="fn" value="${h(s.firstName || '')}" required></div><div class="field"><label class="f">Last name</label><input class="i" id="ln" value="${h(s.lastName || '')}" required></div></div>
      <button class="btn lg" style="width:100%">Show my results</button></form></div></div>`;
    app.querySelector('#f').onsubmit = async (e) => {
      e.preventDefault(); const v = (i) => app.querySelector('#' + i).value.trim();
      try {
        const r = await API.call('myResults', { student: { studentId: v('sid'), firstName: v('fn'), lastName: v('ln') } });
        const st = r.student;
        app.innerHTML = `<h1>${h(st.firstName)} ${h(st.lastName)}</h1><p class="muted">Student ID ${h(st.studentId)} | Grade ${h(st.grade)} ${h(st.section)}</p>
          <div class="section-title"><h2>${icon('Certificate')} My certificates</h2></div>
          ${r.certificates.length ? `<div class="grid g3">${r.certificates.map((c, i) => `<div class="card"><div class="chip g">${c.projectId === 'TERM1' ? 'Term 1 completion' : 'Project certificate'}</div><h3 style="margin-top:10px">${h(c.projectId === 'TERM1' ? 'Term 1, ' + D.year : (D.projects[c.projectId] || {}).name)}</h3><button class="btn sm" data-c="${i}">${icon('Download')} Download PDF</button></div>`).join('')}</div>` : '<p class="muted">No certificates yet. Your instructor approves certificates at the end of each project.</p>'}
          <div class="section-title"><h2>${icon('ChartBar')} My quiz results</h2></div>
          <div class="tbl-wrap"><table class="t"><tr><th>Project</th><th>Lesson</th><th>Marks</th><th>Score</th><th>Level</th><th>Date</th><th></th></tr>${r.attempts.map((a, i) => { const L = D.lessons[a.lessonId] || {}; return `<tr><td>${h((D.projects[a.projectId] || {}).name)}</td><td>Week ${h(L.week)}: ${h(L.title)}</td><td>${a.correct}/${a.total}</td><td>${a.percent}%</td><td>${Docs.level(+a.percent)}</td><td>${new Date(a.submittedAt).toLocaleDateString('en-GB')}</td><td><button class="btn alt sm" data-a="${i}">${icon('FilePdf')} Report</button></td></tr>`; }).join('') || '<tr><td colspan="7" class="muted">No quizzes yet.</td></tr>'}</table></div>
          <p style="margin-top:18px"><a href="#/me" onclick="location.reload()">Check another student</a></p>`;
        app.querySelectorAll('[data-c]').forEach((b) => (b.onclick = () => Docs.certificate(r.certificates[+b.dataset.c])));
        app.querySelectorAll('[data-a]').forEach((b) => (b.onclick = () => Docs.scoreReport(r.attempts[+b.dataset.a])));
      } catch (er) { app.querySelector('#err').innerHTML = `<div class="err">${h(er.message)}</div>`; }
    };
  }

  // ---------- results dashboard (instructors) ----------
  async function results() {
    drawNav('results');
    app.innerHTML = '<div class="loading">Loading results...</div>';
    let R;
    try { R = await API.call('results', { token: auth.token, filter: {} }); }
    catch (e) { if (/log in/i.test(e.message)) { auth = null; store.del('tcd_auth'); location.hash = '#/login'; return; } app.innerHTML = `<div class="err">${h(e.message)}</div>`; return; }
    const F = store.get('tcd_rf') || { grade: '', section: '', projectId: '', lessonId: '', q: '' };
    let tab = store.get('tcd_rt') || 'results';
    const sections = [...new Set(R.students.map((s) => s.section).concat(R.attempts.map((a) => a.section)).filter(Boolean))].sort();
    app.innerHTML = `<div class="lesson-head"><div><h1>Results and Reports</h1><p class="muted" style="margin:0">Quiz results, behaviour points, certificates and term report cards.${API.DEMO ? ' (Demo Mode)' : ''}</p></div><div class="btns"><button class="btn alt" id="rf">${icon('Sync')} Refresh</button></div></div>
      <div class="filters">
        <select class="i" id="fg"><option value="">All grades</option>${['4', '5', '6'].map((g) => `<option value="${g}">Grade ${g}</option>`).join('')}</select>
        <select class="i" id="fs"><option value="">All sections</option>${sections.map((s) => `<option>${h(s)}</option>`).join('')}</select>
        <select class="i" id="fp"></select><select class="i" id="fl"></select>
        <input class="i" id="fq" placeholder="Search name or ID">
      </div>
      <div class="tabs">${[['results', 'Quiz results', 'ChartBar'], ['certs', 'Certificates', 'Certificate'], ['cards', 'Term report cards', 'IdCard'], ['retakes', 'Second tries', 'Redo']].map(([k, n, ic]) => `<button data-t="${k}" class="${k === tab ? 'on' : ''}">${icon(ic)} ${n}</button>`).join('')}</div><div id="rv"></div>`;
    const $ = (s) => app.querySelector(s);
    function fillSelects() {
      const projs = []; Object.entries(D.grades).forEach(([g, G]) => { if (!F.grade || F.grade === g) G.plan.forEach((w) => { if (w.project && !projs.includes(w.project)) projs.push(w.project); }); });
      $('#fp').innerHTML = `<option value="">All projects</option>` + projs.map((p) => `<option value="${p}" ${F.projectId === p ? 'selected' : ''}>${h(D.projects[p].name)}</option>`).join('');
      const ls = Object.values(D.lessons).filter((l) => (!F.grade || l.grade == F.grade) && (!F.projectId || l.project === F.projectId));
      $('#fl').innerHTML = `<option value="">All lessons</option>` + ls.map((l) => `<option value="${l.id}" ${F.lessonId === l.id ? 'selected' : ''}>Grade ${l.grade} Week ${l.week}: ${h(l.title)}</option>`).join('');
      $('#fg').value = F.grade; $('#fs').value = F.section; $('#fq').value = F.q;
    }
    const filtered = () => R.attempts.filter((a) => (!F.grade || a.grade == F.grade) && (!F.section || a.section === F.section) && (!F.projectId || a.projectId === F.projectId) && (!F.lessonId || a.lessonId === F.lessonId) && (!F.q || (a.firstName + ' ' + a.lastName + ' ' + a.studentId).toLowerCase().includes(F.q.toLowerCase())))
      .sort((x, y) => String(y.submittedAt).localeCompare(String(x.submittedAt)));
    const students = () => R.students.filter((s) => (!F.grade || s.grade == F.grade) && (!F.section || s.section === F.section) && (!F.q || (s.firstName + ' ' + s.lastName + ' ' + s.studentId).toLowerCase().includes(F.q.toLowerCase()))).sort((a, b) => (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName));
    const save = () => { store.set('tcd_rf', F); };
    ['fg', 'fs', 'fp', 'fl'].forEach((k) => ($('#' + k).onchange = (e) => { const m = { fg: 'grade', fs: 'section', fp: 'projectId', fl: 'lessonId' }[k]; F[m] = e.target.value; if (k === 'fg') { F.projectId = ''; F.lessonId = ''; } if (k === 'fp') F.lessonId = ''; save(); fillSelects(); draw(); }));
    $('#fq').oninput = (e) => { F.q = e.target.value; save(); draw(); };
    $('#rf').onclick = () => results();
    app.querySelectorAll('.tabs button').forEach((b) => (b.onclick = () => { tab = b.dataset.t; store.set('tcd_rt', tab); app.querySelectorAll('.tabs button').forEach((x) => x.classList.toggle('on', x === b)); draw(); }));

    function draw() {
      const v = $('#rv');
      if (tab === 'results') {
        const list = filtered();
        const avg = list.length ? Math.round(list.reduce((s, a) => s + +a.percent, 0) / list.length) : 0;
        v.innerHTML = `<div class="grid g4" style="margin-bottom:16px"><div class="stat"><b>${list.length}</b><span>Quiz results</span></div><div class="stat"><b>${new Set(list.map((a) => a.studentId)).size}</b><span>Students</span></div><div class="stat"><b>${avg}%</b><span>Average score</span></div><div class="stat"><b>${list.filter((a) => !a.courage).length}</b><span>Waiting for behaviour points</span></div></div>
          <div class="btns" style="margin-bottom:12px"><button class="btn" id="xl" ${list.length ? '' : 'disabled'}>${icon('FileExcel')} Download Excel class list</button></div>
          <div class="tbl-wrap"><table class="t"><tr><th>Student</th><th>ID</th><th>Class</th><th>Lesson</th><th>Marks</th><th>Score</th><th>Points</th><th>Try</th><th>Behaviour (ENS values)</th><th>Date</th><th></th></tr>
          ${list.map((a, i) => { const L = D.lessons[a.lessonId] || {}; const bsum = Docs.VALUES.map(([k]) => +a[k] || 0); const has = bsum.some((x) => x); return `<tr><td><b>${h(a.firstName)} ${h(a.lastName)}</b></td><td>${h(a.studentId)}</td><td>${h(a.grade)} ${h(a.section)}</td><td>W${h(L.week)}: ${h(L.title)}</td><td>${a.correct}/${a.total}</td><td><span class="chip ${+a.percent >= 70 ? 'green' : +a.percent >= 50 ? 'g' : 'm'}">${a.percent}%</span></td><td>${a.points}</td><td>${a.attemptNo}</td><td>${has ? Docs.VALUES.map(([k, n]) => `<span class="small" title="${n}">${n[0]}${a[k] || '-'}</span>`).join(' ') : '<span class="muted small">Not added</span>'} <button class="btn alt sm" data-b="${i}">${icon(has ? 'Edit' : 'Plus')}</button></td><td class="small">${new Date(a.submittedAt).toLocaleDateString('en-GB')}</td><td style="white-space:nowrap"><button class="btn alt sm" data-p="${i}" title="Score report PDF">${icon('FilePdf')}</button> ${+a.attemptNo === 1 && !R.retakes.some((r) => r.studentId === a.studentId && r.lessonId === a.lessonId) ? `<button class="btn alt sm" data-r="${i}" title="Allow a second try">${icon('Redo')}</button>` : ''}</td></tr>`; }).join('') || '<tr><td colspan="11" class="muted">No results yet for these filters.</td></tr>'}</table></div>`;
        const xl = $('#xl'); if (xl) xl.onclick = () => Docs.classList(list, `TCD_Class_List_${F.grade ? 'Grade' + F.grade : 'All'}${F.section ? '_' + F.section : ''}_${new Date().toISOString().slice(0, 10)}.xlsx`);
        v.querySelectorAll('[data-p]').forEach((b) => (b.onclick = () => Docs.scoreReport(list[+b.dataset.p])));
        v.querySelectorAll('[data-b]').forEach((b) => (b.onclick = () => behaviourModal(list[+b.dataset.b])));
        v.querySelectorAll('[data-r]').forEach((b) => (b.onclick = async () => { const a = list[+b.dataset.r]; if (!confirm(`Allow ${a.firstName} ${a.lastName} a second try at this quiz?`)) return; await API.call('approveRetake', { token: auth.token, studentId: a.studentId, lessonId: a.lessonId }); toast('Second try approved'); results(); }));
      }
      if (tab === 'certs') {
        if (!F.grade) { v.innerHTML = '<div class="card"><p class="muted" style="margin:0">Choose a grade (and a section if you like) to manage certificates.</p></div>'; return; }
        const G = D.grades[F.grade]; const projs = []; G.plan.forEach((w) => { if (w.project && w.project !== 'term1-showcase' && !projs.includes(w.project)) projs.push(w.project); });
        const sts = students();
        const cell = (s, pid) => {
          const c = R.certificates.find((x) => x.studentId === s.studentId && x.projectId === pid);
          const ql = pid === 'TERM1' ? ['g' + F.grade + '-w14'] : G.plan.filter((w) => w.project === pid && w.lessonId).map((w) => w.lessonId);
          const done = ql.filter((l) => R.attempts.some((a) => a.studentId === s.studentId && a.lessonId === l)).length;
          const label = ql.length ? `${done}/${ql.length} quizzes` : 'Attendance';
          if (c) return `<td><span class="chip green">${icon('Check')} Approved</span><br><button class="btn alt sm" data-dc="${c.certId}" style="margin-top:4px">${icon('Download')}</button> <button class="btn alt sm" data-rc="${c.certId}" title="Withdraw">${icon('Times')}</button></td>`;
          return `<td><span class="small ${ql.length && done === ql.length ? '' : 'muted'}">${label}</span><br><button class="btn ${ql.length && done === ql.length ? '' : 'alt'} sm" data-ap="${s.studentId}|${pid}" style="margin-top:4px">Approve</button></td>`;
        };
        v.innerHTML = `<p class="muted small">A certificate becomes available to the student once you approve it. Green Approve buttons mean the student completed every quiz in that project on the website. You can still approve based on attendance.</p>
          <div class="tbl-wrap"><table class="t"><tr><th>Student</th>${projs.map((p) => `<th>${h(D.projects[p].name)}</th>`).join('')}<th>Term 1 completion</th></tr>
          ${sts.map((s) => `<tr><td style="min-width:150px"><b>${h(s.firstName)} ${h(s.lastName)}</b><br><span class="small muted">${h(s.studentId)} | ${h(s.section)}</span></td>${projs.map((p) => cell(s, p)).join('')}${cell(s, 'TERM1')}</tr>`).join('') || `<tr><td colspan="${projs.length + 2}" class="muted">No students registered for this grade yet. Students register when they first join a quiz.</td></tr>`}</table></div>`;
        v.querySelectorAll('[data-ap]').forEach((b) => (b.onclick = async () => { const [sid, pid] = b.dataset.ap.split('|'); b.disabled = true; try { await API.call('approveCertificate', { token: auth.token, studentId: sid, projectId: pid }); toast('Certificate approved'); results(); } catch (e) { toast(e.message); b.disabled = false; } }));
        v.querySelectorAll('[data-dc]').forEach((b) => (b.onclick = () => Docs.certificate(R.certificates.find((c) => c.certId === b.dataset.dc))));
        v.querySelectorAll('[data-rc]').forEach((b) => (b.onclick = async () => { if (!confirm('Withdraw this certificate?')) return; await API.call('revokeCertificate', { token: auth.token, certId: b.dataset.rc }); results(); }));
      }
      if (tab === 'cards') {
        if (!F.grade) { v.innerHTML = '<div class="card"><p class="muted" style="margin:0">Choose a grade to prepare Term 1 report cards.</p></div>'; return; }
        const sts = students();
        v.innerHTML = `<p class="muted small">Each report card shows project averages, quizzes completed, ENS value behaviour points, certificates, the optional framework rubric and your comment. Add rubric levels and a comment first, then download.</p>
          <div class="tbl-wrap"><table class="t"><tr><th>Student</th><th>Quizzes</th><th>Average</th><th>Rubric and comment</th><th></th></tr>${sts.map((s, i) => { const at = R.attempts.filter((a) => a.studentId === s.studentId); const avg = at.length ? Math.round(at.reduce((x, a) => x + +a.percent, 0) / at.length) + '%' : '-'; const rb = R.rubrics.filter((r) => r.studentId === s.studentId); return `<tr><td><b>${h(s.firstName)} ${h(s.lastName)}</b><br><span class="small muted">${h(s.studentId)} | ${h(s.section)}</span></td><td>${at.length}</td><td>${avg}</td><td>${rb.length ? `<span class="chip green">${rb.length} saved</span>` : '<span class="muted small">None yet</span>'} <button class="btn alt sm" data-rb="${i}">${icon('Edit')} Edit</button></td><td><button class="btn sm" data-rc="${i}">${icon('FilePdf')} Report card</button></td></tr>`; }).join('') || '<tr><td colspan="5" class="muted">No students registered for this grade yet.</td></tr>'}</table></div>`;
        v.querySelectorAll('[data-rb]').forEach((b) => (b.onclick = () => rubricModal(sts[+b.dataset.rb])));
        v.querySelectorAll('[data-rc]').forEach((b) => (b.onclick = () => { const s = sts[+b.dataset.rc]; Docs.reportCard(s, R.attempts.filter((a) => a.studentId === s.studentId), R.rubrics.filter((r) => r.studentId === s.studentId), R.certificates.filter((c) => c.studentId === s.studentId), D.grades[s.grade || F.grade]); }));
      }
      if (tab === 'retakes') {
        v.innerHTML = `<p class="muted small">Approve a second try from the Quiz results tab (the ${icon('Redo')} button). Each student can play a quiz at most twice.</p><div class="tbl-wrap"><table class="t"><tr><th>Student ID</th><th>Lesson</th><th>Approved by</th><th>Approved</th><th>Used</th></tr>${R.retakes.slice().reverse().map((r) => { const L = D.lessons[r.lessonId] || {}; return `<tr><td>${h(r.studentId)}</td><td>Grade ${h(L.grade)} Week ${h(L.week)}: ${h(L.title)}</td><td>${h(r.approvedBy)}</td><td>${new Date(r.approvedAt).toLocaleString('en-GB')}</td><td>${r.used ? 'Yes' : 'Not yet'}</td></tr>`; }).join('') || '<tr><td colspan="5" class="muted">No second tries approved.</td></tr>'}</table></div>`;
      }
    }

    function behaviourModal(a) {
      const m = document.createElement('div'); m.className = 'modal';
      const val = {}; Docs.VALUES.forEach(([k]) => (val[k] = +a[k] || 0));
      m.innerHTML = `<div class="box"><h2>Behaviour points</h2><p class="muted">${h(a.firstName)} ${h(a.lastName)} | Week ${h((D.lessons[a.lessonId] || {}).week)}: ${h((D.lessons[a.lessonId] || {}).title)}</p>
        ${Docs.VALUES.map(([k, n, d]) => `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--line)"><div><b>${n}</b><div class="small muted">${d}</div></div><div class="stars" data-k="${k}">${[1, 2, 3, 4, 5].map((i) => `<button type="button" data-v="${i}" class="${i <= val[k] ? 'on' : ''}" aria-label="${n} ${i}">${icon('Star')}</button>`).join('')}</div></div>`).join('')}
        <div class="field" style="margin-top:12px"><label class="f">Note (optional)</label><textarea class="i" id="nt" rows="2">${h(a.behaviourNote || '')}</textarea></div>
        <div class="btns"><button class="btn alt" id="c">Cancel</button><button class="btn" id="ok">Save</button></div></div>`;
      document.body.appendChild(m);
      m.querySelectorAll('.stars').forEach((sg) => sg.querySelectorAll('button').forEach((b) => (b.onclick = () => { val[sg.dataset.k] = +b.dataset.v; sg.querySelectorAll('button').forEach((x) => x.classList.toggle('on', +x.dataset.v <= val[sg.dataset.k])); })));
      m.querySelector('#c').onclick = () => m.remove();
      m.querySelector('#ok').onclick = async () => { try { await API.call('behaviour', { token: auth.token, attemptId: a.attemptId, behaviour: Object.assign({ note: m.querySelector('#nt').value }, val) }); m.remove(); toast('Behaviour points saved'); results(); } catch (e) { toast(e.message); } };
    }

    function rubricModal(s) {
      const G = D.grades[s.grade || F.grade]; const projs = []; G.plan.forEach((w) => { if (w.project && w.project !== 'term1-showcase' && !projs.includes(w.project)) projs.push(w.project); });
      const LV = ['', 'Emerging', 'Developing', 'Proficient', 'Advanced'];
      const get = (pid) => R.rubrics.find((r) => r.studentId === s.studentId && r.projectId === pid) || {};
      const m = document.createElement('div'); m.className = 'modal';
      m.innerHTML = `<div class="box" style="max-width:860px"><h2>Rubric and comment</h2><p class="muted">${h(s.firstName)} ${h(s.lastName)} | Grade ${h(s.grade)} ${h(s.section)}. The rubric is optional.</p>
        <div class="tbl-wrap"><table class="t"><tr><th>Project</th>${Docs.CRIT.map(([, n, w]) => `<th title="${n}">${n.split(' ')[0]} (${w})</th>`).join('')}</tr>${projs.map((p) => `<tr><td><b>${h(D.projects[p].name)}</b></td>${Docs.CRIT.map(([k]) => `<td><select class="i" style="padding:6px" data-p="${p}" data-c="${k}">${LV.map((l) => `<option ${get(p)[k] === l ? 'selected' : ''} value="${l}">${l || '-'}</option>`).join('')}</select></td>`).join('')}</tr>`).join('')}</table></div>
        <div class="field" style="margin-top:14px"><label class="f">Instructor comment for the Term 1 report card</label><textarea class="i" id="cm" rows="4">${h(get('TERM1').comment || '')}</textarea></div>
        <div class="btns"><button class="btn alt" id="c">Cancel</button><button class="btn" id="ok">Save</button></div></div>`;
      document.body.appendChild(m);
      m.querySelector('#c').onclick = () => m.remove();
      m.querySelector('#ok').onclick = async () => {
        const btn = m.querySelector('#ok'); btn.disabled = true;
        try {
          for (const p of projs) { const r = {}; m.querySelectorAll(`select[data-p="${p}"]`).forEach((x) => (r[x.dataset.c] = x.value)); if (Object.values(r).some(Boolean) || get(p).c1 !== undefined) await API.call('rubric', { token: auth.token, studentId: s.studentId, projectId: p, term: 1, rubric: r }); }
          await API.call('rubric', { token: auth.token, studentId: s.studentId, projectId: 'TERM1', term: 1, rubric: { comment: m.querySelector('#cm').value } });
          m.remove(); toast('Saved'); results();
        } catch (e) { toast(e.message); btn.disabled = false; }
      };
    }
    fillSelects(); draw();
  }

  route();
})();
