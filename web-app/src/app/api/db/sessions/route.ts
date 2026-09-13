import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres.gwynjmlqymojrdlpzukn:Thanhdat%40310306@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 3000,
      idleTimeoutMillis: 5000,
      max: 3
    });
  }
  return pool;
}

async function ensureTableExists(p: Pool) {
  const createTableQuery = `
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
  `;
  try {
    await p.query(createTableQuery);
  } catch (err) {
    console.error('Error ensuring table exists:', err);
  }
}

export async function GET() {
  try {
    const p = getPool();
    await ensureTableExists(p);

    const { rows } = await p.query(
      'SELECT id, title, created_at, input_type, source_name, structured_note, mindmap, flashcards, quiz FROM public.learning_sessions ORDER BY updated_at DESC'
    );

    const sessions = rows.map((r) => ({
      id: r.id,
      title: r.title,
      createdAt: r.created_at,
      inputType: r.input_type,
      sourceName: r.source_name,
      structuredNote: r.structured_note,
      mindmap: r.mindmap,
      flashcards: r.flashcards,
      quiz: r.quiz
    }));

    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.warn('GET DB sessions notice (using local fallback):', error.message);
    return NextResponse.json({ sessions: [], warning: error.message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await req.json();
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Thiếu thông tin session' }, { status: 400 });
    }

    const p = getPool();
    await ensureTableExists(p);

    const query = `
      INSERT INTO public.learning_sessions (id, title, created_at, input_type, source_name, structured_note, mindmap, flashcards, quiz, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        created_at = EXCLUDED.created_at,
        input_type = EXCLUDED.input_type,
        source_name = EXCLUDED.source_name,
        structured_note = EXCLUDED.structured_note,
        mindmap = EXCLUDED.mindmap,
        flashcards = EXCLUDED.flashcards,
        quiz = EXCLUDED.quiz,
        updated_at = NOW();
    `;

    await p.query(query, [
      session.id,
      session.title || 'Bài học',
      session.createdAt || new Date().toISOString(),
      session.inputType || 'text',
      session.sourceName || '',
      JSON.stringify(session.structuredNote || {}),
      JSON.stringify(session.mindmap || {}),
      JSON.stringify(session.flashcards || []),
      JSON.stringify(session.quiz || [])
    ]);

    return NextResponse.json({ success: true, message: 'Đã lưu vĩnh viễn vào Supabase Database!' });
  } catch (error: any) {
    console.error('POST DB session error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi lưu bài học vào Supabase DB' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Thiếu id bài học' }, { status: 400 });
    }

    const p = getPool();
    await ensureTableExists(p);

    await p.query('DELETE FROM public.learning_sessions WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE DB session error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi xóa bài học' }, { status: 500 });
  }
}
