(function () {
  "use strict";

  const MIN_DURATION = 2000;
  const EXIT_DURATION = 650;
  const PROGRESS_CAP = 92;

  const preloader = document.getElementById("preloader");

  function dispatchLoaded() {
    window.dispatchEvent(new CustomEvent("fitness:loaded", { bubbles: true }));
  }

  if (!preloader) {
    dispatchLoaded();
    return;
  }

  const percentEl = document.getElementById("preloader-percent");
  const progressBar = document.getElementById("preloader-progress-bar");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.body.classList.add("is-loading");

  let currentProgress = 0;
  let rafId = null;
  const startTime = performance.now();
  let pageLoaded = document.readyState === "complete";

  if (!pageLoaded) {
    window.addEventListener("load", () => {
      pageLoaded = true;
    }, { once: true });
  }

  function setProgress(value) {
    const pct = Math.min(100, Math.max(0, Math.round(value)));
    currentProgress = pct;
    preloader.style.setProperty("--preloader-progress", `${pct}%`);
    if (progressBar) progressBar.style.width = `${pct}%`;
    if (percentEl) {
      percentEl.textContent = `${pct}%`;
      percentEl.setAttribute("aria-label", `Loading progress ${pct} percent`);
    }
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function tick(now) {
    const elapsed = now - startTime;
    const timeRatio = Math.min(elapsed / MIN_DURATION, 1);
    const eased = easeOutCubic(timeRatio);
    let target = eased * PROGRESS_CAP;

    if (pageLoaded && elapsed >= MIN_DURATION) {
      const finishRatio = Math.min((elapsed - MIN_DURATION) / 400, 1);
      target = PROGRESS_CAP + finishRatio * (100 - PROGRESS_CAP);
    }

    setProgress(target);

    if (pageLoaded && elapsed >= MIN_DURATION && currentProgress >= 100) {
      complete();
      return;
    }

    rafId = requestAnimationFrame(tick);
  }

  function complete() {
    if (rafId) cancelAnimationFrame(rafId);

    preloader.classList.add("is-complete");
    setProgress(100);

    const exitDelay = prefersReducedMotion ? 50 : 280;

    setTimeout(exitPreloader, exitDelay);
  }

  function exitPreloader() {
    preloader.classList.add("is-exiting");
    document.body.classList.remove("is-loading");

    const onTransitionEnd = (e) => {
      if (e.target !== preloader) return;
      preloader.removeEventListener("transitionend", onTransitionEnd);
      finalize();
    };

    preloader.addEventListener("transitionend", onTransitionEnd);

    setTimeout(() => {
      if (!preloader.classList.contains("is-hidden")) finalize();
    }, EXIT_DURATION + 100);
  }

  function finalize() {
    preloader.classList.add("is-hidden");
    preloader.setAttribute("aria-hidden", "true");
    dispatchLoaded();
  }

  if (prefersReducedMotion) {
    Promise.all([
      new Promise((resolve) => {
        if (pageLoaded) resolve();
        else window.addEventListener("load", resolve, { once: true });
      }),
      new Promise((resolve) => setTimeout(resolve, MIN_DURATION)),
    ]).then(() => {
      setProgress(100);
      preloader.classList.add("is-complete", "is-exiting", "is-hidden");
      document.body.classList.remove("is-loading");
      preloader.setAttribute("aria-hidden", "true");
      dispatchLoaded();
    });
    return;
  }

  setProgress(0);
  rafId = requestAnimationFrame(tick);

  setTimeout(() => {
    if (!pageLoaded) pageLoaded = true;
  }, 8000);
})();
