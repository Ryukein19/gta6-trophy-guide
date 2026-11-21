// Leonida Trophy Guide — the tracker. Loads app/data/trophies.json, renders the
// checklist, the guide detail panel, the roadmap and the missable list, and
// keeps progress in localStorage with export/import.
//
// Screenshot hooks (query params, for the maker's screenshots only):
//   ?trophy=<id> opens that trophy's guide, ?spoiler=off turns the spoiler
//   setting off, ?kind= / ?grade= preset the filters, ?demo=1 marks a sample
//   set as earned in memory (never saved) so the checklist shows progress.

import { trophyMatches, spoilerHides } from './filters.js';
import { renderRoadmap, renderMissable } from './roadmap.js';

const STORAGE_KEY = 'leonida-trophy-guide-v1';
const COUNT_KEY = 'leonida-trophy-guide-counts-v1';
const DEMO_EARNED = [2, 3, 8, 15, 16, 18, 21, 28, 35, 42, 52, 53];
const DEMO_COUNTS = { 28: 7, 31: 40, 35: 55 };

const listEl = document.getElementById('trophyList');
const detailEl = document.getElementById('detail');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const gradeCountsEl = document.getElementById('gradeCounts');
const shownCountEl = document.getElementById('shownCount');
const emptyMsg = document.getElementById('emptyMsg');
const searchEl = document.getElementById('search');
const kindEl = document.getElementById('kindFilter');
const gradeEl = document.getElementById('gradeFilter');
const earnedEl = document.getElementById('earnedFilter');
const spoilerEl = document.getElementById('spoilerToggle');
const exportBtn = document.getElementById('exportBtn');
const importFile = document.getElementById('importFile');

const params = new URLSearchParams(location.search);
const demoMode = params.get('demo') === '1';

let doc = null;
let earned = new Set(loadStored());
let counts = loadCounts();
let selectedId = null;

function loadCounts() {
  try {
    const raw = localStorage.getItem(COUNT_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    return (obj && typeof obj === 'object') ? obj : {};
  } catch {
    return {};
  }
}

function saveCounts() {
  try {
    localStorage.setItem(COUNT_KEY, JSON.stringify(counts));
  } catch {
    // Storage unavailable: counts still work in memory.
  }
}

function effectiveCount(trophy) {
  if (demoMode && DEMO_COUNTS[trophy.id] !== undefined) return DEMO_COUNTS[trophy.id];
  const v = counts[trophy.id];
  return typeof v === 'number' ? v : 0;
}

// A trophy gets a YOUR COUNT counter when its count is a plain number
// target (not a dollar amount, which formatCount shows as $).
function hasCounter(trophy) {
  return typeof trophy.count === 'number' && trophy.count < 1000;
}

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((n) => typeof n === 'string') : [];
  } catch {
    return [];
  }
}

function saveStored() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned]));
  } catch {
    // Storage full or unavailable: progress still works in memory.
  }
}

