import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const { originalNote, userExplanation, apiKey } = await req.json();
    const key =
      apiKey ||
      process.env.GROQ_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!key) {
      return NextResponse.json({ error: 'Thiếu API Key (Groq hoặc Gemini)' }, { status: 400 });
    }

    const promptText = `Bạn là một giám khảo kỹ tính nhưng truyền cảm hứng áp dụng phương pháp Feynman.
So sánh lời giải thích của người dùng với bài học gốc dưới đây:

[BÀI HỌC GỐC]
Tiêu đề: ${originalNote.title}
Ý chính: ${originalNote.summary}
Các phần: ${JSON.stringify(originalNote.sections)}

[LỜI GIẢI THÍCH CỦA NGƯỜI DÙNG]
"${userExplanation}"

Hãy chấm điểm và nhận xét theo định dạng JSON chuẩn (KHÔNG BỌC CODEBLOCK):
{
  "score": 8,
  "verdict": "Xuất sắc",
  "missingPoints": ["Ý quan trọng 1 bị bỏ sót", "Ví dụ thực tế chưa có"],
  "incorrectOrVaguePoints": ["Điểm diễn đạt chưa chính xác hoặc còn vẹt"],
  "simplifiedSuggestion": "Diễn đạt lại siêu đơn giản kiểu Feynman chuẩn",
  "feedbackSummary": "Nhận xét tổng quan động viên người học ngắn gọn 2 câu"
}`;

    let responseText = '';

    if (key.startsWith('gsk_')) {
      const groqModels = ['groq/compound', 'groq/compound-mini', 'openai/gpt-oss-120b'];
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
              messages: [{ role: 'user', content: promptText }],
              temperature: 0.2
            })
          });

          if (groqRes.ok) {
            const groqData = await groqRes.json();
            responseText = groqData.choices?.[0]?.message?.content || '';
            if (responseText) break;
          }
        } catch (e) {
          console.warn(`Groq evaluate model ${m} error:`, e);
        }
      }

      if (!responseText) {
        return NextResponse.json({ error: 'Lỗi gọi Groq API' }, { status: 500 });
      }
    } else {
      const ai = new GoogleGenAI({ apiKey: key });
      const modelsToTry = ['gemini-3.6-flash', 'gemini-3.0-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
      let lastError: any = null;

      for (const modelName of modelsToTry) {
        try {
          const res = await ai.models.generateContent({
            model: modelName,
            contents: promptText
          });
          if (res && res.text) {
            responseText = res.text;
            break;
          }
        } catch (err) {
          lastError = err;
        }
      }

      if (!responseText) {
        return NextResponse.json({ error: `Gemini Error: ${lastError?.message || 'Lỗi Gemini API'}` }, { status: 500 });
      }
    }

    const cleanJsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanJsonStr);
    return NextResponse.json({ result });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lỗi xử lý đánh giá Feynman' }, { status: 500 });
  }
}
