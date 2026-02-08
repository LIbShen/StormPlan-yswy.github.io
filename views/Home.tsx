import React, { useMemo } from 'react';
import { TRANSLATIONS, MOCK_COURSES } from '../constants';
import { View, Course } from '../types';
import { CourseCard } from '../components/CourseCard';
import { Sparkles, Trophy, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { computeUserStats } from '../services/stats';
import { POEM_LIBRARY } from '../poems';

interface HomeProps {
  lang: 'zh' | 'en';
  setView: (view: View) => void;
  openCourse: (courseId: string) => void;
}

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const pickUnique = <T,>(items: T[], count: number, seed: number) => {
  const picked: T[] = [];
  if (items.length === 0) return picked;
  let x = seed || 1;
  const used = new Set<number>();
  while (picked.length < Math.min(count, items.length) && used.size < items.length) {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    const idx = x % items.length;
    if (used.has(idx)) continue;
    used.add(idx);
    picked.push(items[idx]);
  }
  return picked;
};

export const Home: React.FC<HomeProps> = ({ lang, setView, openCourse }) => {
  const t = TRANSLATIONS[lang];
  const auth = useAuth();
  const stats = computeUserStats(auth.events);
  const featuredCourses = useMemo(() => {
    const d = new Date();
    const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const grade = auth.settings?.grade;
    const pool = grade ? MOCK_COURSES.filter((c) => c.grade === grade && !c.isLocked) : MOCK_COURSES.filter((c) => !c.isLocked);
    const base = pool.length >= 3 ? pool : MOCK_COURSES.filter((c) => !c.isLocked);
    return pickUnique(base, 3, hash(`${dayKey}:${grade ?? 'ALL'}`));
  }, [auth.settings?.grade]);

  const welcomePoem = useMemo(() => {
    const poems = Object.values(POEM_LIBRARY);
    if (poems.length === 0) return null;
    try {
      const visitKey = 'yswy:homeVisit';
      const lastKey = 'yswy:homeLastPoem';
      const prevVisit = Number(sessionStorage.getItem(visitKey) || '0');
      const nextVisit = prevVisit + 1;
      sessionStorage.setItem(visitKey, String(nextVisit));

      const identity = auth.userId || auth.settings?.displayName || 'guest';
      const seed = `${nextVisit}:${auth.settings?.grade ?? 'ALL'}:${identity}`;
      let idx = hash(seed) % poems.length;

      const buildKey = (p: { title: string; author: string; lines: string[] }) =>
        `${p.title}|${p.author}|${p.lines?.[0] || ''}`;
      const last = sessionStorage.getItem(lastKey) || '';
      let pick = poems[idx];
      if (poems.length > 1 && buildKey(pick) === last) pick = poems[(idx + 1) % poems.length];
      sessionStorage.setItem(lastKey, buildKey(pick));

      const lines = (pick.lines || []).filter(Boolean);
      const quoteLines = lines.length >= 2 ? [lines[0], lines[1]] : lines.length === 1 ? [lines[0]] : [];
      return { title: pick.title, author: pick.author, quoteLines };
    } catch {
      const pick = poems[Math.floor(Math.random() * poems.length)];
      const lines = (pick.lines || []).filter(Boolean);
      const quoteLines = lines.length >= 2 ? [lines[0], lines[1]] : lines.length === 1 ? [lines[0]] : [];
      return { title: pick.title, author: pick.author, quoteLines };
    }
  }, [auth.userId, auth.settings?.displayName, auth.settings?.grade]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-primary to-accent text-white shadow-2xl p-8 md:p-12">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-sm mb-4">
            <Sparkles size={16} className="text-yellow-300" />
            <span>今日挑战：学习一首唐诗</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            {t.welcome}，{auth.settings?.displayName || '同学'}
          </h1>
          <p className="text-lg opacity-90 mb-8">
            {welcomePoem?.quoteLines?.length ? (
              <>
                “{welcomePoem.quoteLines[0]}”
                {welcomePoem.quoteLines[1] ? (
                  <>
                    <br />
                    “{welcomePoem.quoteLines[1]}”
                  </>
                ) : null}
                <span className="block mt-2 text-sm opacity-85 font-bold">
                  ——《{welcomePoem.title}》 {welcomePoem.author}
                </span>
              </>
            ) : (
              <>
                “白日依山尽，黄河入海流。”
                <span className="block mt-2 text-sm opacity-85 font-bold">——《登鹳雀楼》 王之涣</span>
              </>
            )}
            <span className="block mt-2">让我们一起探索诗词的韵律与舞蹈的优美吧！</span>
          </p>
          <button 
            onClick={() => setView(View.COURSES)}
            className="bg-white text-primary font-bold px-8 py-3 rounded-full hover:bg-yellow-50 hover:scale-105 transition-all shadow-lg"
          >
            {t.start_learning}
          </button>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-300/20 rounded-full translate-y-1/2 -translate-x-1/3 blur-2xl"></div>
        <img 
            src="https://picsum.photos/400/400?random=10" 
            alt="Hero" 
            className="absolute bottom-0 right-10 w-48 h-48 md:w-64 md:h-64 object-cover rounded-t-full border-4 border-white/30 shadow-2xl hidden md:block"
        />
      </div>

      {/* Quick Stats / Daily */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-500">
                <Calendar size={24} />
            </div>
            <div>
                <h3 className="font-bold text-gray-700">打卡天数</h3>
                <p className="text-2xl font-bold text-blue-500">{stats.streakDays} <span className="text-sm text-gray-400">天</span></p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-500">
                <Trophy size={24} />
            </div>
            <div>
                <h3 className="font-bold text-gray-700">获得星星</h3>
                <p className="text-2xl font-bold text-yellow-500">{stats.totalStars} <span className="text-sm text-gray-400">颗</span></p>
            </div>
        </div>
        <div 
            className="bg-gradient-to-br from-secondary to-teal-400 p-6 rounded-2xl shadow-md text-white flex items-center justify-between cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setView(View.AI)}
        >
            <div>
                <h3 className="font-bold text-lg">有问题？</h3>
                <p className="text-sm opacity-90">问问小诗AI吧！</p>
            </div>
            <div className="bg-white/20 p-3 rounded-full">
                <Sparkles size={24} />
            </div>
        </div>
      </div>

      {/* Recommended Courses */}
      <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">{t.recommended}</h2>
            <button onClick={() => setView(View.COURSES)} className="text-primary hover:underline">查看全部 &rarr;</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCourses.map(course => (
                <CourseCard key={course.id} course={course} onClick={(c) => openCourse(c.id)} />
            ))}
        </div>
      </div>
    </div>
  );
};
