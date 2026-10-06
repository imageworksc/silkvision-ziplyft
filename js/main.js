/* ==========================================================================
   Page behaviour
   Loaded with `defer`, so the document is parsed by the time this runs.

   Everything here is an enhancement. If the file fails to load the page is
   still complete and readable: nothing is hidden by CSS until this script
   says it is safe to hide it.
   ========================================================================== */

'use strict';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const root = document.documentElement;

/* --------------------------------------------------------------------------
   1 · Menu
   A button with aria-expanded rather than a <details>: above 992px the panel
   has to be a plain row, and forcing a closed <details> open in CSS means
   fighting the browser's own hiding of its contents.
   -------------------------------------------------------------------------- */
const setupMenu = () => {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('nav');
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    nav.dataset.open = String(open);
  };

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  /* Escape closes it and returns focus to the control that opened it,
     otherwise focus is stranded in a panel that is no longer on screen.

     Bound to the document, not to nav. The toggle is nav's sibling, so right
     after you open the menu — when focus is still sitting on the button —
     a keydown on nav never fires and Escape did nothing at the one moment
     you are most likely to press it. */
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (toggle.getAttribute('aria-expanded') !== 'true') return;
    setOpen(false);
    toggle.focus();
  });

  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });
};

/* --------------------------------------------------------------------------
   2 · Scroll state — the reading progress bar, the sticky header's shadow,
   and the flag that retires the scroll cue once it has done its job.
   -------------------------------------------------------------------------- */
const setupScroll = () => {
  const bar = document.getElementById('progress');
  const header = document.getElementById('siteHeader');
  let ticking = false;

  const read = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : '0');
    if (header) header.dataset.stuck = String(y > 8);
    root.dataset.scrolled = String(y > 40);
    ticking = false;
  };

  const request = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(read);
  };

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);

  read();
};

/* --------------------------------------------------------------------------
   3 · Scroll reveals
   The flag goes on <html> from here, so a target is only ever hidden while
   the page is in a position to bring it back.
   -------------------------------------------------------------------------- */
const setupReveals = () => {
  const targets = [...document.querySelectorAll('[data-reveal]')];
  if (!targets.length) return;

  root.dataset.anim = 'on';

  if (reduced.matches || !('IntersectionObserver' in window)) {
    for (const el of targets) el.classList.add('is-in');
    return;
  }

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: .1 });

  for (const el of targets) io.observe(el);

  // The negative rootMargin means anything in the last slice of a
  // fully-scrolled page would never trigger. Once the visitor reaches the
  // bottom, reveal whatever is still waiting.
  const flush = () => {
    if (window.innerHeight + window.scrollY < document.documentElement.scrollHeight - 2) return;
    for (const el of targets) {
      el.classList.add('is-in');
      io.unobserve(el);
    }
    window.removeEventListener('scroll', flush);
  };
  window.addEventListener('scroll', flush, { passive: true });
  window.addEventListener('load', flush);
};

/* --------------------------------------------------------------------------
   4 · The comparison table's swipe hint
   A closed loop: it runs once and ends. The hint exists because a horizontal
   swipe is an invisible trigger; the moment the region is actually scrolled
   the user has discovered it, so the hint retires and the listener with it.
   -------------------------------------------------------------------------- */
const setupScrollHint = () => {
  const region = document.getElementById('compareScroll');
  if (!region) return;

  const used = () => {
    region.dataset.used = 'true';
    region.removeEventListener('scroll', used);
  };
  region.addEventListener('scroll', used, { passive: true, once: true });
};

/* --------------------------------------------------------------------------
   5 · Before / after
   The range input is the control; this only mirrors its value into the one
   custom property the clip and the handle both read. The live text keeps a
   screen reader told how far the reveal has gone.
   -------------------------------------------------------------------------- */
