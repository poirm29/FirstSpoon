export default function ChatBubble({ message }) {
  const isAI = message.role === 'assistant'

  if (message.type === 'recommendation') {
    return <RecommendationCard message={message} />
  }

  return (
    <div className={`flex items-end gap-2 mb-3 ${isAI ? 'justify-start' : 'justify-end'}`}>
      {isAI && (
        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-none text-base">
          🥄
        </div>
      )}
      <div
        className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isAI
            ? 'bg-gray-100 text-gray-800 rounded-bl-sm'
            : 'bg-purple-600 text-white rounded-br-sm'
        }`}
      >
        {message.content}
      </div>
    </div>
  )
}

function RecommendationCard({ message }) {
  const { recommendation } = message
  if (!recommendation) return null

  const meals = [
    { key: 'morning', label: '아침', bg: '#FAEEDA', text: '#633806', items: recommendation.morning || [] },
    { key: 'lunch', label: '점심', bg: '#E1F5EE', text: '#085041', items: recommendation.lunch || [] },
    { key: 'dinner', label: '저녁', bg: '#EEEDFE', text: '#3C3489', items: recommendation.dinner || [] },
  ]

  return (
    <div className="flex items-start gap-2 mb-3">
      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-none text-base">
        🥄
      </div>
      <div className="flex-1 max-w-[85%]">
        <p className="text-sm text-gray-700 mb-2">{message.content}</p>
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {meals.map((meal, i) => (
            <div
              key={meal.key}
              className={`px-3 py-2.5 ${i < meals.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: meal.bg, color: meal.text }}
                >
                  {meal.label}
                </span>
              </div>
              {meal.items.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {meal.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1 text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded-lg"
                    >
                      <span>{item.name}</span>
                      <span className="text-gray-400">{item.ml}ml</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">없음</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
