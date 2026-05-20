/* ============================================================
   АТЛЕТ-АВТО — Main JS
   ============================================================ */

// ---- Navbar scroll state ----
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// ---- Mobile burger menu ----
const burger = document.getElementById('burgerBtn');
const navMenu = document.getElementById('navMenu');

burger.addEventListener('click', () => {
  const isOpen = navMenu.classList.toggle('open');
  burger.classList.toggle('open', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

navMenu.querySelectorAll('.nav__link').forEach(link => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('open');
    burger.classList.remove('open');
    document.body.style.overflow = '';
  });
});

// ---- Brand tabs ----
document.querySelectorAll('.brand-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const panel = tab.dataset.panel;

    document.querySelectorAll('.brand-tab').forEach(t => t.classList.remove('brand-tab--active'));
    document.querySelectorAll('.brand-panel').forEach(p => p.classList.remove('brand-panel--active'));

    tab.classList.add('brand-tab--active');
    const target = document.getElementById(`panel-${panel}`);
    if (target) target.classList.add('brand-panel--active');
  });
});

// ---- Intersection Observer for reveal animations ----
const revealEls = document.querySelectorAll('.reveal, .reveal-up');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.12,
  rootMargin: '0px 0px -40px 0px'
});

revealEls.forEach(el => observer.observe(el));

// ---- Counter animation ----
function animateCounter(el, target, duration = 1600) {
  const start = performance.now();
  const update = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(ease * target);
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.dataset.to, 10);
      animateCounter(el, target);
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.counter').forEach(el => counterObserver.observe(el));

// ---- Contact form ----
function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  const success = document.getElementById('formSuccess');

  btn.disabled = true;
  btn.querySelector('span').textContent = 'Отправка...';

  setTimeout(() => {
    form.reset();
    btn.style.display = 'none';
    success.classList.add('show');
    setTimeout(() => {
      btn.style.display = '';
      btn.disabled = false;
      btn.querySelector('span').textContent = 'Отправить заявку';
      success.classList.remove('show');
    }, 5000);
  }, 1200);
}

// ---- Smooth scroll for anchor links ----
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const id = anchor.getAttribute('href').slice(1);
    if (!id) return;
    const target = document.getElementById(id);
    if (target) {
      e.preventDefault();
      const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 72;
      const top = target.getBoundingClientRect().top + window.scrollY - navH - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// ---- Phone mask ----
const phoneInput = document.getElementById('phone');
if (phoneInput) {
  phoneInput.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.startsWith('8')) v = '7' + v.slice(1);
    if (v.startsWith('7') || v.length === 0) {
      let fmt = '+7';
      if (v.length > 1) fmt += ' (' + v.slice(1, 4);
      if (v.length >= 4) fmt += ') ' + v.slice(4, 7);
      if (v.length >= 7) fmt += '-' + v.slice(7, 9);
      if (v.length >= 9) fmt += '-' + v.slice(9, 11);
      e.target.value = fmt;
    }
  });
}
