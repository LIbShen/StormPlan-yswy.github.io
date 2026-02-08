import { CourseType, ProgressEvent, UserStats } from '../types';

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

const toLocalDateKey = (ts: number) => {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const startOfDay = (ts: number) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const computeUserStats = (events: ProgressEvent[]): UserStats => {
  const totalStars = events.reduce((sum, ev) => sum + (typeof ev.stars === 'number' ? ev.stars : 0), 0);
  const coursesCompleted = events.filter((e) => e.type === 'course_complete').length;
  const learningMinutes = Math.round(events.reduce((sum, ev) => sum + (typeof ev.minutes === 'number' ? ev.minutes : 0), 0));

  const todayKey = toLocalDateKey(Date.now());
  const activeDays = new Set(events.map((e) => toLocalDateKey(e.ts)));
  let streakDays = 0;
  let cursor = startOfDay(Date.now());
  while (streakDays < 365) {
    const key = toLocalDateKey(cursor);
    if (key === todayKey) {
      if (!activeDays.has(key)) break;
    } else {
      if (!activeDays.has(key)) break;
    }
    streakDays += 1;
    cursor -= 24 * 60 * 60 * 1000;
  }

  const now = Date.now();
  const today = new Date(now);
  const dayOfWeek = today.getDay(); // 0=Sun ... 6=Sat
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const weekStart = startOfDay(now - daysSinceMonday * 24 * 60 * 60 * 1000);

  const minutesByDayKey = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const dayTs = weekStart + i * 24 * 60 * 60 * 1000;
    minutesByDayKey.set(toLocalDateKey(dayTs), 0);
  }
  for (const ev of events) {
    const dayKey = toLocalDateKey(ev.ts);
    if (!minutesByDayKey.has(dayKey)) continue;
    const mins = typeof ev.minutes === 'number' ? ev.minutes : 0;
    minutesByDayKey.set(dayKey, (minutesByDayKey.get(dayKey) || 0) + mins);
  }

  const weeklyActivity = Array.from({ length: 7 }).map((_, i) => {
    const dayTs = weekStart + i * 24 * 60 * 60 * 1000;
    const key = toLocalDateKey(dayTs);
    return { day: dayLabels[i] || key, minutes: Math.round(minutesByDayKey.get(key) || 0) };
  });

  const dance = events.filter((e) => e.type === 'game_dance_complete');
  const pk = events.filter((e) => e.type === 'game_pk_complete');
  const riddle = events.filter((e) => e.type === 'game_riddle_complete');
  const course = events.filter((e) => e.type === 'course_complete');
  const poetryText = course.filter((e) => e.payload?.courseType === CourseType.POETRY_TEXT);
  const poetryDance = course.filter((e) => e.payload?.courseType === CourseType.POETRY_DANCE);

  const avgStars = (arr: ProgressEvent[]) => {
    if (arr.length === 0) return 0;
    return arr.reduce((s, e) => s + (typeof e.stars === 'number' ? e.stars : 0), 0) / arr.length;
  };

  const rhythm = clamp(Math.round(dance.length * 12 + avgStars(dance) * 10 + poetryDance.length * 8), 0, 100);
  const memory = clamp(Math.round(poetryText.length * 16 + pk.length * 8 + avgStars(pk) * 10), 0, 100);
  const creativity = clamp(Math.round(riddle.length * 18 + avgStars(riddle) * 10 + pk.length * 6), 0, 100);
  const expression = clamp(Math.round(poetryDance.length * 14 + learningMinutes / 8 + dance.length * 6), 0, 100);
  const history = clamp(Math.round(poetryText.length * 18 + (poetryText.length > 0 ? 12 : 0)), 0, 100);

  return {
    totalStars,
    coursesCompleted,
    streakDays,
    learningMinutes,
    skills: { rhythm, memory, creativity, expression, history },
    weeklyActivity,
  };
};
