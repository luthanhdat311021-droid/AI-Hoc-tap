'use client';

import React, { useState } from 'react';
import { StructuredNote, KeyConcept } from '@/types/feynman';
import { FileText, Edit2, Check, Bookmark, Lightbulb, ChevronRight, BookOpen } from 'lucide-react';

interface StructuredNotesProps {
  note: StructuredNote;
  onUpdateNote?: (updated: StructuredNote) => void;
}

export const StructuredNotes: React.FC<StructuredNotesProps> = ({ note, onUpdateNote }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedNote, setEditedNote] = useState<StructuredNote>(note);

  const handleSave = () => {
    setIsEditing(false);
    if (onUpdateNote) {
      onUpdateNote(editedNote);
    }
  };

  return (
    <div className="sharp-card p-5 sm:p-7 space-y-6">
      {/* Header & Controls */}
      <div className="flex items-start justify-between border-b border-slate-200 pb-4 gap-3">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-blue-600 text-white border border-blue-700">
              Ghi chú cấu trúc Feynman
            </span>
          </div>
          {isEditing ? (
            <input
              type="text"
              value={editedNote.title}
              onChange={(e) => setEditedNote({ ...editedNote, title: e.target.value })}
              className="text-base sm:text-xl font-bold text-slate-900 border-b-2 border-blue-600 focus:outline-none w-full bg-slate-50 px-2 py-1"
            />
          ) : (
            <h2 className="text-base sm:text-xl font-extrabold text-slate-900 leading-snug tracking-tight">
              {editedNote.title}
            </h2>
          )}
        </div>

        <button
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          className="flex items-center gap-1.5 sharp-btn-secondary text-xs px-3.5 py-2 transition-colors shrink-0 touch-target"
        >
          {isEditing ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              Lưu bài
            </>
          ) : (
            <>
              <Edit2 className="w-3.5 h-3.5 text-blue-600" />
              Sửa bài
            </>
          )}
        </button>
      </div>

      {/* Summary Box (Feynman Style Callout) */}
      <div className="bg-amber-50 border-l-4 border-amber-500 border-t border-r border-b border-amber-200 p-4 sm:p-5 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
          <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
          Bản chất cốt lõi (Tóm tắt kiểu Feynman):
        </div>
        {isEditing ? (
          <textarea
            value={editedNote.summary}
            onChange={(e) => setEditedNote({ ...editedNote, summary: e.target.value })}
            rows={2}
            className="w-full text-xs text-amber-950 bg-white border border-amber-300 p-2.5 focus:outline-none focus:border-amber-600 font-medium"
          />
        ) : (
          <p className="text-xs sm:text-sm text-amber-900 leading-relaxed font-medium">
            {editedNote.summary}
          </p>
        )}
      </div>

      {/* Key Concepts Highlights */}
      {editedNote.keyConcepts && editedNote.keyConcepts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-blue-600" />
            Khái niệm trọng tâm
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {editedNote.keyConcepts.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 border border-slate-300 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900">{item.term}</span>
                  <span
                    className={`text-[9.5px] px-2 py-0.5 font-extrabold uppercase border ${
                      item.importance === 'high'
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-amber-400 text-amber-950 border-amber-500'
                    }`}
                  >
                    {item.importance === 'high' ? 'Trọng tâm' : 'Phụ'}
                  </span>
                </div>
                <p className="text-[11.5px] text-slate-600 leading-relaxed font-medium">{item.definition}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Structured Sections */}
      <div className="space-y-6 pt-2">
        {editedNote.sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-3 border-b border-slate-200 pb-5 last:border-b-0">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-blue-600 shrink-0" />
              {section.heading}
            </h3>

            {/* Main points */}
            <ul className="space-y-2 pl-4 sm:pl-6 text-xs text-slate-800 leading-relaxed">
              {section.points.map((pt, pIdx) => (
                <li key={pIdx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 shrink-0 mt-1.5" />
                  <span className="font-semibold text-slate-900">{pt}</span>
                </li>
              ))}
            </ul>

            {/* Sub points */}
            {section.subPoints && section.subPoints.length > 0 && (
              <ul className="space-y-1.5 pl-8 sm:pl-10 text-[11.5px] text-slate-600">
                {section.subPoints.map((sub, subIdx) => (
                  <li key={subIdx} className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-emerald-500 shrink-0 mt-1.5" />
                    <span>{sub}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Real-life Examples */}
            {section.examples && section.examples.length > 0 && (
              <div className="ml-4 sm:ml-6 mt-3 p-3 bg-blue-50 border border-blue-200 text-xs text-blue-950 font-medium space-y-1">
                <span className="font-bold text-blue-900">Ví dụ minh họa thực tế: </span>
                <p className="leading-relaxed text-blue-900">{section.examples.join(' • ')}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};


