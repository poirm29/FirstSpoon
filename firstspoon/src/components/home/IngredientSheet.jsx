import { useState, useEffect } from 'react'
import { getIngredients, addCustomIngredient } from '../../utils/storage.js'
import { CATEGORIES } from '../../data/ingredients.js'

const MEAL_LABELS = { morning: '아침', lunch: '점심', dinner: '저녁' }

export default function IngredientSheet({ mealKey, onAdd, onClose }) {
  const [ingredients, setIngredients] = useState([])
  const [category, setCategory] = useState('곡류')
  const [search, setSearch] = useState('')
  const [selectedList, setSelectedList] = useState([]) // [{name, category, ml:''}]
  const [customName, setCustomName] = useState('')
  const [customMl, setCustomMl] = useState('')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setIngredients(getIngredients())
    requestAnimationFrame(() => setVisible(true))
  }, [])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 280)
  }

  function handleToggle(ing) {
    setSelectedList((prev) => {
      const exists = prev.find((s) => s.name === ing.name)
      if (exists) return prev.filter((s) => s.name !== ing.name)
      return [...prev, { name: ing.name, category: ing.category, ml: '' }]
    })
  }

  function handleMlChange(name, value) {
    setSelectedList((prev) =>
      prev.map((s) => (s.name === name ? { ...s, ml: value } : s))
    )
  }

  function handleRemoveSelected(name) {
    setSelectedList((prev) => prev.filter((s) => s.name !== name))
  }

  function handleConfirm() {
    if (selectedList.length === 0) return
    onAdd(selectedList.map((s) => ({ name: s.name, category: s.category, ml: s.ml ? parseInt(s.ml) : 0 })))
  }

  function handleCustomAdd() {
    if (!customName.trim() || !customMl) return
    const newList = addCustomIngredient(customName.trim())
    setIngredients(newList)
    setSelectedList((prev) => {
      const exists = prev.find((s) => s.name === customName.trim())
      if (exists) return prev
      return [...prev, { name: customName.trim(), category: '기타', ml: customMl }]
    })
    setCustomName('')
    setCustomMl('')
  }

  const filtered = ingredients.filter((ing) => {
    if (search) return ing.name.includes(search)
    return ing.category === category
  })

  const hasValidItems = selectedList.length > 0

  return (
    <>
      <div
        className="fixed inset-0 bg-black transition-opacity duration-300"
        style={{ opacity: visible ? 0.5 : 0, zIndex: 60 }}
        onClick={handleClose}
      />
      <div
        className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 max-w-md mx-auto flex flex-col"
        style={{
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          maxHeight: '88vh',
          zIndex: 70,
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-none">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 flex-none">
          <h3 className="text-sm font-bold text-gray-800">재료 선택</h3>
          <button onClick={handleClose} className="p-1 text-gray-400">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-2 flex-none">
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="#9CA3AF" strokeWidth="1.5"/>
              <path d="M11 11L14 14" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="재료 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Category tabs */}
        {!search && (
          <div className="flex gap-1 px-4 pb-2 overflow-x-auto scrollbar-hide flex-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex-none px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  category === cat
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Ingredient grid */}
        <div className="overflow-y-auto px-4 flex-1 min-h-0">
          <div className="grid grid-cols-3 gap-2 pb-2">
            {filtered.map((ing) => {
              const isSelected = selectedList.some((s) => s.name === ing.name)
              return (
                <button
                  key={ing.name}
                  onClick={() => handleToggle(ing)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'
                  }`}
                >
                  {ing.name}
                </button>
              )
            })}
            {filtered.length === 0 && (
              <div className="col-span-3 text-center py-6 text-sm text-gray-400">
                검색 결과가 없어요
              </div>
            )}
          </div>
        </div>

        {/* Selected list + ml inputs */}
        {selectedList.length > 0 && (
          <div className="mx-4 mt-1 p-3 bg-purple-50 rounded-xl border border-purple-100 flex-none">
            <p className="text-xs font-medium text-purple-700 mb-2">선택한 재료 ({selectedList.length})</p>
            <div className="space-y-2">
              {selectedList.map((s) => (
                <div key={s.name} className="flex items-center gap-2">
                  <span className="text-sm text-gray-800 flex-1 truncate">{s.name}</span>
                  <input
                    type="number"
                    placeholder="ml"
                    value={s.ml}
                    onChange={(e) => handleMlChange(s.name, e.target.value)}
                    className="w-16 text-center text-sm border border-purple-200 rounded-lg py-1 outline-none focus:border-purple-400"
                    min="1"
                  />
                  <span className="text-xs text-gray-400">ml</span>
                  <button onClick={() => handleRemoveSelected(s.name)} className="p-0.5 text-gray-300 hover:text-red-400">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={handleConfirm}
              disabled={!hasValidItems}
              className="mt-3 w-full py-2 bg-purple-600 text-white rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-purple-700"
            >
              {MEAL_LABELS[mealKey]}에 추가
            </button>
          </div>
        )}

        {/* Custom ingredient */}
        <div className="mx-4 mt-2 mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200 flex-none">
          <p className="text-xs text-gray-500 mb-2 font-medium">목록에 없는 재료 직접 등록</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="재료명"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="flex-1 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-purple-400"
            />
            <input
              type="number"
              placeholder="ml"
              value={customMl}
              onChange={(e) => setCustomMl(e.target.value)}
              className="w-16 text-center text-sm border border-gray-200 rounded-lg py-1.5 outline-none focus:border-purple-400"
              min="1"
            />
            <span className="text-xs text-gray-400">ml</span>
            <button
              onClick={handleCustomAdd}
              disabled={!customName.trim() || !customMl}
              className="px-3 py-1.5 bg-gray-700 text-white rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-gray-800"
            >
              등록
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
