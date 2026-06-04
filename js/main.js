(function () {
  "use strict";

  const NAV_HEIGHT_VAR = () =>
    parseInt(getComputedStyle(document.documentElement).getPropertyValue("--nav-h"), 10) || 80;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const prefersReducedData = window.matchMedia("(prefers-reduced-data: reduce)").matches;


  function boot() {
    initNavbarScroll();
    initSmoothScroll();
    initActiveNav();
    initAOS();
    initSliders();
    initOutcomesCarousel();
    initCounters();
    initShowreel();
    initShowreelBenefits();
    initPricing();
    initNewsletter();
    initBackToTop();
    initFooterYear();
    initMediaPreferences();
  }

  if (document.getElementById("preloader")) {
    window.addEventListener("fitness:loaded", boot, { once: true });
  } else {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", boot);
    } else {
      boot();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMobileMenu);
  } else {
    initMobileMenu();
  }

  function initNavbarScroll() {
    const nav = document.getElementById("nav");
    if (!nav) return;

    const threshold = 40;

    function updateScrollState() {
      nav.classList.toggle("is-scrolled", window.scrollY > threshold);
    }

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
  }

  function initMobileMenu() {
    const toggle = document.getElementById("nav-toggle");
    const drawer = document.getElementById("nav-drawer");
    const backdrop = document.getElementById("nav-backdrop");
    const closeBtn = document.getElementById("nav-drawer-close");

    if (!toggle || !drawer || !backdrop) return;
    if (toggle.dataset.menuReady === "true") return;
    toggle.dataset.menuReady = "true";

    function openMenu() {
      toggle.setAttribute("aria-expanded", "true");
      drawer.classList.add("is-open");
      drawer.setAttribute("aria-hidden", "false");
      drawer.removeAttribute("inert");
      backdrop.classList.add("is-visible");
      backdrop.setAttribute("aria-hidden", "false");
      document.body.classList.add("is-menu-open");
    }

    function closeMenu() {
      toggle.setAttribute("aria-expanded", "false");
      drawer.classList.remove("is-open");
      drawer.setAttribute("aria-hidden", "true");
      drawer.setAttribute("inert", "");
      backdrop.classList.remove("is-visible");
      backdrop.setAttribute("aria-hidden", "true");
      document.body.classList.remove("is-menu-open");
    }

    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      if (isOpen) closeMenu();
      else openMenu();
    });

    closeBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      closeMenu();
    });

    backdrop.addEventListener("click", closeMenu);

    drawer.querySelectorAll(".nav-drawer__link, .nav-drawer__cta").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        closeMenu();
      }
    });

    window.closeMobileMenu = closeMenu;
  }

  
  function initSmoothScroll() {
    const anchorSelector = 'a[href^="#"]';

    document.querySelectorAll(anchorSelector).forEach((link) => {
      link.addEventListener("click", (e) => {
        const href = link.getAttribute("href");
        if (!href || href === "#") return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();

        if (typeof window.closeMobileMenu === "function") {
          window.closeMobileMenu();
        }

        const offset = NAV_HEIGHT_VAR();
        const top = target.getBoundingClientRect().top + window.scrollY - offset;

        window.scrollTo({
          top,
          behavior: prefersReducedMotion ? "auto" : "smooth",
        });

        history.pushState(null, "", href);
      });
    });
  }

  function initActiveNav() {
    const navLinks = document.querySelectorAll("[data-nav]");
    if (!navLinks.length) return;

    const sections = [];

    navLinks.forEach((link) => {
      const id = link.getAttribute("data-nav");
      const section = document.getElementById(id);
      if (section) sections.push({ id, el: section });
    });

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const id = entry.target.id;
          navLinks.forEach((link) => {
            const match = link.getAttribute("data-nav") === id;
            link.classList.toggle("is-active", match);
          });
        });
      },
      {
        rootMargin: `-${NAV_HEIGHT_VAR() + 20}px 0px -55% 0px`,
        threshold: 0,
      }
    );

    sections.forEach(({ el }) => observer.observe(el));
  }

  function initAOS() {
    if (typeof AOS === "undefined") return;

    AOS.init({
      duration: prefersReducedMotion ? 0 : 700,
      easing: "ease-out-cubic",
      once: true,
      offset: 60,
      disable: prefersReducedMotion,
    });
  }

  function initSliders() {
    document.querySelectorAll("[data-slider]").forEach((slider) => {
      new FitnessSlider(slider);
    });
  }

  function initOutcomesCarousel() {
    document.querySelectorAll("[data-outcomes-carousel]").forEach((root) => {
      const track = root.querySelector("[data-outcomes-track]");
      const slides = Array.from(root.querySelectorAll("[data-outcomes-slide]"));
      const prevBtn = root.closest(".transformations")?.querySelector("[data-outcomes-prev]");
      const nextBtn = root.closest(".transformations")?.querySelector("[data-outcomes-next]");
      const interval = parseInt(root.dataset.autoplay, 10) || 0;

      if (!track || slides.length < 2) return;

      let index = 0;
      let step = 0;
      let maxIndex = 0;
      let timer = null;

      const getVisible = () => {
        const value = parseInt(getComputedStyle(root).getPropertyValue("--outcomes-visible"), 10);
        return Number.isFinite(value) && value > 0 ? value : 1;
      };

      const measure = () => {
        const gap = parseFloat(getComputedStyle(track).gap) || 0;
        step = slides[0].offsetWidth + gap;
        maxIndex = Math.max(0, slides.length - getVisible());
        if (index > maxIndex) index = maxIndex;
        applyOffset();
      };

      const applyOffset = () => {
        track.style.transform = index > 0 && step ? `translate3d(-${step * index}px, 0, 0)` : "";
      };

      const loop = root.dataset.outcomesLoop !== "false";

      const goTo = (nextIndex) => {
        if (maxIndex <= 0) {
          index = 0;
        } else if (loop) {
          if (nextIndex < 0) index = maxIndex;
          else if (nextIndex > maxIndex) index = 0;
          else index = nextIndex;
        } else {
          index = Math.min(Math.max(nextIndex, 0), maxIndex);
        }
        applyOffset();
      };

      const advance = () => {
        if (maxIndex <= 0) return;
        goTo(index + 1);
      };

      const rewind = () => {
        if (maxIndex <= 0) return;
        goTo(index - 1);
      };

      const startAutoplay = () => {
        clearInterval(timer);
        if (interval > 0 && !prefersReducedMotion && maxIndex > 0) {
          timer = setInterval(advance, interval);
        }
      };

      const pauseAutoplay = () => {
        clearInterval(timer);
        timer = null;
      };

      prevBtn?.addEventListener("click", () => {
        rewind();
        startAutoplay();
      });

      nextBtn?.addEventListener("click", () => {
        advance();
        startAutoplay();
      });

      const section = root.closest(".transformations");
      section?.addEventListener("mouseenter", pauseAutoplay);
      section?.addEventListener("mouseleave", startAutoplay);
      section?.addEventListener("focusin", pauseAutoplay);
      section?.addEventListener("focusout", startAutoplay);

      let touchStartX = 0;
      track.addEventListener(
        "touchstart",
        (e) => {
          touchStartX = e.changedTouches[0].screenX;
          pauseAutoplay();
        },
        { passive: true }
      );

      track.addEventListener("touchend", (e) => {
        const delta = e.changedTouches[0].screenX - touchStartX;
        if (delta < -50) advance();
        else if (delta > 50) rewind();
        startAutoplay();
      });

      document.addEventListener("visibilitychange", () => {
        if (document.hidden) pauseAutoplay();
        else startAutoplay();
      });

      if (typeof ResizeObserver !== "undefined") {
        const observer = new ResizeObserver(measure);
        observer.observe(root);
      } else {
        window.addEventListener("resize", measure);
      }

      measure();
      startAutoplay();
    });
  }

  class FitnessSlider {
    constructor(root) {
      this.root = root;
      this.track = root.querySelector("[data-slider-track]");
      this.slides = Array.from(root.querySelectorAll("[data-slider-slide]"));
      this.prevBtn = root.querySelector("[data-slider-prev]");
      this.nextBtn = root.querySelector("[data-slider-next]");
      this.dotsWrap = root.querySelector("[data-slider-dots]");
      this.progressBar = root.querySelector("[data-slider-progress]");
      this.interval = parseInt(root.dataset.autoplay, 10) || 0;
      this.index = 0;
      this.timer = null;
      this.progressTimer = null;
      this.progressStart = 0;
      this.touchStartX = 0;
      this.touchDeltaX = 0;
      this.isPaused = false;

      if (!this.slides.length) return;

      this.buildDots();
      this.bindEvents();
      this.goTo(0, false);
      if (this.interval > 0 && !prefersReducedMotion) this.startAutoplay();
    }

    buildDots() {
      if (!this.dotsWrap) return;

      this.dotsWrap.innerHTML = "";
      this.slides.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "slider__dot";
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
        dot.setAttribute("aria-selected", i === 0 ? "true" : "false");
        dot.addEventListener("click", () => {
          this.goTo(i);
          this.resetAutoplay();
        });
        this.dotsWrap.appendChild(dot);
      });
      this.dots = Array.from(this.dotsWrap.querySelectorAll(".slider__dot"));
    }

    bindEvents() {
      this.prevBtn?.addEventListener("click", () => {
        this.prev();
        this.resetAutoplay();
      });

      this.nextBtn?.addEventListener("click", () => {
        this.next();
        this.resetAutoplay();
      });

      this.root.addEventListener("mouseenter", () => this.pauseAutoplay());
      this.root.addEventListener("mouseleave", () => this.resumeAutoplay());
      this.root.addEventListener("focusin", () => this.pauseAutoplay());
      this.root.addEventListener("focusout", () => this.resumeAutoplay());

      if (this.track) {
        this.track.addEventListener(
          "touchstart",
          (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
            this.touchDeltaX = 0;
            this.pauseAutoplay();
          },
          { passive: true }
        );

        this.track.addEventListener(
          "touchmove",
          (e) => {
            this.touchDeltaX = e.changedTouches[0].screenX - this.touchStartX;
          },
          { passive: true }
        );

        this.track.addEventListener("touchend", () => {
          const threshold = 50;
          if (this.touchDeltaX < -threshold) this.next();
          else if (this.touchDeltaX > threshold) this.prev();
          this.resetAutoplay();
        });
      }
    }

    goTo(index, animate = true) {
      this.index = ((index % this.slides.length) + this.slides.length) % this.slides.length;

      this.slides.forEach((slide, i) => {
        const active = i === this.index;
        slide.classList.toggle("is-active", active);
        slide.hidden = !active;
        slide.setAttribute("aria-hidden", active ? "false" : "true");
      });

      if (this.dots) {
        this.dots.forEach((dot, i) => {
          dot.classList.toggle("is-active", i === this.index);
          dot.setAttribute("aria-selected", i === this.index ? "true" : "false");
        });
      }

      if (animate) this.animateProgress();
    }

    prev() {
      this.goTo(this.index - 1);
    }

    next() {
      this.goTo(this.index + 1);
    }

    startAutoplay() {
      if (!this.interval) return;
      this.clearTimers();
      this.animateProgress();
      this.timer = setInterval(() => this.next(), this.interval);
    }

    resetAutoplay() {
      if (!this.interval || prefersReducedMotion) return;
      this.clearTimers();
      if (!this.isPaused) this.startAutoplay();
    }

    pauseAutoplay() {
      this.isPaused = true;
      this.clearTimers();
      if (this.progressBar) this.progressBar.style.width = "0%";
    }

    resumeAutoplay() {
      if (!this.interval || prefersReducedMotion) return;
      this.isPaused = false;
      this.startAutoplay();
    }

    clearTimers() {
      clearInterval(this.timer);
      clearInterval(this.progressTimer);
      this.timer = null;
      this.progressTimer = null;
    }

    animateProgress() {
      if (!this.progressBar || !this.interval) return;

      this.progressBar.style.width = "0%";
      this.progressStart = Date.now();
      const duration = this.interval;

      clearInterval(this.progressTimer);

      this.progressTimer = setInterval(() => {
        const elapsed = Date.now() - this.progressStart;
        const pct = Math.min((elapsed / duration) * 100, 100);
        this.progressBar.style.width = `${pct}%`;
        if (pct >= 100) clearInterval(this.progressTimer);
      }, 16);
    }
  }

  
  function initCounters() {
    const counters = document.querySelectorAll("[data-counter]");
    if (!counters.length) return;

    const animateCounter = (el) => {
      const target = parseInt(el.dataset.target, 10);
      const suffix = el.dataset.suffix || "";
      const duration = prefersReducedMotion ? 0 : 2000;
      const start = performance.now();

      function formatValue(val) {
        if (val >= 1000) {
          return val.toLocaleString("en-US") + suffix;
        }
        return val + suffix;
      }

      if (duration === 0) {
        el.textContent = formatValue(target);
        return;
      }

      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(eased * target);
        el.textContent = formatValue(current);
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = formatValue(target);
      }

      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.35 }
    );

    counters.forEach((counter) => observer.observe(counter));
  }

  
  function initShowreel() {
    const video = document.getElementById("showreel-video");
    const playBtn = document.getElementById("showreel-play-btn");
    const pauseBtn = document.getElementById("showreel-pause-btn");
    if (!video || !playBtn || !pauseBtn) return;

    function setPlaying(playing) {
      playBtn.disabled = playing;
      pauseBtn.disabled = !playing;
    }

    playBtn.addEventListener("click", () => {
      video.play().then(() => setPlaying(true)).catch(() => {});
    });

    pauseBtn.addEventListener("click", () => {
      video.pause();
      setPlaying(false);
    });

    video.addEventListener("ended", () => setPlaying(false));
    video.addEventListener("pause", () => {
      if (video.paused) setPlaying(false);
    });
    video.addEventListener("play", () => setPlaying(true));

    setPlaying(!video.paused && !video.ended);
  }

  function initShowreelBenefits() {
    const panel = document.querySelector("[data-showreel-panel]");
    if (!panel) return;

    const items = Array.from(panel.querySelectorAll("[data-showreel-benefit]"));
    if (items.length < 2) return;

    let index = 0;
    let timer = null;
    const interval = 4500;

    const setActive = (i) => {
      index = ((i % items.length) + items.length) % items.length;
      items.forEach((item, idx) => {
        item.classList.toggle("is-active", idx === index);
      });
    };

    const startLoop = () => {
      clearInterval(timer);
      if (!prefersReducedMotion) {
        timer = setInterval(() => setActive(index + 1), interval);
      }
    };

    const pauseLoop = () => clearInterval(timer);

    items.forEach((item, i) => {
      item.addEventListener("mouseenter", () => {
        pauseLoop();
        setActive(i);
      });
      item.addEventListener("focus", () => {
        pauseLoop();
        setActive(i);
      });
      item.addEventListener("click", () => {
        pauseLoop();
        setActive(i);
        startLoop();
      });
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          pauseLoop();
          setActive(i);
          startLoop();
        }
      });
    });

    panel.addEventListener("mouseleave", startLoop);
    panel.addEventListener("focusout", (e) => {
      if (!panel.contains(e.relatedTarget)) startLoop();
    });

    setActive(0);
    startLoop();
  }

  
  function initPricing() {
    const monthlyBtn = document.getElementById("pricing-monthly");
    const annualBtn = document.getElementById("pricing-annual");
    const amounts = document.querySelectorAll(".pricing-card__amount");

    if (!monthlyBtn || !annualBtn || !amounts.length) return;

    function setPeriod(period) {
      const isMonthly = period === "monthly";

      monthlyBtn.classList.toggle("is-active", isMonthly);
      annualBtn.classList.toggle("is-active", !isMonthly);
      monthlyBtn.setAttribute("aria-pressed", isMonthly ? "true" : "false");
      annualBtn.setAttribute("aria-pressed", !isMonthly ? "true" : "false");

      amounts.forEach((el) => {
        const price = isMonthly ? el.dataset.priceMonthly : el.dataset.priceAnnual;
        el.textContent = `$${price}`;
      });
    }

    monthlyBtn.addEventListener("click", () => setPeriod("monthly"));
    annualBtn.addEventListener("click", () => setPeriod("annual"));
  }

  
  function initNewsletter() {
    const form = document.getElementById("newsletter-form");
    const input = document.getElementById("newsletter-email");
    const message = document.getElementById("newsletter-message");

    if (!form || !input || !message) return;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const email = input.value.trim();
      message.classList.remove("is-success", "is-error");
      message.textContent = "";

      if (!email) {
        message.textContent = "Please enter your email address.";
        message.classList.add("is-error");
        input.focus();
        return;
      }

      if (!emailPattern.test(email)) {
        message.textContent = "Please enter a valid email address.";
        message.classList.add("is-error");
        input.focus();
        return;
      }

      message.textContent = "Thank you for subscribing! Redirecting…";
      message.classList.add("is-success");
      input.disabled = true;
      form.querySelector('button[type="submit"]').disabled = true;

      setTimeout(() => {
        window.location.href = "404.html";
      }, 2000);
    });
  }

  function initBackToTop() {
    const btn = document.getElementById("back-to-top");
    if (!btn) return;

    const showAt = 400;

    function toggleVisibility() {
      const visible = window.scrollY > showAt;
      btn.classList.toggle("is-visible", visible);
      btn.hidden = !visible;
    }

    toggleVisibility();
    window.addEventListener("scroll", toggleVisibility, { passive: true });

    btn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    });
  }

  function initFooterYear() {
    const yearEl = document.getElementById("footer-year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  
  function initMediaPreferences() {
    const heroVideo = document.querySelector(".hero__video");
    const showreelVideo = document.getElementById("showreel-video");

    if (prefersReducedMotion || prefersReducedData) {
      [heroVideo, showreelVideo].forEach((video) => {
        if (!video) return;
        video.removeAttribute("autoplay");
        video.pause();
      });
    }

    if (prefersReducedData && heroVideo) {
      heroVideo.querySelectorAll("source").forEach((s) => s.remove());
    }
  }
})();


