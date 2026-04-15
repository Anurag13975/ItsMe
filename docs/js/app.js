/* ═══════════════════════════════════════════════════════════
   app.js  –  Fetch & Render Portfolio Data
   ═══════════════════════════════════════════════════════════ */

'use strict';

// Global portfolio data (also used by admin.js)
window.portfolioData = null;

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await fetchData();
  if (window.portfolioData) {
    renderAll(window.portfolioData);
    initTypewriter(window.portfolioData.hero.titles || []);
  }
  initScrollAnimations();
  initNavbar();
});

// ── Data ──────────────────────────────────────────────────────
async function fetchData() {
  // Admin edits are cached in localStorage — only load for active admin sessions
  // so regular visitors always get the latest published data.json.
  const STORAGE_KEY = 'portfolio_data_v1';
  const SESSION_KEY = 'portfolio_admin_session';
  let isAdminSession = false;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const { expires } = JSON.parse(raw);
      isAdminSession = Date.now() < expires;
    }
  } catch { /* ignore */ }

  if (isAdminSession) {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try { window.portfolioData = JSON.parse(cached); return; } catch { /* fall through */ }
    }
  }
  // Fallback 1: load from data.json (works on any static HTTP server)
  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error('data.json not found');
    window.portfolioData = await res.json();
    return;
  } catch { /* fall through */ }
  // Fallback 2: embedded in data-init.js (works on file:// protocol too)
  if (window.__PORTFOLIO_DEFAULT_DATA__) {
    window.portfolioData = JSON.parse(JSON.stringify(window.__PORTFOLIO_DEFAULT_DATA__));
  }
}

// ── Full Render ───────────────────────────────────────────────
function renderAll(data) {
  if (!data) return;
  renderHero(data);
  renderAbout(data);
  renderExperience(data);
  renderProjects(data);
  renderSkills(data);
  renderAchievements(data);
  renderContact(data);
}

// exposed so admin.js can re-render individual sections
window.renderAll        = renderAll;
window.renderHero       = renderHero;
window.renderAbout      = renderAbout;
window.renderExperience = renderExperience;
window.renderProjects   = renderProjects;
window.renderSkills     = renderSkills;
window.renderAchievements = renderAchievements;
window.renderContact    = renderContact;

// ── Hero ──────────────────────────────────────────────────────
function renderHero(data) {
  const h = data.hero;
  const a = data.about;

  setText('hero-greeting', h.greeting || '');
  setText('hero-name', h.name || '');
  setInner('hero-avatar', getInitials(h.name || 'AS'));
  setHTML('hero-tagline', h.tagline || '');

  // Social links
  if (a?.contact) {
    setHref('hero-github-link',   a.contact.github   || '#');
    setHref('hero-linkedin-link', a.contact.linkedin  || '#');
    setHref('hero-email-link',    a.contact.email ? `mailto:${a.contact.email}` : '#');
    setHref('footer-github',   a.contact.github   || '#');
    setHref('footer-linkedin', a.contact.linkedin  || '#');
  }

  // Stats
  const statsEl = document.getElementById('hero-stats');
  if (statsEl && a?.stats) {
    statsEl.innerHTML = a.stats.map(s => `
      <div class="stat-card">
        <span class="stat-num">${esc(s.value)}</span>
        <span class="stat-lab">${esc(s.label)}</span>
      </div>`).join('');
  }

  // Footer name
  const footerCopy = document.getElementById('footer-copy');
  if (footerCopy) {
    footerCopy.innerHTML = `&copy; ${new Date().getFullYear()} ${esc(h.name || '')} &middot; Crafted with <span class="heart">&#9829;</span>`;
  }

  // Page title
  document.title = `${h.name || 'Portfolio'}`;
}

// ── About ─────────────────────────────────────────────────────
function renderAbout(data) {
  const a = data.about;
  const el = document.getElementById('about-content');
  if (!el || !a) return;

  const c = a.contact || {};
  el.innerHTML = `
    <div class="about-bio reveal">
      <p>${a.bio  || ''}</p>
      ${a.bio2 ? `<p>${a.bio2}</p>` : ''}
    </div>
    <div class="about-info reveal">
      ${infoRow('fas fa-envelope', 'Email',    `<a href="mailto:${c.email||''}">${esc(c.email||'')}</a>`)}
      ${infoRow('fas fa-phone',   'Phone',    esc(c.phone||''))}
      ${infoRow('fas fa-location-dot', 'Location', esc(c.location||''))}
      ${infoRow('fab fa-linkedin', 'LinkedIn', `<a href="${c.linkedin||'#'}" target="_blank">${esc((c.linkedin||'').replace('https://',''))}</a>`)}
      ${infoRow('fab fa-github',   'GitHub',   `<a href="${c.github||'#'}" target="_blank">${esc((c.github||'').replace('https://',''))}</a>`)}
    </div>`;
}

