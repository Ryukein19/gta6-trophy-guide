// Filtering, search and the spoiler setting for the trophy checklist.
// A trophy is shown when it passes every active filter at once.
// The spoiler hides the name and description of story and missable trophies
// until they are earned; the row stays visible so it can still be ticked.

export function readFilters(state) {
  return {
    kind: state.kind,
    grade: state.grade,
    earned: state.earned,
    query: state.query.trim().toLowerCase(),
  };
}

export function trophyMatches(trophy, filters, earnedSet) {
  if (filters.kind !== 'all' && trophy.kind !== filters.kind) return false;
  if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
  const isEarned = earnedSet.has(trophy.name);
  if (filters.earned === 'earned' && !isEarned) return false;
  if (filters.earned === 'unearned' && isEarned) return false;
  if (filters.query) {
    const hay = `${trophy.name} ${trophy.description}`.toLowerCase();
    if (!hay.includes(filters.query)) return false;
  }
  return true;
}

export function spoilerHides(trophy, spoilerOn, earnedSet) {
  if (!spoilerOn) return false;
  if (earnedSet.has(trophy.name)) return false;
  return trophy.kind === 'story' || trophy.kind === 'missable';
}

export function visibleCount(trophies, filters, earnedSet) {
  return trophies.filter((t) => trophyMatches(t, filters, earnedSet)).length;
}
