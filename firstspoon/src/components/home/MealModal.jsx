import { useState, useEffect } from 'react'
import { getMealContainingDate, saveMeal } from '../../utils/storage.js'
import IngredientSheet from './IngredientSheet.jsx'

const MEAL_KEYS = ['morning', 'lunch', 'dinner']
const MEAL_LABELS = { morning: '한끼', lunch: '두끼', dinner: '세끼' }
const MEAL_COLORS = {
  morning: { bg: '#FAEEDA', text: '#633806', border: '#F0C896' },
  lunch: { bg: '#E1F5EE', text: '#085041', border: '#A7DFC7' },
  dinner: { bg: '#EEEDFE', text: '#3C3489', border: '#C4C0F7' },
}

function formatDisplayDate(dateStr) {
  const [, m, d] = dateStr.split('-')
  return `${parseInt(m)}월 ${parseInt(d)}일`
}

export default function MealModal({ date, onClose, onSaved }) {
  const [meal, setMeal] = useState(() => {
    const existing = getMealContainingDate(date)
    return existing || { date, duration: 1, morning: [], lunch: [], dinner: [] }
  })
  const [addingTo, setAddingTo] = useState(null) // 'morning' | 'lunch' | 'dinner'
  const [editingMl, setEditingMl] = useState(null) // { mealKey, idx }
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Trigger slide-up animation
    requestAnimationFrame(() => setVisible(true))
  }, [])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 280)
  }

  function handleDurationChange(e) {
    const v = Math.max(1, parseInt(e.target.value) || 1)
    setMeal((m) => ({ ...m, duration: v }))
  }

  function handleRemoveIngredient(mealKey, idx) {
    setMeal((m) => ({
      ...m,
      [mealKey]: m[mealKey].filter((_, i) => i !== idx),
    }))
  }

  function handleAddIngredient(mealKey, ingredients) {
    setMeal((m) => ({
      ...m,
      [mealKey]: [...m[mealKey], ...ingredients],
    }))
    setAddingTo(null)
  }

  function handleSave() {
    saveMeal(meal)
    setVisible(false)
    setTimeout(onSaved, 280)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black transition-opacity duration-300"
        style={{ opacity: visible ? 0.4 : 0 }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 max-w-md mx-auto"
        style={{
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          maxHeight: '90vh',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">
            {formatDisplayDate(date)} 식단
          </h2>
          <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <span className="text-sm text-gray-600 font-medium">식단 기간</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMeal((m) => ({ ...m, duration: Math.max(1, m.duration - 1) }))}
              className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold hover:bg-gray-200"
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-bold text-gray-800">{meal.duration}일</span>
            <button
              onClick={() => setMeal((m) => ({ ...m, duration: Math.min(10, m.duration + 1) }))}
              className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold hover:bg-gray-200"
            >
              +
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {MEAL_KEYS.map((mealKey) => {
            const colors = MEAL_COLORS[mealKey]
            const items = meal[mealKey] || []
            return (
              <div key={mealKey} className="px-4 py-3 border-b border-gray-50">
                {/* Meal header */}
                <div
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold mb-2"
                  style={{ backgroundColor: colors.bg, color: colors.text }}
                >
                  {MEAL_LABELS[mealKey]}
                </div>

                {/* Ingredient rows */}
                {items.map((item, idx) => {
                  const isEditingThis = editingMl?.mealKey === mealKey && editingMl?.idx === idx
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0"
                    >
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: colors.bg, color: colors.text }}
                      >
                        {item.category}
                      </span>
                      <span className="flex-1 text-sm text-gray-800">{item.name}</span>
                      {isEditingThis ? (
                        <input
                          type="number"
                          defaultValue={item.ml || ''}
                          autoFocus
                          min="0"
                          className="w-16 text-center text-sm border border-purple-300 rounded-lg py-0.5 outline-none focus:border-purple-500"
                          onBlur={(e) => {
                            const val = parseInt(e.target.value)
                            setMeal((m) => ({
                              ...m,
                              [mealKey]: m[mealKey].map((it, i) =>
                                i === idx ? { ...it, ml: isNaN(val) ? 0 : val } : it
                              ),
                            }))
                            setEditingMl(null)
                          }}
                          onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur() }}
                        />
                      ) : (
                        <span
                          className="text-sm text-gray-500 cursor-pointer hover:text-purple-600 min-w-[40px] text-right"
                          onClick={() => setEditingMl({ mealKey, idx })}
                        >
                          {item.ml ? `${item.ml}ml` : '-'}
                        </span>
                      )}
                      <button
                        onClick={() => handleRemoveIngredient(mealKey, idx)}
                        className="p-1 text-gray-300 hover:text-red-400"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  )
                })}

                {/* Add button */}
                <button
                  onClick={() => setAddingTo(mealKey)}
                  className="mt-1.5 flex items-center gap-1 text-xs text-purple-600 font-medium hover:text-purple-700"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 2V12M2 7H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  재료 추가
                </button>
              </div>
            )
          })}
        </div>

        {/* Save button */}
        <div className="px-4 py-3 border-t border-gray-100">
          <button
            onClick={handleSave}
            className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 active:bg-purple-800"
          >
            저장하기
          </button>
        </div>
      </div>

      {/* Ingredient Sheet */}
      {addingTo && (
        <IngredientSheet
          mealKey={addingTo}
          onAdd={(ingredient) => handleAddIngredient(addingTo, ingredient)}
          onClose={() => setAddingTo(null)}
        />
      )}
    </>
  )
}
