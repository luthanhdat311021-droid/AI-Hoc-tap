import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { BUZAN_MINDMAP_SYSTEM_PROMPT } from '@/constants/mindmapPrompt';

export function convertNodeDataToFlatNodesAndEdges(nodeData: any, arrows: any[] = []) {
  const nodes: any[] = [];
  const edges: any[] = [];

  function traverse(node: any, parentId?: string, depth: number = 0) {
    if (!node) return;
    const category = depth === 0 ? 'root' : depth === 1 ? 'core' : 'detail';
    const id = node.id || `node_${nodes.length + 1}`;
    nodes.push({
      id,
      label: node.topic || 'Khái niệm',
      feynmanExplanation: node.feynmanExplanation || `Giải thích chi tiết cho ${node.topic}`,
      category
    });

    if (parentId) {
      edges.push({
        from: parentId,
        to: id,
        label: depth === 1 ? 'gồm có' : 'chi tiết'
      });
    }

    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child: any) => traverse(child, id, depth + 1));
    }
  }

  traverse(nodeData);

  if (Array.isArray(arrows)) {
    arrows.forEach((arr, idx) => {
      if (arr.from && arr.to) {
        edges.push({
          id: arr.id || `arrow_${idx + 1}`,
          from: arr.from,
          to: arr.to,
          label: arr.label || 'liên kết'
        });
      }
    });
  }

  return { nodes, edges };
}

export async function generateBuzanMindmapFromNote(params: {
  noteContent: string;
  geminiKey?: string;
  groqKey?: string;
}): Promise<{ nodeData: any; arrows: any[]; nodes: any[]; edges: any[] } | null> {
  const { noteContent, geminiKey, groqKey } = params;

  const userPrompt = `Dưới đây là nội dung ghi chú/tài liệu học tập cần chuyển hóa thành Mindmap phong cách Tony Buzan:\n\n${noteContent}\n\nHãy phân tích và trả về CHỈ JSON đúng cấu trúc { "nodeData": { ... }, "arrows": [ ... ] } theo đúng System Prompt. Tối thiểu 5–8 nhánh cấp 1, mỗi nhánh cấp 1 có 2–5 nhánh cấp 2, tiếp tục mở rộng cấp 3 nếu có chi tiết.`;

  // Try Gemini with high output tokens
  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.0-flash-lite'];
      for (const m of models) {
        try {
          const res = await ai.models.generateContent({
            model: m,
            contents: `${BUZAN_MINDMAP_SYSTEM_PROMPT}\n\n---\n\n${userPrompt}`,
            config: {
              maxOutputTokens: 4096,
              temperature: 0.2,
              responseMimeType: 'application/json'
            }
          });
          const text = res.text;
          if (text) {
            const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(clean);
            if (parsed && parsed.nodeData) {
              const flat = convertNodeDataToFlatNodesAndEdges(parsed.nodeData, parsed.arrows || []);
              return {
                nodeData: parsed.nodeData,
                arrows: parsed.arrows || [],
                nodes: flat.nodes,
                edges: flat.edges
              };
            }
          }
        } catch (err: any) {
          console.warn(`Gemini mindmap model ${m} failed:`, err?.message || err);
        }
      }
    } catch (e: any) {
      console.warn('Gemini mindmap client error:', e?.message || e);
    }
  }

  // Try Groq with high output tokens
  const activeGroqKey = groqKey || process.env.GROQ_API_KEY || '';
  if (activeGroqKey) {
    const groqModels = ['groq/compound-mini', 'groq/compound', 'openai/gpt-oss-120b', 'qwen/qwen3.8-27b'];
    for (const m of groqModels) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${activeGroqKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: m,
            messages: [
              { role: 'system', content: BUZAN_MINDMAP_SYSTEM_PROMPT },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.2,
            max_tokens: 4096,
            response_format: { type: 'json_object' }
          })
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          const text = data.choices?.[0]?.message?.content || '';
          if (text) {
            const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(clean);
            if (parsed && parsed.nodeData) {
              const flat = convertNodeDataToFlatNodesAndEdges(parsed.nodeData, parsed.arrows || []);
              return {
                nodeData: parsed.nodeData,
                arrows: parsed.arrows || [],
                nodes: flat.nodes,
                edges: flat.edges
              };
            }
          }
        }
      } catch (err: any) {
        console.warn(`Groq mindmap model ${m} failed:`, err?.message || err);
      }
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { noteContent, structuredNote, apiKey, geminiKey, groqKey } = body;

    const gKey = geminiKey || (apiKey && !apiKey.startsWith('gsk_') ? apiKey : '') || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    const qKey = groqKey || (apiKey && apiKey.startsWith('gsk_') ? apiKey : '') || process.env.GROQ_API_KEY || '';

    if (!gKey && !qKey) {
      return NextResponse.json({ error: 'Thiếu API Key cho AI (Gemini hoặc Groq)' }, { status: 400 });
    }

    let formattedNote = noteContent || '';
    if (!formattedNote && structuredNote) {
      formattedNote = `Tiêu đề: ${structuredNote.title || ''}\nTóm tắt: ${structuredNote.summary || ''}\n\n`;
      if (structuredNote.sections && Array.isArray(structuredNote.sections)) {
        structuredNote.sections.forEach((sec: any, idx: number) => {
          formattedNote += `\n[Phần ${idx + 1}: ${sec.heading}]\n`;
          if (sec.points) formattedNote += `- Ý chính: ${sec.points.join('; ')}\n`;
          if (sec.subPoints) formattedNote += `- Ý phụ: ${sec.subPoints.join('; ')}\n`;
          if (sec.examples) formattedNote += `- Ví dụ: ${sec.examples.join('; ')}\n`;
        });
      }
      if (structuredNote.keyConcepts && Array.isArray(structuredNote.keyConcepts)) {
        formattedNote += '\n[Khái niệm quan trọng]:\n';
        structuredNote.keyConcepts.forEach((kc: any) => {
          formattedNote += `* ${kc.term}: ${kc.definition}\n`;
        });
      }
    }

    const result = await generateBuzanMindmapFromNote({
      noteContent: formattedNote,
      geminiKey: gKey,
      groqKey: qKey
    });

    if (!result) {
      return NextResponse.json({ error: 'Không thể sinh Mindmap từ AI. Vui lòng thử lại.' }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('generate-mindmap route error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi sinh mindmap' }, { status: 500 });
  }
}
