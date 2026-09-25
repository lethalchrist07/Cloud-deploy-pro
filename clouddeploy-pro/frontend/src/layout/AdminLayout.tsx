import { NavLink, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Activity, Boxes, ChevronDown, Database, FileText, LayoutDashboard, Settings2, Sliders, Workflow } from 'lucide-react'
import './AdminLayout.css'

export const AdminLayout = () => {
  const [isBackendConnected, setIsBackendConnected] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    const checkBackend = async () => {
      try {
        setIsBackendConnected((await fetch('/api/health', { signal: controller.signal })).ok)
      } catch {
        if (!controller.signal.aborted) setIsBackendConnected(false)
      }
    }
    void checkBackend()
    const interval = window.setInterval(() => void checkBackend(), 10_000)
    return () => {
      controller.abort()
      window.clearInterval(interval)
    }
  }, [])

  return (
    <div className="admin-layout">
      <header className="app-bar">
        <div className="app-bar-left">
          <NavLink className="product-mark" to="/dashboard">
            <span>CD</span>
            <strong>CloudDeploy Pro</strong>
          </NavLink>
          <nav className="desktop-nav">
            <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <LayoutDashboard size={15} /> Overview
            </NavLink>
            <NavLink to="/deployments" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <Workflow size={15} /> Deployments
            </NavLink>
            <NavLink to="/infrastructure" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <Boxes size={15} /> Infrastructure
            </NavLink>
            <NavLink to="/analytics" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <Activity size={15} /> Analytics
            </NavLink>
            <NavLink to="/logs" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <FileText size={15} /> Logs
            </NavLink>
            <NavLink to="/applications" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <Database size={15} /> Applications
            </NavLink>
            <NavLink to="/environments" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <Sliders size={15} /> Environments
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <Settings2 size={15} /> Settings
            </NavLink>
          </nav>
        </div>

        <div className="app-bar-actions">
          <span className={`connection-state ${isBackendConnected ? 'online' : 'offline'}`}>
            <i />
            {isBackendConnected ? 'Control plane online' : 'Control plane offline'}
          </span>
          <details className="workspace-menu">
            <summary>
              Workspace <ChevronDown size={15} />
            </summary>
            <nav>
              <NavLink to="/dashboard">
                <LayoutDashboard size={15} />Overview
              </NavLink>
              <NavLink to="/deployments">
                <Workflow size={15} />Deployments
              </NavLink>
              <NavLink to="/infrastructure">
                <Boxes size={15} />Infrastructure
              </NavLink>
              <NavLink to="/analytics">
                <Activity size={15} />Analytics
              </NavLink>
              <NavLink to="/logs">
                <FileText size={15} />Logs
              </NavLink>
              <NavLink to="/applications">
                <Database size={15} />Applications
              </NavLink>
              <NavLink to="/environments">
                <Sliders size={15} />Environments
              </NavLink>
              <NavLink to="/settings">
                <Settings2 size={15} />Settings
              </NavLink>
            </nav>
          </details>
        </div>
      </header>
      <main className="main-content-full">
        <Outlet />
      </main>
    </div>
  )
}
