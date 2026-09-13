'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { StructuredNote, Flashcard, QuizQuestion } from '@/types/feynman';
import { FeynmanSelfCheck } from './FeynmanSelfCheck';
import { Layers, Brain, CheckSquare, MessageSquareQuote } from 'lucide-react';

const FlashcardViewer = dynamic(
  () => import('./FlashcardViewer').then((mod) => mod.FlashcardViewer),
  {
    ssr: false,
    loading: () => (
      <div className="p-8 text-center text-slate-500 text-xs font-medium border border-slate-200 bg-white">
        Đang tải bộ thẻ Flashcard...
      </div>
    ),
  }
);

const QuizViewer = dynamic(
  () => import('./QuizViewer').then((mod) => mod.QuizViewer),
  {
    ssr: false,
    loading: () => (
      <div className="p-8 text-center text-slate-500 text-xs font-medium border border-slate-200 bg-white">
        Đang tải bài trắc nghiệm Quiz...
      </div>
    ),
  }
);

interface ReviewSectionProps {
  note: StructuredNote;
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({ note, flashcards, quiz }) => {
  const [activeTab, setActiveTab] = useState<'flashcard' | 'quiz' | 'feynman'>('flashcard');

  return (
    <div className="sharp-card p-4 sm:p-6 space-y-5">
      {/* Tab Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-200 pb-3.5 gap-3">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-blue-600 shrink-0" />
          <div>
            <h2 className="text-xs sm:text-sm font-extrabold text-zinc-950 leading-none">Góc Ôn Tập Kiến Thức AI</h2>
            <p className="text-[10.5px] text-zinc-500 font-medium mt-0.5">Flashcards, Quiz trắc nghiệm & Tự giảng giải</p>
          </div>
        </div>

        {/* 3 Review Tabs - Sharp Squared */}
        <div className="flex border border-slate-300 bg-slate-100 p-0.5 gap-0.5">
          <button
            onClick={() => setActiveTab('flashcard')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors ${
              activeTab === 'flashcard'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Flashcards ({flashcards.length})
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors ${
              activeTab === 'quiz'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Quiz ({quiz.length})
          </button>

          <button
            onClick={() => setActiveTab('feynman')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors ${
              activeTab === 'feynman'
                ? 'bg-amber-400 text-amber-950 border border-amber-500'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquareQuote className="w-3.5 h-3.5" />
            Tự giải thích
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="pt-1">
        {activeTab === 'flashcard' && <FlashcardViewer cards={flashcards} />}
        {activeTab === 'quiz' && <QuizViewer questions={quiz} />}
        {activeTab === 'feynman' && <FeynmanSelfCheck note={note} />}
      </div>
    </div>
  );
};
