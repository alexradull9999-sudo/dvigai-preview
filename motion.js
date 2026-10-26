/* Page-owned choreography; Scroll Craft's shared runtime remains unchanged. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  let paused = reduced.matches || document.body.classList.contains('motion-paused');
  const targets = [], controllers = [];
  const pauseButton = $('.journey-pause');

  // Preserve actual text and semantics while masking each authored heading line.
  $$('.hero h1,.approach-heading h2,.case-heading h2,.services-heading h2,.start-heading h2,.founder-copy h2,.scope-intro h2,.faq h2,.contact h2').forEach(heading => {
    const source = [...heading.childNodes];
    let line, index = 0;
    const newLine = () => {
      const mask = document.createElement('span'); mask.className = 'motion-line';
      mask.style.setProperty('--line-index', String(index++));
      line = document.createElement('span'); line.className = 'motion-line-inner';
      mask.append(line); heading.append(mask);
    };
    source.forEach(node => node.remove()); newLine();
    source.forEach(node => { if (node.nodeName === 'BR') newLine(); else line.append(node); });
    heading.classList.add('motion-heading'); targets.push(heading);
  });
  $$('.hero-brand,.hero-explainer,.approach-heading .section-intro,.worktable,.case-copy,.b2b-case,.services-heading>p,.start-heading>p,.priority-sheet,.founder-statement,.responsibility-list,.founder-facts,.scope-intro>p,.faq-list,.contact-intro>p:last-of-type,.contact-card').forEach(el => { el.classList.add('motion-rise'); targets.push(el); });
  $$('.case-art,.education-art,.founder-photo').forEach(el => { el.classList.add('motion-media'); targets.push(el); });
  $$('.scope-list details').forEach((el, i) => { el.classList.add('motion-card'); el.style.setProperty('--reveal-delay', `${i * 60}ms`); targets.push(el); });
  $$('.service-card,.start-step').forEach((el, i) => { el.classList.add('motion-card'); el.style.setProperty('--reveal-delay', `${i % 3 * 65}ms`); targets.push(el); });
  targets.forEach(el => el.classList.add('motion-reveal'));
  const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible'); reveal.unobserve(entry.target);
  }), { threshold: .08, rootMargin: '0px 0px -5% 0px' });
  targets.forEach(el => reveal.observe(el));
  document.addEventListener('focusin', event => {
    let el = event.target;
    while (el && el !== document.body) { if (el.classList?.contains('motion-reveal')) el.classList.add('is-visible'); el = el.parentElement; }
  });

  // Native details keep keyboard operation and readable no-JS fallback.
  $$('.scope-list details,.faq-list details').forEach(detail => {
    const summary = $('summary', detail); if (!summary) return;
    let animation = null, expanded = detail.open, touched = false;
    const controller = {
      detail,
      get touched() { return touched; },
      setOpen(open, manual = false) {
        if (manual) touched = true;
        if (!animation && expanded === open) return;
        expanded = open;
        const from = detail.offsetHeight;
        if (animation) { animation.cancel(); animation = null; }
        detail.style.height = ''; detail.style.overflow = '';
        if (paused || !detail.animate) { detail.open = open; return; }
        detail.open = true;
        const to = open ? detail.offsetHeight : summary.offsetHeight;
        detail.style.overflow = 'hidden';
        detail.classList.toggle('is-expanding', open);
        animation = detail.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: open ? 650 : 430, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' });
        animation.onfinish = () => {
          detail.open = expanded; detail.style.height = ''; detail.style.overflow = ''; detail.classList.remove('is-expanding');
          const done = animation; animation = null; done?.cancel();
          window.dispatchEvent(new CustomEvent('dvigai:layout'));
        };
      },
      settle() {
        if (animation) { animation.cancel(); animation = null; }
        detail.open = expanded; detail.style.height = ''; detail.style.overflow = ''; detail.classList.remove('is-expanding');
      }
    };
    summary.addEventListener('click', event => { event.preventDefault(); controller.setOpen(!expanded, true); });
    controllers.push(controller);
  });
  // Do not expand skipped cards during a navigation jump: changing their
  // height would move the contact target while native smooth scroll runs.
  let anchorNavigation = false, anchorTimer = 0;
  const scope = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting || anchorNavigation) return;
    const controller = controllers.find(item => item.detail === entry.target);
    if (controller && !controller.touched) controller.setOpen(true);
    scope.unobserve(entry.target);
  }), { rootMargin: '0px 0px -22% 0px', threshold: .15 });
  controllers.filter(item => item.detail.closest('.scope-list')).forEach(item => scope.observe(item.detail));
  function finishAnchorNavigation() {
    if (!anchorNavigation) return;
    anchorNavigation = false; clearTimeout(anchorTimer);
    controllers.filter(item => item.detail.closest('.scope-list') && !item.touched).forEach(item => {
      scope.unobserve(item.detail); scope.observe(item.detail);
    });
  }
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href^="#"]');
    if (!link || link.getAttribute('href') === '#') return;
    anchorNavigation = true; clearTimeout(anchorTimer);
    // Fallback for browsers without scrollend and for links already in view.
    anchorTimer = setTimeout(finishAnchorNavigation, 1800);
  }, true);
  document.addEventListener('scrollend', finishAnchorNavigation);
  window.addEventListener('wheel', finishAnchorNavigation, {passive:true});
  window.addEventListener('touchstart', finishAnchorNavigation, {passive:true});

  // Pointer motion stays on artwork; reading text and control hit targets stay still.
  const states = $$('.case-art,.education-art,.founder-photo').map(el => ({ el, x: 0, y: 0, tx: 0, ty: 0 }));
  let pointerFrame = 0;
  function paintPointers() {
    pointerFrame = 0;
    if (paused || document.hidden || !fine.matches) return;
    let moving = false;
    states.forEach(s => {
      s.x += (s.tx - s.x) * .13; s.y += (s.ty - s.y) * .13;
      if (Math.abs(s.tx - s.x) + Math.abs(s.ty - s.y) > .002) moving = true;
      s.el.style.setProperty('--pointer-x', s.x.toFixed(4)); s.el.style.setProperty('--pointer-y', s.y.toFixed(4));
    });
    if (moving) pointerFrame = requestAnimationFrame(paintPointers);
  }
  const queuePointers = () => { if (!pointerFrame) pointerFrame = requestAnimationFrame(paintPointers); };
  function resetPointers() {
    if (pointerFrame) cancelAnimationFrame(pointerFrame); pointerFrame = 0;
    states.forEach(s => { s.x = s.y = s.tx = s.ty = 0; s.el.style.setProperty('--pointer-x', '0'); s.el.style.setProperty('--pointer-y', '0'); });
  }
  states.forEach(s => {
    s.el.addEventListener('pointermove', event => {
      if (paused || !fine.matches || event.pointerType !== 'mouse') return;
      const box = s.el.getBoundingClientRect();
      s.tx = (event.clientX - box.left) / box.width - .5; s.ty = (event.clientY - box.top) / box.height - .5; queuePointers();
    }, { passive: true });
    s.el.addEventListener('pointerleave', () => { s.tx = s.ty = 0; queuePointers(); });
  });
  fine.addEventListener('change', resetPointers);
  const visibleScenes = new Set(); let sceneFrame = 0;
  function paintScenes() {
    sceneFrame = 0; if (paused || document.hidden) return;
    visibleScenes.forEach(el => {
      const r = el.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (innerHeight - r.top) / (innerHeight + r.height)));
      el.style.setProperty('--scene-progress', progress.toFixed(4));
    });
  }
  function queueScenes() { if (!sceneFrame && !paused && !document.hidden) sceneFrame = requestAnimationFrame(paintScenes); }
  const scenes = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) visibleScenes.add(entry.target); else visibleScenes.delete(entry.target); }); queueScenes();
  });
  $$('.education-art,.founder-photo').forEach(el => scenes.observe(el));
  window.addEventListener('scroll', queueScenes, { passive: true });
  window.addEventListener('resize', () => { controllers.forEach(c => c.settle()); queueScenes(); }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { resetPointers(); if (sceneFrame) cancelAnimationFrame(sceneFrame); sceneFrame = 0; }
    else queueScenes();
  });
  function syncPause() {
    if (pauseButton) {
      pauseButton.disabled = reduced.matches; pauseButton.setAttribute('aria-pressed', String(paused));
      pauseButton.setAttribute('aria-label', reduced.matches ? 'Анимация отключена в системе' : paused ? 'Включить анимацию' : 'Остановить анимацию');
      if (pauseButton.firstElementChild) pauseButton.firstElementChild.textContent = paused ? '▷' : 'Ⅱ';
    }
    if (paused) {
      targets.forEach(el => el.classList.add('is-visible')); controllers.forEach(c => c.settle()); resetPointers();
      if (sceneFrame) cancelAnimationFrame(sceneFrame); sceneFrame = 0;
    } else queueScenes();
  }
  pauseButton?.addEventListener('click', () => $('.motion-toggle')?.click());
  window.addEventListener('dvigai:motion', event => { paused = event.detail.paused; syncPause(); });
  document.documentElement.classList.add('motion-ready'); syncPause();
})();
