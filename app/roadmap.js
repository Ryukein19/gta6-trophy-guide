// Roadmap to the platinum, built from the official trophy descriptions.
// Stages run in order; each stage names the trophies it covers and why it
// comes at that point. "Do it early" marks the one missable spot.
// Round 2: the guides behind each stage now cite 5–6 sources each, so the roadmap steps link to deeper reading.
// Round 3: the guides behind each stage now cite 7–8 sources each, and the detail panel shows the next trophy in roadmap order.

export const ROADMAP_STAGES = [
  {
    id: 'story',
    title: 'Stage 1 — Story first (Chapters 1–4 + final mission)',
    text: 'Play the story in order. The chapter and mission trophies pop as you go, and the final mission closes the campaign. While you are in Chapter 1, do the one missable thing: meditate at Jason\u2019s house.',
    trophies: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 47, 48],
    early: 'Do it early: Positive Mental Attitude — meditate at Jason\u2019s house in Chapter 1.',
  },
  {
    id: 'strangers',
    title: 'Stage 2 — Stranger missions (Andy, Kenton, Billy, Randy, Tyrone)',
    text: 'Work the stranger strands across Leonida. Each of the five named strangers has a chain ending in a final mission — and those chains open in windows tied to story progress, so start them when they appear rather than leaving them to the end. Finishing 8 strands also earns Strangers & Freaks, and Bret\u2019s hunt is here too.',
    trophies: [22, 23, 24, 25, 26, 27, 29],
    early: '',
  },
  {
    id: 'collectibles',
    title: 'Stage 3 — Collectibles and exploration',
    text: 'Sweep the map: card sets, WAiNK locations, vehicles, all 52 areas of Leonida, and the garage properties. These are pure totals — use the in-game tracking to see what is left and finish them in one sweep.',
    trophies: [30, 31, 35, 42, 54],
    early: '',
  },
  {
    id: 'activities',
    title: 'Stage 4 — Activities, races and challenges',
    text: 'The long middle: stunts, shooting range golds, drone races, races, fishing, arcade, bowling, challenges, heists and the money trophies. Most are repeatable, so grind them in any order — the shooting range (42 golds) and the 250 stunts take the longest.',
    trophies: [15, 16, 17, 18, 19, 20, 21, 32, 33, 34, 36, 37, 38, 39, 40, 41, 43, 44, 45, 46, 49, 50, 51, 52, 53, 55],
    early: '',
  },
  {
    id: 'cleanup',
    title: 'Stage 5 — Cleanup: 100% and the platinum',
    text: 'When everything else is done, the 100% completion trophy pops, and the platinum follows it. Check the in-game stats for anything still open before you call it finished.',
    trophies: [14, 1],
    early: '',
  },
];

export function stageOf(trophy) {
  return ROADMAP_STAGES.find((s) => s.trophies.includes(trophy.id)) || null;
}

export function renderRoadmap(listEl, trophies, earned) {
  const byId = new Map(trophies.map((t) => [t.id, t]));
  listEl.replaceChildren();
  for (const stage of ROADMAP_STAGES) {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    const done = stage.trophies.filter((id) => earned.has(byId.get(id)?.name)).length;
    strong.textContent = `${stage.title} — ${done}/${stage.trophies.length} done`;
    const p = document.createElement('p');
    p.textContent = stage.text;
    li.append(strong, p);
    if (stage.early) {
      const early = document.createElement('p');
      early.className = 'stage-count';
      early.textContent = stage.early;
      li.append(early);
    }
    const names = document.createElement('p');
    names.textContent = stage.trophies
      .map((id) => byId.get(id)?.name ?? `#${id}`)
      .join(' · ');
    li.append(names);
    listEl.append(li);
  }
}

export function renderMissable(listEl, trophies) {
  const missable = trophies.filter((t) => t.missable);
  listEl.replaceChildren();
  for (const t of missable) {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = t.name;
    li.append(strong, document.createTextNode(` — ${t.missableNote || t.description}`));
    listEl.append(li);
  }
}
