'use client';

import React from 'react';
import { BookOpen, Settings, PlusCircle, Folder, ChevronDown } from 'lucide-react';
import { LearningSession } from '@/types/feynman';

interface HeaderProps {
  sessions: LearningSession[];
  activeSessionId?: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onOpenSettings
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-zinc-200 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3 cursor-pointer group" onClick={onNewSession}>
          <div className="w-9 h-9 bg-blue-600 text-white flex items-center justify-center font-black text-lg border-2 border-blue-700 shadow-xs">
            F
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-slate-900 text-base tracking-tight leading-none">
                Feynman <span className="text-blue-600 font-black">AI</span>
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-400 text-amber-950 border border-amber-500">
                FEYNMAN METHOD
              </span>
            </div>
            <p className="text-[11px] text-slate-600 hidden sm:block font-medium">Học sâu & diễn đạt đơn giản</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* History / Sessions Dropdown */}
          {sessions.length > 0 && (
            <div className="relative">
              <select
                value={activeSessionId || ''}
                onChange={(e) => {
                  if (e.target.value === 'new') onNewSession();
                  else if (e.target.value) onSelectSession(e.target.value);
                }}
                className="appearance-none bg-zinc-50 hover:bg-zinc-100 text-zinc-900 text-xs font-semibold py-2 pl-8 pr-8 border border-zinc-300 transition-colors cursor-pointer max-w-[140px] sm:max-w-[220px] truncate focus:outline-none focus:border-zinc-900"
              >
                <option value="" disabled>Lịch sử bài học</option>
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
                <option value="new">+ Bài học mới</option>
              </select>
              <Folder className="w-3.5 h-3.5 text-zinc-600 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {/* New Session Action Button */}
          <button
            onClick={onNewSession}
            className="flex items-center gap-1.5 sharp-btn-primary text-xs px-3.5 py-2 transition-colors touch-target"
            title="Tạo bài học mới"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Bài học mới</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 sharp-btn-secondary text-zinc-700 transition-colors touch-target"
            title="Cài đặt API Key"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
