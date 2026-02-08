import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TRANSLATIONS, MOCK_COURSES } from '../constants';
import { Grade, CourseType, Course } from '../types';
import { CourseCard } from '../components/CourseCard';
import { createChatSession, generatePoemOriginal, PoemOriginal } from '../services/geminiService';
import { Search, X, Video, BookOpen, Loader2, Heart, Bookmark, Share2, Users, MessageCircle, Send, ThumbsUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { makeId } from '../services/storage';
import { CourseAssistant } from '../components/CourseAssistant';
import { CourseMeta, getCourseMeta, updateCourseMeta } from '../services/courseMetaStore';
import { CourseComment, addCourseComment, listCourseComments } from '../services/commentsStore';
import { aiModerate, localModerate } from '../services/moderation';
import { getCourseActions, setCourseActions } from '../services/courseActionsStore';
import { getDynastyByAuthor } from '../poetryMeta';

interface CoursesProps {
  lang: 'zh' | 'en';
  openCourseId?: string | null;
  onCourseOpened?: () => void;
}

export const Courses: React.FC<CoursesProps> = ({ lang, openCourseId, onCourseOpened }) => {
  const t = TRANSLATIONS[lang];
  const auth = useAuth();
  const [selectedGrade, setSelectedGrade] = useState<Grade | 'ALL'>('ALL');
  const [selectedType, setSelectedType] = useState<CourseType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [poemData, setPoemData] = useState<PoemOriginal | null>(null);
  const [poemLoading, setPoemLoading] = useState(false);
  const [poemError, setPoemError] = useState<string | null>(null);
  const [courseMeta, setCourseMetaState] = useState<CourseMeta | null>(null);
  const [liked, setLiked] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<CourseComment[]>([]);
  const [commentBusy, setCommentBusy] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState(false);

  const grades = [1, 2, 3, 4, 5, 6];

  const filteredCourses = MOCK_COURSES.filter(course => {
    const gradeMatch = selectedGrade === 'ALL' || course.grade === selectedGrade;
    const typeMatch = selectedType === 'ALL' || course.type === selectedType;
    const searchMatch = course.title.includes(searchQuery) || course.author.includes(searchQuery);
    return gradeMatch && typeMatch && searchMatch;
  });

  const poemCacheKey = useMemo(() => {
    if (!activeCourse) return null;
    return `poem:original:${activeCourse.title}:${activeCourse.sourceBasename || ''}`;
  }, [activeCourse]);

  const pairedTextCourse = useMemo(() => {
    if (!activeCourse) return null;
    if (activeCourse.type === CourseType.POETRY_TEXT) return activeCourse;
    return (
      MOCK_COURSES.find(
        (c) => c.type === CourseType.POETRY_TEXT && c.title === activeCourse.title && c.grade === activeCourse.grade
      ) || null
    );
  }, [activeCourse]);

  const effectivePoemLines = useMemo(() => {
    if (activeCourse?.type === CourseType.POETRY_TEXT) return poemData?.lines || pairedTextCourse?.lines || [];
    return poemData?.lines || pairedTextCourse?.lines || [];
  }, [activeCourse?.type, poemData?.lines, pairedTextCourse?.lines]);

  const setCourseMeta = (m: CourseMeta) => setCourseMetaState(m);

  const formatCount = (n: number) => {
    if (n >= 10000) return `${(n / 10000).toFixed(1).replace(/\.0$/, '')}w`;
    if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    return `${n}`;
  };

  const introText = useMemo(() => {
    if (!activeCourse) return '';
    const who = activeCourse.dynasty ? `${activeCourse.dynasty}·${activeCourse.author}` : activeCourse.author;
    if (activeCourse.type === CourseType.POETRY_DANCE) {
      return `跟着视频学动作，边读边跳，感受《${activeCourse.title}》的节奏与画面。作者：${who}。`;
    }
    return `读一读《${activeCourse.title}》，理解诗句意思，找到最美的画面，再试着背下来。作者：${who}。`;
  }, [activeCourse]);

  const courseStartRef = useRef<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 1400);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (!activeCourse) {
      courseStartRef.current = null;
      setCourseMetaState(null);
      setLiked(false);
      setFavorited(false);
      setComments([]);
      setCommentText('');
      setCommentError(null);
      setVideoError(false);
      return;
    }
    courseStartRef.current = Date.now();
    setVideoError(false);

    setCourseMeta(getCourseMeta(activeCourse.id));

    const uid = auth.isGuest ? 'guest' : auth.userId || 'guest';
    if (auth.isGuest) {
      setLiked(false);
      setFavorited(false);
    } else {
      const a = getCourseActions(uid, activeCourse.id);
      setLiked(a.liked);
      setFavorited(a.favorited);
    }

    if (auth.isGuest) {
      setComments([]);
    } else {
      setComments(listCourseComments(activeCourse.id));
    }
  }, [activeCourse?.id, auth.isGuest, auth.userId]);

  useEffect(() => {
    if (!openCourseId) return;
    const course = MOCK_COURSES.find((c) => c.id === openCourseId);
    if (!course) return;
    setActiveCourse(course);
    onCourseOpened?.();
  }, [openCourseId]);

  const buildPoemContextHint = (course: Course) => {
    const pieces: string[] = [];
    if (course.sourceBasename) pieces.push(course.sourceBasename);
    pieces.push(`${course.grade}年级`);
    if (course.author && course.author !== '部编语文') pieces.push(`作者可能是：${course.author}`);
    return pieces.join('；');
  };

  useEffect(() => {
    if (!activeCourse) {
      setPoemData(null);
      setPoemLoading(false);
      setPoemError(null);
      return;
    }

    const baseAuthor = pairedTextCourse?.author || activeCourse.author;
    const baseLines = pairedTextCourse?.lines || (activeCourse.type === CourseType.POETRY_TEXT ? activeCourse.lines : undefined);

    if (baseLines && baseLines.length > 0 && baseAuthor && baseAuthor !== '部编语文') {
      setPoemData({
        title: activeCourse.title,
        author: baseAuthor,
        lines: baseLines,
      });
      setPoemLoading(false);
      setPoemError(null);
      return;
    }

    if (poemCacheKey) {
      try {
        const cached = localStorage.getItem(poemCacheKey);
        if (cached) {
          const parsed = JSON.parse(cached) as PoemOriginal;
          if (parsed?.title && parsed?.author && Array.isArray(parsed?.lines) && parsed.lines.length > 0) {
            setPoemData(parsed);
            setPoemLoading(false);
            setPoemError(null);
            return;
          }
        }
      } catch {
      }
    }

    let cancelled = false;
    setPoemLoading(true);
    setPoemError(null);
    setPoemData(null);

    const contextHint = buildPoemContextHint(activeCourse);

    const fetchWithRetry = async () => {
      const delays = [0, 800, 1800];
      let lastError: unknown = null;
      for (let i = 0; i < delays.length; i++) {
        if (delays[i] > 0) {
          await new Promise((r) => setTimeout(r, delays[i]));
        }
        try {
          const data = await generatePoemOriginal(activeCourse.title, contextHint);
          return data;
        } catch (err) {
          lastError = err;
        }
      }
      throw lastError;
    };

    fetchWithRetry()
      .then((data) => {
        if (cancelled) return;
        setPoemData(data);
        setPoemLoading(false);
        setPoemError(null);
        if (poemCacheKey) localStorage.setItem(poemCacheKey, JSON.stringify(data));
      })
      .catch((err) => {
        if (cancelled) return;
        setPoemLoading(false);
        setPoemData(null);
        setPoemError(err instanceof Error ? err.message : '无法获取诗词原文');
      });

    return () => {
      cancelled = true;
    };
  }, [activeCourse, poemCacheKey, pairedTextCourse]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-800">{t.menu_courses}</h1>
        
        <div className="relative">
            <input 
                type="text" 
                placeholder="搜索诗名或作者..." 
                className="pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 w-full md:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        {/* Grade Filter */}
        <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-gray-600 mr-2">{t.grade}:</span>
            <button 
                onClick={() => setSelectedGrade('ALL')}
                className={`px-4 py-1.5 rounded-full text-sm transition-all ${selectedGrade === 'ALL' ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
                全部
            </button>
            {grades.map(g => (
                <button 
                    key={g}
                    onClick={() => setSelectedGrade(g as Grade)}
                    className={`px-4 py-1.5 rounded-full text-sm transition-all ${selectedGrade === g ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    {g}年级
                </button>
            ))}
        </div>

        {/* Type Filter */}
        <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-gray-600 mr-2">{t.type}:</span>
            <button 
                onClick={() => setSelectedType('ALL')}
                className={`px-4 py-1.5 rounded-full text-sm transition-all ${selectedType === 'ALL' ? 'bg-secondary text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
                全部
            </button>
            <button 
                onClick={() => setSelectedType(CourseType.POETRY_DANCE)}
                className={`px-4 py-1.5 rounded-full text-sm transition-all ${selectedType === CourseType.POETRY_DANCE ? 'bg-secondary text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
                {t.poetry_dance}
            </button>
            <button 
                onClick={() => setSelectedType(CourseType.POETRY_TEXT)}
                className={`px-4 py-1.5 rounded-full text-sm transition-all ${selectedType === CourseType.POETRY_TEXT ? 'bg-secondary text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
                {t.poetry_text}
            </button>
        </div>
      </div>

      {/* Grid */}
      {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map(course => (
                <CourseCard key={course.id} course={course} onClick={setActiveCourse} />
            ))}
          </div>
      ) : (
          <div className="text-center py-20 text-gray-400">
              <p>没有找到相关课程哦 🌱</p>
          </div>
      )}

      {activeCourse && (
        <div className="fixed inset-0 z-[80] bg-[#FDF6E3]">
          <div className="fixed top-0 left-0 right-0 z-[90] bg-white/90 backdrop-blur border-b border-gray-100">
            <div className="h-16 px-4 md:px-8 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    activeCourse.type === CourseType.POETRY_DANCE ? 'bg-secondary/15 text-secondary' : 'bg-primary/15 text-primary'
                  }`}
                >
                  {activeCourse.type === CourseType.POETRY_DANCE ? <Video size={20} /> : <BookOpen size={20} />}
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-gray-800 truncate">{activeCourse.title}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {activeCourse.grade}年级 · {activeCourse.type === CourseType.POETRY_DANCE ? '诗舞课程' : '诗词赏析'} ·{' '}
                    {(activeCourse.dynasty || getDynastyByAuthor(poemData?.author || activeCourse.author) || '') &&
                      `${activeCourse.dynasty || getDynastyByAuthor(poemData?.author || activeCourse.author)}·`}
                    {poemData?.author || activeCourse.author}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  className="px-4 h-10 rounded-2xl bg-primary text-white font-extrabold hover:brightness-110 transition-all"
                  onClick={() => {
                    if (auth.isGuest) {
                      setToast('游客模式不保存学习记录');
                      return;
                    }
                    if (!auth.userId) return;
                    const started = courseStartRef.current || Date.now();
                    const minutes = Math.max(1, Math.min(60, Math.round((Date.now() - started) / 60000)));
                    const stars = Math.max(1, Math.min(5, activeCourse.stars || 1));
                    auth.addEvent({
                      id: makeId(),
                      type: 'course_complete',
                      ts: Date.now(),
                      minutes,
                      stars,
                      payload: {
                        courseId: activeCourse.id,
                        title: activeCourse.title,
                        grade: activeCourse.grade,
                        courseType: activeCourse.type,
                      },
                    });
                    const current = getCourseMeta(activeCourse.id);
                    const nextMeta = updateCourseMeta(activeCourse.id, { learners: current.learners + 1 });
                    setCourseMeta(nextMeta);
                    setToast(`已记录学习：+${stars} 星`);
                  }}
                >
                  完成学习
                </button>
                <button
                  className="w-10 h-10 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center"
                  onClick={() => setActiveCourse(null)}
                  aria-label="关闭"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-20 pb-10 px-4 md:px-8 h-full overflow-y-auto">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm text-gray-500 font-bold">课程简介</div>
                    <div className="mt-1 text-gray-800 font-extrabold leading-relaxed break-words">{introText}</div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="px-4 h-10 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-2 text-gray-700 font-extrabold">
                      <Users size={18} className="text-gray-500" />
                      {formatCount(courseMeta?.learners || 0)} 人学过
                    </div>
                    <div className="px-4 h-10 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-2 text-gray-700 font-extrabold">
                      <Bookmark size={18} className="text-gray-500" />
                      {formatCount(courseMeta?.favorites || 0)}
                    </div>
                    <div className="px-4 h-10 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-2 text-gray-700 font-extrabold">
                      <ThumbsUp size={18} className="text-gray-500" />
                      {formatCount(courseMeta?.likes || 0)}
                    </div>
                    <div className="px-4 h-10 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-2 text-gray-700 font-extrabold">
                      <Share2 size={18} className="text-gray-500" />
                      {formatCount(courseMeta?.shares || 0)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3 flex-wrap">
                  <button
                    className={`px-4 h-11 rounded-2xl border font-extrabold transition-all flex items-center gap-2 ${
                      liked ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      if (!activeCourse || !courseMeta) return;
                      if (auth.isGuest) {
                        setToast('游客模式不保存点赞');
                        return;
                      }
                      const uid = auth.userId || 'guest';
                      const prev = getCourseActions(uid, activeCourse.id);
                      const nextLiked = !prev.liked;
                      const next = { ...prev, liked: nextLiked };
                      setCourseActions(uid, activeCourse.id, next);
                      setLiked(nextLiked);
                      const nextMeta = updateCourseMeta(activeCourse.id, { likes: courseMeta.likes + (nextLiked ? 1 : -1) });
                      setCourseMeta(nextMeta);
                    }}
                  >
                    <Heart size={18} className={liked ? 'fill-current' : ''} />
                    点赞
                  </button>

                  <button
                    className={`px-4 h-11 rounded-2xl border font-extrabold transition-all flex items-center gap-2 ${
                      favorited ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      if (!activeCourse || !courseMeta) return;
                      if (auth.isGuest) {
                        setToast('游客模式不保存收藏');
                        return;
                      }
                      const uid = auth.userId || 'guest';
                      const prev = getCourseActions(uid, activeCourse.id);
                      const nextFavorited = !prev.favorited;
                      const next = { ...prev, favorited: nextFavorited };
                      setCourseActions(uid, activeCourse.id, next);
                      setFavorited(nextFavorited);
                      const nextMeta = updateCourseMeta(activeCourse.id, { favorites: courseMeta.favorites + (nextFavorited ? 1 : -1) });
                      setCourseMeta(nextMeta);
                    }}
                  >
                    <Bookmark size={18} className={favorited ? 'fill-current' : ''} />
                    收藏
                  </button>

                  <button
                    className="px-4 h-11 rounded-2xl border bg-white border-gray-200 text-gray-700 hover:bg-gray-50 font-extrabold transition-all flex items-center gap-2"
                    onClick={async () => {
                      if (!activeCourse || !courseMeta) return;
                      if (auth.isGuest) {
                        setToast('游客模式不保存分享');
                        return;
                      }
                      const shareText = `我在吟诗舞韵学习《${activeCourse.title}》（${activeCourse.grade}年级）`;
                      try {
                        if ((navigator as any).share) {
                          await (navigator as any).share({ text: shareText });
                        } else {
                          await navigator.clipboard.writeText(shareText);
                          setToast('已复制分享内容');
                        }
                      } catch {
                        try {
                          await navigator.clipboard.writeText(shareText);
                          setToast('已复制分享内容');
                        } catch {
                          setToast('分享失败');
                        }
                      }
                      const uid = auth.userId || 'guest';
                      const prev = getCourseActions(uid, activeCourse.id);
                      if (!prev.shared) setCourseActions(uid, activeCourse.id, { ...prev, shared: true });
                      const nextMeta = updateCourseMeta(activeCourse.id, { shares: courseMeta.shares + 1 });
                      setCourseMeta(nextMeta);
                    }}
                  >
                    <Share2 size={18} />
                    分享
                  </button>
                </div>
              </div>

              {activeCourse.type === CourseType.POETRY_DANCE ? (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-5 md:p-6">
                    <div className="font-extrabold text-gray-800 flex items-center gap-2">
                      <Video size={18} className="text-secondary" />
                      诗舞学习
                    </div>
                  </div>
                  <div className="bg-black">
                    {activeCourse.videoUrl ? (
                      videoError ? (
                        <div className="h-[240px] md:h-[520px] flex flex-col items-center justify-center text-white/80 gap-3 text-center px-6">
                          <div className="font-extrabold">这个视频在当前设备上无法播放</div>
                          <div className="text-sm text-white/70">可能是网络/格式不兼容。你可以尝试在新窗口打开。</div>
                          <div className="flex items-center gap-3">
                            <a
                              className="px-4 h-10 rounded-2xl bg-white/15 hover:bg-white/25 transition-colors font-extrabold flex items-center justify-center"
                              href={activeCourse.videoUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              新窗口打开
                            </a>
                          </div>
                        </div>
                      ) : (
                        <video
                          key={activeCourse.videoUrl}
                          className="w-full h-[240px] md:h-[520px]"
                          controls
                          playsInline
                          preload="metadata"
                          onError={() => setVideoError(true)}
                        >
                          <source src={activeCourse.videoUrl} type="video/mp4" />
                        </video>
                      )
                    ) : (
                      <div className="h-[240px] md:h-[520px] flex items-center justify-center text-white/80">暂无视频资源</div>
                    )}
                  </div>
                  {effectivePoemLines.length > 0 && (
                    <div className="p-5 md:p-6">
                      <div className="font-extrabold text-gray-800 flex items-center gap-2">
                        <BookOpen size={18} className="text-primary" />
                        诗句
                      </div>
                      <div className="mt-3 text-gray-700 leading-relaxed space-y-2">
                        {effectivePoemLines.map((l, i) => (
                          <div key={i} className="font-extrabold text-lg">
                            {l}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-2">
                      <div className="rounded-2xl overflow-hidden shadow-md border border-gray-100">
                        <img src={activeCourse.coverUrl} alt={activeCourse.title} className="w-full h-56 md:h-72 object-cover" />
                      </div>
                      <div className="mt-4 bg-gray-50 rounded-2xl border border-gray-100 p-4">
                        <div className="text-sm text-gray-500">作者 / 朝代</div>
                        <div className="font-extrabold text-gray-800">
                          {(activeCourse.dynasty || getDynastyByAuthor(poemData?.author || activeCourse.author) || '—')}·{poemData?.author || activeCourse.author}
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-3">
                      <div className="text-center">
                        <div className="text-3xl font-extrabold text-gray-800">{activeCourse.title}</div>
                        <div className="text-sm text-gray-500 mt-2">
                          {(activeCourse.dynasty || getDynastyByAuthor(poemData?.author || activeCourse.author) || '—')}·{poemData?.author || activeCourse.author}
                        </div>
                      </div>

                      <div className="mt-6">
                        {poemLoading && (
                          <div className="flex items-center gap-3 text-gray-500">
                            <Loader2 className="animate-spin" size={18} />
                            正在加载诗词原文…
                          </div>
                        )}

                        {!poemLoading && poemError && (
                          <div className="bg-orange-50 border border-orange-100 text-orange-700 rounded-2xl p-4 text-sm">
                            未能获取《{activeCourse.title}》原文：{poemError}
                            <div className="mt-3">
                              <button
                                className="bg-orange-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-orange-600 transition-colors"
                                onClick={() => {
                                  setPoemError(null);
                                  setPoemData(null);
                                  setPoemLoading(true);
                                  const next = { ...activeCourse };
                                  setActiveCourse(null);
                                  setTimeout(() => setActiveCourse(next), 0);
                                }}
                              >
                                重试获取原文
                              </button>
                            </div>
                          </div>
                        )}

                        {!poemLoading && !poemError && poemData?.lines?.length ? (
                          <div className="text-center space-y-3 text-xl md:text-2xl leading-relaxed text-gray-700 font-serif">
                            {poemData.lines.map((line, idx) => (
                              <p key={idx}>{line}</p>
                            ))}
                          </div>
                        ) : null}

                        {!poemLoading && !poemError && !poemData?.lines?.length && (
                          <div className="bg-gray-50 border border-gray-100 text-gray-600 rounded-2xl p-4 text-sm">
                            暂未收录该诗的原文。配置 VITE_NVIDIA_API_KEY 后可自动生成并缓存到本机浏览器。
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="font-extrabold text-gray-800 flex items-center gap-2">
                    <MessageCircle size={18} className="text-secondary" />
                    评论
                  </div>
                  <div className="text-xs text-gray-500">提示：在评论里输入 @小诗AI + 问题，可以让小诗AI回复</div>
                </div>

                <div className="mt-4 space-y-3">
                  {comments.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-gray-500">还没有评论，写下第一条吧。</div>
                  ) : (
                    comments.slice(-20).map((c) => (
                      <div key={c.id} className={`rounded-2xl border p-4 ${c.role === 'ai' ? 'bg-primary/10 border-primary/15' : 'bg-white border-gray-100'}`}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-extrabold text-gray-800">{c.role === 'ai' ? '小诗AI' : c.displayName}</div>
                          <div className="text-xs text-gray-400">{new Date(c.ts).toLocaleString()}</div>
                        </div>
                        <div className="mt-2 text-gray-700 leading-relaxed whitespace-pre-wrap">{c.text}</div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-5">
                  <div className="flex items-end gap-3">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="写评论…（可 @小诗AI 提问）"
                      className="flex-1 min-h-[44px] max-h-40 px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      className="w-12 h-12 rounded-2xl bg-primary text-white font-extrabold hover:brightness-110 transition-all flex items-center justify-center disabled:opacity-60"
                      disabled={commentBusy}
                      onClick={async () => {
                        if (!activeCourse) return;
                        setCommentError(null);
                        const check = localModerate(commentText);
                        if (!check.ok) {
                          setCommentError(check.reason);
                          return;
                        }
                        setCommentBusy(true);
                        try {
                          try {
                            const ai = await aiModerate(commentText);
                            if (!ai.allow) {
                              setCommentError(ai.reason || '评论不适合发布');
                              return;
                            }
                          } catch {
                          }

                          const ts = Date.now();
                          const uid = auth.isGuest ? 'guest' : auth.userId || 'guest';
                          const name = auth.settings?.displayName || (auth.isGuest ? '游客' : '同学');
                          const userComment: CourseComment = {
                            id: makeId(),
                            courseId: activeCourse.id,
                            userId: uid,
                            displayName: name,
                            ts,
                            role: 'user',
                            text: commentText.trim(),
                          };

                          if (auth.isGuest) {
                            setComments((prev) => [...prev, userComment]);
                          } else {
                            addCourseComment(activeCourse.id, userComment);
                            setComments(listCourseComments(activeCourse.id));
                          }

                          const mention = /@小诗AI|@小诗/.test(commentText);
                          const question = commentText.replace(/@小诗AI|@小诗/g, '').trim();
                          setCommentText('');

                          if (mention && question) {
                            const session = createChatSession();
                            const prompt = `你是“小诗”，在课程页面里回答学生在评论区的提问。请结合课程内容回答，句子短一点。\n\n课程内容：\n标题：${activeCourse.title}\n作者：${poemData?.author || activeCourse.author}\n朝代：${activeCourse.dynasty || getDynastyByAuthor(poemData?.author || activeCourse.author) || '—'}\n简介：${introText}\n诗句：${effectivePoemLines.join(' ')}\n\n学生问题：${question}`;
                            const res = await session.sendMessage({ message: prompt });
                            const aiComment: CourseComment = {
                              id: makeId(),
                              courseId: activeCourse.id,
                              userId: 'ai',
                              displayName: '小诗AI',
                              ts: Date.now(),
                              role: 'ai',
                              text: res.text.trim() || '我再想想，你可以换个问法吗？',
                            };
                            if (auth.isGuest) {
                              setComments((prev) => [...prev, aiComment]);
                            } else {
                              addCourseComment(activeCourse.id, aiComment);
                              setComments(listCourseComments(activeCourse.id));
                            }
                          }
                        } finally {
                          setCommentBusy(false);
                        }
                      }}
                    >
                      <Send size={18} />
                    </button>
                  </div>
                  {commentError && <div className="mt-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl p-4 text-sm font-bold">{commentError}</div>}
                </div>
              </div>
            </div>
          </div>

          <CourseAssistant course={activeCourse} poemLines={effectivePoemLines} introText={introText} />
        </div>
      )}

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[120]">
          <div className="px-4 py-2 rounded-full bg-black/80 text-white text-sm font-bold shadow-2xl">{toast}</div>
        </div>
      )}
    </div>
  );
};
