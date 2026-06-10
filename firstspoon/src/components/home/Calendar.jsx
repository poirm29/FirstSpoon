import { useState, useEffect } from 'react'
import { getMealsForMonth, formatDate } from '../../utils/storage.js'

const MEAL_COLORS = {
  morning: { bg: '#FAEEDA', text: '#633806' },
  lunch: { bg: '#E1F5EE', text: '#085041' },
  dinner: { bg: '#EEEDFE', text: '#3C3489' },
}

const MEAL_LABELS = { morning: '아침', lunch: '점심', dinner: '저녁' }
const MEAL_KEYS = ['morning', 'lunch', 'dinner']
const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function getWeeksForMonth(year, month) {
  // month is 1-based
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const weeks = []
  let current = new Date(firstDay)
  // Move back to Sunday
  current.setDate(current.getDate() - current.getDay())

  while (current <= lastDay || current.getDay() !== 0) {
    const week = []
    for (let i = 0; i < 7; i++) {
      week.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    weeks.push(week)
    if (current > lastDay && current.getDay() === 0) break
  }
  return weeks
}

// Build strip segments for a given mealKey across all weeks
// Returns: Map<dateStr, {type, label, isStart, isEnd, isEmpty}>
function buildStrips(meals, weeks, year, month) {
  // Expand all meal records into date coverage
  // Each record: { date, duration, morning, lunch, dinner }
  // A record with duration:3 covers date, date+1, date+2

  const coverage = {} // dateStr -> { morning: mealData, lunch: mealData, dinner: mealData }

  Object.values(meals).forEach((meal) => {
    const start = new Date(meal.date)
    const dur = meal.duration || 1
    for (let d = 0; d < dur; d++) {
      const dt = new Date(start)
      dt.setDate(dt.getDate() + d)
      const ds = formatDate(dt)
      if (!coverage[ds]) coverage[ds] = {}
      MEAL_KEYS.forEach((key) => {
        if (meal[key] && meal[key].length > 0) {
          coverage[ds][key] = { meal, startDate: meal.date, duration: dur }
        }
      })
    }
  })

  // For each week, compute strip data per cell
  const strips = {} // dateStr -> { morning: StripCell, lunch: StripCell, dinner: StripCell }

  weeks.forEach((week) => {
    MEAL_KEYS.forEach((mealKey) => {
      week.forEach((day, idx) => {
        const ds = formatDate(day)
        const cov = coverage[ds]?.[mealKey]
        if (!cov) return

        const { meal, startDate, duration } = cov
        const startDt = new Date(startDate)
        const endDt = new Date(startDate)
        endDt.setDate(endDt.getDate() + duration - 1)

        // Is this day the absolute start?
        const isAbsoluteStart = ds === startDate
        // Is this day the absolute end?
        const isAbsoluteEnd = ds === formatDate(endDt)
        // Is this day the start of the week?
        const isWeekStart = idx === 0
        // Is this day the end of the week?
        const isWeekEnd = idx === 6

        const isDisplayStart = isAbsoluteStart || isWeekStart
        const isDisplayEnd = isAbsoluteEnd || isWeekEnd

        const items = meal[mealKey] || []
        let startLabel = ''
        let endLabel = ''

        if (isDisplayStart && items.length > 0) {
          const abbr = items[0].name.length > 2 ? items[0].name.slice(0, 2) : items[0].name
          const suffix = items.length > 1 ? `·${items[1].name.slice(0, 1)}` : ''
          startLabel = abbr + suffix
        }
        if (isDisplayEnd) {
          const total = items.reduce((s, i) => s + (i.ml || 0), 0)
          if (total > 0) endLabel = `${total}ml`
        }

        if (!strips[ds]) strips[ds] = {}
        strips[ds][mealKey] = {
          active: true,
          isDisplayStart,
          isDisplayEnd,
          startLabel,
          endLabel,
        }
      })
    })
  })

  return strips
}

export default function Calendar({ onDateSelect }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [meals, setMeals] = useState({})

  useEffect(() => {
    setMeals(getMealsForMonth(year, month))
  }, [year, month])

  const weeks = getWeeksForMonth(year, month)
  const strips = buildStrips(meals, weeks, year, month)

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const todayStr = formatDate(today)

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="text-base font-bold text-gray-800">
          {year}년 {month}월
        </h1>
        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4L10 8L6 12" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAY_LABELS.map((d, i) => (
          <div
            key={d}
            className={`text-center text-xs py-1.5 font-medium ${
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Weeks */}
      <div className="flex-1">
        {weeks.map((week, wi) => {
          const weekKey = `${year}-${month}-w${wi}`
          return (
            <div key={weekKey} className="border-b border-gray-50">
              {/* Date row */}
              <div className="grid grid-cols-7">
                {week.map((day, di) => {
                  const ds = formatDate(day)
                  const isCurrentMonth = day.getMonth() + 1 === month
                  const isToday = ds === todayStr
                  return (
                    <button
                      key={ds}
                      onClick={() => onDateSelect(ds)}
                      className="flex flex-col items-center pt-1.5 pb-0.5 active:bg-gray-50"
                    >
                      <span
                        className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium ${
                          isToday
                            ? 'bg-purple-600 text-white'
                            : isCurrentMonth
                            ? di === 0
                              ? 'text-red-400'
                              : di === 6
                              ? 'text-blue-400'
                              : 'text-gray-700'
                            : 'text-gray-300'
                        }`}
                      >
                        {day.getDate()}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Meal strips */}
              {MEAL_KEYS.map((mealKey) => {
                const colors = MEAL_COLORS[mealKey]
                // Compute strip ranges within this week for overlay labels
                const ranges = []
                let cur = null
                week.forEach((day, col) => {
                  const ds = formatDate(day)
                  const strip = strips[ds]?.[mealKey]
                  if (strip?.active) {
                    if (strip.isDisplayStart || !cur) {
                      if (cur) ranges.push(cur)
                      cur = { startCol: col, endCol: col, startLabel: strip.startLabel, endLabel: strip.endLabel }
                    } else {
                      cur.endCol = col
                      if (strip.endLabel) cur.endLabel = strip.endLabel
                    }
                  } else {
                    if (cur) { ranges.push(cur); cur = null }
                  }
                })
                if (cur) ranges.push(cur)

                return (
                  <div key={mealKey} className="relative mb-0.5" style={{ height: '22px' }}>
                    {/* Cell backgrounds */}
                    <div className="grid grid-cols-7 h-full">
                      {week.map((day, di) => {
                        const ds = formatDate(day)
                        const strip = strips[ds]?.[mealKey]
                        if (!strip?.active) {
                          return <button key={ds + mealKey} onClick={() => onDateSelect(ds)} className="h-full" />
                        }
                        return (
                          <button
                            key={ds + mealKey}
                            onClick={() => onDateSelect(ds)}
                            className="h-full"
                            style={{
                              backgroundColor: colors.bg,
                              borderRadius: strip.isDisplayStart && strip.isDisplayEnd
                                ? '4px'
                                : strip.isDisplayStart ? '4px 0 0 4px'
                                : strip.isDisplayEnd ? '0 4px 4px 0'
                                : '0',
                            }}
                          />
                        )
                      })}
                    </div>
                    {/* Label overlays spanning full strip width */}
                    {ranges.map((range, ri) => (
                      <div
                        key={ri}
                        className="absolute top-0 h-full flex items-center justify-between pointer-events-none"
                        style={{
                          left: `${(range.startCol / 7) * 100}%`,
                          width: `${((range.endCol - range.startCol + 1) / 7) * 100}%`,
                          padding: '0 4px',
                        }}
                      >
                        <span className="text-[10px] font-medium truncate" style={{ color: colors.text }}>
                          {range.startLabel}
                        </span>
                        {range.endLabel && (
                          <span className="text-[10px] font-medium ml-1 flex-none" style={{ color: colors.text }}>
                            {range.endLabel}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
