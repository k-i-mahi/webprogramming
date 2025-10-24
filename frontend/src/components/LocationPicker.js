import React, { useState, useEffect, useRef } from 'react';
import './LocationPicker.css';

const LocationPicker = ({
  latitude,
  longitude,
  address,
  onLocationChange,
  disabled = false,
  showMap = true,
  height = '300px',
}) => {
  const [location, setLocation] = useState({
    lat: latitude ? parseFloat(latitude) : null,
    lng: longitude ? parseFloat(longitude) : null,
  });

  const [currentAddress, setCurrentAddress] = useState(address || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapReady, setMapReady] = useState(false);

  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Initialize map when location is available
  useEffect(() => {
    if (location.lat && location.lng && showMap && !mapInstanceRef.current) {
      initializeMap();
    }
  }, [location, showMap]);

  // Update location when props change
  useEffect(() => {
    if (latitude && longitude) {
      const newLat = parseFloat(latitude);
      const newLng = parseFloat(longitude);

      if (newLat !== location.lat || newLng !== location.lng) {
        setLocation({ lat: newLat, lng: newLng });
        updateMapLocation(newLat, newLng);
      }
    }

    if (address && address !== currentAddress) {
      setCurrentAddress(address);
    }
  }, [latitude, longitude, address]);

  const initializeMap = () => {
    // Check if Google Maps is loaded
    if (!window.google || !window.google.maps) {
      console.error('Google Maps not loaded');
      setError('Map service not available');
      return;
    }

    try {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: location.lat, lng: location.lng },
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      });

      const marker = new window.google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: map,
        draggable: !disabled,
        title: 'Issue Location',
      });

      // Handle marker drag
      if (!disabled) {
        marker.addListener('dragend', (event) => {
          const newLat = event.latLng.lat();
          const newLng = event.latLng.lng();
          handleLocationUpdate(newLat, newLng);
        });

        // Handle map click
        map.addListener('click', (event) => {
          const newLat = event.latLng.lat();
          const newLng = event.latLng.lng();
          marker.setPosition({ lat: newLat, lng: newLng });
          handleLocationUpdate(newLat, newLng);
        });
      }

      mapInstanceRef.current = map;
      markerRef.current = marker;
      setMapReady(true);
      setError('');
    } catch (err) {
      console.error('Map initialization error:', err);
      setError('Failed to initialize map');
    }
  };

  const updateMapLocation = (lat, lng) => {
    if (mapInstanceRef.current && markerRef.current) {
      const position = { lat, lng };
      mapInstanceRef.current.setCenter(position);
      markerRef.current.setPosition(position);
    }
  };

  const handleLocationUpdate = (lat, lng) => {
    setLocation({ lat, lng });

    // Reverse geocode to get address
    reverseGeocode(lat, lng);

    // Notify parent
    if (onLocationChange) {
      onLocationChange({
        latitude: lat,
        longitude: lng,
        address: currentAddress,
      });
    }
  };

  const reverseGeocode = async (lat, lng) => {
    if (!window.google || !window.google.maps) return;

    const geocoder = new window.google.maps.Geocoder();
    const latlng = { lat, lng };

    try {
      geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const address = results[0].formatted_address;
          setCurrentAddress(address);

          if (onLocationChange) {
            onLocationChange({
              latitude: lat,
              longitude: lng,
              address: address,
            });
          }
        }
      });
    } catch (err) {
      console.error('Geocoding error:', err);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setLocation({ lat, lng });
        handleLocationUpdate(lat, lng);
        updateMapLocation(lat, lng);
        setLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Unable to get your location';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
          default:
            errorMessage = 'An unknown error occurred';
        }

        setError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  const handleCoordinateChange = (field, value) => {
    const numValue = parseFloat(value);

    if (isNaN(numValue)) return;

    const newLocation = {
      ...location,
      [field]: numValue,
    };

    setLocation(newLocation);

    if (newLocation.lat && newLocation.lng) {
      handleLocationUpdate(newLocation.lat, newLocation.lng);
      updateMapLocation(newLocation.lat, newLocation.lng);
    }
  };

  const isValidLocation = () => {
    return (
      location.lat !== null &&
      location.lng !== null &&
      !isNaN(location.lat) &&
      !isNaN(location.lng) &&
      location.lat >= -90 &&
      location.lat <= 90 &&
      location.lng >= -180 &&
      location.lng <= 180
    );
  };

  return (
    <div className="location-picker">
      {/* Current Location Button */}
      <div className="location-actions">
        <button
          type="button"
          className="btn-current-location"
          onClick={getCurrentLocation}
          disabled={disabled || loading}
        >
          <span className="location-icon">📍</span>
          <span>
            {loading ? 'Getting Location...' : 'Use Current Location'}
          </span>
        </button>

        {isValidLocation() && (
          <div className="location-status">
            <span className="status-icon">✓</span>
            <span className="status-text">Location set</span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="location-error">
          <span className="error-icon">⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Coordinates Input */}
      <div className="coordinates-input">
        <div className="coordinate-group">
          <label htmlFor="latitude" className="coordinate-label">
            Latitude
          </label>
          <input
            type="number"
            id="latitude"
            step="any"
            min="-90"
            max="90"
            value={location.lat || ''}
            onChange={(e) => handleCoordinateChange('lat', e.target.value)}
            placeholder="e.g., 40.7128"
            className="coordinate-input"
            disabled={disabled}
            required
          />
        </div>

        <div className="coordinate-group">
          <label htmlFor="longitude" className="coordinate-label">
            Longitude
          </label>
          <input
            type="number"
            id="longitude"
            step="any"
            min="-180"
            max="180"
            value={location.lng || ''}
            onChange={(e) => handleCoordinateChange('lng', e.target.value)}
            placeholder="e.g., -74.0060"
            className="coordinate-input"
            disabled={disabled}
            required
          />
        </div>
      </div>

      {/* Address Display */}
      {currentAddress && (
        <div className="address-display">
          <label className="address-label">Address</label>
          <div className="address-value">
            <span className="address-icon">📌</span>
            <span>{currentAddress}</span>
          </div>
        </div>
      )}

      {/* Map */}
      {showMap && isValidLocation() && (
        <div className="map-container">
          <div ref={mapRef} className="map-canvas" style={{ height }} />
          {!mapReady && (
            <div className="map-loading">
              <div className="spinner"></div>
              <p>Loading map...</p>
            </div>
          )}
          {!disabled && (
            <div className="map-hint">
              <span className="hint-icon">💡</span>
              <span>Click on the map or drag the marker to set location</span>
            </div>
          )}
        </div>
      )}

      {/* Loading Google Maps Script */}
      {!window.google && showMap && (
        <div className="map-loading">
          <p>Loading map service...</p>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
