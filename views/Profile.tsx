import React, { useMemo, useState } from 'react';
import { TRANSLATIONS } from '../constants';
import { Star, Clock, Flame, Sparkles, X, Wand2, CheckCircle2, Circle, Trash2, PencilLine } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { computeUserStats } from '../services/stats';
import { NameAvatar } from '../components/NameAvatar';
import { generateLearningPlan } from '../services/planService';
import { Grade, LearningPlan } from '../types';
import { makeId } from '../services/storage';

interface ProfileProps {
  lang: 'zh' | 'en';
}

export const Profile: React.FC<ProfileProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang];
  const auth = useAuth();
  const stats = computeUserStats(auth.events);
  const [planOpen, setPlanOpen] = useState(false);
  const [manualPlanOpen, setManualPlanOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [minutes, setMinutes] = useState(20);
  const [focus, setFocus] = useState<Array<'poetry' | 'dance' | 'games' | 'reading'>>(['poetry', 'dance', 'games']);
  const [manualTitle, setManualTitle] = useState('');
  const [manualItemsText, setManualItemsText] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);

  // Transform skills data for Radar Chart
  const radarData = useMemo(
    () => [
      { subject: '韵律', A: stats.skills.rhythm, fullMark: 100 },
      { subject: '记忆', A: stats.skills.memory, fullMark: 100 },
      { subject: '创意', A: stats.skills.creativity, fullMark: 100 },
      { subject: '表达', A: stats.skills.expression, fullMark: 100 },
      { subject: '诗史', A: stats.skills.history, fullMark: 100 },
    ],
    [stats]
  );

  const joinedAt = auth.user?.createdAt ? new Date(auth.user.createdAt) : null;
  const joinedText = joinedAt ? `${joinedAt.getFullYear()}-${`${joinedAt.getMonth() + 1}`.padStart(2, '0')}-${`${joinedAt.getDate()}`.padStart(2, '0')}` : '—';

  const toggleFocus = (k: 'poetry' | 'dance' | 'games' | 'reading') => {
    setFocus((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  };

  const updatePlan = (next: LearningPlan) => {
    auth.setPlan(next);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6 md:gap-8">
         <div className="relative">
             <div className="w-28 h-28 md:w-32 md:h-32 rounded-full p-1 bg-gradient-to-tr from-primary to-yellow-400">
               <div className="w-full h-full rounded-full border-4 border-white overflow-hidden flex items-center justify-center bg-white">
                 <div className="hidden md:block">
                   <NameAvatar name={auth.settings?.displayName || '同学'} size={116} />
                 </div>
                 <div className="md:hidden">
                   <NameAvatar name={auth.settings?.displayName || '同学'} size={104} />
                 </div>
               </div>
             </div>
         </div>
         
         <div className="flex-1 text-center md:text-left space-y-2 min-w-0">
             <h1 className="text-2xl md:text-3xl font-bold text-gray-800 break-words">{auth.settings?.displayName || '同学'}</h1>
             <p className="text-gray-500 text-sm md:text-base leading-snug break-words">
               加入时间: {joinedText} · 小学 {auth.settings?.grade || Grade.ONE} 年级
             </p>
             <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                 <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs md:text-sm font-bold whitespace-nowrap">
                   <span className="md:hidden">课程 {stats.coursesCompleted}</span>
                   <span className="hidden md:inline">课程完成 {stats.coursesCompleted}</span>
                 </div>
                 <div className="bg-pink-50 text-pink-600 px-3 py-1 rounded-lg text-xs md:text-sm font-bold whitespace-nowrap">
                   <span className="md:hidden">时长 {stats.learningMinutes}分</span>
                   <span className="hidden md:inline">学习时长 {stats.learningMinutes} 分钟</span>
                 </div>
             </div>
         </div>

         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto">
             <div className="bg-gray-50 p-4 rounded-xl text-center">
                 <div className="flex justify-center text-yellow-500 mb-1"><Star size={20} fill="currentColor"/></div>
                 <div className="font-bold text-xl">{stats.totalStars}</div>
                 <div className="text-xs text-gray-400">总星星</div>
             </div>
             <div className="bg-gray-50 p-4 rounded-xl text-center">
                 <div className="flex justify-center text-orange-500 mb-1"><Flame size={20} /></div>
                 <div className="font-bold text-xl">{stats.streakDays}</div>
                 <div className="text-xs text-gray-400">连续打卡</div>
             </div>
             <div className="bg-gray-50 p-4 rounded-xl text-center">
                 <div className="flex justify-center text-teal-500 mb-1"><Clock size={20} /></div>
                 <div className="font-bold text-xl">{stats.learningMinutes}</div>
                 <div className="text-xs text-gray-400">学习分钟</div>
             </div>
             <div className="bg-gray-50 p-4 rounded-xl text-center">
                 <div className="flex justify-center text-primary mb-1"><Sparkles size={20} /></div>
                 <div className="font-bold text-xl">{stats.coursesCompleted}</div>
                 <div className="text-xs text-gray-400">完成课程</div>
             </div>
         </div>
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Radar Chart: Skills */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Star className="text-primary" /> 能力五维图
            </h2>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="My Skills" dataKey="A" stroke="#FF8FAB" fill="#FF8FAB" fillOpacity={0.5} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Bar Chart: Weekly Activity */}
        <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-gray-100">
             <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Clock className="text-secondary" />
                <span className="md:hidden">本周时长</span>
                <span className="hidden md:inline">本周学习时长 (分钟)</span>
            </h2>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.weeklyActivity}>
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                        <YAxis hide />
                        <Tooltip 
                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} 
                            cursor={{fill: '#f3f4f6'}}
                        />
                        <Bar dataKey="minutes" fill="#85D2D0" radius={[10, 10, 10, 10]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-6 md:p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-xl md:text-2xl font-bold">{t.plan}</h2>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              className="bg-white/20 hover:bg-white/30 px-4 h-11 rounded-xl text-sm backdrop-blur-sm transition-colors font-extrabold flex items-center gap-2"
              onClick={() => {
                setError(null);
                setPlanOpen(true);
              }}
            >
              <Wand2 size={18} />
              <span className="md:hidden">AI生成</span>
              <span className="hidden md:inline">让小诗AI生成</span>
            </button>
            <button
              className="bg-white/20 hover:bg-white/30 px-4 h-11 rounded-xl text-sm backdrop-blur-sm transition-colors font-extrabold flex items-center gap-2"
              onClick={() => {
                setManualError(null);
                const current = auth.plan;
                setManualTitle(current?.title || '我的学习计划');
                setManualItemsText(current?.items?.map((x) => x.text).join('\n') || '');
                setManualPlanOpen(true);
              }}
            >
              <PencilLine size={18} />
              <span className="md:hidden">自己写</span>
              <span className="hidden md:inline">自己写计划</span>
            </button>
            <button
              className="bg-white/10 hover:bg-white/20 px-4 h-11 rounded-xl text-sm backdrop-blur-sm transition-colors font-extrabold flex items-center gap-2"
              onClick={() => auth.setPlan(null)}
              disabled={!auth.plan}
            >
              <Trash2 size={18} />
              清空
            </button>
          </div>
        </div>

        {!auth.plan ? (
          <div className="bg-white/10 border border-white/15 rounded-3xl p-6 backdrop-blur-sm">
            <div className="text-lg font-extrabold">还没有学习计划</div>
            <div className="mt-2 text-white/85 text-sm">你可以让小诗AI生成，也可以点“自己写计划”手动填写。</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-sm border border-white/15">
              <div className="font-extrabold text-xl">{auth.plan.title}</div>
              {auth.plan.tips?.length ? (
                <div className="mt-2 text-white/85 text-sm space-y-1">
                  {auth.plan.tips.slice(0, 4).map((tip, i) => (
                    <div key={i}>- {tip}</div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-3">
              {auth.plan.items.map((it) => (
                <button
                  key={it.id}
                  className="w-full text-left flex items-center gap-3 bg-white/10 p-4 rounded-2xl backdrop-blur-sm hover:bg-white/15 transition-colors"
                  onClick={() => {
                    const next = { ...auth.plan } as LearningPlan;
                    next.items = next.items.map((x) => (x.id === it.id ? { ...x, done: !x.done } : x));
                    updatePlan(next);
                  }}
                >
                  {it.done ? <CheckCircle2 size={22} className="text-yellow-200" /> : <Circle size={22} className="text-white/80" />}
                  <span className={`font-extrabold ${it.done ? 'line-through opacity-75' : ''}`}>{it.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {planOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/60" onClick={() => setPlanOpen(false)} aria-label="关闭" />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="font-extrabold text-gray-800">让小诗AI帮你制定计划</div>
              <button className="w-10 h-10 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center" onClick={() => setPlanOpen(false)} aria-label="关闭">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-gray-50 border border-gray-100 rounded-3xl p-5">
                <div className="font-extrabold text-gray-800">每天学习多久？</div>
                <div className="mt-3 flex items-center gap-3">
                  <input
                    type="range"
                    min={10}
                    max={60}
                    value={minutes}
                    onChange={(e) => setMinutes(Number(e.target.value))}
                    className="flex-1"
                  />
                  <div className="w-20 text-right font-extrabold text-primary">{minutes} 分钟</div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-3xl p-5">
                <div className="font-extrabold text-gray-800">你最想练哪几项？</div>
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    className={`h-11 rounded-2xl border font-extrabold transition-all ${focus.includes('poetry') ? 'bg-primary/10 border-primary/25 text-primary' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                    onClick={() => toggleFocus('poetry')}
                    type="button"
                  >
                    背诗
                  </button>
                  <button
                    className={`h-11 rounded-2xl border font-extrabold transition-all ${focus.includes('dance') ? 'bg-secondary/10 border-secondary/25 text-secondary' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                    onClick={() => toggleFocus('dance')}
                    type="button"
                  >
                    诗舞
                  </button>
                  <button
                    className={`h-11 rounded-2xl border font-extrabold transition-all ${focus.includes('games') ? 'bg-orange-100 border-orange-200 text-orange-600' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                    onClick={() => toggleFocus('games')}
                    type="button"
                  >
                    游戏
                  </button>
                  <button
                    className={`h-11 rounded-2xl border font-extrabold transition-all ${focus.includes('reading') ? 'bg-blue-100 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                    onClick={() => toggleFocus('reading')}
                    type="button"
                  >
                    理解
                  </button>
                </div>
                <div className="mt-3 text-sm text-gray-500">你选得越清楚，计划越适合你。</div>
              </div>

              {error && <div className="bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl p-4 text-sm font-bold">{error}</div>}

              <div className="flex items-center justify-end gap-3">
                <button className="px-6 h-11 rounded-2xl bg-gray-100 text-gray-700 font-extrabold hover:bg-gray-200 transition-colors" onClick={() => setPlanOpen(false)} disabled={busy}>
                  取消
                </button>
                <button
                  className="px-6 h-11 rounded-2xl bg-primary text-white font-extrabold hover:brightness-110 transition-all disabled:opacity-60 disabled:hover:brightness-100"
                  disabled={busy}
                  onClick={async () => {
                    if (!auth.settings) return;
                    setError(null);
                    setBusy(true);
                    try {
                      const plan = await generateLearningPlan({
                        displayName: auth.settings.displayName,
                        grade: auth.settings.grade,
                        minutesPerDay: minutes,
                        focus,
                      });
                      auth.setPlan(plan);
                      auth.addEvent({ id: makeId(), type: 'ai_plan_generate', ts: Date.now(), minutes: 0, stars: 0, payload: { planId: plan.id } });
                      setPlanOpen(false);
                    } catch {
                      setError('生成失败，请稍后再试');
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {busy ? '生成中…' : '生成计划'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {manualPlanOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/60" onClick={() => setManualPlanOpen(false)} aria-label="关闭" />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="font-extrabold text-gray-800">自己写学习计划</div>
              <button
                className="w-10 h-10 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center"
                onClick={() => setManualPlanOpen(false)}
                aria-label="关闭"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <div className="text-sm font-bold text-gray-700">计划标题</div>
                <input
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="例如：我的 7 天游玩式学习计划"
                  className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <div className="text-sm font-bold text-gray-700">计划内容（每行一条）</div>
                <textarea
                  value={manualItemsText}
                  onChange={(e) => setManualItemsText(e.target.value)}
                  placeholder={'示例：\n跟读《静夜思》1 遍\n找出押韵字\n背第一句'}
                  className="mt-2 w-full min-h-[160px] px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <div className="mt-2 text-xs text-gray-500">建议 5～14 条，短句更好打卡。</div>
              </div>

              {manualError && <div className="bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl p-4 text-sm font-bold">{manualError}</div>}

              <div className="flex items-center justify-end gap-3">
                <button className="px-6 h-11 rounded-2xl bg-gray-100 text-gray-700 font-extrabold hover:bg-gray-200 transition-colors" onClick={() => setManualPlanOpen(false)}>
                  取消
                </button>
                <button
                  className="px-6 h-11 rounded-2xl bg-primary text-white font-extrabold hover:brightness-110 transition-all disabled:opacity-60 disabled:hover:brightness-100"
                  onClick={() => {
                    setManualError(null);
                    const title = manualTitle.trim() || '我的学习计划';
                    const lines = manualItemsText
                      .split('\n')
                      .map((x) => x.trim())
                      .filter(Boolean)
                      .slice(0, 20);
                    if (lines.length === 0) {
                      setManualError('请至少写 1 条计划内容');
                      return;
                    }
                    const plan: LearningPlan = {
                      id: makeId(),
                      createdAt: Date.now(),
                      title,
                      tips: [],
                      items: lines.map((text) => ({ id: makeId(), text, done: false })),
                    };
                    auth.setPlan(plan);
                    setManualPlanOpen(false);
                  }}
                >
                  保存计划
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
