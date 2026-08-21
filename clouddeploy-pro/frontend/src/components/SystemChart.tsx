import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// Generate mock data for the last 24 hours
const generateMockData = () => {
  const data = []
  const now = Date.now()
  for (let i = 0; i < 24; i++) {
    data.push({
      time: new Date(now - i * 3600 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      cpu: Math.floor(Math.random() * 100),
      memory: Math.floor(Math.random() * 100),
      disk: Math.floor(Math.random() * 100),
    })
  }
  return data.reverse()
}

export const SystemChart = () => {
  const chartData = generateMockData()

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="cpu" stroke="#ff9f1c" name="CPU Usage" />
        <Line type="monotone" dataKey="memory" stroke="#2ec4b6" name="Memory Usage" />
        <Line type="monotone" dataKey="disk" stroke="#e71d36" name="Disk Usage" />
      </LineChart>
    </ResponsiveContainer>
  )
}