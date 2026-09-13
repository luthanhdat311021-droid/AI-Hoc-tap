import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { convertNodeDataToFlatNodesAndEdges } from '@/app/api/ai/generate-mindmap/route';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const type = formData.get('type') as string;
    const text = formData.get('text') as string | null;
    const fileName = formData.get('fileName') as string | null;
    const file = formData.get('file') as File | null;
    const passedApiKey = formData.get('apiKey') as string | null;
    const passedGeminiKey = formData.get('geminiKey') as string | null;
    const passedGroqKey = formData.get('groqKey') as string | null;

    const geminiKey =
      passedGeminiKey ||
      (passedApiKey && !passedApiKey.startsWith('gsk_') ? passedApiKey : '') ||
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      '';

    const groqKey =
      passedGroqKey ||
      (passedApiKey && passedApiKey.startsWith('gsk_') ? passedApiKey : '') ||
      process.env.GROQ_API_KEY ||
      '';

    if (!geminiKey && !groqKey) {
      return NextResponse.json({ error: 'Thiếu API Key (Groq hoặc Gemini)' }, { status: 400 });
    }

    const promptText = `CẢNH BÁO QUAN TRỌNG:
BÓC TÁCH VÀ PHÂN TÍCH CHUYÊN SÂU NỘI DUNG CỦA CHÍNH TÀI LIỆU/VĂN BẢN/HÌNH ẢNH ĐƯỢC TẢI LÊN.
KHÔNG GIẢI THÍCH "PHƯƠNG PHÁP FEYNMAN LÀ GÌ". Dùng văn phong bình dân, trực quan, dễ hiểu.

Hãy phân tích và trả về CHÍNH XÁC NỘI DUNG NÀY dưới dạng JSON nguyên thể:
{
  "structuredNote": {
    "title": "Tiêu đề chính xác từ bài học",
    "summary": "Tóm tắt 2-3 câu bản chất cốt lõi siêu dễ hiểu kiểu Feynman",
    "sections": [
      {
        "heading": "1. Tiêu đề mục chính từ bài học",
        "points": ["Ý chính 1 từ tài liệu", "Ý chính 2 từ tài liệu"],
        "subPoints": ["Ý phụ phân tích 1"],
        "examples": ["Ví dụ thực tế đời sống"]
      }
    ],
    "keyConcepts": [
      { "term": "Khái niệm trọng tâm", "definition": "Định nghĩa ngắn gọn", "importance": "high" }
    ]
  },
  "mindmap": {
    "nodeData": {
      "id": "root",
      "topic": "Tiêu đề bài học",
      "children": [
        {
          "id": "b1",
          "topic": "Nhánh 1",
          "children": [{ "id": "b1-1", "topic": "Chi tiết 1" }]
        }
      ]
    },
    "arrows": []
  },
  "flashcards": [
    { "id": "fc-1", "question": "Câu hỏi kiểm tra bản chất 1?", "answer": "Câu trả lời ngắn gọn", "hint": "Gợi ý nhớ nhanh", "status": "unseen" }
  ],
  "quiz": [
    {
      "id": "qz-1",
      "question": "Câu hỏi trắc nghiệm kiểm tra kiến thức?",
      "options": ["A. Đáp án 1", "B. Đáp án 2", "C. Đáp án 3", "D. Đáp án 4"],
      "correctIndex": 0,
      "explanation": "Giải thích ngắn gọn lý do đúng."
    }
  ]
}
Yêu cầu:
- "sections": 4-5 mục chính.
- "keyConcepts": 5-6 khái niệm.
- "flashcards": 6-8 thẻ flashcard chất lượng.
- "quiz": 5-6 câu hỏi trắc nghiệm.
- "mindmap": Phân tích chuyên sâu phong cách Tony Buzan: tối thiểu 5–8 nhánh cấp 1 (tỏa ra từ root id="root"), mỗi nhánh cấp 1 có 2–5 nhánh cấp 2, tiếp tục mở rộng cấp 3 nếu có chi tiết/ví dụ. Mỗi node chỉ chứa từ khóa ngắn (tối đa 3–6 từ). "arrows" chứa các liên kết ngang giữa các node khác nhánh nếu có (vd: label "cần trước", "dẫn đến").`;

    let responseText = '';

    const preferGemini = Boolean(file && geminiKey);
    const primaryEngine = preferGemini ? 'gemini' : (groqKey ? 'groq' : 'gemini');

    async function callGemini(key: string): Promise<string> {
      const ai = new GoogleGenAI({ apiKey: key });
      let contentsPayload: any;

      if (file) {
        const buffer = await file.arrayBuffer();
        const base64Data = Buffer.from(buffer).toString('base64');
        const mimeType = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/png');
        contentsPayload = [
          { inlineData: { mimeType, data: base64Data } },
          { text: promptText }
        ];
      } else {
        contentsPayload = `${promptText}\n\nNội dung cần phân tích:\n${text}`;
      }

      // Fast official Gemini models
      const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.0-flash-lite'];
      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: contentsPayload,
            config: {
              temperature: 0.2,
              responseMimeType: 'application/json'
            }
          });
          if (response && response.text) return response.text;
        } catch (err: any) {
          console.warn(`Gemini model ${modelName} failed:`, err?.message || err);
        }
      }
      return '';
    }

    async function callGroq(key: string): Promise<string> {
      let fileTextContent = text || '';
      if (file && (!fileTextContent || fileTextContent.trim().length === 0)) {
        if (file.type.startsWith('text/') || file.name.match(/\.(txt|md|csv|json|js|ts|py|html|xml|log)$/i)) {
          fileTextContent = await file.text();
        }
      }

      let userMessages: any[] = [];
      if (file && file.type.startsWith('image/')) {
        const buffer = await file.arrayBuffer();
        const base64Data = Buffer.from(buffer).toString('base64');
        const mimeType = file.type || 'image/png';
        userMessages = [
          {
            role: 'user',
            content: [
              { type: 'text', text: promptText },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } }
            ]
          }
        ];
      } else {
        const combinedContent = `${promptText}\n\nNội dung tài liệu cần phân tích (Tên file: ${fileName || 'Tài liệu'}):\n${fileTextContent || text || fileName || 'Phân tích tổng quan tài liệu'}`;
        userMessages = [{ role: 'user', content: combinedContent }];
      }

      // Verified active Groq models
      const groqModels = [
        'groq/compound-mini',
        'groq/compound',
        'openai/gpt-oss-120b',
        'qwen/qwen3.8-27b'
      ];

      for (const m of groqModels) {
        try {
          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${key}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: m,
              messages: userMessages,
              temperature: 0.2,
              max_tokens: 4096,
              response_format: { type: 'json_object' }
            })
          });

          if (groqRes.ok) {
            const groqData = await groqRes.json();
            const textOut = groqData.choices?.[0]?.message?.content || '';
            if (textOut) return textOut;
          } else {
            const errStr = await groqRes.text();
            console.warn(`Groq model ${m} failed (status ${groqRes.status}):`, errStr);
          }
        } catch (e) {
          console.warn(`Groq model ${m} failed:`, e);
        }
      }
      return '';
    }

    const FALLBACK_GROQ_KEY = process.env.GROQ_API_KEY || '';

    const validGeminiKey = geminiKey && !geminiKey.startsWith('AQ.') ? geminiKey : '';

    if (validGeminiKey) {
      responseText = await callGemini(validGeminiKey);
    }

    if (!responseText && groqKey) {
      responseText = await callGroq(groqKey);
    }

    if (!responseText) {
      responseText = await callGroq(FALLBACK_GROQ_KEY);
    }

    if (!responseText) {
      return NextResponse.json({ error: 'Không thể kết nối đến Gemini hoặc Groq API. Vui lòng kiểm tra lại API Key trong Cài đặt.' }, { status: 500 });
    }

    let cleanJsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBrace = cleanJsonStr.indexOf('{');
    const lastBrace = cleanJsonStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanJsonStr = cleanJsonStr.slice(firstBrace, lastBrace + 1);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(cleanJsonStr);
    } catch (parseErr) {
      console.warn('Initial JSON.parse failed, attempting repair:', parseErr);
      try {
        let repaired = cleanJsonStr;
        if (!repaired.endsWith('}')) repaired += '}';
        parsed = JSON.parse(repaired);
      } catch {
        throw parseErr;
      }
    }

    let finalMindmap: any = null;

    // Fast Single-Pass Mindmap processing (0ms overhead)
    if (parsed.mindmap && parsed.mindmap.nodeData) {
      const flat = convertNodeDataToFlatNodesAndEdges(parsed.mindmap.nodeData, parsed.mindmap.arrows || []);
      finalMindmap = {
        nodeData: parsed.mindmap.nodeData,
        arrows: parsed.mindmap.arrows || [],
        nodes: flat.nodes,
        edges: flat.edges
      };
    }

    // Instant Fallback mindmap if mindmap nodeData wasn't returned in single pass
    if (!finalMindmap || !finalMindmap.nodeData) {
      const rootTopic = parsed.structuredNote?.title || fileName || 'Chủ đề chính';
      const children: any[] = [];
      if (parsed.structuredNote?.sections && Array.isArray(parsed.structuredNote.sections)) {
        parsed.structuredNote.sections.forEach((sec: any, sIdx: number) => {
          const secChildren: any[] = [];
          if (sec.points && Array.isArray(sec.points)) {
            sec.points.forEach((pt: string, pIdx: number) => {
              secChildren.push({ id: `b${sIdx + 1}-${pIdx + 1}`, topic: pt.slice(0, 35) });
            });
          }
          children.push({
            id: `b${sIdx + 1}`,
            topic: (sec.heading || `Phần ${sIdx + 1}`).replace(/^\d+[\.\s]*/, '').slice(0, 35),
            children: secChildren.length > 0 ? secChildren : undefined
          });
        });
      }
      const fallbackNodeData = { id: 'root', topic: rootTopic, children };
      const flat = convertNodeDataToFlatNodesAndEdges(fallbackNodeData, []);
      finalMindmap = {
        nodeData: fallbackNodeData,
        arrows: [],
        nodes: flat.nodes,
        edges: flat.edges
      };
    }

    const session = {
      id: `session_${Date.now()}`,
      title: parsed.structuredNote?.title || `Bài học: ${fileName || 'Tài liệu'}`,
      createdAt: new Date().toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      }),
      inputType: type,
      sourceName: fileName || 'Tài liệu',
      structuredNote: parsed.structuredNote,
      mindmap: finalMindmap,
      flashcards: parsed.flashcards || [],
      quiz: parsed.quiz || []
    };

    return NextResponse.json({ session });

  } catch (error: any) {
    console.error('Analyze route error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi xử lý AI' }, { status: 500 });
  }
}