const setupBeforeAfter = () => {
  document.querySelectorAll('.ba').forEach((stage) => {
    const range = stage.querySelector('.ba__range');
    if (!range) return;
    const paint = () => {
      stage.style.setProperty('--pos', `${range.value}%`);
      range.setAttribute('aria-valuetext', `${Math.round(100 - range.value)}% of the after photograph showing`);
    };
    range.addEventListener('input', paint);
    paint();
  });

  // The cases carousel: one slide at a time, arrows wrap around.
  const root = document.getElementById('cases');
  if (!root) return;
  const slides = [...root.querySelectorAll('.carousel__slide')];
  const current = root.querySelector('[data-current]');
  let i = 0;
  const show = (n) => {
    i = (n + slides.length) % slides.length;
    slides.forEach((sl, j) => { sl.hidden = j !== i; });
    current.textContent = String(i + 1);
  };
  root.querySelectorAll('.carousel__btn').forEach((b) =>
    b.addEventListener('click', () => show(i + Number(b.dataset.dir))));
  root.dataset.ready = '';
  show(0);
};

/* --------------------------------------------------------------------------
   6 · The mechanism video
   Silent and looping, so it plays by itself — but only while it is on
   screen, never under reduced motion, and never again once somebody has
   pressed pause. The button shows which state it is in.
   -------------------------------------------------------------------------- */
const setupLoopVideo = () => {
  const video = document.getElementById('mechVideo');
  const btn = document.getElementById('mechToggle');
  if (!video || !btn) return;

  const label = btn.querySelector('.vid-btn__label');
  let userPaused = reduced.matches;

  const show = () => {
    const playing = !video.paused;
    btn.dataset.state = playing ? 'playing' : 'paused';
    btn.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
    if (label) label.textContent = playing ? 'Pause' : 'Play';
  };
  video.addEventListener('play', show);
  video.addEventListener('pause', show);
  show();

  btn.addEventListener('click', () => {
    if (video.paused) {
      userPaused = false;
      video.play().catch(() => {});
    } else {
      userPaused = true;
      video.pause();
    }
  });

  if (!('IntersectionObserver' in window)) return;
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !userPaused) video.play().catch(() => {});
    else if (!entry.isIntersecting && !video.paused) video.pause();
  }, { threshold: .5 }).observe(video);
};

/* --------------------------------------------------------------------------
   7 · Dr. Silk's video
   This one talks, so it waits to be asked. Pressing play starts it with
   sound and hands over to the browser's own controls.
   -------------------------------------------------------------------------- */
const setupTalkVideo = () => {
  const video = document.getElementById('silkVideo');
  const btn = document.getElementById('silkPlay');
  if (!video || !btn) return;

  btn.addEventListener('click', () => {
    btn.hidden = true;
    video.controls = true;
    video.muted = false;
    video.play().catch(() => { btn.hidden = false; });
    video.focus();
  });
};

/* --------------------------------------------------------------------------
   8 · The sticky call bar
   On a phone, once the hero and its two buttons have scrolled away. Hidden
   again at the closing band, which carries the same two actions full size.
   -------------------------------------------------------------------------- */
const setupStickyCta = () => {
  const bar = document.getElementById('stickyCta');
  const hero = document.querySelector('.hero');
  const closing = document.getElementById('contact');
  if (!bar || !hero || !('IntersectionObserver' in window)) return;

  let pastHero = false;
  let atClosing = false;
  const paint = () => { bar.dataset.shown = String(pastHero && !atClosing); };

  new IntersectionObserver(([e]) => {
    pastHero = !e.isIntersecting && e.boundingClientRect.top < 0;
    paint();
  }).observe(hero);

  if (closing) {
    new IntersectionObserver(([e]) => {
      atClosing = e.isIntersecting;
      paint();
    }).observe(closing);
  }
};