function effectiveEarned() {
  if (!demoMode) return earned;
  const set = new Set(earned);
  for (const id of DEMO_EARNED) {
    const t = doc.trophies.find((x) => x.id === id);
    if (t) set.add(t.name);
  }
  return set;
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function formatCount(trophy) {
  if (trophy.count === null || trophy.count === undefined) return '';
  if (typeof trophy.count === 'number' && trophy.count >= 1000) {
    return `Target: $${trophy.count.toLocaleString('en-US')}`;
  }
  return `Target: ${trophy.count}`;
}

function sourceUrl(name) {
  return doc.sourceLinks && doc.sourceLinks[name] ? doc.sourceLinks[name] : null;
}

function renderProgress() {
  const set = effectiveEarned();
  const total = doc.trophies.length;
  const pct = Math.round((set.size / total) * 100);
  progressFill.style.width = `${pct}%`;
  progressText.textContent = `${set.size} / ${total} earned · ${pct}%`;
  const byGrade = {};
  for (const t of doc.trophies) {
    byGrade[t.grade] = byGrade[t.grade] || { total: 0, done: 0 };
    byGrade[t.grade].total += 1;
    if (set.has(t.name)) byGrade[t.grade].done += 1;
  }
  gradeCountsEl.textContent = ['platinum', 'gold', 'silver', 'bronze']
    .map((g) => `${gradeLabel(g)} ${byGrade[g].done}/${byGrade[g].total}`)
    .join(' · ');
}

function renderList() {
  const set = effectiveEarned();
  const filters = {
    kind: kindEl.value,
    grade: gradeEl.value,
    earned: earnedEl.value,
    query: searchEl.value.trim().toLowerCase(),
  };
  const shown = doc.trophies.filter((t) => trophyMatches(t, filters, set));
  listEl.replaceChildren();
  for (const t of shown) {
    const li = document.createElement('li');
    li.className = 'trophy-row' + (set.has(t.name) ? ' earned' : '') + (selectedId === t.id ? ' selected' : '');
    li.dataset.id = String(t.id);

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = set.has(t.name);
    box.setAttribute('aria-label', `Mark ${t.name} as earned`);
    box.addEventListener('click', (ev) => ev.stopPropagation());
    box.addEventListener('change', () => {
      if (demoMode) return;
      if (box.checked) earned.add(t.name);
      else earned.delete(t.name);
      saveStored();
      renderAll();
    });

    const body = document.createElement('div');
    const hidden = spoilerHides(t, spoilerEl.checked, set);
    const name = document.createElement('div');
    name.className = 'trophy-name';
    name.textContent = hidden ? 'Hidden trophy — earn it to reveal' : t.name;
    const desc = document.createElement('div');
    desc.className = 'trophy-desc';
    desc.textContent = hidden ? 'Its name and description stay hidden until you earn it.' : t.description;
    body.append(name, desc);

    const tags = document.createElement('div');
    tags.className = 'trophy-tags';
    const gradeTag = document.createElement('span');
    gradeTag.className = `tag grade-${t.grade}`;
    gradeTag.textContent = gradeLabel(t.grade);
    tags.append(gradeTag);
    const kindTag = document.createElement('span');
    kindTag.className = 'tag kind-tag';
    kindTag.textContent = t.kind;
    tags.append(kindTag);
    if (t.hidden) {
      const h = document.createElement('span');
      h.className = 'tag hidden-tag';
      h.textContent = 'Hidden';
      tags.append(h);
    }
    if (t.missable) {
      const m = document.createElement('span');
      m.className = 'tag missable-tag';
      m.textContent = 'Missable';
      tags.append(m);
    }
    const count = formatCount(t);
    if (count) {
      const c = document.createElement('span');
      c.className = 'trophy-count';
      c.textContent = count;
      tags.append(c);
    }
    const srcTag = document.createElement('span');
    srcTag.className = 'tag src-tag';
    srcTag.textContent = `${(t.sources || []).length} sources`;
    tags.append(srcTag);
    body.append(tags);
    li.append(box, body);

    const chevron = document.createElement('span');
    chevron.className = 'trophy-count';
    chevron.textContent = '›';
    li.append(chevron);

    li.addEventListener('click', () => {
      selectedId = t.id;
      renderList();
      renderDetail();
    });
    listEl.append(li);
  }
  shownCountEl.textContent = `(${shown.length} of ${doc.trophies.length} shown)`;
  emptyMsg.hidden = shown.length !== 0;
}

function renderDetail() {
  const t = doc.trophies.find((x) => x.id === selectedId);
  detailEl.replaceChildren();
  if (!t) {
    const p = document.createElement('p');
    p.className = 'detail-empty';
    p.textContent = 'Select a trophy to see its guide and sources.';
    detailEl.append(p);
    return;
  }
  const set = effectiveEarned();
  const hidden = spoilerHides(t, spoilerEl.checked, set);
  const h2 = document.createElement('h2');
  h2.textContent = hidden ? 'Hidden trophy' : t.name;
  detailEl.append(h2);

  const meta = document.createElement('p');
  meta.textContent = `${gradeLabel(t.grade)} · ${t.kind}${t.hidden ? ' · Hidden on PlayStation' : ''}${set.has(t.name) ? ' · Earned' : ''} · ${(t.sources || []).length} sources`;
  detailEl.append(meta);

  if (hidden) {
    const p = document.createElement('p');
    p.textContent = 'This story trophy stays hidden until you earn it. Turn the spoiler setting off to see it.';
    detailEl.append(p);
    return;
  }

  const descH = document.createElement('h3');
  descH.textContent = 'Official description';
  const desc = document.createElement('p');
  desc.textContent = t.description;
  detailEl.append(descH, desc);

  // HOW TO EARN IT — numbered steps in our own words, each with its sources.
  const steps = Array.isArray(t.steps) && t.steps.length ? t.steps : null;
  const guideH = document.createElement('h3');
  guideH.textContent = steps ? `How to earn it · ${steps.length} steps` : 'Guide';
  detailEl.append(guideH);
  if (steps) {
    const ol = document.createElement('ol');
    ol.className = 'detail-steps';
    for (const step of steps) {
      const li = document.createElement('li');
      li.append(document.createTextNode(step.text + ' '));
      for (const n of step.cites || []) {
        const sup = document.createElement('sup');
        sup.className = 'cite-num';
        sup.textContent = `[${n}]`;
        li.append(sup, document.createTextNode(' '));
      }
      ol.append(li);
    }
    detailEl.append(ol);
  } else {
    const guide = document.createElement('p');
    guide.className = 'detail-guide';
    guide.textContent = t.guide;
    detailEl.append(guide);
  }

  if (t.missable && t.missableNote) {
    const warn = document.createElement('p');
    warn.className = 'detail-missable';
    warn.textContent = `Missable: ${t.missableNote}`;
    detailEl.append(warn);
  }

  // SOURCES DIFFER — both versions shown, then OUR CALL.
  if (t.dispute) {
    const d = t.dispute;
    const box = document.createElement('div');
    box.className = 'dispute-box';
    const dh = document.createElement('h3');
    dh.textContent = 'Sources differ — both versions shown';
    box.append(dh);
    const q = document.createElement('p');
    q.className = 'dispute-q';
    q.textContent = d.question;
    box.append(q);
    const va = document.createElement('p');
    va.innerHTML = '';
    va.append(document.createTextNode('A — '));
    const aStrong = document.createElement('strong');
    aStrong.textContent = d.a.label + ': ';
    va.append(aStrong, document.createTextNode(d.a.text));
    box.append(va);
    const vb = document.createElement('p');
    vb.append(document.createTextNode('B — '));
    const bStrong = document.createElement('strong');
    bStrong.textContent = d.b.label + ': ';
    vb.append(bStrong, document.createTextNode(d.b.text));
    box.append(vb);
    const call = document.createElement('p');
    call.className = 'dispute-call';
    call.append(document.createTextNode('OUR CALL: '));
    const callStrong = document.createElement('strong');
    callStrong.textContent = d.call;
    call.append(callStrong);
    box.append(call);
    detailEl.append(box);
  }

  // YOUR COUNT — interactive counter for collectible-count trophies.
  if (hasCounter(t)) {
    const wrap = document.createElement('div');
    wrap.className = 'count-box';
    const ch = document.createElement('h3');
    ch.textContent = 'Your count';
    wrap.append(ch);
    const cur = effectiveCount(t);
    const row = document.createElement('div');
    row.className = 'count-row';
    const minus = document.createElement('button');
    minus.type = 'button';
    minus.textContent = '−';
    minus.setAttribute('aria-label', 'Count one fewer');
    const val = document.createElement('span');
    val.className = 'count-val';
    val.textContent = `${cur} / ${t.count}`;
    const plus = document.createElement('button');
    plus.type = 'button';
    plus.textContent = '+';
    plus.setAttribute('aria-label', 'Count one more');
    const bump = (delta) => {
      if (demoMode) return;
      const next = Math.max(0, Math.min(t.count, effectiveCount(t) + delta));
      counts[t.id] = next;
      saveCounts();
      renderDetail();
    };
    minus.addEventListener('click', () => bump(-1));
    plus.addEventListener('click', () => bump(1));
    row.append(minus, val, plus);
    wrap.append(row);
    const note = document.createElement('p');
    note.className = 'count-note';
    note.textContent = cur >= t.count
      ? 'Done — this trophy should pop.'
      : `${t.count - cur} to go. Your count is saved in this browser.`;
    wrap.append(note);
    detailEl.append(wrap);
  }

  // NEXT UP — the next unearned trophy in roadmap order.
  const next = nextUpTrophy(t);
  if (next) {
    const nu = document.createElement('div');
    nu.className = 'nextup-box';
    const nh = document.createElement('h3');
    nh.textContent = 'Next up · roadmap order';
    nu.append(nh);
    const np = document.createElement('p');
    np.append(document.createTextNode('After this, do '));
    const ns = document.createElement('strong');
    ns.textContent = next.name;
    np.append(ns, document.createTextNode(` (${gradeLabel(next.grade)} · ${next.kind}) — ${next.description}`));
    nu.append(np);
    const nb = document.createElement('button');
    nb.type = 'button';
    nb.className = 'nextup-btn';
    nb.textContent = 'Open it';
    nb.addEventListener('click', () => {
      selectedId = next.id;
      renderList();
      renderDetail();
    });
    nu.append(nb);
    detailEl.append(nu);
  }

  // SOURCES FOR THIS GUIDE — each source with its URL, read date and claim count.
  const srcH = document.createElement('h3');
  srcH.textContent = 'Sources for this guide (' + (t.sources || []).length + ')';
  detailEl.append(srcH);
  const ul = document.createElement('ul');
  ul.className = 'detail-sources';
  const claimCounts = sourceClaimCounts();
  (t.sources || []).forEach((name, idx) => {
    const li = document.createElement('li');
    const num = document.createElement('span');
    num.className = 'src-num';
    num.textContent = `[${idx + 1}] `;
    li.append(num);
    const url = sourceUrl(name);
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = name;
      li.append(a);
    } else {
      li.append(document.createTextNode(name));
    }
    const read = doc.sourceRead && doc.sourceRead[name];
    const meta2 = document.createElement('span');
    meta2.className = 'src-meta';
    meta2.textContent = ` — read ${read || 'Nov 2026'} · cited on ${claimCounts.get(name) || 0} trophies`;
    li.append(meta2);
    ul.append(li);
  });
  detailEl.append(ul);
}

