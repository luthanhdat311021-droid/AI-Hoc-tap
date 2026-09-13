'use client';

import React, { useState } from 'react';
import { QuizQuestion } from '@/types/feynman';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Award, HelpCircle, Lightbulb } from 'lucide-react';

interface QuizViewerProps {
  questions: QuizQuestion[];
}

export const QuizViewer: React.FC<QuizViewerProps> = ({ questions }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});
  const [isCompleted, setIsCompleted] = useState(false);

  if (!questions || questions.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs font-medium border border-slate-200 rounded-none bg-white">
        Chưa có câu hỏi trắc nghiệm nào cho bài học này.
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const selectedIdx = selectedAnswers[currentIndex];
  const isAnswered = selectedIdx !== undefined;

  const handleSelectOption = (optionIndex: number) => {
    if (isAnswered || isCompleted) return;
    setSelectedAnswers(prev => ({ ...prev, [currentIndex]: optionIndex }));
    setShowExplanation(prev => ({ ...prev, [currentIndex]: true }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setShowExplanation({});
    setIsCompleted(false);
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        score += 1;
      }
    });
    return score;
  };

  const totalQuestions = questions.length;
  const correctCount = calculateScore();

  if (isCompleted) {
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    return (
      <div className="max-w-xl mx-auto bg-white border-2 border-blue-600 p-6 sm:p-8 space-y-6 shadow-sm rounded-none text-center">
        <div className="w-16 h-16 mx-auto bg-amber-100 border-2 border-amber-500 flex items-center justify-center text-amber-600">
          <Award className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
            Kết quả Trắc nghiệm Feynman AI
          </h3>
          <p className="text-xs text-slate-600 font-medium">
            Bạn đã hoàn thành bộ {totalQuestions} câu hỏi kiểm tra kiến thức bài học.
          </p>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 space-y-1 font-mono">
          <div className="text-3xl font-black text-blue-600">
            {correctCount} / {totalQuestions}
          </div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Tỷ lệ chính xác: {percentage}%
          </p>
        </div>

        <div className="text-xs text-slate-700 font-medium leading-relaxed bg-blue-50/50 p-3 border border-blue-200 text-left">
          💡 <strong>Gợi ý Feynman:</strong>{' '}
          {percentage >= 80
            ? 'Xuất sắc! Bạn đã thông hiểu rất sâu bản chất bài học. Hãy chuyển sang phần Tự giảng giải Feynman để củng cố trí nhớ dài hạn!'
            : percentage >= 50
            ? 'Khá tốt! Bạn đã nắm được đa số các ý chính. Hãy xem lại các câu trả lời chưa đúng bên dưới để khắc phục lỗ hổng.'
            : 'Cần xem lại! Hãy đọc lại phần Ghi chú Cấu trúc Feynman để nắm chắc 20% kiến thức đòn bẩy trước khi làm lại trắc nghiệm.'}
        </div>

        <button
          onClick={handleRestart}
          className="w-full sharp-btn-primary py-3 text-xs uppercase tracking-wider font-extrabold flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Làm lại bài trắc nghiệm
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white border border-slate-300 p-4 sm:p-6 shadow-xs space-y-5 rounded-none">
      {/* Header Progress */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 bg-blue-600 text-white font-black text-xs font-mono">
            {currentIndex + 1} / {totalQuestions}
          </div>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Câu hỏi trắc nghiệm
          </span>
        </div>
        <div className="w-32 bg-slate-100 h-2 border border-slate-300 overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Text */}
      <div className="space-y-1">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
          {currentQ.question}
        </h3>
      </div>

      {/* Options List */}
      <div className="space-y-2.5 pt-1">
        {currentQ.options.map((option, optIdx) => {
          const isSelected = selectedIdx === optIdx;
          const isCorrect = optIdx === currentQ.correctIndex;
          
          let btnClass = 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100 hover:border-slate-400';
          if (isAnswered) {
            if (isCorrect) {
              btnClass = 'bg-emerald-50 border-emerald-600 text-emerald-950 font-bold';
            } else if (isSelected) {
              btnClass = 'bg-rose-50 border-rose-600 text-rose-950 font-bold';
            } else {
              btnClass = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
            }
          }

          return (
            <button
              key={optIdx}
              onClick={() => handleSelectOption(optIdx)}
              disabled={isAnswered}
              className={`w-full text-left p-3 text-xs sm:text-sm border transition-all flex items-start gap-3 rounded-none ${btnClass}`}
            >
              <div className="shrink-0 mt-0.5">
                {isAnswered && isCorrect ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : isAnswered && isSelected && !isCorrect ? (
                  <XCircle className="w-4 h-4 text-rose-600" />
                ) : (
                  <div className={`w-4 h-4 border flex items-center justify-center text-[10px] font-bold ${
                    isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-400 text-slate-600'
                  }`}>
                    {String.fromCharCode(65 + optIdx)}
                  </div>
                )}
              </div>
              <span className="leading-relaxed font-medium">{option}</span>
            </button>
          );
        })}
      </div>

      {/* Explanation Box */}
      {showExplanation[currentIndex] && (
        <div className={`p-3.5 border text-xs leading-relaxed space-y-1 animate-in fade-in duration-200 ${
          selectedIdx === currentQ.correctIndex
            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
            : 'bg-rose-50/80 border-rose-300 text-rose-950'
        }`}>
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
            <Lightbulb className="w-4 h-4 shrink-0 text-amber-600" />
            Giải thích bản chất Feynman:
          </div>
          <p className="font-medium">{currentQ.explanation}</p>
        </div>
      )}

      {/* Action Controls */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-200">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="sharp-btn-secondary px-3 py-1.5 text-xs disabled:opacity-30 touch-target"
        >
          Câu trước
        </button>

        <button
          onClick={handleNext}
          disabled={!isAnswered}
          className="sharp-btn-primary px-4 py-2 text-xs flex items-center gap-1.5 uppercase tracking-wider font-bold disabled:opacity-40 touch-target"
        >
          {currentIndex === totalQuestions - 1 ? 'Xem kết quả' : 'Câu tiếp theo'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

