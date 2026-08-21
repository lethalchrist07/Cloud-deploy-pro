interface RefreshButtonProps {
  onClick: () => void
}

export const RefreshButton = ({ onClick }: RefreshButtonProps) => {
  return (
    <button onClick={onClick} className="refresh-button">
      Refresh
    </button>
  )
}