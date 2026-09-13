'use client';

import React, { useState } from 'react';
import { Flashcard } from '@/types/feynman';
import { FlashcardArray, useFlashcardArray } from 'react-quizlet-flashcard';
import { Award, CheckCircle2, XCircle, Layers } from 'lucide-react';
import 'react-quizlet-flashcard/dist/index.css';

interface FlashcardViewerProps {
  cards: Flashcard[];
}

export const FlashcardViewer: React.FC<FlashcardViewerProps> = ({ cards: initialCards }) => {
  const [cards, setCards] = useState<Flashcard[]>(initialCards);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const controls = useFlashcardArray({
    deckLength: cards.length,
    onCardChange: (index: number) => setCurrentCardIndex(index)
  });

  if (!cards || cards.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-500 text-xs font-medium border border-zinc-200 bg-white sharp-card">
        Chưa có thẻ Flashcard nào cho bài học này.
      </div>
    );
  }

  const rememberedCount = cards.filter((c) => c.status === 'remembered').length;
  const progressPercent = Math.round((rememberedCount / cards.length) * 100);

  const handleMarkStatus = (status: 'remembered' | 'forgotten') => {
    const updated = [...cards];
    updated[currentCardIndex] = { ...updated[currentCardIndex], status };
    setCards(updated);
  };

  const deck = cards.map((c, idx) => ({
    front: {
      html: (
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 h-full select-none bg-white">
          <span className="px-2.5 py-0.5 text-[9.5px] font-extrabold uppercase bg-blue-600 text-white border border-blue-700">
            Mặt trước: Khái niệm / Câu hỏi ({idx + 1}/{cards.length})
          </span>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug tracking-tight">
            {c.question}
          </h3>
          {c.hint && (
            <p className="text-xs text-amber-950 bg-amber-100 px-2.5 py-1 border border-amber-300 font-medium mt-2">
              💡 Gợi ý: {c.hint}
            </p>
          )}
          <p className="text-[10.5px] text-slate-400 font-medium pt-2">Chạm để lật mặt sau</p>
        </div>
      )
    },
    back: {
      html: (
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 h-full select-none bg-emerald-50/40 border border-emerald-200">
          <span className="px-2.5 py-0.5 text-[9.5px] font-extrabold uppercase bg-emerald-600 text-white border border-emerald-700">
            Mặt sau: Giải thích Feynman
          </span>
          <p className="text-sm sm:text-base text-slate-900 font-semibold leading-relaxed">
            {c.answer}
          </p>
          <p className="text-[10.5px] text-emerald-700 font-medium pt-2">Chạm để xoay lại mặt trước</p>
        </div>
      )
    }
  }));

  return (
    <div className="space-y-5 max-w-xl mx-auto sharp-card p-4 sm:p-6 bg-white">
      {/* Header & Progress Stats */}
      <div className="flex items-center justify-between text-xs text-slate-700 font-bold border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          <span className="font-extrabold text-slate-900">Bộ Thẻ Flashcard Quizlet</span>
        </div>
        <span className="text-slate-900 flex items-center gap-1.5 font-extrabold bg-slate-100 border border-slate-300 px-3 py-1">
          <Award className="w-4 h-4 text-emerald-600" />
          Đã nhớ: {rememberedCount}/{cards.length} ({progressPercent}%)
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2.5 bg-slate-200 border border-slate-300 p-0.5">
        <div
          className="h-full bg-emerald-600 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* React Quizlet Flashcard Array Component */}
      <div className="flex justify-center my-4 overflow-hidden sharp-card p-2 bg-slate-50">
        <FlashcardArray
          deck={deck}
          flipArrayHook={controls}
        />
      </div>

      {/* Self Assessment Action Buttons */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200">
        <button
          onClick={() => handleMarkStatus('forgotten')}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 text-xs font-bold transition-colors touch-target"
        >
          <XCircle className="w-4 h-4" />
          Đánh dấu: Chưa nhớ
        </button>
        <button
          onClick={() => handleMarkStatus('remembered')}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 text-xs font-bold transition-colors touch-target"
        >
          <CheckCircle2 className="w-4 h-4" />
          Đánh dấu: Đã nhớ
        </button>
      </div>
    </div>
  );
};
