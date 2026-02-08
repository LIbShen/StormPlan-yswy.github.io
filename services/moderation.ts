import { createChatSession } from './geminiService';

const bannedWords = [
  '自杀',
  '杀人',
  '谋杀',
  '爆炸',
  '炸弹',
  '枪',
  '手枪',
  '步枪',
  '毒品',
  '吸毒',
  '赌博',
  '裸',
  '色情',
  '成人视频',
  '约炮',
  '强奸',
  '恐怖',
  '血腥',
];

const hasContactInfo = (text: string) => {
  const t = text.replace(/\s+/g, '');
  if (/(1\d{10})/.test(t)) return true;
  if (/qq[:：]?\d{5,12}/i.test(t)) return true;
  if (/微信[:：]?[a-zA-Z0-9_-]{5,}/.test(t)) return true;
  if (/@\w{3,}/.test(t) && /com|cn|net|org/i.test(t)) return true;
  return false;
};

export const localModerate = (text: string): { ok: true } | { ok: false; reason: string } => {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, reason: '评论不能为空' };
  if (trimmed.length > 200) return { ok: false, reason: '评论太长了（最多 200 字）' };
  if (hasContactInfo(trimmed)) return { ok: false, reason: '评论里不要留下联系方式哦' };
  const lower = trimmed.toLowerCase();
  for (const w of bannedWords) {
    if (lower.includes(w.toLowerCase())) return { ok: false, reason: '评论包含不适合小学生的内容' };
  }
  return { ok: true };
};

export const aiModerate = async (text: string) => {
  const session = createChatSession();
  const prompt = `你是小学生学习应用的评论审核员。请判断下面这段评论是否适合小学生学习社区。
规则：
1) 禁止暴力血腥、色情、毒品、赌博、仇恨攻击、诱导隐私、联系方式等。
2) 如果不通过，请给出简短原因。
请只输出 JSON，格式：
{"allow": true/false, "reason": "..." }
评论：${JSON.stringify(text)}`;
  const res = await session.sendMessage({ message: prompt });
  const raw = res.text;
  const jsonStart = raw.indexOf('{');
  const jsonEnd = raw.lastIndexOf('}');
  const body = jsonStart >= 0 && jsonEnd >= 0 ? raw.slice(jsonStart, jsonEnd + 1) : raw;
  const parsed = JSON.parse(body) as { allow?: boolean; reason?: string };
  return { allow: Boolean(parsed.allow), reason: String(parsed.reason || '') };
};
