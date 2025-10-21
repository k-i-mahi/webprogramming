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
      case 'Reported': return '#ffc107';
      case 'In Progress': return '#17a2b8';
      case 'Resolved': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Low': return '#28a745';
      case 'Medium': return '#ffc107';
      case 'High': return '#fd7e14';
      case 'Critical': return '#dc3545';
      default: return '#6c757d';
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
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 3px solid ${priorityColor};
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">
          ${status === 'Reported' ? '!' : status === 'In Progress' ? '⚡' : '✓'}
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15]
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
      setTimeout(() => setSuccess(''), 2500);
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
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>{issue.title}</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <p><strong>Description:</strong> {issue.description}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <strong>Category:</strong> {issue.category?.name}
            </div>
            <div>
              <strong>Priority:</strong> 
              <span style={{
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: getPriorityColor(issue.priority),
                color: 'white',
                fontSize: '0.8rem',
                marginLeft: '0.5rem'
              }}>
                {issue.priority}
              </span>
            </div>
            <div>
              <strong>Status:</strong>
              <span style={{
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: getStatusColor(issue.status),
                color: 'white',
                fontSize: '0.8rem',
                marginLeft: '0.5rem'
              }}>
                {issue.status}
              </span>
            </div>
            <div>
              <strong>Created by:</strong> {issue.createdBy?.name}
            </div>
            <div>
              <strong>Created:</strong> {new Date(issue.createdAt).toLocaleDateString()}
            </div>
            <div>
              <strong>Location:</strong> {issue.location?.latitude.toFixed(4)}, {issue.location?.longitude.toFixed(4)}
            </div>
          </div>

          {issue.photoURL && (
            <div style={{ marginBottom: '1rem' }}>
              <img 
                src={issue.photoURL} 
                alt="Issue photo" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '200px', 
                  objectFit: 'cover', 
                  borderRadius: '4px' 
                }}
              />
            </div>
          )}

          {(user?.role === 'authority' || user?.role === 'admin') && (
            <div style={{ marginTop: '1rem' }}>
              <label><strong>Update Status:</strong></label>
              <select
                value={issue.status}
                onChange={(e) => onStatusUpdate(issue._id, e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '0.5rem', 
                  marginTop: '0.5rem',
                  borderRadius: '4px',
                  border: '1px solid #ccc'
                }}
              >
                <option value="Reported">Reported</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          )}

          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
            <button 
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card text-center">
          <h2>Loading map...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1>Issues Map View</h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#ffc107', borderRadius: '50%' }}></div>
                <span style={{ fontSize: '0.9rem' }}>Reported</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#17a2b8', borderRadius: '50%' }}></div>
                <span style={{ fontSize: '0.9rem' }}>In Progress</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#28a745', borderRadius: '50%' }}></div>
                <span style={{ fontSize: '0.9rem' }}>Resolved</span>
              </div>
            </div>
            <button 
              onClick={loadIssues}
              className="btn btn-secondary"
              style={{ fontSize: '0.9rem' }}
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}

        <div style={{ height: '600px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
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
                <Popup>
                  <div style={{ minWidth: '200px' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>{issue.title}</h4>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>{issue.description}</p>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: getStatusColor(issue.status),
                        color: 'white',
                        fontSize: '0.8rem'
                      }}>
                        {issue.status}
                      </span>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: getPriorityColor(issue.priority),
                        color: 'white',
                        fontSize: '0.8rem'
                      }}>
                        {issue.priority}
                      </span>
                    </div>
                    <p style={{ margin: '0', fontSize: '0.8rem', color: '#666' }}>
                      {issue.category?.name} • {new Date(issue.createdAt).toLocaleDateString()}
                    </p>
                    <button 
                      onClick={() => handleMarkerClick(issue)}
                      style={{
                        marginTop: '0.5rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div style={{ marginTop: '1rem', textAlign: 'center', color: '#666' }}>
          <p>Click on markers to view issue details. {user?.role === 'authority' || user?.role === 'admin' ? 'Authorities can update status directly from the map.' : ''}</p>
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
