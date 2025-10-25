import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
// --- START FIX ---
// import issueService from '../services/issueService'; // Incorrect service used previously
import locationService from '../services/locationService'; // Correct service for bounds query
// --- END FIX ---
import IssueDetailModal from './IssueDetailModal';
import IssueFilters from './IssueFilters';
import Feedback from './Feedback'; // Import Feedback component
import './MapView.css';

// Default center if geolocation fails or is denied (Khulna, Bangladesh)
const DEFAULT_CENTER = { lat: 22.818, lng: 89.5539 };
const DEFAULT_ZOOM = 12;

const MapView = ({ categories = [] }) => {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [loading, setLoading] = useState(true); // Initially true until map+data loads
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({});
  const [mapType, setMapType] = useState('roadmap');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showClustering, setShowClustering] = useState(true);
  const [mapBounds, setMapBounds] = useState(null);
  const [initialCenter, setInitialCenter] = useState(DEFAULT_CENTER);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const heatmapRef = useRef(null);
  const markerClustererRef = useRef(null);
  const infoWindowRef = useRef(null);
  const idleListenerRef = useRef(null); // Ref to store the idle listener

  // Check for Google Maps and required libraries
  const checkGoogleMapsLibraries = useCallback(() => {
    if (!window.google || !window.google.maps) {
      setError(
        'Google Maps API script not loaded. Map functionality is unavailable.',
      );
      setLoading(false);
      return false;
    }
    if (!window.markerClusterer && showClustering) {
      console.warn('Marker Clusterer library not loaded. Clustering disabled.');
      // Optionally disable clustering if library is missing
      // setShowClustering(false);
    }
    if (!window.google.maps.visualization && showHeatmap) {
      console.warn(
        'Google Maps Visualization library not loaded. Heatmap disabled.',
      );
      // Optionally disable heatmap if library is missing
      // setShowHeatmap(false);
    }
    return true;
  }, [showClustering, showHeatmap]);

  // Attempt to get user location for initial centering
  useEffect(() => {
    locationService
      .getCurrentPosition()
      .then((pos) => {
        setInitialCenter({ lat: pos.latitude, lng: pos.longitude });
        console.log(
          '🗺️ Initial center set to user location:',
          pos.latitude,
          pos.longitude,
        );
      })
      .catch((err) => {
        console.warn(
          'Could not get user location for initial map center:',
          err.message,
        );
        // Keep default center
      })
      .finally(() => {
        // Now try initializing the map
        if (mapRef.current && !mapInstanceRef.current) {
          initializeMap();
        }
      });
    // Run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch issues when filters change or map bounds change
  useEffect(() => {
    if (mapInstanceRef.current && mapBounds) {
      loadIssues();
    }
    // Depends on filters and mapBounds
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, mapBounds]);

  const initializeMap = () => {
    if (!checkGoogleMapsLibraries()) {
      return; // Stop if required libraries are missing
    }
    if (!mapRef.current) {
      console.error('Map container ref is not available.');
      setError('Map container not found.');
      setLoading(false);
      return;
    }

    try {
      console.log('🗺️ Initializing map with center:', initialCenter);
      const map = new window.google.maps.Map(mapRef.current, {
        center: initialCenter,
        zoom: DEFAULT_ZOOM,
        mapTypeId: mapType,
        fullscreenControl: true,
        streetViewControl: true,
        zoomControl: true,
        mapTypeControl: true,
        // Optional: Add map style customization here
      });

      infoWindowRef.current = new window.google.maps.InfoWindow();

      // --- START FIX ---
      // Add idle listener *once* after map is created
      idleListenerRef.current = map.addListener('idle', () => {
        // --- END FIX ---
        const bounds = map.getBounds();
        if (bounds) {
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          const newBounds = {
            neLat: ne.lat(),
            neLng: ne.lng(),
            swLat: sw.lat(),
            swLng: sw.lng(),
          };
          // Update bounds state only if they changed significantly to avoid rapid re-fetches
          // (Simple check: compare stringified versions)
          if (JSON.stringify(newBounds) !== JSON.stringify(mapBounds)) {
            console.log('🗺️ Map bounds changed:', newBounds);
            setMapBounds(newBounds); // This useEffect dependency will trigger loadIssues
          }
        }
      });

      mapInstanceRef.current = map;
      // Map is initialized, but data isn't loaded yet
      console.log('🗺️ Map initialized successfully.');

      // --- START FIX ---
      // Trigger initial data load *after* setting the ref and initial bounds
      // We need initial bounds, so get them right after initialization
      const initialBounds = map.getBounds();
      if (initialBounds) {
        const ne = initialBounds.getNorthEast();
        const sw = initialBounds.getSouthWest();
        setMapBounds({
          neLat: ne.lat(),
          neLng: ne.lng(),
          swLat: sw.lat(),
          swLng: sw.lng(),
        }); // Set initial bounds to trigger useEffect -> loadIssues
      } else {
        console.warn(
          'Could not get initial map bounds. Data loading might be delayed.',
        );
        // Fallback: Manually trigger load with default filters after a short delay
        setTimeout(loadIssues, 500);
      }
      // --- END FIX ---
    } catch (err) {
      console.error('❌ Map initialization error:', err);
      setError(`Failed to initialize map: ${err.message}`);
      setLoading(false);
    }
  };

  // Separate function to load issues
  const loadIssues = useCallback(async () => {
    if (!mapInstanceRef.current || !mapBounds) {
      console.log('Load issues skipped: Map not ready or bounds missing.');
      return;
    }

    setLoading(true);
    setError('');
    console.log(
      '🔄 Loading issues for bounds:',
      mapBounds,
      'with filters:',
      filters,
    );

    try {
      // --- START FIX ---
      // Use locationService.getIssuesInBounds
      const response = await locationService.getIssuesInBounds(
        mapBounds,
        filters,
      );
      // locationService returns { data, meta }
      const issuesData = response.data || [];
      // --- END FIX ---

      setIssues(issuesData);
      updateMarkers(issuesData);
      console.log(`✅ Loaded ${issuesData.length} issues.`);
    } catch (err) {
      console.error('❌ Load issues error:', err);
      setError(`Failed to load issues: ${err.message || 'Network error'}`);
      setIssues([]); // Clear issues on error
      updateMarkers([]); // Clear markers on error
    } finally {
      setLoading(false);
    }
  }, [mapBounds, filters]); // Include dependencies

  // Cleanup map listener on unmount
  useEffect(() => {
    return () => {
      if (idleListenerRef.current && window.google) {
        window.google.maps.event.removeListener(idleListenerRef.current);
      }
      // Clean up other resources if necessary (e.g., markerClusterer)
      if (markerClustererRef.current) {
        markerClustererRef.current.clearMarkers();
      }
    };
  }, []);

  const updateMarkers = (issuesData) => {
    if (!mapInstanceRef.current || !window.google) return;

    clearMarkers(); // Clear previous markers/clusters/heatmap

    const newMarkers = issuesData
      .filter(
        (issue) =>
          issue.location?.coordinates && // Ensure coordinates exist
          locationService.isValidCoordinates(
            issue.location.coordinates[1],
            issue.location.coordinates[0],
          ), // Validate coordinates
      )
      .map((issue) => {
        // --- START FIX ---
        // Backend coordinates are [longitude, latitude]
        const lng = issue.location.coordinates[0];
        const lat = issue.location.coordinates[1];
        // --- END FIX ---

        const marker = new window.google.maps.Marker({
          position: { lat, lng },
          // Add to map only if clustering is OFF
          map: !showClustering ? mapInstanceRef.current : null,
          title: issue.title,
          icon: getMarkerIcon(issue),
          // animation: window.google.maps.Animation.DROP, // Can be performance heavy with many markers
        });

        marker.addListener('click', () => {
          handleMarkerClick(issue, marker);
        });

        // Store issue data directly on the marker for easy access
        marker.issueData = issue;

        return marker;
      });

    markersRef.current = newMarkers;

    if (showClustering && window.markerClusterer) {
      updateClustering(newMarkers);
    }

    if (showHeatmap && window.google.maps.visualization) {
      updateHeatmap(issuesData);
      // Explicitly hide individual markers when heatmap is on
      if (!showClustering) {
        markersRef.current.forEach((marker) => marker.setMap(null));
      }
    }
    console.log(`📍 Updated ${newMarkers.length} markers on map.`);
  };

  const clearMarkers = () => {
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    if (markerClustererRef.current) {
      markerClustererRef.current.clearMarkers();
      // It's safer to nullify the ref if the library might re-initialize it
      // markerClustererRef.current = null;
    }

    if (heatmapRef.current) {
      heatmapRef.current.setMap(null);
      heatmapRef.current = null;
    }
  };

  const getMarkerIcon = (issue) => {
    const colors = {
      open: '#3b82f6', // Blue
      'in-progress': '#f59e0b', // Amber
      resolved: '#10b981', // Emerald
      closed: '#6b7280', // Gray
      rejected: '#ef4444', // Red
    };
    const color = colors[issue.status] || colors.closed;

    // Use Google Maps Symbols for better performance than custom SVGs/images for many markers
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 0.9,
      strokeColor: '#ffffff', // White outline
      strokeWeight: 1.5,
      scale:
        issue.priority === 'urgent' ? 9 : issue.priority === 'high' ? 7.5 : 6, // Scale based on priority
    };
  };

  const handleMarkerClick = (issue, marker) => {
    if (!mapInstanceRef.current || !infoWindowRef.current) return;

    // Simple InfoWindow content
    const content = `
      <div class="map-infowindow">
        <h3>${issue.title}</h3>
        <p>${issue.description.substring(0, 80)}${
      issue.description.length > 80 ? '...' : ''
    }</p>
        <div>
          <span class="badge status-${issue.status}">${issue.status}</span>
          <span class="badge priority-${issue.priority}">${
      issue.priority
    }</span>
        </div>
        <button class="view-details-btn" data-issue-id="${
          issue._id
        }">View Details</button>
      </div>
      <style>
        .map-infowindow { font-family: sans-serif; max-width: 250px; padding: 5px; }
        .map-infowindow h3 { margin: 0 0 5px; font-size: 1em; }
        .map-infowindow p { margin: 0 0 8px; font-size: 0.85em; color: #555; }
        .map-infowindow div { margin-bottom: 8px; display: flex; gap: 5px; }
        .map-infowindow .badge { padding: 2px 6px; border-radius: 4px; font-size: 0.75em; text-transform: capitalize; color: white; }
        .map-infowindow .status-open { background-color: #3b82f6; }
        .map-infowindow .status-in-progress { background-color: #f59e0b; }
        .map-infowindow .status-resolved { background-color: #10b981; }
        .map-infowindow .status-closed { background-color: #6b7280; }
        .map-infowindow .priority-low { background-color: #10b981; }
        .map-infowindow .priority-medium { background-color: #f59e0b; }
        .map-infowindow .priority-high { background-color: #f97316; }
        .map-infowindow .priority-urgent { background-color: #ef4444; }
        .map-infowindow .view-details-btn { width: 100%; padding: 6px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9em; margin-top: 5px; }
        /* Prevent button click from closing InfoWindow immediately */
        .gm-style-iw button { pointer-events: auto !important; }
      </style>
    `;

    infoWindowRef.current.setContent(content);
    infoWindowRef.current.open(mapInstanceRef.current, marker);

    // Add listener *after* content is set and opened
    // Use setTimeout to ensure the button exists in the DOM within the InfoWindow
    setTimeout(() => {
      const button = document.querySelector(
        `.view-details-btn[data-issue-id="${issue._id}"]`,
      );
      if (button) {
        // Remove previous listeners if any to prevent duplicates
        button.onclick = null;
        // Add the new listener
        button.onclick = () => viewIssueDetails(issue._id);
      }
    }, 0);
  };

  // Define viewIssueDetails within component scope
  const viewIssueDetails = useCallback(
    (issueId) => {
      const issue = issues.find((i) => i._id === issueId);
      if (issue) {
        console.log('Opening details for issue:', issueId);
        setSelectedIssue(issue);
        setShowIssueModal(true);
        // Close info window when modal opens
        if (infoWindowRef.current) {
          infoWindowRef.current.close();
        }
      } else {
        console.error('Issue not found for ID:', issueId);
      }
    },
    [issues],
  ); // Dependency on 'issues'

  const updateClustering = (markers) => {
    if (!window.markerClusterer) {
      console.warn('Marker Clusterer library not available.');
      return;
    }
    // Clear previous clusterer instance before creating a new one
    if (markerClustererRef.current) {
      markerClustererRef.current.clearMarkers();
    }
    // Create new clusterer
    markerClustererRef.current = new window.markerClusterer.MarkerClusterer({
      map: mapInstanceRef.current,
      markers: markers,
      // Optional: Customize cluster icons
      // renderer: { render: ({ count, position }) => new google.maps.Marker({ position, label: String(count) }) }
    });
    console.log(`🔄 Updated clustering with ${markers.length} markers.`);
  };

  const updateHeatmap = (issuesData) => {
    if (!window.google?.maps?.visualization) {
      console.warn('Heatmap library (visualization) not available.');
      return;
    }

    const heatmapData = issuesData
      .filter(
        (issue) =>
          issue.location?.coordinates &&
          locationService.isValidCoordinates(
            issue.location.coordinates[1],
            issue.location.coordinates[0],
          ),
      )
      .map((issue) => {
        const lng = issue.location.coordinates[0];
        const lat = issue.location.coordinates[1];
        // Weight heatmap points based on priority
        const weight =
          issue.priority === 'urgent' ? 3 : issue.priority === 'high' ? 2 : 1;
        return { location: new window.google.maps.LatLng(lat, lng), weight };
      });

    if (heatmapRef.current) {
      heatmapRef.current.setData(heatmapData); // Update data if heatmap exists
    } else {
      heatmapRef.current = new window.google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        map: mapInstanceRef.current,
        radius: 30, // Adjust radius as needed
        opacity: 0.7,
        // Optional: Gradient customization
        gradient: [
          'rgba(0, 255, 255, 0)', // Transparent Aqua
          'rgba(0, 255, 255, 1)', // Aqua
          'rgba(0, 191, 255, 1)', // Deep Sky Blue
          'rgba(0, 127, 255, 1)', // Azure
          'rgba(0, 63, 255, 1)', // Blue
          'rgba(0, 0, 255, 1)', // Blue
          'rgba(0, 0, 223, 1)', // Medium Blue
          'rgba(0, 0, 191, 1)', // Dark Blue
          'rgba(0, 0, 159, 1)', // Navy
          'rgba(0, 0, 127, 1)', // Midnight Blue
          'rgba(255, 0, 0, 1)', // Red (for high intensity)
        ],
      });
    }
    // Ensure heatmap is visible
    heatmapRef.current.setMap(mapInstanceRef.current);
    console.log(`🔥 Updated heatmap with ${heatmapData.length} points.`);
  };

  const toggleMapType = (type) => {
    if (
      mapInstanceRef.current &&
      ['roadmap', 'satellite', 'hybrid', 'terrain'].includes(type)
    ) {
      setMapType(type);
      mapInstanceRef.current.setMapTypeId(type);
    }
  };

  const toggleHeatmap = () => {
    if (!window.google?.maps?.visualization) {
      setError('Heatmap library not loaded.');
      return;
    }
    const newShowHeatmap = !showHeatmap;
    setShowHeatmap(newShowHeatmap);

    if (newShowHeatmap) {
      // Show heatmap, hide markers/clusters
      updateHeatmap(issues);
      markersRef.current.forEach((marker) => marker.setMap(null));
      if (markerClustererRef.current) markerClustererRef.current.clearMarkers();
    } else {
      // Hide heatmap, show markers/clusters
      if (heatmapRef.current) heatmapRef.current.setMap(null);
      // Re-add markers (respecting clustering setting)
      if (showClustering && window.markerClusterer) {
        updateClustering(markersRef.current);
      } else {
        markersRef.current.forEach((marker) =>
          marker.setMap(mapInstanceRef.current),
        );
      }
    }
  };

  const toggleClustering = () => {
    if (!window.markerClusterer) {
      setError('Marker Clusterer library not loaded.');
      return;
    }
    // Cannot enable clustering if heatmap is on
    if (showHeatmap) return;

    const newShowClustering = !showClustering;
    setShowClustering(newShowClustering);

    if (newShowClustering) {
      // Enable clustering: Add markers to clusterer, remove from map
      markersRef.current.forEach((marker) => marker.setMap(null)); // Hide individual markers first
      updateClustering(markersRef.current);
    } else {
      // Disable clustering: Remove markers from clusterer, add to map
      if (markerClustererRef.current) markerClustererRef.current.clearMarkers();
      markersRef.current.forEach((marker) =>
        marker.setMap(mapInstanceRef.current),
      );
    }
  };

  const handleFiltersChange = (newFilters) => {
    console.log('🗺️ Filters changed:', newFilters);
    setFilters(newFilters); // This will trigger the useEffect to load issues
  };

  const handleIssueUpdate = () => {
    loadIssues(); // Reload issues after an update in the modal
    setShowIssueModal(false);
    setSelectedIssue(null);
  };

  // --- Utility for Legend ---
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

  // --- Render Logic ---
  return (
    <div className="map-view">
      {/* Map Controls */}
      <div className="map-controls">
        <IssueFilters
          categories={categories}
          onFiltersChange={handleFiltersChange}
          // Only show user-specific filters if logged in
          showUserFilters={!!user}
        />

        <div className="view-controls">
          {/* Map Type Selector */}
          <div className="control-group">
            <label className="control-label">Map Type</label>
            <div className="button-group">
              {['roadmap', 'satellite', 'terrain'].map((type) => (
                <button
                  key={type}
                  className={`control-btn ${mapType === type ? 'active' : ''}`}
                  onClick={() => toggleMapType(type)}
                  title={type.charAt(0).toUpperCase() + type.slice(1)}
                >
                  {type === 'roadmap'
                    ? '🗺️'
                    : type === 'satellite'
                    ? '🛰️'
                    : '⛰️'}
                  <span className="btn-text">
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* View Options */}
          <div className="control-group">
            <label className="control-label">View Options</label>
            <div className="button-group">
              <button
                className={`control-btn ${showHeatmap ? 'active' : ''}`}
                onClick={toggleHeatmap}
                disabled={!window.google?.maps?.visualization}
                title={
                  window.google?.maps?.visualization
                    ? showHeatmap
                      ? 'Hide Heatmap'
                      : 'Show Heatmap'
                    : 'Heatmap library not loaded'
                }
              >
                🔥<span className="btn-text">Heatmap</span>
              </button>
              <button
                className={`control-btn ${showClustering ? 'active' : ''}`}
                onClick={toggleClustering}
                disabled={showHeatmap || !window.markerClusterer} // Disable if heatmap is on or library missing
                title={
                  window.markerClusterer
                    ? showClustering
                      ? 'Disable Clustering'
                      : 'Enable Clustering'
                    : 'Clustering library not loaded'
                }
              >
                📍<span className="btn-text">Clustering</span>
              </button>
            </div>
          </div>

          {/* Stats Display */}
          <div className="map-stats">
            <div className="stat-item">
              <span className="stat-label">Issues Visible:</span>
              <span className="stat-value">
                {loading ? '...' : issues.length}
              </span>
            </div>
            {/* Add more stats if needed */}
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="map-container">
        {/* Initial Loading or Error before map is ready */}
        {!mapInstanceRef.current && (loading || error) && (
          <div className="map-feedback-overlay">
            {loading && (
              <Feedback type="loading" message="Initializing Map..." />
            )}
            {error && (
              <Feedback type="error" title="Map Error" message={error} />
            )}
          </div>
        )}

        {/* Map Canvas */}
        <div
          ref={mapRef}
          className={`map-canvas ${loading ? 'loading' : ''}`}
        />

        {/* Legend (only if map is ready and heatmap is off) */}
        {mapInstanceRef.current && !showHeatmap && (
          <div className="map-legend">
            <h4 className="legend-title">Status Key</h4>
            <div className="legend-items">
              {['open', 'in-progress', 'resolved', 'closed'].map((status) => (
                <div key={status} className="legend-item">
                  <span
                    className="legend-color"
                    style={{ backgroundColor: getStatusColor(status) }}
                  />
                  <span className="legend-label">
                    {status.replace('-', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading Overlay for Data Fetch */}
        {mapInstanceRef.current && loading && (
          <div className="map-loading-overlay data-loading">
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
          onClose={() => {
            setShowIssueModal(false);
            setSelectedIssue(null); // Clear selected issue on close
          }}
          // Pass user to modal if needed for permissions
          // currentUser={user}
          onUpdate={handleIssueUpdate} // Reload data if issue updated in modal
        />
      )}
    </div>
  );
};

export default MapView;
