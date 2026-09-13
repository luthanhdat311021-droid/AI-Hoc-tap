-- SQL Script để tạo bảng lưu trữ bài học trên Supabase Database
-- Bạn hãy dán đoạn code SQL này vào phần SQL Editor trên Dashboard Supabase của bạn và nhấn Run.

CREATE TABLE IF NOT EXISTS public.learning_sessions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at TEXT NOT NULL,
    input_type TEXT NOT NULL,
    source_name TEXT,
    structured_note JSONB NOT NULL,
    mindmap JSONB NOT NULL,
    flashcards JSONB NOT NULL,
    quiz JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Cấp quyền truy cập công khai (nếu không dùng Auth)
ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.learning_sessions FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.learning_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.learning_sessions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.learning_sessions FOR DELETE USING (true);
