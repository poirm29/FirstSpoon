import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ChatBubble from './ChatBubble.jsx'
import { getRecentMeals, saveMeal, formatDate } from '../../utils/storage.js'

const QUICK_REPLIES = ['추천해줘', '어제랑 겹치지 않게 해줘', '간단하게 해줘']

const FALLBACK_MESSAGES = [
  '다른 어머님 아버님 식단을 만들어드리기 위해 출장중이에요! 🧳 잠시 후 다시 물어봐주세요',
  '잠깐 재료 사러 시장에 다녀올게요! 🥬 조금 뒤에 다시 시도해주세요',
  '오늘 너무 많은 아기들의 식단을 짜느라 잠깐 쉬는 중이에요 😅 다시 시도해주세요',
]

async function callChatAPI(messages, recentMealsStr) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, recentMealsStr }),
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  const data = await response.json()
  return data.text
}

async function callChatAPIWithRetry(messages, recentMealsStr, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs
  const retryDelay = 3000

  while (Date.now() < deadline) {
    try {
      return await callChatAPI(messages, recentMealsStr)
    } catch {
      const remaining = deadline - Date.now()
      if (remaining <= 0) break
      await new Promise((r) => setTimeout(r, Math.min(retryDelay, remaining)))
    }
  }
  return null
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
      const responseText = await callChatAPIWithRetry(apiMessages, recentMealsStr.current)

      if (!responseText) {
        const fallback = FALLBACK_MESSAGES[Math.floor(Math.random() * FALLBACK_MESSAGES.length)]
        setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'assistant', type: 'text', content: fallback }])
        return
      }

      const recommendation = parseRecommendation(responseText)
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
    } catch {
      const fallback = FALLBACK_MESSAGES[Math.floor(Math.random() * FALLBACK_MESSAGES.length)]
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'assistant', type: 'text', content: fallback }])
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
