import React, { useState } from 'react';
import { deleteUserById, listUsers } from '../services/userStore';
import { useAuth } from '../context/AuthContext';
import { LogIn, User, UserX, Sparkles, Trash2, Info } from 'lucide-react';

export const Login: React.FC = () => {
  const auth = useAuth();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [users, setUsers] = useState(() => listUsers().slice().sort((a, b) => b.lastLoginAt - a.lastLoginAt).slice(0, 6));

  const submit = async () => {
    setError(null);
    if (busy) return;
    setBusy(true);
    try {
      const res = await auth.login({ username, displayName });
      if (!res.ok) setError(res.message || '进入失败');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#FDF6E3] flex items-center justify-center p-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-secondary/15 blur-3xl" />
      </div>

      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="p-5 md:p-6 bg-gradient-to-r from-primary to-accent text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center font-extrabold text-2xl">诗</div>
            <div>
              <div className="text-2xl font-extrabold">吟诗舞韵</div>
              <div className="text-white/85 text-sm mt-1">输入学习号就能进入（首次会自动创建）</div>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6 space-y-4">
          <div>
            <div className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <User size={16} />
              学习号
            </div>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="例如：xiaoming01"
              className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <div className="mt-4">
              <div className="text-sm font-bold text-gray-700">昵称</div>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="例如：小小诗仙"
                className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="mt-3 bg-primary/10 border border-primary/15 rounded-2xl p-4 text-sm text-gray-700 flex gap-3">
              <div className="text-primary mt-0.5">
                <Info size={18} />
              </div>
              <div className="leading-relaxed">
                进入注意：学习号可以自由创建（建议字母/数字组合），昵称用于区分不同同学。学习号是唯一的：如果学习号已被使用，需要更换学习号或输入正确昵称才能进入。
              </div>
            </div>
          </div>

          {error && <div className="bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl p-4 text-sm font-bold">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              className="w-full h-12 rounded-2xl bg-primary text-white font-extrabold shadow-lg shadow-primary/25 hover:brightness-110 transition-all disabled:opacity-60 disabled:hover:brightness-100"
              onClick={submit}
              disabled={busy}
            >
              <span className="inline-flex items-center gap-2 justify-center">
                <LogIn size={18} />
                {busy ? '进入中…' : '进入'}
              </span>
            </button>
            <button
              className="w-full h-12 rounded-2xl bg-gray-100 text-gray-700 font-extrabold hover:bg-gray-200 transition-colors"
              onClick={() => auth.enterGuest()}
              disabled={busy}
            >
              <span className="inline-flex items-center gap-2 justify-center">
                <UserX size={18} />
                游客模式
              </span>
            </button>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-3xl p-4 md:p-5">
            <div className="font-extrabold text-gray-800 flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              最近使用
            </div>
            <div className="text-sm text-gray-500 mt-1">点一下自动填入学习号</div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {users.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-2xl p-4 text-gray-500 md:col-span-2">还没有账号，输入学习号直接进入即可。</div>
              ) : (
                users.map((u) => (
                  <div key={u.id} className="bg-white border border-gray-100 rounded-2xl p-3 flex items-center gap-3">
                    <button
                      className="flex-1 text-left hover:bg-gray-50 transition-colors rounded-xl -m-2 p-2"
                      onClick={() => {
                        setUsername(u.username);
                        setDisplayName(u.displayName);
                        setError(null);
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-extrabold text-gray-800 truncate">{u.displayName}</div>
                        <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2 py-1 rounded-full shrink-0">{u.username}</div>
                      </div>
                    </button>
                    <button
                      className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-100 text-gray-500 hover:bg-rose-50 hover:border-rose-100 hover:text-rose-600 transition-colors flex items-center justify-center"
                      aria-label="删除该学习号"
                      onClick={() => {
                        const ok = window.confirm(`确定删除学习号「${u.username}」吗？\n删除后该学习号的本机学习记录也会一起清除。`);
                        if (!ok) return;
                        const res = deleteUserById(u.id);
                        if (!res.ok) {
                          setError(res.message);
                          return;
                        }
                        setUsers(listUsers().slice().sort((a, b) => b.lastLoginAt - a.lastLoginAt).slice(0, 6));
                        if (username.trim() === u.username) setUsername('');
                        if (displayName.trim() === u.displayName) setDisplayName('');
                      }}
                      disabled={busy}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="text-xs text-gray-500 leading-relaxed">
            游客模式不会保存学习记录；学习号模式会把记录保存在本机浏览器里。
          </div>
        </div>
      </div>
    </div>
  );
};
