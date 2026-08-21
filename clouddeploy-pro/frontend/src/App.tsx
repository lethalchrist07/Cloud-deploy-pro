import './styles/design-system.css'
import './components.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'
import Deployment from './pages/Deployment'
import Infrastructure from './pages/Infrastructure'
import Analytics from './pages/Analytics'
import Logs from './pages/Logs'
import Environment from './pages/Environment'
import Settings from './pages/Settings'
import Applications from './pages/Applications'
import NotFound from './pages/NotFound'
import { AdminLayout } from './layout/AdminLayout'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Navigate replace to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="deployment" element={<Deployment />} />
          <Route path="infrastructure" element={<Infrastructure />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="logs" element={<Logs />} />
          <Route path="environment" element={<Environment />} />
          <Route path="settings" element={<Settings />} />
          <Route path="applications" element={<Applications />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App