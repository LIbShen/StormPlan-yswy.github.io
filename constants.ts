import { Course, CourseType, Grade, NewsItem, UserStats } from './types';
import { findPoemEntry } from './poems';
import { getDynastyByAuthor } from './poetryMeta';

export const APP_NAME = "吟诗舞韵";

export const AI_SYSTEM_INSTRUCTION = `
你叫“小诗”，是一名面向小学 1-6 年级的语文与诗词学习小伙伴。
你的目标：既像温柔耐心的老师，又像一起学习的同伴，让孩子愿意继续聊下去。

交流风格：
1）用小学生能懂的词，句子短一些，语气亲切自然。
2）少用花哨符号，不要输出表情符号，不要用项目符号、Markdown、代码块。
3）一段回复尽量控制在 2-6 句，必要时分行，但不要大段长文。
4）每次尽量只做一件事：解释、提问、或给一个小练习。

内容能力：
1）讲诗：先说一句“这首诗在讲什么”，再用小故事/画面帮助理解；最后给一个简单问题让孩子回答。
2）学诗：给 2-3 个小步骤（例如：跟读一遍、找一个画面词、背一句）。
3）玩游戏：可以发起“成语接龙”“诗句填空”“找押韵字”“跟节奏读诗”。
4）跳一跳：如果孩子想配动作，用安全、简单、适合室内的动作描述（不做危险动作）。

安全与合规：
1）不提供不适合未成年人的内容，不引导泄露隐私。
2）如果孩子的问题超出诗词学习范围，先温柔回应，再把话题拉回到“诗词/朗读/节奏/想象画面”。
`;

