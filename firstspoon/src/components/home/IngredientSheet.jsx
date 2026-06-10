import { useState, useEffect } from 'react'
import { getIngredients, addCustomIngredient } from '../../utils/storage.js'
import { CATEGORIES } from '../../data/ingredients.js'

export default function IngredientSheet({ mealKey, onAdd, onClose }) {
  const [ingredients, setIngredients] = useState([])
  const [category, setCategory] = useState('곡류')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [ml, setMl] = useState('')
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

  function handleSelect(ing) {
    setSelected(ing)
    setMl('')
  }

  function handleAdd() {
    if (!selected || !ml) return
    onAdd({ name: selected.name, category: selected.category, ml: parseInt(ml) })
  }

  function handleCustomAdd() {
    if (!customName.trim() || !customMl) return
    const newIng = addCustomIngredient(customName.trim())
    setIngredients(newIng)
    onAdd({ name: customName.trim(), category: '기타', ml: parseInt(customMl) })
  }

  const filtered = ingredients.filter((ing) => {
    if (search) return ing.name.includes(search)
    return ing.category === category
  })

  return (
    <>
      <div
        className="fixed inset-0 z-60 bg-black transition-opacity duration-300"
        style={{ opacity: visible ? 0.5 : 0, zIndex: 60 }}
        onClick={handleClose}
      />
      <div
        className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 max-w-md mx-auto"
        style={{
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          maxHeight: '85vh',
          zIndex: 70,
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-4 py-2">
          <h3 className="text-sm font-bold text-gray-800">재료 선택</h3>
          <button onClick={handleClose} className="p-1 text-gray-400">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-2">
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
          <div className="flex gap-1 px-4 pb-2 overflow-x-auto scrollbar-hide">
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
        <div className="overflow-y-auto px-4" style={{ maxHeight: '35vh' }}>
          <div className="grid grid-cols-3 gap-2 pb-2">
            {filtered.map((ing) => (
              <button
                key={ing.name}
                onClick={() => handleSelect(ing)}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                  selected?.name === ing.name
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'
                }`}
              >
                {ing.name}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-3 text-center py-6 text-sm text-gray-400">
                검색 결과가 없어요
              </div>
            )}
          </div>
        </div>

        {/* ml input (shown when ingredient selected) */}
        {selected && (
          <div className="mx-4 mt-1 mb-2 p-3 bg-purple-50 rounded-xl border border-purple-100">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-purple-700 flex-1">{selected.name}</span>
              <input
                type="number"
                placeholder="ml"
                value={ml}
                onChange={(e) => setMl(e.target.value)}
                className="w-20 text-center text-sm border border-purple-200 rounded-lg py-1.5 outline-none focus:border-purple-400"
                min="1"
              />
              <span className="text-xs text-gray-500">ml</span>
              <button
                onClick={handleAdd}
                disabled={!ml}
                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-purple-700"
              >
                추가
              </button>
            </div>
          </div>
        )}

        {/* Custom ingredient */}
        <div className="mx-4 mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
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
