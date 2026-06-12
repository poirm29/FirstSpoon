import { DEFAULT_INGREDIENTS } from '../data/ingredients.js'

const INGREDIENTS_KEY = 'ingredients'
const MEAL_PREFIX = 'meals:'

// Initialize storage with defaults
export function initStorage() {
  if (!localStorage.getItem(INGREDIENTS_KEY)) {
    localStorage.setItem(INGREDIENTS_KEY, JSON.stringify(DEFAULT_INGREDIENTS))
  }
}

// Ingredients
export function getIngredients() {
  try {
    return JSON.parse(localStorage.getItem(INGREDIENTS_KEY)) || DEFAULT_INGREDIENTS
  } catch {
    return DEFAULT_INGREDIENTS
  }
}

export function saveIngredients(ingredients) {
  localStorage.setItem(INGREDIENTS_KEY, JSON.stringify(ingredients))
}

export function addCustomIngredient(name) {
  const ingredients = getIngredients()
  const exists = ingredients.some((i) => i.name === name)
  if (exists) return ingredients
  const updated = [...ingredients, { name, category: '기타', isDefault: false }]
  saveIngredients(updated)
  return updated
}

// Meals
export function getMeal(dateStr) {
  try {
    return JSON.parse(localStorage.getItem(MEAL_PREFIX + dateStr)) || null
  } catch {
    return null
  }
}

// Find the meal that covers dateStr (either directly or via duration)
export function getMealContainingDate(dateStr) {
  const direct = getMeal(dateStr)
  if (direct) return direct

  const target = new Date(dateStr)
  for (let i = 1; i <= 10; i++) {
    const checkDate = new Date(target)
    checkDate.setDate(checkDate.getDate() - i)
    const checkStr = formatDate(checkDate)
    const meal = getMeal(checkStr)
    if (meal && meal.duration > i) return meal
  }
  return null
}

export function saveMeal(meal) {
  localStorage.setItem(MEAL_PREFIX + meal.date, JSON.stringify(meal))
}

export function deleteMeal(dateStr) {
  localStorage.removeItem(MEAL_PREFIX + dateStr)
}

// Get all meals in a date range (for AI context)
export function getMealsInRange(startDate, endDate) {
  const meals = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  const current = new Date(start)

  while (current <= end) {
    const dateStr = formatDate(current)
    const meal = getMeal(dateStr)
    if (meal) meals.push(meal)
    current.setDate(current.getDate() + 1)
  }

  return meals
}

// Get recent meals (last N days)
export function getRecentMeals(days = 30) {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)
  return getMealsInRange(formatDate(start), formatDate(end))
}

// Get all meals for a given month
export function getMealsForMonth(year, month) {
  const meals = {}
  const daysInMonth = new Date(year, month, 0).getDate()

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const meal = getMeal(dateStr)
    if (meal) meals[dateStr] = meal
  }

  // 이전 달 말미에서 이번 달로 걸치는 식단 포함 (최대 duration-1 = 9일 전까지)
  const monthStart = new Date(year, month - 1, 1)
  for (let i = 1; i <= 9; i++) {
    const checkDate = new Date(monthStart)
    checkDate.setDate(checkDate.getDate() - i)
    const dateStr = formatDate(checkDate)
    const meal = getMeal(dateStr)
    if (meal && meal.duration > i) meals[dateStr] = meal
  }

  return meals
}

export function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
