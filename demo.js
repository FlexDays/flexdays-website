// FlexDays demo section, shared across pages. Put <div data-flexdays-demo></div>
// where it should appear (add data-cta="off" when the page already has a waitlist
// banner right after it) and load /demo.css + /demo.js.
//
// A silent teaser loops while the section is on screen; the full video only
// downloads when someone opens it (from the play button or a chapter).
(() => {
  const mount = document.querySelector('[data-flexdays-demo]');
  if (!mount) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DEMOS = {
    app: {
      label: 'Mobile app', length: '0:47', full: '/flexdays-demo.mp4',
      poster: '/flexdays-demo-poster.jpg', teaser: '/teaser-app.mp4',
      chapters: [[7, 'Your day at a glance'], [13, 'Request in 3 taps'], [19, 'Approve on the go'], [26, 'Live approval timeline'], [31, 'Team calendar']],
    },
    portal: {
      label: 'HR portal', length: '0:53', full: '/flexdays-demo-portal.mp4',
      poster: '/flexdays-demo-portal-poster.jpg', teaser: '/teaser-portal.mp4',
      chapters: [[4, 'Team dashboard'], [12, 'One-click approvals'], [20, 'Team calendar'], [26, 'Employees'], [30, 'Approval workflows'], [37, 'Timesheets']],
    },
  };
  const waitlistHref = document.getElementById('waitlist') ? '#waitlist' : '/#waitlist';
  const showCta = mount.dataset.cta !== 'off';

  const icon = {
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/></svg>',
    monitor: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
    check: '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>',
    calendar: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    zap: '<svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    play: '<svg viewBox="0 0 24 24"><polygon points="6 4 20 12 6 20 6 4"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  };
  const float = (cls, color, svg, text) =>
    `<div class="fd-demo-float fd-demo-float--${cls}" aria-hidden="true"><span class="fd-demo-float-dot" style="background:${color}">${svg}</span>${text}</div>`;

  const section = document.createElement('section');
  section.className = 'fd-demo';
  section.id = 'demo';
  section.innerHTML = `
    <div class="fd-demo-inner">
      <div class="fd-demo-head">
        <span class="fd-demo-tag">See it in action</span>
        <h2 class="fd-demo-title">FlexDays in <span class="fd-demo-gradient">under a minute.</span></h2>
        <p class="fd-demo-sub">Request time off in three taps, approve it from anywhere, and see who's out at a glance.</p>
      </div>
      <div class="fd-demo-tabs" role="tablist" aria-label="Choose a demo">
        <button class="fd-demo-tab" type="button" role="tab" data-demo="app">${icon.phone} Mobile app</button>
        <button class="fd-demo-tab" type="button" role="tab" data-demo="portal">${icon.monitor} HR portal</button>
      </div>
      <div class="fd-demo-stage">
        <div class="fd-demo-glow" aria-hidden="true"></div>
        ${float('a', 'var(--fd-success)', icon.check, '1 tap to approve')}
        ${float('b', 'var(--fd-blue)', icon.calendar, "See who's out, instantly")}
        ${float('c', 'var(--fd-teal)', icon.zap, 'Set up in under 5 minutes')}
        <div class="fd-demo-frame">
          <div class="fd-demo-bar">
            <span class="fd-demo-dot" style="background:#ff5f57"></span>
            <span class="fd-demo-dot" style="background:#febc2e"></span>
            <span class="fd-demo-dot" style="background:#28c840"></span>
            <span class="fd-demo-bar-label"></span>
          </div>
          <div class="fd-demo-player">
            <video class="fd-demo-teaser" muted loop playsinline preload="none" width="1280" height="720" aria-hidden="true"></video>
            <button class="fd-demo-play" type="button">
              <span class="fd-demo-play-icon" aria-hidden="true">${icon.play}</span>
              <span class="fd-demo-play-label"></span>
            </button>
          </div>
        </div>
      </div>
      <div class="fd-demo-chapters" aria-label="Jump to a part of the demo"></div>
      ${showCta ? `<div class="fd-demo-cta"><a href="${waitlistHref}">Join the waitlist</a></div>` : ''}
    </div>`;
  mount.replaceWith(section);

  const modal = document.createElement('div');
  modal.className = 'fd-demo-modal';
  modal.hidden = true;
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'FlexDays demo video');
  modal.innerHTML = `
    <div class="fd-demo-backdrop" data-close></div>
    <div class="fd-demo-box">
      <button class="fd-demo-close" type="button" aria-label="Close the video" data-close>${icon.close}</button>
      <video controls muted playsinline preload="none"></video>
    </div>`;
  document.body.appendChild(modal);

  const stage = section.querySelector('.fd-demo-stage');
  const teaser = section.querySelector('.fd-demo-teaser');
  const playBtn = section.querySelector('.fd-demo-play');
  const chapterBox = section.querySelector('.fd-demo-chapters');
  const tabs = [...section.querySelectorAll('.fd-demo-tab')];
  const modalVideo = modal.querySelector('video');
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  let current = 'app';
  let stageVisible = false;
  let lastTrigger = null;

  const playTeaser = () => {
    if (reducedMotion || !stageVisible || !modal.hidden) return;
    if (teaser.getAttribute('src') !== DEMOS[current].teaser) teaser.src = DEMOS[current].teaser;
    teaser.play().catch(() => {});
  };

  const select = (key) => {
    current = key;
    const demo = DEMOS[key];
    tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.demo === key)));
    teaser.pause();
    teaser.removeAttribute('src');
    teaser.poster = demo.poster;
    teaser.load();
    section.querySelector('.fd-demo-bar-label').textContent = `${demo.label} · ${demo.length}`;
    section.querySelector('.fd-demo-play-label').textContent = `Watch the full demo · ${demo.length}`;
    playBtn.setAttribute('aria-label', `Play the full ${demo.label.toLowerCase()} demo video`);
    chapterBox.innerHTML = demo.chapters
      .map(([t, name]) => `<button class="fd-demo-chapter" type="button" data-t="${t}"><time>${fmt(t)}</time>${name}</button>`)
      .join('');
    playTeaser();
  };

  const open = (start, trigger) => {
    lastTrigger = trigger;
    teaser.pause();
    const src = DEMOS[current].full;
    if (modalVideo.getAttribute('src') !== src) modalVideo.src = src;
    // play() starts the download; the chapter seek waits for the metadata
    const seek = () => { modalVideo.currentTime = start; };
    if (modalVideo.readyState >= 1) seek();
    else modalVideo.addEventListener('loadedmetadata', seek, { once: true });
    modalVideo.play().catch(() => {});
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    modal.querySelector('.fd-demo-close').focus();
  };

  const close = () => {
    modalVideo.pause();
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastTrigger) lastTrigger.focus();
    playTeaser();
  };

  tabs.forEach((t) => t.addEventListener('click', () => select(t.dataset.demo)));
  playBtn.addEventListener('click', () => open(0, playBtn));
  chapterBox.addEventListener('click', (e) => {
    const chip = e.target.closest('.fd-demo-chapter');
    if (chip) open(Number(chip.dataset.t), chip);
  });
  modal.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', close));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      stageVisible = entries[0].isIntersecting;
      if (stageVisible) playTeaser();
      else teaser.pause();
    }, { threshold: 0.35 }).observe(stage);
  }
  select('app');
})();
