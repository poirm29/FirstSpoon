import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ChatBubble from './ChatBubble.jsx'
import { getRecentMeals, saveMeal, formatDate } from '../../utils/storage.js'

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

const QUICK_REPLIES = ['추천해줘', '어제랑 겹치지 않게 해줘', '간단하게 해줘']

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

async function callAnthropicAPI(messages, recentMealsStr) {
  if (!API_KEY) {
    return getMockResponse(messages)
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-client-side-allow-unsafe': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT(recentMealsStr),
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  const data = await response.json()
  return data.content[0].text
}

function getMockResponse(messages) {
  const lastMsg = messages[messages.length - 1]?.content || ''
  const hasRecommendRequest =
    lastMsg.includes('추천') || lastMsg.includes('간단') || lastMsg.includes('겹치')

  if (!hasRecommendRequest) {
    return '안녕하세요! 오늘 이유식 식단을 추천해드릴까요? 😊'
  }

  return `오늘의 이유식 식단을 추천해드릴게요! 🌱

\`\`\`json
{
  "morning": [
    {"name": "쌀", "category": "곡류", "ml": 60},
    {"name": "당근", "category": "채소", "ml": 30},
    {"name": "소고기", "category": "육류", "ml": 20}
  ],
  "lunch": [
    {"name": "찹쌀", "category": "곡류", "ml": 60},
    {"name": "애호박", "category": "채소", "ml": 30},
    {"name": "닭고기", "category": "육류", "ml": 20},
    {"name": "사과", "category": "과일", "ml": 20}
  ],
  "dinner": [
    {"name": "오트밀", "category": "곡류", "ml": 50},
    {"name": "브로콜리", "category": "채소", "ml": 25},
    {"name": "계란노른자", "category": "육류", "ml": 15}
  ]
}
\`\`\`

균형 잡힌 식단이에요. 소고기는 철분 보충에 좋고, 당근과 브로콜리는 비타민이 풍부해요! 😊`
}

function parseRecommendation(text) {
  try {
    const match = text.match(/```json\n?([\s\S]*?)\n?```/)
    if (!match) return null
    return JSON.parse(match[1])
  } catch {
    return null
  }
}

function formatMealsForContext(meals) {
  if (!meals || meals.length === 0) return ''
  return meals
    .map((m) => {
      const lines = [`날짜: ${m.date} (${m.duration || 1}일간)`]
      if (m.morning?.length) lines.push(`  아침: ${m.morning.map((i) => `${i.name} ${i.ml}ml`).join(', ')}`)
      if (m.lunch?.length) lines.push(`  점심: ${m.lunch.map((i) => `${i.name} ${i.ml}ml`).join(', ')}`)
      if (m.dinner?.length) lines.push(`  저녁: ${m.dinner.map((i) => `${i.name} ${i.ml}ml`).join(', ')}`)
      return lines.join('\n')
    })
    .join('\n\n')
}

export default function AIScreen() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastRecommendation, setLastRecommendation] = useState(null)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveDate, setSaveDate] = useState(formatDate(new Date()))
  const [saveDuration, setSaveDuration] = useState(1)
  const bottomRef = useRef(null)
  const recentMealsStr = useRef('')

  useEffect(() => {
    const meals = getRecentMeals(30)
    recentMealsStr.current = formatMealsForContext(meals)

    // Initial AI greeting
    setMessages([
      {
        id: 1,
        role: 'assistant',
        type: 'text',
        content: '안녕하세요! 오늘 이유식 식단을 추천해드릴까요? 🥄',
        showQuickReplies: true,
      },
    ])
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(text) {
    if (!text.trim() || loading) return

    const userMsg = { id: Date.now(), role: 'user', type: 'text', content: text }
    const apiMessages = [
      ...messages.filter((m) => m.role !== 'assistant' || !m.showQuickReplies).map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: text },
    ]

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const responseText = await callAnthropicAPI(apiMessages, recentMealsStr.current)
      const recommendation = parseRecommendation(responseText)

      // Strip JSON block from display text
      const displayText = responseText.replace(/```json[\s\S]*?```/g, '').trim()

      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        type: recommendation ? 'recommendation' : 'text',
        content: displayText || '식단을 추천해드렸어요!',
        recommendation,
        showQuickReplies: !recommendation,
        showSaveActions: !!recommendation,
      }

      setMessages((prev) => [...prev, aiMsg])
      if (recommendation) setLastRecommendation(recommendation)
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          type: 'text',
          content: `죄송해요, 오류가 발생했어요. (${err.message})`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleSaveRecommendation() {
    if (!lastRecommendation) return
    const meal = {
      date: saveDate,
      duration: saveDuration,
      morning: lastRecommendation.morning || [],
      lunch: lastRecommendation.lunch || [],
      dinner: lastRecommendation.dinner || [],
    }
    saveMeal(meal)
    setShowSaveDialog(false)
    navigate('/home')
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 flex-none">
        <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-xl">
          🥄
        </div>
        <div>
          <h1 className="text-sm font-bold text-gray-800">AI 식단 추천</h1>
          <p className="text-xs text-gray-400">이유식 전문가 AI</p>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map((msg) => (
          <div key={msg.id}>
            <ChatBubble message={msg} />

            {/* Quick replies */}
            {msg.showQuickReplies && !loading && (
              <div className="flex flex-wrap gap-2 ml-10 mb-3">
                {QUICK_REPLIES.map((reply) => (
                  <button
                    key={reply}
                    onClick={() => sendMessage(reply)}
                    className="px-3 py-1.5 bg-white border border-purple-200 text-purple-700 rounded-full text-xs font-medium hover:bg-purple-50 active:bg-purple-100"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            {/* Save actions */}
            {msg.showSaveActions && !loading && (
              <div className="flex gap-2 ml-10 mb-3">
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded-full text-xs font-bold hover:bg-purple-700"
                >
                  이대로 기록할게요
                </button>
                <button
                  onClick={() => sendMessage('다른 메뉴 추천해줘')}
                  className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-full text-xs font-medium hover:bg-gray-50"
                >
                  다른 메뉴 추천해줘
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-end gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-none text-base">
              🥄
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 flex-none">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="메시지를 입력하세요..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm outline-none placeholder-gray-400 text-gray-800"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center disabled:opacity-40 hover:bg-purple-700 active:bg-purple-800 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M16 9L2 3L5 9L2 15L16 9Z" fill="white"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Save dialog */}
      {showSaveDialog && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setShowSaveDialog(false)}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-5 z-50 w-72">
            <h3 className="text-sm font-bold text-gray-800 mb-4">식단 기록 저장</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">날짜</label>
                <input
                  type="date"
                  value={saveDate}
                  onChange={(e) => setSaveDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">기간 (일)</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSaveDuration((d) => Math.max(1, d - 1))}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-bold text-gray-800">{saveDuration}</span>
                  <button
                    onClick={() => setSaveDuration((d) => d + 1)}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-500">일</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium"
              >
                취소
              </button>
              <button
                onClick={handleSaveRecommendation}
                className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700"
              >
                확인
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
