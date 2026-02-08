import React, { useMemo } from 'react';

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const initials = (name: string) => {
  const n = name.trim();
  if (!n) return '同';
  const chinese = n.match(/[\u4e00-\u9fff]/g);
  if (chinese && chinese.length) {
    const lastTwo = chinese.slice(-2).join('');
    return lastTwo.length >= 2 ? lastTwo : lastTwo[0];
  }
  const parts = n.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || n[0];
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : n[1];
  return `${a}${b || ''}`.toUpperCase();
};

export const NameAvatar: React.FC<{ name: string; size?: number }> = ({ name, size = 40 }) => {
  const label = useMemo(() => initials(name), [name]);
  const bg = useMemo(() => {
    const h = hash(name || 'yswy');
    const h1 = h % 360;
    const h2 = (h1 + 60 + (h % 40)) % 360;
    return `linear-gradient(135deg, hsl(${h1} 85% 55%), hsl(${h2} 85% 55%))`;
  }, [name]);

  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-extrabold shadow-sm select-none"
      style={{ width: size, height: size, background: bg }}
      aria-label={name}
      title={name}
    >
      <span style={{ fontSize: Math.max(12, Math.floor(size * 0.38)), lineHeight: 1 }}>{label}</span>
    </div>
  );
};
