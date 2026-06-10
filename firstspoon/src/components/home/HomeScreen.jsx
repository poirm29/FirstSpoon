import { useState } from 'react'
import Calendar from './Calendar.jsx'
import MealModal from './MealModal.jsx'

export default function HomeScreen() {
  const [selectedDate, setSelectedDate] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  function handleDateSelect(dateStr) {
    setSelectedDate(dateStr)
  }

  function handleModalClose() {
    setSelectedDate(null)
  }

  function handleMealSaved() {
    setSelectedDate(null)
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <Calendar
        key={refreshKey}
        onDateSelect={handleDateSelect}
      />

      {selectedDate && (
        <MealModal
          date={selectedDate}
          onClose={handleModalClose}
          onSaved={handleMealSaved}
        />
      )}
    </div>
  )
}
