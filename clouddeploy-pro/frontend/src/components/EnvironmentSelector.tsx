import { useState } from 'react'

export const EnvironmentSelector = () => {
  const [environment, setEnvironment] = useState<'dev' | 'staging' | 'production'>('dev')

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEnvironment(e.target.value as 'dev' | 'staging' | 'production')
    // In a real app, this would trigger a data reload or route change
  }

  return (
    <select
      value={environment}
      onChange={handleChange}
      className="environment-selector"
    >
      <option value="dev">Development</option>
      <option value="staging">Staging</option>
      <option value="production">Production</option>
    </select>
  )
}