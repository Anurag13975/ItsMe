/* ═══════════════════════════════════════════════════════════
   admin.js  –  Static-mode Admin (no server needed)

   Auth:     SHA-256 password hash checked in-browser
             via Web Crypto API (crypto.subtle)
   Storage:  Edits → localStorage (instant preview for you)
   Publish:  "Export data.json" → replace file on your host
   Activate: Ctrl + Shift + L  (opens login)
   ═══════════════════════════════════════════════════════════ */

'use strict';

const STORAGE_KEY    = 'portfolio_data_v1';
const SESSION_KEY    = 'portfolio_admin_session';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

let isAdmin     = false;
let currentEdit = null; // { type, id, isNew }

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  checkExistingSession();
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.shiftKey && e.key === 'L') {
      e.preventDefault();
      isAdmin ? logout() : openLoginModal();
    }
  });
});

// ── SHA-256 (Web Crypto API — no dependencies) ────────────────
async function sha256(str) {
  const enc  = new TextEncoder();
  const buf  = await crypto.subtle.digest('SHA-256', enc.encode(str));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Session ───────────────────────────────────────────────────
function checkExistingSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const { expires } = JSON.parse(raw);
    if (Date.now() < expires) { isAdmin = true; showAdminMode(); }
    else localStorage.removeItem(SESSION_KEY);
  } catch { localStorage.removeItem(SESSION_KEY); }
}

function startSession() {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ expires: Date.now() + SESSION_TTL_MS }));
}

// ── Admin Mode ────────────────────────────────────────────────
function showAdminMode() {
  document.getElementById('admin-bar').classList.remove('hidden');
  document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
}

function hideAdminMode() {
  document.getElementById('admin-bar').classList.add('hidden');
  document.querySelectorAll('.admin-only').forEach(el => el.classList.add('hidden'));
}

// ── Login Modal ───────────────────────────────────────────────
function openLoginModal() {
  document.getElementById('login-modal').classList.remove('hidden');
  setTimeout(() => document.getElementById('admin-pwd').focus(), 60);
}

function closeLoginModal() {
  document.getElementById('login-modal').classList.add('hidden');
  document.getElementById('admin-pwd').value = '';
  const errEl = document.getElementById('login-error');
  errEl.classList.add('hidden');
  errEl.textContent = '';
}
window.closeLoginModal = closeLoginModal;

async function adminLogin() {
  const pwd   = document.getElementById('admin-pwd').value;
  const errEl = document.getElementById('login-error');
  errEl.classList.add('hidden');

  if (!pwd) { errEl.textContent = 'Enter your password.'; errEl.classList.remove('hidden'); return; }

  try {
    // Try fetching admin-config.json (HTTP hosts); fall back to embedded hash (file://)
    let expectedHash;
    try {
      const cfgRes = await fetch('admin-config.json?' + Date.now());
      if (cfgRes.ok) { const cfg = await cfgRes.json(); expectedHash = cfg.passwordHash; }
    } catch { /* fall through */ }
    if (!expectedHash) expectedHash = window.__ADMIN_HASH__;
    if (!expectedHash) throw new Error('Admin config not found.');

    const entered = await sha256(pwd);
    if (entered !== expectedHash) {
      errEl.textContent = 'Incorrect password.';
      errEl.classList.remove('hidden');
      return;
    }

    isAdmin = true;
    startSession();
    closeLoginModal();
    showAdminMode();
    showToast('Admin mode activated \u2713', 'success');
  } catch (e) {
    errEl.textContent = e.message || 'Login error. Is admin-config.json present?';
    errEl.classList.remove('hidden');
  }
}
window.adminLogin = adminLogin;

function logout() {
  isAdmin = false;
  localStorage.removeItem(SESSION_KEY);
  hideAdminMode();
  showToast('Logged out', 'info');
}
window.logout = logout;

// ── Export / Discard ──────────────────────────────────────────
function exportDataJSON() {
  const data = window.portfolioData;
  if (!data) return;

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'data.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 300);

  showToast('data.json exported \u2014 replace docs/data.json in your GitHub repo to publish!', 'success');
}
window.exportDataJSON = exportDataJSON;

function discardLocalChanges() {
  if (!confirm('Discard all unpublished edits and reload from data.json?')) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}
window.discardLocalChanges = discardLocalChanges;

// ── Persist to localStorage ───────────────────────────────────
function saveToLocalStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(window.portfolioData));
}

