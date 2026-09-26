// DigiNerve canvas creative kit (dev-only). Load in the ads-app page:
//   await (0,eval)(await (await fetch('/local-assets/tools/creative-kit.js')).text()); await KIT_INIT();
(function () {
  const W = 1024, HT = 1280;
  const ld = async (p) => createImageBitmap(await (await fetch(p)).blob());
  window.A = window.A || {};
  window.KIT_INIT = async function () {
    if (!document.getElementById('gf')) {
      const l = document.createElement('link'); l.id = 'gf'; l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800;900&family=Archivo+Black&display=swap';
      document.head.appendChild(l); await new Promise((r) => (l.onload = r));
    }
    await Promise.all(['900 100px Poppins', '800 100px Poppins', '700 40px Poppins', '600 30px Poppins', '500 30px Poppins', '100px "Archivo Black"'].map((f) => document.fonts.load(f)));
    A.richa = await ld('/local-assets/exports/mrcog-richa-crop.png');
    // original colour logo, white removed, cropped
    const im = await ld('/local-assets/src/diginerve-logo.png');
    const c = new OffscreenCanvas(im.width, im.height), x = c.getContext('2d'); x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, im.width, im.height); let minx = 1e9, miny = 1e9, maxx = 0, maxy = 0;
    for (let y = 0; y < im.height; y++) for (let X = 0; X < im.width; X++) {
      const i = (y * im.width + X) * 4; const mn = Math.min(d.data[i], d.data[i + 1], d.data[i + 2]);
      const a = Math.round(d.data[i + 3] * Math.max(0, Math.min(1, (250 - mn) * 3.2 / 255))); d.data[i + 3] = a;
      if (a > 40) { minx = Math.min(minx, X); maxx = Math.max(maxx, X); miny = Math.min(miny, y); maxy = Math.max(maxy, y); }
    }
    x.putImageData(d, 0, 0); const w = maxx - minx + 1, h = maxy - miny + 1; const o = new OffscreenCanvas(w, h);
    o.getContext('2d').drawImage(c, minx, miny, w, h, 0, 0, w, h); A.logoC = o;
    return 'kit ready';
  };
  const K = {
    rr(x, X, Y, w, h, r) { x.beginPath(); x.roundRect(X, Y, w, h, r); },
    t(x, s, X, Y, font, col, align = 'left', ls = 0) { x.font = font; x.fillStyle = col; x.textAlign = align; x.textBaseline = 'alphabetic'; x.letterSpacing = (ls || 0) + 'px'; x.fillText(s, X, Y); x.letterSpacing = '0px'; },
    bgL(x, W = 1024, HT = 1280) {
      const g = x.createLinearGradient(0, 0, W, HT); g.addColorStop(0, '#FFFFFF'); g.addColorStop(.5, '#F3F7FD'); g.addColorStop(1, '#E6EEFA'); x.fillStyle = g; x.fillRect(0, 0, W, HT);
      let rg = x.createRadialGradient(W * .92, HT * .08, 10, W * .92, HT * .08, 480); rg.addColorStop(0, 'rgba(45,70,185,.12)'); rg.addColorStop(1, 'rgba(45,70,185,0)'); x.fillStyle = rg; x.fillRect(0, 0, W, HT);
      rg = x.createRadialGradient(W * .05, HT * .95, 10, W * .05, HT * .95, 520); rg.addColorStop(0, 'rgba(245,179,53,.16)'); rg.addColorStop(1, 'rgba(245,179,53,0)'); x.fillStyle = rg; x.fillRect(0, 0, W, HT);
      x.save(); x.lineCap = 'round';
      [[0, 'rgba(45,70,185,.10)', 46], [1, 'rgba(245,179,53,.22)', 10]].forEach(([k, col, lw]) => { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); x.moveTo(W * .58, -20 + k * 40); x.bezierCurveTo(W * .8, HT * .05 + k * 30, W * .95, HT * .12, W + 40, HT * .26 + k * 30); x.stroke(); });
      [[0, 'rgba(245,179,53,.25)', 8], [1, 'rgba(45,70,185,.08)', 40]].forEach(([k, col, lw]) => { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); x.moveTo(-40, HT * .78 + k * 30); x.bezierCurveTo(W * .15, HT * .86, W * .3, HT * .95, W * .42, HT + 40); x.stroke(); });
      x.restore();
      x.fillStyle = 'rgba(45,70,185,.18)'; for (let r = 0; r < 4; r++) for (let q = 0; q < 6; q++) { x.beginPath(); x.arc(W - 60 - q * 22, 40 + r * 22, 2.6, 0, 7); x.fill(); }
    },
    logoL(x, X = 52, Y = 44, w = 250) { const L = A.logoC; const h = w * L.height / L.width; x.drawImage(L, X, Y, w, h); },
    pillL(x, label, X = 52, Y = 176) { x.font = '700 22px Poppins'; x.letterSpacing = '1.5px'; const tw = x.measureText(label).width; x.letterSpacing = '0px'; K.rr(x, X, Y, tw + 56, 50, 25); x.fillStyle = '#16345E'; x.fill(); K.t(x, label, X + 28, Y + 33, '700 22px Poppins', '#F5B335', 'left', 1.5); },
    ctaL(x, label, X, Y, w, h = 84) { x.save(); x.shadowColor = 'rgba(22,52,94,.35)'; x.shadowBlur = 24; x.shadowOffsetY = 8; K.rr(x, X, Y, w, h, 16); const g = x.createLinearGradient(0, Y, 0, Y + h); g.addColorStop(0, '#1E4380'); g.addColorStop(1, '#122A57'); x.fillStyle = g; x.fill(); x.restore(); K.t(x, label, X + w / 2, Y + h / 2 + 14, '800 36px Poppins', '#FFFFFF', 'center'); },
    cardL(x, X, Y, w, h, r = 18) { x.save(); x.shadowColor = 'rgba(22,52,94,.14)'; x.shadowBlur = 26; x.shadowOffsetY = 8; K.rr(x, X, Y, w, h, r); x.fillStyle = '#FFFFFF'; x.fill(); x.restore(); K.rr(x, X, Y, w, h, r); x.strokeStyle = '#DCE5F3'; x.lineWidth = 2; x.stroke(); },
    hl(x, s, X, Y, font, padX = 14) { x.font = font; const tw = x.measureText(s).width; const m = parseInt(font.match(/(\d+)px/)[1]); K.rr(x, X - padX * .3, Y - m * .78, tw + padX * 1.3, m * 1.0, 10); x.fillStyle = '#F5B335'; x.fill(); K.t(x, s, X + padX * .35, Y, font, '#0F2A52'); return tw + padX * 1.3; },
    photoCard(x, X, Y, w, ph, lines, fs = 19) {
      x.save(); x.shadowColor = 'rgba(255,185,60,.35)'; x.shadowBlur = 26; K.rr(x, X, Y, w, ph + 132, 22); x.fillStyle = '#16345E'; x.fill(); x.restore();
      x.save(); K.rr(x, X, Y, w, ph + 132, 22); x.clip(); const im = A.richa; const sc = Math.max(w / im.width, ph / im.height); const dw = im.width * sc, dh = im.height * sc; x.drawImage(im, X + (w - dw) / 2, Y, dw, dh); x.fillStyle = '#132C55'; x.fillRect(X, Y + ph, w, 132); x.restore();
      K.rr(x, X, Y, w, ph + 132, 22); x.strokeStyle = '#F5B335'; x.lineWidth = 4; x.stroke();
      K.t(x, 'Dr Richa Saxena', X + 22, Y + ph + 46, '700 31px Poppins', '#F5B335'); K.t(x, lines[0], X + 22, Y + ph + 84, '600 ' + fs + 'px Poppins', '#FFFFFF'); K.t(x, lines[1], X + 22, Y + ph + 113, '500 ' + fs + 'px Poppins', '#D6E2FF');
    },
    icon(x, type, cx, cy, s = 30) {
      x.save(); x.strokeStyle = '#F5B335'; x.lineWidth = 4; x.lineCap = 'round'; x.lineJoin = 'round'; x.translate(cx, cy);
      if (type === 'book') { x.beginPath(); x.moveTo(0, -s * .55); x.quadraticCurveTo(-s * .5, -s * .8, -s, -s * .6); x.lineTo(-s, s * .6); x.quadraticCurveTo(-s * .5, s * .4, 0, s * .65); x.quadraticCurveTo(s * .5, s * .4, s, s * .6); x.lineTo(s, -s * .6); x.quadraticCurveTo(s * .5, -s * .8, 0, -s * .55); x.lineTo(0, s * .65); x.stroke(); }
      if (type === 'pyq') { x.strokeRect(-s * .7, -s * .85, s * 1.4, s * 1.7); for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(-s * .4, -s * .4 + i * s * .4); x.lineTo(s * .4, -s * .4 + i * s * .4); x.stroke(); } }
      if (type === 'mock') { x.beginPath(); x.arc(0, s * .1, s * .8, 0, 7); x.stroke(); x.beginPath(); x.moveTo(0, s * .1); x.lineTo(0, -s * .35); x.moveTo(0, s * .1); x.lineTo(s * .35, s * .3); x.moveTo(-s * .25, -s * .95); x.lineTo(s * .25, -s * .95); x.stroke(); }
      if (type === 'check') { x.beginPath(); x.arc(0, 0, s * .8, 0, 7); x.fillStyle = '#F5B335'; x.fill(); x.strokeStyle = '#0B1B3D'; x.beginPath(); x.moveTo(-s * .38, 0); x.lineTo(-s * .08, s * .3); x.lineTo(s * .42, -s * .3); x.stroke(); }
      x.restore();
    },
    async save(c, name) { const b = await new Promise((r) => c.toBlob(r, 'image/png')); const r = await fetch('/__save-export?name=' + name, { method: 'POST', body: b }); return r.status; },
  };
  window.K = K;

  // MRCOG Part 1 Comprehensive, "Everything in one course" (light theme)
  window.drawBundle = function (items) {
    const c = document.createElement('canvas'); c.width = W; c.height = HT; const x = c.getContext('2d');
    K.bgL(x); K.logoL(x); K.pillL(x, 'MRCOG PART 1 · COMPREHENSIVE');
    K.t(x, 'Everything MRCOG Part 1', 52, 316, '800 58px Poppins', '#0F2A52');
    K.t(x, 'asks for.', 52, 388, '800 58px Poppins', '#0F2A52');
    x.font = '800 58px Poppins'; const aw = x.measureText('asks for. ').width; K.hl(x, 'One course.', 52 + aw, 388, '800 56px Poppins');
    { const g = x.createRadialGradient(540, 660, 20, 540, 660, 460); g.addColorStop(0, 'rgba(45,70,185,.14)'); g.addColorStop(1, 'rgba(45,70,185,0)'); x.fillStyle = g; x.fillRect(0, 0, W, HT); }
    for (let i = 2; i >= 0; i--) { x.save(); x.translate(760 + i * 14, 445 + i * 10); x.rotate(.1 - i * .04); x.shadowColor = 'rgba(22,52,94,.25)'; x.shadowBlur = 14; x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, 200, 270); x.strokeStyle = '#DCE5F3'; x.lineWidth = 1.5; x.strokeRect(0, 0, 200, 270); x.restore(); }
    x.save(); x.translate(760, 445); x.rotate(.1); x.fillStyle = '#16345E'; x.fillRect(0, 0, 200, 38); K.t(x, 'MOCK PAPER', 100, 26, '700 16px Poppins', '#FFFFFF', 'center', 1);
    for (let r = 0; r < 7; r++) for (let q = 0; q < 5; q++) { x.beginPath(); x.arc(40 + q * 30, 70 + r * 28, 8, 0, 7); x.strokeStyle = '#9AA6BD'; x.lineWidth = 1.5; x.stroke(); if ((r * 3 + q) % 5 === 1) { x.fillStyle = '#16345E'; x.fill(); } }
    x.restore();
    { const X = 660, Y = 500, w = 250, h = 320; x.save(); x.translate(X, Y); x.rotate(-.04); x.shadowColor = 'rgba(22,52,94,.4)'; x.shadowBlur = 30; x.shadowOffsetY = 14; x.fillStyle = '#E9E4D8'; K.rr(x, 12, 10, w, h, 6); x.fill(); x.restore();
      x.save(); x.translate(X, Y); x.rotate(-.04); const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#1C6E8C'); g.addColorStop(1, '#0E3F5C'); K.rr(x, 0, 0, w, h, 6); x.fillStyle = g; x.fill(); x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(0, 0, 18, h); x.fillStyle = '#F5B335'; x.fillRect(34, 36, w - 64, 4);
      K.t(x, 'MRCOG', 34, 96, '900 46px Poppins', '#FFFFFF'); K.t(x, 'PART 1', 34, 138, '800 30px Poppins', '#F5B335'); K.t(x, '3rd Edition', 34, 176, '500 18px Poppins', 'rgba(255,255,255,.85)'); K.t(x, 'Richa Saxena', 34, h - 30, '700 20px Poppins', '#FFFFFF'); x.restore(); }
    { const X = 60, Y = 450, w = 560, h = 350; x.save(); x.shadowColor = 'rgba(22,52,94,.45)'; x.shadowBlur = 36; x.shadowOffsetY = 16; K.rr(x, X, Y, w, h, 28); x.fillStyle = '#1B1F2A'; x.fill(); x.restore();
      const sx = X + 18, sy = Y + 18, sw = w - 36, sh = h - 36; x.save(); K.rr(x, sx, sy, sw, sh, 14); x.clip(); x.fillStyle = '#DDE8F5'; x.fillRect(sx, sy, sw, sh); const im = A.richa; const sc = sw * .55 / im.width; x.drawImage(im, sx + sw - im.width * sc - 10, sy + 10, im.width * sc, im.height * sc);
      x.fillStyle = '#16345E'; x.fillRect(sx, sy, sw * .46, sh); K.t(x, 'Video lecture', sx + 22, sy + 48, '600 18px Poppins', '#9FB6DD'); K.t(x, 'Endocrinology', sx + 22, sy + 88, '800 27px Poppins', '#FFFFFF'); K.t(x, 'in depth', sx + 22, sy + 122, '800 27px Poppins', '#F5B335');
      x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(sx, sy + sh - 44, sw, 44); x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(sx + 60, sy + sh - 24, sw - 90, 5); x.fillStyle = '#F5B335'; x.fillRect(sx + 60, sy + sh - 24, (sw - 90) * .4, 5); x.beginPath(); x.moveTo(sx + 22, sy + sh - 33); x.lineTo(sx + 40, sy + sh - 22); x.lineTo(sx + 22, sy + sh - 11); x.closePath(); x.fillStyle = '#FFFFFF'; x.fill(); x.restore(); }
    { const X = 520, Y = 580, w = 160, h = 260; x.save(); x.shadowColor = 'rgba(22,52,94,.45)'; x.shadowBlur = 30; x.shadowOffsetY = 14; K.rr(x, X, Y, w, h, 24); x.fillStyle = '#111520'; x.fill(); x.restore();
      const sx = X + 9, sy = Y + 11, sw = w - 18, sh = h - 22; x.save(); K.rr(x, sx, sy, sw, sh, 17); x.clip(); x.fillStyle = '#F4F7FD'; x.fillRect(sx, sy, sw, sh); x.fillStyle = '#16345E'; x.fillRect(sx, sy, sw, 40); K.t(x, 'Flashcards', sx + sw / 2, sy + 27, '700 15px Poppins', '#FFFFFF', 'center');
      K.rr(x, sx + 12, sy + 56, sw - 24, 124, 12); x.fillStyle = '#FFFFFF'; x.fill(); x.strokeStyle = '#F5B335'; x.lineWidth = 2; x.stroke(); [.8, .6, .7].forEach((r, i) => { K.rr(x, sx + 24, sy + 80 + i * 22, (sw - 48) * r, 8, 4); x.fillStyle = '#C3CCDD'; x.fill(); }); K.t(x, 'Tap to reveal', sx + sw / 2, sy + 165, '600 12px Poppins', '#C98A12', 'center');
      K.rr(x, sx + 12, sy + 192, sw - 24, 30, 15); x.fillStyle = '#F5B335'; x.fill(); K.t(x, 'Next', sx + sw / 2, sy + 212, '700 14px Poppins', '#0B1B3D', 'center'); x.restore(); }
    items.forEach((s, i) => { const col = i % 2, row = Math.floor(i / 2); const X = 52 + col * 478, Y = 890 + row * 58; K.icon(x, 'check', X + 18, Y, 20); K.t(x, s, X + 46, Y + 9, '600 23.5px Poppins', '#0F2A52'); });
    K.ctaL(x, 'SEE WHAT’S INSIDE  →', 52, 1060, 920, 84);
    K.t(x, 'Mentor: Dr Richa Saxena  ·  MD (OBGYN), RCOG Associate  ·  Author, MRCOG 1, 2 & 3 Textbooks', 512, 1215, '500 20px Poppins', '#51607A', 'center');
    return c;
  };
})();
