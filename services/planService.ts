import { Grade, LearningPlan, LearningPlanItem } from '../types';
import { createChatSession } from './geminiService';
import { makeId } from './storage';

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

const extractJsonObject = (text: string) => {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = text.indexOf('{');
  if (start < 0) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') depth++;
    if (ch === '}') depth--;
    if (depth === 0) return text.slice(start, i + 1);
  }
  return null;
};

const fallbackPlan = (displayName: string, grade: Grade, minutesPerDay: number): LearningPlan => {
  const lvl = clamp(grade, 1, 6);
  const mins = clamp(minutesPerDay, 10, 40);
  const title = `给${displayName}的 7 天学习计划`;
  const tips = [
    `每天 ${mins} 分钟就够啦`,
    '先做简单的，再挑战更难的',
    '做完打一个勾，越做越有成就感',
  ];
  const items: LearningPlanItem[] = [
    { id: makeId(), text: `背一首 ${lvl} 年级古诗（读 3 遍 + 背 1 遍）`, done: false },
    { id: makeId(), text: '跟跳一个诗舞动作（跟 2 次 + 自己跳 1 次）', done: false },
    { id: makeId(), text: '玩一局猜灯谜（用提示不超过 2 次）', done: false },
    { id: makeId(), text: '在小诗AI里问 1 个问题（比如：这首诗在说什么？）', done: false },
    { id: makeId(), text: '复习昨天背过的诗（背 1 遍）', done: false },
  ];
  return { id: makeId(), createdAt: Date.now(), title, tips, items };
};

export const generateLearningPlan = async (args: {
  displayName: string;
  grade: Grade;
  minutesPerDay: number;
  focus: Array<'poetry' | 'dance' | 'games' | 'reading'>;
}): Promise<LearningPlan> => {
  const minutes = clamp(args.minutesPerDay, 10, 60);
  const focus = args.focus.length ? args.focus : ['poetry', 'dance', 'games', 'reading'];
  const focusText =
    focus
      .map((f) => (f === 'poetry' ? '背诵' : f === 'dance' ? '诗舞' : f === 'games' ? '趣味游戏' : '阅读理解'))
      .join('、') || '背诵、诗舞、趣味游戏、阅读理解';

  try {
    const session = createChatSession();
    const prompt = `请为小学${args.grade}年级学生“${args.displayName}”制定一个 7 天学习计划，适合小学生一看就懂。
每天学习时间约 ${minutes} 分钟。重点方向：${focusText}。
请严格只输出 JSON（不要解释，不要 markdown），格式如下：
{
  "title": "计划标题",
  "tips": ["小提示1","小提示2","小提示3"],
  "items": ["任务1","任务2","任务3","任务4","任务5","任务6"]
}
要求：
1) 任务用短句，尽量具体可执行；2) 任务数量 5~8 条；3) 不要出现“需要家长付费/下载App”等内容。`;
    const res = await session.sendMessage({ message: prompt });
    const jsonText = extractJsonObject(res.text) || res.text;
    const parsed = JSON.parse(jsonText) as { title?: string; tips?: string[]; items?: string[] };
    const title = String(parsed?.title || '').trim();
    const tips = Array.isArray(parsed?.tips) ? parsed.tips.map((s) => String(s).trim()).filter(Boolean).slice(0, 5) : [];
    const itemsRaw = Array.isArray(parsed?.items) ? parsed.items.map((s) => String(s).trim()).filter(Boolean) : [];
    if (!title || itemsRaw.length < 3) return fallbackPlan(args.displayName, args.grade, minutes);
    const items: LearningPlanItem[] = itemsRaw.slice(0, 8).map((t) => ({ id: makeId(), text: t, done: false }));
    return { id: makeId(), createdAt: Date.now(), title, tips, items };
  } catch {
    return fallbackPlan(args.displayName, args.grade, minutes);
  }
};