function infoRow(icon, label, valHtml) {
  return `
    <div class="info-row">
      <i class="${icon}"></i>
      <div>
        <span class="info-label">${label}</span>
        <span class="info-val">${valHtml}</span>
      </div>
    </div>`;
}

// ── Period sort helper ───────────────────────────────────────
// Returns a new array sorted by period start date, newest first.
function sortByPeriodDesc(arr) {
  const M = {
    jan:1,feb:2,mar:3,apr:4,may:5,jun:6,june:6,
    jul:7,july:7,aug:8,sep:9,sept:9,oct:10,nov:11,dec:12
  };
  function startVal(item) {
    const raw = (item.period || '').trim();
    // Take the part before the dash/en-dash
    const startPart = raw.split(/\s*[\u2013\u2014\-]\s*/)[0].trim();
    // "Mon YYYY" format
    const mm = startPart.match(/^(\w+)\s+(\d{4})$/);
    if (mm) {
      const mon = M[mm[1].toLowerCase()] || 0;
      return parseInt(mm[2]) * 100 + mon;
    }
    // bare year
    const yy = startPart.match(/^(\d{4})$/);
    if (yy) return parseInt(yy[1]) * 100;
    return 0;
  }
  return [...arr].sort((a, b) => startVal(b) - startVal(a));
}

