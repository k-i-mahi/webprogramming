import React, { useState, useEffect } from 'react';

const LocationPicker = ({ 
  latitude, 
  longitude, 
  onLocationChange, 
  onGeolocationSuccess,
  onGeolocationError 
}) => {
  const [currentLocation, setCurrentLocation] = useState({
    lat: latitude ? parseFloat(latitude) : null,
    lng: longitude ? parseFloat(longitude) : null
  });
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    if (latitude && longitude) {
      setCurrentLocation({ 
        lat: parseFloat(latitude), 
        lng: parseFloat(longitude) 
      });
    }
  }, [latitude, longitude]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      return;
    }

    setIsGettingLocation(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = { lat: latitude, lng: longitude };
        
        setCurrentLocation(newLocation);
        onLocationChange && onLocationChange(latitude, longitude);
        onGeolocationSuccess && onGeolocationSuccess(newLocation);
        setIsGettingLocation(false);
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location. ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
            break;
        }
        setLocationError(errorMessage);
        onGeolocationError && onGeolocationError(error);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const handleManualInput = (e) => {
    const { name, value } = e.target;
    const numValue = value ? parseFloat(value) : null;
    const newLocation = {
      ...currentLocation,
      [name === 'latitude' ? 'lat' : 'lng']: numValue
    };
    
    setCurrentLocation(newLocation);
    
    if (newLocation.lat && newLocation.lng) {
      onLocationChange && onLocationChange(newLocation.lat, newLocation.lng);
    }
  };

  const openInMaps = () => {
    if (currentLocation.lat && currentLocation.lng) {
      const url = `https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
        Location
      </label>
      
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          className="btn btn-secondary"
          style={{ flex: '1' }}
        >
          {isGettingLocation ? 'Getting Location...' : '📍 Use Current Location'}
        </button>
        
        {currentLocation.lat && currentLocation.lng && (
          <button
            type="button"
            onClick={openInMaps}
            className="btn btn-secondary"
            style={{ flex: '1' }}
          >
            🗺️ View on Map
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <div>
          <label htmlFor="latitude" style={{ fontSize: '0.9rem', color: '#666' }}>
            Latitude
          </label>
          <input
            type="number"
            id="latitude"
            name="latitude"
            className="form-control"
            value={currentLocation.lat || ''}
            onChange={handleManualInput}
            step="any"
            placeholder="e.g., 40.7128"
            style={{ fontSize: '0.9rem' }}
          />
        </div>
        
        <div>
          <label htmlFor="longitude" style={{ fontSize: '0.9rem', color: '#666' }}>
            Longitude
          </label>
          <input
            type="number"
            id="longitude"
            name="longitude"
            className="form-control"
            value={currentLocation.lng || ''}
            onChange={handleManualInput}
            step="any"
            placeholder="e.g., -74.0060"
            style={{ fontSize: '0.9rem' }}
          />
        </div>
      </div>

      {locationError && (
        <div style={{ 
          color: '#dc3545', 
          fontSize: '0.8rem', 
          marginTop: '0.5rem',
          padding: '0.5rem',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px'
        }}>
          {locationError}
        </div>
      )}

      {currentLocation.lat !== null && currentLocation.lng !== null && (
        <div style={{ 
          color: '#28a745', 
          fontSize: '0.8rem', 
          marginTop: '0.5rem',
          padding: '0.5rem',
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '4px'
        }}>
          ✅ Location set: {Number(currentLocation.lat).toFixed(6)}, {Number(currentLocation.lng).toFixed(6)}
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
