// Mobile menu
const menuToggle = document.getElementById('menuToggle');
const nav = document.getElementById('nav');
menuToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', open);
});
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

// Light / dark mode
const themeBtn = document.getElementById('themeBtn');
function applyTheme(theme) {
  if (theme === 'light') document.documentElement.setAttribute('data-theme', 'light');
  else document.documentElement.removeAttribute('data-theme');
  themeBtn.textContent = theme === 'light' ? 'Dark mode' : 'Light mode';
}
let saved = null;
try { saved = localStorage.getItem('theme'); } catch (e) {}
applyTheme(saved || 'dark');
themeBtn.addEventListener('click', () => {
  const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  applyTheme(next);
  try { localStorage.setItem('theme', next); } catch (e) {}
});

// Image fallbacks: hide a missing image so the placeholder shows instead.
// Checks images that already failed before this script ran, then listens for the rest.
function setupFallback(imgEl, placeholderEl, onChange) {
  if (!imgEl || !placeholderEl) return;
  const set = ok => {
    imgEl.style.display = ok ? '' : 'none';
    placeholderEl.style.display = ok ? 'none' : '';
    if (onChange) onChange(ok);
  };
  imgEl.addEventListener('load', () => set(true));
  imgEl.addEventListener('error', () => set(false));
  if (imgEl.complete) set(imgEl.naturalWidth > 0);
  else imgEl.style.display = 'none';
}
setupFallback(document.getElementById('profileImg'), document.getElementById('initials'));
document.querySelectorAll('.shot').forEach(shot => {
  setupFallback(shot.querySelector('img'), shot.querySelector('.shot-text'),
    ok => shot.classList.toggle('has-img', ok));
});

// Image viewer: click a project picture to see it larger
(function () {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  const lbImg = document.getElementById('lbImg');
  const lbCap = document.getElementById('lbCap');
  const lbCount = document.getElementById('lbCount');
  const closeBtn = lb.querySelector('.lb-close');
  const prevBtn = lb.querySelector('.prev');
  const nextBtn = lb.querySelector('.next');
  const shots = [...document.querySelectorAll('.shot')];
  let idx = 0, lastFocus = null;

  const available = () => shots.filter(s => s.classList.contains('has-img'));
  const isOpen = () => lb.classList.contains('open');

  function show(i) {
    const list = available();
    if (!list.length) return;
    idx = (i + list.length) % list.length;
    const s = list[idx];
    const im = s.querySelector('img');
    lbImg.classList.remove('swap');
    void lbImg.offsetWidth; // restart the slide animation
    lbImg.src = im.currentSrc || im.src;
    lbImg.alt = im.alt;
    lbImg.classList.add('swap');
    lbCap.textContent = s.dataset.caption || im.alt;
    lbCount.textContent = (idx + 1) + ' / ' + list.length;
    prevBtn.style.display = nextBtn.style.display = list.length > 1 ? '' : 'none';
  }
  function open(shot) {
    const i = available().indexOf(shot);
    if (i < 0) return;
    lastFocus = document.activeElement;
    show(i);
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }
  function close() {
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  shots.forEach(shot => {
    shot.addEventListener('click', () => open(shot));
    shot.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(shot); }
    });
  });
  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', () => show(idx - 1));
  nextBtn.addEventListener('click', () => show(idx + 1));
  lb.addEventListener('click', e => { if (e.target === lb) close(); });

  document.addEventListener('keydown', e => {
    if (!isOpen()) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(idx - 1);
    else if (e.key === 'ArrowRight') show(idx + 1);
    else if (e.key === 'Tab') { // keep keyboard focus inside the viewer
      const f = [closeBtn, prevBtn, nextBtn].filter(b => b.style.display !== 'none');
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Swipe left/right on touch screens
  let startX = null;
  lb.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    startX = null;
  });
})();

// Highlight active nav link while scrolling
const links = [...nav.querySelectorAll('a')];
const sections = links.map(l => document.querySelector(l.getAttribute('href')));
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
    }
  });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach(s => s && observer.observe(s));

document.getElementById('year').textContent = new Date().getFullYear();

// Typing animation: "Right now I'm ..." cycles through what I'm doing
const typedEl = document.getElementById('typed');
const phrases = ['building responsive pages', 'practicing JavaScript', 'learning PHP and MySQL'];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (typedEl && !reduceMotion) {
  let p = 0, c = 0, deleting = false;
  const tick = () => {
    const word = phrases[p];
    c += deleting ? -1 : 1;
    typedEl.textContent = word.slice(0, c);
    let delay = deleting ? 40 : 80;
    if (!deleting && c === word.length) { deleting = true; delay = 1800; }
    else if (deleting && c === 0) { deleting = false; p = (p + 1) % phrases.length; delay = 400; }
    setTimeout(tick, delay);
  };
  typedEl.textContent = '';
  setTimeout(tick, 900);
}

// Scroll progress bar
const bar = document.createElement('div');
bar.className = 'progress';
document.body.appendChild(bar);
window.addEventListener('scroll', () => {
  const h = document.documentElement.scrollHeight - window.innerHeight;
  bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
}, { passive: true });

// Scroll reveal with staggered delays
const revealEls = document.querySelectorAll('.section h2, .about-grid > *, .section .card, .section > .container > p, .btn-row');
revealEls.forEach((el, i) => {
  el.classList.add('reveal');
  const sibling = [...el.parentElement.children].indexOf(el);
  el.style.setProperty('--d', Math.min(sibling, 4) * 120 + 'ms');
});
const revealObs = new IntersectionObserver((entries, obs) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
  });
}, { threshold: 0.15 });
revealEls.forEach(el => revealObs.observe(el));

// Copy email button
const copyBtn = document.getElementById('copyEmail');
const copyMsg = document.getElementById('copyMsg');
copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(copyBtn.dataset.email);
    copyMsg.textContent = 'Email address copied.';
  } catch (e) {
    copyMsg.textContent = 'Could not copy. Please select the email address manually.';
  }
  setTimeout(() => { copyMsg.textContent = ''; }, 3000);
});
