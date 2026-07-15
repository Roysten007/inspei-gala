/* =========================================================
   Shared UI behaviors (no framework needed for this layer —
   kept in dependency-free vanilla JS for maximum performance).
   ========================================================= */

// ---------- Toast system (used across all pages) ----------
const Toast = (() => {
  let stack;
  function ensureStack(){
    if(!stack){
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      document.body.appendChild(stack);
    }
    return stack;
  }
  function show(message, type = 'success', timeout = 4200){
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    const icon = type === 'error' ? 'fa-circle-exclamation' : type === 'info' ? 'fa-circle-info' : 'fa-circle-check';
    el.innerHTML = `<i class="fa-solid ${icon}"></i><span></span>`;
    el.querySelector('span').textContent = message;
    ensureStack().appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity .3s, transform .3s';
      el.style.opacity = '0';
      el.style.transform = 'translateX(30px)';
      setTimeout(() => el.remove(), 300);
    }, timeout);
  }
  return { show };
})();
window.Toast = Toast;

document.addEventListener('DOMContentLoaded', () => {

  // ---------- Mobile nav ----------
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('.nav');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', nav.classList.contains('open'));
    });
    nav.querySelectorAll('.nav-links a').forEach(a =>
      a.addEventListener('click', () => nav.classList.remove('open'))
    );
  }

  // ---------- Scroll reveal ----------
  const revealEls = document.querySelectorAll('.reveal, .step');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in-view'));
  }

  // ---------- Ambient stars ----------
  const starsWrap = document.querySelector('.bg-stars');
  if (starsWrap) {
    const count = window.innerWidth < 720 ? 18 : 34;
    for (let i = 0; i < count; i++) {
      const s = document.createElement('i');
      s.className = 'fa-solid fa-star';
      s.style.left = Math.random() * 100 + '%';
      s.style.top = Math.random() * 100 + '%';
      s.style.fontSize = (Math.random() * 8 + 5) + 'px';
      s.style.animationDelay = (Math.random() * 3) + 's';
      starsWrap.appendChild(s);
    }
  }

  // ---------- FAQ accordion ----------
  document.querySelectorAll('.faq-item').forEach(item => {
    const btn = item.querySelector('.faq-q');
    const answer = item.querySelector('.faq-a');
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
          other.querySelector('.faq-a').style.maxHeight = null;
        }
      });
      item.classList.toggle('open', !isOpen);
      answer.style.maxHeight = !isOpen ? answer.scrollHeight + 'px' : null;
    });
  });

  // ---------- Countdown to event ----------
  const countdownEl = document.querySelector('[data-countdown]');
  if (countdownEl) {
    const target = new Date(countdownEl.dataset.countdown).getTime();
    const els = {
      d: countdownEl.querySelector('[data-unit="d"]'),
      h: countdownEl.querySelector('[data-unit="h"]'),
      m: countdownEl.querySelector('[data-unit="m"]'),
      s: countdownEl.querySelector('[data-unit="s"]'),
    };
    function tick() {
      const diff = Math.max(0, target - Date.now());
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (els.d) els.d.textContent = String(d).padStart(2, '0');
      if (els.h) els.h.textContent = String(h).padStart(2, '0');
      if (els.m) els.m.textContent = String(m).padStart(2, '0');
      if (els.s) els.s.textContent = String(s).padStart(2, '0');
    }
    tick();
    setInterval(tick, 1000);
  }

  // ---------- Active session indicator in navbar (best-effort, non-authoritative) ----------
  // The server is the source of truth; this only avoids flashing the wrong CTA.
  const navAuthSlot = document.querySelector('[data-nav-auth]');
  if (navAuthSlot) {
    api.get('/api/auth/me')
      .then(user => {
        navAuthSlot.innerHTML = `
          <a href="dashboard.html" class="btn btn-ghost"><i class="fa-solid fa-gauge"></i> Mon espace</a>
          <a href="dashboard.html" class="btn btn-gold"><i class="fa-solid fa-pen-to-square"></i> Modifier mon projet</a>
        `;
        const heroCta = document.querySelector('.hero-ctas a.btn-gold');
        if (heroCta) {
          heroCta.href = 'dashboard.html';
          heroCta.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Modifier mon projet`;
        }
      })
      .catch(() => { /* not logged in — keep default markup */ });
  }
});
