import { NavLink } from 'react-router-dom'
import './MainLayout.css'

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="main-layout">
      <aside className="sidebar">
        <nav>
          <NavLink to="/dashboard" end className={(isActive) => isActive ? 'active' : ''}>
            Dashboard
          </NavLink>
          <NavLink to="/deployment" className={(isActive) => isActive ? 'active' : ''}>
            Deployment
          </NavLink>
          <NavLink to="/logs" className={(isActive) => isActive ? 'active' : ''}>
            Logs
          </NavLink>
          <NavLink to="/environment" className={(isActive) => isActive ? 'active' : ''}>
            Environment
          </NavLink>
        </nav>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  )
}