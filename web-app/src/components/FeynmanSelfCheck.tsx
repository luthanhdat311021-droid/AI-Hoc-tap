'use client';

import React, { useState, useEffect } from 'react';
import { StructuredNote, FeynmanCheckResult } from '@/types/feynman';
import { aiService } from '@/services/aiService';
import { storageService } from '@/services/storageService';
import { Mic, MicOff, Send, Loader2, Lightbulb, AlertCircle, CheckCircle2, RefreshCw, MessageSquareQuote, Award } from 'lucide-react';

interface FeynmanSelfCheckProps {
  note: StructuredNote;
}

export const FeynmanSelfCheck: React.FC<FeynmanSelfCheckProps> = ({ note }) => {
  const [explanationText, setExplanationText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<FeynmanCheckResult | null>(null);

  // Web Speech API reference
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const reco = new SpeechRecognition();
        reco.continuous = true;
        reco.interimResults = true;
        reco.lang = 'vi-VN';

        reco.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setExplanationText((prev) => (prev ? prev + ' ' + transcript : transcript));
        };

        reco.onerror = (err: any) => {
          console.error('Speech recognition error:', err);
          setIsRecording(false);
        };

        reco.onend = () => {
          setIsRecording(false);
        };

        setRecognition(reco);
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!recognition) {
      alert('Trình duyệt của bạn không hỗ trợ thu âm trực tiếp (Web Speech API). Vui lòng nhập văn bản.');
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
    }
  };

  const handleEvaluate = async () => {
    if (!explanationText.trim() || isEvaluating) return;

    setIsEvaluating(true);
    try {
      const apiKey = storageService.getApiKey();
      const res = await aiService.evaluateFeynmanSelfCheck(note, explanationText.trim(), apiKey);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="bg-white border border-slate-300 rounded-none p-5 space-y-5 max-w-xl mx-auto shadow-xs">
      <div className="border-b border-slate-200 pb-3 space-y-1">
        <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
          <div className="p-1.5 bg-amber-400 text-amber-950 border border-amber-500 rounded-none">
            <MessageSquareQuote className="w-4 h-4" />
          </div>
          Tự giảng giải theo phương pháp Feynman
        </h3>
        <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
          Hãy diễn đạt bài học này theo cách của bạn như thể bạn đang truyền đạt lại cho một em nhỏ hoặc người bạn mới.
        </p>
      </div>

      {/* Textarea + Voice Input controls */}
      <div className="space-y-2">
        <div className="relative">
          <textarea
            value={explanationText}
            onChange={(e) => setExplanationText(e.target.value)}
            placeholder="Nhập lời giải thích của bạn tại đây... (Ví dụ: Bài này bản chất đơn giản là... vì khi xảy ra...)"
            rows={5}
            className="w-full bg-slate-50 border border-slate-300 rounded-none p-3.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all resize-y font-medium leading-relaxed"
          />
          <button
            type="button"
            onClick={toggleRecording}
            className={`absolute bottom-3 right-3 p-2.5 rounded-none transition-all touch-target ${
              isRecording
                ? 'bg-rose-600 text-white animate-pulse border border-rose-700'
                : 'bg-white border border-slate-300 text-slate-700 hover:text-blue-600 hover:bg-slate-100'
            }`}
            title={isRecording ? 'Dừng thu âm' : 'Nói trực tiếp bằng giọng nói (Tiếng Việt)'}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>

        {isRecording && (
          <p className="text-[11px] text-rose-600 font-bold animate-pulse flex items-center gap-1.5 px-1 font-mono">
            <Mic className="w-3.5 h-3.5" /> Đang thu âm giọng nói tiếng Việt... Nói để tự động chuyển thành văn bản.
          </p>
        )}
      </div>

      {/* Evaluate Button */}
      <button
        onClick={handleEvaluate}
        disabled={!explanationText.trim() || isEvaluating}
        className="w-full flex items-center justify-center gap-2 sharp-btn-primary py-3 transition-all touch-target disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isEvaluating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            AI đang đối chiếu & phân tích lỗ hổng kiến thức...
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4" />
            AI Chấm điểm & Gợi ý hoàn thiện
          </>
        )}
      </button>

      {/* Evaluation Result Card */}
      {result && (
        <div className="p-4 sm:p-5 bg-zinc-50 border border-zinc-300 rounded-none space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-3 gap-3">
            <div className="flex items-center gap-3">
              <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 bg-white border border-zinc-300 px-3.5 py-1.5 rounded-none">
                {result.score}<span className="text-xs font-normal text-zinc-500">/10</span>
              </div>
              <div>
                <span
                  className={`text-[9.5px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-none border ${
                    result.score >= 8
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : result.score >= 6
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-rose-100 text-rose-900 border-rose-300'
                  }`}
                >
                  {result.verdict}
                </span>
                <p className="text-xs font-semibold text-zinc-800 mt-1">{result.feedbackSummary}</p>
              </div>
            </div>
          </div>

          {/* Missing points */}
          {result.missingPoints && result.missingPoints.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-rose-700 flex items-center gap-1.5 uppercase tracking-wider">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Các ý quan trọng bạn chưa đề cập:
              </span>
              <ul className="list-disc pl-5 text-xs text-zinc-700 space-y-1 font-medium">
                {result.missingPoints.map((pt, idx) => (
                  <li key={idx}>{pt}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Simplified Feynman Suggestion */}
          {result.simplifiedSuggestion && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-none text-xs text-blue-950 space-y-1.5">
              <span className="font-bold text-blue-900 flex items-center gap-1.5 uppercase tracking-wider">
                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                Gợi ý diễn đạt kiểu Feynman:
              </span>
              <p className="leading-relaxed italic text-blue-900 font-medium">{result.simplifiedSuggestion}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

