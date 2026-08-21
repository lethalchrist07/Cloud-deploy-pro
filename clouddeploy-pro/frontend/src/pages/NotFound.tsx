import './NotFound.css'

const NotFound = () => {
  return (
    <div className="page-container">
      <div className="not-found-container">
        <div className="not-found-content">
          <div className="not-found-icon">404</div>
          <h1>Page Not Found</h1>
          <p>
            The page you are looking for does not exist or has been moved.
          </p>
          <div className="not-found-actions">
            <button className="btn btn-primary">Go to Home</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFound