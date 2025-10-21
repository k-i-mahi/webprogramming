import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="container">
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#007bff' }}>
          Welcome to Civita
        </h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: '#666' }}>
          A modern MERN stack application built with MongoDB, Express.js, React, and Node.js
        </p>
        
        {isAuthenticated ? (
          <div>
            <Link to="/dashboard" className="btn btn-primary" style={{ marginRight: '1rem' }}>
              Go to Dashboard
            </Link>
            <Link to="/profile" className="btn btn-secondary">
              View Profile
            </Link>
          </div>
        ) : (
          <div>
            <Link to="/register" className="btn btn-primary" style={{ marginRight: '1rem' }}>
              Get Started
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Login
            </Link>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '3rem' }}>
        <div className="card">
          <h3>🚀 Modern Technology</h3>
          <p>Built with the latest technologies including React 18, Node.js, and MongoDB for optimal performance.</p>
        </div>
        
        <div className="card">
          <h3>🔐 Secure Authentication</h3>
          <p>JWT-based authentication with password hashing and secure session management.</p>
        </div>
        
        <div className="card">
          <h3>📱 Responsive Design</h3>
          <p>Mobile-first design that works perfectly on all devices and screen sizes.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