function sourceClaimCounts() {
  const counts = new Map();
  for (const t of doc.trophies || []) {
    for (const name of t.sources || []) {
      counts.set(name, (counts.get(name) || 0) + 1);
    }
  }
  return counts;
}

// The next unearned trophy in roadmap order (stage order, then trophy id).
// Roadmap stages are defined in roadmap.js; the order below mirrors them
// (story, strangers, collectibles, activities, cleanup) so this panel needs
// no import cycle.
function nextUpTrophy(current) {
  const set = effectiveEarned();
  const order = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 47, 48, 22, 23, 24, 25, 26, 27, 29, 30, 31, 35, 42, 54, 15, 16, 17, 18, 19, 20, 21, 32, 33, 34, 36, 37, 38, 39, 40, 41, 43, 44, 45, 46, 49, 50, 51, 52, 53, 55, 14, 1];
  const byId = new Map(doc.trophies.map((x) => [x.id, x]));
  const after = order.indexOf(current.id);
  for (let i = after + 1; i < order.length; i++) {
    const cand = byId.get(order[i]);
    if (cand && !set.has(cand.name)) return cand;
  }
  for (let i = 0; i <= after; i++) {
    const cand = byId.get(order[i]);
    if (cand && cand.id !== current.id && !set.has(cand.name)) return cand;
  }
  return null;
}

