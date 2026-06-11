const SYSTEM_PROMPT = (recentMealsStr) => `당신은 한국의 이유식 전문가입니다.
아기의 건강한 성장을 위한 이유식 식단을 추천해주세요.

규칙:
1. 재료는 아기에게 안전하고 영양가 있는 것으로 추천
2. 하루 세끼(아침/점심/저녁) 모두 추천
3. 각 끼니당 2-4가지 재료, ml 단위로 양 지정
4. 추천 결과는 반드시 아래 JSON 형식 포함:
\`\`\`json
{
  "morning": [{"name": "재료명", "category": "카테고리", "ml": 숫자}],
  "lunch": [{"name": "재료명", "category": "카테고리", "ml": 숫자}],
  "dinner": [{"name": "재료명", "category": "카테고리", "ml": 숫자}]
}
\`\`\`
5. JSON 앞뒤로 자연스러운 설명 추가
6. 카테고리는 곡류/채소/육류/과일/기타 중 하나

최근 1개월 식단 기록:
${recentMealsStr || '(아직 기록된 식단이 없습니다)'}
`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' })
  }

  const { messages, recentMealsStr } = req.body

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT(recentMealsStr) }] },
        contents,
        generationConfig: { maxOutputTokens: 1024 },
      }),
    }
  )

  if (!response.ok) {
    const err = await response.text()
    return res.status(response.status).json({ error: err })
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  return res.status(200).json({ text })
}
