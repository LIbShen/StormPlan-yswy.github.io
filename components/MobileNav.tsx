import React from 'react';
import { Home, BookOpen, Bot, Gamepad2, User, Bell, Settings } from 'lucide-react';
import { View } from '../types';
import { TRANSLATIONS } from '../constants';

export const MobileNav: React.FC<{
  currentView: View;
  setCurrentView: (view: View) => void;
  lang: 'zh' | 'en';
}> = ({ currentView, setCurrentView, lang }) => {
  const t = TRANSLATIONS[lang];
  const items = [
    { id: View.HOME, label: t.menu_home, icon: Home },
    { id: View.COURSES, label: t.menu_courses, icon: BookOpen },
    { id: View.AI, label: t.menu_ai, icon: Bot },
    { id: View.GAMES, label: t.menu_games, icon: Gamepad2 },
    { id: View.PROFILE, label: t.menu_profile, icon: User },
    { id: View.NEWS, label: t.menu_news, icon: Bell },
    { id: View.SETTINGS, label: t.menu_settings, icon: Settings },
  ];

  return (
    <div className="md:hidden fixed left-0 right-0 bottom-0 z-50 bg-white/95 backdrop-blur border-t border-gray-100 pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-7 h-16">
        {items.map((it) => {
          const active = currentView === it.id;
          const Icon = it.icon;
          return (
            <button
              key={it.id}
              className={`flex flex-col items-center justify-center gap-1 text-[10px] font-extrabold ${
                active ? 'text-primary' : 'text-gray-500'
              }`}
              onClick={() => setCurrentView(it.id)}
              aria-label={it.label}
            >
              <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${active ? 'bg-primary/10' : ''}`}>
                <Icon size={18} />
              </div>
              <div className="truncate max-w-[44px]">{it.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