/* --------------------------------------------------------------------------
   9 · The procedure's step bar
   The tabs pattern: one tab in the tab order at a time, arrow keys and
   Home/End move along the row, and the panels the script hides are the only
   thing it hides — without it all five stay open. On a device that can
   hover, pointing at a step lights it too, which is what the row invites.
   -------------------------------------------------------------------------- */
const setupStepper = () => {
  const root = document.getElementById('stepper');
  if (!root) return;
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));

  const select = (i, focus = false) => {
    tabs.forEach((t, j) => {
      const on = i === j;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      panels[j].hidden = !on;
    });
    if (focus) tabs[i].focus();
  };

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i));
    t.addEventListener('keydown', (e) => {
      const last = tabs.length - 1;
      const next = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: last }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      select((next + tabs.length) % tabs.length, true);
    });
  });

  if (window.matchMedia('(hover: hover)').matches) {
    tabs.forEach((t, i) => t.addEventListener('mouseenter', () => select(i)));
  }

  select(0);
};

/* --------------------------------------------------------------------------
   10 · Accordions — the FAQ and the cost questions open softly
   <details> opens in one frame: the answer appears and everything under it
   jumps. Here the row's height eases between closed and open, the answer
   fades in a beat behind it, and the chevron turns as the move starts, not
   when it ends. The script keeps the one-open-at-a-time rule that `name`
   gave, because the browser's own version would shut the other row in one
   frame and cut its animation short. Without the script, or under reduced
   motion, the native toggle is left alone.
   -------------------------------------------------------------------------- */
const setupAccordions = () => {
  const EASE = 'cubic-bezier(.4, 0, .2, 1)';   // eases in and out: no snap at the start
  const OPEN_MS = 560;
  const CLOSE_MS = 440;

  const move = (d, open) => {
    const summary = d.querySelector('summary');
    // Measure before cancelling, so a click mid-move reverses from where
    // the row is rather than from where it was headed.
    const from = d.getBoundingClientRect().height;
    if (d._anim) d._anim.cancel();
    d.classList.toggle('is-closing', !open);
    if (open) d.open = true;
    const to = open
      ? d.getBoundingClientRect().height
      : summary.getBoundingClientRect().height + (d.offsetHeight - d.clientHeight);
    d.style.overflow = 'hidden';
    const anim = d.animate(
      { height: [`${from}px`, `${to}px`] },
      { duration: open ? OPEN_MS : CLOSE_MS, easing: EASE }
    );
    d._anim = anim;
    if (open) {
      [...d.children].filter((el) => el !== summary).forEach((el) => el.animate(
        [{ opacity: 0, transform: 'translateY(-.5rem)' }, { opacity: 1, transform: 'none' }],
        { duration: OPEN_MS - 80, delay: 80, easing: EASE, fill: 'backwards' }
      ));
    }
    const done = () => {
      if (!open) d.open = false;
      d.classList.remove('is-closing');
      d.style.overflow = '';
      d._anim = null;
    };
    anim.onfinish = done;
    anim.oncancel = () => { d.style.overflow = ''; };
  };

  document.querySelectorAll('.faq').forEach((group) => {
    const items = [...group.querySelectorAll(':scope > details')];
    items.forEach((d) => {
      const exclusive = d.hasAttribute('name');
      d.removeAttribute('name');
      d.querySelector('summary').addEventListener('click', (e) => {
        if (reduced.matches) {
          if (exclusive && !d.open) items.forEach((o) => { if (o !== d) o.open = false; });
          return;
        }
        e.preventDefault();
        const opening = !d.open || d.classList.contains('is-closing');
        move(d, opening);
        if (opening && exclusive) {
          items.forEach((o) => { if (o !== d && o.open && !o.classList.contains('is-closing')) move(o, false); });
        }
      });
    });
  });
};

setupMenu();
setupScroll();
setupReveals();
setupScrollHint();
setupBeforeAfter();
setupLoopVideo();
setupTalkVideo();
setupStickyCta();
setupStepper();
setupAccordions();
