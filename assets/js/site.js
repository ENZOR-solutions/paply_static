/* Paply marketing site behaviour. No dependencies. Every feature is optional:
   each block bails out when its markup isn't on the page. */
(function () {
  'use strict';

  var doc = document.documentElement;
  doc.classList.add('js');
  var lang = document.body.getAttribute('data-lang') || 'en';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DESKTOP = 960; // keep in sync with the header breakpoint in site.css
  var LANGS = ['en', 'sl', 'hr'];

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function store(key, value) {
    try { if (value === undefined) return localStorage.getItem(key); localStorage.setItem(key, value); } catch (e) { return null; }
  }

  /* ---------------------------------------------------------- language */
  // Remember an explicit choice; on a first visit to an English page, follow
  // the browser language once (crawlers report en-US, so they stay on English).
  $$('[data-lang-choice]').forEach(function (a) {
    if (a.getAttribute('data-lang-choice') === lang) a.setAttribute('aria-current', 'true');
    a.addEventListener('click', function () { store('paply-lang', a.getAttribute('data-lang-choice')); });
  });
  (function autoLang() {
    if (lang !== 'en' || store('paply-lang') || /bot|crawl|spider|lighthouse/i.test(navigator.userAgent)) return;
    var prefs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'];
    for (var i = 0; i < prefs.length; i++) {
      var code = String(prefs[i]).toLowerCase().slice(0, 2);
      if (code === 'en') break;
      if (LANGS.indexOf(code) !== -1) {
        var link = $('.lang-list [data-lang-choice="' + code + '"]');
        store('paply-lang', code);
        if (link) location.replace(link.getAttribute('href') + location.hash);
        return;
      }
    }
  })();

  /* ---------------------------------------------------------- header */
  var header = $('#site-header');
  function onScroll() { if (header) header.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Close the language dropdown on outside click / Escape.
  $$('.lang-menu').forEach(function (d) {
    document.addEventListener('click', function (e) { if (d.open && !d.contains(e.target)) d.open = false; });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') d.open = false; });
  });

  /* ---------------------------------------------------------- mobile menu */
  // Height animates via max-height read from scrollHeight on every open, so
  // adding/removing links needs no JS change.
  (function () {
    var btn = $('#mobile-menu-btn'), menu = $('#mobile-menu');
    var iconOpen = $('#menu-icon-open'), iconClose = $('#menu-icon-close');
    if (!btn || !menu) return;
    function openMenu() {
      menu.classList.add('open');
      menu.style.maxHeight = menu.scrollHeight + 'px';
      btn.setAttribute('aria-expanded', 'true');
      iconOpen.classList.add('hidden'); iconClose.classList.remove('hidden');
    }
    function closeMenu() {
      menu.classList.remove('open');
      menu.style.maxHeight = '0px';
      btn.setAttribute('aria-expanded', 'false');
      iconOpen.classList.remove('hidden'); iconClose.classList.add('hidden');
    }
    btn.addEventListener('click', function () { btn.getAttribute('aria-expanded') === 'true' ? closeMenu() : openMenu(); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { closeMenu(); btn.focus(); } });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= DESKTOP) closeMenu();
      else if (btn.getAttribute('aria-expanded') === 'true') menu.style.maxHeight = menu.scrollHeight + 'px';
    });
  })();

  /* ---------------------------------------------------------- in-page anchors */
  // Offset by the live header height (taller while the mobile menu is open).
  $$('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var hash = link.getAttribute('href');
      if (!hash || hash === '#' || link.classList.contains('skip-link')) return;
      var target = document.getElementById(hash.slice(1));
      if (!target) return;
      e.preventDefault();
      var sticky = $('.jump-nav');
      var offset = (header ? header.offsetHeight : 0) + (sticky ? sticky.offsetHeight : 0) + 16;
      window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - offset, behavior: reduceMotion ? 'auto' : 'smooth' });
      if (history.pushState) history.pushState(null, '', hash);
    });
  });

  /* ---------------------------------------------------------- reveal on scroll */
  var reveals = $$('.reveal, .timeline');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------------------------------------------------------- money format */
  var locale = { en: 'en-IE', sl: 'sl-SI', hr: 'hr-HR' }[lang] || 'en-IE';
  var money = (window.Intl && Intl.NumberFormat) ? new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }) : { format: function (n) { return '€' + n.toFixed(2); } };
  function eur(n) { return money.format(n); }
  function strings(root) {
    var out = {};
    $$('[data-k]', root).forEach(function (el) { out[el.getAttribute('data-k')] = el.textContent.trim(); });
    return out;
  }
  function animateNumber(el, from, to, ms) {
    if (reduceMotion) { el.textContent = eur(to); return; }
    var start = null;
    function step(t) {
      if (!start) start = t;
      var p = Math.min(1, (t - start) / ms), e = 1 - Math.pow(1 - p, 3);
      el.textContent = eur(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------------------------------------------------------- hero mock */
  (function () {
    var mock = $('#hero-mock'), rowsEl = $('#hero-rows'), toast = $('#hero-toast');
    if (!mock || !rowsEl) return;
    var S = strings($('#hero-strings'));
    var kIssued = $('[data-kpi="issued"]'), kAwait = $('[data-kpi="awaiting"]'), kPaid = $('[data-kpi="paid"]');
    var issued = 12480, awaiting = 3215.40, paid = 9264.60;
    kIssued.textContent = eur(issued); kAwait.textContent = eur(awaiting); kPaid.textContent = eur(paid);
    // Normalise the static amounts to the page locale.
    $$('.r-amt', rowsEl).forEach(function (el) { el.textContent = eur(parseFloat(el.textContent.replace(/[^0-9.]/g, ''))); });

    var customers = [
      ['Bistra Logistika d.o.o.', 'BL', 'av-blue', 244.00],
      ['Gradbenik Kos d.o.o.', 'GK', 'av-purple', 860.00],
      ['Pekarna Zrno d.o.o.', 'PZ', 'av-amber', 59.78],
      ['Alpin Tech d.o.o.', 'AT', 'av-green', 1220.00],
      ['Vita Klima d.o.o.', 'VK', 'av-red', 122.00],
      ['Mizarstvo Hrast s.p.', 'MH', 'av-teal', 29.28]
    ];
    var ci = 0, num = 21, timers = [], running = false, cycleTimer = null;
    var hex = '0123456789abcdef';
    function rnd(n) { var s = ''; for (var i = 0; i < n; i++) s += hex[Math.floor(Math.random() * 16)]; return s; }

    function showToast(title, sub) {
      if (!toast) return;
      $('[data-toast-title]', toast).textContent = title;
      $('[data-toast-sub]', toast).textContent = sub;
      toast.classList.remove('is-hidden');
      later(function () { toast.classList.add('is-hidden'); }, 1900);
    }
    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function setPill(pill, cls, label) {
      pill.className = 'pill ' + cls + ' changed';
      pill.textContent = label;
      later(function () { pill.classList.remove('changed'); }, 500);
    }
    function bump(el) { el.classList.add('bump'); later(function () { el.classList.remove('bump'); }, 700); }

    function cycle() {
      var c = customers[ci++ % customers.length];
      var number = '2026-0' + (num++);
      var row = document.createElement('div');
      row.className = 'mw-row is-new';
      row.innerHTML = '<span class="av ' + c[2] + '">' + c[1] + '</span><span class="r-name"></span><span class="r-amt"></span><span class="pill st-draft"></span>';
      $('.r-name', row).innerHTML = c[0].replace(/&/g, '&amp;').replace(/</g, '&lt;') + '<small>' + number + '</small>';
      $('.r-amt', row).textContent = eur(c[3]);
      var pill = $('.pill', row); pill.textContent = S.draft;
      rowsEl.insertBefore(row, rowsEl.firstChild);
      var rows = $$('.mw-row', rowsEl);
      if (rows.length > 4) {
        var last = rows[rows.length - 1];
        last.classList.add('is-leaving');
        later(function () { if (last.parentNode) last.parentNode.removeChild(last); }, 420);
      }
      later(function () { row.classList.remove('is-new'); }, 1200);
      later(function () {
        setPill(pill, 'st-fiscal', S.fiscal);
        showToast(S.t_fiscal, (S.t_fiscal_code || 'EOR') + ' ' + rnd(8) + '-' + rnd(4) + '…');
        animateNumber(kIssued, issued, issued + c[3], 700); issued += c[3]; bump(kIssued);
      }, 1400);
      later(function () {
        setPill(pill, 'st-sent', S.sent);
        showToast(S.t_sent, c[0]);
        animateNumber(kAwait, awaiting, awaiting + c[3], 700); awaiting += c[3]; bump(kAwait);
      }, 3400);
      later(function () {
        setPill(pill, 'st-paid', S.paid);
        showToast(S.t_paid + ' · ' + eur(c[3]), S.t_paid_sub);
        animateNumber(kAwait, awaiting, awaiting - c[3], 700); awaiting -= c[3];
        animateNumber(kPaid, paid, paid + c[3], 700); paid += c[3]; bump(kPaid);
      }, 5600);
    }
    function start() {
      if (running) return; running = true;
      cycle(); cycleTimer = setInterval(cycle, 7600);
    }
    function stop() {
      running = false; clearInterval(cycleTimer);
      timers.forEach(clearTimeout); timers = [];
    }
    if (toast) toast.classList.add('is-hidden');
    if (reduceMotion) return;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { en[0].isIntersecting && !document.hidden ? start() : stop(); }, { threshold: 0.25 }).observe(mock);
      document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); });
    } else { start(); }
  })();

  /* ---------------------------------------------------------- showcase tabs */
  $$('[data-showcase]').forEach(function (box) {
    var tabs = $$('[role="tab"]', box);
    var DURATION = 7000, timer = null, auto = !reduceMotion, visible = false;
    box.style.setProperty('--tab-ms', DURATION + 'ms');
    function select(i, focus) {
      tabs.forEach(function (t, j) {
        var on = i === j, panel = document.getElementById(t.getAttribute('aria-controls'));
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        panel.hidden = !on;
        panel.classList.toggle('is-active', on);
        // Restart the CSS progress bar.
        var bar = $('.tab-progress', t); if (bar && on) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
      });
      if (focus) tabs[i].focus();
      var strip = tabs[i].parentNode, t = tabs[i];
      if (strip.scrollWidth > strip.clientWidth) strip.scrollTo({ left: t.offsetLeft - (strip.clientWidth - t.offsetWidth) / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
      if (auto && visible) schedule();
    }
    var strip = tabs[0].parentNode;
    function edges() {
      strip.classList.toggle('can-scroll-l', strip.scrollLeft > 4);
      strip.classList.toggle('can-scroll-r', strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 4);
    }
    strip.addEventListener('scroll', edges, { passive: true });
    window.addEventListener('resize', edges);
    edges();
    function current() { for (var i = 0; i < tabs.length; i++) if (tabs[i].getAttribute('aria-selected') === 'true') return i; return 0; }
    function schedule() { clearTimeout(timer); timer = setTimeout(function () { select((current() + 1) % tabs.length); }, DURATION); }
    function stopAuto() { auto = false; clearTimeout(timer); box.classList.remove('is-auto'); }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { stopAuto(); select(i); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = null;
        if (k === 'ArrowRight') n = (i + 1) % tabs.length;
        if (k === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
        if (k === 'Home') n = 0;
        if (k === 'End') n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); stopAuto(); select(n, true); }
      });
    });
    box.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' && auto) { clearTimeout(timer); box.classList.remove('is-auto'); } });
    box.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && auto) { box.classList.add('is-auto'); select(current()); } });
    if (auto && 'IntersectionObserver' in window) {
      box.classList.add('is-auto');
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        if (visible && auto) select(current()); else clearTimeout(timer);
      }, { threshold: 0.35 }).observe(box);
    }
  });

  /* ---------------------------------------------------------- FAQ accordion */
  // Smooth height animation on top of native <details>; still works without JS.
  $$('details.faq').forEach(function (d) {
    var summary = $('summary', d), body = $('.faq-a', d);
    if (!summary || !body || reduceMotion || !body.animate) return;
    summary.addEventListener('click', function (e) {
      e.preventDefault();
      if (d.open) {
        var a = body.animate([{ height: body.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 220, easing: 'ease-out' });
        a.onfinish = function () { d.open = false; };
      } else {
        d.open = true;
        body.animate([{ height: '0px', opacity: 0 }, { height: body.offsetHeight + 'px', opacity: 1 }], { duration: 260, easing: 'ease-out' });
      }
    });
  });

  /* ---------------------------------------------------------- pricing estimator */
  (function () {
    var root = $('#estimator');
    if (!root) return;
    var S = strings(root);
    var range = $('#est-invoices', root), out = $('#est-invoices-out', root);
    var seatsOut = $('#est-seats-out', root), coreBox = $('#est-core', root);
    var planEl = $('#est-plan', root), costEl = $('#est-cost', root), breakEl = $('#est-break', root), noteEl = $('#est-note', root);
    var seats = 1, lastCost = 0;
    var EXTRA = 0.15;
    var PLANS = [
      { id: 'Free', price: 0, allow: 0, seats: 1, core: false },
      { id: 'Start', price: 12, allow: 50, seats: 2, core: false },
      { id: 'Core', price: 27, allow: 150, seats: 5, core: true },
      { id: 'Pro', price: 59, allow: 400, seats: 15, core: true }
    ];
    function fill(t, vars) { return t.replace(/\{(\w+)\}/g, function (_, k) { return vars[k] !== undefined ? vars[k] : ''; }); }
    function update() {
      var n = parseInt(range.value, 10), needCore = coreBox.checked;
      out.textContent = n >= 1500 ? '1,500+' : String(n);
      range.style.setProperty('--p', (n / parseInt(range.max, 10) * 100) + '%');
      seatsOut.textContent = seats >= 16 ? '15+' : String(seats);
      var best = null;
      PLANS.forEach(function (p) {
        if (p.seats < seats || (needCore && !p.core)) return;
        if (p.id === 'Free' && n > 0) return;
        var cost = p.price + Math.max(0, n - p.allow) * EXTRA;
        if (!best || cost < best.cost - 0.001) best = { plan: p, cost: cost };
      });
      var enterprise = n >= 1000 || seats > 15;
      if (enterprise) {
        planEl.textContent = 'Enterprise';
        costEl.innerHTML = '';
        costEl.textContent = S.custom;
        breakEl.textContent = S.ent_break;
        noteEl.textContent = '';
        return;
      }
      var p = best.plan, extra = Math.max(0, n - p.allow);
      planEl.textContent = p.id;
      animateNumberSuffix(costEl, lastCost, best.cost);
      lastCost = best.cost;
      breakEl.textContent = extra > 0
        ? fill(S.break_extra, { plan: p.id, price: eur(p.price), n: extra, extra: eur(EXTRA) })
        : (p.id === 'Free' ? S.break_free : fill(S.break_incl, { plan: p.id, allow: p.allow }));
      noteEl.textContent = p.id === 'Free' ? '' : S.note;
    }
    function animateNumberSuffix(el, from, to) {
      var span = document.createElement('span'); var small = document.createElement('small');
      small.textContent = ' ' + S.per_month;
      el.textContent = ''; el.appendChild(span); el.appendChild(small);
      animateNumber(span, from, to, 450);
    }
    range.addEventListener('input', update);
    coreBox.addEventListener('change', update);
    $('#est-seats-minus', root).addEventListener('click', function () { seats = Math.max(1, seats - 1); update(); });
    $('#est-seats-plus', root).addEventListener('click', function () { seats = Math.min(16, seats + 1); update(); });
    update();
  })();

  /* ---------------------------------------------------------- screenshot gallery */
  $$('[data-gallery]').forEach(function (wrap) {
    var strip = $('.gallery', wrap), prev = $('.prev', wrap), next = $('.next', wrap);
    if (!strip || !prev || !next) return;
    function step() { var s = $('.shot', strip); return s ? s.offsetWidth + 20 : 280; }
    function sync() {
      prev.disabled = strip.scrollLeft < 8;
      next.disabled = strip.scrollLeft + strip.clientWidth > strip.scrollWidth - 8;
    }
    prev.addEventListener('click', function () { strip.scrollBy({ left: -step(), behavior: reduceMotion ? 'auto' : 'smooth' }); });
    next.addEventListener('click', function () { strip.scrollBy({ left: step(), behavior: reduceMotion ? 'auto' : 'smooth' }); });
    strip.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  });

  /* ---------------------------------------------------------- scroll-spy (TOC + jump nav) */
  // Active = the last section whose top has passed ~35% of the viewport.
  $$('[data-spy]').forEach(function (nav) {
    var links = $$('a[href^="#"]', nav);
    var pairs = links.map(function (a) { return [a, document.getElementById(a.getAttribute('href').slice(1))]; }).filter(function (p) { return p[1]; });
    if (!pairs.length) return;
    var current = null, ticking = false;
    function update() {
      ticking = false;
      var line = window.innerHeight * 0.35, active = null;
      pairs.forEach(function (p) { if (p[1].getBoundingClientRect().top <= line) active = p[0]; });
      if (active === current) return;
      current = active;
      links.forEach(function (a) { a.classList.toggle('is-active', a === active); });
      if (active && nav.classList.contains('jump-nav')) {
        var row = active.parentNode;
        row.scrollTo({ left: active.offsetLeft - 20, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  });
})();
