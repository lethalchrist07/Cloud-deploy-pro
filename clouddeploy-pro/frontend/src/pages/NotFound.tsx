import './NotFound.css'
import { useNavigate } from 'react-router-dom'

const NotFound = () => {
  const navigate = useNavigate()
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
            <button className="btn btn-primary" onClick={() => navigate('/')}>Go to Home</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFound
