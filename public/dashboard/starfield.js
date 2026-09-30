// Sparse black pixel stars on white -- the landing's opening sky (see
// web/src/components/ui/PixelStarfield.jsx at mix = 0), minus the scroll
// transition. Purely decorative; respects prefers-reduced-motion.
(function () {
  var canvas = document.getElementById('starfield');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PX = 2;
  var stars = [];
  var W = 0, H = 0, dpr = 1;

  function build() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    var count = Math.round((W * H) / 22000);
    stars = [];
    for (var i = 0; i < count; i++) {
      var r = Math.random();
      stars.push({
        x: Math.round((Math.random() * W) / PX) * PX,
        y: Math.round((Math.random() * H) / PX) * PX,
        kind: r < 0.08 ? 'sparkle' : r < 0.3 ? 'big' : 'dot',
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 1.2
      });
    }
  }

  function frame(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0b1020';
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var tw = reduced ? 1 : 0.55 + 0.45 * Math.sin((now / 1000) * s.speed + s.phase);
      ctx.globalAlpha = Math.round(tw * 0.55 * 4) / 4;
      if (ctx.globalAlpha <= 0) continue;
      if (s.kind === 'dot') ctx.fillRect(s.x, s.y, PX, PX);
      else if (s.kind === 'big') ctx.fillRect(s.x, s.y, PX * 2, PX * 2);
      else { ctx.fillRect(s.x - PX, s.y, PX * 3, PX); ctx.fillRect(s.x, s.y - PX, PX, PX * 3); }
    }
    if (!reduced) requestAnimationFrame(frame);
  }

  build();
  requestAnimationFrame(frame);
  window.addEventListener('resize', function () { build(); if (reduced) requestAnimationFrame(frame); });
})();
