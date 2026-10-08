/* =====================================================================
   BRYAN RONNIE BRIONES — portfolio interactions
   Nav state, mobile menu, scroll reveals, counters, subtle parallax.
   Everything degrades to a fully visible static page without JS.
   ===================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- hero entrance ---------- */
  // setTimeout (not rAF) so the entrance still runs in a tab that loads in the background
  function start() { setTimeout(function () { root.classList.add('is-loaded'); }, 30); }
  if (document.fonts && document.fonts.ready) {
    var started = false;
    var go = function () { if (!started) { started = true; start(); } };
    document.fonts.ready.then(go);
    setTimeout(go, 700); // don't wait forever on slow font loads
  } else {
    start();
  }

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- nav: scrolled state ---------- */
  var nav = document.getElementById('nav');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      nav.classList.toggle('is-scrolled', window.scrollY > 24);
      updateParallax();
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- mobile menu ---------- */
  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu');
  var menuOpen = false;

  function setMenu(open) {
    menuOpen = open;
    menu.classList.toggle('is-open', open);
    nav.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      menu.removeAttribute('inert');
      var first = menu.querySelector('a');
      if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 60);
    } else {
      menu.setAttribute('inert', '');
    }
  }
  burger.addEventListener('click', function () { setMenu(!menuOpen); });
  menu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menuOpen) { setMenu(false); burger.focus(); }
  });
  window.matchMedia('(min-width: 1041px)').addEventListener('change', function (e) {
    if (e.matches && menuOpen) setMenu(false);
  });

  /* ---------- active section in nav ---------- */
  var links = {};
  document.querySelectorAll('[data-nav-link]').forEach(function (a) { links[a.getAttribute('data-nav-link')] = a; });
  var sections = document.querySelectorAll('[data-nav]');
  if ('IntersectionObserver' in window) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var key = entry.target.getAttribute('data-nav');
        Object.keys(links).forEach(function (k) {
          var on = k === key;
          links[k].classList.toggle('is-active', on);
          if (on) links[k].setAttribute('aria-current', 'true'); else links[k].removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { navIO.observe(s); });
  }

  /* ---------- reveals + stagger ---------- */
  document.querySelectorAll('[data-stagger]').forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) { child.style.setProperty('--i', i); });
  });

  var revealEls = document.querySelectorAll('[data-reveal], [data-stagger]');
  if (reduced || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealIO.unobserve(entry.target);
        var counters = entry.target.querySelectorAll('[data-count]');
        counters.forEach(countUp);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { revealIO.observe(el); });
  }

  /* ---------- counters ---------- */
  function countUp(el) {
    if (reduced || el.dataset.counted) return;
    el.dataset.counted = '1';
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var dur = 1200, t0 = performance.now();
    function tick(now) {
      var k = Math.min(1, (now - t0) / dur);
      var eased = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(target * eased);
      if (k < 1) requestAnimationFrame(tick);
    }
    el.textContent = '0';
    requestAnimationFrame(tick);
  }

  /* ---------- subtle parallax (desktop only) ---------- */
  var parallaxEls = [];
  var parallaxOn = false;
  var desktopMQ = window.matchMedia('(min-width: 1001px)');
  function collectParallax() {
    parallaxOn = !reduced && desktopMQ.matches;
    parallaxEls = parallaxOn ? Array.prototype.slice.call(document.querySelectorAll('[data-parallax]')) : [];
    if (!parallaxOn) document.querySelectorAll('[data-parallax]').forEach(function (el) { el.style.transform = ''; });
  }
  function updateParallax() {
    if (!parallaxOn) return;
    var vh = window.innerHeight;
    parallaxEls.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var speed = parseFloat(el.getAttribute('data-parallax')) || 0;
      var offset = (r.top + r.height / 2 - vh / 2) * speed;
      el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
    });
  }
  collectParallax();
  desktopMQ.addEventListener('change', function () { collectParallax(); updateParallax(); });
  updateParallax();

  /* ---------- copy email ---------- */
  var copyBtn = document.querySelector('[data-copy]');
  var copyStatus = document.getElementById('copy-status');
  if (copyBtn) {
    var label = copyBtn.querySelector('.copy-label');
    var resetT;
    copyBtn.addEventListener('click', function () {
      var text = copyBtn.getAttribute('data-copy');
      var done = function () {
        copyBtn.classList.add('is-copied');
        label.textContent = 'Copied!';
        if (copyStatus) copyStatus.textContent = 'Email address copied to clipboard';
        clearTimeout(resetT);
        resetT = setTimeout(function () {
          copyBtn.classList.remove('is-copied');
          label.textContent = 'Copy email';
          if (copyStatus) copyStatus.textContent = '';
        }, 2200);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, function () { window.location.href = 'mailto:' + text; });
      } else {
        window.location.href = 'mailto:' + text;
      }
    });
  }
})();
