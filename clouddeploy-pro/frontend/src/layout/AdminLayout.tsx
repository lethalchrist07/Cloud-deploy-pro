import { NavLink, Outlet } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { 
  LayoutDashboard, 
  Rocket, 
  Cloud, 
  BarChart3, 
  Terminal, 
  Sliders,
  Wrench 
} from 'lucide-react'
import './AdminLayout.css'

export const AdminLayout = () => {
  const [isBackendConnected, setIsBackendConnected] = useState(true)

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('http://localhost:8000/health')
        setIsBackendConnected(response.ok)
      } catch (error) {
        setIsBackendConnected(false)
      }
    }

    checkBackend()
    const interval = setInterval(checkBackend, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="admin-layout">
      {/* Top Header & Navigation Bar */}
      <header className="top-header">
        <div className="brand-section">
          <Rocket size={20} color="#00F2FE" className="brand-icon" />
          <h1 className="app-title">CloudDeploy Pro</h1>
          <div className="backend-status">
            <div className={`status-dot ${isBackendConnected ? 'connected' : 'disconnected'}`} />
            <span className="status-label">
              {isBackendConnected ? 'Backend Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Horizontal Top Menu Navigation */}
        <nav className="top-nav-menu">
          <NavLink to="/dashboard" end className={({ isActive }) => `top-nav-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={14} />
            <span>Board Overview</span>
          </NavLink>
          <NavLink to="/deployment" className={({ isActive }) => `top-nav-link ${isActive ? 'active' : ''}`}>
            <Rocket size={14} />
            <span>Deployments & Pipelines</span>
          </NavLink>
          <NavLink to="/infrastructure" className={({ isActive }) => `top-nav-link ${isActive ? 'active' : ''}`}>
            <Cloud size={14} />
            <span>Infrastructure & Terraform</span>
          </NavLink>
          <NavLink to="/analytics" className={({ isActive }) => `top-nav-link ${isActive ? 'active' : ''}`}>
            <BarChart3 size={14} />
            <span>System Metrics & Analytics</span>
          </NavLink>
          <NavLink to="/logs" className={({ isActive }) => `top-nav-link ${isActive ? 'active' : ''}`}>
            <Terminal size={14} />
            <span>Live Stream Logs</span>
          </NavLink>
          <NavLink to="/environment" className={({ isActive }) => `top-nav-link ${isActive ? 'active' : ''}`}>
            <Sliders size={14} />
            <span>Environment Setup</span>
          </NavLink>
          <NavLink to="/applications" className={({ isActive }) => `top-nav-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={14} />
            <span>Applications</span>
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `top-nav-link ${isActive ? 'active' : ''}`}>
            <Wrench size={14} />
            <span>Settings</span>
          </NavLink>
        </nav>

        {/* Environment & Quick Action Controls */}
        <div className="top-header-right">
          <div className="environment-selector">
            <select defaultValue="development">
              <option value="development">Development</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </select>
          </div>
          <div className="header-color-pills">
            <span className="color-pill pill-purple"></span>
            <span className="color-pill pill-pink"></span>
          </div>
          <button className="btn-refresh-all" onClick={() => window.location.reload()}>
            Refresh All
          </button>
        </div>
      </header>

      {/* Main Full Width Workspace */}
      <main className="main-content-full">
        <Outlet />
      </main>
    </div>
  )
}