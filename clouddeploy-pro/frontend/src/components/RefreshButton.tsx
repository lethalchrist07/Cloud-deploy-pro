interface RefreshButtonProps {
  onClick: () => void
  disabled?: boolean
}

export const RefreshButton = ({ onClick, disabled = false }: RefreshButtonProps) => {
  return (
    <button onClick={onClick} className="btn btn-primary" disabled={disabled}>
      Refresh
    </button>
  )
}
