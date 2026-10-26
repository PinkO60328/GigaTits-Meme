/* =========================================================
   GIGA TITS — flying-character intro overlay
   sessionStorage key: gigatits_intro_seen
   Force again: sessionStorage.removeItem('gigatits_intro_seen'); location.reload();
   ========================================================= */
(function () {
  "use strict";

  const INTRO_KEY = "gigatits_intro_seen";
  const FLYER_SRCS = [
    "assets/flyers/01.png",
    "assets/flyers/02.png",
    "assets/flyers/03.jpg",
    "assets/flyers/04.jpg",
    "assets/flyers/05.jpg",
    "assets/flyers/06.jpg",
    "assets/flyers/07.png",
    "assets/flyers/08.png",
    "assets/flyers/09.png",
    "assets/flyers/10.jpg",
    "assets/flyers/11.jpg",
    "assets/flyers/12.jpg",
    "assets/flyers/13.jpg",
    "assets/flyers/14.jpg",
    "assets/flyers/15.jpg",
    "assets/flyers/16.jpg",
  ];

  const intro = document.getElementById("intro");
  const stage = document.getElementById("intro-flyers");
  const startBtn = document.getElementById("intro-start");
  if (!intro || !stage || !startBtn) return;

  function alreadySeen() {
    try {
      return sessionStorage.getItem(INTRO_KEY) === "1";
    } catch (_) {
      return false;
    }
  }

  function markSeen() {
    try {
      sessionStorage.setItem(INTRO_KEY, "1");
    } catch (_) {}
  }

  function dismissIntro() {
    markSeen();
    document.documentElement.classList.remove("intro-pending");
    document.documentElement.classList.add("intro-skip");
    intro.classList.add("is-out");
    window.setTimeout(() => {
      if (intro.parentNode) intro.parentNode.removeChild(intro);
    }, 700);
  }

  if (alreadySeen() || document.documentElement.classList.contains("intro-skip")) {
    dismissIntro();
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 720px)").matches;
  const srcs = isMobile ? FLYER_SRCS.filter((_, i) => i % 2 === 0) : FLYER_SRCS.slice();

  /** @type {{el: HTMLElement, x:number, y:number, vx:number, vy:number, size:number, rot:number, vr:number, arriving:boolean, arrived:boolean}[]} */
  const flyers = [];
  let rafId = 0;
  let converging = false;
  let lastTs = 0;

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function buildFlyers() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    srcs.forEach((src, i) => {
      const size = isMobile ? rand(64, 96) : rand(88, 132);
      const el = document.createElement("div");
      el.className = "intro__flyer";
      el.style.width = size + "px";
      el.style.height = size + "px";
      const img = document.createElement("img");
      img.src = src;
      img.alt = "";
      img.draggable = false;
      img.decoding = "async";
      el.appendChild(img);
      stage.appendChild(el);

      // Spread start positions around edges / screen
      let x, y;
      const edge = i % 4;
      if (edge === 0) {
        x = rand(-size, w);
        y = rand(-size * 0.5, h * 0.25);
      } else if (edge === 1) {
        x = rand(w * 0.7, w);
        y = rand(0, h);
      } else if (edge === 2) {
        x = rand(-size, w);
        y = rand(h * 0.7, h);
      } else {
        x = rand(-size * 0.5, w * 0.3);
        y = rand(0, h);
      }

      const speed = reduceMotion ? 0.15 : rand(0.55, 1.65);
      const angle = rand(0, Math.PI * 2);
      flyers.push({
        el,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        rot: rand(-18, 18),
        vr: reduceMotion ? 0 : rand(-0.06, 0.06),
        arriving: false,
        arrived: false,
      });
      el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${flyers[flyers.length - 1].rot}deg)`;
    });
  }

  function buttonCenter() {
    const r = startBtn.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function tick(ts) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min(32, ts - lastTs) / 16.67; // normalize to ~60fps units
    lastTs = ts;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const target = converging ? buttonCenter() : null;
    let allArrived = converging;

    for (const f of flyers) {
      if (f.arrived) continue;

      if (converging && target) {
        f.arriving = true;
        const cx = f.x + f.size / 2;
        const cy = f.y + f.size / 2;
        const dx = target.x - cx;
        const dy = target.y - cy;
        const dist = Math.hypot(dx, dy) || 1;
        // Ease toward center; speed ramps with distance
        const pull = Math.max(6, dist * 0.12);
        f.vx = (dx / dist) * pull;
        f.vy = (dy / dist) * pull;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.rot += f.vr * dt * 8;
        f.size = Math.max(12, f.size * (1 - 0.045 * dt));
        f.el.style.width = f.size + "px";
        f.el.style.height = f.size + "px";
        f.el.style.opacity = String(Math.max(0, Number(f.el.style.opacity || 1) - 0.035 * dt));

        if (dist < 28 || f.size < 18) {
          f.arrived = true;
          f.el.style.opacity = "0";
          f.el.style.transform = `translate3d(${target.x - f.size / 2}px, ${target.y - f.size / 2}px, 0) scale(0.2)`;
          continue;
        }
        allArrived = false;
      } else {
        f.x += f.vx * dt * 2.2;
        f.y += f.vy * dt * 2.2;
        f.rot += f.vr * dt * 2.2;

        // Bounce off edges
        if (f.x < -f.size * 0.4) {
          f.x = -f.size * 0.4;
          f.vx = Math.abs(f.vx);
        } else if (f.x > w - f.size * 0.6) {
          f.x = w - f.size * 0.6;
          f.vx = -Math.abs(f.vx);
        }
        if (f.y < -f.size * 0.4) {
          f.y = -f.size * 0.4;
          f.vy = Math.abs(f.vy);
        } else if (f.y > h - f.size * 0.6) {
          f.y = h - f.size * 0.6;
          f.vy = -Math.abs(f.vy);
        }
        allArrived = false;
      }

      f.el.style.transform = `translate3d(${f.x}px, ${f.y}px, 0) rotate(${f.rot}deg)`;
    }

    if (converging && allArrived) {
      cancelAnimationFrame(rafId);
      rafId = 0;
      startBtn.classList.add("is-burst");
      window.setTimeout(dismissIntro, 280);
      return;
    }

    rafId = requestAnimationFrame(tick);
  }

  function startConverge(e) {
    if (converging) return;
    converging = true;
    if (e) e.preventDefault();
    startBtn.disabled = true;
    startBtn.classList.add("is-sucking");
    intro.classList.add("is-converging");
    // Safety: if motion stuck, dismiss anyway
    window.setTimeout(() => {
      if (intro.parentNode && !intro.classList.contains("is-out")) dismissIntro();
    }, 3200);
  }

  buildFlyers();
  if (reduceMotion) {
    // Still show flyers but slower; START works the same
  }
  rafId = requestAnimationFrame(tick);
  startBtn.addEventListener("click", startConverge);
})();
