import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import issueService from '../services/issueService';
import IssueDetailModal from './IssueDetailModal';
import IssueFilters from './IssueFilters';
import './MapView.css';

const MapView = ({ categories = [] }) => {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({});
  const [mapType, setMapType] = useState('roadmap'); // roadmap, satellite, hybrid, terrain
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showClustering, setShowClustering] = useState(true);
  const [mapBounds, setMapBounds] = useState(null);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const heatmapRef = useRef(null);
  const markerClustererRef = useRef(null);
  const infoWindowRef = useRef(null);

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      initializeMap();
    }
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) {
      loadIssues();
    }
  }, [filters]);

  const initializeMap = () => {
    if (!window.google || !window.google.maps) {
      setError('Google Maps not loaded');
      return;
    }

    try {
      // Default center (you can change this)
      const defaultCenter = { lat: 40.7128, lng: -74.006 };

      const map = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 12,
        mapTypeId: mapType,
        fullscreenControl: true,
        streetViewControl: true,
        zoomControl: true,
        mapTypeControl: true,
      });

      // Info window for markers
      infoWindowRef.current = new window.google.maps.InfoWindow();

      // Listen to bounds changes
      map.addListener('idle', () => {
        const bounds = map.getBounds();
        if (bounds) {
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();

          setMapBounds({
            neLat: ne.lat(),
            neLng: ne.lng(),
            swLat: sw.lat(),
            swLng: sw.lng(),
          });
        }
      });

      mapInstanceRef.current = map;
      setLoading(false);

      // Try to get user's location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            map.setCenter(userLocation);
            map.setZoom(13);
          },
          (error) => {
            console.log('Geolocation error:', error);
          },
        );
      }
    } catch (err) {
      console.error('Map initialization error:', err);
      setError('Failed to initialize map');
      setLoading(false);
    }
  };

  const loadIssues = async () => {
    if (!mapInstanceRef.current) return;

    try {
      setLoading(true);
      setError('');

      let response;

      if (mapBounds) {
        // Get issues within map bounds
        response = await issueService.getIssuesInBounds(mapBounds, filters);
      } else {
        // Get all issues with filters
        response = await issueService.getIssues({ ...filters, limit: 1000 });
      }

      setIssues(response.data || []);
      updateMarkers(response.data || []);
    } catch (err) {
      console.error('Load issues error:', err);
      setError('Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  const updateMarkers = (issuesData) => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    clearMarkers();

    // Create markers for each issue
    const newMarkers = issuesData
      .filter((issue) => issue.location?.coordinates)
      .map((issue) => {
        const [lng, lat] = issue.location.coordinates;

        const marker = new window.google.maps.Marker({
          position: { lat, lng },
          map: showClustering ? null : mapInstanceRef.current,
          title: issue.title,
          icon: getMarkerIcon(issue),
          animation: window.google.maps.Animation.DROP,
        });

        marker.addListener('click', () => {
          handleMarkerClick(issue, marker);
        });

        return marker;
      });

    markersRef.current = newMarkers;

    // Update clustering
    if (showClustering && window.markerClusterer) {
      updateClustering(newMarkers);
    }

    // Update heatmap
    if (showHeatmap) {
      updateHeatmap(issuesData);
    }
  };

  const clearMarkers = () => {
    // Remove all markers from map
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Clear clusterer
    if (markerClustererRef.current) {
      markerClustererRef.current.clearMarkers();
    }

    // Clear heatmap
    if (heatmapRef.current) {
      heatmapRef.current.setMap(null);
    }
  };

  const getMarkerIcon = (issue) => {
    const colors = {
      open: '#3b82f6',
      'in-progress': '#f59e0b',
      resolved: '#10b981',
      closed: '#6b7280',
      rejected: '#ef4444',
    };

    const color = colors[issue.status] || '#6b7280';

    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 0.9,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale:
        issue.priority === 'urgent' ? 12 : issue.priority === 'high' ? 10 : 8,
    };
  };

  const handleMarkerClick = (issue, marker) => {
    // Show info window
    const content = `
      <div style="padding: 12px; max-width: 250px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #1f2937;">
          ${issue.title}
        </h3>
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #4b5563; line-height: 1.4;">
          ${issue.description.substring(0, 100)}${
      issue.description.length > 100 ? '...' : ''
    }
        </p>
        <div style="display: flex; gap: 8px; margin-bottom: 12px;">
          <span style="padding: 4px 8px; background: #dbeafe; color: #1e40af; border-radius: 4px; font-size: 12px; font-weight: 600;">
            ${issue.status}
          </span>
          <span style="padding: 4px 8px; background: #fee2e2; color: #991b1b; border-radius: 4px; font-size: 12px; font-weight: 600;">
            ${issue.priority}
          </span>
        </div>
        <button 
          onclick="window.viewIssueDetails('${issue._id}')"
          style="width: 100%; padding: 8px; background: #667eea; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;"
        >
          View Details
        </button>
      </div>
    `;

    infoWindowRef.current.setContent(content);
    infoWindowRef.current.open(mapInstanceRef.current, marker);
  };

  // Global function for info window button
  useEffect(() => {
    window.viewIssueDetails = (issueId) => {
      const issue = issues.find((i) => i._id === issueId);
      if (issue) {
        setSelectedIssue(issue);
        setShowIssueModal(true);
      }
    };

    return () => {
      delete window.viewIssueDetails;
    };
  }, [issues]);

  const updateClustering = (markers) => {
    if (!window.markerClusterer) {
      console.warn('Marker Clusterer not loaded');
      return;
    }

    if (markerClustererRef.current) {
      markerClustererRef.current.clearMarkers();
    }

    markerClustererRef.current = new window.markerClusterer.MarkerClusterer({
      map: mapInstanceRef.current,
      markers: markers,
    });
  };

  const updateHeatmap = (issuesData) => {
    if (!window.google?.maps?.visualization) {
      console.warn('Heatmap library not loaded');
      return;
    }

    const heatmapData = issuesData
      .filter((issue) => issue.location?.coordinates)
      .map((issue) => {
        const [lng, lat] = issue.location.coordinates;
        const weight =
          issue.priority === 'urgent' ? 3 : issue.priority === 'high' ? 2 : 1;

        return {
          location: new window.google.maps.LatLng(lat, lng),
          weight: weight,
        };
      });

    if (heatmapRef.current) {
      heatmapRef.current.setMap(null);
    }

    heatmapRef.current = new window.google.maps.visualization.HeatmapLayer({
      data: heatmapData,
      map: mapInstanceRef.current,
      radius: 30,
      opacity: 0.6,
    });
  };

  const toggleMapType = (type) => {
    setMapType(type);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setMapTypeId(type);
    }
  };

  const toggleHeatmap = () => {
    const newShowHeatmap = !showHeatmap;
    setShowHeatmap(newShowHeatmap);

    if (newShowHeatmap) {
      updateHeatmap(issues);
      // Hide markers when showing heatmap
      markersRef.current.forEach((marker) => marker.setMap(null));
      if (markerClustererRef.current) {
        markerClustererRef.current.clearMarkers();
      }
    } else {
      // Show markers when hiding heatmap
      if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
      }
      updateMarkers(issues);
    }
  };

  const toggleClustering = () => {
    const newShowClustering = !showClustering;
    setShowClustering(newShowClustering);

    if (newShowClustering) {
      updateClustering(markersRef.current);
    } else {
      if (markerClustererRef.current) {
        markerClustererRef.current.clearMarkers();
      }
      markersRef.current.forEach((marker) =>
        marker.setMap(mapInstanceRef.current),
      );
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleIssueUpdate = () => {
    loadIssues();
    setShowIssueModal(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      open: '#3b82f6',
      'in-progress': '#f59e0b',
      resolved: '#10b981',
      closed: '#6b7280',
      rejected: '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  return (
    <div className="map-view">
      {/* Map Controls */}
      <div className="map-controls">
        <IssueFilters
          categories={categories}
          onFiltersChange={handleFiltersChange}
          showUserFilters={!!user}
        />

        <div className="view-controls">
          {/* Map Type Selector */}
          <div className="control-group">
            <label className="control-label">Map Type</label>
            <div className="button-group">
              <button
                className={`control-btn ${
                  mapType === 'roadmap' ? 'active' : ''
                }`}
                onClick={() => toggleMapType('roadmap')}
              >
                🗺️ Map
              </button>
              <button
                className={`control-btn ${
                  mapType === 'satellite' ? 'active' : ''
                }`}
                onClick={() => toggleMapType('satellite')}
              >
                🛰️ Satellite
              </button>
              <button
                className={`control-btn ${
                  mapType === 'terrain' ? 'active' : ''
                }`}
                onClick={() => toggleMapType('terrain')}
              >
                ⛰️ Terrain
              </button>
            </div>
          </div>

          {/* View Options */}
          <div className="control-group">
            <label className="control-label">View Options</label>
            <div className="button-group">
              <button
                className={`control-btn ${showHeatmap ? 'active' : ''}`}
                onClick={toggleHeatmap}
              >
                🔥 Heatmap
              </button>
              <button
                className={`control-btn ${showClustering ? 'active' : ''}`}
                onClick={toggleClustering}
                disabled={showHeatmap}
              >
                📍 Clustering
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="map-stats">
            <div className="stat-item">
              <span className="stat-label">Total Issues</span>
              <span className="stat-value">{issues.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="map-container">
        {loading && !mapInstanceRef.current && (
          <div className="map-loading">
            <div className="spinner"></div>
            <p>Loading map...</p>
          </div>
        )}

        {error && (
          <div className="map-error">
            <span className="error-icon">⚠</span>
            <span>{error}</span>
          </div>
        )}

        <div ref={mapRef} className="map-canvas" />

        {/* Legend */}
        {!showHeatmap && (
          <div className="map-legend">
            <h4 className="legend-title">Status</h4>
            <div className="legend-items">
              {['open', 'in-progress', 'resolved', 'closed'].map((status) => (
                <div key={status} className="legend-item">
                  <span
                    className="legend-color"
                    style={{ backgroundColor: getStatusColor(status) }}
                  />
                  <span className="legend-label">{status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && mapInstanceRef.current && (
          <div className="map-loading-overlay">
            <div className="spinner-small"></div>
            <span>Loading issues...</span>
          </div>
        )}
      </div>

      {/* Issue Detail Modal */}
      {showIssueModal && selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          isOpen={showIssueModal}
          onClose={() => setShowIssueModal(false)}
          onUpdate={handleIssueUpdate}
        />
      )}
    </div>
  );
};

export default MapView;
