import './styles/design-system.css'
import './components.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'
import { AdminLayout } from './layout/AdminLayout'
import { Analytics } from './pages/Analytics'
import { Applications } from './pages/Applications'
import { Deployment } from './pages/Deployment'
import { Environment } from './pages/Environments'
import { Infrastructure } from './pages/Infrastructure'
import { Logs } from './pages/Logs'
import { Settings } from './pages/Settings'

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="applications" element={<Applications />} />
          <Route path="deployments" element={<Deployment />} />
          <Route path="infrastructure" element={<Infrastructure />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="logs" element={<Logs />} />
          <Route path="environments" element={<Environment />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App