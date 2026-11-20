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
const DEMO_EARNED = [2, 3, 8, 15, 16, 18, 21, 28, 35, 42, 52, 53];

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
let selectedId = null;

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
  meta.textContent = `${gradeLabel(t.grade)} · ${t.kind}${t.hidden ? ' · Hidden on PlayStation' : ''}${set.has(t.name) ? ' · Earned' : ''}`;
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

  const guideH = document.createElement('h3');
  guideH.textContent = 'Guide';
  const guide = document.createElement('p');
  guide.className = 'detail-guide';
  guide.textContent = t.guide;
  detailEl.append(guideH, guide);

  if (t.missable && t.missableNote) {
    const warn = document.createElement('p');
    warn.className = 'detail-missable';
    warn.textContent = `Missable: ${t.missableNote}`;
    detailEl.append(warn);
  }

  const srcH = document.createElement('h3');
  srcH.textContent = 'Sources';
  const ul = document.createElement('ul');
  ul.className = 'detail-sources';
  for (const name of t.sources || []) {
    const li = document.createElement('li');
    const url = sourceUrl(name);
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = name;
      li.append(a);
    } else {
      li.textContent = name;
    }
    ul.append(li);
  }
  detailEl.append(srcH, ul);
}

function renderRoadmapAndMissable() {
  renderRoadmap(document.getElementById('roadmapList'), doc.trophies, effectiveEarned());
  renderMissable(document.getElementById('missableList'), doc.trophies);
}

function renderAll() {
  renderProgress();
  renderList();
  renderDetail();
  renderRoadmapAndMissable();
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
  }
  window.__guideReady = true;
}

init();
