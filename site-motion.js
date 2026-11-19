(() => {
  'use strict';

  const { gsap, ScrollTrigger, Lenis, Motion } = window;
  if (!gsap || !ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);

  const motion = '(prefers-reduced-motion: no-preference)';
  const desktop = '(min-width: 961px) and (hover: hover) and (pointer: fine)';
  const media = gsap.matchMedia();

  function reveal(trigger, build, start = 'top 86%') {
    const section = document.querySelector(trigger);
    const timeline = gsap.timeline({
      paused: true,
      defaults: { duration: 0.7, ease: 'power3.out', immediateRender: false }
    });
    build(timeline);

    ScrollTrigger.create({
      trigger: section,
      start,
      once: true,
      onEnter() {
        if (section.getBoundingClientRect().bottom > 77) timeline.play();
      }
    });
  }

  function rise(timeline, targets, position, distance = 22, stagger = 0.08) {
    timeline.fromTo(targets, { y: distance, opacity: 0.5 }, {
      y: 0, opacity: 1, stagger, clearProps: 'transform,opacity'
    }, position);
  }

  function headerEntrance() {
    const header = document.querySelector('.site-header');
    if (window.scrollY > 48 || location.hash || header.contains(document.activeElement)) return;

    const brand = header.querySelector('.brand-lockup');
    const actions = header.querySelector('.site-header__actions');
    const links = [...header.querySelectorAll('.site-nav__list > li')].filter(link => link.getClientRects().length);
    const intro = gsap.timeline({
      defaults: { duration: .92, ease: 'power3.out', clearProps: 'transform,opacity' }
    });

    intro.from(brand, { x: -brand.getBoundingClientRect().right - 12 }, 0);
    intro.from(actions, { x: innerWidth - actions.getBoundingClientRect().left + 12 }, 0);
    if (links.length) {
      const middle = (links.length - 1) / 2;
      intro.from(links, {
        x: (index) => (index - middle) * 78,
        y: -12,
        opacity: 0,
        duration: .76,
        stagger: { each: .06, from: 'center' }
      }, .12);
    }

    const settle = () => intro.progress(1);
    const cleanup = () => header.removeEventListener('focusin', settle);
    header.addEventListener('focusin', settle);
    intro.eventCallback('onComplete', cleanup);
    return cleanup;
  }

  function heroEntrance() {
    if (window.scrollY > 48 || location.hash) return;

    const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
    intro
      .fromTo('.hero__shutter--left', { xPercent: 0, opacity: 1 }, {
        xPercent: -102, duration: 1.08, ease: 'power3.inOut', clearProps: 'transform,opacity'
      }, 0)
      .fromTo('.hero__shutter--right', { xPercent: 0, opacity: 1 }, {
        xPercent: 102, duration: 1.08, ease: 'power3.inOut', clearProps: 'transform,opacity'
      }, 0)
      .from('.hero__byline', { y: 12, opacity: 0, duration: 0.68, clearProps: 'transform,opacity' }, 0.2)
      .from('.hero__title-line > *', {
        yPercent: 106, opacity: 0.12, duration: 0.8, stagger: 0.12, clearProps: 'transform,opacity'
      }, 0.26)
      .from('.hero__lead', { y: 14, opacity: 0.4, duration: 0.66, clearProps: 'transform,opacity' }, 0.55)
      .from('.hero-action-bar', { y: 10, opacity: 0.63, duration: 0.63, clearProps: 'transform,opacity' }, 0.63)
      .from('.hero-concierge__portrait', {
        y: 16, rotate: 12, scale: .74, opacity: 0, duration: .47,
        ease: 'back.out(1.75)', clearProps: 'transform,opacity'
      }, .73)
      .fromTo('.hero-concierge__message', { clipPath: 'inset(0 100% 0 0)' }, {
        clipPath: 'inset(0 0% 0 0)', duration: .46, clearProps: 'clipPath'
      }, .91)
      .fromTo('.hero-concierge__ripple', { scale: .96, opacity: .75 }, {
        scale: 1.55, opacity: 0, duration: .68, clearProps: 'transform,opacity'
      }, .98);
  }

  function heroWalkthrough() {
    const stage = document.querySelector('.hero__stage');
    gsap.timeline({
      scrollTrigger: {
        trigger: '.hero',
        pin: stage,
        start: () => `top ${Math.min(77, innerHeight - stage.offsetHeight)}px`,
        end: () => `+=${gsap.utils.clamp(360, 620, Math.round(innerHeight * .68))}`,
        scrub: .25,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    })
      .set('.hero__door', { opacity: 1, transformPerspective: 1100 }, .005)
      .set('.hero__room', { opacity: 1 }, .01)
      .fromTo('.hero__room img', { scale: 1.22, xPercent: -5 }, {
        scale: 1, xPercent: 0, duration: 1, ease: 'power1.out'
      }, 0)
      .to('.hero__door--left', {
        rotationY: 74, xPercent: -29, duration: .87, ease: 'power1.inOut'
      }, .02)
      .to('.hero__door--right', {
        rotationY: -74, xPercent: 29, duration: .87, ease: 'power1.inOut'
      }, .02)
      .to('.hero__door', { opacity: 0, duration: .34 }, .51)
      .to('.hero__copy', { y: -36, duration: .9, ease: 'power2.out' }, .1);
  }

  function setupReviews() {
    const gallery = document.querySelector('#reviews');
    const stage = gallery.querySelector('.review-gallery__stage');
    const vortex = gallery.querySelector('.review-gallery__vortex');
    const controls = gallery.querySelector('.review-gallery__controls');
    const counter = controls.querySelector('.review-gallery__count');
    const timer = controls.querySelector('.review-gallery__timer');
    const status = gallery.querySelector('#review-status');
    const cards = [...stage.querySelectorAll('.review-card')];
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const position = { turn: 0, gust: 0 };
    const count = cards.length;
    const format = (number) => String(number).padStart(2, '0');
    const wrap = gsap.utils.wrap(0, count);
    let orbitWidth = 0;
    let activeIndex;
    let target = 0;
    let rotation;
    let pointerStart;
    let autoplayClock;
    let started = false;
    let introducing = false;
    let inView = false;
    let focusPaused = false;
    const dwell = 3.8;

    function draw() {
      const { turn, gust } = position;
      const active = wrap(introducing ? target : Math.round(turn));
      const lift = Math.min(48, orbitWidth * .28);
      vortex.style.setProperty('--review-gust', gust);
      vortex.style.setProperty('--review-spin', `${turn * 360 / count}deg`);
      cards.forEach((card, index) => {
        const angle = ((index - turn) % count) * Math.PI * 2 / count;
        const lateral = Math.sin(angle);
        const depth = Math.cos(angle);
        const x = lateral * orbitWidth * (1 - gust * (.2 + depth * .16));
        const y = (depth - 1) * 26 + gust * Math.sin(angle * 2 + turn * .54) * lift;
        const z = (depth - 1) * (295 + gust * 120);
        const yaw = lateral * (-55 - gust * 24);
        const roll = gust * (lateral * -23 + 5);
        const pitch = gust * (depth * -22 + 8);
        const scale = 1 - gust * (.14 + (1 - depth) * .08);
        card.style.transform = reduced.matches ? '' :
          `translate3d(${x}px, ${y}px, ${z}px) rotateY(${yaw}deg) rotateX(${pitch}deg) rotateZ(${roll}deg) scale(${scale})`;
        card.style.opacity = reduced.matches ? '' :
          Math.max(0, (depth + .2 + gust * .82) / (1.2 + gust * .82));
        card.style.zIndex = String(Math.round(depth * 100));
      });
      if (active !== activeIndex) {
        cards.forEach((card, index) => card.setAttribute('aria-hidden', String(index !== active)));
        activeIndex = active;
        counter.textContent = `${format(active + 1)} / ${format(count)}`;
      }
    }

    function clearAutoplay() {
      autoplayClock?.kill();
      gsap.set(timer, { '--review-progress': 0 });
    }

    function queueAutoplay() {
      clearAutoplay();
      if (!inView || document.hidden || reduced.matches ||
          focusPaused || pointerStart || rotation) return;
      if (!started) {
        autoplayClock = gsap.delayedCall(.24, enterCyclone);
        return;
      }
      autoplayClock = gsap.to(timer, {
        '--review-progress': 1,
        duration: dwell,
        ease: 'none',
        onComplete: () => step(1, false)
      });
    }

    function rotationTimeline() {
      rotation?.kill();
      rotation = gsap.timeline({
        onUpdate: draw,
        onComplete() {
          introducing = false;
          rotation = undefined;
          draw();
          queueAutoplay();
        }
      });
      return rotation;
    }

    function enterCyclone() {
      started = true;
      introducing = true;
      target += count;
      rotationTimeline()
        .to(position, { gust: 1, duration: .25, ease: 'power2.out' }, 0)
        .to(position, { turn: target - 1.45, duration: .68, ease: 'sine.in' }, 0)
        .to(position, { turn: target, duration: 1.1, ease: 'power3.out' }, .68)
        .to(position, { gust: 0, duration: 1.18, ease: 'power2.out' }, .6);
    }

    function step(direction, announce = true) {
      clearAutoplay();
      started = true;
      target = (introducing ? Math.round(position.turn) : target) + direction;
      introducing = false;
      if (announce) {
        const index = wrap(target);
        status.textContent = `Example ${index + 1} of ${count}. ${cards[index].querySelector('p').textContent}`;
      }
      if (reduced.matches) {
        position.turn = target;
        position.gust = 0;
        draw();
        return;
      }
      rotationTimeline()
        .to(position, { turn: target, duration: .98, ease: 'power3.inOut' }, 0)
        .to(position, { gust: announce ? .28 : .65, duration: .36, ease: 'sine.inOut' }, 0)
        .to(position, { gust: 0, duration: .62, ease: 'power2.out' }, .36);
    }

    const sizeOrbit = () => {
      const width = stage.clientWidth;
      orbitWidth = Math.min(448, width * (width < 560 ? .49 : .4));
      draw();
    };

    gallery.classList.add('has-carousel');
    controls.hidden = false;
    sizeOrbit();
    new ResizeObserver(sizeOrbit).observe(stage);
    new IntersectionObserver(([entry]) => {
      inView = entry.intersectionRatio >= .2;
      queueAutoplay();
    }, { rootMargin: '-77px 0px 0px 0px', threshold: .2 }).observe(stage);
    document.addEventListener('visibilitychange', queueAutoplay);

    controls.addEventListener('focusin', (event) => {
      focusPaused = event.target.matches(':focus-visible');
      queueAutoplay();
    });
    controls.addEventListener('focusout', (event) => {
      if (!controls.contains(event.relatedTarget)) {
        focusPaused = false;
        queueAutoplay();
      }
    });
    controls.querySelectorAll('[data-review-step]').forEach((button) => {
      button.addEventListener('click', () => step(Number(button.dataset.reviewStep)));
    });
    controls.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        step(event.key === 'ArrowRight' ? 1 : -1);
      }
    });
    stage.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || event.pointerType === 'mouse') return;
      pointerStart = { x: event.clientX, y: event.clientY };
      queueAutoplay();
    });
    stage.addEventListener('pointerup', (event) => {
      if (!event.isPrimary || !pointerStart) return;
      const x = event.clientX - pointerStart.x;
      const y = event.clientY - pointerStart.y;
      pointerStart = undefined;
      if (Math.abs(x) > 40 && Math.abs(x) > Math.abs(y)) step(x < 0 ? 1 : -1);
      else queueAutoplay();
    });
    stage.addEventListener('pointercancel', () => {
      pointerStart = undefined;
      queueAutoplay();
    });
    reduced.addEventListener('change', () => {
      rotation?.kill();
      rotation = undefined;
      introducing = false;
      position.turn = target;
      position.gust = 0;
      draw();
      queueAutoplay();
    });
  }

  setupReviews();

  function interactionMotion() {
    if (!Motion) return;
    const controls = new Map();
    const start = (element, keyframes, options) => {
      controls.get(element)?.cancel();
      controls.set(element, Motion.animate(element, keyframes, options));
    };

    let active = true;
    const removeHover = Motion.hover('.path-trigger, .hero-action-bar__cta, #send-estimate-to-terry-btn',
      (element) => {
        const arrow = element.querySelector('.motion-arrow, .path-trigger__arrow');
        const spring = { type: 'spring', stiffness: 330, damping: 21 };
        start(arrow, { x: 5 }, spring);
        return () => {
          if (active) start(arrow, { x: 0 }, spring);
        };
      });

    const folio = document.querySelector('.path-folio__content');
    const change = () => start(folio, { opacity: [0.55, 1], x: [9, 0] }, {
      duration: 0.32, ease: [0.2, 0.7, 0.2, 1]
    });
    folio.addEventListener('path-content-change', change);

    return () => {
      active = false;
      removeHover();
      folio.removeEventListener('path-content-change', change);
      for (const [element, animation] of controls) {
        animation.cancel();
        element.style.removeProperty('opacity');
        element.style.removeProperty('transform');
      }
    };
  }

  media.add(motion, () => {
    const clearHeaderEntrance = headerEntrance();
    heroEntrance();
    heroWalkthrough();

    gsap.to('.scroll-progress', {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: { start: 0, end: 'max', scrub: true }
    });

    // The form and details panels can change the page length between scrolls.
    let refreshFrame;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(refreshFrame);
      refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());
    });
    observer.observe(document.body);

    reveal('#paths .section-head', (timeline) => {
      rise(timeline, '#paths .eyebrow, #paths-title', 0);
    });
    reveal('.paths-nav', (timeline) => {
      timeline.fromTo('.path-trigger', {
        y: 62,
        rotationX: -62,
        scale: .87,
        opacity: .46,
        transformPerspective: 960,
        transformOrigin: '50% 0%'
      }, {
        y: 0, rotationX: 0, scale: 1, opacity: 1, duration: .88, stagger: .16,
        clearProps: 'transform,transformOrigin,opacity'
      });
    }, 'top 78%');
    reveal('.path-folio', (timeline) => {
      rise(timeline, '.path-folio', 0.08, 30);
    });

    reveal('#studio .section-head', (timeline) => {
      rise(timeline, '#studio .eyebrow, #studio-title', 0);
    });
    reveal('.studio-monolith', (timeline) => {
      timeline.fromTo('.studio-monolith', {
        y: 92, rotationY: -34, scale: .85, opacity: .67,
        transformPerspective: 1450, transformOrigin: 'left center'
      }, {
        y: 0, rotationY: 0, scale: 1, opacity: 1, duration: 1.12,
        ease: 'power4.out', clearProps: 'transform,transformOrigin,opacity'
      }, 0);
      timeline.fromTo('.monolith-sheen', { xPercent: -110, opacity: 0.7 }, {
        xPercent: 115, opacity: 0.7, duration: 1.05, clearProps: 'transform,opacity'
      }, 0.04);
    });
    reveal('.donut-box', (timeline) => {
      timeline.fromTo('.donut-reveal', { attr: { 'stroke-dashoffset': 100 } }, {
        attr: { 'stroke-dashoffset': 0 }, duration: 1.02, ease: 'power2.out'
      }, 0);
      rise(timeline, '.monolith-breakdown .m-row', 0.06, 12, 0.1);
    });
    reveal('.payoff', (timeline) => {
      timeline.fromTo('.payoff__bar', { scaleY: 0.05 }, {
        scaleY: 1, stagger: .09, duration: .82, clearProps: 'transform'
      });
    }, 'top 82%');

    reveal('.portrait-card', (timeline) => {
      timeline.fromTo('.portrait-card__img', { clipPath: 'inset(12% 0% 25% 0% round 14px)' }, {
        clipPath: 'inset(0% 0% 0% 0% round 14px)',
        duration: 0.95,
        clearProps: 'clipPath'
      });
    });
    reveal('.terry-spread__copy', (timeline) => {
      rise(timeline, '.terry-spread__copy > .eyebrow, #terry-title, .terry-prose', 0);
    });
    reveal('.studio-space__media', (timeline) => {
      timeline.fromTo('.studio-space__media', { clipPath: 'inset(0% 0% 0% 70% round 24px)' }, {
        clipPath: 'inset(0% 0% 0% 0% round 24px)',
        duration: 1.24,
        ease: 'expo.out',
        clearProps: 'clipPath'
      }, 0).fromTo('.studio-space__img', { scale: 1.22, xPercent: 9 }, {
        scale: 1, xPercent: 0, duration: 1.32, clearProps: 'transform'
      }, 0);
    });
    reveal('#desk-title', (timeline) => {
      rise(timeline, '#desk-title, .desk-intro__copy', 0);
    });

    const cleanInteractions = interactionMotion();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(refreshFrame);
      clearHeaderEntrance?.();
      cleanInteractions?.();
    };
  });

  media.add(`${motion} and ${desktop}`, () => {
    if (!Lenis) return;
    const lenis = new Lenis({
      lerp: 0.14,
      syncTouch: false,
      virtualScroll: () => !document.querySelector('dialog[open]')
    });
    const update = (time) => lenis.raf(time * 1000);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(update);

    // Settle any wheel animation before the browser follows an in-page link.
    function settleWheel() {
      if (lenis.isScrolling === 'smooth') {
        lenis.scrollTo(lenis.actualScroll, { immediate: true });
      }
    }
    function followAnchor(event) {
      if (event.target.closest('a[href^="#"]')) settleWheel();
    }
    document.addEventListener('click', followAnchor, true);
    document.addEventListener('section-navigation', settleWheel);

    return () => {
      document.removeEventListener('click', followAnchor, true);
      document.removeEventListener('section-navigation', settleWheel);
      gsap.ticker.remove(update);
      lenis.destroy();
    };
  });

  const initialHash = location.hash;
  const initialSection = document.getElementById(initialHash.slice(1));
  if (initialSection && performance.getEntriesByType('navigation')[0]?.type !== 'back_forward') {
    // The pin can be installed after the browser has tried to follow the initial fragment.
    requestAnimationFrame(() => {
      if (scrollY === 0 && location.hash === initialHash) {
        initialSection.scrollIntoView({ behavior: 'instant' });
      }
    });
  }
})();