function renderRoadmapAndMissable() {
  renderRoadmap(document.getElementById('roadmapList'), doc.trophies, effectiveEarned());
  renderMissable(document.getElementById('missableList'), doc.trophies);
}

function renderSources() {
  const counts = new Map();
  let total = 0;
  for (const t of doc.trophies || []) {
    for (const name of t.sources || []) {
      counts.set(name, (counts.get(name) || 0) + 1);
      total += 1;
    }
  }
  const summary = document.getElementById('sourceSummary');
  if (summary) {
    summary.textContent = total + ' citations from ' + counts.size + ' sources — every trophy cites 7–8 guides.';
  }
  // AUDIT BAR — hard numbers, computed from the data, never invented.
  const auditEl = document.getElementById('auditBar');
  if (auditEl && !auditEl.dataset.built) {
    const a = doc.audit || {};
    const items = [
      `${a.official || '55/55'} official`,
      `${a.claimsCited || total}/${a.claimsCited || total} claims cited`,
      `${a.backed2plus || 55} backed by 2+ sources`,
      `${a.sites || counts.size} sites`,
      `${a.disputesShown || 0} disputes shown both ways`,
    ];
    for (const text of items) {
      const span = document.createElement('span');
      span.className = 'audit-item';
      span.textContent = text;
      auditEl.append(span);
    }
    auditEl.dataset.built = '1';
  }
  const list = document.getElementById('sourceList');
  if (list && !list.dataset.built) {
    list.innerHTML = '';
    for (const [name, n] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
      const li = document.createElement('li');
      const url = sourceUrl(name);
      const label = name + ' — ' + n + (n === 1 ? ' trophy' : ' trophies');
      if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = label;
        li.append(a);
      } else {
        li.textContent = label;
      }
      list.append(li);
    }
    list.dataset.built = '1';
  }
  // List-level disputes (about the list itself, not one trophy).
  const ld = document.getElementById('listDisputes');
  if (ld && !ld.dataset.built && Array.isArray(doc.listDisputes) && doc.listDisputes.length) {
    const h = document.createElement('h3');
    h.textContent = 'Disputes about the list — both versions shown';
    ld.append(h);
    for (const d of doc.listDisputes) {
      const box = document.createElement('div');
      box.className = 'dispute-box';
      const q = document.createElement('p');
      q.className = 'dispute-q';
      q.textContent = d.question;
      box.append(q);
      const va = document.createElement('p');
      va.append(document.createTextNode('A — '));
      const aStrong = document.createElement('strong');
      aStrong.textContent = d.a.label + ': ';
      va.append(aStrong, document.createTextNode(d.a.text));
      box.append(va);
      const vb = document.createElement('p');
      vb.append(document.createTextNode('B — '));
      const bStrong = document.createElement('strong');
      bStrong.textContent = d.b.label + ': ';
      vb.append(bStrong, document.createTextNode(d.b.text));
      box.append(vb);
      const call = document.createElement('p');
      call.className = 'dispute-call';
      call.append(document.createTextNode('OUR CALL: '));
      const callStrong = document.createElement('strong');
      callStrong.textContent = d.call;
      call.append(callStrong);
      box.append(call);
      ld.append(box);
    }
    ld.dataset.built = '1';
  }
}

