import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'resident',
    latitude: '',
    longitude: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const { register, isAuthenticated, error, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLocationError('');
    
    if (formData.password !== formData.confirmPassword) {
      setLocationError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Get user's current location if not provided
    if (!formData.latitude || !formData.longitude) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setFormData(prev => ({
              ...prev,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }));
            // Retry submission with location
            setTimeout(() => handleSubmit(e), 100);
          },
          (error) => {
            console.error('Error getting location:', error);
            setLocationError('Please enable location access or enter coordinates manually');
            setIsLoading(false);
          }
        );
        return;
      } else {
        setLocationError('Geolocation is not supported. Please enter coordinates manually.');
        setIsLoading(false);
        return;
      }
    }

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      });
      // Navigation will be handled by useEffect
    } catch (error) {
      // Error is handled by context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <div style={{ maxWidth: '400px', margin: '2rem auto' }}>
        <div className="card">
          <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Register</h2>
          
          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          {locationError && (
            <div className="alert alert-danger">
              {locationError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-control"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="form-control"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <small style={{ color: 'red' }}>Passwords do not match</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                name="role"
                className="form-control"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="resident">Resident</option>
                <option value="authority">Authority</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="latitude">Latitude</label>
              <input
                type="number"
                id="latitude"
                name="latitude"
                className="form-control"
                value={formData.latitude}
                onChange={handleChange}
                step="any"
                placeholder="e.g., 40.7128"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="longitude">Longitude</label>
              <input
                type="number"
                id="longitude"
                name="longitude"
                className="form-control"
                value={formData.longitude}
                onChange={handleChange}
                step="any"
                placeholder="e.g., -74.0060"
                required
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        setFormData(prev => ({
                          ...prev,
                          latitude: position.coords.latitude,
                          longitude: position.coords.longitude
                        }));
                      },
                      (error) => {
                        console.error('Error getting location:', error);
                        alert('Error getting location. Please enter coordinates manually.');
                      }
                    );
                  } else {
                    alert('Geolocation is not supported by this browser.');
                  }
                }}
                className="btn btn-secondary"
                style={{ width: '100%', marginBottom: '1rem' }}
              >
                📍 Use Current Location
              </button>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Register'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1rem' }}>
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