// ── Experience + Education ────────────────────────────────────
function renderExperience(data) {
  if (!data) return;
  const expEl = document.getElementById('experience-content');
  const eduEl = document.getElementById('education-content');

  if (expEl && data.experience) {
    const jobs = sortByPeriodDesc(data.experience);
    expEl.innerHTML = jobs.map((job, idx) => `
      <div class="tl-item reveal" style="transition-delay:${idx * 0.08}s">
        <div class="tl-dot"><div class="tl-dot-ring"></div></div>
        <div class="tl-card">
          <div class="item-actions admin-only hidden">
            <button class="edit-btn" onclick="editItem('experience',${job.id})" title="Edit"><i class="fas fa-pen"></i></button>
            <button class="del-btn"  onclick="deleteItem('experience',${job.id})" title="Delete"><i class="fas fa-trash"></i></button>
          </div>
          <div class="tl-card-head">
            <span class="tl-title">${esc(job.title||'')}</span>
            <span class="tl-period">${esc(job.period||'')}</span>
          </div>
          <div class="tl-company">${esc(job.company||'')}</div>
          <div class="tl-meta">
            <span><i class="fas fa-location-dot"></i> ${esc(job.location||'')}</span>
          </div>
          ${job.domain ? `<div class="tl-domain">&#9632; ${esc(job.domain)}</div>` : ''}
          <div class="tag-chips">${(job.techStack||[]).map(t=>`<span class="chip">${esc(t)}</span>`).join('')}</div>
          <ul class="tl-bullets">
            ${(job.bullets||[]).map(b=>`<li>${b}</li>`).join('')}
          </ul>
        </div>
      </div>`).join('');
  }

  if (eduEl && data.education) {
    const edus = sortByPeriodDesc(data.education);
    eduEl.innerHTML = edus.map((edu, idx) => `
      <div class="edu-card reveal" style="transition-delay:${idx * 0.08}s">
        <div class="item-actions admin-only hidden">
          <button class="edit-btn" onclick="editItem('education',${edu.id})" title="Edit"><i class="fas fa-pen"></i></button>
          <button class="del-btn"  onclick="deleteItem('education',${edu.id})" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
        <div class="edu-inst">${esc(edu.institution||'')}</div>
        <div class="edu-deg">${esc(edu.degree||'')}</div>
        <div class="edu-score">${esc(edu.score||'')}</div>
        <div class="edu-period">${esc(edu.period||'')} &bull; ${esc(edu.location||'')}</div>
      </div>`).join('');
  }

  initScrollAnimations();
}

// ── Projects ──────────────────────────────────────────────────
function renderProjects(data) {
  const el = document.getElementById('projects-content');
  if (!el || !data.projects) return;

  const projs = sortByPeriodDesc(data.projects);
  el.innerHTML = projs.map((p, idx) => `
    <div class="project-card reveal" style="transition-delay:${idx * 0.08}s">
      <div class="item-actions admin-only hidden">
        <button class="edit-btn" onclick="editItem('projects',${p.id})" title="Edit"><i class="fas fa-pen"></i></button>
        <button class="del-btn"  onclick="deleteItem('projects',${p.id})" title="Delete"><i class="fas fa-trash"></i></button>
      </div>
      <div class="proj-head">
        <span class="proj-name">${esc(p.name||'')}</span>
        <span class="proj-period">${esc(p.period||'')}</span>
      </div>
      <p class="proj-desc">${esc(p.description||'')}</p>
      <div class="tag-chips">${(p.techStack||[]).map(t=>`<span class="chip">${esc(t)}</span>`).join('')}</div>
      <ul class="proj-highlights">
        ${(p.highlights||[]).map(h=>`<li>${esc(h)}</li>`).join('')}
      </ul>
      <div class="proj-links">
        ${p.github ? `<a href="${p.github}" target="_blank"><i class="fab fa-github"></i> GitHub</a>` : ''}
        ${p.live   ? `<a href="${p.live}"   target="_blank"><i class="fas fa-arrow-up-right-from-square"></i> Live</a>` : ''}
      </div>
    </div>`).join('');

  initScrollAnimations();
}

// ── Skills ────────────────────────────────────────────────────
function renderSkills(data) {
  const el = document.getElementById('skills-content');
  if (!el || !data.skills) return;

  el.innerHTML = Object.entries(data.skills).map(([cat, items]) => `
    <div class="skill-cat reveal">
      <div class="skill-cat-name">${esc(cat)}</div>
      <div class="skill-tags">
        ${(items||[]).map(s=>`<span class="stag">${esc(s)}</span>`).join('')}
      </div>
    </div>`).join('');

  initScrollAnimations();
}

// ── Achievements ──────────────────────────────────────────────
function renderAchievements(data) {
  const el = document.getElementById('achievements-content');
  if (!el || !data.achievements) return;

  el.innerHTML = data.achievements.map((ach, idx) => `
    <div class="ach-card reveal" style="transition-delay:${idx * 0.06}s" data-ach-idx="${idx}">
      <div class="item-actions admin-only hidden">
        <button class="edit-btn" onclick="editAchievement(${idx})" title="Edit"><i class="fas fa-pen"></i></button>
        <button class="del-btn"  onclick="deleteAchievement(${idx})" title="Delete"><i class="fas fa-trash"></i></button>
      </div>
      <div class="ach-icon"><i class="fas fa-trophy"></i></div>
      <div class="ach-text">${ach}</div>
    </div>`).join('');

  initScrollAnimations();
}

// ── Contact ───────────────────────────────────────────────────
function renderContact(data) {
  const el = document.getElementById('contact-content');
  if (!el || !data.about?.contact) return;
  const c = data.about.contact;

  const cards = [
    { icon: 'fas fa-envelope',       label: 'Email',    val: c.email,    href: `mailto:${c.email}` },
    { icon: 'fas fa-phone',          label: 'Phone',    val: c.phone,    href: `tel:${c.phone}` },
    { icon: 'fab fa-linkedin-in',    label: 'LinkedIn', val: c.linkedin, href: c.linkedin },
    { icon: 'fab fa-github',         label: 'GitHub',   val: c.github,   href: c.github },
    { icon: 'fas fa-location-dot',   label: 'Location', val: c.location, href: null },
  ].filter(c => c.val);

  el.innerHTML = cards.map(cc => `
    <div class="contact-card reveal">
      <div class="contact-icon"><i class="${cc.icon}"></i></div>
      <div>
        <div class="contact-label">${cc.label}</div>
        <div class="contact-val">
          ${cc.href
            ? `<a href="${cc.href}" ${cc.href.startsWith('http')?'target="_blank"':''}>${esc(cc.val)}</a>`
            : esc(cc.val)}
        </div>
      </div>
    </div>`).join('');

  initScrollAnimations();
}

// ── Typewriter ────────────────────────────────────────────────
function initTypewriter(titles) {
  const el = document.getElementById('typewriter');
  if (!el || !titles.length) return;

  let ti = 0, ci = 0, deleting = false;

  function tick() {
    const cur = titles[ti % titles.length];
    if (!deleting) {
      el.textContent = cur.slice(0, ++ci);
      if (ci >= cur.length) { deleting = true; return setTimeout(tick, 1800); }
    } else {
      el.textContent = cur.slice(0, --ci);
      if (ci <= 0) { deleting = false; ti++; return setTimeout(tick, 400); }
    }
    setTimeout(tick, deleting ? 55 : 95);
  }
  tick();
}

// ── Scroll Animations ─────────────────────────────────────────
function initScrollAnimations() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal:not(.visible)').forEach(el => obs.observe(el));
}

// ── Navbar ────────────────────────────────────────────────────
function initNavbar() {
  const nav = document.getElementById('navbar');
  const links = nav.querySelectorAll('.nav-links a');
  const sections = [...document.querySelectorAll('section[id]')];

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);

    // Active link
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 120) current = s.id;
    });
    links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${current}`));
  }, { passive: true });
}

// ── Helpers ───────────────────────────────────────────────────
function setText(id, val)  { const e = document.getElementById(id); if (e) e.textContent = val; }
function setHTML(id, val)  { const e = document.getElementById(id); if (e) e.innerHTML   = val; }
function setInner(id, val) { const e = document.getElementById(id); if (e) e.innerHTML   = val; }
function setHref(id, val)  { const e = document.getElementById(id); if (e) e.href        = val; }

function esc(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');
}
window.esc = esc;

function getInitials(name) {
  return (name.split(' ').map(w => w[0]).join('').slice(0,2)).toUpperCase();
}
