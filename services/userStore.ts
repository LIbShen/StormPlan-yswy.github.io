import { Grade, LearningPlan, ProgressEvent, UserAccount, UserId, UserSettings } from '../types';
import { makeId, readJson, removeKey, writeJson } from './storage';

const KEYS = {
  users: 'yswy:users',
  sessionUserId: 'yswy:session:userId',
  userSettings: (id: UserId) => `yswy:user:${id}:settings`,
  userEvents: (id: UserId) => `yswy:user:${id}:events`,
  userPlan: (id: UserId) => `yswy:user:${id}:plan`,
};

export type AuthResult =
  | { ok: true; user: UserAccount }
  | { ok: false; message: string };

const normalizeUsername = (s: string) => s.trim().toLowerCase();

export const listUsers = () => {
  const raw = readJson<any[]>(KEYS.users, []);
  const normalized: UserAccount[] = [];
  for (const u of raw) {
    if (!u) continue;
    const id = typeof u.id === 'string' ? u.id : makeId();
    const username = typeof u.username === 'string' ? u.username : '';
    if (!username) continue;
    const displayName = typeof u.displayName === 'string' && u.displayName.trim() ? u.displayName.trim() : username;
    const grade = typeof u.grade === 'number' ? (u.grade as Grade) : Grade.ONE;
    const createdAt = typeof u.createdAt === 'number' ? u.createdAt : Date.now();
    const lastLoginAt = typeof u.lastLoginAt === 'number' ? u.lastLoginAt : createdAt;
    normalized.push({ id, username, displayName, grade, createdAt, lastLoginAt });
  }
  return normalized;
};

export const getSessionUserId = () => {
  const id = localStorage.getItem(KEYS.sessionUserId);
  return id || null;
};

export const setSessionUserId = (id: UserId | null) => {
  if (!id) {
    removeKey(KEYS.sessionUserId);
    return;
  }
  localStorage.setItem(KEYS.sessionUserId, id);
};

export const getUserById = (id: UserId) => listUsers().find((u) => u.id === id) || null;

export const getUserByUsername = (username: string) => {
  const norm = normalizeUsername(username);
  return listUsers().find((u) => normalizeUsername(u.username) === norm) || null;
};

export const registerUser = async (params: {
  username: string;
  displayName?: string;
  grade?: Grade;
}): Promise<AuthResult> => {
  const username = params.username.trim();
  if (username.length < 3) return { ok: false, message: '学习号至少 3 个字符' };
  if (getUserByUsername(username)) return { ok: false, message: '这个学习号已被使用' };
  const displayName = (params.displayName || username).trim() || '同学';
  const grade = params.grade || Grade.ONE;

  const id = makeId();
  const now = Date.now();
  const user: UserAccount = {
    id,
    username,
    displayName,
    grade,
    createdAt: now,
    lastLoginAt: now,
  };

  const users = listUsers();
  users.push(user);
  writeJson(KEYS.users, users);

  const settings: UserSettings = { lang: 'zh', displayName, grade };
  writeJson(KEYS.userSettings(id), settings);
  writeJson(KEYS.userEvents(id), [] as ProgressEvent[]);
  removeKey(KEYS.userPlan(id));

  setSessionUserId(id);
  return { ok: true, user };
};

export const loginUser = async (params: { username: string }): Promise<AuthResult> => {
  const user = getUserByUsername(params.username);
  if (!user) return { ok: false, message: '未找到该学习号，请先创建' };
  const now = Date.now();
  const users = listUsers().map((u) => (u.id === user.id ? { ...u, lastLoginAt: now } : u));
  writeJson(KEYS.users, users);
  setSessionUserId(user.id);
  return { ok: true, user: { ...user, lastLoginAt: now } };
};

export const ensureUser = async (params: { username: string }): Promise<AuthResult> => {
  const username = params.username.trim();
  const existing = getUserByUsername(username);
  if (existing) return loginUser({ username });
  return registerUser({ username, displayName: username, grade: Grade.ONE });
};

export const deleteUserById = (id: UserId): { ok: true } | { ok: false; message: string } => {
  const users = listUsers();
  const target = users.find((u) => u.id === id);
  if (!target) return { ok: false, message: '未找到该学习号' };
  writeJson(
    KEYS.users,
    users.filter((u) => u.id !== id)
  );
  removeKey(KEYS.userSettings(id));
  removeKey(KEYS.userEvents(id));
  removeKey(KEYS.userPlan(id));
  if (getSessionUserId() === id) setSessionUserId(null);
  return { ok: true };
};

export const logoutUser = () => {
  setSessionUserId(null);
};

export const getUserSettings = (id: UserId): UserSettings => {
  const u = getUserById(id);
  const fallback: UserSettings = { lang: 'zh', displayName: u?.displayName || '同学', grade: u?.grade || Grade.ONE };
  return readJson<UserSettings>(KEYS.userSettings(id), fallback);
};

export const updateUserSettings = (id: UserId, patch: Partial<UserSettings>) => {
  const prev = getUserSettings(id);
  const next: UserSettings = { ...prev, ...patch };
  writeJson(KEYS.userSettings(id), next);
  const users = listUsers().map((u) => (u.id === id ? { ...u, displayName: next.displayName, grade: next.grade } : u));
  writeJson(KEYS.users, users);
};

export const appendEvent = (id: UserId, ev: ProgressEvent) => {
  const list = readJson<ProgressEvent[]>(KEYS.userEvents(id), []);
  list.push(ev);
  writeJson(KEYS.userEvents(id), list);
};

export const listEvents = (id: UserId) => readJson<ProgressEvent[]>(KEYS.userEvents(id), []);

export const getPlan = (id: UserId): LearningPlan | null => {
  return readJson<LearningPlan | null>(KEYS.userPlan(id), null);
};

export const savePlan = (id: UserId, plan: LearningPlan | null) => {
  if (!plan) {
    removeKey(KEYS.userPlan(id));
    return;
  }
  writeJson(KEYS.userPlan(id), plan);
};
