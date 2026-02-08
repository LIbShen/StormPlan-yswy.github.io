import { readJson, writeJson } from './storage';

export type CourseMeta = {
  learners: number;
  likes: number;
  favorites: number;
  shares: number;
};

type Store = Record<string, CourseMeta>;

const KEY = 'yswy:courseMeta';

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

const seedMeta = (courseId: string): CourseMeta => {
  const h = hash(courseId);
  const learners = 120 + (h % 9800);
  const likes = 8 + ((h >>> 3) % 2600);
  const favorites = 5 + ((h >>> 7) % 1800);
  const shares = 2 + ((h >>> 11) % 900);
  return { learners, likes, favorites, shares };
};

export const getCourseMeta = (courseId: string): CourseMeta => {
  const store = readJson<Store>(KEY, {});
  const existing = store[courseId];
  if (existing) return existing;
  const seeded = seedMeta(courseId);
  store[courseId] = seeded;
  writeJson(KEY, store);
  return seeded;
};

export const updateCourseMeta = (courseId: string, patch: Partial<CourseMeta>): CourseMeta => {
  const store = readJson<Store>(KEY, {});
  const prev = store[courseId] || seedMeta(courseId);
  const next: CourseMeta = {
    learners: clamp(Math.round(patch.learners ?? prev.learners), 0, 99_999),
    likes: clamp(Math.round(patch.likes ?? prev.likes), 0, 99_999),
    favorites: clamp(Math.round(patch.favorites ?? prev.favorites), 0, 99_999),
    shares: clamp(Math.round(patch.shares ?? prev.shares), 0, 99_999),
  };
  store[courseId] = next;
  writeJson(KEY, store);
  return next;
};
