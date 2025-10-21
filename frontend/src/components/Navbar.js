import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav style={{
      background: '#fff',
      padding: '1rem 0',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '2rem'
    }}>
      <div className="container">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Link to="/" style={{
            textDecoration: 'none',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#007bff'
          }}>
            Civita
          </Link>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="btn btn-primary">
                  Dashboard
                </Link>
                <Link to="/profile" className="btn btn-secondary">
                  Profile
                </Link>
                <Link to="/issues" className="btn btn-secondary">
                  Issues
                </Link>
                <Link to="/my-issues" className="btn btn-secondary">
                  My Issues
                </Link>
                <Link to="/map" className="btn btn-secondary">
                  Map View
                </Link>
                {user?.role === 'admin' && (
                  <Link to="/categories" className="btn btn-secondary">
                    Categories
                  </Link>
                )}
                <span style={{ margin: '0 1rem' }}>
                  Welcome, {user?.name}
                </span>
                <button onClick={handleLogout} className="btn btn-danger">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary">
                  Login
                </Link>
                <Link to="/register" className="btn btn-secondary">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