// ── Edit Dispatchers ──────────────────────────────────────────
function editSection(section) {
  const data = window.portfolioData;
  if (!data) return;

  const map = {
    hero:   () => { currentEdit = { type: 'hero',  id: null, isNew: false }; openEditModal('Edit Hero',            buildHeroForm(data.hero)); },
    about:  () => { currentEdit = { type: 'about', id: null, isNew: false }; openEditModal('Edit About & Contact', buildAboutForm(data.about)); },
    skills: () => { currentEdit = { type: 'skills',id: null, isNew: false }; openEditModal('Edit Skills',          buildSkillsForm(data.skills)); },
  };
  map[section]?.();
}
window.editSection = editSection;

function editItem(type, id) {
  const data = window.portfolioData;
  if (!data) return;
  const item = data[type].find(x => x.id === id);
  if (!item) return;
  currentEdit = { type, id, isNew: false };

  const titles = { experience: 'Edit Experience', education: 'Edit Education', projects: 'Edit Project' };
  const forms  = { experience: buildExperienceForm, education: buildEducationForm, projects: buildProjectForm };
  openEditModal(titles[type], forms[type](item));
}
window.editItem = editItem;

function addItem(type) {
  currentEdit = { type, id: null, isNew: true };
  const blank = {
    experience:   { id: Date.now(), title:'', company:'', period:'', location:'', domain:'', techStack:[], bullets:[] },
    education:    { id: Date.now(), institution:'', degree:'', score:'', period:'', location:'' },
    projects:     { id: Date.now(), name:'', description:'', period:'', techStack:[], highlights:[], github:'', live:'' },
    achievements: '',
  };
  const titles = { experience:'Add Experience', education:'Add Education', projects:'Add Project', achievements:'Add Achievement' };
  const forms  = {
    experience:   buildExperienceForm,
    education:    buildEducationForm,
    projects:     buildProjectForm,
    achievements: () => buildAchievementForm(''),
  };
  openEditModal(titles[type], forms[type](blank[type]));
}
window.addItem = addItem;

async function deleteItem(type, id) {
  if (!confirm('Delete this item? Saves immediately to your browser.')) return;
  const arr = window.portfolioData[type];
  const idx = arr.findIndex(x => x.id === id);
  if (idx === -1) return;
  arr.splice(idx, 1);
  saveToLocalStorage();
  reRender(type);
  showToast('Deleted \u2014 export data.json to publish', 'success');
}
window.deleteItem = deleteItem;

function editAchievement(idx) {
  currentEdit = { type: 'achievements', id: idx, isNew: false };
  openEditModal('Edit Achievement', buildAchievementForm(window.portfolioData.achievements[idx] || ''));
}
window.editAchievement = editAchievement;

async function deleteAchievement(idx) {
  if (!confirm('Delete this achievement?')) return;
  window.portfolioData.achievements.splice(idx, 1);
  saveToLocalStorage();
  renderAchievements(window.portfolioData);
  if (isAdmin) showAdminMode();
  showToast('Deleted \u2014 export data.json to publish', 'success');
}
window.deleteAchievement = deleteAchievement;

// ── Edit Modal ────────────────────────────────────────────────
function openEditModal(title, formHtml) {
  document.getElementById('edit-modal-title').textContent = title;
  document.getElementById('edit-modal-body').innerHTML = formHtml;
  document.getElementById('edit-modal').classList.remove('hidden');
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.add('hidden');
  currentEdit = null;
}
window.closeEditModal = closeEditModal;

