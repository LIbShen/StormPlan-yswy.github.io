import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Course } from '../types';
import { createChatSession } from '../services/geminiService';
import { makeId } from '../services/storage';
import { Bot, MessageCircle, Send, X, Loader2, Sparkles } from 'lucide-react';

type Msg = { id: string; role: 'user' | 'model'; text: string };

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

export const CourseAssistant: React.FC<{
  course: Course;
  poemLines?: string[];
  introText: string;
}> = ({ course, poemLines, introText }) => {
  const sessionRef = useRef(createChatSession());
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(() => ({ x: Math.max(16, window.innerWidth - 360), y: Math.max(90, window.innerHeight - 520) }));
  const [dragging, setDragging] = useState(false);
  const dragOffsetRef = useRef<{ dx: number; dy: number } | null>(null);
  const [messages, setMessages] = useState<Msg[]>([
    { id: makeId(), role: 'model', text: '我是小诗。你可以问我：这首诗在讲什么？哪个词最重要？怎么背更快？' },
  ]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const context = useMemo(() => {
    const parts: string[] = [];
    parts.push(`课程：${course.type === 'POETRY_DANCE' ? '诗舞课程' : '诗词赏析'}`);
    parts.push(`标题：${course.title}`);
    if (course.dynasty) parts.push(`朝代：${course.dynasty}`);
    if (course.author) parts.push(`作者：${course.author}`);
    parts.push(`年级：${course.grade}年级`);
    if (introText) parts.push(`课程简介：${introText}`);
    if (poemLines?.length) parts.push(`诗句：${poemLines.join(' ')}`);
    return parts.join('\n');
  }, [course, poemLines, introText]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging || !dragOffsetRef.current) return;
      const panelW = open ? Math.min(360, Math.floor(window.innerWidth * 0.92)) : 56;
      const panelH = open ? Math.min(520, Math.floor(window.innerHeight * 0.75)) : 56;
      const x = clamp(e.clientX - dragOffsetRef.current.dx, 10, window.innerWidth - panelW - 10);
      const y = clamp(e.clientY - dragOffsetRef.current.dy, 70, window.innerHeight - panelH - 10);
      setPos({ x, y });
    };
    const onUp = () => {
      setDragging(false);
      dragOffsetRef.current = null;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragging, open]);

  const send = async () => {
    const q = text.trim();
    if (!q || busy) return;
    setText('');
    setBusy(true);
    const userMsg: Msg = { id: makeId(), role: 'user', text: q };
    setMessages((m) => [...m, userMsg]);
    try {
      const history = [...messages, userMsg].slice(-8).map((m) => `${m.role === 'user' ? '学生' : '小诗'}：${m.text}`).join('\n');
      const prompt = `你正在课程页面里当小学生的学习助手。请结合“课程内容”回答学生问题。\n\n课程内容：\n${context}\n\n对话：\n${history}\n\n学生问题：${q}`;
      const res = await sessionRef.current.sendMessage({ message: prompt });
      const modelMsg: Msg = { id: makeId(), role: 'model', text: res.text.trim() || '我再想想，你可以换个问法吗？' };
      setMessages((m) => [...m, modelMsg]);
    } catch (e) {
      const message = e instanceof Error ? e.message : '';
      const msg = /401|403/.test(message)
        ? '小诗AI还没配置好（需要AI密钥）。请先在部署环境里配置后再试。'
        : /abort|timeout|aborted/i.test(message)
          ? '小诗思考超时了，换个问法或稍后再问我吧。'
          : '我现在有点忙，稍后再问我一次吧。';
      setMessages((m) => [...m, { id: makeId(), role: 'model', text: msg }]);
    } finally {
      setBusy(false);
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    dragOffsetRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
    setDragging(true);
  };

  return (
    <div className="fixed z-[140]" style={{ left: pos.x, top: pos.y }}>
      {!open ? (
        <div
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-xl shadow-primary/30 flex items-center justify-center cursor-grab active:cursor-grabbing select-none relative"
          onPointerDown={onPointerDown}
          onClick={() => setOpen(true)}
          role="button"
          aria-label="打开小诗AI"
          title="打开小诗AI"
        >
          <Bot size={22} />
          <div className="absolute -top-2 -right-2 px-2 h-6 rounded-full bg-white text-primary text-xs font-extrabold shadow flex items-center gap-1">
            <Sparkles size={12} />
            AI
          </div>
        </div>
      ) : (
        <div className="w-[360px] max-w-[92vw] h-[520px] max-h-[75vh] bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div
            className="h-12 px-4 flex items-center justify-between bg-gradient-to-r from-primary to-accent text-white cursor-grab active:cursor-grabbing select-none"
            onPointerDown={onPointerDown}
          >
            <div className="font-extrabold text-sm flex items-center gap-2">
              <Bot size={18} />
              小诗AI助学助手
            </div>
            <button className="w-9 h-9 rounded-2xl bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center" onClick={() => setOpen(false)} aria-label="关闭">
              <X size={18} />
            </button>
          </div>

          <div className="p-4 space-y-3 h-[calc(100%-96px)] overflow-auto">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === 'user' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800'}`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="h-12 border-t border-gray-100 px-3 flex items-center gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="问小诗：这首诗在讲什么？"
              className="flex-1 h-9 px-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') send();
              }}
            />
            <button
              className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center hover:brightness-110 transition-all disabled:opacity-60"
              onClick={send}
              disabled={busy}
              aria-label="发送"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
