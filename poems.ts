export interface PoemEntry {
  title: string;
  author: string;
  lines: string[];
}

const normalizeTitle = (raw: string) => {
  return raw
    .replace(/\s+/g, '')
    .replace(/[《》]/g, '')
    .replace(/[（(]/g, '(')
    .replace(/[）)]/g, ')')
    .replace(/·/g, '·')
    .trim();
};

export const findPoemEntry = (title: string): PoemEntry | undefined => {
  const direct = POEM_LIBRARY[title];
  if (direct) return direct;

  const normalized = normalizeTitle(title);
  for (const [key, value] of Object.entries(POEM_LIBRARY)) {
    if (normalizeTitle(key) === normalized) return value;
  }

  const base = normalized.replace(/\([^)]*\)/g, '').trim();
  if (base && base !== normalized) {
    for (const [key, value] of Object.entries(POEM_LIBRARY)) {
      if (normalizeTitle(key).replace(/\([^)]*\)/g, '').trim() === base) return value;
    }
  }

  return undefined;
};

export const POEM_LIBRARY: Record<string, PoemEntry> = {
  '咏鹅': {
    title: '咏鹅',
    author: '骆宾王',
    lines: [
      '鹅，鹅，鹅，',
      '曲项向天歌。',
      '白毛浮绿水，',
      '红掌拨清波。',
    ],
  },
  '静夜思': {
    title: '静夜思',
    author: '李白',
    lines: [
      '床前明月光，',
      '疑是地上霜。',
      '举头望明月，',
      '低头思故乡。',
    ],
  },
  '春晓': {
    title: '春晓',
    author: '孟浩然',
    lines: [
      '春眠不觉晓，',
      '处处闻啼鸟。',
      '夜来风雨声，',
      '花落知多少。',
    ],
  },
  '村居': {
    title: '村居',
    author: '高鼎',
    lines: [
      '草长莺飞二月天，',
      '拂堤杨柳醉春烟。',
      '儿童散学归来早，',
      '忙趁东风放纸鸢。',
    ],
  },
  '望庐山瀑布': {
    title: '望庐山瀑布',
    author: '李白',
    lines: [
      '日照香炉生紫烟，',
      '遥看瀑布挂前川。',
      '飞流直下三千尺，',
      '疑是银河落九天。',
    ],
  },
  '题西林壁': {
    title: '题西林壁',
    author: '苏轼',
    lines: [
      '横看成岭侧成峰，',
      '远近高低各不同。',
      '不识庐山真面目，',
      '只缘身在此山中。',
    ],
  },
  '示儿': {
    title: '示儿',
    author: '陆游',
    lines: [
      '死去元知万事空，',
      '但悲不见九州同。',
      '王师北定中原日，',
      '家祭无忘告乃翁。',
    ],
  },
  '竹石': {
    title: '竹石',
    author: '郑燮',
    lines: [
      '咬定青山不放松，',
      '立根原在破岩中。',
      '千磨万击还坚劲，',
      '任尔东西南北风。',
    ],
  },
  '江南': {
    title: '江南',
    author: '汉乐府',
    lines: [
      '江南可采莲，',
      '莲叶何田田。',
      '鱼戏莲叶间。',
      '鱼戏莲叶东，',
      '鱼戏莲叶西，',
      '鱼戏莲叶南，',
      '鱼戏莲叶北。',
    ],
  },
  '画': {
    title: '画',
    author: '王维',
    lines: [
      '远看山有色，',
      '近听水无声。',
      '春去花还在，',
      '人来鸟不惊。',
    ],
  },
  '风': {
    title: '风',
    author: '李峤',
    lines: [
      '解落三秋叶，',
      '能开二月花。',
      '过江千尺浪，',
      '入竹万竿斜。',
    ],
  },
  '寻隐者不遇': {
    title: '寻隐者不遇',
    author: '贾岛',
    lines: [
      '松下问童子，',
      '言师采药去。',
      '只在此山中，',
      '云深不知处。',
    ],
  },
  '小池': {
    title: '小池',
    author: '杨万里',
    lines: [
      '泉眼无声惜细流，',
      '树阴照水爱晴柔。',
      '小荷才露尖尖角，',
      '早有蜻蜓立上头。',
    ],
  },
  '池上': {
    title: '池上',
    author: '白居易',
    lines: [
      '小娃撑小艇，',
      '偷采白莲回。',
      '不解藏踪迹，',
      '浮萍一道开。',
    ],
  },
  '画鸡': {
    title: '画鸡',
    author: '唐寅',
    lines: [
      '头上红冠不用裁，',
      '满身雪白走将来。',
      '平生不敢轻言语，',
      '一叫千门万户开。',
    ],
  },
  '登鹳雀楼': {
    title: '登鹳雀楼',
    author: '王之涣',
    lines: [
      '白日依山尽，',
      '黄河入海流。',
      '欲穷千里目，',
      '更上一层楼。',
    ],
  },
  '夜宿山寺': {
    title: '夜宿山寺',
    author: '李白',
    lines: [
      '危楼高百尺，',
      '手可摘星辰。',
      '不敢高声语，',
      '恐惊天上人。',
    ],
  },
  '梅花': {
    title: '梅花',
    author: '王安石',
    lines: [
      '墙角数枝梅，',
      '凌寒独自开。',
      '遥知不是雪，',
      '为有暗香来。',
    ],
  },
  '江雪': {
    title: '江雪',
    author: '柳宗元',
    lines: [
      '千山鸟飞绝，',
      '万径人踪灭。',
      '孤舟蓑笠翁，',
      '独钓寒江雪。',
    ],
  },
  '清明': {
    title: '清明',
    author: '杜牧',
    lines: [
      '清明时节雨纷纷，',
      '路上行人欲断魂。',
      '借问酒家何处有，',
      '牧童遥指杏花村。',
    ],
  },
  '元日': {
    title: '元日',
    author: '王安石',
    lines: [
      '爆竹声中一岁除，',
      '春风送暖入屠苏。',
      '千门万户曈曈日，',
      '总把新桃换旧符。',
    ],
  },
  '夜书所见': {
    title: '夜书所见',
    author: '叶绍翁',
    lines: [
      '萧萧梧叶送寒声，',
      '江上秋风动客情。',
      '知有儿童挑促织，',
      '夜深篱落一灯明。',
    ],
  },
  '山行': {
    title: '山行',
    author: '杜牧',
    lines: [
      '远上寒山石径斜，',
      '白云生处有人家。',
      '停车坐爱枫林晚，',
      '霜叶红于二月花。',
    ],
  },
  '所见': {
    title: '所见',
    author: '袁枚',
    lines: [
      '牧童骑黄牛，',
      '歌声振林樾。',
      '意欲捕鸣蝉，',
      '忽然闭口立。',
    ],
  },
  '早发白帝城': {
    title: '早发白帝城',
    author: '李白',
    lines: [
      '朝辞白帝彩云间，',
      '千里江陵一日还。',
      '两岸猿声啼不住，',
      '轻舟已过万重山。',
    ],
  },
  '望天门山': {
    title: '望天门山',
    author: '李白',
    lines: [
      '天门中断楚江开，',
      '碧水东流至此回。',
      '两岸青山相对出，',
      '孤帆一片日边来。',
    ],
  },
  '望洞庭': {
    title: '望洞庭',
    author: '刘禹锡',
    lines: [
      '湖光秋月两相和，',
      '潭面无风镜未磨。',
      '遥望洞庭山水翠，',
      '白银盘里一青螺。',
    ],
  },
  '赠刘景文': {
    title: '赠刘景文',
    author: '苏轼',
    lines: [
      '荷尽已无擎雨盖，',
      '菊残犹有傲霜枝。',
      '一年好景君须记，',
      '最是橙黄橘绿时。',
    ],
  },
  '赠汪伦': {
    title: '赠汪伦',
    author: '李白',
    lines: [
      '李白乘舟将欲行，',
      '忽闻岸上踏歌声。',
      '桃花潭水深千尺，',
      '不及汪伦送我情。',
    ],
  },
  '饮湖上初晴后雨': {
    title: '饮湖上初晴后雨',
    author: '苏轼',
    lines: [
      '水光潋滟晴方好，',
      '山色空蒙雨亦奇。',
      '欲把西湖比西子，',
      '淡妆浓抹总相宜。',
    ],
  },
  '九月九日忆山东兄弟': {
    title: '九月九日忆山东兄弟',
    author: '王维',
    lines: [
      '独在异乡为异客，',
      '每逢佳节倍思亲。',
      '遥知兄弟登高处，',
      '遍插茱萸少一人。',
    ],
  },
  '惠崇春江晚景': {
    title: '惠崇春江晚景',
    author: '苏轼',
    lines: [
      '竹外桃花三两枝，',
      '春江水暖鸭先知。',
      '蒌蒿满地芦芽短，',
      '正是河豚欲上时。',
    ],
  },
  '绝句': {
    title: '绝句',
    author: '杜甫',
    lines: [
      '两个黄鹂鸣翠柳，',
      '一行白鹭上青天。',
      '窗含西岭千秋雪，',
      '门泊东吴万里船。',
    ],
  },
};
