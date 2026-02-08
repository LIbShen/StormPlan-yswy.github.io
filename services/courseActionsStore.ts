import { readJson, writeJson } from './storage';

export type CourseActions = {
  liked: boolean;
  favorited: boolean;
  shared: boolean;
};

const key = (userId: string) => `yswy:user:${userId}:courseActions`;

export const getCourseActions = (userId: string, courseId: string): CourseActions => {
  const store = readJson<Record<string, CourseActions>>(key(userId), {});
  return store[courseId] || { liked: false, favorited: false, shared: false };
};

export const setCourseActions = (userId: string, courseId: string, next: CourseActions) => {
  const store = readJson<Record<string, CourseActions>>(key(userId), {});
  store[courseId] = next;
  writeJson(key(userId), store);
  return next;
};
