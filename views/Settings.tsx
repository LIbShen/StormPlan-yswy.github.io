import React, { useMemo, useState } from 'react';
import { TRANSLATIONS } from '../constants';
import { Globe, User, LogOut, Bot, X, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Grade } from '../types';
import { getAiRuntimeConfig } from '../services/geminiService';

interface SettingsProps {
  lang: 'zh' | 'en';
  setLang: (lang: 'zh' | 'en') => void;
}

export const Settings: React.FC<SettingsProps> = ({ lang, setLang }) => {
  const t = TRANSLATIONS[lang];
  const auth = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState(auth.settings?.displayName || '');
  const [gradeDraft, setGradeDraft] = useState<Grade>(auth.settings?.grade || Grade.ONE);
  const [error, setError] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSavedAt, setAiSavedAt] = useState(0);
  const grades: Grade[] = [Grade.ONE, Grade.TWO, Grade.THREE, Grade.FOUR, Grade.FIVE, Grade.SIX];
  const aiConfig = useMemo(() => getAiRuntimeConfig(), [aiSavedAt]);
  const [aiBaseUrl, setAiBaseUrl] = useState(() => {
    try {
      return window.localStorage.getItem('yswy_nvidia_base_url') || '';
    } catch {
      return '';
    }
  });
  const [aiModel, setAiModel] = useState(() => {
    try {
      return window.localStorage.getItem('yswy_nvidia_model') || '';
    } catch {
      return '';
    }
  });
  const [aiKey, setAiKey] = useState(() => {
    try {
      return window.localStorage.getItem('yswy_nvidia_api_key') || '';
    } catch {
      return '';
    }
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
       <h1 className="text-3xl font-bold text-gray-800 mb-8">{t.menu_settings}</h1>

       {/* Language */}
       <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
           <div className="flex items-center gap-3 mb-4">
               <Globe className="text-blue-500" />
               <h2 className="text-xl font-bold text-gray-700">{t.settings_language}</h2>
           </div>
           <div className="grid grid-cols-2 gap-4">
               <button 
                onClick={() => setLang('zh')}
                className={`p-4 rounded-xl border-2 transition-all font-bold ${lang === 'zh' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 hover:border-gray-200'}`}
               >
                   🇨🇳 中文
               </button>
               <button 
                onClick={() => setLang('en')}
                className={`p-4 rounded-xl border-2 transition-all font-bold ${lang === 'en' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 hover:border-gray-200'}`}
               >
                   🇺🇸 English
               </button>
           </div>
       </div>

       {/* Account */}
       <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
           <div className="flex items-center gap-3 mb-2">
               <User className="text-secondary" />
               <h2 className="text-xl font-bold text-gray-700">{t.settings_account}</h2>
           </div>
           
           <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
               <span className="text-gray-600">昵称</span>
               <div className="flex items-center gap-3">
                 <span className="font-bold text-gray-800">{auth.settings?.displayName || '未登录'}</span>
                 <button
                   className="text-primary font-bold text-sm"
                   onClick={() => {
                     setNameDraft(auth.settings?.displayName || '');
                     setGradeDraft(auth.settings?.grade || Grade.ONE);
                     setError(null);
                     setEditOpen(true);
                   }}
                 >
                   编辑
                 </button>
               </div>
           </div>

       </div>

       <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-3">
           <div className="flex items-center gap-3 mb-2">
               <Bot className="text-purple-500" />
               <h2 className="text-xl font-bold text-gray-700">{t.settings_ai}</h2>
           </div>
           <div className="space-y-2 text-sm text-gray-600">
               <div className="flex items-center justify-between gap-4">
                   <span className="font-bold text-gray-700">{t.settings_ai_model}</span>
                   <span className="text-right break-all">{aiConfig.model}</span>
               </div>
               <div className="flex items-center justify-between gap-4">
                   <span className="font-bold text-gray-700">API 地址</span>
                   <span className="text-right break-all">{aiConfig.useProxy ? '开发环境走 /nvidia 代理' : aiConfig.baseUrl}</span>
               </div>
               <div className="flex items-center justify-between gap-4">
                   <span className="font-bold text-gray-700">API Key</span>
                   <span className="text-right break-all">{aiConfig.hasApiKey ? '已配置' : '未配置'}</span>
               </div>
           </div>
           <div className="mt-4 space-y-3">
             <div>
               <div className="text-sm font-bold text-gray-700">API Key（仅保存在本机浏览器）</div>
               <input
                 value={aiKey}
                 onChange={(e) => setAiKey(e.target.value)}
                 placeholder="粘贴你的 NVIDIA Integrate API Key"
                 className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                 type="password"
                 autoComplete="off"
               />
             </div>
             <div>
               <div className="text-sm font-bold text-gray-700">API 地址（可选）</div>
               <input
                 value={aiBaseUrl}
                 onChange={(e) => setAiBaseUrl(e.target.value)}
                 placeholder="例如：https://integrate.api.nvidia.com"
                 className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
               />
             </div>
             <div>
               <div className="text-sm font-bold text-gray-700">模型（可选）</div>
               <input
                 value={aiModel}
                 onChange={(e) => setAiModel(e.target.value)}
                 placeholder="例如：minimaxai/minimax-m2.1"
                 className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
               />
             </div>
             {aiError && <div className="bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl p-4 text-sm font-bold">{aiError}</div>}
             <div className="flex items-center justify-end gap-3 pt-1">
               <button
                 className="px-6 h-11 rounded-2xl bg-gray-100 text-gray-700 font-extrabold hover:bg-gray-200 transition-colors"
                 onClick={() => {
                   try {
                     window.localStorage.removeItem('yswy_nvidia_api_key');
                     window.localStorage.removeItem('yswy_nvidia_base_url');
                     window.localStorage.removeItem('yswy_nvidia_model');
                     setAiKey('');
                     setAiBaseUrl('');
                     setAiModel('');
                     setAiError(null);
                     setAiSavedAt(Date.now());
                   } catch {
                     setAiError('无法访问本机存储（localStorage），请检查浏览器隐私设置。');
                   }
                 }}
                 type="button"
               >
                 清除
               </button>
               <button
                 className="px-6 h-11 rounded-2xl bg-primary text-white font-extrabold hover:brightness-110 transition-all"
                 onClick={() => {
                   try {
                     const key = aiKey.trim();
                     const base = aiBaseUrl.trim();
                     const model = aiModel.trim();
                     if (key) window.localStorage.setItem('yswy_nvidia_api_key', key);
                     else window.localStorage.removeItem('yswy_nvidia_api_key');
                     if (base) window.localStorage.setItem('yswy_nvidia_base_url', base);
                     else window.localStorage.removeItem('yswy_nvidia_base_url');
                     if (model) window.localStorage.setItem('yswy_nvidia_model', model);
                     else window.localStorage.removeItem('yswy_nvidia_model');
                     setAiError(null);
                     setAiSavedAt(Date.now());
                   } catch {
                     setAiError('无法保存到本机存储（localStorage），请检查浏览器隐私设置。');
                   }
                 }}
                 type="button"
               >
                 保存
               </button>
             </div>
           </div>
       </div>

       <button
         className="w-full bg-red-50 text-red-500 font-bold p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
         onClick={() => auth.logout()}
       >
           <LogOut size={20} />
           {t.logout}
       </button>

       {editOpen && (
         <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
           <button className="absolute inset-0 bg-black/50" onClick={() => setEditOpen(false)} aria-label="关闭" />
           <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden">
             <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
               <div className="font-extrabold text-gray-800">账号设置</div>
               <button className="w-10 h-10 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center" onClick={() => setEditOpen(false)} aria-label="关闭">
                 <X size={18} />
               </button>
             </div>
             <div className="p-6 space-y-4">
               <div>
                 <div className="text-sm font-bold text-gray-700">昵称</div>
                 <input
                   value={nameDraft}
                   onChange={(e) => setNameDraft(e.target.value)}
                   placeholder="例如：小小诗仙"
                   className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                 />
               </div>
               <div>
                 <div className="text-sm font-bold text-gray-700 flex items-center gap-2">
                   <GraduationCap size={16} />
                   年级
                 </div>
                 <div className="mt-2 grid grid-cols-3 gap-2">
                   {grades.map((g) => (
                     <button
                       key={g}
                       className={`h-11 rounded-2xl font-extrabold border transition-all ${gradeDraft === g ? 'bg-primary/10 border-primary/25 text-primary' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                       onClick={() => setGradeDraft(g)}
                       type="button"
                     >
                       {g}年级
                     </button>
                   ))}
                 </div>
               </div>
               {error && <div className="bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl p-4 text-sm font-bold">{error}</div>}
               <div className="flex items-center justify-end gap-3 pt-2">
                 <button className="px-6 h-11 rounded-2xl bg-gray-100 text-gray-700 font-extrabold hover:bg-gray-200 transition-colors" onClick={() => setEditOpen(false)}>
                   取消
                 </button>
                 <button
                   className="px-6 h-11 rounded-2xl bg-primary text-white font-extrabold hover:brightness-110 transition-all"
                   onClick={() => {
                     if (!auth.userId) return;
                     const nextName = nameDraft.trim();
                     if (!nextName) { setError('昵称不能为空'); return; }
                     auth.setDisplayName(nextName);
                     auth.setGrade(gradeDraft);
                     setEditOpen(false);
                   }}
                 >
                   保存
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
    </div>
  );
};
