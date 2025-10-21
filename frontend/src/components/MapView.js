import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import issueService from '../services/issueService';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const MapView = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [mapCenter, setMapCenter] = useState([40.7128, -74.0060]); // Default to NYC
  const [mapZoom, setMapZoom] = useState(10);

  useEffect(() => {
    loadIssues();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter([position.coords.latitude, position.coords.longitude]);
          setMapZoom(13);
        },
        (error) => {
          console.log('Could not get user location:', error);
          // Keep default location
        }
      );
    }
  };

  const loadIssues = async () => {
    try {
      const response = await issueService.getIssues();
      setIssues(response.data.issues);
    } catch (error) {
      setError('Failed to load issues');
      console.error('Error loading issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Reported': return '#f59e0b';
      case 'In Progress': return '#06b6d4';
      case 'Resolved': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Low': return '#10b981';
      case 'Medium': return '#f59e0b';
      case 'High': return '#f97316';
      case 'Critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const createCustomIcon = (status, priority) => {
    const color = getStatusColor(status);
    const priorityColor = getPriorityColor(priority);
    
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 3px solid ${priorityColor};
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 14px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          transition: transform 0.2s ease;
        ">
          ${status === 'Reported' ? '!' : status === 'In Progress' ? '⚡' : '✓'}
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });
  };

  const handleMarkerClick = (issue) => {
    setSelectedIssue(issue);
    setShowIssueModal(true);
  };

  const handleStatusUpdate = async (issueId, newStatus) => {
    try {
      await issueService.updateIssue(issueId, { status: newStatus });
      setError('');
      setSuccess('Issue status updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      // Reload issues to reflect the change
      loadIssues();
      setShowIssueModal(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update status');
    }
  };

  const IssueModal = ({ issue, isOpen, onClose, onStatusUpdate }) => {
    if (!isOpen || !issue) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-auto shadow-2xl">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900">{issue.title}</h3>
              <button 
                onClick={onClose} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-700 leading-relaxed">{issue.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-medium text-gray-900">{issue.category?.name}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-warning to-warning-dark rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Priority</p>
                  <span 
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: getPriorityColor(issue.priority) + '20',
                      color: getPriorityColor(issue.priority)
                    }}
                  >
                    {issue.priority}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-info to-info-dark rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span 
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: getStatusColor(issue.status) + '20',
                      color: getStatusColor(issue.status)
                    }}
                  >
                    {issue.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-secondary to-secondary-dark rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created by</p>
                  <p className="font-medium text-gray-900">{issue.createdBy?.name}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
              <span className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
              </span>
              <span className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{issue.location?.latitude.toFixed(4)}, {issue.location?.longitude.toFixed(4)}</span>
              </span>
            </div>

            {issue.photoURL && (
              <div className="mb-4">
                <img 
                  src={issue.photoURL} 
                  alt="Issue photo" 
                  className="w-full h-48 object-cover rounded-lg shadow-md"
                />
              </div>
            )}

            {(user?.role === 'authority' || user?.role === 'admin') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Status
                </label>
                <select
                  value={issue.status}
                  onChange={(e) => onStatusUpdate(issue._id, e.target.value)}
                  className="form-control"
                >
                  <option value="Reported">Reported</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button 
                onClick={onClose}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="card">
          <div className="card-body text-center py-12">
            <div className="spinner mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900">Loading map...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="card">
        <div className="card-header">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="card-title text-2xl">Issues Map View</h1>
              <p className="text-gray-600 mt-1">Interactive map showing all reported issues</p>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
              {/* Legend */}
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-warning rounded-full"></div>
                  <span className="text-gray-600">Reported</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-info rounded-full"></div>
                  <span className="text-gray-600">In Progress</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-success rounded-full"></div>
                  <span className="text-gray-600">Resolved</span>
                </div>
              </div>
              <button 
                onClick={loadIssues}
                className="btn btn-secondary btn-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger mx-6 mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}
        
        {success && (
          <div className="alert alert-success mx-6 mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {success}
          </div>
        )}

        <div className="card-body p-0">
          <div className="h-96 sm:h-[500px] lg:h-[600px] w-full rounded-b-xl overflow-hidden map-container relative">
            {loading && (
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading map...</p>
                </div>
              </div>
            )}
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%' }}
              className="rounded-b-xl"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {issues.map(issue => (
                <Marker
                  key={issue._id}
                  position={[issue.location.latitude, issue.location.longitude]}
                  icon={createCustomIcon(issue.status, issue.priority)}
                  eventHandlers={{
                    click: () => handleMarkerClick(issue)
                  }}
                >
                  <Popup className="custom-popup">
                    <div className="min-w-[250px] p-2">
                      <h4 className="font-semibold text-gray-900 mb-2">{issue.title}</h4>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{issue.description}</p>
                      <div className="flex items-center space-x-2 mb-3">
                        <span 
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: getStatusColor(issue.status) + '20',
                            color: getStatusColor(issue.status)
                          }}
                        >
                          {issue.status}
                        </span>
                        <span 
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: getPriorityColor(issue.priority) + '20',
                            color: getPriorityColor(issue.priority)
                          }}
                        >
                          {issue.priority}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>{issue.category?.name}</p>
                        <p>{new Date(issue.createdAt).toLocaleDateString()}</p>
                      </div>
                      <button 
                        onClick={() => handleMarkerClick(issue)}
                        className="btn btn-primary btn-sm w-full mt-3"
                      >
                        View Details
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            {!loading && issues.length === 0 && (
              <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Issues Found</h3>
                  <p className="text-gray-500">There are no issues to display on the map.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card-footer">
          <div className="text-center text-gray-600">
            <p className="text-sm">
              Click on markers to view issue details. 
              {user?.role === 'authority' || user?.role === 'admin' ? ' Authorities can update status directly from the map.' : ''}
            </p>
          </div>
        </div>
      </div>

      <IssueModal
        issue={selectedIssue}
        isOpen={showIssueModal}
        onClose={() => setShowIssueModal(false)}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
};

export default MapView;