async function saveChanges() {
  if (!currentEdit) return;
  // Guard: ensure data is loaded (fetch may have failed on file:// protocol)
  if (!window.portfolioData) {
    if (window.__PORTFOLIO_DEFAULT_DATA__) {
      window.portfolioData = JSON.parse(JSON.stringify(window.__PORTFOLIO_DEFAULT_DATA__));
    } else {
      showToast('Portfolio data not loaded — please refresh the page', 'error');
      return;
    }
  }
  const { type, id, isNew } = currentEdit;
  const btn = document.getElementById('save-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>&ensp;Saving\u2026';

  try {
    switch (type) {
      case 'hero':   window.portfolioData.hero   = extractHeroData();   break;
      case 'about':  window.portfolioData.about  = extractAboutData();  break;
      case 'skills': window.portfolioData.skills = extractSkillsData(); break;
      case 'experience':
      case 'education':
      case 'projects': {
        const item = type === 'experience' ? extractExperienceData()
                   : type === 'education'  ? extractEducationData()
                   :                          extractProjectData();
        if (isNew) {
          window.portfolioData[type].unshift(item); // newest at top
        } else {
          const idx = window.portfolioData[type].findIndex(x => x.id === id);
          if (idx !== -1) window.portfolioData[type][idx] = item;
        }
        break;
      }
      case 'achievements': {
        const text = document.getElementById('ach-text-input')?.value?.trim() || '';
        if (isNew) window.portfolioData.achievements.push(text);
        else       window.portfolioData.achievements[id] = text;
        break;
      }
    }

    saveToLocalStorage();
    renderAll(window.portfolioData);
    if (isAdmin) showAdminMode();
    closeEditModal();
    showToast('Saved to browser \u2713 \u2014 use Export to publish for everyone', 'success');
  } catch (e) {
    showToast(e.message || 'Save failed', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i>&ensp;Save Changes';
  }
}
window.saveChanges = saveChanges;

// ── Period Picker Helpers ─────────────────────────────────────
function parsePeriod(str) {
  str = (str || '').trim();
  const M = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,june:6,jul:7,july:7,aug:8,sep:9,sept:9,oct:10,nov:11,dec:12 };
  const parts = str.split(/\s*[\u2013\u2014-]\s*/);
  function toVal(s) {
    s = (s || '').trim();
    if (!s || s.toLowerCase() === 'present') return '';
    const m = s.match(/^(\w+)\s+(\d{4})$/);
    if (!m) return '';
    const mon = M[m[1].toLowerCase()];
    return mon ? `${m[2]}-${String(mon).padStart(2,'0')}` : '';
  }
  const start = toVal(parts[0]);
  const endPart = (parts[1] || '').trim();
  const isPresent = !endPart || endPart.toLowerCase() === 'present';
  return { start, end: isPresent ? '' : toVal(endPart), present: isPresent };
}

function formatPeriod(startVal, endVal, isPresent) {
  function fmt(val) {
    if (!val) return '';
    const [y, m] = val.split('-');
    return new Date(parseInt(y), parseInt(m) - 1, 1)
      .toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
  const s = fmt(startVal);
  const e = isPresent ? 'Present' : fmt(endVal);
  if (s && e) return `${s} \u2013 ${e}`;
  return s || e || '';
}

function buildPeriodPicker(periodStr) {
  const { start, end, present } = parsePeriod(periodStr);
  return `
    <div class="form-group">
      <label class="form-label">Period</label>
      <div class="period-picker">
        <div class="period-picker-row">
          <div class="period-picker-col">
            <label class="period-sub-label">From</label>
            <input id="f-period-start" type="month" class="form-input" value="${start}">
          </div>
          <div class="period-arrow">&#x2192;</div>
          <div class="period-picker-col">
            <label class="period-sub-label">To</label>
            <input id="f-period-end" type="month" class="form-input" value="${end}" ${present ? 'disabled' : ''}>
            <label class="present-label">
              <input type="checkbox" id="f-period-present" onchange="togglePresentEnd(this)" ${present ? 'checked' : ''}>
              <span>Present / Ongoing</span>
            </label>
          </div>
        </div>
      </div>
    </div>`;
}

function extractPeriod() {
  const start     = document.getElementById('f-period-start')?.value  || '';
  const end       = document.getElementById('f-period-end')?.value    || '';
  const isPresent = document.getElementById('f-period-present')?.checked || false;
  return formatPeriod(start, end, isPresent);
}

function togglePresentEnd(cb) {
  const el = document.getElementById('f-period-end');
  if (el) { el.disabled = cb.checked; if (cb.checked) el.value = ''; }
}
window.togglePresentEnd = togglePresentEnd;

// ── Form Builders ─────────────────────────────────────────────
function buildHeroForm(h) {
  return `
    <div class="form-group">
      <label class="form-label">Greeting text</label>
      <input id="f-greeting" type="text" class="form-input" value="${esc(h.greeting||'')}">
    </div>
    <div class="form-group">
      <label class="form-label">Name</label>
      <input id="f-name" type="text" class="form-input" value="${esc(h.name||'')}">
    </div>
    <div class="form-group">
      <label class="form-label">Tagline</label>
      <textarea id="f-tagline" class="form-textarea">${esc(h.tagline||'')}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Typewriter Titles (one per line)</label>
      <textarea id="f-titles" class="form-textarea" rows="5">${(h.titles||[]).join('\n')}</textarea>
    </div>`;
}

function buildAboutForm(a) {
  const c = a?.contact || {};
  return `
    <div class="form-group">
      <label class="form-label">Bio (paragraph 1)</label>
      <textarea id="f-bio" class="form-textarea" rows="4">${esc(a?.bio||'')}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Bio (paragraph 2 \u2013 optional)</label>
      <textarea id="f-bio2" class="form-textarea" rows="3">${esc(a?.bio2||'')}</textarea>
    </div>
    <div class="form-group-row">
      <div class="form-group">
        <label class="form-label">Email</label>
        <input id="f-email" type="email" class="form-input" value="${esc(c.email||'')}">
      </div>
      <div class="form-group">
        <label class="form-label">Phone</label>
        <input id="f-phone" type="text" class="form-input" value="${esc(c.phone||'')}">
      </div>
    </div>
    <div class="form-group-row">
      <div class="form-group">
        <label class="form-label">LinkedIn URL</label>
        <input id="f-linkedin" type="text" class="form-input" value="${esc(c.linkedin||'')}">
      </div>
      <div class="form-group">
        <label class="form-label">GitHub URL</label>
        <input id="f-github" type="text" class="form-input" value="${esc(c.github||'')}">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Location</label>
      <input id="f-location" type="text" class="form-input" value="${esc(c.location||'')}">
    </div>
    <div class="form-group">
      <label class="form-label">Stats (value | label, one per line \u2014 max 3)</label>
      <textarea id="f-stats" class="form-textarea" rows="3">${(a?.stats||[]).map(s=>`${s.value} | ${s.label}`).join('\n')}</textarea>
    </div>`;
}

function buildExperienceForm(j) {
  return `
    <div class="form-group">
      <label class="form-label">Job Title</label>
      <input id="f-title" type="text" class="form-input" value="${esc(j.title||'')}">
    </div>
    ${buildPeriodPicker(j.period||'')}
    <div class="form-group">
      <label class="form-label">Company</label>
      <input id="f-company" type="text" class="form-input" value="${esc(j.company||'')}">
    </div>
    <div class="form-group-row">
      <div class="form-group">
        <label class="form-label">Location</label>
        <input id="f-location" type="text" class="form-input" value="${esc(j.location||'')}">
      </div>
      <div class="form-group">
        <label class="form-label">Domain / Team</label>
        <input id="f-domain" type="text" class="form-input" value="${esc(j.domain||'')}">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Tech Stack</label>
      ${buildTagInput('techStack', j.techStack||[])}
    </div>
    <div class="form-group">
      <label class="form-label">Bullet Points</label>
      <div class="dynamic-list" id="dl-bullets">
        ${(j.bullets||[]).map(b => dynamicItem(b)).join('')}
      </div>
      <button type="button" class="list-add-btn mt-2" onclick="addDynamic('dl-bullets')">
        <i class="fas fa-plus"></i> Add Bullet
      </button>
    </div>
    <input type="hidden" id="f-item-id" value="${j.id||''}">`;
}

function buildEducationForm(e) {
  return `
    <div class="form-group">
      <label class="form-label">Institution</label>
      <input id="f-institution" type="text" class="form-input" value="${esc(e.institution||'')}">
    </div>
    <div class="form-group">
      <label class="form-label">Degree / Standard</label>
      <input id="f-degree" type="text" class="form-input" value="${esc(e.degree||'')}">
    </div>
    <div class="form-group">
      <label class="form-label">Score / CGPA</label>
      <input id="f-score" type="text" class="form-input" value="${esc(e.score||'')}">
    </div>
    ${buildPeriodPicker(e.period||'')}
    <div class="form-group">
      <label class="form-label">Location</label>
      <input id="f-location" type="text" class="form-input" value="${esc(e.location||'')}">
    </div>
    <input type="hidden" id="f-item-id" value="${e.id||''}">`;
}

function buildProjectForm(p) {
  return `
    <div class="form-group">
      <label class="form-label">Project Name</label>
      <input id="f-name" type="text" class="form-input" value="${esc(p.name||'')}">
    </div>
    ${buildPeriodPicker(p.period||'')}
    <div class="form-group">
      <label class="form-label">Short Description</label>
      <textarea id="f-desc" class="form-textarea" rows="3">${esc(p.description||'')}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Tech Stack</label>
      ${buildTagInput('techStack', p.techStack||[])}
    </div>
    <div class="form-group">
      <label class="form-label">Highlights</label>
      <div class="dynamic-list" id="dl-highlights">
        ${(p.highlights||[]).map(h => dynamicItem(h)).join('')}
      </div>
      <button type="button" class="list-add-btn mt-2" onclick="addDynamic('dl-highlights')">
        <i class="fas fa-plus"></i> Add Highlight
      </button>
    </div>
    <div class="form-group-row">
      <div class="form-group">
        <label class="form-label">GitHub URL</label>
        <input id="f-github" type="text" class="form-input" value="${esc(p.github||'')}">
      </div>
      <div class="form-group">
        <label class="form-label">Live URL</label>
        <input id="f-live" type="text" class="form-input" value="${esc(p.live||'')}">
      </div>
    </div>
    <input type="hidden" id="f-item-id" value="${p.id||''}">`;
}

function buildSkillsForm(skills) {
  const rows = Object.keys(skills || {}).map(cat => `
    <div class="skill-cat-row">
      <div class="skill-cat-row-head">
        <input type="text" class="form-input sc-name" value="${esc(cat)}" placeholder="Category name">
        <button type="button" class="btn-icon btn-danger" onclick="removeSkillCat(this)" title="Delete category">
          <i class="fas fa-trash"></i>
        </button>
      </div>
      <input type="text" class="form-input sc-items"
             value="${esc((skills[cat]||[]).join(', '))}"
             placeholder="Java, Python, C++ (comma-separated)">
    </div>`).join('');
  return `
    <p style="font-size:0.82rem;color:var(--t3);margin-bottom:8px;">Comma-separated skills per category.</p>
    <div class="skills-editor" id="skills-editor">${rows}</div>
    <button type="button" class="add-cat-btn mt-3" onclick="addSkillCat()">
      <i class="fas fa-plus"></i> Add Category
    </button>`;
}

function buildAchievementForm(text) {
  return `
    <div class="form-group">
      <label class="form-label">Achievement text (&lt;strong&gt; tags supported for bold)</label>
      <textarea id="ach-text-input" class="form-textarea" rows="4">${esc(text)}</textarea>
    </div>`;
}

// ── Tag Widget ────────────────────────────────────────────────
function buildTagInput(fieldId, tags) {
  const preview = tags.map(t => previewTag(t)).join('');
  return `
    <div class="tag-input-wrap">
      <div class="tag-list-preview" id="tp-${fieldId}">${preview}</div>
      <div class="tag-add-row">
        <input type="text" id="ti-${fieldId}" class="form-input"
               placeholder="Type a tag and press Add or Enter"
               onkeydown="if(event.key==='Enter'){event.preventDefault();addTag('${fieldId}');}">
        <button type="button" class="btn btn-sm btn-outline" onclick="addTag('${fieldId}')">Add</button>
      </div>
    </div>`;
}

function previewTag(text) {
  return `<span class="preview-tag">${esc(text)}<button type="button" onclick="removeTag(this)" title="Remove">&times;</button></span>`;
}

function addTag(fieldId) {
  const input = document.getElementById(`ti-${fieldId}`);
  const list  = document.getElementById(`tp-${fieldId}`);
  const val   = (input?.value || '').trim();
  if (!val || !list) return;
  const span  = document.createElement('span');
  span.className = 'preview-tag';
  span.innerHTML = `${esc(val)}<button type="button" onclick="removeTag(this)" title="Remove">&times;</button>`;
  list.appendChild(span);
  input.value = '';
  input.focus();
}
window.addTag = addTag;

function removeTag(btn) { btn.closest('.preview-tag')?.remove(); }
window.removeTag = removeTag;

function getTagsFrom(fieldId) {
  return [...(document.getElementById(`tp-${fieldId}`)?.querySelectorAll('.preview-tag') || [])]
    .map(s => s.childNodes[0].textContent.trim()).filter(Boolean);
}

// ── Dynamic List ──────────────────────────────────────────────
function dynamicItem(text) {
  return `<div class="dynamic-item">
    <textarea class="form-textarea">${esc(text)}</textarea>
    <button type="button" class="del-btn" onclick="removeDynamic(this)" title="Remove"><i class="fas fa-times"></i></button>
  </div>`;
}

function addDynamic(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.insertAdjacentHTML('beforeend', dynamicItem(''));
  el.querySelector('.dynamic-item:last-child textarea')?.focus();
}
window.addDynamic = addDynamic;

function removeDynamic(btn) { btn.closest('.dynamic-item')?.remove(); }
window.removeDynamic = removeDynamic;

function getDynamicValues(id) {
  return [...(document.getElementById(id)?.querySelectorAll('textarea') || [])]
    .map(t => t.value.trim()).filter(Boolean);
}

// ── Skills Editor helpers ──────────────────────────────────────
function removeSkillCat(btn) { btn.closest('.skill-cat-row')?.remove(); }
window.removeSkillCat = removeSkillCat;

function addSkillCat() {
  const editor = document.getElementById('skills-editor');
  if (!editor) return;
  editor.insertAdjacentHTML('beforeend', `
    <div class="skill-cat-row">
      <div class="skill-cat-row-head">
        <input type="text" class="form-input sc-name" value="" placeholder="Category name">
        <button type="button" class="btn-icon btn-danger" onclick="removeSkillCat(this)"><i class="fas fa-trash"></i></button>
      </div>
      <input type="text" class="form-input sc-items" value="" placeholder="Java, Python, C++ (comma-separated)">
    </div>`);
  editor.querySelector('.skill-cat-row:last-child .sc-name')?.focus();
}
window.addSkillCat = addSkillCat;

// ── Data Extractors ───────────────────────────────────────────
function extractHeroData() {
  return {
    greeting: document.getElementById('f-greeting')?.value?.trim() || '',
    name:     document.getElementById('f-name')?.value?.trim()     || '',
    tagline:  document.getElementById('f-tagline')?.value?.trim()  || '',
    titles:   (document.getElementById('f-titles')?.value || '').split('\n').map(s=>s.trim()).filter(Boolean),
  };
}

function extractAboutData() {
  const statsRaw = (document.getElementById('f-stats')?.value || '')
    .split('\n')
    .map(l => { const p = l.split('|').map(x=>x.trim()); return p.length>=2 ? { value:p[0], label:p[1] } : null; })
    .filter(Boolean);
  return {
    bio:   document.getElementById('f-bio')?.value?.trim()  || '',
    bio2:  document.getElementById('f-bio2')?.value?.trim() || '',
    stats: statsRaw,
    contact: {
      email:    document.getElementById('f-email')?.value?.trim()    || '',
      phone:    document.getElementById('f-phone')?.value?.trim()    || '',
      linkedin: document.getElementById('f-linkedin')?.value?.trim() || '',
      github:   document.getElementById('f-github')?.value?.trim()   || '',
      location: document.getElementById('f-location')?.value?.trim() || '',
    },
  };
}

function extractExperienceData() {
  return {
    id:        parseInt(document.getElementById('f-item-id')?.value) || Date.now(),
    title:     document.getElementById('f-title')?.value?.trim()    || '',
    company:   document.getElementById('f-company')?.value?.trim()  || '',
    period:    extractPeriod(),
    location:  document.getElementById('f-location')?.value?.trim() || '',
    domain:    document.getElementById('f-domain')?.value?.trim()   || '',
    techStack: getTagsFrom('techStack'),
    bullets:   getDynamicValues('dl-bullets'),
  };
}

function extractEducationData() {
  return {
    id:          parseInt(document.getElementById('f-item-id')?.value) || Date.now(),
    institution: document.getElementById('f-institution')?.value?.trim() || '',
    degree:      document.getElementById('f-degree')?.value?.trim()      || '',
    score:       document.getElementById('f-score')?.value?.trim()       || '',
    period:      extractPeriod(),
    location:    document.getElementById('f-location')?.value?.trim()    || '',
  };
}

function extractProjectData() {
  return {
    id:          parseInt(document.getElementById('f-item-id')?.value) || Date.now(),
    name:        document.getElementById('f-name')?.value?.trim()   || '',
    description: document.getElementById('f-desc')?.value?.trim()   || '',
    period:      extractPeriod(),
    techStack:   getTagsFrom('techStack'),
    highlights:  getDynamicValues('dl-highlights'),
    github:      document.getElementById('f-github')?.value?.trim() || '',
    live:        document.getElementById('f-live')?.value?.trim()   || '',
  };
}

function extractSkillsData() {
  const result = {};
  document.querySelectorAll('#skills-editor .skill-cat-row').forEach(row => {
    const name  = row.querySelector('.sc-name')?.value?.trim();
    const items = (row.querySelector('.sc-items')?.value || '').split(',').map(s=>s.trim()).filter(Boolean);
    if (name) result[name] = items;
  });
  return result;
}

// ── Re-render helper ──────────────────────────────────────────
function reRender(type) {
  switch (type) {
    case 'experience':
    case 'education': renderExperience(window.portfolioData); break;
    case 'projects':  renderProjects(window.portfolioData);   break;
  }
  if (isAdmin) showAdminMode();
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className   = `toast toast-${type}`;
  el.classList.remove('hidden');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add('hidden'), 4000);
}
window.showToast = showToast;
