/* PDF score reports, certificates and term report cards (html2canvas + jsPDF), and Excel class lists (SheetJS). */
(function () {
  const D = window.TCD;
  const YEAR = D.year;
  const VALUES = [['courage', 'Courage', 'The will to act rightly even when it is difficult.'], ['respect', 'Respect', "Honouring every person's dignity and contribution."], ['tolerance', 'Tolerance', 'Embracing difference and diversity with confidence.'], ['resilience', 'Resilience', 'Persisting through challenge and learning from setback.']];
  const CRIT = [['c1', 'Design Process and User Understanding', '25%'], ['c2', 'Technical Skills, Tool Choice and Safety', '25%'], ['c3', 'Prototype / Product Quality and Testing', '20%'], ['c4', 'Theory-to-Practice Connection', '15%'], ['c5', 'Communication, Collaboration and Reflection', '15%']];
  const e = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtDate = (iso) => { const d = iso ? new Date(iso) : new Date(); return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); };
  function level(p) { return p >= 85 ? 'Advanced' : p >= 70 ? 'Proficient' : p >= 50 ? 'Developing' : 'Emerging'; }
  function stars(n) { n = +n || 0; let s = ''; for (let i = 1; i <= 5; i++) s += `<span style="color:${i <= n ? '#F2A31B' : '#D5DDE0'};font-size:18px">&#9733;</span>`; return s; }

  const BASE = `font-family:'Source Sans 3',Arial,sans-serif;color:#1d2830;background:#fff;box-sizing:border-box;`;

  async function toPdf(html, w, h, filename, orientation) {
    const host = document.getElementById('render');
    host.innerHTML = `<div id="pg" style="${BASE}width:${w}px;min-height:${h}px;position:relative;overflow:hidden;display:flex;flex-direction:column">${html}</div>`;
    const pg = host.querySelector('#pg');
    await (document.fonts ? document.fonts.ready : Promise.resolve());
    await Promise.all([...pg.querySelectorAll('img')].map((im) => im.complete ? 0 : new Promise((r) => { im.onload = im.onerror = r; })));
    const canvas = await html2canvas(pg, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const pdf = new jspdf.jsPDF({ orientation, unit: 'pt', format: 'a4' });
    const pw = pdf.internal.pageSize.getWidth(), ph = pdf.internal.pageSize.getHeight();
    let pagePx = Math.round(canvas.width * ph / pw);
    if (canvas.height <= pagePx * 1.04) pagePx = canvas.height;
    for (let y = 0, n = 0; y < canvas.height - 4; y += pagePx, n++) {
      const c = document.createElement('canvas'); c.width = canvas.width; c.height = pagePx;
      const cx = c.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, c.width, c.height);
      cx.drawImage(canvas, 0, y, canvas.width, Math.min(pagePx, canvas.height - y), 0, 0, canvas.width, Math.min(pagePx, canvas.height - y));
      if (n) pdf.addPage();
      pdf.addImage(c.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pw, ph);
    }
    pdf.save(filename);
    host.innerHTML = '';
  }

  const header = (title, sub) => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:28px 48px 14px;border-bottom:3px solid #0E7C80">
      <img src="assets/img/tcd-logo-print.png" style="height:58px">
      <img src="assets/img/tcc-logo.png" style="height:50px">
    </div>
    <div style="padding:16px 48px 4px">
      <div style="font:700 11px Outfit,Arial;letter-spacing:.16em;color:#9E1B4B;text-transform:uppercase">${e(sub)}</div>
      <div style="font:700 30px Outfit,Arial;color:#0A5C5F;margin-top:4px">${e(title)}</div>
    </div>`;
  const footer = () => `<div style="margin:auto 48px 26px;border-top:1px solid #DDE6E8;padding-top:10px;display:flex;justify-content:space-between;font-size:11px;color:#6B7A84"><span>Emirates National Schools, Dubai | Technology and Career Centre (TCD)</span><span>${e(YEAR)}</span></div>`;
  const box = (k, v) => `<div style="border:1px solid #DDE6E8;border-radius:10px;padding:10px 14px"><div style="font:600 10px Outfit,Arial;letter-spacing:.08em;text-transform:uppercase;color:#6B7A84">${e(k)}</div><div style="font:600 16px Outfit,Arial;margin-top:2px">${e(v)}</div></div>`;
  const sigs = () => `<div style="display:flex;gap:60px;margin-top:8px">${['Ms. Lubna Kakkengal', 'Mr. Dilan Devendra'].map((n) => `<div style="flex:1"><div style="height:38px;border-bottom:1px solid #1d2830"></div><div style="font:600 14px Outfit,Arial;margin-top:6px">${n}</div><div style="font-size:12px;color:#6B7A84">TCD Instructor</div></div>`).join('')}</div>`;

  // ---------- Quiz score report ----------
  async function scoreReport(a) {
    const L = D.lessons[a.lessonId] || {}; const P = D.projects[a.projectId] || {};
    const pct = +a.percent || Math.round((a.correct / a.total) * 100);
    const hasB = VALUES.some(([k]) => a[k]);
    const html = `${header('Quiz Score Report', 'TCD Live Quiz | ' + (P.name || ''))}
      <div style="padding:10px 48px;display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:12px">
        ${box('Student name', a.firstName + ' ' + a.lastName)}${box('Student ID', a.studentId)}${box('Grade and section', 'Grade ' + a.grade + (a.section ? ' ' + a.section : ''))}
      </div>
      <div style="padding:6px 48px;display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:12px">
        ${box('Project', P.name || a.projectId)}${box('Lesson', 'Week ' + (L.week || a.week || '') + ': ' + (L.title || ''))}${box('Date', fmtDate(a.submittedAt))}
      </div>
      <div style="margin:18px 48px;border-radius:16px;background:#0E7C80;color:#fff;display:grid;grid-template-columns:1fr 1fr 1fr;text-align:center;padding:22px 10px">
        <div><div style="font:800 46px Outfit,Arial">${a.correct}/${a.total}</div><div style="font-size:13px;opacity:.85">Marks</div></div>
        <div style="border-left:1px solid rgba(255,255,255,.3);border-right:1px solid rgba(255,255,255,.3)"><div style="font:800 46px Outfit,Arial">${pct}%</div><div style="font-size:13px;opacity:.85">Score</div></div>
        <div><div style="font:800 30px Outfit,Arial;margin-top:8px;color:#FFD27A">${level(pct)}</div><div style="font-size:13px;opacity:.85;margin-top:4px">Level | ${a.points || 0} game points | Attempt ${a.attemptNo || 1}</div></div>
      </div>
      <div style="padding:4px 48px">
        <div style="font:700 17px Outfit,Arial;color:#0A5C5F;margin-bottom:8px">Behaviour points (ENS Student Values)</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <tr style="background:#E6F2F2"><th style="text-align:left;padding:6px 9px;border:1px solid #DDE6E8;width:24%">Value</th><th style="text-align:left;padding:6px 9px;border:1px solid #DDE6E8">What it means</th><th style="padding:6px 9px;border:1px solid #DDE6E8;width:28%">Points (1 to 5)</th></tr>
          ${VALUES.map(([k, n, d]) => `<tr><td style="padding:9px 10px;border:1px solid #DDE6E8;font-weight:600">${n}</td><td style="padding:9px 10px;border:1px solid #DDE6E8;color:#44535D">${d}</td><td style="padding:9px 10px;border:1px solid #DDE6E8;text-align:center">${a[k] ? stars(a[k]) + ` <b style="margin-left:6px">${a[k]}/5</b>` : '<span style="color:#9AA8AE">________</span>'}</td></tr>`).join('')}
        </table>
        <div style="margin-top:12px;border:1px solid #DDE6E8;border-radius:10px;padding:10px 14px;min-height:62px"><div style="font:600 10px Outfit,Arial;letter-spacing:.08em;text-transform:uppercase;color:#6B7A84">Instructor note</div><div style="font-size:14px;margin-top:4px">${e(a.behaviourNote || (hasB ? '' : 'To be completed by the instructor.'))}</div></div>
      </div>
      <div style="padding:22px 48px 0">${sigs()}</div>
      <div style="padding:16px 48px 14px;font-size:11px;color:#6B7A84">Levels: Advanced 85% and above | Proficient 70% to 84% | Developing 50% to 69% | Emerging below 50%. Levels follow the TCD Applied Design, Skills and Technologies Framework.</div>
      ${footer()}`;
    await toPdf(html, 794, 1123, `TCD_Score_Report_${a.firstName}_${a.lastName}_${(L.week ? 'Week' + L.week : a.lessonId)}.pdf`.replace(/\s+/g, '_'), 'portrait');
  }

  // ---------- Certificate ----------
  async function certificate(c) {
    const isTerm = c.projectId === 'TERM1';
    const P = D.projects[c.projectId] || {};
    const what = isTerm ? `Term 1 of the Technology and Career Centre programme` : `the <b>${e(P.name)}</b> project`;
    const skills = isTerm ? 'Safety, design thinking, digital fabrication, coding and presentation' : (P.outcomes || []).slice(0, 3).join('  |  ');
    const html = `
      <div style="position:absolute;inset:22px;border:3px solid #0E7C80;border-radius:6px"></div>
      <div style="position:absolute;inset:32px;border:1.5px solid #F2A31B;border-radius:4px"></div>
      <div style="position:absolute;left:-90px;top:-90px;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,#E6F2F2 0%,rgba(230,242,242,0) 70%)"></div>
      <div style="position:absolute;right:-110px;bottom:-110px;width:340px;height:340px;border-radius:50%;background:radial-gradient(circle,#FCEDF2 0%,rgba(252,237,242,0) 70%)"></div>
      <div style="position:absolute;inset:0;padding:58px 90px;text-align:center">
        <div style="display:flex;justify-content:space-between;align-items:center"><img src="assets/img/tcd-logo-print.png" style="height:62px"><img src="assets/img/tcc-logo.png" style="height:52px"></div>
        <div style="font:700 12px Outfit,Arial;letter-spacing:.32em;color:#9E1B4B;margin-top:20px">TECHNOLOGY AND CAREER CENTRE, DUBAI</div>
        <div style="font:700 50px 'Cormorant Garamond',Georgia,serif;color:#0A5C5F;margin-top:8px;line-height:1.05">${isTerm ? 'Certificate of Completion' : 'Certificate of Achievement'}</div>
        <div style="font-size:16px;color:#44535D;margin-top:26px">This certificate is proudly presented to</div>
        <div style="font:700 italic 58px 'Cormorant Garamond',Georgia,serif;color:#1d2830;margin-top:8px;line-height:1.15">${e(c.firstName)} ${e(c.lastName)}</div>
        <div style="width:420px;height:2px;background:linear-gradient(90deg,transparent,#F2A31B,transparent);margin:10px auto 20px"></div>
        <div style="font-size:17px;line-height:1.55;color:#1d2830;max-width:760px;margin:0 auto">for successfully completing ${what}<br>Grade ${e(c.grade)}${c.section ? ' ' + e(c.section) : ''} | Term 1 | Academic Year 2026-2027</div>
        <div style="font-size:13px;color:#6B7A84;margin-top:16px">${e(skills)}</div>
        <div style="position:absolute;left:90px;right:90px;bottom:62px;display:grid;grid-template-columns:1fr 150px 1fr;align-items:end;gap:30px">
          <div style="text-align:center"><div style="height:34px;border-bottom:1px solid #1d2830"></div><div style="font:600 15px Outfit,Arial;margin-top:6px">Ms. Lubna Kakkengal</div><div style="font-size:12px;color:#6B7A84">TCD Instructor</div></div>
          <div style="display:grid;place-items:center"><div style="width:118px;height:118px;border-radius:50%;background:#0E7C80;box-shadow:0 0 0 5px #fff,0 0 0 8px #F2A31B;display:grid;place-items:center;color:#fff;text-align:center"><div><div style="font:800 22px Outfit,Arial;letter-spacing:.06em">TCD</div><div style="font:600 10px Outfit,Arial;letter-spacing:.14em">DUBAI</div><div style="font:600 9px Outfit,Arial;margin-top:3px;color:#FFD27A">${isTerm ? 'TERM 1' : 'PROJECT'}</div></div></div></div>
          <div style="text-align:center"><div style="height:34px;border-bottom:1px solid #1d2830"></div><div style="font:600 15px Outfit,Arial;margin-top:6px">Mr. Dilan Devendra</div><div style="font-size:12px;color:#6B7A84">TCD Instructor</div></div>
        </div>
        <div style="position:absolute;left:0;right:0;bottom:40px;font-size:10.5px;color:#6B7A84">Certificate ID ${e(c.certId)} | Issued ${fmtDate(c.approvedAt)} | Emirates National Schools, Dubai</div>
      </div>`;
    await toPdf(`<div style="position:relative;width:1123px;height:794px">${html}</div>`, 1123, 794, `TCD_Certificate_${c.firstName}_${c.lastName}_${isTerm ? 'Term1' : (P.name || c.projectId)}.pdf`.replace(/[^\w.-]+/g, '_'), 'landscape');
  }

  // ---------- Term report card ----------
  async function reportCard(st, attempts, rubrics, certs, gradePlan) {
    const pids = [];
    gradePlan.plan.forEach((w) => { if (w.project && !pids.includes(w.project)) pids.push(w.project); });
    const rowsHtml = pids.map((pid) => {
      const P = D.projects[pid] || {};
      const weeks = gradePlan.plan.filter((w) => w.project === pid).map((w) => w.week);
      const quizLessons = gradePlan.plan.filter((w) => w.project === pid && w.lessonId).map((w) => w.lessonId);
      const mine = attempts.filter((a) => a.projectId === pid);
      const best = {}; mine.forEach((a) => { if (!best[a.lessonId] || +a.percent > +best[a.lessonId].percent) best[a.lessonId] = a; });
      const vals = Object.values(best);
      const avg = vals.length ? Math.round(vals.reduce((s, a) => s + +a.percent, 0) / vals.length) : null;
      const cert = certs.find((c) => c.projectId === pid);
      return `<tr><td style="padding:6px 9px;border:1px solid #DDE6E8;font-weight:600">${e(P.name || pid)}</td><td style="padding:6px 9px;border:1px solid #DDE6E8;text-align:center">${weeks[0]}${weeks.length > 1 ? ' to ' + weeks[weeks.length - 1] : ''}</td><td style="padding:6px 9px;border:1px solid #DDE6E8;text-align:center">${quizLessons.length ? vals.length + ' of ' + quizLessons.length : 'n/a'}</td><td style="padding:6px 9px;border:1px solid #DDE6E8;text-align:center">${avg == null ? '-' : avg + '%'}</td><td style="padding:6px 9px;border:1px solid #DDE6E8;text-align:center">${avg == null ? '-' : level(avg)}</td><td style="padding:6px 9px;border:1px solid #DDE6E8;text-align:center">${cert ? '&#10003;' : '-'}</td></tr>`;
    }).join('');
    const rb = rubrics.filter((r) => pids.includes(r.projectId) && (r.c1 || r.c2 || r.c3 || r.c4 || r.c5));
    const rubricHtml = rb.length ? `<div style="font:700 16px Outfit,Arial;color:#0A5C5F;margin:12px 0 6px">Framework rubric</div>
      <table style="width:100%;border-collapse:collapse;font-size:11.5px"><tr style="background:#E6F2F2"><th style="text-align:left;padding:7px 8px;border:1px solid #DDE6E8">Project</th>${CRIT.map(([, n, w]) => `<th style="padding:7px 6px;border:1px solid #DDE6E8">${n} (${w})</th>`).join('')}</tr>
      ${rb.map((r) => `<tr><td style="padding:7px 8px;border:1px solid #DDE6E8;font-weight:600">${e((D.projects[r.projectId] || {}).name || r.projectId)}</td>${CRIT.map(([k]) => `<td style="padding:7px 6px;border:1px solid #DDE6E8;text-align:center">${e(r[k] || '-')}</td>`).join('')}</tr>`).join('')}</table>` : '';
    const vavg = VALUES.map(([k, n]) => { const xs = attempts.map((a) => +a[k]).filter((x) => x > 0); return [n, xs.length ? Math.round((xs.reduce((s, x) => s + x, 0) / xs.length) * 10) / 10 : null]; });
    const comments = rubrics.filter((r) => r.comment).map((r) => r.comment);
    const all = attempts.length ? Math.round(attempts.reduce((s, a) => s + +a.percent, 0) / attempts.length) : null;
    const html = `${header('Term 1 Report Card', 'TCD | ' + YEAR)}
      <div style="padding:8px 48px;display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:10px">
        ${box('Student name', st.firstName + ' ' + st.lastName)}${box('Student ID', st.studentId)}${box('Grade and section', 'Grade ' + st.grade + (st.section ? ' ' + st.section : ''))}${box('Overall quiz average', all == null ? '-' : all + '% (' + level(all) + ')')}
      </div>
      <div style="padding:6px 48px">
        <div style="font:700 16px Outfit,Arial;color:#0A5C5F;margin:10px 0 6px">Project performance</div>
        <table style="width:100%;border-collapse:collapse;font-size:12.5px"><tr style="background:#E6F2F2"><th style="text-align:left;padding:6px 9px;border:1px solid #DDE6E8">Project</th><th style="padding:6px 9px;border:1px solid #DDE6E8">Weeks</th><th style="padding:6px 9px;border:1px solid #DDE6E8">Quizzes completed</th><th style="padding:6px 9px;border:1px solid #DDE6E8">Average</th><th style="padding:6px 9px;border:1px solid #DDE6E8">Level</th><th style="padding:6px 9px;border:1px solid #DDE6E8">Certificate</th></tr>${rowsHtml}</table>
        ${rubricHtml}
        <div style="font:700 16px Outfit,Arial;color:#0A5C5F;margin:12px 0 6px">Behaviour and ENS Student Values</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">${vavg.map(([n, v]) => `<div style="border:1px solid #DDE6E8;border-radius:10px;padding:10px;text-align:center"><div style="font:600 13px Outfit,Arial">${n}</div><div style="margin-top:4px">${v == null ? '<span style="color:#9AA8AE">Not yet recorded</span>' : stars(Math.round(v)) + `<div style="font-size:12px;color:#6B7A84">${v} / 5</div>`}</div></div>`).join('')}</div>
        <div style="font:700 16px Outfit,Arial;color:#0A5C5F;margin:12px 0 6px">Instructor comment</div>
        <div style="border:1px solid #DDE6E8;border-radius:10px;padding:12px 14px;min-height:60px;font-size:13px;line-height:1.5;text-align:justify">${e(comments.join(' ')) || '&nbsp;'}</div>
      </div>
      <div style="padding:14px 48px 0">${sigs()}</div>
      <div style="padding:10px 48px 14px;font-size:10.5px;color:#6B7A84">Levels: Advanced 85% and above | Proficient 70% to 84% | Developing 50% to 69% | Emerging below 50%. Rubric weights follow the TCD Applied Design, Skills and Technologies Framework.</div>
      ${footer()}`;
    await toPdf(html, 794, 1123, `TCD_Term1_Report_Card_${st.firstName}_${st.lastName}.pdf`.replace(/\s+/g, '_'), 'portrait');
  }

  // ---------- Excel class list ----------
  function classList(attempts, name) {
    const rows = attempts.map((a) => {
      const L = D.lessons[a.lessonId] || {};
      return { 'Student ID': a.studentId, 'First name': a.firstName, 'Last name': a.lastName, Grade: a.grade, Section: a.section, Project: (D.projects[a.projectId] || {}).name || a.projectId, Week: L.week || a.week, Lesson: L.title || a.lessonId, Marks: `${a.correct}/${a.total}`, 'Score (%)': +a.percent, Level: level(+a.percent), 'Game points': +a.points, Attempt: +a.attemptNo, Courage: a.courage || '', Respect: a.respect || '', Tolerance: a.tolerance || '', Resilience: a.resilience || '', 'Behaviour note': a.behaviourNote || '', Date: a.submittedAt ? new Date(a.submittedAt).toLocaleString('en-GB') : '' };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = Object.keys(rows[0] || { a: 1 }).map((k) => ({ wch: Math.max(10, k.length + 2) }));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Results');
    XLSX.writeFile(wb, name);
  }

  window.Docs = { scoreReport, certificate, reportCard, classList, level, VALUES, CRIT };
})();
