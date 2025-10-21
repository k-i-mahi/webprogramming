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
      <div className="page-card">
        <div className="page-actions">
          <div className="page-actions-left">
            <div className="page-header-icon">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="page-header-content">Issues Management</h1>
              <p className="page-header-content">Track and manage community issues</p>
            </div>
          </div>
          <div className="page-actions-right">
            <button 
              onClick={() => setShowForm(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Report New Issue
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

        {/* Filters */}
        <IssueFilters
          categories={categories}
          onFiltersChange={handleFilterChange}
          initialFilters={filters}
        />

        {showForm && (
          <div className="page-card">
            <div className="page-card-header">
              <div className="page-card-icon">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="page-card-title">{editingIssue ? 'Edit Issue' : 'Report New Issue'}</h3>
            </div>
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

              <div className="flex gap-4">
                <button type="submit" className="btn btn-primary flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
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
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="page-card">
          <div className="page-card-header">
            <div className="page-card-icon">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="page-card-title">Issues ({issues.length})</h3>
          </div>
          {issues.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="empty-state-title">No issues found</h3>
              <p className="empty-state-description">No issues match your current filters.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {issues.map(issue => (
                <div key={issue._id} className="issue-card">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="issue-header">
                        <h4 className="issue-title">{issue.title}</h4>
                        <div className="issue-badges">
                          <span className={`issue-badge status-${issue.status.toLowerCase().replace(' ', '-')}`}>
                            {issue.status}
                          </span>
                          <span className={`issue-badge priority-${issue.priority.toLowerCase()}`}>
                            {issue.priority}
                          </span>
                        </div>
                      </div>
                      
                      <p className="issue-description">{issue.description}</p>
                      
                      <div className="issue-details">
                        <div className="issue-detail">
                          <svg className="issue-detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <span><strong>Category:</strong> {issue.category?.name}</span>
                        </div>
                        <div className="issue-detail">
                          <svg className="issue-detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span><strong>Created by:</strong> {issue.createdBy?.name}</span>
                        </div>
                        {issue.assignedTo && (
                          <div className="issue-detail">
                            <svg className="issue-detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span><strong>Assigned to:</strong> {issue.assignedTo?.name}</span>
                          </div>
                        )}
                        <div className="issue-detail">
                          <svg className="issue-detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span><strong>Location:</strong> {issue.location?.latitude}, {issue.location?.longitude}</span>
                        </div>
                        <div className="issue-detail">
                          <svg className="issue-detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span><strong>Created:</strong> {new Date(issue.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {issue.photoURL && (
                        <div className="issue-photo">
                          <img 
                            src={issue.photoURL} 
                            alt="Issue photo" 
                            className="max-w-xs max-h-32 object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </div>

                    <div className="issue-actions">
                      <button 
                        onClick={() => handleViewDetails(issue)}
                        className="btn btn-primary btn-sm flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Details
                      </button>
                      
                      {(user?.role === 'authority' || user?.role === 'admin') && (
                        <select
                          value={issue.status}
                          onChange={(e) => handleStatusUpdate(issue._id, e.target.value)}
                          className="form-control text-sm"
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
                            className="btn btn-secondary btn-sm flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          {user?.role === 'admin' && (
                            <button 
                              onClick={() => handleDelete(issue._id)}
                              className="btn btn-danger btn-sm flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
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
