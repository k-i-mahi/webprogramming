import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import issueService from '../services/issueService';
import categoryService from '../services/categoryService';
import LocationPicker from '../components/LocationPicker';
import PhotoUpload from '../components/PhotoUpload';
import IssueFilters from '../components/IssueFilters';
import IssueDetailModal from '../components/IssueDetailModal';

const Issues = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
    search: ''
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    latitude: '',
    longitude: '',
    photoURL: '',
    photo: null,
    priority: 'Medium'
  });

  useEffect(() => {
    loadIssues();
    loadCategories();
  }, [filters]);

  const loadIssues = async (customFilters = filters) => {
    try {
      const params = {};
      if (customFilters.status) params.status = customFilters.status;
      if (customFilters.category) params.category = customFilters.category;
      if (customFilters.priority) params.priority = customFilters.priority;
      if (customFilters.search) params.search = customFilters.search;
      if (customFilters.assignedTo) params.assignedTo = customFilters.assignedTo;
      if (customFilters.dateRange) params.dateRange = customFilters.dateRange;
      if (customFilters.sortBy) params.sortBy = customFilters.sortBy;
      if (customFilters.sortOrder) params.sortOrder = customFilters.sortOrder;

      const response = await issueService.getIssues(params);
      setIssues(response.data.issues);
    } catch (error) {
      setError('Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await categoryService.getCategories();
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'photo' && files) {
      setFormData(prev => ({ ...prev, photo: files[0] }));
      return;
    }
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    loadIssues(newFilters);
  };

  const handleLocationChange = (latitude, longitude) => {
    setFormData(prev => ({
      ...prev,
      latitude: latitude.toString(),
      longitude: longitude.toString()
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingIssue) {
        const { photo, ...rest } = formData;
        await issueService.updateIssue(editingIssue._id, rest);
        setSuccess('Issue updated successfully');
      } else {
        const payload = { ...formData };
        if (formData.photo) {
          payload.photo = formData.photo;
        }
        await issueService.createIssue(payload);
        setSuccess('Issue created successfully');
      }
      
      setShowForm(false);
      setEditingIssue(null);
      setFormData({ 
        title: '', 
        description: '', 
        category: '', 
        latitude: '', 
        longitude: '', 
        photoURL: '', 
        priority: 'Medium',
        photo: null 
      });
      loadIssues();
    } catch (error) {
      setError(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (issue) => {
    setEditingIssue(issue);
    setFormData({
      title: issue.title,
      description: issue.description,
      category: issue.category._id,
      latitude: issue.location.latitude,
      longitude: issue.location.longitude,
      photoURL: issue.photoURL || '',
      priority: issue.priority
    });
    setShowForm(true);
  };

  const handleViewDetails = (issue) => {
    setSelectedIssue(issue);
    setShowDetailModal(true);
  };

  const handleUpdateIssue = async (issueId, updateData) => {
    try {
      await issueService.updateIssue(issueId, updateData);
      setSuccess('Issue updated successfully');
      loadIssues();
      setShowDetailModal(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update issue');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this issue?')) {
      try {
        await issueService.deleteIssue(id);
        setSuccess('Issue deleted successfully');
        loadIssues();
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to delete issue');
      }
    }
  };

  const handleStatusUpdate = async (issueId, newStatus) => {
    try {
      await issueService.updateIssue(issueId, { status: newStatus });
      setSuccess('Issue status updated successfully');
      loadIssues();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update status');
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

  if (loading) {
    return (
      <div className="container">
        <div className="card text-center">
          <h2>Loading issues...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1>Issues Management</h1>
          <button 
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            + Report New Issue
          </button>
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

        {/* Filters */}
        <IssueFilters
          categories={categories}
          onFiltersChange={handleFilterChange}
          initialFilters={filters}
        />

        {showForm && (
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3>{editingIssue ? 'Edit Issue' : 'Report New Issue'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  className="form-control"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  className="form-control"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  className="form-control"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <LocationPicker
                latitude={formData.latitude}
                longitude={formData.longitude}
                onLocationChange={handleLocationChange}
              />

              <PhotoUpload
                onPhotoChange={(file) => setFormData(prev => ({ ...prev, photo: file }))}
                existingPhoto={formData.photoURL}
              />

              <div className="form-group">
                <label htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  name="priority"
                  className="form-control"
                  value={formData.priority}
                  onChange={handleInputChange}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary">
                  {editingIssue ? 'Update Issue' : 'Create Issue'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingIssue(null);
                    setFormData({ 
                      title: '', 
                      description: '', 
                      category: '', 
                      latitude: '', 
                      longitude: '', 
                      photoURL: '', 
                      priority: 'Medium' 
                    });
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="card">
          <h3>Issues ({issues.length})</h3>
          {issues.length === 0 ? (
            <p>No issues found.</p>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {issues.map(issue => (
                <div key={issue._id} className="card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <h4 style={{ margin: 0 }}>{issue.title}</h4>
                        <span 
                          style={{ 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px', 
                            backgroundColor: getStatusColor(issue.status),
                            color: 'white',
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {issue.status}
                        </span>
                        <span 
                          style={{ 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px', 
                            backgroundColor: getPriorityColor(issue.priority),
                            color: 'white',
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {issue.priority}
                        </span>
                      </div>
                      
                      <p style={{ color: '#666', marginBottom: '1rem' }}>{issue.description}</p>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.9rem' }}>
                        <div>
                          <strong>Category:</strong> {issue.category?.name}
                        </div>
                        <div>
                          <strong>Created by:</strong> {issue.createdBy?.name} ({issue.createdBy?.role})
                        </div>
                        {issue.assignedTo && (
                          <div>
                            <strong>Assigned to:</strong> {issue.assignedTo?.name}
                          </div>
                        )}
                        <div>
                          <strong>Location:</strong> {issue.location?.latitude}, {issue.location?.longitude}
                        </div>
                        <div>
                          <strong>Created:</strong> {new Date(issue.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      {issue.photoURL && (
                        <div style={{ marginTop: '1rem' }}>
                          <img 
                            src={issue.photoURL} 
                            alt="Issue photo" 
                            style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'cover', borderRadius: '4px' }}
                          />
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                      <button 
                        onClick={() => handleViewDetails(issue)}
                        className="btn btn-primary"
                        style={{ fontSize: '0.8rem' }}
                      >
                        View Details
                      </button>
                      
                      {(user?.role === 'authority' || user?.role === 'admin') && (
                        <select
                          value={issue.status}
                          onChange={(e) => handleStatusUpdate(issue._id, e.target.value)}
                          style={{ fontSize: '0.8rem', padding: '0.25rem' }}
                        >
                          <option value="Reported">Reported</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      )}
                      
                      {(user?.role === 'admin' || (user?.role === 'resident' && issue.createdBy?._id === user?.id)) && (
                        <>
                          <button 
                            onClick={() => handleEdit(issue)}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.8rem' }}
                          >
                            Edit
                          </button>
                          {user?.role === 'admin' && (
                            <button 
                              onClick={() => handleDelete(issue._id)}
                              className="btn btn-danger"
                              style={{ fontSize: '0.8rem' }}
                            >
                              Delete
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Issue Detail Modal */}
      <IssueDetailModal
        issue={selectedIssue}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onUpdate={handleUpdateIssue}
      />
    </div>
  );
};

export default Issues;
