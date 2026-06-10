import { Routes, Route, Navigate } from 'react-router-dom'
import HomeScreen from './components/home/HomeScreen.jsx'
import AIScreen from './components/ai/AIScreen.jsx'
import TabBar from './components/TabBar.jsx'

export default function App() {
  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomeScreen />} />
          <Route path="/ai" element={<AIScreen />} />
        </Routes>
      </div>
      <TabBar />
    </div>
  )
}