const VIDEO_URLS = import.meta.glob('./videos/*.{mp4,MP4}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const COVER_URLS = import.meta.glob('./Cover/*.{jpg,JPG,jpeg,JPEG}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const CHINESE_GRADE_MAP: Record<string, Grade> = {
  一: Grade.ONE,
  二: Grade.TWO,
  三: Grade.THREE,
  四: Grade.FOUR,
  五: Grade.FIVE,
  六: Grade.SIX,
};

const getBasename = (path: string) => {
  const file = path.split('/').pop() || path;
  return file.replace(/\.(mp4|MP4|jpg|JPG|jpeg|JPEG)$/, '');
};

const parseGrade = (basename: string): Grade => {
  const match = basename.match(/([一二三四五六])年级/);
  if (match && CHINESE_GRADE_MAP[match[1]]) return CHINESE_GRADE_MAP[match[1]];
  return Grade.ONE;
};

const parseSemester = (basename: string): '上册' | '下册' | null => {
  const match = basename.match(/(上册|下册)/);
  return (match?.[1] as '上册' | '下册' | undefined) || null;
};

const parseTitle = (basename: string) => {
  const match = basename.match(/《(.+?)》/);
  return match?.[1]?.trim() || basename.trim();
};

const starsFromGrade = (grade: Grade) => {
  if (grade <= Grade.ONE) return 1;
  if (grade === Grade.TWO) return 2;
  if (grade === Grade.THREE) return 3;
  if (grade === Grade.FOUR) return 4;
  return 5;
};

const svgDataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const makePoetryTextCover = (title: string, grade: Grade) => {
  const palette = [
    { bg1: '#FF8FAB', bg2: '#F49E4C', accent: '#FFFFFF' },
    { bg1: '#85D2D0', bg2: '#60A5FA', accent: '#FFFFFF' },
    { bg1: '#A78BFA', bg2: '#FB7185', accent: '#FFFFFF' },
    { bg1: '#FDE047', bg2: '#FB923C', accent: '#1F2937' },
    { bg1: '#34D399', bg2: '#22C55E', accent: '#FFFFFF' },
    { bg1: '#38BDF8', bg2: '#818CF8', accent: '#FFFFFF' },
  ];
  const theme = palette[(grade - 1) % palette.length];
  const displayTitle = title.length > 12 ? `${title.slice(0, 12)}…` : title;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${theme.bg1}"/>
      <stop offset="1" stop-color="${theme.bg2}"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="rgba(0,0,0,0.25)"/>
    </filter>
  </defs>
  <rect width="800" height="600" rx="48" fill="url(#bg)"/>
  <circle cx="90" cy="120" r="62" fill="rgba(255,255,255,0.22)"/>
  <circle cx="720" cy="110" r="80" fill="rgba(255,255,255,0.16)"/>
  <circle cx="700" cy="520" r="120" fill="rgba(255,255,255,0.14)"/>
  <path d="M 0 420 C 180 360, 280 520, 520 460 C 640 430, 710 450, 800 420 L 800 600 L 0 600 Z" fill="rgba(255,255,255,0.16)"/>
  <g filter="url(#shadow)">
    <rect x="70" y="150" width="660" height="320" rx="36" fill="rgba(255,255,255,0.28)" stroke="rgba(255,255,255,0.35)"/>
  </g>
  <text x="400" y="250" text-anchor="middle" font-size="56" font-weight="800" fill="${theme.accent}" font-family="Verdana, 'Comic Sans MS', sans-serif">${displayTitle}</text>
  <text x="400" y="320" text-anchor="middle" font-size="26" font-weight="700" fill="rgba(255,255,255,0.9)" font-family="Verdana, 'Comic Sans MS', sans-serif">诗词赏析 · ${grade}年级</text>
  <text x="400" y="410" text-anchor="middle" font-size="22" font-weight="700" fill="rgba(255,255,255,0.9)" font-family="Verdana, 'Comic Sans MS', sans-serif">📜 读一读 · 想一想 · 画一画</text>
</svg>`;
  return svgDataUrl(svg);
};

const buildCoursesFromAssets = (): Course[] => {
  const coverByBasename = new Map<string, string>();
  for (const [path, url] of Object.entries(COVER_URLS)) {
    coverByBasename.set(getBasename(path), url);
  }

  const items = Object.entries(VIDEO_URLS).map(([path, url]) => {
    const basename = getBasename(path);
    const grade = parseGrade(basename);
    const semester = parseSemester(basename);
    const title = parseTitle(basename);
    return { basename, grade, semester, title, videoUrl: url };
  });

  const semesterOrder = (s: '上册' | '下册' | null) => (s === '上册' ? 0 : s === '下册' ? 1 : 2);

  items.sort((a, b) => {
    if (a.grade !== b.grade) return a.grade - b.grade;
    const semDiff = semesterOrder(a.semester) - semesterOrder(b.semester);
    if (semDiff !== 0) return semDiff;
    return a.title.localeCompare(b.title, 'zh-Hans-CN');
  });

  const courses: Course[] = [];
  for (const item of items) {
    const coverUrl = coverByBasename.get(item.basename) || makePoetryTextCover(item.title, item.grade);
    const stars = starsFromGrade(item.grade);
    const author = '部编语文';
    const baseId = item.basename;
    const poem = findPoemEntry(item.title);
    const poemAuthor = poem?.author || author;
    const dynasty = getDynastyByAuthor(poemAuthor) || undefined;

    courses.push({
      id: `${baseId}::${CourseType.POETRY_DANCE}`,
      title: item.title,
      author: poemAuthor,
      dynasty,
      grade: item.grade,
      type: CourseType.POETRY_DANCE,
      coverUrl,
      videoUrl: item.videoUrl,
      sourceBasename: item.basename,
      stars,
      isLocked: false,
    });

    courses.push({
      id: `${baseId}::${CourseType.POETRY_TEXT}`,
      title: item.title,
      author: poemAuthor,
      dynasty,
      grade: item.grade,
      type: CourseType.POETRY_TEXT,
      coverUrl: makePoetryTextCover(item.title, item.grade),
      lines: poem?.lines,
      sourceBasename: item.basename,
      stars,
      isLocked: false,
    });
  }

  return courses;
};

export const MOCK_COURSES: Course[] = buildCoursesFromAssets();

export const MOCK_USER_STATS: UserStats = {
  totalStars: 128,
  coursesCompleted: 15,
  streakDays: 5,
  learningMinutes: 340,
  skills: {
    rhythm: 80,
    memory: 65,
    creativity: 90,
    expression: 75,
    history: 60,
  },
  weeklyActivity: [
    { day: 'Mon', minutes: 20 },
    { day: 'Tue', minutes: 45 },
    { day: 'Wed', minutes: 30 },
    { day: 'Thu', minutes: 10 },
    { day: 'Fri', minutes: 60 },
    { day: 'Sat', minutes: 90 },
    { day: 'Sun', minutes: 40 },
  ],
};

export const MOCK_NEWS: NewsItem[] = [
  { id: '1', title: '🌸 春季诗舞大赛开启报名！', date: '2023-05-20', type: 'EVENT', summary: '快来展示你的优美舞姿，赢取限定勋章！' },
  { id: '2', title: '📢 系统更新维护通知', date: '2023-05-18', type: 'NOTICE', summary: '我们将于今晚进行小规模更新，优化小诗AI的响应速度。' },
  { id: '3', title: '📚 新增《唐诗三百首》精选教材', date: '2023-05-15', type: 'RESOURCE', summary: '包含名师讲解与舞蹈动作分解，快去课程库看看吧。' },
];

export const TRANSLATIONS = {
  zh: {
    menu_home: "首页",
    menu_courses: "课程库",
    menu_ai: "小诗AI",
    menu_games: "趣味游戏",
    menu_profile: "个人主页",
    menu_news: "官方咨询",
    menu_settings: "设置中心",
    welcome: "欢迎回来",
    daily_quote: "今日诗句",
    start_learning: "开始学习",
    recommended: "推荐课程",
    grade: "年级",
    type: "类型",
    poetry_dance: "诗舞课程",
    poetry_text: "诗词赏析",
    send_message: "输入你的问题...",
    ai_typing: "小诗正在思考...",
    game_dance: "趣味舞动",
    game_pk: "诗词PK",
    game_guess: "猜灯谜",
    stats_overview: "学习概览",
    plan: "学习计划",
    settings_language: "语言设置",
    settings_account: "账号安全",
    settings_ai: "AI 配置",
    settings_ai_model: "模型",
    logout: "退出登录"
  },
  en: {
    menu_home: "Home",
    menu_courses: "Courses",
    menu_ai: "Little Poem AI",
    menu_games: "Fun Games",
    menu_profile: "My Profile",
    menu_news: "News",
    menu_settings: "Settings",
    welcome: "Welcome Back",
    daily_quote: "Daily Quote",
    start_learning: "Start Learning",
    recommended: "Recommended",
    grade: "Grade",
    type: "Type",
    poetry_dance: "Dance",
    poetry_text: "Poetry",
    send_message: "Type your message...",
    ai_typing: "Little Poem is thinking...",
    game_dance: "Fun Dance",
    game_pk: "Poetry PK",
    game_guess: "Riddles",
    stats_overview: "Overview",
    plan: "Learning Plan",
    settings_language: "Language",
    settings_account: "Account",
    settings_ai: "AI Settings",
    settings_ai_model: "Model",
    logout: "Log Out"
  }
};
