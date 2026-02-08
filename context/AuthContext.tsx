import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Grade, LearningPlan, ProgressEvent, UserAccount, UserId, UserSettings } from '../types';
import {
  appendEvent,
  getPlan,
  getSessionUserId,
  getUserById,
  getUserByUsername,
  getUserSettings,
  listEvents,
  loginUser,
  logoutUser,
  registerUser,
  savePlan,
  setSessionUserId,
  updateUserSettings,
} from '../services/userStore';

type AuthState = {
  userId: UserId | null;
  isGuest: boolean;
  user: UserAccount | null;
  settings: UserSettings | null;
  events: ProgressEvent[];
  plan: LearningPlan | null;
  login: (args: { username: string; displayName: string }) => Promise<{ ok: boolean; message?: string }>;
  enterGuest: () => void;
  logout: () => void;
  setLang: (lang: UserSettings['lang']) => void;
  setDisplayName: (displayName: string) => void;
  setGrade: (grade: UserSettings['grade']) => void;
  addEvent: (ev: ProgressEvent) => void;
  refresh: () => void;
  setPlan: (plan: LearningPlan | null) => void;
};

const AuthContext = createContext<AuthState | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthContext missing');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<UserId | null>(getSessionUserId());
  const [user, setUser] = useState<UserAccount | null>(userId ? getUserById(userId) : null);
  const [settings, setSettings] = useState<UserSettings | null>(userId ? getUserSettings(userId) : null);
  const [events, setEvents] = useState<ProgressEvent[]>(userId ? listEvents(userId) : []);
  const [plan, setPlanState] = useState<LearningPlan | null>(userId ? getPlan(userId) : null);
  const [isGuest, setIsGuest] = useState(false);

  const refresh = () => {
    if (isGuest) return;
    const id = getSessionUserId();
    setUserId(id);
    if (!id) {
      setUser(null);
      setSettings(null);
      setEvents([]);
      setPlanState(null);
      return;
    }
    setUser(getUserById(id));
    setSettings(getUserSettings(id));
    setEvents(listEvents(id));
    setPlanState(getPlan(id));
  };

  useEffect(() => {
    refresh();
  }, []);

  const api = useMemo<AuthState>(() => {
    return {
      userId,
      isGuest,
      user,
      settings,
      events,
      plan,
      login: async ({ username, displayName }) => {
        setIsGuest(false);
        const u = username.trim();
        const n = displayName.trim();
        if (u.length < 3) return { ok: false, message: '学习号至少 3 个字符' };
        if (!n) return { ok: false, message: '请填写昵称' };

        const existing = getUserByUsername(u);
        const res = existing
          ? n === existing.displayName
            ? await loginUser({ username: u })
            : { ok: false as const, message: '该学习号已有用户使用，请换一个（或输入正确昵称）' }
          : await registerUser({ username: u, displayName: n, grade: Grade.ONE });
        if (!res.ok) return { ok: false, message: res.message };
        setSessionUserId(res.user.id);
        refresh();
        return { ok: true };
      },
      enterGuest: () => {
        logoutUser();
        setIsGuest(true);
        setUserId('guest');
        setUser(null);
        setSettings({ lang: 'zh', displayName: '游客', grade: Grade.ONE });
        setEvents([]);
        setPlanState(null);
      },
      logout: () => {
        logoutUser();
        setIsGuest(false);
        refresh();
      },
      setLang: (lang) => {
        if (!userId) return;
        if (isGuest) {
          setSettings((s) => (s ? { ...s, lang } : s));
          return;
        }
        updateUserSettings(userId, { lang });
        setSettings(getUserSettings(userId));
      },
      setDisplayName: (displayName) => {
        if (!userId) return;
        if (isGuest) {
          setSettings((s) => (s ? { ...s, displayName: displayName.trim() || '游客' } : s));
          return;
        }
        updateUserSettings(userId, { displayName: displayName.trim() || '同学' });
        setSettings(getUserSettings(userId));
        setUser(getUserById(userId));
      },
      setGrade: (grade) => {
        if (!userId) return;
        if (isGuest) {
          setSettings((s) => (s ? { ...s, grade } : s));
          return;
        }
        updateUserSettings(userId, { grade });
        setSettings(getUserSettings(userId));
        setUser(getUserById(userId));
      },
      addEvent: (ev) => {
        if (!userId) return;
        if (isGuest) {
          setEvents((prev) => [...prev, ev]);
          return;
        }
        appendEvent(userId, ev);
        setEvents(listEvents(userId));
      },
      refresh,
      setPlan: (p) => {
        if (!userId) return;
        if (isGuest) {
          setPlanState(p);
          return;
        }
        savePlan(userId, p);
        setPlanState(getPlan(userId));
      },
    };
  }, [userId, isGuest, user, settings, events, plan]);

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
};
