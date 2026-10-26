/* =========================================================
   GIGA TITS ($GIGATITS) — site script
   ========================================================= */

/* ---------------------------------------------------------
   SITE CONFIG — update these values at launch.
   Every [data-link] and [data-config] element on the page
   reads from here.
   --------------------------------------------------------- */
const SITE_CONFIG = {
  TOKEN_NAME: "Giga Tits",
  TOKEN_SYMBOL: "GIGATITS",
  CHAIN: "Solana",
  CONTRACT_ADDRESS: "ABp2bT8ovFYYY8etNQmJauRDXgk3tYkt2jpmGqZSpump",

  X_URL: "https://x.com/Giga_Tits",
  BUY_URL: "https://pump.fun/coin/ABp2bT8ovFYYY8etNQmJauRDXgk3tYkt2jpmGqZSpump",
  CHART_URL: "https://dexscreener.com/solana/ABp2bT8ovFYYY8etNQmJauRDXgk3tYkt2jpmGqZSpump",

  // Placeholder value used before launch. While CONTRACT_ADDRESS equals this,
  // the "pending launch" notes stay visible and Buy CTAs stay soft-disabled.
  PRELAUNCH_PLACEHOLDER: "CommingSoon",
};

(function () {
  "use strict";

  const cfg = SITE_CONFIG;
  const isPrelaunch = cfg.CONTRACT_ADDRESS === cfg.PRELAUNCH_PLACEHOLDER;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Apply config ---------- */
  const linkMap = { x: cfg.X_URL, buy: cfg.BUY_URL, chart: cfg.CHART_URL };

  document.querySelectorAll("[data-link]").forEach((el) => {
    const url = linkMap[el.dataset.link];
    if (url) el.setAttribute("href", url);
  });

  document.querySelectorAll('[data-config="ca"]').forEach((el) => {
    el.textContent = cfg.CONTRACT_ADDRESS;
  });

  document.querySelectorAll("[data-prelaunch]").forEach((el) => {
    el.hidden = !isPrelaunch;
  });

  /* Soft-disable Buy CTAs while prelaunch */
  if (isPrelaunch) {
    document.querySelectorAll('[data-link="buy"]').forEach((el) => {
      el.setAttribute("href", "#");
      el.removeAttribute("target");
      el.removeAttribute("rel");
      el.setAttribute("aria-disabled", "true");
      el.classList.add("is-prelaunch-disabled");
      if (el.tagName === "A") {
        el.addEventListener("click", (e) => e.preventDefault());
      }
      const label = el.textContent.trim();
      if (/buy/i.test(label)) {
        el.textContent = "Coming Soon";
      }
    });
  }

  document.querySelectorAll("[data-live-only]").forEach((el) => {
    el.hidden = isPrelaunch;
  });

  const embed = document.getElementById("dex-embed");
  if (embed) {
    if (isPrelaunch) {
      embed.removeAttribute("src");
      embed.setAttribute("data-pending", "true");
    } else {
      const sep = cfg.CHART_URL.includes("?") ? "&" : "?";
      embed.src = cfg.CHART_URL + sep + "embed=1&theme=dark&info=0&trades=0";
    }
  }

  /* ---------- Navigation ---------- */
  const nav = document.getElementById("nav");
  const toggle = nav.querySelector(".nav__toggle");
  const menu = document.getElementById("nav-menu");

  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  toggle.addEventListener("click", () => {
    setMenu(!nav.classList.contains("is-open"));
  });

  menu.addEventListener("click", (e) => {
    if (e.target.closest("a")) setMenu(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      setMenu(false);
      toggle.focus();
    }
  });

  document.addEventListener("click", (e) => {
    if (nav.classList.contains("is-open") && !nav.contains(e.target)) setMenu(false);
  });

  window.matchMedia("(min-width: 961px)").addEventListener("change", (e) => {
    if (e.matches) setMenu(false);
  });

  /* ---------- Copy contract address ---------- */
  const copyBtn = document.querySelector("[data-copy-ca]");
  const copyText = copyBtn && copyBtn.querySelector(".ca__copy-text");
  const status = document.querySelector(".ca__status");
  const caValue = document.getElementById("ca-value");
  let copyTimer;

  function legacyCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  async function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        /* fall through to legacy method */
      }
    }
    return legacyCopy(text);
  }

  function showCopyResult(ok) {
    clearTimeout(copyTimer);
    copyBtn.classList.toggle("is-success", ok);
    copyBtn.classList.toggle("is-error", !ok);
    status.classList.toggle("is-error", !ok);

    if (ok) {
      copyText.textContent = "Copied!";
      status.textContent = isPrelaunch
        ? "Copied: " + cfg.CONTRACT_ADDRESS + " (placeholder until launch)."
        : "Contract address copied.";
    } else {
      copyText.textContent = "Copy failed";
      status.textContent = "Couldn't access the clipboard. Select the address and copy it manually.";
      const range = document.createRange();
      range.selectNodeContents(caValue);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }

    copyTimer = setTimeout(() => {
      copyBtn.classList.remove("is-success", "is-error");
      copyText.textContent = "Copy CA";
    }, 2400);
  }

  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      showCopyResult(await copyToClipboard(cfg.CONTRACT_ADDRESS));
    });
  }

  /* ---------- Scroll reveal ---------- */
  const reveals = document.querySelectorAll(".reveal");

  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("is-visible"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });

    reveals.forEach((el) => io.observe(el));
  }

  /* ---------- Nav state + hero parallax ---------- */
  const hero = document.querySelector(".hero");
  const parallaxEls = Array.from(document.querySelectorAll("[data-parallax]"));
  let ticking = false;

  function onScroll() {
    const y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 20);

    if (!reduceMotion.matches && hero && y < hero.offsetHeight) {
      parallaxEls.forEach((el) => {
        const f = parseFloat(el.dataset.parallax) || 0;
        el.style.translate = "0 " + (y * f).toFixed(1) + "px";
      });
    }
    ticking = false;
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });

  onScroll();
})();
