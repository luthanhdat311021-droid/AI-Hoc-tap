'use client';

import React, { useState, useRef } from 'react';
import { FileText, Image as ImageIcon, Video, UploadCloud, Loader2, X, BookOpen } from 'lucide-react';
import { ProcessInputParams } from '@/services/aiService';

interface UploadSectionProps {
  onProcess: (params: ProcessInputParams) => void;
  isLoading: boolean;
  onCancelLoading?: () => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onProcess,
  isLoading,
  onCancelLoading
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [inputText, setInputText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (isLoading) return;

    if (activeTab === 'file' && selectedFile) {
      const ext = selectedFile.name.split('.').pop()?.toLowerCase() || '';
      let type: 'image' | 'pdf' | 'video' | 'text' = 'image';
      if (ext === 'pdf') type = 'pdf';
      else if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) type = 'video';
      else if (['txt', 'md', 'csv', 'json', 'js', 'ts', 'html', 'py', 'c', 'cpp', 'java'].includes(ext)) type = 'text';

      let extractedText: string | undefined = undefined;
      if (type === 'text') {
        try {
          extractedText = await selectedFile.text();
        } catch (e) {
          console.warn('Could not read text from file:', e);
        }
      }

      onProcess({
        type: type === 'text' ? 'text' : type,
        file: selectedFile,
        text: extractedText,
        fileName: selectedFile.name
      });
    } else if (activeTab === 'text' && inputText.trim()) {
      onProcess({
        type: 'text',
        text: inputText.trim(),
        fileName: 'Ghi chú văn bản'
      });
    }
  };

  return (
    <div className="sharp-card p-5 sm:p-6 space-y-5">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 gap-2">
        <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <UploadCloud className="w-4 h-4 text-blue-600" />
          Nguồn nội dung học tập
        </h2>

        {/* Tab Switcher */}
        <div className="flex border border-slate-300 bg-slate-100 p-0.5">
          <button
            onClick={() => setActiveTab('file')}
            className={`px-3 py-1.5 text-xs font-bold transition-colors ${
              activeTab === 'file'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tài liệu / Video
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`px-3 py-1.5 text-xs font-bold transition-colors ${
              activeTab === 'text'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Văn bản / Links
          </button>
        </div>
      </div>

      {/* File Upload Zone */}
      {activeTab === 'file' ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed p-6 text-center cursor-pointer transition-colors relative ${
            dragActive
              ? 'border-blue-600 bg-blue-50'
              : selectedFile
              ? 'border-emerald-600 bg-emerald-50'
              : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-blue-500'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          {selectedFile ? (
            <div className="flex items-center justify-between max-w-md mx-auto p-3 bg-white border-2 border-emerald-600 shadow-xs">
              <div className="flex items-center gap-3 text-left truncate">
                <div className="p-2 border border-emerald-300 bg-emerald-100">
                  {selectedFile.name.endsWith('.pdf') ? (
                    <FileText className="w-5 h-5 text-red-600 shrink-0" />
                  ) : selectedFile.type.startsWith('video') ? (
                    <Video className="w-5 h-5 text-emerald-700 shrink-0" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-blue-600 shrink-0" />
                  )}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900 truncate">{selectedFile.name}</p>
                  <p className="text-[10px] text-emerald-800 font-bold">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Đã chọn file
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                }}
                className="text-slate-500 hover:text-slate-900 p-1 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <div className="flex justify-center items-center gap-3">
                <span className="p-2.5 bg-white border border-slate-300 text-emerald-600"><FileText className="w-5 h-5" /></span>
                <span className="p-2.5 bg-white border border-slate-300 text-blue-600"><ImageIcon className="w-5 h-5" /></span>
                <span className="p-2.5 bg-white border border-slate-300 text-amber-500"><Video className="w-5 h-5" /></span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Nhấn để chọn file hoặc kéo thả tài liệu vào đây
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Hỗ trợ: PDF bài giảng, Ảnh chụp slide/sách, Video học tập (MP4/WebM)
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Text input Zone */
        <div className="space-y-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Dán ghi chú, nội dung đoạn văn bài học hoặc câu hỏi tại đây..."
            rows={5}
            className="w-full bg-slate-50 border border-slate-300 p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors leading-relaxed font-medium"
          />
        </div>
      )}

      {/* Action Submit / Loading */}
      {isLoading ? (
        <div className="flex items-center justify-between p-3.5 bg-amber-50 border-2 border-amber-400 text-xs text-amber-950">
          <div className="flex items-center gap-2.5">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
            <span className="font-semibold">AI đang phân tích & tổng hợp bài học theo phương pháp Feynman...</span>
          </div>
          {onCancelLoading && (
            <button
              onClick={onCancelLoading}
              className="text-xs text-amber-900 hover:text-black underline font-bold px-2 py-1"
            >
              Hủy
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <button
            onClick={handleSubmit}
            disabled={activeTab === 'file' ? !selectedFile : !inputText.trim()}
            className="w-full flex items-center justify-center gap-2 sharp-btn-primary text-xs sm:text-sm py-3 transition-colors touch-target disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <BookOpen className="w-4 h-4" />
            Phân tích & Tạo bài học Feynman
          </button>
          
          <p className="text-[11px] text-slate-500 font-medium text-center">
            💡 <strong>Mẹo:</strong> Nhập <strong>Gemini API Key</strong> miễn phí trong phần ⚙️ <strong>Cài đặt</strong> để AI quét trực tiếp 100% chữ từ file PDF & ảnh chụp bài giảng!
          </p>
        </div>
      )}
    </div>
  );
};


