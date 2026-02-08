import React from 'react';
import { View } from '../types';
import { TRANSLATIONS } from '../constants';
import { Home, BookOpen, Bot, Gamepad2, User, Bell, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NameAvatar } from './NameAvatar';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  lang: 'zh' | 'en';
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, lang }) => {
  const auth = useAuth();
  const t = TRANSLATIONS[lang];

  const menuItems = [
    { id: View.HOME, label: t.menu_home, icon: Home },
    { id: View.COURSES, label: t.menu_courses, icon: BookOpen },
    { id: View.AI, label: t.menu_ai, icon: Bot },
    { id: View.GAMES, label: t.menu_games, icon: Gamepad2 },
    { id: View.PROFILE, label: t.menu_profile, icon: User },
    { id: View.NEWS, label: t.menu_news, icon: Bell },
    { id: View.SETTINGS, label: t.menu_settings, icon: Settings },
  ];

  return (
    <div className="hidden md:flex w-64 bg-white h-[100dvh] flex-col shadow-xl z-50 fixed left-0 top-0 transition-all duration-300">
      <div className="p-6 flex items-center justify-center md:justify-start gap-3 border-b border-gray-100">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold text-xl shadow-md">
          诗
        </div>
        <span className="font-bold text-xl text-primary tracking-wider">吟诗舞韵</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-2 px-3">
          {menuItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group
                    ${isActive 
                      ? 'bg-primary text-white shadow-lg shadow-primary/30 transform scale-105' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-primary'
                    }`}
                >
                  <item.icon size={24} className={isActive ? 'animate-bounce' : 'group-hover:scale-110 transition-transform'} />
                  <span className="hidden md:block font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-gray-100">
        <div 
            className="flex items-center gap-3 p-3 bg-secondary/10 rounded-2xl cursor-pointer hover:bg-secondary/20 transition-colors"
            onClick={() => setCurrentView(auth.userId ? View.PROFILE : View.HOME)}
        >
            {auth.userId && auth.settings ? (
              <NameAvatar name={auth.settings.displayName} size={40} />
            ) : (
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white shrink-0 shadow-sm">
                  <User size={20} />
              </div>
            )}
            <div className="overflow-hidden">
                <h4 className="font-bold text-gray-800 text-sm truncate">{auth.userId && auth.settings ? auth.settings.displayName : '未登录'}</h4>
                <p className="text-xs text-gray-500 truncate">
                  {auth.userId && auth.settings ? (auth.isGuest ? '游客模式（不保存）' : `小学 ${auth.settings.grade} 年级`) : '输入学习号或游客进入'}
                </p>
            </div>

            {auth.userId && (
              <button
                className="ml-auto flex w-9 h-9 rounded-xl bg-white/70 border border-white/60 text-gray-600 hover:bg-white transition-colors items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  auth.logout();
                }}
                aria-label="退出登录"
              >
                <LogOut size={18} />
              </button>
            )}
        </div>
      </div>
    </div>
  );
};
