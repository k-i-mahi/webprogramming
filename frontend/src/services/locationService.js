import api from './api';
import { API_ENDPOINTS } from '../config/api.config';

const locationService = {
  // ============================================
  // GEOCODING
  // ============================================

  /**
   * Geocode address to coordinates
   * @param {string} address - Address to geocode
   * @returns {Promise}
   */
  geocode: async (address) => {
    try {
      const response = await api.get(API_ENDPOINTS.LOCATION.GEOCODE, {
        params: { address },
      });
      return response.data;
    } catch (error) {
      console.error('Geocode error:', error);
      throw error;
    }
  },

  /**
   * Reverse geocode coordinates to address
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @returns {Promise}
   */
  reverseGeocode: async (latitude, longitude) => {
    try {
      const response = await api.get(API_ENDPOINTS.LOCATION.REVERSE_GEOCODE, {
        params: { latitude, longitude },
      });
      return response.data;
    } catch (error) {
      console.error('Reverse geocode error:', error);
      throw error;
    }
  },

  // ============================================
  // GEOLOCATION
  // ============================================

  /**
   * Get current position using browser geolocation
   * @param {Object} options - Geolocation options
   * @returns {Promise}
   */
  getCurrentPosition: (options = {}) => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const defaultOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
        ...options,
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp,
          });
        },
        (error) => {
          let message = 'Failed to get location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location permission denied';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              message = 'Location request timeout';
              break;
            default:
              message = 'An unknown error occurred';
              break;
          }
          reject(new Error(message));
        },
        defaultOptions,
      );
    });
  },

  /**
   * Watch position changes
   * @param {Function} successCallback - Success callback
   * @param {Function} errorCallback - Error callback
   * @param {Object} options - Geolocation options
   * @returns {number} Watch ID
   */
  watchPosition: (successCallback, errorCallback, options = {}) => {
    if (!navigator.geolocation) {
      errorCallback(new Error('Geolocation is not supported'));
      return null;
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...options,
    };

    return navigator.geolocation.watchPosition(
      (position) => {
        successCallback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        errorCallback(error);
      },
      defaultOptions,
    );
  },

  /**
   * Clear watch position
   * @param {number} watchId - Watch ID to clear
   */
  clearWatch: (watchId) => {
    if (watchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  },

  // ============================================
  // DISTANCE & PROXIMITY
  // ============================================

  /**
   * Calculate distance between two points
   * @param {number} lat1 - Latitude 1
   * @param {number} lng1 - Longitude 1
   * @param {number} lat2 - Latitude 2
   * @param {number} lng2 - Longitude 2
   * @returns {Promise}
   */
  calculateDistance: async (lat1, lng1, lat2, lng2) => {
    try {
      const response = await api.get(API_ENDPOINTS.LOCATION.DISTANCE, {
        params: { lat1, lng1, lat2, lng2 },
      });
      return response.data;
    } catch (error) {
      console.error('Calculate distance error:', error);
      throw error;
    }
  },

  /**
   * Calculate distance using Haversine formula (client-side)
   * @param {number} lat1 - Latitude 1
   * @param {number} lng1 - Longitude 1
   * @param {number} lat2 - Latitude 2
   * @param {number} lng2 - Longitude 2
   * @returns {number} Distance in kilometers
   */
  calculateDistanceLocal: (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = locationService.toRadians(lat2 - lat1);
    const dLng = locationService.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(locationService.toRadians(lat1)) *
        Math.cos(locationService.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance; // in kilometers
  },

  /**
   * Get nearby locations
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @param {number} radius - Radius in kilometers
   * @param {Object} filters - Additional filters
   * @returns {Promise}
   */
  getNearbyLocations: async (latitude, longitude, radius = 5, filters = {}) => {
    try {
      const response = await api.get(API_ENDPOINTS.LOCATION.NEARBY, {
        params: { latitude, longitude, radius, ...filters },
      });
      return response.data;
    } catch (error) {
      console.error('Get nearby locations error:', error);
      throw error;
    }
  },

  // ============================================
  // VALIDATION
  // ============================================

  /**
   * Validate coordinates
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @returns {Promise}
   */
  validateCoordinates: async (latitude, longitude) => {
    try {
      const response = await api.get(API_ENDPOINTS.LOCATION.VALIDATE, {
        params: { latitude, longitude },
      });
      return response.data;
    } catch (error) {
      console.error('Validate coordinates error:', error);
      throw error;
    }
  },

  /**
   * Validate coordinates (client-side)
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @returns {boolean}
   */
  isValidCoordinates: (latitude, longitude) => {
    return (
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  },

  /**
   * Validate address format
   * @param {string} address - Address to validate
   * @returns {boolean}
   */
  isValidAddress: (address) => {
    return address && typeof address === 'string' && address.trim().length >= 5;
  },

  // ============================================
  // FORMATTING
  // ============================================

  /**
   * Format coordinates
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @param {number} precision - Decimal precision
   * @returns {string}
   */
  formatCoordinates: (latitude, longitude, precision = 6) => {
    return `${latitude.toFixed(precision)}, ${longitude.toFixed(precision)}`;
  },

  /**
   * Format distance
   * @param {number} distance - Distance in kilometers
   * @param {string} unit - Unit ('km' or 'mi')
   * @returns {string}
   */
  formatDistance: (distance, unit = 'km') => {
    if (unit === 'mi') {
      const miles = distance * 0.621371;
      return miles < 0.1
        ? `${Math.round(miles * 5280)} ft`
        : `${miles.toFixed(2)} mi`;
    }

    return distance < 1
      ? `${Math.round(distance * 1000)} m`
      : `${distance.toFixed(2)} km`;
  },

  /**
   * Format location object
   * @param {Object} location - Location object
   * @returns {Object}
   */
  formatLocation: (location) => {
    return {
      latitude: location.latitude || location.lat,
      longitude: location.longitude || location.lng,
      address: location.address || '',
      city: location.city || '',
      state: location.state || '',
      country: location.country || '',
      postalCode: location.postalCode || location.zip || '',
      formatted: location.formatted_address || location.address,
    };
  },

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Convert degrees to radians
   * @param {number} degrees - Degrees
   * @returns {number}
   */
  toRadians: (degrees) => {
    return degrees * (Math.PI / 180);
  },

  /**
   * Convert radians to degrees
   * @param {number} radians - Radians
   * @returns {number}
   */
  toDegrees: (radians) => {
    return radians * (180 / Math.PI);
  },

  /**
   * Get bounds for a given center and radius
   * @param {number} latitude - Center latitude
   * @param {number} longitude - Center longitude
   * @param {number} radius - Radius in kilometers
   * @returns {Object}
   */
  getBounds: (latitude, longitude, radius) => {
    const lat = locationService.toRadians(latitude);
    const lng = locationService.toRadians(longitude);
    const r = radius / 6371; // Earth radius in km

    const minLat = lat - r;
    const maxLat = lat + r;

    const deltaLng = Math.asin(Math.sin(r) / Math.cos(lat));
    const minLng = lng - deltaLng;
    const maxLng = lng + deltaLng;

    return {
      minLatitude: locationService.toDegrees(minLat),
      maxLatitude: locationService.toDegrees(maxLat),
      minLongitude: locationService.toDegrees(minLng),
      maxLongitude: locationService.toDegrees(maxLng),
    };
  },

  /**
   * Get center point from multiple coordinates
   * @param {Array} coordinates - Array of {lat, lng} objects
   * @returns {Object}
   */
  getCenterPoint: (coordinates) => {
    if (!coordinates || coordinates.length === 0) {
      return null;
    }

    if (coordinates.length === 1) {
      return {
        latitude: coordinates[0].lat || coordinates[0].latitude,
        longitude: coordinates[0].lng || coordinates[0].longitude,
      };
    }

    let x = 0,
      y = 0,
      z = 0;

    coordinates.forEach((coord) => {
      const lat = locationService.toRadians(coord.lat || coord.latitude);
      const lng = locationService.toRadians(coord.lng || coord.longitude);

      x += Math.cos(lat) * Math.cos(lng);
      y += Math.cos(lat) * Math.sin(lng);
      z += Math.sin(lat);
    });

    const total = coordinates.length;
    x /= total;
    y /= total;
    z /= total;

    const centralLng = Math.atan2(y, x);
    const centralSquareRoot = Math.sqrt(x * x + y * y);
    const centralLat = Math.atan2(z, centralSquareRoot);

    return {
      latitude: locationService.toDegrees(centralLat),
      longitude: locationService.toDegrees(centralLng),
    };
  },

  /**
   * Check if point is within radius
   * @param {number} lat1 - Point latitude
   * @param {number} lng1 - Point longitude
   * @param {number} lat2 - Center latitude
   * @param {number} lng2 - Center longitude
   * @param {number} radius - Radius in kilometers
   * @returns {boolean}
   */
  isWithinRadius: (lat1, lng1, lat2, lng2, radius) => {
    const distance = locationService.calculateDistanceLocal(
      lat1,
      lng1,
      lat2,
      lng2,
    );
    return distance <= radius;
  },

  /**
   * Sort locations by distance
   * @param {Array} locations - Array of locations with lat/lng
   * @param {number} centerLat - Center latitude
   * @param {number} centerLng - Center longitude
   * @returns {Array}
   */
  sortByDistance: (locations, centerLat, centerLng) => {
    return locations
      .map((location) => ({
        ...location,
        distance: locationService.calculateDistanceLocal(
          centerLat,
          centerLng,
          location.latitude || location.lat,
          location.longitude || location.lng,
        ),
      }))
      .sort((a, b) => a.distance - b.distance);
  },

  /**
   * Filter locations by radius
   * @param {Array} locations - Array of locations
   * @param {number} centerLat - Center latitude
   * @param {number} centerLng - Center longitude
   * @param {number} radius - Radius in kilometers
   * @returns {Array}
   */
  filterByRadius: (locations, centerLat, centerLng, radius) => {
    return locations.filter((location) =>
      locationService.isWithinRadius(
        location.latitude || location.lat,
        location.longitude || location.lng,
        centerLat,
        centerLng,
        radius,
      ),
    );
  },

  // ============================================
  // MAP HELPERS
  // ============================================

  /**
   * Generate Google Maps URL
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @param {number} zoom - Zoom level
   * @returns {string}
   */
  getGoogleMapsUrl: (latitude, longitude, zoom = 15) => {
    return `https://www.google.com/maps?q=${latitude},${longitude}&z=${zoom}`;
  },

  /**
   * Generate Google Maps directions URL
   * @param {Object} origin - Origin coordinates {lat, lng}
   * @param {Object} destination - Destination coordinates {lat, lng}
   * @returns {string}
   */
  getDirectionsUrl: (origin, destination) => {
    return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`;
  },

  /**
   * Generate static map image URL
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @param {Object} options - Map options (zoom, size, markers)
   * @returns {string}
   */
  getStaticMapUrl: (latitude, longitude, options = {}) => {
    const {
      zoom = 15,
      width = 600,
      height = 400,
      marker = true,
      apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    } = options;

    let url = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=${zoom}&size=${width}x${height}`;

    if (marker) {
      url += `&markers=color:red%7C${latitude},${longitude}`;
    }

    if (apiKey) {
      url += `&key=${apiKey}`;
    }

    return url;
  },

  // ============================================
  // STORAGE
  // ============================================

  /**
   * Save location to local storage
   * @param {string} key - Storage key
   * @param {Object} location - Location object
   */
  saveLocation: (key, location) => {
    try {
      localStorage.setItem(
        `location_${key}`,
        JSON.stringify({
          ...location,
          timestamp: Date.now(),
        }),
      );
    } catch (error) {
      console.error('Save location error:', error);
    }
  },

  /**
   * Get location from local storage
   * @param {string} key - Storage key
   * @param {number} maxAge - Maximum age in milliseconds
   * @returns {Object|null}
   */
  getSavedLocation: (key, maxAge = 3600000) => {
    try {
      const saved = localStorage.getItem(`location_${key}`);
      if (!saved) return null;

      const location = JSON.parse(saved);

      // Check if expired
      if (maxAge && Date.now() - location.timestamp > maxAge) {
        localStorage.removeItem(`location_${key}`);
        return null;
      }

      return location;
    } catch (error) {
      console.error('Get saved location error:', error);
      return null;
    }
  },

  /**
   * Clear saved location
   * @param {string} key - Storage key
   */
  clearSavedLocation: (key) => {
    try {
      localStorage.removeItem(`location_${key}`);
    } catch (error) {
      console.error('Clear saved location error:', error);
    }
  },

  /**
   * Get last known location
   * @returns {Object|null}
   */
  getLastKnownLocation: () => {
    return locationService.getSavedLocation('last_known');
  },

  /**
   * Save last known location
   * @param {Object} location - Location object
   */
  saveLastKnownLocation: (location) => {
    locationService.saveLocation('last_known', location);
  },
};

export default locationService;
