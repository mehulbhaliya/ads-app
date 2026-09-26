// Multi-size renderers for the MRCOG Comprehensive light-theme ads. Needs creative-kit.js loaded first.
(function () {
  const SIZES = { '4x5': [1024, 1280], '1x1': [1080, 1080], '9x16': [1080, 1920] };
  window.SIZES = SIZES;
  // devices group, drawn in 4:5 coordinates (region x 60..990, y 440..840)
  window.bundleVisual = function (x) {
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
  };

  const L_BUNDLE = {
    '4x5': { logo: [52, 44, 250], pill: [52, 176], hf: 58, h1: 316, h2: 388, vs: 1, vx: 0, vy: 0, cy: 890, cr: 58, cf: 23.5, cw: 478, ctaY: 1060, ctaH: 84, mY: 1215, mf: 20 },
    '1x1': { logo: [52, 46, 220], pill: ['right', 62], hf: 54, h1: 218, h2: 284, vs: .9, vx: 540 - 525 * .9, vy: 322 - 440 * .9, cy: 736, cr: 50, cf: 23, cw: 500, ctaY: 884, ctaH: 80, mY: 1024, mf: 19 },
    '9x16': { logo: [64, 250, 280], pill: [64, 392], hf: 66, h1: 540, h2: 622, vs: 1, vx: 540 - 525, vy: 700 - 440, cy: 1170, cr: 62, cf: 24, cw: 500, ctaY: 1352, ctaH: 92, mY: 1500, mf: 20 },
  };
  window.drawBundleSize = function (size, items) {
    const [W, HT] = SIZES[size], L = L_BUNDLE[size]; const c = document.createElement('canvas'); c.width = W; c.height = HT; const x = c.getContext('2d');
    const ml = L.logo[0];
    K.bgL(x, W, HT); K.logoL(x, ...L.logo);
    { let [px, py] = L.pill; if (px === 'right') { x.font = '700 22px Poppins'; x.letterSpacing = '1.5px'; const tw = x.measureText('MRCOG PART 1 · COMPREHENSIVE').width; x.letterSpacing = '0px'; px = W - ml - (tw + 56); } K.pillL(x, 'MRCOG PART 1 · COMPREHENSIVE', px, py); }
    K.t(x, 'Everything MRCOG Part 1', ml, L.h1, '800 ' + L.hf + 'px Poppins', '#0F2A52');
    K.t(x, 'asks for.', ml, L.h2, '800 ' + L.hf + 'px Poppins', '#0F2A52');
    x.font = '800 ' + L.hf + 'px Poppins'; const aw = x.measureText('asks for. ').width; K.hl(x, 'One course.', ml + aw, L.h2, '800 ' + (L.hf - 2) + 'px Poppins');
    { const cx = L.vx + 540 * L.vs, cy = L.vy + 660 * L.vs; const g = x.createRadialGradient(cx, cy, 20, cx, cy, 460 * L.vs); g.addColorStop(0, 'rgba(45,70,185,.14)'); g.addColorStop(1, 'rgba(45,70,185,0)'); x.fillStyle = g; x.fillRect(0, 0, W, HT); }
    x.save(); x.translate(L.vx, L.vy); x.scale(L.vs, L.vs); bundleVisual(x); x.restore();
    items.forEach((s, i) => { const col = i % 2, row = Math.floor(i / 2); const X = ml + col * L.cw, Y = L.cy + row * L.cr; K.icon(x, 'check', X + 18, Y, 20); K.t(x, s, X + 46, Y + 9, '600 ' + L.cf + 'px Poppins', '#0F2A52'); });
    K.ctaL(x, 'SEE WHAT’S INSIDE  →', ml, L.ctaY, W - 2 * ml, L.ctaH);
    K.t(x, 'Mentor: Dr Richa Saxena  ·  MD (OBGYN), RCOG Associate  ·  Author, MRCOG 1, 2 & 3 Textbooks', W / 2, L.mY, '500 ' + L.mf + 'px Poppins', '#51607A', 'center');
    return c;
  };

  const L_2X = {
    '4x5': { logo: [52, 44, 250], pill: [52, 176], xf: 290, xy: 530, sw: [60, 566, 470], l1: [636, 44], l2: [698, 54], l3: [764, 54], card: [600, 190, 372, 440], ty: 830, th: 180, tw: 296, tg: 16, ctaY: 1058, ctaH: 88, fy: 1234, ff: 17 },
    '1x1': { logo: [52, 40, 230], pill: [52, 134], xf: 236, xy: 430, sw: [60, 462, 385], l1: [524, 38], l2: [578, 46], l3: [636, 46], card: [664, 134, 364, 382], ty: 690, th: 160, tw: 312, tg: 18, ctaY: 878, ctaH: 80, fy: 1036, ff: 16 },
    '9x16': { logo: [64, 250, 280], pill: [64, 392], xf: 300, xy: 760, sw: [72, 798, 486], l1: [872, 46], l2: [940, 58], l3: [1012, 58], card: [612, 480, 404, 470], ty: 1100, th: 190, tw: 304, tg: 18, ctaY: 1334, ctaH: 92, fy: 1480, ff: 17 },
  };
  window.draw2XSize = function (size) {
    const [W, HT] = SIZES[size], L = L_2X[size]; const c = document.createElement('canvas'); c.width = W; c.height = HT; const x = c.getContext('2d');
    const ml = L.logo[0];
    K.bgL(x, W, HT); K.logoL(x, ...L.logo); K.pillL(x, 'MRCOG PART 1 · COMPREHENSIVE', ...L.pill);
    x.save(); x.shadowColor = 'rgba(45,70,185,.25)'; x.shadowBlur = 30; x.shadowOffsetY = 10; const g2 = x.createLinearGradient(0, L.xy - L.xf * .8, 0, L.xy); g2.addColorStop(0, '#2D46B9'); g2.addColorStop(1, '#0F2A52'); K.t(x, '2X', ml - 12, L.xy, L.xf + 'px "Archivo Black"', g2); x.restore();
    x.save(); x.strokeStyle = '#F5B335'; x.lineWidth = 14 * L.xf / 290; x.lineCap = 'round'; x.beginPath(); x.moveTo(L.sw[0], L.sw[1]); x.quadraticCurveTo((L.sw[0] + L.sw[2]) / 2, L.sw[1] - 26 * L.xf / 290, L.sw[2], L.sw[1] - 8); x.stroke(); x.restore();
    K.t(x, 'your chances of', ml + 4, L.l1[0], '600 ' + L.l1[1] + 'px Poppins', '#3D5170');
    K.t(x, 'cracking MRCOG', ml + 4, L.l2[0], '800 ' + L.l2[1] + 'px Poppins', '#0F2A52');
    K.hl(x, 'Part 1*', ml + 8, L.l3[0], '800 ' + L.l3[1] + 'px Poppins');
    K.photoCard(x, ...L.card, ['MD (OBGYN), RCOG Associate', 'Author, MRCOG 1, 2 & 3 Textbooks']);
    const tiles = [['book', 'Dr Richa’s', 'MRCOG books', 'printed & delivered'], ['pyq', '5 years', 'of PYQs', 'discussed in detail'], ['mock', '10 mock', 'sets', '+ Qbank & flashcards']];
    tiles.forEach((t, i) => { const X = ml + i * (L.tw + L.tg), Y = L.ty, w = L.tw, h = L.th; K.cardL(x, X, Y, w, h); x.beginPath(); x.arc(X + 50, Y + 62, 30, 0, 7); x.fillStyle = '#16345E'; x.fill(); K.icon(x, t[0], X + 50, Y + 62, 16); K.t(x, t[1], X + 96, Y + 58, '800 30px Poppins', '#2D46B9'); K.t(x, t[2], X + 96, Y + 94, '700 26px Poppins', '#0F2A52'); K.t(x, t[3], X + 26, Y + h - 32, '500 21px Poppins', '#51607A'); });
    K.ctaL(x, 'SEE WHAT’S INSIDE  →', ml, L.ctaY, W - 2 * ml, L.ctaH);
    K.t(x, '*DigiNerve subscribers’ MRCOG Part 1 pass rate vs the overall pass rate. Details on the course page.', W / 2, L.fy, '500 ' + L.ff + 'px Poppins', '#51607A', 'center');
    return c;
  };
})();
