import { useEffect, useState } from 'react'
import { Terminal, FileText } from 'lucide-react'
import { Card } from '../components/Card'
import { LogsViewer } from '../components/LogsViewer'
import { TerminalLogStreamer } from '../components/TerminalLogStreamer'
import './Logs.css'

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

const Logs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([])

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('http://localhost:8000/logs?lines=100')
        if (res.ok) {
          const data = await res.json()
          setLogs(data.logs || [])
        }
      } catch (err) {
        console.error('Logs fetch error:', err)
      }
    }

    fetchLogs()
  }, [])

  return (
    <div className="page-container" style={{ padding: '0.4rem 0' }}>
      <div className="page-header" style={{ marginBottom: '0.65rem' }}>
        <div className="page-title">
          <div className="page-icon"><Terminal size={22} color="#06B6D4" /></div>
          <h2>Live Stream Application Logs</h2>
        </div>
        <p className="page-description">
          Monitor real-time container log streaming, application events, and raw server output
        </p>
      </div>

      <div className="logs-content" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {/* Live Terminal Log Streamer */}
        <section className="section">
          <div className="section-header">
            <h3><Terminal size={16} color="#06B6D4" /> Live Terminal Log Streamer</h3>
          </div>
          <div className="section-content">
            <TerminalLogStreamer />
          </div>
        </section>

        {/* Raw Server Telemetry Logs */}
        <section className="section">
          <div className="section-header">
            <h3><FileText size={16} color="#A855F7" /> Raw Server Event Logs</h3>
          </div>
          <div className="section-content">
            <Card title="Raw System & Application Logs">
              <LogsViewer logs={logs} />
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Logs