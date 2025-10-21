import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';

const Profile = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar: '',
    latitude: '',
    longitude: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        avatar: user.avatar || '',
        latitude: user.location?.latitude || '',
        longitude: user.location?.longitude || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await authService.updateProfile({
        id: user.id,
        ...formData
      });
      setMessage('Profile updated successfully!');
    } catch (error) {
      setMessage('Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1>Profile</h1>
        
        {message && (
          <div className={`alert ${message.includes('Error') ? 'alert-danger' : 'alert-success'}`}>
            {message}
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
            <label htmlFor="avatar">Avatar URL</label>
            <input
              type="url"
              id="avatar"
              name="avatar"
              className="form-control"
              value={formData.avatar}
              onChange={handleChange}
              placeholder="https://example.com/avatar.jpg"
            />
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
              📍 Update Location
            </button>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