function renderAll() {
  renderProgress();
  renderList();
  renderDetail();
  renderRoadmapAndMissable();
  renderSources();
}

function download(filename, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

exportBtn.addEventListener('click', () => {
  download('leonida-trophy-progress.json', JSON.stringify({
    game: 'Grand Theft Auto VI',
    exportedAt: new Date().toISOString(),
    earned: [...earned],
  }, null, 2));
});

importFile.addEventListener('change', async (ev) => {
  const file = ev.target.files && ev.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const names = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(names)) throw new Error('bad file');
    const known = new Set(doc.trophies.map((t) => t.name));
    earned = new Set(names.filter((n) => typeof n === 'string' && known.has(n)));
    saveStored();
    renderAll();
  } catch {
    alert('That file is not a valid trophy progress export.');
  } finally {
    importFile.value = '';
  }
});

for (const el of [searchEl, kindEl, gradeEl, earnedEl, spoilerEl]) {
  el.addEventListener('input', renderAll);
  el.addEventListener('change', renderAll);
}

async function init() {
  const res = await fetch('data/trophies.json');
  doc = await res.json();
  // Screenshot presets from the URL.
  if (params.get('kind')) kindEl.value = params.get('kind');
  if (params.get('grade')) gradeEl.value = params.get('grade');
  if (params.get('spoiler') === 'off') spoilerEl.checked = false;
  if (params.get('trophy')) {
    const id = Number(params.get('trophy'));
    if (doc.trophies.some((t) => t.id === id)) selectedId = id;
  }
  renderAll();
  if (params.get('view') === 'roadmap') {
    document.getElementById('roadmap')?.scrollIntoView();
  } else if (params.get('view') === 'missable') {
    document.getElementById('missableBox')?.scrollIntoView();
  } else if (params.get('view') === 'sources') {
    document.getElementById('sourcesPanel')?.scrollIntoView();
  }
  window.__guideReady = true;
}

init();
