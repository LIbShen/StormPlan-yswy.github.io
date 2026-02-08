import { readJson, writeJson } from './storage';

export type CourseComment = {
  id: string;
  courseId: string;
  userId: string;
  displayName: string;
  ts: number;
  role: 'user' | 'ai';
  text: string;
};

const key = (courseId: string) => `yswy:course:${courseId}:comments`;

export const listCourseComments = (courseId: string) => {
  return readJson<CourseComment[]>(key(courseId), []).slice().sort((a, b) => a.ts - b.ts);
};

export const addCourseComment = (courseId: string, comment: CourseComment) => {
  const list = readJson<CourseComment[]>(key(courseId), []);
  list.push(comment);
  writeJson(key(courseId), list);
  return comment;
};
