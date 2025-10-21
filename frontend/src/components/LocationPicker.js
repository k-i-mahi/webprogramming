import React, { useState, useEffect } from 'react';

const LocationPicker = ({ 
  latitude, 
  longitude, 
  onLocationChange, 
  onGeolocationSuccess,
  onGeolocationError 
}) => {
  const [currentLocation, setCurrentLocation] = useState({
    lat: latitude || null,
    lng: longitude || null
  });
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    if (latitude && longitude) {
      setCurrentLocation({ lat: latitude, lng: longitude });
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
    const newLocation = {
      ...currentLocation,
      [name === 'latitude' ? 'lat' : 'lng']: parseFloat(value) || null
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

      <div className="form-grid-2">
        <div>
          <label htmlFor="latitude" className="text-sm text-gray-600">
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
          />
        </div>
        
        <div>
          <label htmlFor="longitude" className="text-sm text-gray-600">
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
          />
        </div>
      </div>

      {locationError && (
        <div className="alert alert-danger mt-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {locationError}
        </div>
      )}

      {currentLocation.lat && currentLocation.lng && (
        <div className="alert alert-success mt-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Location set: {Number(currentLocation.lat).toFixed(6)}, {Number(currentLocation.lng).toFixed(6)}
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
