import React, { useMemo } from 'react';
import { Course, CourseType } from '../types';
import { Lock, Play, Star, Users, ThumbsUp, Bookmark, Share2 } from 'lucide-react';
import { getCourseMeta } from '../services/courseMetaStore';

interface CourseCardProps {
  course: Course;
  onClick: (course: Course) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onClick }) => {
  const meta = useMemo(() => getCourseMeta(course.id), [course.id]);
  const format = (n: number) => {
    if (n >= 10000) return `${(n / 10000).toFixed(1).replace(/\.0$/, '')}w`;
    if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    return `${n}`;
  };
  const displayAuthor = useMemo(() => {
    if (course.author !== '部编语文') return course.author;
    try {
      const key = `poem:original:${course.title}:${course.sourceBasename || ''}`;
      const raw = localStorage.getItem(key);
      if (!raw) return course.author;
      const parsed = JSON.parse(raw) as { author?: string };
      const a = String(parsed?.author || '').trim();
      return a || course.author;
    } catch {
      return course.author;
    }
  }, [course.author, course.title, course.sourceBasename]);

  return (
    <div 
      className={`bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group relative ${course.isLocked ? 'opacity-80' : ''}`}
      onClick={() => !course.isLocked && onClick(course)}
    >
      {/* Cover Image */}
      <div className="h-40 overflow-hidden relative">
        <img 
          src={course.coverUrl} 
          alt={course.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-gray-700 flex items-center gap-1">
            {course.type === CourseType.POETRY_DANCE ? '💃 诗舞' : '📜 诗词'}
        </div>
        
        {course.isLocked && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white">
                    <Lock size={32} />
                </div>
            </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2 gap-3 min-w-0">
            <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{course.title}</h3>
            <span
              className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-md whitespace-nowrap max-w-28 truncate"
              title={displayAuthor}
            >
              {displayAuthor}
            </span>
        </div>
        
        <div className="flex items-center justify-between mt-3">
             <div className="flex items-center gap-1 text-accent">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill={i < course.stars ? "currentColor" : "none"} strokeWidth={i < course.stars ? 0 : 2} />
                ))}
             </div>
             
             <button className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${course.isLocked ? 'bg-gray-200 text-gray-400' : 'bg-primary text-white shadow-lg shadow-primary/40'}`}>
                <Play size={16} fill="currentColor" />
             </button>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 text-[11px] text-gray-500">
          <div className="flex items-center gap-1 min-w-0">
            <Users size={12} />
            <span className="truncate">{format(meta.learners)}</span>
          </div>
          <div className="flex items-center gap-1 min-w-0">
            <ThumbsUp size={12} />
            <span className="truncate">{format(meta.likes)}</span>
          </div>
          <div className="flex items-center gap-1 min-w-0">
            <Bookmark size={12} />
            <span className="truncate">{format(meta.favorites)}</span>
          </div>
          <div className="flex items-center gap-1 min-w-0">
            <Share2 size={12} />
            <span className="truncate">{format(meta.shares)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
