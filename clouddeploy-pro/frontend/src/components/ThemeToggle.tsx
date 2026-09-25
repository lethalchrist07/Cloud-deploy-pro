export const ThemeToggle = () => {
  const toggleTheme = () => {
    document.body.classList.toggle('dark-mode')
    // Save preference to localStorage
    if (document.body.classList.contains('dark-mode')) {
      localStorage.setItem('theme', 'dark')
    } else {
      localStorage.setItem('theme', 'light')
    }
  }

  // On load, check localStorage
  // We'll use useEffect, but keep it simple for now
  // In a real app, we'd use useEffect to check on mount

  return (
    <button onClick={toggleTheme} className="theme-toggle">
      {document.body.classList.contains('dark-mode') ? 'Dark' : 'Light'}
    </button>
  )
}
