import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { Home } from './views/Home';
import { Courses } from './views/Courses';
import { AI } from './views/AI';
import { Games } from './views/Games';
import { Profile } from './views/Profile';
import { News } from './views/News';
import { Settings } from './views/Settings';
import { View } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './views/Login';

const AppShell: React.FC = () => {
  const auth = useAuth();
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [lang, setLangState] = useState<'zh' | 'en'>('zh');
  const [openCourseId, setOpenCourseId] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.settings?.lang) return;
    setLangState(auth.settings.lang);
  }, [auth.settings?.lang]);

  const setLang = (next: 'zh' | 'en') => {
    setLangState(next);
    auth.setLang(next);
  };

  const renderView = () => {
    switch (currentView) {
      case View.HOME:
        return (
          <Home
            lang={lang}
            setView={setCurrentView}
            openCourse={(courseId) => {
              setOpenCourseId(courseId);
              setCurrentView(View.COURSES);
            }}
          />
        );
      case View.COURSES:
        return <Courses lang={lang} openCourseId={openCourseId} onCourseOpened={() => setOpenCourseId(null)} />;
      case View.AI:
        return <AI lang={lang} />;
      case View.GAMES:
        return <Games lang={lang} />;
      case View.PROFILE:
        return <Profile lang={lang} />;
      case View.NEWS:
        return <News lang={lang} />;
      case View.SETTINGS:
        return <Settings lang={lang} setLang={setLang} />;
      default:
        return (
          <Home
            lang={lang}
            setView={setCurrentView}
            openCourse={(courseId) => {
              setOpenCourseId(courseId);
              setCurrentView(View.COURSES);
            }}
          />
        );
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#FDF6E3]">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} lang={lang} />
      <MobileNav currentView={currentView} setCurrentView={setCurrentView} lang={lang} />

      <main className="ml-0 md:ml-64 px-4 md:px-8 pt-4 md:pt-8 pb-24 md:pb-8 min-h-[100dvh] transition-all">
        <div className="md:hidden flex justify-center pb-4">
           <span className="font-bold text-primary text-xl tracking-widest">吟诗舞韵</span>
        </div>

        {renderView()}
      </main>

      {!auth.userId && <Login />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
};

export default App;
