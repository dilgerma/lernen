export interface ScoreRow {
  minutes_total: number;
  minutes_in_current_doner: number;
  doners_earned: number;
  last_activity_date: string;
  minutes_today: number;
}

export interface DonerIngredient {
  id: string;
  name: string;
  emoji: string;
  minutesRequired: number;
  unlocked: boolean;
  minutesRemaining: number;
}

export interface RankInfo {
  name: string;
  badge: string;
  nextRank: string | null;
  progressPercent: number;
  minutesToNext: number | null;
}

export interface ScoreState {
  minutesTotal: number;
  minutesInCurrentDoner: number;
  minutesToday: number;
  donersEarned: number;
  rank: RankInfo;
  ingredients: DonerIngredient[];
  donerComplete: boolean;
  nextIngredient: DonerIngredient | null;
  donerProgressPercent: number;
}

export const DONER_INGREDIENTS: Omit<DonerIngredient, 'unlocked' | 'minutesRemaining'>[] = [
  { id: 'brot',    name: 'Brot',   emoji: '🥙', minutesRequired: 0 },
  { id: 'salat',   name: 'Salat',  emoji: '🥗', minutesRequired: 60 },
  { id: 'tomate',  name: 'Tomate', emoji: '🍅', minutesRequired: 120 },
  { id: 'zwiebel', name: 'Zwiebel',emoji: '🧅', minutesRequired: 180 },
  { id: 'fleisch', name: 'Fleisch',emoji: '🥩', minutesRequired: 240 },
  { id: 'sosse',   name: 'Soße',   emoji: '🧄', minutesRequired: 300 },
];

const RANKS = [
  { name: 'Rekrut',          badge: '☆',  minutes: 0 },
  { name: 'Schütze I',       badge: '★',  minutes: 30 },
  { name: 'Schütze II',      badge: '★★', minutes: 60 },
  { name: 'Gefreiter I',     badge: '🥉', minutes: 120 },
  { name: 'Gefreiter II',    badge: '🥉', minutes: 180 },
  { name: 'Unteroffizier I', badge: '🥈', minutes: 300 },
  { name: 'Unteroffizier II',badge: '🥈', minutes: 420 },
  { name: 'Unteroffizier III',badge:'🥈', minutes: 600 },
  { name: 'Leutnant',        badge: '🥇', minutes: 900 },
  { name: 'Hauptmann',       badge: '🥇', minutes: 1200 },
  { name: 'Major',           badge: '🏅', minutes: 1800 },
  { name: 'Oberst',          badge: '🏅', minutes: 2700 },
  { name: 'General',         badge: '👑', minutes: 3600 },
];

export function getRank(minutesTotal: number): RankInfo {
  let idx = 0;
  for (let i = 0; i < RANKS.length; i++) {
    if (minutesTotal >= RANKS[i].minutes) idx = i;
  }
  const current = RANKS[idx];
  const next = RANKS[idx + 1] ?? null;
  const progressPercent = next
    ? Math.floor(((minutesTotal - current.minutes) / (next.minutes - current.minutes)) * 100)
    : 100;
  return {
    name: current.name,
    badge: current.badge,
    nextRank: next?.name ?? null,
    progressPercent,
    minutesToNext: next ? next.minutes - minutesTotal : null,
  };
}

export function computeScoreState(raw: ScoreRow): ScoreState {
  const rank = getRank(raw.minutes_total);
  const minutes = raw.minutes_in_current_doner;
  const ingredients: DonerIngredient[] = DONER_INGREDIENTS.map(ing => ({
    ...ing,
    unlocked: minutes >= ing.minutesRequired,
    minutesRemaining: Math.max(0, ing.minutesRequired - minutes),
  }));
  const paidIngredients = ingredients.filter(i => i.minutesRequired > 0);
  const donerComplete = paidIngredients.every(i => i.unlocked);
  const nextIngredient = paidIngredients.find(i => !i.unlocked) ?? null;
  const donerProgressPercent = Math.min(100, Math.floor((minutes / 300) * 100));

  return {
    minutesTotal: raw.minutes_total,
    minutesInCurrentDoner: raw.minutes_in_current_doner,
    minutesToday: raw.minutes_today,
    donersEarned: raw.doners_earned,
    rank,
    ingredients,
    donerComplete,
    nextIngredient,
    donerProgressPercent,
  };
}
