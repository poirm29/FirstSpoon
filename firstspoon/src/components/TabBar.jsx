import { NavLink } from 'react-router-dom'

function HomeIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z"
        fill={active ? '#7C3AED' : 'none'}
        stroke={active ? '#7C3AED' : '#9CA3AF'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function AIIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="9"
        fill={active ? '#EDE9FE' : 'none'}
        stroke={active ? '#7C3AED' : '#9CA3AF'}
        strokeWidth="2"
      />
      <path
        d="M8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16"
        stroke={active ? '#7C3AED' : '#9CA3AF'}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="2" fill={active ? '#7C3AED' : '#9CA3AF'} />
    </svg>
  )
}

export default function TabBar() {
  return (
    <nav className="flex-none border-t border-gray-100 bg-white safe-area-bottom">
      <div className="flex">
        <NavLink
          to="/home"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-2 gap-0.5 ${
              isActive ? 'text-purple-700' : 'text-gray-400'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <HomeIcon active={isActive} />
              <span className="text-xs font-medium">홈</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/ai"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-2 gap-0.5 ${
              isActive ? 'text-purple-700' : 'text-gray-400'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <AIIcon active={isActive} />
              <span className="text-xs font-medium">AI 추천</span>
            </>
          )}
        </NavLink>
      </div>
    </nav>
  )
}
