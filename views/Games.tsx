import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MOCK_COURSES, TRANSLATIONS } from '../constants';
import { POEM_LIBRARY } from '../poems';
import { Course, CourseType } from '../types';
import { useAuth } from '../context/AuthContext';
import { makeId } from '../services/storage';
import {
  Gamepad2,
  Music,
  Swords,
  HelpCircle,
  Trophy,
  X,
  Video,
  Minus,
  Plus,
  EyeOff,
  Eye,
  Star,
  Volume2,
  VolumeX,
  Moon,
  Mountain,
  Waves,
  Cloud,
  CloudRain,
  Snowflake,
  Wind,
  Flower2,
  Leaf,
  Bird,
  Sun,
  Sparkles,
  Flame,
  Ship,
  Trees,
  Sprout,
  Rainbow,
} from 'lucide-react';

interface GamesProps {
  lang: 'zh' | 'en';
}

export const Games: React.FC<GamesProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang];
  const auth = useAuth();
  const [mode, setMode] = useState<
    'hub' | 'dance-select' | 'dance' | 'dance-result' | 'pk-select' | 'pk' | 'pk-result' | 'riddle-select' | 'riddle' | 'riddle-result'
  >('hub');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [danceSearch, setDanceSearch] = useState('');
  const [danceCountdown, setDanceCountdown] = useState<number | null>(null);
  const [danceResult, setDanceResult] = useState<{ stars: number; score: number; matched: number; total: number } | null>(null);
  const [pkDifficulty, setPkDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [pkSeed, setPkSeed] = useState(0);
  const [pkResult, setPkResult] = useState<{
    userScore: number;
    aiScore: number;
    userCorrect: number;
    aiCorrect: number;
    rounds: number;
    stars: number;
  } | null>(null);
  const [riddleDifficulty, setRiddleDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [riddleSeed, setRiddleSeed] = useState(0);
  const [riddleResult, setRiddleResult] = useState<{
    score: number;
    correct: number;
    rounds: number;
    stars: number;
  } | null>(null);

  const danceStartRef = useRef<number | null>(null);
  const pkStartRef = useRef<number | null>(null);
  const riddleStartRef = useRef<number | null>(null);
  const recordedRef = useRef<Record<string, true>>({});

  const toLocalDateKey = (ts: number) => {
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const startOfDay = (ts: number) => {
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  const getWeekStartMonday = (ts: number) => {
    const d = new Date(ts);
    const dow = d.getDay(); // 0=Sun .. 6=Sat
    const daysSinceMonday = (dow + 6) % 7;
    return startOfDay(ts - daysSinceMonday * 24 * 60 * 60 * 1000);
  };

  const hash = (s: string) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };

  const leaderboard = useMemo(() => {
    const weekStart = getWeekStartMonday(Date.now());
    const weekEnd = weekStart + 7 * 24 * 60 * 60 * 1000;
    const myStars = auth.events
      .filter(
        (e) =>
          (e.type === 'game_dance_complete' || e.type === 'game_pk_complete' || e.type === 'game_riddle_complete') &&
          e.ts >= weekStart &&
          e.ts < weekEnd
      )
      .reduce((sum, e) => sum + (typeof e.stars === 'number' ? e.stars : 0), 0);

    const weekKey = `${toLocalDateKey(weekStart)}:${auth.settings?.grade ?? 'ALL'}`;
    let x = hash(weekKey) || 1;
    const nextRand = () => {
      x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
      return x;
    };

    const baseNames = ['李小明', '王二小', '张小红', '赵小雨', '陈小乐', '周小青', '孙小满', '吴小星'];
    const others = baseNames.map((name, i) => {
      const r = nextRand();
      const stars = 18 + (r % 70); // 18~87
      const avatar = `https://picsum.photos/50?random=${(r % 40) + i + 1}`;
      return { id: `bot:${i}`, name, stars, avatar, isMe: false };
    });

    const me =
      auth.userId && !auth.isGuest
        ? [
            {
              id: auth.userId,
              name: auth.settings?.displayName || '我',
              stars: Math.max(0, Math.min(999, myStars)),
              avatar: `https://picsum.photos/50?random=${(hash(auth.userId) % 40) + 100}`,
              isMe: true,
            },
          ]
        : [];

    const list = [...others, ...me]
      .sort((a, b) => b.stars - a.stars)
      .map((u, idx) => ({ ...u, rank: idx + 1 }));

    const myRow = list.find((u) => u.isMe) || null;
    return { list: list.slice(0, 10), myStars, myRank: myRow?.rank ?? null };
  }, [auth.events, auth.isGuest, auth.settings?.displayName, auth.settings?.grade, auth.userId]);

  const games = [
    {
      id: 'dance',
      title: t.game_dance,
      desc: '跟随节奏，模仿古诗中的动作！',
      icon: Music,
      color: 'bg-purple-100 text-purple-600',
      btnColor: 'bg-purple-500',
      difficulty: '⭐⭐⭐'
    },
    {
      id: 'pk',
      title: t.game_pk,
      desc: '与好友或AI进行飞花令对决！',
      icon: Swords,
      color: 'bg-orange-100 text-orange-600',
      btnColor: 'bg-orange-500',
      difficulty: '⭐⭐⭐⭐'
    },
    {
      id: 'riddle',
      title: t.game_guess,
      desc: '根据画面猜出对应的诗句。',
      icon: HelpCircle,
      color: 'bg-green-100 text-green-600',
      btnColor: 'bg-green-500',
      difficulty: '⭐⭐'
    }
  ];

  const danceCourses = useMemo(() => {
    return MOCK_COURSES
      .filter((c) => c.type === CourseType.POETRY_DANCE && Boolean(c.videoUrl))
      .filter((c) => {
        if (!danceSearch.trim()) return true;
        const q = danceSearch.trim();
        return c.title.includes(q) || c.author.includes(q);
      });
  }, [danceSearch]);

  const startDanceSelect = () => {
    setSelectedCourse(null);
    setDanceResult(null);
    setDanceCountdown(null);
    setMode('dance-select');
  };

  const startDance = (course: Course) => {
    setSelectedCourse(course);
    setDanceResult(null);
    setDanceCountdown(3);
    danceStartRef.current = Date.now();
    setMode('dance');
  };

  const startPkSelect = () => {
    setPkResult(null);
    setPkSeed((s) => s + 1);
    setMode('pk-select');
  };

  const startPk = () => {
    setPkResult(null);
    setPkSeed((s) => s + 1);
    pkStartRef.current = Date.now();
    setMode('pk');
  };

  const startRiddleSelect = () => {
    setRiddleResult(null);
    setRiddleSeed((s) => s + 1);
    setMode('riddle-select');
  };

  const startRiddle = () => {
    setRiddleResult(null);
    setRiddleSeed((s) => s + 1);
    riddleStartRef.current = Date.now();
    setMode('riddle');
  };

  const closeOverlay = () => {
    setSelectedCourse(null);
    setDanceResult(null);
    setDanceCountdown(null);
    setPkResult(null);
    setRiddleResult(null);
    setMode('hub');
  };

  const minutesFrom = (start: number | null) => {
    if (!start) return 0;
    return Math.max(1, Math.min(60, Math.round((Date.now() - start) / 60000)));
  };

  useEffect(() => {
    if (!auth.userId) return;
    if (mode !== 'dance-result') return;
    if (!selectedCourse || !danceResult) return;
    const token = `dance:${selectedCourse.id}:${danceResult.score}:${danceResult.stars}:${danceResult.matched}:${danceResult.total}`;
    if (recordedRef.current[token]) return;
    recordedRef.current[token] = true;
    auth.addEvent({
      id: makeId(),
      type: 'game_dance_complete',
      ts: Date.now(),
      minutes: minutesFrom(danceStartRef.current),
      stars: danceResult.stars,
      payload: { courseId: selectedCourse.id, title: selectedCourse.title, score: danceResult.score },
    });
  }, [mode, selectedCourse?.id, danceResult?.score, danceResult?.stars, danceResult?.matched, danceResult?.total, auth.userId]);

  useEffect(() => {
    if (!auth.userId) return;
    if (mode !== 'pk-result') return;
    if (!pkResult) return;
    const token = `pk:${pkResult.userScore}:${pkResult.aiScore}:${pkResult.userCorrect}:${pkResult.aiCorrect}:${pkResult.stars}`;
    if (recordedRef.current[token]) return;
    recordedRef.current[token] = true;
    auth.addEvent({
      id: makeId(),
      type: 'game_pk_complete',
      ts: Date.now(),
      minutes: minutesFrom(pkStartRef.current),
      stars: pkResult.stars,
      payload: { userScore: pkResult.userScore, aiScore: pkResult.aiScore, userCorrect: pkResult.userCorrect },
    });
  }, [mode, pkResult?.userScore, pkResult?.aiScore, pkResult?.userCorrect, pkResult?.aiCorrect, pkResult?.stars, auth.userId]);

  useEffect(() => {
    if (!auth.userId) return;
    if (mode !== 'riddle-result') return;
    if (!riddleResult) return;
    const token = `riddle:${riddleResult.score}:${riddleResult.correct}:${riddleResult.rounds}:${riddleResult.stars}`;
    if (recordedRef.current[token]) return;
    recordedRef.current[token] = true;
    auth.addEvent({
      id: makeId(),
      type: 'game_riddle_complete',
      ts: Date.now(),
      minutes: minutesFrom(riddleStartRef.current),
      stars: riddleResult.stars,
      payload: { score: riddleResult.score, correct: riddleResult.correct, rounds: riddleResult.rounds },
    });
  }, [mode, riddleResult?.score, riddleResult?.correct, riddleResult?.rounds, riddleResult?.stars, auth.userId]);

  const computeMotionSignature = (
    video: HTMLVideoElement,
    ctx: CanvasRenderingContext2D,
    prev: Uint8ClampedArray | null,
    opts: { crop?: { x: number; y: number; w: number; h: number }; mirror?: boolean }
  ) => {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      return { energy: 0, lr: 0, tb: 0, centerShare: 0, data: prev };
    }

    const srcW = video.videoWidth;
    const srcH = video.videoHeight;
    const crop = opts.crop || { x: 0.12, y: 0.1, w: 0.76, h: 0.8 };
    const sx = Math.max(0, Math.floor(srcW * crop.x));
    const sy = Math.max(0, Math.floor(srcH * crop.y));
    const sw = Math.max(1, Math.floor(srcW * crop.w));
    const sh = Math.max(1, Math.floor(srcH * crop.h));

    if (opts.mirror) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, sx, sy, sw, sh, -w, 0, w, h);
      ctx.restore();
    } else {
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, w, h);
    }

    const frame = ctx.getImageData(0, 0, w, h).data;
    if (!prev) return { energy: 0, lr: 0, tb: 0, centerShare: 0, data: new Uint8ClampedArray(frame) };

    let sum = 0;
    let left = 0;
    let right = 0;
    let top = 0;
    let bottom = 0;
    let center = 0;
    const midX = w / 2;
    const midY = h / 2;
    const c1x = w * 0.33;
    const c2x = w * 0.67;
    const c1y = h * 0.33;
    const c2y = h * 0.67;

    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        const idx = (y * w + x) * 4;
        const d = Math.abs(frame[idx] - prev[idx]);
        sum += d;
        if (x < midX) left += d; else right += d;
        if (y < midY) top += d; else bottom += d;
        if (x >= c1x && x <= c2x && y >= c1y && y <= c2y) center += d;
      }
    }

    const samples = (Math.ceil(h / 2) * Math.ceil(w / 2)) || 1;
    const energy = sum / samples;
    const lr = (right - left) / Math.max(1, right + left);
    const tb = (bottom - top) / Math.max(1, bottom + top);
    const centerShare = center / Math.max(1, sum);

    return { energy, lr, tb, centerShare, data: new Uint8ClampedArray(frame) };
  };

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

  const praisePhrases = [
    '太棒了',
    '动作很到位',
    '节奏抓得稳',
    '你学得真快',
    '越来越像小老师',
    '这一段很精彩',
    '手势很标准',
    '步子很轻快',
    '眼神很自信',
    '继续保持',
    '超有感觉',
    '你真厉害',
    '配合得真好',
    '好有力量',
    '动作很干净',
  ];

  const praiseStyles = [
    'pop',
    'stamp',
    'slideLeft',
    'slideRight',
    'bounce',
    'spin',
    'wave',
    'type',
    'split',
    'glow',
    'shake',
    'stack',
  ] as const;

  const bgThemes = [
    'starfield',
    'meteors',
    'petals',
    'sparkles',
    'confetti',
    'bubbles',
    'snow',
    'fireflies',
    'rainbow',
    'neonGrid',
    'clouds',
    'aurora',
  ] as const;

  const actionCatalog = [
    '双手合十左右摆动',
    '双手合十上下点动',
    '双手左右摆动（像钟摆）',
    '双手上下摆动（像海浪）',
    '双臂展开再合拢',
    '双臂向两侧画圆',
    '单手挥手（右）',
    '单手挥手（左）',
    '双手交替挥动',
    '双手前推后收',
    '双手上举再放下',
    '双手从胸前打开',
    '左右转体摆肩',
    '上身前后点动',
    '左右踏步',
    '原地小跳',
    '侧向小跳',
    '拍手节奏（轻拍）',
    '拍手节奏（连拍）',
    '抱拳左右摆动',
    '双手画心再展开',
    '双手交叉再打开',
    '双手斜向上摆（右上）',
    '双手斜向上摆（左上）',
  ];

  const DanceOverlay: React.FC<{ course: Course; countdown: number | null }> = ({ course, countdown }) => {
    const webcamRef = useRef<HTMLVideoElement | null>(null);
    const refVideoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const camErrRef = useRef<string | null>(null);
    const [cameraReady, setCameraReady] = useState(false);
    const [refVisible, setRefVisible] = useState(true);
    const [refWidth, setRefWidth] = useState(260);
    const [refMuted, setRefMuted] = useState(false);
    const [tapToPlay, setTapToPlay] = useState(false);
    const [running, setRunning] = useState(false);
    const [sparkId, setSparkId] = useState(0);
    const [bgTheme, setBgTheme] = useState<(typeof bgThemes)[number]>(() => {
      return bgThemes[Math.floor(Math.random() * bgThemes.length)];
    });
    const [praises, setPraises] = useState<Array<{ id: number; text: string; style: (typeof praiseStyles)[number]; x: number; y: number }>>([]);
    const [effects, setEffects] = useState<Array<{ id: number; type: 'confetti' | 'rays' | 'stickers'; x: number; y: number }>>([]);
    const latestCountRef = useRef(countdown);
    const scoringRef = useRef<{ total: number; matched: number }>({ total: 0, matched: 0 });
    const lastSparkAtRef = useRef(0);
    const lastTickAtRef = useRef(0);
    const warmupUntilRef = useRef(0);
    const syncEmaRef = useRef(0);
    const webStatsRef = useRef<{ mean: number; var: number }>({ mean: 0, var: 0 });
    const refStatsRef = useRef<{ mean: number; var: number }>({ mean: 0, var: 0 });
    const webHistRef = useRef<Array<{ t: number; energy: number; lr: number; tb: number; center: number }>>([]);
    const refHistRef = useRef<Array<{ t: number; energy: number; lr: number; tb: number; center: number }>>([]);
    const actionRef = useRef<{ web: string; ref: string; group: string }>({ web: '动作跟随', ref: '动作跟随', group: 'generic' });
    const webPrevRef = useRef<Uint8ClampedArray | null>(null);
    const refPrevRef = useRef<Uint8ClampedArray | null>(null);
    const webCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const refCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const endedRef = useRef(false);

    useEffect(() => {
      latestCountRef.current = countdown;
    }, [countdown]);

    const bgSeeds = useMemo(() => {
      const stars = Array.from({ length: 60 }).map(() => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 1 + Math.random() * 2,
        opacity: 0.3 + Math.random() * 0.6,
        duration: 2.2 + Math.random() * 3.8,
        delay: Math.random() * -3,
      }));
      const meteors = Array.from({ length: 10 }).map(() => ({
        left: Math.random() * 100,
        top: Math.random() * 40,
        width: 140 + Math.random() * 220,
        duration: 2.4 + Math.random() * 3.6,
        delay: Math.random() * -4,
      }));
      const falls = Array.from({ length: 22 }).map((_, i) => ({
        left: Math.random() * 100,
        top: Math.random() * -50,
        size: 8 + Math.random() * 14,
        rotate: Math.random() * 360,
        duration: 4 + Math.random() * 5.5,
        delay: Math.random() * -6,
        colorIndex: i % 4,
      }));
      const bubbles = Array.from({ length: 18 }).map(() => ({
        left: Math.random() * 100,
        size: 10 + Math.random() * 26,
        duration: 4.2 + Math.random() * 6.2,
        delay: Math.random() * -6,
      }));
      const fireflies = Array.from({ length: 22 }).map(() => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 2 + Math.random() * 4,
        duration: 2.6 + Math.random() * 4.6,
        delay: Math.random() * -5,
      }));
      return { stars, meteors, falls, bubbles, fireflies };
    }, [bgTheme]);

    useEffect(() => {
      if (!running) return;
      const id = window.setInterval(() => {
        setBgTheme((prev) => {
          const idx = bgThemes.indexOf(prev);
          const next = bgThemes[(idx + 1 + Math.floor(Math.random() * 2)) % bgThemes.length];
          return next;
        });
      }, 14000);
      return () => window.clearInterval(id);
    }, [running]);

    useEffect(() => {
      const ensureCamera = async () => {
        camErrRef.current = null;
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          });
          streamRef.current = stream;
          if (webcamRef.current) {
            webcamRef.current.srcObject = stream;
            await webcamRef.current.play().catch(() => {});
          }
          setCameraReady(true);
        } catch (e) {
          camErrRef.current = e instanceof Error ? e.message : '无法打开摄像头';
          setCameraReady(false);
        }
      };

      ensureCamera();

      return () => {
        endedRef.current = true;
        if (streamRef.current) {
          for (const track of streamRef.current.getTracks()) track.stop();
          streamRef.current = null;
        }
      };
    }, []);

    useEffect(() => {
      const el = refVideoRef.current;
      if (!el) return;
      el.currentTime = 0;
      el.pause();
      el.volume = 0.8;
      setTapToPlay(false);
      setPraises([]);
      setBgTheme(bgThemes[Math.floor(Math.random() * bgThemes.length)]);
    }, [course.id]);

    const finish = (reason: 'stop' | 'ended') => {
      if (endedRef.current) return;
      endedRef.current = true;
      setRunning(false);
      const total = scoringRef.current.total;
      const matched = scoringRef.current.matched;
      const score = total > 0 ? matched / total : 0;
      const base = total > 0 ? 3 : 0;
      const stars = clamp(base + Math.round(score * 7), 0, 10);
      setDanceResult({ stars, score, matched, total });
      setMode('dance-result');
      if (reason === 'stop' && refVideoRef.current) refVideoRef.current.pause();
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) track.stop();
        streamRef.current = null;
      }
    };

    useEffect(() => {
      const refVideo = refVideoRef.current;
      if (!refVideo) return;
      const onEnded = () => finish('ended');
      refVideo.addEventListener('ended', onEnded);
      return () => refVideo.removeEventListener('ended', onEnded);
    }, []);

    useEffect(() => {
      if (!cameraReady) return;
      if (countdown !== 0) return;
      if (running) return;
      endedRef.current = false;
      scoringRef.current = { total: 0, matched: 0 };
      webPrevRef.current = null;
      refPrevRef.current = null;
      lastSparkAtRef.current = 0;
      warmupUntilRef.current = performance.now() + 1200;
      syncEmaRef.current = 0;
      webStatsRef.current = { mean: 0, var: 0 };
      refStatsRef.current = { mean: 0, var: 0 };
      webHistRef.current = [];
      refHistRef.current = [];
      actionRef.current = { web: '动作跟随', ref: '动作跟随', group: 'generic' };
      setTapToPlay(false);
      setRunning(true);
      const refVideo = refVideoRef.current;
      if (refVideo) {
        refVideo.muted = refMuted;
        refVideo.volume = 0.8;
        refVideo.play().catch(() => setTapToPlay(true));
      }
    }, [cameraReady, countdown, running, refMuted]);

    useEffect(() => {
      if (!running) return;
      const webCanvas = webCanvasRef.current;
      const refCanvas = refCanvasRef.current;
      const webVideo = webcamRef.current;
      const refVideo = refVideoRef.current;
      if (!webCanvas || !refCanvas || !webVideo || !refVideo) return;
      const webCtx = webCanvas.getContext('2d', { willReadFrequently: true });
      const refCtx = refCanvas.getContext('2d', { willReadFrequently: true });
      if (!webCtx || !refCtx) return;

      let raf = 0;
      const tick = (ts: number) => {
        if (!running) return;
        if (ts - lastTickAtRef.current < 120) {
          raf = requestAnimationFrame(tick);
          return;
        }
        lastTickAtRef.current = ts;

        const web = computeMotionSignature(webVideo, webCtx, webPrevRef.current, {
          crop: { x: 0.18, y: 0.12, w: 0.64, h: 0.76 },
          mirror: true,
        });
        const ref = computeMotionSignature(refVideo, refCtx, refPrevRef.current, {
          crop: { x: 0.06, y: 0.06, w: 0.88, h: 0.88 },
        });
        webPrevRef.current = web.data;
        refPrevRef.current = ref.data;

        webHistRef.current.push({ t: ts, energy: web.energy, lr: web.lr, tb: web.tb, center: web.centerShare });
        refHistRef.current.push({ t: ts, energy: ref.energy, lr: ref.lr, tb: ref.tb, center: ref.centerShare });
        const keepFrom = ts - 1800;
        while (webHistRef.current.length && webHistRef.current[0].t < keepFrom) webHistRef.current.shift();
        while (refHistRef.current.length && refHistRef.current[0].t < keepFrom) refHistRef.current.shift();

        const summarize = (hist: Array<{ t: number; energy: number; lr: number; tb: number; center: number }>) => {
          if (hist.length === 0) {
            return {
              energyMean: 0,
              energyStd: 0,
              lrMean: 0,
              lrAbsMean: 0,
              tbMean: 0,
              tbAbsMean: 0,
              centerMean: 0,
              lrSwitch: 0,
              tbSwitch: 0,
              peaks: 0,
            };
          }
          let eSum = 0;
          let e2Sum = 0;
          let lrSum = 0;
          let lrAbs = 0;
          let tbSum = 0;
          let tbAbs = 0;
          let cSum = 0;
          let lrSwitch = 0;
          let tbSwitch = 0;
          let peaks = 0;
          let prevLrS = 0;
          let prevTbS = 0;
          for (let i = 0; i < hist.length; i++) {
            const it = hist[i];
            eSum += it.energy;
            e2Sum += it.energy * it.energy;
            lrSum += it.lr;
            lrAbs += Math.abs(it.lr);
            tbSum += it.tb;
            tbAbs += Math.abs(it.tb);
            cSum += it.center;
            const lrS = Math.abs(it.lr) < 0.03 ? 0 : it.lr > 0 ? 1 : -1;
            const tbS = Math.abs(it.tb) < 0.03 ? 0 : it.tb > 0 ? 1 : -1;
            if (i > 0 && lrS !== 0 && prevLrS !== 0 && lrS !== prevLrS) lrSwitch += 1;
            if (i > 0 && tbS !== 0 && prevTbS !== 0 && tbS !== prevTbS) tbSwitch += 1;
            if (lrS !== 0) prevLrS = lrS;
            if (tbS !== 0) prevTbS = tbS;
          }
          const n = hist.length;
          const mean = eSum / n;
          const var0 = e2Sum / n - mean * mean;
          const std = Math.sqrt(Math.max(0, var0));
          const thr = mean + std * 1.2;
          for (let i = 0; i < hist.length; i++) {
            if (hist[i].energy > thr) peaks += 1;
          }
          return {
            energyMean: mean,
            energyStd: std,
            lrMean: lrSum / n,
            lrAbsMean: lrAbs / n,
            tbMean: tbSum / n,
            tbAbsMean: tbAbs / n,
            centerMean: cSum / n,
            lrSwitch,
            tbSwitch,
            peaks,
          };
        };

        const classify = (s: ReturnType<typeof summarize>) => {
          if (s.energyMean < 1.6 && s.lrAbsMean < 0.05 && s.tbAbsMean < 0.05) return { name: '静止准备', group: 'still' };

          if (s.peaks >= 6 && s.centerMean > 0.42) return { name: '拍手节奏（连拍）', group: 'clap' };
          if (s.peaks >= 3 && s.centerMean > 0.42) return { name: '拍手节奏（轻拍）', group: 'clap' };

          if (s.centerMean > 0.48 && s.lrSwitch >= 3 && s.lrAbsMean > 0.07) return { name: '双手合十左右摆动', group: 'lr_sway' };
          if (s.centerMean > 0.48 && s.tbSwitch >= 3 && s.tbAbsMean > 0.07) return { name: '双手合十上下点动', group: 'tb_sway' };
          if (s.centerMean > 0.45 && s.lrSwitch >= 3 && s.lrAbsMean > 0.08) return { name: '抱拳左右摆动', group: 'lr_sway' };

          if (s.lrSwitch >= 4 && s.lrAbsMean > 0.08) return { name: '双手左右摆动（像钟摆）', group: 'lr_sway' };
          if (s.tbSwitch >= 4 && s.tbAbsMean > 0.08) return { name: '双手上下摆动（像海浪）', group: 'tb_sway' };

          if (s.lrAbsMean > 0.14 && s.tbAbsMean > 0.14) return { name: '左右转体摆肩', group: 'twist' };

          if (s.lrAbsMean > 0.12 && s.lrSwitch <= 1 && s.energyMean > 2.4) {
            return { name: s.lrMean >= 0 ? '单手挥手（右）' : '单手挥手（左）', group: 'wave' };
          }
          if (s.lrAbsMean > 0.1 && s.lrSwitch >= 2) return { name: '双手交替挥动', group: 'wave_alt' };

          if (s.tbAbsMean > 0.12 && s.tbSwitch <= 1 && s.energyMean > 2.6) return { name: '双手上举再放下', group: 'raise_drop' };

          if (s.lrAbsMean > 0.09 && s.tbAbsMean > 0.09) {
            if (s.lrMean >= 0 && s.tbMean <= 0) return { name: '双手斜向上摆（右上）', group: 'diagonal' };
            if (s.lrMean < 0 && s.tbMean <= 0) return { name: '双手斜向上摆（左上）', group: 'diagonal' };
            return { name: '双手斜向摆动', group: 'diagonal' };
          }

          if (s.energyMean > 3.6 && s.centerMean < 0.32 && s.lrAbsMean < 0.08 && s.tbAbsMean < 0.08) return { name: '双臂展开再合拢', group: 'open_close' };
          if (s.energyMean > 3.0 && s.centerMean > 0.4 && s.lrAbsMean < 0.08 && s.tbAbsMean < 0.08) return { name: '双手从胸前打开', group: 'open_close' };
          if (s.energyMean > 3.2 && s.lrAbsMean < 0.1 && s.tbAbsMean < 0.1) return { name: '双臂向两侧画圆', group: 'circles' };

          if (s.energyMean > 3.4 && s.peaks >= 2 && s.lrAbsMean < 0.07 && s.tbAbsMean < 0.07) return { name: '原地小跳', group: 'jump' };
          if (s.energyMean > 3.2 && s.peaks >= 2 && s.lrAbsMean > 0.1 && s.tbAbsMean < 0.1) return { name: '侧向小跳', group: 'jump' };
          if (s.energyMean > 2.0 && s.energyMean < 3.2 && s.lrAbsMean < 0.09 && s.tbAbsMean < 0.09) return { name: '左右踏步', group: 'steps' };

          if (s.centerMean > 0.45 && s.energyMean > 2.2 && s.lrAbsMean < 0.07 && s.tbAbsMean < 0.07) return { name: '双手前推后收', group: 'push_pull' };

          return { name: '动作跟随', group: 'generic' };
        };

        const updateStats = (stats: { mean: number; var: number }, x: number) => {
          const a = 0.08;
          const delta = x - stats.mean;
          stats.mean = stats.mean + a * delta;
          stats.var = (1 - a) * stats.var + a * delta * delta;
        };

        const webStd = Math.sqrt(webStatsRef.current.var + 1);
        const refStd = Math.sqrt(refStatsRef.current.var + 1);
        const webZ = (web.energy - webStatsRef.current.mean) / webStd;
        const refZ = (ref.energy - refStatsRef.current.mean) / refStd;
        updateStats(webStatsRef.current, web.energy);
        updateStats(refStatsRef.current, ref.energy);
        const webSum = summarize(webHistRef.current);
        const refSum = summarize(refHistRef.current);
        const webAct = classify(webSum);
        const refAct = classify(refSum);
        const sameGroup = webAct.group === refAct.group;
        const compatible =
          sameGroup ||
          ((webAct.group === 'lr_sway' || webAct.group === 'wave' || webAct.group === 'wave_alt') &&
            (refAct.group === 'lr_sway' || refAct.group === 'wave' || refAct.group === 'wave_alt')) ||
          ((webAct.group === 'tb_sway' || webAct.group === 'raise_drop') &&
            (refAct.group === 'tb_sway' || refAct.group === 'raise_drop')) ||
          ((webAct.group === 'steps' || webAct.group === 'jump') && (refAct.group === 'steps' || refAct.group === 'jump'));
        actionRef.current = { web: webAct.name, ref: refAct.name, group: sameGroup ? webAct.group : compatible ? 'compatible' : 'generic' };

        const webEn = (web.energy - webSum.energyMean) / (webSum.energyStd + 1);
        const windowFrom = ts - 900;
        let best = 0;
        const refHist = refHistRef.current;
        const step = Math.max(1, Math.floor(refHist.length / 28));
        for (let i = refHist.length - 1; i >= 0; i -= step) {
          const cand = refHist[i];
          if (cand.t < windowFrom) break;
          const refEn = (cand.energy - refSum.energyMean) / (refSum.energyStd + 1);
          const active = webZ > 0.45 && refZ > 0.45 && web.energy > 1.7 && cand.energy > 1.4;
          const energyClose = 1 - clamp(Math.abs(webEn - refEn) / 2.8, 0, 1);
          const lrClose = 1 - clamp(Math.abs(Math.abs(web.lr) - Math.abs(cand.lr)) / 0.8, 0, 1);
          const tbClose = 1 - clamp(Math.abs(Math.abs(web.tb) - Math.abs(cand.tb)) / 0.8, 0, 1);
          const centerClose = 1 - clamp(Math.abs(web.centerShare - cand.center) / 0.55, 0, 1);
          const score0 = active ? (0.44 * energyClose + 0.22 * lrClose + 0.22 * tbClose + 0.12 * centerClose) : 0;
          if (score0 > best) best = score0;
        }
        const groupBonus = sameGroup ? 1.18 : compatible ? 1.1 : 0.95;
        const score = clamp(best * groupBonus, 0, 1);
        syncEmaRef.current = 0.85 * syncEmaRef.current + 0.15 * score;
        const matched = score >= 0.52;

        if (ts >= warmupUntilRef.current) {
          scoringRef.current.total += 1;
          if (matched) scoringRef.current.matched += 1;
        }

        if (matched && ts - lastSparkAtRef.current > 220) {
          lastSparkAtRef.current = ts;
          setSparkId((v) => v + 1);
          const phrase = praisePhrases[Math.floor(Math.random() * praisePhrases.length)];
          const style = praiseStyles[Math.floor(Math.random() * praiseStyles.length)];
          const x = 50 + (Math.random() * 22 - 11);
          const y = 40 + (Math.random() * 22 - 11);
          const id = Date.now() + Math.floor(Math.random() * 1000);
          setPraises((prev) => [...prev, { id, text: phrase, style, x, y }].slice(-14));
          const effId = id + 7;
          const effType: 'confetti' | 'rays' | 'stickers' =
            Math.random() < 0.34 ? 'confetti' : Math.random() < 0.67 ? 'rays' : 'stickers';
          setEffects((prev) => [...prev, { id: effId, type: effType, x, y }].slice(-8));
          window.setTimeout(() => {
            setPraises((prev) => prev.filter((p) => p.id !== id));
          }, 2400);
          window.setTimeout(() => {
            setEffects((prev) => prev.filter((e) => e.id !== effId));
          }, 1600);
        }

        raf = requestAnimationFrame(tick);
      };

      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, [running]);

    return (
      <div className="fixed inset-0 z-[80] bg-black">
        <style>{`
          @keyframes danceBurst {
            0% { transform: translate(-50%, -50%) scale(0.6); opacity: 0; }
            15% { opacity: 1; }
            60% { opacity: 1; }
            100% { transform: translate(-50%, -60%) scale(1.25); opacity: 0; }
          }
          @keyframes praisePop { 0% { transform: translate(-50%, -50%) scale(0.65); opacity: 0; } 20% { opacity: 1; } 100% { transform: translate(-50%, -60%) scale(1.05); opacity: 0; } }
          @keyframes praiseStamp { 0% { transform: translate(-50%, -50%) scale(1.6) rotate(-6deg); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate(-50%, -52%) scale(1) rotate(0deg); opacity: 0; } }
          @keyframes praiseSlideLeft { 0% { transform: translate(-20%, -50%); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate(-60%, -55%); opacity: 0; } }
          @keyframes praiseSlideRight { 0% { transform: translate(-80%, -50%); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate(-40%, -55%); opacity: 0; } }
          @keyframes praiseBounce { 0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0; } 25% { opacity: 1; transform: translate(-50%, -55%) scale(1.12); } 45% { transform: translate(-50%, -48%) scale(0.98); } 100% { transform: translate(-50%, -60%) scale(1.02); opacity: 0; } }
          @keyframes praiseSpin { 0% { transform: translate(-50%, -50%) rotate(-20deg) scale(0.85); opacity: 0; } 25% { opacity: 1; } 100% { transform: translate(-50%, -60%) rotate(12deg) scale(1.05); opacity: 0; } }
          @keyframes praiseWave { 0% { transform: translate(-50%, -50%) rotate(-2deg) scale(0.9); opacity: 0; } 30% { opacity: 1; } 60% { transform: translate(-50%, -52%) rotate(2deg) scale(1.05); } 100% { transform: translate(-50%, -60%) rotate(0deg) scale(1.02); opacity: 0; } }
          @keyframes praiseType { 0% { clip-path: inset(0 100% 0 0); opacity: 1; } 60% { clip-path: inset(0 0% 0 0); opacity: 1; } 100% { clip-path: inset(0 0% 0 0); opacity: 0; } }
          @keyframes praiseGlow { 0% { transform: translate(-50%, -50%) scale(0.92); opacity: 0; filter: drop-shadow(0 0 0 rgba(255,255,255,0)); } 30% { opacity: 1; } 100% { transform: translate(-50%, -60%) scale(1.02); opacity: 0; filter: drop-shadow(0 18px 28px rgba(0,0,0,0.35)) drop-shadow(0 0 18px rgba(255,255,255,0.45)); } }
          @keyframes praiseShake { 0% { transform: translate(-50%, -50%) rotate(0deg); opacity: 0; } 25% { opacity: 1; } 35% { transform: translate(-50%, -50%) rotate(-2deg); } 55% { transform: translate(-50%, -50%) rotate(2deg); } 100% { transform: translate(-50%, -60%) rotate(0deg); opacity: 0; } }
          @keyframes fxConfetti { 0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; } 20% { opacity: 1; } 100% { transform: translate(-50%, -60%) scale(1.25); opacity: 0; } }
          @keyframes fxRays { 0% { transform: translate(-50%, -50%) rotate(0deg) scale(0.8); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate(-50%, -50%) rotate(40deg) scale(1.25); opacity: 0; } }
          @keyframes fxSticker { 0% { transform: translate(-50%, -50%) scale(0.6) rotate(-10deg); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate(-50%, -60%) scale(1.15) rotate(8deg); opacity: 0; } }
          @keyframes bgStarTwinkle { 0% { opacity: 0.18; transform: translateY(0px); } 50% { opacity: 0.65; } 100% { opacity: 0.2; transform: translateY(-18px); } }
          @keyframes bgMeteor { 0% { transform: translate3d(120vw, -20vh, 0) rotate(-20deg); opacity: 0; } 10% { opacity: 0.9; } 100% { transform: translate3d(-30vw, 120vh, 0) rotate(-20deg); opacity: 0; } }
          @keyframes bgFall { 0% { transform: translateY(-20vh) rotate(0deg); opacity: 0; } 10% { opacity: 0.9; } 100% { transform: translateY(120vh) rotate(260deg); opacity: 0; } }
          @keyframes bgRise { 0% { transform: translateY(120vh) scale(0.9); opacity: 0; } 15% { opacity: 0.65; } 100% { transform: translateY(-30vh) scale(1.1); opacity: 0; } }
          @keyframes bgFirefly { 0% { transform: translate(0,0); opacity: 0.2; } 50% { transform: translate(18px,-24px); opacity: 0.85; } 100% { transform: translate(-14px,12px); opacity: 0.25; } }
          @keyframes bgRainbow { 0% { transform: translateX(-30%); opacity: 0.15; } 100% { transform: translateX(30%); opacity: 0.22; } }
          @keyframes bgGridMove { 0% { background-position: 0 0; } 100% { background-position: 180px 180px; } }
          @keyframes bgClouds { 0% { transform: translateX(-40%); opacity: 0.14; } 100% { transform: translateX(40%); opacity: 0.18; } }
          @keyframes bgAurora { 0% { transform: translateY(0) scale(1); opacity: 0.18; } 100% { transform: translateY(-10px) scale(1.05); opacity: 0.26; } }
        `}</style>

        <video
          ref={webcamRef}
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover scale-x-[-1] opacity-95"
        />

        <div className="absolute inset-0 pointer-events-none">
          {bgTheme === 'starfield' && (
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-b from-[#0B1026]/25 via-transparent to-black/20" />
              {bgSeeds.stars.map((s, i) => (
                <span
                  key={i}
                  className="absolute rounded-full bg-white"
                  style={{
                    left: `${s.left}%`,
                    top: `${s.top}%`,
                    width: `${s.size}px`,
                    height: `${s.size}px`,
                    opacity: s.opacity,
                    animation: `bgStarTwinkle ${s.duration}s ease-in-out ${s.delay}s infinite alternate`,
                  }}
                />
              ))}
            </div>
          )}
          {bgTheme === 'meteors' && (
            <div className="absolute inset-0">
              {bgSeeds.meteors.map((m, i) => (
                <span
                  key={i}
                  className="absolute"
                  style={{
                    left: `${m.left}%`,
                    top: `${m.top}%`,
                    width: `${m.width}px`,
                    height: '2px',
                    background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(253,230,138,0.95), rgba(168,85,247,0.2), rgba(255,255,255,0))',
                    filter: 'blur(0.2px)',
                    animation: `bgMeteor ${m.duration}s linear ${m.delay}s infinite`,
                  }}
                />
              ))}
            </div>
          )}
          {(bgTheme === 'petals' || bgTheme === 'confetti' || bgTheme === 'sparkles' || bgTheme === 'snow') && (
            <div className="absolute inset-0">
              {bgSeeds.falls.map((f, i) => (
                <span
                  key={i}
                  className="absolute"
                  style={{
                    left: `${f.left}%`,
                    top: `${f.top}%`,
                    width: `${f.size}px`,
                    height: `${f.size}px`,
                    borderRadius: bgTheme === 'petals' ? '999px 999px 999px 8px' : bgTheme === 'sparkles' ? '999px' : '6px',
                    background:
                      bgTheme === 'petals'
                        ? 'linear-gradient(135deg, rgba(251,113,133,0.9), rgba(255,255,255,0.65))'
                        : bgTheme === 'confetti'
                          ? ['rgba(253,230,138,0.95)', 'rgba(167,139,250,0.95)', 'rgba(52,211,153,0.95)', 'rgba(56,189,248,0.95)'][f.colorIndex]
                          : bgTheme === 'snow'
                            ? 'rgba(255,255,255,0.9)'
                            : 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(253,230,138,0.75))',
                    boxShadow: bgTheme === 'sparkles' ? '0 0 18px rgba(255,255,255,0.35)' : undefined,
                    opacity: bgTheme === 'confetti' ? 0.85 : 0.55,
                    transform: `rotate(${f.rotate}deg)`,
                    animation: `bgFall ${f.duration}s linear ${f.delay}s infinite`,
                  }}
                />
              ))}
            </div>
          )}
          {bgTheme === 'bubbles' && (
            <div className="absolute inset-0">
              {bgSeeds.bubbles.map((b, i) => (
                <span
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    left: `${b.left}%`,
                    width: `${b.size}px`,
                    height: `${b.size}px`,
                    background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(59,130,246,0.12))',
                    border: '1px solid rgba(255,255,255,0.25)',
                    animation: `bgRise ${b.duration}s ease-in ${b.delay}s infinite`,
                  }}
                />
              ))}
            </div>
          )}
          {bgTheme === 'fireflies' && (
            <div className="absolute inset-0">
              {bgSeeds.fireflies.map((f, i) => (
                <span
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    left: `${f.left}%`,
                    top: `${f.top}%`,
                    width: `${f.size}px`,
                    height: `${f.size}px`,
                    background: 'rgba(253,230,138,0.95)',
                    boxShadow: '0 0 18px rgba(253,230,138,0.55)',
                    animation: `bgFirefly ${f.duration}s ease-in-out ${f.delay}s infinite alternate`,
                  }}
                />
              ))}
            </div>
          )}
          {bgTheme === 'rainbow' && (
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(244,114,182,0.18) 18%, rgba(168,85,247,0.18) 36%, rgba(56,189,248,0.18) 54%, rgba(34,197,94,0.18) 72%, rgba(253,230,138,0.18) 90%, rgba(255,255,255,0) 100%)',
                animation: 'bgRainbow 3.4s ease-in-out infinite alternate',
                mixBlendMode: 'screen',
              }}
            />
          )}
          {bgTheme === 'neonGrid' && (
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
                backgroundSize: '60px 60px',
                animation: 'bgGridMove 4.2s linear infinite',
              }}
            />
          )}
          {bgTheme === 'clouds' && (
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.22), rgba(255,255,255,0) 55%), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.18), rgba(255,255,255,0) 50%), radial-gradient(circle at 30% 85%, rgba(255,255,255,0.16), rgba(255,255,255,0) 55%)',
                animation: 'bgClouds 6.5s ease-in-out infinite alternate',
              }}
            />
          )}
          {bgTheme === 'aurora' && (
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at 30% 30%, rgba(56,189,248,0.22), rgba(0,0,0,0) 60%), radial-gradient(circle at 70% 40%, rgba(168,85,247,0.22), rgba(0,0,0,0) 62%), radial-gradient(circle at 40% 75%, rgba(34,197,94,0.18), rgba(0,0,0,0) 65%)',
                filter: 'blur(0px)',
                animation: 'bgAurora 3.6s ease-in-out infinite alternate',
                mixBlendMode: 'screen',
              }}
            />
          )}

          <div className="absolute inset-0" style={{ mixBlendMode: 'screen', opacity: 0.32 }}>
            {bgSeeds.fireflies.slice(0, 12).map((f, i) => (
              <span
                key={`glitter-${i}`}
                className="absolute rounded-full"
                style={{
                  left: `${f.left}%`,
                  top: `${f.top}%`,
                  width: `${Math.max(2, f.size)}px`,
                  height: `${Math.max(2, f.size)}px`,
                  background: i % 2 === 0 ? 'rgba(255,255,255,0.9)' : 'rgba(253,230,138,0.9)',
                  boxShadow: '0 0 18px rgba(255,255,255,0.22)',
                  animation: `bgFirefly ${f.duration}s ease-in-out ${f.delay}s infinite alternate`,
                }}
              />
            ))}
          </div>
        </div>

        <canvas ref={webCanvasRef} width={64} height={64} className="hidden" />
        <canvas ref={refCanvasRef} width={64} height={64} className="hidden" />

        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white">
              <Video size={18} />
            </div>
            <div className="text-white">
              <div className="font-bold text-lg leading-tight">{course.title}</div>
              <div className="text-white/70 text-xs leading-tight">趣味舞动</div>
            </div>
          </div>
          <button
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 text-white hover:bg-white/15 transition-colors flex items-center justify-center"
            onClick={closeOverlay}
            aria-label="关闭"
          >
            <X size={18} />
          </button>
        </div>

        {refVisible && (
          <div
            className="absolute top-[76px] left-4 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black relative"
            style={{ width: refWidth }}
          >
            <video
              ref={refVideoRef}
              src={course.videoUrl}
              playsInline
              muted={refMuted}
              controls
              className="w-full aspect-video object-cover"
            />
            {tapToPlay && (
              <button
                className="absolute inset-0 flex items-center justify-center bg-black/55 text-white font-extrabold"
                onClick={() => {
                  const el = refVideoRef.current;
                  if (!el) return;
                  el.muted = refMuted;
                  el.play().then(() => setTapToPlay(false)).catch(() => {});
                }}
              >
                点一下播放
              </button>
            )}
            <div className="px-3 py-2 bg-black/60 border-t border-white/10 flex items-center justify-between text-white/85">
              <div className="text-xs font-bold">参考视频</div>
              <div className="flex items-center gap-1">
                <button
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/15 transition-colors flex items-center justify-center"
                  onClick={() => setRefWidth((w) => clamp(w - 40, 180, 520))}
                  aria-label="缩小"
                >
                  <Minus size={16} />
                </button>
                <button
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/15 transition-colors flex items-center justify-center"
                  onClick={() => setRefWidth((w) => clamp(w + 40, 180, 520))}
                  aria-label="放大"
                >
                  <Plus size={16} />
                </button>
                <button
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/15 transition-colors flex items-center justify-center"
                  onClick={() => {
                    setRefMuted((m) => {
                      const next = !m;
                      const el = refVideoRef.current;
                      if (el) el.muted = next;
                      return next;
                    });
                  }}
                  aria-label="声音"
                >
                  {refMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <button
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/15 transition-colors flex items-center justify-center"
                  onClick={() => setRefVisible(false)}
                  aria-label="隐藏"
                >
                  <EyeOff size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {!refVisible && (
          <button
            className="absolute top-[84px] left-4 px-4 py-2 rounded-2xl bg-white/10 border border-white/10 text-white font-bold hover:bg-white/15 transition-colors flex items-center gap-2"
            onClick={() => setRefVisible(true)}
          >
            <Eye size={16} />
            显示参考视频
          </button>
        )}

        {sparkId > 0 && (
          <div className="absolute inset-0 pointer-events-none" key={sparkId}>
            <div
              className="absolute left-1/2 top-1/2 w-[420px] h-[420px] rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(255,255,255,0.25) 0%, rgba(253,230,138,0.38) 22%, rgba(168,85,247,0.22) 45%, rgba(0,0,0,0) 70%)',
                animation: 'danceBurst 850ms ease-out forwards',
                mixBlendMode: 'screen',
              }}
            />
          </div>
        )}

        {effects.map((e) => (
          <div key={e.id} className="absolute inset-0 pointer-events-none">
            {e.type === 'confetti' && (
              <div
                className="absolute left-1/2 top-1/2"
                style={{
                  left: `${e.x}%`,
                  top: `${e.y}%`,
                  width: '260px',
                  height: '260px',
                  animation: 'fxConfetti 1200ms ease-out forwards',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {Array.from({ length: 18 }).map((_, i) => (
                  <span
                    key={i}
                    className="absolute"
                    style={{
                      left: '50%',
                      top: '50%',
                      width: `${6 + (i % 4)}px`,
                      height: `${10 + (i % 5)}px`,
                      borderRadius: '6px',
                      background: ['rgba(253,230,138,0.95)', 'rgba(167,139,250,0.95)', 'rgba(52,211,153,0.95)', 'rgba(56,189,248,0.95)'][i % 4],
                      transform: `translate(-50%, -50%) rotate(${i * 22}deg) translateY(${40 + (i % 6) * 10}px)`,
                      boxShadow: '0 12px 22px rgba(0,0,0,0.25)',
                      opacity: 0.95,
                    }}
                  />
                ))}
              </div>
            )}
            {e.type === 'rays' && (
              <div
                className="absolute"
                style={{
                  left: `${e.x}%`,
                  top: `${e.y}%`,
                  width: '320px',
                  height: '320px',
                  borderRadius: '999px',
                  background:
                    'conic-gradient(from 0deg, rgba(255,255,255,0) 0deg, rgba(253,230,138,0.55) 35deg, rgba(168,85,247,0.18) 70deg, rgba(255,255,255,0) 120deg)',
                  filter: 'blur(0.2px)',
                  mixBlendMode: 'screen',
                  animation: 'fxRays 1200ms ease-out forwards',
                }}
              />
            )}
            {e.type === 'stickers' && (
              <div
                className="absolute"
                style={{
                  left: `${e.x}%`,
                  top: `${e.y}%`,
                  width: '280px',
                  height: '180px',
                  animation: 'fxSticker 1400ms ease-out forwards',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {Array.from({ length: 8 }).map((_, i) => (
                  <span
                    key={i}
                    className="absolute"
                    style={{
                      left: `${18 + (i % 4) * 22}%`,
                      top: `${22 + Math.floor(i / 4) * 38}%`,
                      width: `${18 + (i % 3) * 6}px`,
                      height: `${18 + (i % 3) * 6}px`,
                      borderRadius: '999px',
                      background:
                        i % 2 === 0
                          ? 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), rgba(253,230,138,0.75))'
                          : 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), rgba(168,85,247,0.55))',
                      boxShadow: '0 18px 30px rgba(0,0,0,0.3)',
                      opacity: 0.95,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        {praises.map((p) => (
          <div
            key={p.id}
            className="absolute pointer-events-none select-none font-extrabold"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              transform: 'translate(-50%, -50%)',
              padding: '10px 16px',
              borderRadius: '999px',
              color: '#111827',
              fontSize: 'clamp(22px, 3.6vw, 48px)',
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(253,230,138,0.92), rgba(244,114,182,0.85))',
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
              letterSpacing: '0.02em',
              animation:
                p.style === 'pop'
                  ? 'praisePop 1200ms ease-out forwards'
                  : p.style === 'stamp'
                    ? 'praiseStamp 1100ms ease-out forwards'
                    : p.style === 'slideLeft'
                      ? 'praiseSlideLeft 1200ms ease-out forwards'
                      : p.style === 'slideRight'
                        ? 'praiseSlideRight 1200ms ease-out forwards'
                        : p.style === 'bounce'
                          ? 'praiseBounce 1300ms ease-out forwards'
                          : p.style === 'spin'
                            ? 'praiseSpin 1200ms ease-out forwards'
                            : p.style === 'wave'
                              ? 'praiseWave 1300ms ease-out forwards'
                              : p.style === 'type'
                                ? 'praiseType 1200ms ease-out forwards'
                                : p.style === 'glow'
                                  ? 'praiseGlow 1300ms ease-out forwards'
                                  : p.style === 'shake'
                                    ? 'praiseShake 1200ms ease-out forwards'
                                    : p.style === 'split'
                                      ? 'praisePop 1200ms ease-out forwards'
                                      : 'praisePop 1200ms ease-out forwards',
            }}
          >
            {p.text}
          </div>
        ))}

        {countdown !== null && countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-white/80 font-bold text-lg mb-3">准备开始</div>
              <div className="text-white font-extrabold text-7xl drop-shadow-[0_12px_40px_rgba(0,0,0,0.55)]">
                {countdown}
              </div>
            </div>
          </div>
        )}

        {countdown === 0 && (
          <div className="absolute top-[76px] right-4 bg-black/40 border border-white/10 text-white rounded-2xl px-4 py-3">
            <div className="text-xs text-white/70">同步率</div>
            <div className="text-lg font-extrabold">
              {Math.round(clamp(syncEmaRef.current, 0, 1) * 100)}%
            </div>
          </div>
        )}

        <div className="absolute left-1/2 bottom-10 -translate-x-1/2 flex flex-col items-center gap-3">
          {!cameraReady && (
            <div className="bg-black/45 border border-white/10 text-white/90 rounded-2xl px-4 py-3 text-sm">
              {camErrRef.current ? `摄像头不可用：${camErrRef.current}` : '正在打开摄像头…'}
            </div>
          )}
          <button
            className="w-44 h-14 rounded-full bg-white/15 border border-white/15 text-white font-extrabold text-lg shadow-2xl hover:bg-white/20 transition-colors"
            onClick={() => finish('stop')}
          >
            停止游戏
          </button>
          <div className="text-white/60 text-xs">也可以等视频结束，系统会自动结算</div>
        </div>
      </div>
    );
  };

  const DanceResultOverlay: React.FC<{ course: Course; result: NonNullable<typeof danceResult> }> = ({ course, result }) => {
    const stars = clamp(result.stars, 0, 10);
    const percent = Math.round(result.score * 100);
    return (
      <div className="fixed inset-0 z-[90] bg-gradient-to-br from-purple-700 via-pink-600 to-yellow-500">
        <style>{`
          @keyframes resultPop {
            0% { transform: translateY(18px) scale(0.96); opacity: 0; }
            60% { opacity: 1; }
            100% { transform: translateY(0) scale(1); opacity: 1; }
          }
          @keyframes glowPulse {
            0% { opacity: 0.55; transform: scale(0.98); }
            100% { opacity: 0.95; transform: scale(1.06); }
          }
        `}</style>

        <button
          className="absolute top-4 right-4 z-30 w-10 h-10 rounded-2xl bg-white/15 border border-white/15 text-white hover:bg-white/20 transition-colors flex items-center justify-center"
          onClick={closeOverlay}
          aria-label="关闭"
        >
          <X size={18} />
        </button>

        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div
            className="w-[520px] h-[520px] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.12) 38%, rgba(255,255,255,0) 70%)',
              animation: 'glowPulse 1200ms ease-in-out infinite alternate',
            }}
          />
        </div>

        <div className="relative h-full flex items-center justify-center p-6">
          <div
            className="w-full max-w-2xl bg-white/14 border border-white/18 backdrop-blur-xl rounded-3xl shadow-2xl p-8"
            style={{ animation: 'resultPop 520ms ease-out forwards' }}
          >
            <div className="text-center text-white">
              <div className="text-sm text-white/80 font-bold">趣味舞动结算</div>
              <div className="text-3xl md:text-4xl font-extrabold mt-2">{course.title}</div>
              <div className="mt-4 text-white/85 text-sm">同步率 {percent}%</div>
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
              {Array.from({ length: 10 }).map((_, idx) => {
                const active = idx < stars;
                return (
                  <Star
                    key={idx}
                    size={28}
                    className={`${active ? 'text-yellow-200' : 'text-white/35'}`}
                    fill={active ? 'currentColor' : 'transparent'}
                    strokeWidth={2}
                  />
                );
              })}
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
              <div className="bg-white/12 border border-white/15 rounded-2xl p-4">
                <div className="text-xs text-white/75 font-bold">匹配次数</div>
                <div className="text-2xl font-extrabold mt-1">{result.matched}</div>
              </div>
              <div className="bg-white/12 border border-white/15 rounded-2xl p-4">
                <div className="text-xs text-white/75 font-bold">检测次数</div>
                <div className="text-2xl font-extrabold mt-1">{result.total}</div>
              </div>
              <div className="bg-white/12 border border-white/15 rounded-2xl p-4">
                <div className="text-xs text-white/75 font-bold">星级评分</div>
                <div className="text-2xl font-extrabold mt-1">{stars} / 10</div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                className="px-6 h-12 rounded-full bg-white/18 border border-white/18 text-white font-extrabold hover:bg-white/22 transition-colors"
                onClick={() => {
                  setSelectedCourse(null);
                  setDanceResult(null);
                  setDanceCountdown(null);
                  setMode('dance-select');
                }}
              >
                再来一局
              </button>
              <button
                className="px-6 h-12 rounded-full bg-white text-purple-700 font-extrabold hover:brightness-105 transition-all"
                onClick={closeOverlay}
              >
                返回游戏大厅
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const poemEntries = useMemo(() => Object.values(POEM_LIBRARY), []);

  const pkSegmentPool = useMemo(() => {
    const p1: string[] = [];
    const p2: string[] = [];
    const strip = (s: string) => s.replace(/[，。！？；：、“”‘’（）()《》〈〉…·—\s]/g, '');
    const isHan = (s: string) => /^[\u4e00-\u9fff]+$/.test(s);
    for (const poem of poemEntries) {
      for (const line of poem.lines || []) {
        const cleaned = strip(line);
        for (let i = 0; i < cleaned.length; i++) {
          const a = cleaned.slice(i, i + 1);
          if (a && isHan(a)) p1.push(a);
          const b = cleaned.slice(i, i + 2);
          if (b.length === 2 && isHan(b)) p2.push(b);
        }
      }
    }
    const uniq = (arr: string[]) => Array.from(new Set(arr));
    return { 1: uniq(p1), 2: uniq(p2) } as Record<1 | 2, string[]>;
  }, [poemEntries]);

  type PkDifficulty = 'easy' | 'normal' | 'hard';
  type PkQuestion = {
    id: number;
    title: string;
    author: string;
    line: string;
    blanked: string;
    options: string[];
    answerIndex: number;
  };

  const buildPkQuestions = (count: number, seed: number): PkQuestion[] => {
    const rng = (() => {
      let s = seed + 1;
      return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
      };
    })();

    const strip = (s: string) => s.replace(/[，。！？；：、“”‘’（）()《》〈〉…·—\s]/g, '');
    const questions: PkQuestion[] = [];
    let tries = 0;
    while (questions.length < count && tries < count * 50) {
      tries += 1;
      const poem = poemEntries[Math.floor(rng() * poemEntries.length)];
      if (!poem?.lines?.length) continue;
      const line = poem.lines[Math.floor(rng() * poem.lines.length)];
      const cleaned = strip(line);
      if (cleaned.length < 4) continue;
      const segLen: 1 | 2 = rng() < 0.7 ? 2 : 1;
      const maxStart = cleaned.length - segLen;
      if (maxStart < 0) continue;
      const start = Math.floor(rng() * (maxStart + 1));
      const seg = cleaned.slice(start, start + segLen);
      const idx = line.indexOf(seg);
      if (idx < 0) continue;
      const placeholder = '□'.repeat(segLen);
      const blanked = `${line.slice(0, idx)}${placeholder}${line.slice(idx + segLen)}`;

      const pool = pkSegmentPool[segLen];
      if (!pool?.length) continue;
      const options = new Set<string>();
      options.add(seg);
      while (options.size < 4) {
        options.add(pool[Math.floor(rng() * pool.length)]);
      }
      const optArr = Array.from(options);
      for (let i = optArr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [optArr[i], optArr[j]] = [optArr[j], optArr[i]];
      }
      const answerIndex = optArr.indexOf(seg);
      if (answerIndex < 0) continue;
      questions.push({
        id: Date.now() + questions.length + Math.floor(rng() * 10000),
        title: poem.title,
        author: poem.author,
        line,
        blanked,
        options: optArr,
        answerIndex,
      });
    }
    return questions;
  };

  const PoetryPKOverlay: React.FC<{ difficulty: PkDifficulty; seed: number }> = ({ difficulty, seed }) => {
    const rounds = 10;
    const timePerQ = 10_000;
    const aiAcc = difficulty === 'easy' ? 0.45 : difficulty === 'normal' ? 0.62 : 0.78;
    const aiDelay = difficulty === 'easy' ? 1300 : difficulty === 'normal' ? 950 : 780;
    const [questions] = useState<PkQuestion[]>(() => buildPkQuestions(rounds, seed));
    const [idx, setIdx] = useState(0);
    const [userChoice, setUserChoice] = useState<number | null>(null);
    const [aiChoice, setAiChoice] = useState<number | null>(null);
    const [reveal, setReveal] = useState(false);
    const [userScore, setUserScore] = useState(0);
    const [aiScore, setAiScore] = useState(0);
    const [userStreak, setUserStreak] = useState(0);
    const [aiStreak, setAiStreak] = useState(0);
    const [userCorrect, setUserCorrect] = useState(0);
    const [aiCorrect, setAiCorrect] = useState(0);
    const [msLeft, setMsLeft] = useState(timePerQ);
    const [praises, setPraises] = useState<Array<{ id: number; text: string; style: (typeof praiseStyles)[number]; x: number; y: number }>>([]);
    const [effects, setEffects] = useState<Array<{ id: number; type: 'confetti' | 'rays' | 'stickers'; x: number; y: number }>>([]);
    const startAtRef = useRef(performance.now());
    const aiDoneRef = useRef(false);
    const userScoreRef = useRef(0);
    const aiScoreRef = useRef(0);
    const userCorrectRef = useRef(0);
    const aiCorrectRef = useRef(0);

    useEffect(() => { userScoreRef.current = userScore; }, [userScore]);
    useEffect(() => { aiScoreRef.current = aiScore; }, [aiScore]);
    useEffect(() => { userCorrectRef.current = userCorrect; }, [userCorrect]);
    useEffect(() => { aiCorrectRef.current = aiCorrect; }, [aiCorrect]);

    const q = questions[idx];

    useEffect(() => {
      if (!q) {
        closeOverlay();
        return;
      }
      startAtRef.current = performance.now();
      setMsLeft(timePerQ);
      setUserChoice(null);
      setAiChoice(null);
      setReveal(false);
      aiDoneRef.current = false;

      const t = window.setInterval(() => {
        const left = Math.max(0, timePerQ - (performance.now() - startAtRef.current));
        setMsLeft(left);
      }, 80);

      const aiTimer = window.setTimeout(() => {
        if (aiDoneRef.current) return;
        aiDoneRef.current = true;
        const correct = Math.random() < aiAcc;
        const pick = correct ? q.answerIndex : (() => {
          const others = [0, 1, 2, 3].filter((i) => i !== q.answerIndex);
          return others[Math.floor(Math.random() * others.length)];
        })();
        setAiChoice(pick);
      }, aiDelay);

      return () => {
        window.clearInterval(t);
        window.clearTimeout(aiTimer);
      };
    }, [idx]);

    const spawnPraise = () => {
      const phrase = praisePhrases[Math.floor(Math.random() * praisePhrases.length)];
      const style = praiseStyles[Math.floor(Math.random() * praiseStyles.length)];
      const x = 50 + (Math.random() * 28 - 14);
      const y = 42 + (Math.random() * 26 - 13);
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setPraises((prev) => [...prev, { id, text: phrase, style, x, y }].slice(-14));
      const effId = id + 7;
      const effType: 'confetti' | 'rays' | 'stickers' =
        Math.random() < 0.34 ? 'confetti' : Math.random() < 0.67 ? 'rays' : 'stickers';
      setEffects((prev) => [...prev, { id: effId, type: effType, x, y }].slice(-10));
      window.setTimeout(() => setPraises((prev) => prev.filter((p) => p.id !== id)), 2600);
      window.setTimeout(() => setEffects((prev) => prev.filter((e) => e.id !== effId)), 1700);
    };

    const settleIfReady = (nextUserChoice: number | null, nextAiChoice: number | null) => {
      if (nextUserChoice === null) return;
      if (nextAiChoice === null) return;
      setReveal(true);
      window.setTimeout(() => {
        if (idx + 1 >= rounds) {
          const uAcc = userCorrectRef.current / rounds;
          const diff = userScoreRef.current - aiScoreRef.current;
          const stars = clamp(Math.round(uAcc * 6 + (diff > 0 ? 4 : diff === 0 ? 3 : 2)), 0, 10);
          setPkResult({
            userScore: userScoreRef.current,
            aiScore: aiScoreRef.current,
            userCorrect: userCorrectRef.current,
            aiCorrect: aiCorrectRef.current,
            rounds,
            stars,
          });
          setMode('pk-result');
          return;
        }
        setIdx((v) => v + 1);
      }, 900);
    };

    useEffect(() => {
      if (userChoice !== null && aiChoice !== null && !reveal) settleIfReady(userChoice, aiChoice);
    }, [userChoice, aiChoice]);

    useEffect(() => {
      if (msLeft > 0) return;
      if (userChoice === null) setUserChoice(-1);
    }, [msLeft, userChoice]);

    useEffect(() => {
      if (userChoice === null) return;
      if (userChoice === -1) return;
      const correct = userChoice === q.answerIndex;
      if (correct) {
        const secLeft = Math.ceil(msLeft / 1000);
        const nextStreak = userStreak + 1;
        setUserStreak(nextStreak);
        setUserCorrect((c) => c + 1);
        setUserScore((s) => s + 120 + secLeft * 8 + nextStreak * 10);
        spawnPraise();
      } else {
        setUserStreak(0);
      }
    }, [userChoice]);

    useEffect(() => {
      if (aiChoice === null) return;
      const correct = aiChoice === q.answerIndex;
      if (correct) {
        const secLeft = Math.ceil(Math.max(0, timePerQ - aiDelay) / 1000);
        const nextStreak = aiStreak + 1;
        setAiStreak(nextStreak);
        setAiCorrect((c) => c + 1);
        setAiScore((s) => s + 110 + secLeft * 6 + nextStreak * 8);
      } else {
        setAiStreak(0);
      }
    }, [aiChoice]);

    const answer = (choice: number) => {
      if (userChoice !== null) return;
      setUserChoice(choice);
      settleIfReady(choice, aiChoice);
    };

    const timerPercent = clamp(msLeft / timePerQ, 0, 1);
    const ringDash = 2 * Math.PI * 20;
    const ringOffset = ringDash * (1 - timerPercent);

    return (
      <div className="fixed inset-0 z-[85] bg-gradient-to-br from-orange-600 via-pink-600 to-purple-700 overflow-hidden">
        <style>{`
          @keyframes pkPop { 0% { transform: translateY(10px) scale(0.98); opacity: 0; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
          @keyframes pkShake { 0% { transform: translateX(0); } 30% { transform: translateX(-2px); } 60% { transform: translateX(2px); } 100% { transform: translateX(0); } }
          @keyframes praisePop { 0% { transform: translate(-50%, -50%) scale(0.65); opacity: 0; } 20% { opacity: 1; } 100% { transform: translate(-50%, -60%) scale(1.06); opacity: 0; } }
          @keyframes praiseStamp { 0% { transform: translate(-50%, -50%) scale(1.6) rotate(-6deg); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate(-50%, -52%) scale(1) rotate(0deg); opacity: 0; } }
          @keyframes praiseSlideLeft { 0% { transform: translate(-20%, -50%); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate(-60%, -55%); opacity: 0; } }
          @keyframes praiseSlideRight { 0% { transform: translate(-80%, -50%); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate(-40%, -55%); opacity: 0; } }
          @keyframes praiseBounce { 0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0; } 25% { opacity: 1; transform: translate(-50%, -55%) scale(1.12); } 45% { transform: translate(-50%, -48%) scale(0.98); } 100% { transform: translate(-50%, -60%) scale(1.02); opacity: 0; } }
          @keyframes praiseSpin { 0% { transform: translate(-50%, -50%) rotate(-20deg) scale(0.85); opacity: 0; } 25% { opacity: 1; } 100% { transform: translate(-50%, -60%) rotate(12deg) scale(1.05); opacity: 0; } }
          @keyframes praiseWave { 0% { transform: translate(-50%, -50%) rotate(-2deg) scale(0.9); opacity: 0; } 30% { opacity: 1; } 60% { transform: translate(-50%, -52%) rotate(2deg) scale(1.05); } 100% { transform: translate(-50%, -60%) rotate(0deg) scale(1.02); opacity: 0; } }
          @keyframes praiseType { 0% { clip-path: inset(0 100% 0 0); opacity: 1; } 60% { clip-path: inset(0 0% 0 0); opacity: 1; } 100% { clip-path: inset(0 0% 0 0); opacity: 0; } }
          @keyframes praiseGlow { 0% { transform: translate(-50%, -50%) scale(0.92); opacity: 0; filter: drop-shadow(0 0 0 rgba(255,255,255,0)); } 30% { opacity: 1; } 100% { transform: translate(-50%, -60%) scale(1.02); opacity: 0; filter: drop-shadow(0 18px 28px rgba(0,0,0,0.35)) drop-shadow(0 0 18px rgba(255,255,255,0.45)); } }
          @keyframes praiseShake { 0% { transform: translate(-50%, -50%) rotate(0deg); opacity: 0; } 25% { opacity: 1; } 35% { transform: translate(-50%, -50%) rotate(-2deg); } 55% { transform: translate(-50%, -50%) rotate(2deg); } 100% { transform: translate(-50%, -60%) rotate(0deg); opacity: 0; } }
          @keyframes fxConfetti { 0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; } 20% { opacity: 1; } 100% { transform: translate(-50%, -60%) scale(1.25); opacity: 0; } }
          @keyframes fxRays { 0% { transform: translate(-50%, -50%) rotate(0deg) scale(0.8); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate(-50%, -50%) rotate(40deg) scale(1.25); opacity: 0; } }
          @keyframes fxSticker { 0% { transform: translate(-50%, -50%) scale(0.6) rotate(-10deg); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate(-50%, -60%) scale(1.15) rotate(8deg); opacity: 0; } }
        `}</style>

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.20), rgba(0,0,0,0) 55%)' }} />
          {Array.from({ length: 40 }).map((_, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                left: `${(i * 37) % 100}%`,
                top: `${(i * 53) % 100}%`,
                width: `${1 + (i % 2)}px`,
                height: `${1 + (i % 2)}px`,
                opacity: 0.2 + (i % 5) * 0.08,
              }}
            />
          ))}
        </div>

        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-30">
          <div className="text-white">
            <div className="font-extrabold text-xl flex items-center gap-2">
              <Swords size={18} />
              诗词PK
            </div>
            <div className="text-white/80 text-xs">第 {idx + 1} / {rounds} 题</div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12">
              <svg width="48" height="48" viewBox="0 0 48 48" className="absolute inset-0">
                <circle cx="24" cy="24" r="20" stroke="rgba(255,255,255,0.22)" strokeWidth="5" fill="none" />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="rgba(253,230,138,0.95)"
                  strokeWidth="5"
                  fill="none"
                  strokeDasharray={ringDash}
                  strokeDashoffset={ringOffset}
                  strokeLinecap="round"
                  transform="rotate(-90 24 24)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-white font-extrabold">
                {Math.ceil(msLeft / 1000)}
              </div>
            </div>
            <button
              className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 text-white hover:bg-white/15 transition-colors flex items-center justify-center"
              onClick={closeOverlay}
              aria-label="关闭"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="absolute inset-0 pt-24 pb-6 px-6 overflow-y-auto">
          <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0" style={{ animation: 'pkPop 380ms ease-out forwards' }}>
            <div className="bg-white/14 border border-white/18 backdrop-blur-xl rounded-3xl p-5 text-white">
              <div className="flex items-center justify-between">
                <div className="font-extrabold">我方</div>
                <div className="text-white/80 text-xs">连胜 {userStreak}</div>
              </div>
              <div className="mt-3 text-3xl font-extrabold">{userScore}</div>
              <div className="mt-2 text-white/80 text-xs">答对 {userCorrect}</div>
            </div>

            <div className={`bg-white/14 border border-white/18 backdrop-blur-xl rounded-3xl p-6 text-white ${reveal && userChoice !== null && userChoice !== q.answerIndex ? 'animate-[pkShake_220ms_ease-out_1]' : ''}`}>
              <div className="text-center">
                <div className="text-white/85 text-sm font-bold">{q.title} · {q.author}</div>
                <div className="mt-3 text-3xl md:text-4xl font-extrabold leading-snug">{q.blanked}</div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {q.options.map((op, i) => {
                    const correct = i === q.answerIndex;
                    const picked = userChoice === i;
                    const aiPicked = aiChoice === i;
                    const base =
                      reveal && correct
                        ? 'bg-emerald-400/85 border-emerald-200'
                        : reveal && picked && !correct
                          ? 'bg-rose-500/80 border-rose-200'
                          : 'bg-white/12 border-white/18 hover:bg-white/18';
                    return (
                      <button
                        key={i}
                        onClick={() => answer(i)}
                        disabled={userChoice !== null}
                        className={`relative rounded-2xl px-4 py-4 border text-white font-extrabold text-xl transition-all ${base}`}
                      >
                        <span>{op}</span>
                        {reveal && aiPicked && (
                          <span className="absolute -top-2 -right-2 text-[10px] font-extrabold bg-black/45 border border-white/15 px-2 py-1 rounded-full">
                            对手
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 text-white/75 text-xs">
                  {userChoice === null ? '选一个答案，看看你能不能赢过对手' : reveal ? '下一题马上开始' : '等待对手作答…'}
                </div>
              </div>
            </div>

            <div className="bg-white/14 border border-white/18 backdrop-blur-xl rounded-3xl p-5 text-white">
              <div className="flex items-center justify-between">
                <div className="font-extrabold">对手</div>
                <div className="text-white/80 text-xs">连胜 {aiStreak}</div>
              </div>
              <div className="mt-3 text-3xl font-extrabold">{aiScore}</div>
              <div className="mt-2 text-white/80 text-xs">答对 {aiCorrect}</div>
              <div className="mt-4 text-white/70 text-xs">
                {aiChoice === null ? '思考中…' : reveal ? (aiChoice === q.answerIndex ? '这一题对手答对了' : '这一题对手答错了') : '已作答'}
              </div>
            </div>
          </div>
        </div>

        {effects.map((e) => (
          <div key={e.id} className="absolute inset-0 pointer-events-none">
            {e.type === 'confetti' && (
              <div
                className="absolute left-1/2 top-1/2"
                style={{
                  left: `${e.x}%`,
                  top: `${e.y}%`,
                  width: '260px',
                  height: '260px',
                  animation: 'fxConfetti 1200ms ease-out forwards',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {Array.from({ length: 18 }).map((_, i) => (
                  <span
                    key={i}
                    className="absolute"
                    style={{
                      left: '50%',
                      top: '50%',
                      width: `${6 + (i % 4)}px`,
                      height: `${10 + (i % 5)}px`,
                      borderRadius: '6px',
                      background: ['rgba(253,230,138,0.95)', 'rgba(167,139,250,0.95)', 'rgba(52,211,153,0.95)', 'rgba(56,189,248,0.95)'][i % 4],
                      transform: `translate(-50%, -50%) rotate(${i * 22}deg) translateY(${40 + (i % 6) * 10}px)`,
                      boxShadow: '0 12px 22px rgba(0,0,0,0.25)',
                      opacity: 0.95,
                    }}
                  />
                ))}
              </div>
            )}
            {e.type === 'rays' && (
              <div
                className="absolute"
                style={{
                  left: `${e.x}%`,
                  top: `${e.y}%`,
                  width: '320px',
                  height: '320px',
                  borderRadius: '999px',
                  background:
                    'conic-gradient(from 0deg, rgba(255,255,255,0) 0deg, rgba(253,230,138,0.55) 35deg, rgba(168,85,247,0.18) 70deg, rgba(255,255,255,0) 120deg)',
                  filter: 'blur(0.2px)',
                  mixBlendMode: 'screen',
                  animation: 'fxRays 1200ms ease-out forwards',
                }}
              />
            )}
            {e.type === 'stickers' && (
              <div
                className="absolute"
                style={{
                  left: `${e.x}%`,
                  top: `${e.y}%`,
                  width: '280px',
                  height: '180px',
                  animation: 'fxSticker 1400ms ease-out forwards',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {Array.from({ length: 8 }).map((_, i) => (
                  <span
                    key={i}
                    className="absolute"
                    style={{
                      left: `${18 + (i % 4) * 22}%`,
                      top: `${22 + Math.floor(i / 4) * 38}%`,
                      width: `${18 + (i % 3) * 6}px`,
                      height: `${18 + (i % 3) * 6}px`,
                      borderRadius: '999px',
                      background:
                        i % 2 === 0
                          ? 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), rgba(253,230,138,0.75))'
                          : 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), rgba(168,85,247,0.55))',
                      boxShadow: '0 18px 30px rgba(0,0,0,0.3)',
                      opacity: 0.95,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        {praises.map((p) => (
          <div
            key={p.id}
            className="absolute pointer-events-none select-none font-extrabold"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              transform: 'translate(-50%, -50%)',
              padding: '10px 18px',
              borderRadius: '999px',
              color: '#111827',
              fontSize: 'clamp(22px, 3.8vw, 52px)',
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(253,230,138,0.92), rgba(244,114,182,0.85))',
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
              letterSpacing: '0.02em',
              animation:
                p.style === 'pop'
                  ? 'praisePop 1500ms ease-out forwards'
                  : p.style === 'stamp'
                    ? 'praiseStamp 1500ms ease-out forwards'
                    : p.style === 'slideLeft'
                      ? 'praiseSlideLeft 1500ms ease-out forwards'
                      : p.style === 'slideRight'
                        ? 'praiseSlideRight 1500ms ease-out forwards'
                        : p.style === 'bounce'
                          ? 'praiseBounce 1700ms ease-out forwards'
                          : p.style === 'spin'
                            ? 'praiseSpin 1600ms ease-out forwards'
                            : p.style === 'wave'
                              ? 'praiseWave 1700ms ease-out forwards'
                              : p.style === 'type'
                                ? 'praiseType 1600ms ease-out forwards'
                                : p.style === 'glow'
                                  ? 'praiseGlow 1800ms ease-out forwards'
                                  : p.style === 'shake'
                                    ? 'praiseShake 1600ms ease-out forwards'
                                    : 'praisePop 1600ms ease-out forwards',
            }}
          >
            {p.text}
          </div>
        ))}
      </div>
    );
  };

  const PoetryPKResultOverlay: React.FC<{ result: NonNullable<typeof pkResult> }> = ({ result }) => {
    const win = result.userScore >= result.aiScore;
    const title = win ? '你赢啦' : '再来一次就更厉害了';
    return (
      <div className="fixed inset-0 z-[90] bg-gradient-to-br from-orange-600 via-pink-600 to-purple-700">
        <style>{`
          @keyframes pkResultPop { 0% { transform: translateY(18px) scale(0.96); opacity: 0; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
          @keyframes pkGlow { 0% { opacity: 0.5; transform: scale(0.98); } 100% { opacity: 0.95; transform: scale(1.06); } }
        `}</style>

        <button
          className="absolute top-4 right-4 z-30 w-10 h-10 rounded-2xl bg-white/15 border border-white/15 text-white hover:bg-white/20 transition-colors flex items-center justify-center"
          onClick={closeOverlay}
          aria-label="关闭"
        >
          <X size={18} />
        </button>

        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div
            className="w-[560px] h-[560px] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.12) 40%, rgba(255,255,255,0) 72%)',
              animation: 'pkGlow 1200ms ease-in-out infinite alternate',
            }}
          />
        </div>

        <div className="relative h-full flex items-center justify-center p-6">
          <div className="w-full max-w-2xl bg-white/14 border border-white/18 backdrop-blur-xl rounded-3xl shadow-2xl p-8" style={{ animation: 'pkResultPop 520ms ease-out forwards' }}>
            <div className="text-center text-white">
              <div className="text-sm text-white/80 font-bold">诗词PK结算</div>
              <div className="text-4xl font-extrabold mt-2">{title}</div>
              <div className="mt-4 text-white/85 text-sm">我方 {result.userScore} · 对手 {result.aiScore}</div>
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
              {Array.from({ length: 10 }).map((_, idx) => {
                const active = idx < result.stars;
                return (
                  <Star
                    key={idx}
                    size={30}
                    className={`${active ? 'text-yellow-200' : 'text-white/35'}`}
                    fill={active ? 'currentColor' : 'transparent'}
                    strokeWidth={2}
                  />
                );
              })}
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
              <div className="bg-white/12 border border-white/15 rounded-2xl p-4">
                <div className="text-xs text-white/75 font-bold">我方答对</div>
                <div className="text-2xl font-extrabold mt-1">{result.userCorrect} / {result.rounds}</div>
              </div>
              <div className="bg-white/12 border border-white/15 rounded-2xl p-4">
                <div className="text-xs text-white/75 font-bold">对手答对</div>
                <div className="text-2xl font-extrabold mt-1">{result.aiCorrect} / {result.rounds}</div>
              </div>
              <div className="bg-white/12 border border-white/15 rounded-2xl p-4">
                <div className="text-xs text-white/75 font-bold">星级评分</div>
                <div className="text-2xl font-extrabold mt-1">{result.stars} / 10</div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                className="px-6 h-12 rounded-full bg-white/18 border border-white/18 text-white font-extrabold hover:bg-white/22 transition-colors"
                onClick={() => {
                  setPkResult(null);
                  setPkSeed((s) => s + 1);
                  setMode('pk-select');
                }}
              >
                再来一局
              </button>
              <button
                className="px-6 h-12 rounded-full bg-white text-purple-700 font-extrabold hover:brightness-105 transition-all"
                onClick={closeOverlay}
              >
                返回游戏大厅
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  type RiddleDifficulty = 'easy' | 'normal' | 'hard';
  type RiddleToken = { key: string; label: string; Icon: React.ComponentType<{ size?: number; className?: string }>; tone: 'warm' | 'cool' | 'nature' | 'night' };
  type RiddleQuestion = {
    id: number;
    title: string;
    author: string;
    line: string;
    options: string[];
    answerIndex: number;
    tokens: RiddleToken[];
    hints: Array<{ title: string; text: string }>;
  };

  const buildRiddleQuestions = (count: number, seed: number, difficulty: RiddleDifficulty): RiddleQuestion[] => {
    const rng = (() => {
      let s = seed + 77;
      return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
      };
    })();

    const strip = (s: string) => s.replace(/[，。！？；：、“”‘’（）()《》〈〉…·—\s]/g, '');
    const allLines: Array<{ title: string; author: string; line: string }> = [];
    for (const poem of poemEntries) {
      for (const line of poem.lines || []) {
        const cleaned = strip(line);
        if (cleaned.length >= 4) allLines.push({ title: poem.title, author: poem.author, line });
      }
    }

    const tokenByKeyword: Array<{ k: string; token: RiddleToken }> = [
      { k: '月', token: { key: 'moon', label: '月', Icon: Moon, tone: 'night' } },
      { k: '夜', token: { key: 'night', label: '夜', Icon: Sparkles, tone: 'night' } },
      { k: '星', token: { key: 'stars', label: '星', Icon: Sparkles, tone: 'night' } },
      { k: '山', token: { key: 'mount', label: '山', Icon: Mountain, tone: 'nature' } },
      { k: '江', token: { key: 'river', label: '江', Icon: Waves, tone: 'cool' } },
      { k: '河', token: { key: 'river2', label: '河', Icon: Waves, tone: 'cool' } },
      { k: '水', token: { key: 'water', label: '水', Icon: Waves, tone: 'cool' } },
      { k: '云', token: { key: 'cloud', label: '云', Icon: Cloud, tone: 'cool' } },
      { k: '雨', token: { key: 'rain', label: '雨', Icon: CloudRain, tone: 'cool' } },
      { k: '雪', token: { key: 'snow', label: '雪', Icon: Snowflake, tone: 'cool' } },
      { k: '风', token: { key: 'wind', label: '风', Icon: Wind, tone: 'cool' } },
      { k: '花', token: { key: 'flower', label: '花', Icon: Flower2, tone: 'warm' } },
      { k: '春', token: { key: 'spring', label: '春', Icon: Sprout, tone: 'nature' } },
      { k: '柳', token: { key: 'willow', label: '柳', Icon: Leaf, tone: 'nature' } },
      { k: '草', token: { key: 'grass', label: '草', Icon: Sprout, tone: 'nature' } },
      { k: '竹', token: { key: 'bamboo', label: '竹', Icon: Trees, tone: 'nature' } },
      { k: '鸟', token: { key: 'bird', label: '鸟', Icon: Bird, tone: 'nature' } },
      { k: '日', token: { key: 'sun', label: '日', Icon: Sun, tone: 'warm' } },
      { k: '霞', token: { key: 'rainbow', label: '霞', Icon: Rainbow, tone: 'warm' } },
      { k: '舟', token: { key: 'boat', label: '舟', Icon: Ship, tone: 'cool' } },
      { k: '船', token: { key: 'ship', label: '船', Icon: Ship, tone: 'cool' } },
      { k: '灯', token: { key: 'flame', label: '灯', Icon: Flame, tone: 'warm' } },
      { k: '火', token: { key: 'fire', label: '火', Icon: Flame, tone: 'warm' } },
    ];

    const tokensForLine = (line: string) => {
      const found: RiddleToken[] = [];
      for (const { k, token } of tokenByKeyword) {
        if (line.includes(k) && !found.find((t) => t.key === token.key)) found.push(token);
      }
      if (found.length === 0) return [];
      if (difficulty === 'easy') return found.slice(0, 5);
      if (difficulty === 'normal') return found.slice(0, 4);
      return found.slice(0, 3);
    };

    const scoreKeywords = (line: string) => {
      let s = 0;
      for (const { k } of tokenByKeyword) if (line.includes(k)) s += 1;
      return s;
    };

    const pickDistractors = (answer: { title: string; author: string; line: string }, optionsCount: number) => {
      const ansScore = scoreKeywords(answer.line);
      const pool = allLines.filter((x) => x.line !== answer.line);
      const scored = pool
        .map((x) => ({ x, d: Math.abs(scoreKeywords(x.line) - ansScore), k: scoreKeywords(x.line) }))
        .sort((a, b) => a.d - b.d || b.k - a.k);
      const picks: string[] = [];
      const start = difficulty === 'hard' ? 0 : difficulty === 'normal' ? 25 : 80;
      const window = difficulty === 'hard' ? 140 : difficulty === 'normal' ? 220 : 360;
      let tries = 0;
      while (picks.length < optionsCount && tries < 400) {
        tries += 1;
        const cand = scored[Math.floor(start + rng() * Math.min(window, scored.length - start))]?.x?.line;
        if (!cand) continue;
        if (cand === answer.line) continue;
        if (picks.includes(cand)) continue;
        picks.push(cand);
      }
      return picks;
    };

    const makeHints = (title: string, author: string, line: string, tokens: RiddleToken[]) => {
      const cleaned = strip(line);
      const first = cleaned.slice(0, 1);
      const last = cleaned.slice(-1);
      const imagery = tokens.map((t) => t.label).slice(0, 4).join('、');
      const hints = [
        { title: '灯笼提示', text: `诗名：${title}` },
        { title: '作者提示', text: `作者：${author}` },
        { title: '字形提示', text: `首字是“${first}”，末字是“${last}”` },
        { title: '意象提示', text: imagery ? `画面里藏着：${imagery}` : '画面里藏着几个小线索' },
      ];
      if (difficulty === 'easy') return hints.slice(0, 3);
      if (difficulty === 'normal') return hints.slice(1, 4);
      return hints.slice(2, 4);
    };

    const questions: RiddleQuestion[] = [];
    let tries = 0;
    while (questions.length < count && tries < count * 120) {
      tries += 1;
      const pick = allLines[Math.floor(rng() * allLines.length)];
      const tokens = tokensForLine(pick.line);
      if (tokens.length === 0) continue;
      const distractors = pickDistractors(pick, 3);
      if (distractors.length < 3) continue;
      const options = [pick.line, ...distractors];
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }
      const answerIndex = options.indexOf(pick.line);
      if (answerIndex < 0) continue;
      questions.push({
        id: Date.now() + questions.length + Math.floor(rng() * 10000),
        title: pick.title,
        author: pick.author,
        line: pick.line,
        options,
        answerIndex,
        tokens,
        hints: makeHints(pick.title, pick.author, pick.line, tokens),
      });
    }
    return questions;
  };

  const RiddleOverlay: React.FC<{ difficulty: RiddleDifficulty; seed: number }> = ({ difficulty, seed }) => {
    const rounds = 10;
    const timePerQ = difficulty === 'easy' ? 12_000 : difficulty === 'normal' ? 10_000 : 8_000;
    const [questions] = useState<RiddleQuestion[]>(() => buildRiddleQuestions(rounds, seed, difficulty));
    const [idx, setIdx] = useState(0);
    const [choice, setChoice] = useState<number | null>(null);
    const [reveal, setReveal] = useState(false);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [correct, setCorrect] = useState(0);
    const [msLeft, setMsLeft] = useState(timePerQ);
    const [hintOpen, setHintOpen] = useState<number | null>(null);
    const [hintUsed, setHintUsed] = useState(0);
    const [praises, setPraises] = useState<Array<{ id: number; text: string; style: (typeof praiseStyles)[number]; x: number; y: number }>>([]);
    const [effects, setEffects] = useState<Array<{ id: number; type: 'confetti' | 'rays' | 'stickers'; x: number; y: number }>>([]);
    const startAtRef = useRef(performance.now());
    const scoreRef = useRef(0);
    const correctRef = useRef(0);
    useEffect(() => { scoreRef.current = score; }, [score]);
    useEffect(() => { correctRef.current = correct; }, [correct]);
    const q = questions[idx];

    useEffect(() => {
      if (!q) {
        closeOverlay();
        return;
      }
      startAtRef.current = performance.now();
      setMsLeft(timePerQ);
      setChoice(null);
      setReveal(false);
      setHintOpen(null);
      const t = window.setInterval(() => {
        const left = Math.max(0, timePerQ - (performance.now() - startAtRef.current));
        setMsLeft(left);
      }, 80);
      return () => window.clearInterval(t);
    }, [idx]);

    useEffect(() => {
      if (msLeft > 0) return;
      if (choice === null) setChoice(-1);
    }, [msLeft, choice]);

    const spawnGood = () => {
      const phrase = praisePhrases[Math.floor(Math.random() * praisePhrases.length)];
      const style = praiseStyles[Math.floor(Math.random() * praiseStyles.length)];
      const x = 50 + (Math.random() * 28 - 14);
      const y = 44 + (Math.random() * 26 - 13);
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setPraises((prev) => [...prev, { id, text: phrase, style, x, y }].slice(-16));
      const effId = id + 7;
      const effType: 'confetti' | 'rays' | 'stickers' =
        Math.random() < 0.34 ? 'confetti' : Math.random() < 0.67 ? 'rays' : 'stickers';
      setEffects((prev) => [...prev, { id: effId, type: effType, x, y }].slice(-10));
      window.setTimeout(() => setPraises((prev) => prev.filter((p) => p.id !== id)), 2600);
      window.setTimeout(() => setEffects((prev) => prev.filter((e) => e.id !== effId)), 1700);
    };

    const settle = (picked: number) => {
      if (reveal) return;
      setReveal(true);
      const ok = picked === q.answerIndex;
      if (ok) {
        const secLeft = Math.ceil(msLeft / 1000);
        const nextStreak = streak + 1;
        setStreak(nextStreak);
        const add = 110 + secLeft * 10 + nextStreak * 12 - hintUsed * 10;
        setCorrect((c) => {
          const next = c + 1;
          correctRef.current = next;
          return next;
        });
        setScore((s) => {
          const next = s + add;
          scoreRef.current = next;
          return next;
        });
        spawnGood();
      } else {
        setStreak(0);
      }

      window.setTimeout(() => {
        if (idx + 1 >= rounds) {
          const acc = correctRef.current / rounds;
          const stars = clamp(Math.round(acc * 7 + (acc > 0.8 ? 3 : acc > 0.6 ? 2 : 1)), 0, 10);
          setRiddleResult({ score: scoreRef.current, correct: correctRef.current, rounds, stars });
          setMode('riddle-result');
          return;
        }
        setIdx((v) => v + 1);
      }, 900);
    };

    useEffect(() => {
      if (choice === null) return;
      if (choice === -1) settle(-1);
    }, [choice]);

    const answer = (i: number) => {
      if (choice !== null) return;
      setChoice(i);
      settle(i);
    };

    const ringDash = 2 * Math.PI * 20;
    const timerPercent = clamp(msLeft / timePerQ, 0, 1);
    const ringOffset = ringDash * (1 - timerPercent);

    const toneBg = (tone: RiddleToken['tone']) => {
      if (tone === 'night') return 'from-[#1f2a6a] via-[#7c3aed] to-[#fb7185]';
      if (tone === 'cool') return 'from-[#0ea5e9] via-[#22c55e] to-[#a78bfa]';
      if (tone === 'nature') return 'from-[#22c55e] via-[#34d399] to-[#60a5fa]';
      return 'from-[#fb923c] via-[#f472b6] to-[#fde047]';
    };

    const primaryTone = q.tokens[0]?.tone || 'warm';
    const lanternBg = toneBg(primaryTone);

    return (
      <div className={`fixed inset-0 z-[85] bg-gradient-to-br ${lanternBg} overflow-hidden`}>
        <style>{`
          @keyframes lanternSwing { 0% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } 100% { transform: rotate(-2deg); } }
          @keyframes lanternGlow { 0% { opacity: 0.65; } 50% { opacity: 1; } 100% { opacity: 0.7; } }
          @keyframes hintPop { 0% { transform: translateY(8px) scale(0.98); opacity: 0; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
          @keyframes tokenFloat { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
          @keyframes fxConfetti { 0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; } 20% { opacity: 1; } 100% { transform: translate(-50%, -60%) scale(1.25); opacity: 0; } }
          @keyframes fxRays { 0% { transform: translate(-50%, -50%) rotate(0deg) scale(0.8); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate(-50%, -50%) rotate(40deg) scale(1.25); opacity: 0; } }
          @keyframes fxSticker { 0% { transform: translate(-50%, -50%) scale(0.6) rotate(-10deg); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate(-50%, -60%) scale(1.15) rotate(8deg); opacity: 0; } }
          @keyframes praisePop { 0% { transform: translate(-50%, -50%) scale(0.65); opacity: 0; } 20% { opacity: 1; } 100% { transform: translate(-50%, -60%) scale(1.06); opacity: 0; } }
          @keyframes praiseStamp { 0% { transform: translate(-50%, -50%) scale(1.6) rotate(-6deg); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate(-50%, -52%) scale(1) rotate(0deg); opacity: 0; } }
          @keyframes praiseSlideLeft { 0% { transform: translate(-20%, -50%); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate(-60%, -55%); opacity: 0; } }
          @keyframes praiseSlideRight { 0% { transform: translate(-80%, -50%); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate(-40%, -55%); opacity: 0; } }
          @keyframes praiseBounce { 0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0; } 25% { opacity: 1; transform: translate(-50%, -55%) scale(1.12); } 45% { transform: translate(-50%, -48%) scale(0.98); } 100% { transform: translate(-50%, -60%) scale(1.02); opacity: 0; } }
          @keyframes praiseSpin { 0% { transform: translate(-50%, -50%) rotate(-20deg) scale(0.85); opacity: 0; } 25% { opacity: 1; } 100% { transform: translate(-50%, -60%) rotate(12deg) scale(1.05); opacity: 0; } }
          @keyframes praiseWave { 0% { transform: translate(-50%, -50%) rotate(-2deg) scale(0.9); opacity: 0; } 30% { opacity: 1; } 60% { transform: translate(-50%, -52%) rotate(2deg) scale(1.05); } 100% { transform: translate(-50%, -60%) rotate(0deg) scale(1.02); opacity: 0; } }
          @keyframes praiseType { 0% { clip-path: inset(0 100% 0 0); opacity: 1; } 60% { clip-path: inset(0 0% 0 0); opacity: 1; } 100% { clip-path: inset(0 0% 0 0); opacity: 0; } }
          @keyframes praiseGlow { 0% { transform: translate(-50%, -50%) scale(0.92); opacity: 0; filter: drop-shadow(0 0 0 rgba(255,255,255,0)); } 30% { opacity: 1; } 100% { transform: translate(-50%, -60%) scale(1.02); opacity: 0; filter: drop-shadow(0 18px 28px rgba(0,0,0,0.35)) drop-shadow(0 0 18px rgba(255,255,255,0.45)); } }
          @keyframes praiseShake { 0% { transform: translate(-50%, -50%) rotate(0deg); opacity: 0; } 25% { opacity: 1; } 35% { transform: translate(-50%, -50%) rotate(-2deg); } 55% { transform: translate(-50%, -50%) rotate(2deg); } 100% { transform: translate(-50%, -60%) rotate(0deg); opacity: 0; } }
        `}</style>

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${8 + i * 16}%`,
                top: `${i % 2 === 0 ? 0 : 6}%`,
                transformOrigin: 'top center',
                animation: `lanternSwing ${3.2 + (i % 3) * 0.8}s ease-in-out ${i * -0.6}s infinite`,
              }}
            >
              <div className="w-[2px] h-10 bg-white/35 mx-auto" />
              <div
                className="w-16 h-16 rounded-2xl border border-white/25 shadow-2xl"
                style={{
                  background:
                    'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.65), rgba(253,230,138,0.45) 38%, rgba(244,114,182,0.25) 70%, rgba(0,0,0,0) 100%)',
                  animation: `lanternGlow ${1.8 + (i % 4) * 0.6}s ease-in-out ${i * -0.4}s infinite`,
                }}
              />
            </div>
          ))}
        </div>

        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-30">
          <div className="text-white">
            <div className="font-extrabold text-xl flex items-center gap-2">
              <HelpCircle size={18} />
              猜灯谜
            </div>
            <div className="text-white/80 text-xs">第 {idx + 1} / {rounds} 题 · 连对 {streak}</div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12">
              <svg width="48" height="48" viewBox="0 0 48 48" className="absolute inset-0">
                <circle cx="24" cy="24" r="20" stroke="rgba(255,255,255,0.22)" strokeWidth="5" fill="none" />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="rgba(253,230,138,0.95)"
                  strokeWidth="5"
                  fill="none"
                  strokeDasharray={ringDash}
                  strokeDashoffset={ringOffset}
                  strokeLinecap="round"
                  transform="rotate(-90 24 24)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-white font-extrabold">
                {Math.ceil(msLeft / 1000)}
              </div>
            </div>
            <button
              className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 text-white hover:bg-white/15 transition-colors flex items-center justify-center"
              onClick={closeOverlay}
              aria-label="关闭"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="absolute inset-0 pt-20 md:pt-24 pb-4 px-4 md:px-6 overflow-hidden">
          <div className="w-full h-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5 min-h-0">
            <div className="lg:col-span-7 bg-white/14 border border-white/18 backdrop-blur-xl rounded-3xl p-4 md:p-6 text-white min-h-0 flex flex-col">
              <div className="flex items-center justify-between">
                <div className="text-white/85 text-sm font-bold">看图猜诗句</div>
                <div className="text-white/75 text-xs">提示已用 {hintUsed}</div>
              </div>

              <div className="mt-3 flex-1 min-h-0 flex items-center justify-center">
                <div className="relative w-full" style={{ width: 'min(520px, 92vw)', height: 'min(42vh, 360px)' }}>
                  <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[2px] h-10 bg-white/40" />
                  <div
                    className="absolute left-1/2 top-8 -translate-x-1/2 rounded-[56px] border border-white/20 shadow-2xl overflow-hidden"
                    style={{ width: 'clamp(240px, 54vw, 380px)', height: 'clamp(240px, 34vh, 360px)' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-white/5 to-black/10" />
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          primaryTone === 'night'
                            ? 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.20), rgba(30,41,59,0.12) 45%, rgba(0,0,0,0.22) 80%)'
                            : primaryTone === 'cool'
                              ? 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.20), rgba(14,165,233,0.12) 45%, rgba(0,0,0,0.18) 80%)'
                              : primaryTone === 'nature'
                                ? 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.20), rgba(34,197,94,0.12) 45%, rgba(0,0,0,0.18) 80%)'
                                : 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.20), rgba(251,146,60,0.14) 45%, rgba(0,0,0,0.18) 80%)',
                      }}
                    />
                    {q.tokens.map((t, i) => {
                      const pos = [
                        { x: 28, y: 30 },
                        { x: 72, y: 28 },
                        { x: 30, y: 70 },
                        { x: 70, y: 72 },
                        { x: 50, y: 52 },
                      ][i] || { x: 50, y: 50 };
                      return (
                        <div
                          key={t.key}
                          className="absolute flex flex-col items-center"
                          style={{
                            left: `${pos.x}%`,
                            top: `${pos.y}%`,
                            transform: 'translate(-50%, -50%)',
                            animation: `tokenFloat ${2.6 + i * 0.4}s ease-in-out ${i * -0.6}s infinite`,
                          }}
                        >
                          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/14 border border-white/18 flex items-center justify-center shadow-2xl">
                            <t.Icon size={26} className="text-white" />
                          </div>
                          <div className="mt-2 text-xs font-bold text-white/85">{t.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                {q.hints.map((h, i) => (
                  <button
                    key={i}
                    className="px-4 h-10 rounded-full bg-white/12 border border-white/18 text-white font-extrabold hover:bg-white/18 transition-colors"
                    onClick={() => {
                      setHintOpen(i);
                      setHintUsed((v) => (v < 3 ? v + 1 : v));
                    }}
                    disabled={hintUsed >= 3}
                  >
                    {h.title}
                  </button>
                ))}
                <button
                  className="px-4 h-10 rounded-full bg-white text-gray-900 font-extrabold hover:brightness-105 transition-all"
                  onClick={() => setHintOpen(999)}
                >
                  揭晓
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white/14 border border-white/18 backdrop-blur-xl rounded-3xl p-4 md:p-6 text-white min-h-0 flex flex-col">
              <div className="flex items-center justify-between">
                <div className="text-white/85 text-sm font-bold">选择正确诗句</div>
                <div className="text-white/75 text-xs">得分 {score}</div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 flex-1 min-h-0">
                {q.options.map((op, i) => {
                  const correctIdx = q.answerIndex;
                  const isCorrect = i === correctIdx;
                  const picked = choice === i;
                  const base =
                    reveal && isCorrect
                      ? 'bg-emerald-400/85 border-emerald-200'
                      : reveal && picked && !isCorrect
                        ? 'bg-rose-500/80 border-rose-200'
                        : 'bg-white/12 border-white/18 hover:bg-white/18';
                  return (
                    <button
                      key={i}
                      onClick={() => answer(i)}
                      disabled={choice !== null}
                      className={`rounded-2xl px-4 py-3 border text-white font-extrabold transition-all text-left ${base}`}
                      style={{ fontSize: 'clamp(14px, 1.8vw, 20px)' }}
                    >
                      {op}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {(hintOpen !== null) && (
          <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
            <button className="absolute inset-0 bg-black/60" onClick={() => setHintOpen(null)} aria-label="关闭提示" />
            <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden" style={{ animation: 'hintPop 220ms ease-out forwards' }}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="font-extrabold text-gray-800">提示</div>
                <button className="w-10 h-10 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center" onClick={() => setHintOpen(null)}>
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 text-gray-700">
                {hintOpen === 999 ? (
                  <div>
                    <div className="font-extrabold text-lg">{q.title} · {q.author}</div>
                    <div className="mt-3 text-xl font-extrabold">{q.line}</div>
                  </div>
                ) : (
                  <div>
                    <div className="font-extrabold text-lg">{q.hints[hintOpen]?.title}</div>
                    <div className="mt-3 text-lg">{q.hints[hintOpen]?.text}</div>
                  </div>
                )}
              </div>
              <div className="px-6 pb-6">
                <button className="w-full h-12 rounded-full bg-purple-600 text-white font-extrabold hover:brightness-110 transition-all" onClick={() => setHintOpen(null)}>
                  我知道啦
                </button>
              </div>
            </div>
          </div>
        )}

        {effects.map((e) => (
          <div key={e.id} className="absolute inset-0 pointer-events-none">
            {e.type === 'confetti' && (
              <div className="absolute left-1/2 top-1/2" style={{ left: `${e.x}%`, top: `${e.y}%`, width: '260px', height: '260px', animation: 'fxConfetti 1200ms ease-out forwards', transform: 'translate(-50%, -50%)' }}>
                {Array.from({ length: 18 }).map((_, i) => (
                  <span key={i} className="absolute" style={{ left: '50%', top: '50%', width: `${6 + (i % 4)}px`, height: `${10 + (i % 5)}px`, borderRadius: '6px', background: ['rgba(253,230,138,0.95)', 'rgba(167,139,250,0.95)', 'rgba(52,211,153,0.95)', 'rgba(56,189,248,0.95)'][i % 4], transform: `translate(-50%, -50%) rotate(${i * 22}deg) translateY(${40 + (i % 6) * 10}px)`, boxShadow: '0 12px 22px rgba(0,0,0,0.25)', opacity: 0.95 }} />
                ))}
              </div>
            )}
            {e.type === 'rays' && (
              <div className="absolute" style={{ left: `${e.x}%`, top: `${e.y}%`, width: '320px', height: '320px', borderRadius: '999px', background: 'conic-gradient(from 0deg, rgba(255,255,255,0) 0deg, rgba(253,230,138,0.55) 35deg, rgba(168,85,247,0.18) 70deg, rgba(255,255,255,0) 120deg)', filter: 'blur(0.2px)', mixBlendMode: 'screen', animation: 'fxRays 1200ms ease-out forwards' }} />
            )}
            {e.type === 'stickers' && (
              <div className="absolute" style={{ left: `${e.x}%`, top: `${e.y}%`, width: '280px', height: '180px', animation: 'fxSticker 1400ms ease-out forwards', transform: 'translate(-50%, -50%)' }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <span key={i} className="absolute" style={{ left: `${18 + (i % 4) * 22}%`, top: `${22 + Math.floor(i / 4) * 38}%`, width: `${18 + (i % 3) * 6}px`, height: `${18 + (i % 3) * 6}px`, borderRadius: '999px', background: i % 2 === 0 ? 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), rgba(253,230,138,0.75))' : 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), rgba(168,85,247,0.55))', boxShadow: '0 18px 30px rgba(0,0,0,0.3)', opacity: 0.95 }} />
                ))}
              </div>
            )}
          </div>
        ))}

        {praises.map((p) => (
          <div
            key={p.id}
            className="absolute pointer-events-none select-none font-extrabold"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              transform: 'translate(-50%, -50%)',
              padding: '10px 18px',
              borderRadius: '999px',
              color: '#111827',
              fontSize: 'clamp(22px, 3.8vw, 54px)',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(253,230,138,0.92), rgba(244,114,182,0.85))',
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
              letterSpacing: '0.02em',
              animation:
                p.style === 'pop'
                  ? 'praisePop 1500ms ease-out forwards'
                  : p.style === 'stamp'
                    ? 'praiseStamp 1500ms ease-out forwards'
                    : p.style === 'slideLeft'
                      ? 'praiseSlideLeft 1500ms ease-out forwards'
                      : p.style === 'slideRight'
                        ? 'praiseSlideRight 1500ms ease-out forwards'
                        : p.style === 'bounce'
                          ? 'praiseBounce 1700ms ease-out forwards'
                          : p.style === 'spin'
                            ? 'praiseSpin 1600ms ease-out forwards'
                            : p.style === 'wave'
                              ? 'praiseWave 1700ms ease-out forwards'
                              : p.style === 'type'
                                ? 'praiseType 1600ms ease-out forwards'
                                : p.style === 'glow'
                                  ? 'praiseGlow 1800ms ease-out forwards'
                                  : p.style === 'shake'
                                    ? 'praiseShake 1600ms ease-out forwards'
                                    : 'praisePop 1600ms ease-out forwards',
            }}
          >
            {p.text}
          </div>
        ))}
      </div>
    );
  };

  const RiddleResultOverlay: React.FC<{ result: NonNullable<typeof riddleResult> }> = ({ result }) => {
    return (
      <div className="fixed inset-0 z-[90] bg-gradient-to-br from-emerald-600 via-sky-600 to-purple-700">
        <style>{`
          @keyframes rPop { 0% { transform: translateY(18px) scale(0.96); opacity: 0; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
          @keyframes rGlow { 0% { opacity: 0.5; transform: scale(0.98); } 100% { opacity: 0.95; transform: scale(1.06); } }
        `}</style>
        <button
          className="absolute top-4 right-4 z-30 w-10 h-10 rounded-2xl bg-white/15 border border-white/15 text-white hover:bg-white/20 transition-colors flex items-center justify-center"
          onClick={closeOverlay}
          aria-label="关闭"
        >
          <X size={18} />
        </button>
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div
            className="w-[560px] h-[560px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.12) 40%, rgba(255,255,255,0) 72%)',
              animation: 'rGlow 1200ms ease-in-out infinite alternate',
            }}
          />
        </div>
        <div className="relative h-full flex items-center justify-center p-6">
          <div className="w-full max-w-2xl bg-white/14 border border-white/18 backdrop-blur-xl rounded-3xl shadow-2xl p-8" style={{ animation: 'rPop 520ms ease-out forwards' }}>
            <div className="text-center text-white">
              <div className="text-sm text-white/80 font-bold">猜灯谜结算</div>
              <div className="text-4xl font-extrabold mt-2">灯谜小达人</div>
              <div className="mt-4 text-white/85 text-sm">得分 {result.score} · 答对 {result.correct} / {result.rounds}</div>
            </div>
            <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
              {Array.from({ length: 10 }).map((_, idx) => {
                const active = idx < result.stars;
                return (
                  <Star
                    key={idx}
                    size={30}
                    className={`${active ? 'text-yellow-200' : 'text-white/35'}`}
                    fill={active ? 'currentColor' : 'transparent'}
                    strokeWidth={2}
                  />
                );
              })}
            </div>
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                className="px-6 h-12 rounded-full bg-white/18 border border-white/18 text-white font-extrabold hover:bg-white/22 transition-colors"
                onClick={() => {
                  setRiddleResult(null);
                  setRiddleSeed((s) => s + 1);
                  setMode('riddle-select');
                }}
              >
                再来一局
              </button>
              <button
                className="px-6 h-12 rounded-full bg-white text-purple-700 font-extrabold hover:brightness-105 transition-all"
                onClick={closeOverlay}
              >
                返回游戏大厅
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (mode !== 'dance') return;
    if (danceCountdown === null) return;
    if (danceCountdown <= 0) return;
    const timer = window.setTimeout(() => setDanceCountdown((v) => (v === null ? v : v - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [mode, danceCountdown]);

  return (
    <div className="space-y-8">
       <div className="flex items-center gap-3 mb-6">
           <div className="p-3 bg-yellow-400 rounded-xl text-white shadow-lg shadow-yellow-400/30">
                <Gamepad2 size={32} />
           </div>
           <div>
               <h1 className="text-3xl font-bold text-gray-800">{t.menu_games}</h1>
               <p className="text-gray-500">寓教于乐，在游戏中学习诗词！</p>
           </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {games.map(game => (
               <div key={game.id} className="bg-white rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 flex flex-col h-full">
                   <div className={`w-16 h-16 rounded-2xl ${game.color} flex items-center justify-center mb-6`}>
                       <game.icon size={32} />
                   </div>
                   
                   <h3 className="text-xl font-bold text-gray-800 mb-2">{game.title}</h3>
                   <p className="text-gray-500 mb-4 flex-1">{game.desc}</p>
                   
                   <div className="flex items-center justify-between mt-4">
                       <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">难度: {game.difficulty}</span>
                       <button
                         className={`${game.btnColor} text-white px-6 py-2 rounded-full font-bold shadow-lg hover:brightness-110 transition-all`}
                         onClick={() => {
                           if (game.id === 'dance') startDanceSelect();
                           if (game.id === 'pk') startPkSelect();
                          if (game.id === 'riddle') startRiddleSelect();
                         }}
                       >
                           开始
                       </button>
                   </div>
               </div>
           ))}
       </div>

       <div className="mt-12 bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
                <Trophy className="text-yellow-500" />
                <h2 className="text-2xl font-bold text-gray-800">本周排行榜</h2>
            </div>

            {auth.userId && !auth.isGuest ? (
              <div className="mb-5 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/15 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="font-extrabold text-gray-800">我的排名：{leaderboard.myRank ? `#${leaderboard.myRank}` : '—'}</div>
                <div className="flex items-center gap-2 font-extrabold text-primary">
                  <Star size={18} className="text-yellow-500" fill="currentColor" />
                  本周获得 {leaderboard.myStars} 星
                </div>
              </div>
            ) : (
              <div className="mb-5 bg-gray-50 border border-gray-100 rounded-2xl p-4 text-gray-600 font-bold">
                登录后会显示你的本周排行与星数。
              </div>
            )}
            
            <div className="space-y-4">
                {leaderboard.list.map((user, idx) => (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-4 rounded-xl transition-colors border ${
                      user.isMe ? 'bg-primary/10 border-primary/20' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span
                        className={`font-bold text-xl w-8 text-center ${
                          idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-orange-600' : 'text-gray-400'
                        }`}
                      >
                        #{user.rank}
                      </span>
                      <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                      <span className={`font-bold truncate ${user.isMe ? 'text-primary' : 'text-gray-700'}`}>{user.name}</span>
                    </div>
                    <span className="font-mono font-bold text-primary flex items-center gap-2">
                      <Star size={16} className="text-yellow-500" fill="currentColor" />
                      {user.stars} 星
                    </span>
                  </div>
                ))}
            </div>
       </div>

       {mode === 'dance-select' && (
         <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
           <button className="absolute inset-0 bg-black/50" onClick={closeOverlay} aria-label="关闭" />
           <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden">
             <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                   <Music size={18} />
                 </div>
                 <div>
                   <h2 className="font-bold text-gray-800 text-lg">选择跟跳课程</h2>
                   <p className="text-xs text-gray-500">选一个视频，我们马上开始舞动</p>
                 </div>
               </div>
               <button
                 className="w-10 h-10 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center"
                 onClick={closeOverlay}
                 aria-label="关闭"
               >
                 <X size={18} />
               </button>
             </div>
             <div className="p-6 space-y-5">
               <div className="flex flex-col md:flex-row md:items-center gap-3">
                 <input
                   value={danceSearch}
                   onChange={(e) => setDanceSearch(e.target.value)}
                   placeholder="搜索诗名或作者..."
                   className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                 />
                 <div className="text-sm text-gray-500">共 {danceCourses.length} 个课程</div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-h-[60vh] overflow-auto pr-1">
                 {danceCourses.map((c) => (
                   <button
                     key={c.id}
                     className="text-left bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100 rounded-3xl overflow-hidden shadow-sm"
                     onClick={() => startDance(c)}
                   >
                     <div className="relative">
                       <img src={c.coverUrl} alt={c.title} className="w-full h-40 object-cover" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-transparent" />
                       <div className="absolute bottom-3 left-3 right-3 text-white">
                         <div className="font-extrabold text-lg line-clamp-1">{c.title}</div>
                         <div className="text-xs text-white/80 line-clamp-1">{c.author}</div>
                       </div>
                     </div>
                     <div className="px-4 py-4 flex items-center justify-between">
                       <div className="text-xs font-bold text-gray-500">{c.grade}年级</div>
                       <div className="px-4 py-2 rounded-full bg-purple-500 text-white font-extrabold text-sm shadow-lg shadow-purple-500/30">
                         开始跟跳
                       </div>
                     </div>
                   </button>
                 ))}
               </div>
             </div>
           </div>
         </div>
       )}

       {mode === 'pk-select' && (
         <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
           <button className="absolute inset-0 bg-black/50" onClick={closeOverlay} aria-label="关闭" />
           <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden">
             <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                   <Swords size={18} />
                 </div>
                 <div>
                   <h2 className="font-bold text-gray-800 text-lg">诗词PK</h2>
                   <p className="text-xs text-gray-500">选难度，开始填空对战</p>
                 </div>
               </div>
               <button
                 className="w-10 h-10 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center"
                 onClick={closeOverlay}
                 aria-label="关闭"
               >
                 <X size={18} />
               </button>
             </div>

             <div className="p-6 space-y-5">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <button
                   className={`p-5 rounded-3xl border-2 text-left transition-all ${pkDifficulty === 'easy' ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-gray-200'}`}
                   onClick={() => setPkDifficulty('easy')}
                 >
                   <div className="font-extrabold text-gray-800 text-lg">轻松</div>
                   <div className="text-sm text-gray-500 mt-1">对手慢一点，适合热身</div>
                   <div className="mt-3 text-xs font-bold text-gray-400 bg-gray-100 inline-flex px-2 py-1 rounded">难度：⭐⭐</div>
                 </button>
                 <button
                   className={`p-5 rounded-3xl border-2 text-left transition-all ${pkDifficulty === 'normal' ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-gray-200'}`}
                   onClick={() => setPkDifficulty('normal')}
                 >
                   <div className="font-extrabold text-gray-800 text-lg">标准</div>
                   <div className="text-sm text-gray-500 mt-1">节奏刚刚好，推荐</div>
                   <div className="mt-3 text-xs font-bold text-gray-400 bg-gray-100 inline-flex px-2 py-1 rounded">难度：⭐⭐⭐</div>
                 </button>
                 <button
                   className={`p-5 rounded-3xl border-2 text-left transition-all ${pkDifficulty === 'hard' ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-gray-200'}`}
                   onClick={() => setPkDifficulty('hard')}
                 >
                   <div className="font-extrabold text-gray-800 text-lg">挑战</div>
                   <div className="text-sm text-gray-500 mt-1">对手更快更准</div>
                   <div className="mt-3 text-xs font-bold text-gray-400 bg-gray-100 inline-flex px-2 py-1 rounded">难度：⭐⭐⭐⭐</div>
                 </button>
               </div>

               <div className="bg-gray-50 border border-gray-100 rounded-3xl p-5 text-gray-600 text-sm">
                 玩法：每题把诗句里的空补上。你越快越准，分数越高。共 10 题。
               </div>

               <div className="flex items-center justify-end gap-3">
                 <button
                   className="px-6 h-12 rounded-full bg-gray-100 text-gray-700 font-extrabold hover:bg-gray-200 transition-colors"
                   onClick={closeOverlay}
                 >
                   取消
                 </button>
                 <button
                   className="px-6 h-12 rounded-full bg-orange-500 text-white font-extrabold shadow-lg hover:brightness-110 transition-all"
                   onClick={startPk}
                 >
                   开始对战
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

       {mode === 'riddle-select' && (
         <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
           <button className="absolute inset-0 bg-black/50" onClick={closeOverlay} aria-label="关闭" />
           <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden">
             <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center">
                   <HelpCircle size={18} />
                 </div>
                 <div>
                   <h2 className="font-bold text-gray-800 text-lg">猜灯谜</h2>
                   <p className="text-xs text-gray-500">看画面，猜出对应的诗句</p>
                 </div>
               </div>
               <button
                 className="w-10 h-10 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center"
                 onClick={closeOverlay}
                 aria-label="关闭"
               >
                 <X size={18} />
               </button>
             </div>

             <div className="p-6 space-y-5">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <button
                   className={`p-5 rounded-3xl border-2 text-left transition-all ${riddleDifficulty === 'easy' ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-gray-200'}`}
                   onClick={() => setRiddleDifficulty('easy')}
                 >
                   <div className="font-extrabold text-gray-800 text-lg">轻松</div>
                   <div className="text-sm text-gray-500 mt-1">图标多一点，时间更长</div>
                   <div className="mt-3 text-xs font-bold text-gray-400 bg-gray-100 inline-flex px-2 py-1 rounded">难度：⭐⭐</div>
                 </button>
                 <button
                   className={`p-5 rounded-3xl border-2 text-left transition-all ${riddleDifficulty === 'normal' ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-gray-200'}`}
                   onClick={() => setRiddleDifficulty('normal')}
                 >
                   <div className="font-extrabold text-gray-800 text-lg">标准</div>
                   <div className="text-sm text-gray-500 mt-1">节奏刚刚好，推荐</div>
                   <div className="mt-3 text-xs font-bold text-gray-400 bg-gray-100 inline-flex px-2 py-1 rounded">难度：⭐⭐⭐</div>
                 </button>
                 <button
                   className={`p-5 rounded-3xl border-2 text-left transition-all ${riddleDifficulty === 'hard' ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-gray-200'}`}
                   onClick={() => setRiddleDifficulty('hard')}
                 >
                   <div className="font-extrabold text-gray-800 text-lg">挑战</div>
                   <div className="text-sm text-gray-500 mt-1">图标更少，干扰更像</div>
                   <div className="mt-3 text-xs font-bold text-gray-400 bg-gray-100 inline-flex px-2 py-1 rounded">难度：⭐⭐⭐⭐</div>
                 </button>
               </div>

               <div className="bg-gray-50 border border-gray-100 rounded-3xl p-5 text-gray-600 text-sm">
                 玩法：看“灯笼画面”，从 4 个诗句里选出最符合的一句。答对有炫酷表扬。共 10 题。
               </div>

               <div className="flex items-center justify-end gap-3">
                 <button
                   className="px-6 h-12 rounded-full bg-gray-100 text-gray-700 font-extrabold hover:bg-gray-200 transition-colors"
                   onClick={closeOverlay}
                 >
                   取消
                 </button>
                 <button
                   className="px-6 h-12 rounded-full bg-green-500 text-white font-extrabold shadow-lg hover:brightness-110 transition-all"
                   onClick={startRiddle}
                 >
                   开始猜灯谜
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

       {mode === 'dance' && selectedCourse && <DanceOverlay course={selectedCourse} countdown={danceCountdown} />}
       {mode === 'dance-result' && selectedCourse && danceResult && (
         <DanceResultOverlay course={selectedCourse} result={danceResult} />
       )}
       {mode === 'pk' && <PoetryPKOverlay key={`${pkSeed}-${pkDifficulty}`} difficulty={pkDifficulty} seed={pkSeed} />}
       {mode === 'pk-result' && pkResult && <PoetryPKResultOverlay result={pkResult} />}
       {mode === 'riddle' && <RiddleOverlay key={`${riddleSeed}-${riddleDifficulty}`} difficulty={riddleDifficulty} seed={riddleSeed} />}
       {mode === 'riddle-result' && riddleResult && <RiddleResultOverlay result={riddleResult} />}
    </div>
  );
};
