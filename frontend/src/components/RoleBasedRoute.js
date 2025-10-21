import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleBasedRoute = ({ 
  children, 
  allowedRoles = [], 
  redirectTo = '/dashboard',
  fallbackPath = '/login' 
}) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50vh',
        fontSize: '1.2rem'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} replace />;
  }

  // If no specific roles required, just check authentication
  if (allowedRoles.length === 0) {
    return children;
  }

  // Check if user's role is allowed
  if (!allowedRoles.includes(user?.role)) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50vh',
        textAlign: 'center'
      }}>
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
        <p>Required roles: {allowedRoles.join(', ')}</p>
        <p>Your role: {user?.role || 'None'}</p>
        <button 
          onClick={() => window.history.back()}
          className="btn btn-primary"
          style={{ marginTop: '1rem' }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return children;
};

export default RoleBasedRoute;
