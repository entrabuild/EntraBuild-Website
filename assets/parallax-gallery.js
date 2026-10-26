/* Parallax website gallery: the centre screenshot is large, its neighbours sit smaller on both sides,
   and every screenshot slides against its own frame (parallax). Autoplay (pauses while you hover or touch),
   drag or swipe with momentum, tap a side screenshot to bring it forward, press + tilt feedback.
   Usage: <span class="pcov pgal" data-gallery='["images/a.jpg","images/b.jpg"]'></span> then ParallaxGallery.mount(el) */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DUR = 4200;                  // ms each screenshot stays in front
  var SIDE = 0.87, SMALL = 0.42;   // side distance (x card width) and how much smaller the side ones are
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  function mount(root) {
    if (!root || root.__pg) return; root.__pg = 1;
    var urls; try { urls = JSON.parse(root.dataset.gallery || '[]'); } catch (e) { urls = []; }
    var N = urls.length; if (N < 2) return;

    root.classList.add('pgal');
    root.insertAdjacentHTML('beforeend',
      '<div class="pg-stage">' + urls.map(function (u) { return '<div class="pg-glow" style="background-image:url(\'' + u + '\')"></div>'; }).join('') +
      urls.map(function (u, i) { return '<div class="pg-card" data-i="' + i + '"><img src="' + u + '" alt="" draggable="false" decoding="async"' + (i ? '' : ' fetchpriority="high"') + '></div>'; }).join('') + '</div>');

    var stage = root.querySelector('.pg-stage'), cards = [].slice.call(root.querySelectorAll('.pg-card')),
        imgs = cards.map(function (c) { return c.firstChild; }), glows = [].slice.call(root.querySelectorAll('.pg-glow'));
    var AR = 1.6;                  // width / height of the screenshots (read from the first one)
    var pos = 0, vel = 0, target = 0, t = 0, visible = false, last = 0, raf = 0;
    var cw = 300, ch = 190;
    var dragging = false, pressed = false, suppress = false, sx = 0, spos = 0, lastX = 0, lastT = 0, pv = 0;
    var px = 0, tiltX = 0, tiltY = 0, tx = 0, ty = 0, press = 1, hover = false, mx = 50, my = 50;

    function size() {
      var W = stage.clientWidth, H = stage.clientHeight; if (!W || !H) return;
      cw = Math.min(W * 0.66, H * 0.86 * AR); ch = cw / AR;
      root.style.setProperty('--cw', cw + 'px'); root.style.setProperty('--ch', ch + 'px');
    }
    imgs[0].addEventListener('load', function () { if (imgs[0].naturalWidth && imgs[0].naturalHeight) { AR = imgs[0].naturalWidth / imgs[0].naturalHeight; size(); draw(); } });
    function wrapD(i) { var d = i - pos; return d - N * Math.round(d / N); }

    function draw() {
      for (var i = 0; i < N; i++) {
        var d = wrapD(i), ad = Math.abs(d), near = Math.min(ad, 1), front = 1 - near;
        var s = ad <= 1 ? 1 - SMALL * ad : (1 - SMALL) - 0.2 * (ad - 1);
        var o = ad <= 1 ? 1 - 0.16 * ad : clamp(0.84 * (1 - (ad - 1) / 0.45), 0, 1);
        var c = cards[i], x = d * SIDE * cw;
        var rot = front > 0.01 ? 'rotateY(' + (tiltX * front).toFixed(2) + 'deg) rotateX(' + (tiltY * front).toFixed(2) + 'deg) ' : '';
        c.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0) ' + rot + 'scale(' + (s * (ad < 0.5 ? press : 1)).toFixed(4) + ')';
        c.style.opacity = o.toFixed(3);
        c.style.zIndex = Math.round(100 - ad * 40);
        c.style.setProperty('--dim', (near * 0.4).toFixed(3));
        c.style.setProperty('--shine', (hover ? front * 0.9 : 0).toFixed(3));
        c.style.setProperty('--mx', mx.toFixed(1) + '%'); c.style.setProperty('--my', my.toFixed(1) + '%');
        // the screenshot moves against its frame: that is the parallax
        imgs[i].style.transform = 'translate3d(' + (-clamp(d, -1.4, 1.4) * 2.6 + px * 0.5).toFixed(2) + '%,0,0)';
        glows[i].style.opacity = (Math.max(0, 1 - ad) * 0.4).toFixed(3);
      }
    }

    function frame(now) {
      raf = 0;
      if (!root.isConnected) { io.disconnect(); ro.disconnect(); return; }
      if (!visible || document.hidden) { last = 0; return; }
      var dt = last ? Math.min((now - last) / 1000, 0.034) : 0.016; last = now;
      if (!dragging) {
        if (reduce) { pos = target; vel = 0; }
        else { var a = 62 * (target - pos) - 14 * vel; vel += a * dt; pos += vel * dt; }
        if (Math.abs(target - pos) < 0.0004 && Math.abs(vel) < 0.002) { pos = target; vel = 0; }
      }
      if (!reduce && !hover && !pressed && !dragging) { t += dt * 1000; if (t >= DUR) { t = 0; target = Math.round(target) + 1; } }
      tiltX += (tx - tiltX) * 0.12; tiltY += (ty - tiltY) * 0.12;
      press += ((pressed && !dragging ? 0.97 : 1) - press) * 0.22;
      px += ((hover ? tx / 3 : 0) - px) * 0.1;
      draw();
      raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf && visible) raf = requestAnimationFrame(frame); }
    function go(k) { target = Math.round(target) + k; t = 0; kick(); }
    function goIndex(i) { var cur = ((Math.round(target) % N) + N) % N, d = i - cur; d -= N * Math.round(d / N); go(d); }

    // pointer: drag / swipe with momentum, press feedback, hover tilt
    stage.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      pressed = true; dragging = false; sx = lastX = e.clientX; spos = pos; lastT = performance.now(); pv = 0;
      try { stage.setPointerCapture(e.pointerId); } catch (x) {} kick();
    });
    stage.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height;
      mx = clamp(((e.clientX - r.left - (r.width - cw) / 2) / cw) * 100, 0, 100); my = clamp(((e.clientY - r.top - (r.height - ch) / 2) / ch) * 100, 0, 100);
      if (e.pointerType === 'mouse' || pressed) { hover = true; tx = clamp((nx - 0.5) * 2, -1, 1) * 6; ty = clamp((ny - 0.5) * 2, -1, 1) * -4; }
      if (!pressed) { kick(); return; }
      var dx = e.clientX - sx;
      if (!dragging && Math.abs(dx) > 6) { dragging = true; root.classList.add('dragging'); }
      if (dragging) {
        var now = performance.now(), dtm = Math.max(now - lastT, 1);
        pos = spos - dx / (cw * SIDE); target = pos;
        pv = 0.8 * pv + 0.2 * ((-(e.clientX - lastX) / (cw * SIDE)) / (dtm / 1000)); lastX = e.clientX; lastT = now; vel = 0; t = 0; kick();
      }
    });
    function release() {
      if (!pressed) return; pressed = false;
      if (dragging) {
        dragging = false; root.classList.remove('dragging'); suppress = true; setTimeout(function () { suppress = false; }, 0);
        target = clamp(Math.round(pos + pv * 0.22), Math.round(pos) - 1, Math.round(pos) + 1); vel = pv * 0.5; t = 0;
      }
      kick();
    }
    stage.addEventListener('pointerup', release); stage.addEventListener('pointercancel', release);
    stage.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { hover = false; tx = ty = 0; kick(); } });

    // click: a side screenshot comes forward; a drag never opens the project
    root.addEventListener('click', function (e) {
      if (suppress) { e.preventDefault(); e.stopPropagation(); return; }
      var c = e.target.closest('.pg-card');
      if (c) { var i = +c.dataset.i; if (Math.abs(wrapD(i)) > 0.5) { e.preventDefault(); e.stopPropagation(); goIndex(i); } }
    }, true);

    var ro = new ResizeObserver(function () { size(); draw(); }); ro.observe(stage);
    var io = new IntersectionObserver(function (es) { visible = es[0].isIntersecting; last = 0; if (visible) kick(); }, { threshold: 0.12 });
    io.observe(root);
    document.addEventListener('visibilitychange', function () { last = 0; kick(); });
    size(); draw();
  }

  window.ParallaxGallery = { mount: mount };
})();
