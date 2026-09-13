'use client';

import React, { useState, useEffect } from 'react';
import { X, Key, Check, Info, ShieldCheck, Zap, ExternalLink } from 'lucide-react';
import { storageService } from '@/services/storageService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [geminiKey, setGeminiKey] = useState('');
  const [groqKey, setGroqKey] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setGeminiKey(storageService.getGeminiKey());
      setGroqKey(storageService.getGroqKey());
      const sbConfig = storageService.getSupabaseConfig();
      setSupabaseUrl(sbConfig.url);
      setSupabaseAnonKey(sbConfig.anonKey);
      setSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    storageService.saveBothKeys(geminiKey, groqKey);
    storageService.saveSupabaseConfig(supabaseUrl, supabaseAnonKey);
    setSaved(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border-2 border-blue-600 shadow-xl max-w-md w-full p-5 sm:p-6 space-y-4 rounded-none animate-in fade-in duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-600 text-white border border-blue-700 rounded-none">
              <Key className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base uppercase tracking-wider">Cài đặt AI Engine & Database</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 p-1.5 hover:bg-slate-100 rounded-none transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3.5">
          <p className="text-xs text-zinc-600 leading-relaxed font-medium">
            Hệ thống hỗ trợ <strong>kết hợp AI Engine + Supabase DB</strong> để lưu trữ lịch sử bài học vĩnh viễn trực tuyến.
          </p>

          {/* Gemini API Key Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                1. Google Gemini API Key
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-blue-600 underline font-bold hover:text-blue-900 flex items-center gap-0.5"
              >
                Lấy Key Gemini <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AQ... hoặc AIzaSy... (Gemini Flash)"
              className="w-full bg-slate-50 border border-slate-300 rounded-none px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
            />
          </div>

          {/* Groq API Key Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                2. Groq Cloud API Key (Free & Siêu tốc)
              </label>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-amber-900 underline font-bold hover:text-black flex items-center gap-0.5"
              >
                Lấy Key Groq <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              placeholder="gsk_... (Dự phòng phản hồi siêu tốc)"
              className="w-full bg-amber-50/50 border border-amber-300 rounded-none px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all"
            />
          </div>

          {/* Supabase Database Inputs */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                3. Supabase Database Config (Tự động lưu lịch sử)
              </label>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-emerald-700 underline font-bold hover:text-emerald-950 flex items-center gap-0.5"
              >
                Supabase Dashboard <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://xyz...supabase.co (Supabase URL)"
              className="w-full bg-emerald-50/40 border border-emerald-300 rounded-none px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
            />
            <input
              type="password"
              value={supabaseAnonKey}
              onChange={(e) => setSupabaseAnonKey(e.target.value)}
              placeholder="eyJhbGci... (Supabase anon/public key)"
              className="w-full bg-emerald-50/40 border border-emerald-300 rounded-none px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
            />
            <p className="text-[10.5px] text-slate-500 font-medium">
              💡 Chạy file SQL <code className="bg-slate-200 px-1 py-0.5 font-bold">supabase_schema.sql</code> trong Supabase SQL Editor để khởi tạo bảng <code className="bg-slate-200 px-1 font-bold">learning_sessions</code>.
            </p>
          </div>

          <div className="p-2.5 bg-slate-100 border border-slate-300 text-[11px] text-slate-700 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              Tự động Đồng bộ DB
            </div>
            <p className="leading-relaxed font-medium">
              Mỗi khi hoàn tất phân tích bài học, kết quả sẽ được <strong>lưu trực tiếp vào Supabase Database</strong> để bạn không bao giờ mất lịch sử học tập!
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            onClick={onClose}
            className="sharp-btn-secondary px-4 py-2 touch-target text-xs"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="sharp-btn-primary px-5 py-2 flex items-center gap-1.5 touch-target text-xs"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                Đã lưu Cài đặt!
              </>
            ) : (
              'Lưu Cài Đặt'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

