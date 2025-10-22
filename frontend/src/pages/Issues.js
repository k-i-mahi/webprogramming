import React, { useState, useEffect, useCallback } from 'react';
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
  const [formLoading, setFormLoading] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filters, setFilters] = useState({ status: '', category: '', priority: '', search: '' });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    latitude: '',
    longitude: '',
    photo: null,
    priority: 'Medium'
  });

  const loadCategories = useCallback(async () => {
    try {
      const response = await categoryService.getCategories();
      let cats = [];
      if (Array.isArray(response)) cats = response;
      else if (response?.categories) cats = response.categories;
      else if (response?.data?.categories) cats = response.data.categories;
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setCategories([]);
    }
  }, []);

  const loadIssues = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        limit: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.priority) params.priority = filters.priority;
      if (filters.search) params.search = filters.search;

      const issuesData = await issueService.getIssues(params);
      setIssues(Array.isArray(issuesData) ? issuesData : []);
      setError('');
    } catch (err) {
      console.error('Failed to load issues:', err);
      setError(err.response?.data?.message || 'Failed to load issues');
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const init = async () => {
      await loadCategories();
      await loadIssues();
    };
    init();
  }, []);

  useEffect(() => {
    loadIssues();
  }, [filters, loadIssues]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      latitude: '',
      longitude: '',
      photo: null,
      priority: 'Medium'
    });
    setEditingIssue(null);
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'photo' && files?.[0]) {
      setFormData(prev => ({ ...prev, photo: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!formData.title?.trim() || !formData.description?.trim() || !formData.category || !formData.latitude || !formData.longitude) {
        setError('Please fill all required fields');
        setFormLoading(false);
        return;
      }

      if (editingIssue) {
        const { photo, ...updateData } = formData;
        await issueService.updateIssue(editingIssue._id, updateData);
        setSuccess('Issue updated successfully');
      } else {
        await issueService.createIssue(formData);
        setSuccess('Issue created successfully');
      }

      setShowForm(false);
      resetForm();
      await loadIssues();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (issue) => {
    setEditingIssue(issue);
    setFormData({
      title: issue.title,
      description: issue.description,
      category: issue.category?._id || '',
      latitude: issue.location?.coordinates?.[1] || '',
      longitude: issue.location?.coordinates?.[0] || '',
      photo: null,
      priority: issue.priority || 'Medium'
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this issue?')) return;
    try {
      await issueService.deleteIssue(id);
      setSuccess('Issue deleted successfully');
      await loadIssues();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete issue');
    }
  };

  const handleStatusUpdate = async (issueId, newStatus) => {
    try {
      await issueService.updateIssue(issueId, { status: newStatus });
      setSuccess('Status updated');
      await loadIssues();
    } catch (err) {
      setError('Failed to update status');
    }
  };

  const getStatusColor = (status) => ({
    'Reported': '#ffc107',
    'In Progress': '#17a2b8',
    'Resolved': '#28a745'
  }[status] || '#6c757d');

  const getPriorityColor = (priority) => ({
    'Low': '#28a745',
    'Medium': '#ffc107',
    'High': '#fd7e14',
    'Critical': '#dc3545'
  }[priority] || '#6c757d');

  if (loading && !issues.length) {
    return <div className="container"><div className="card text-center"><h2>Loading...</h2></div></div>;
  }

  return (
    <div className="container">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1>Issues</h1>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="btn btn-primary">
            + New Issue
          </button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <IssueFilters categories={categories} onFiltersChange={setFilters} initialFilters={filters} />

        {showForm && (
          <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f8f9fa' }}>
            <h3>{editingIssue ? 'Edit Issue' : 'Report Issue'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input type="text" className="form-control" name="title" value={formData.title} onChange={handleInputChange} required />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea className="form-control" name="description" rows="4" value={formData.description} onChange={handleInputChange} required />
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select className="form-control" name="category" value={formData.category} onChange={handleInputChange} required>
                  <option value="">Select</option>
                  {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                </select>
              </div>

              <LocationPicker latitude={formData.latitude} longitude={formData.longitude} onLocationChange={(lat, lng) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))} />

              <PhotoUpload onPhotoChange={(file) => setFormData(prev => ({ ...prev, photo: file }))} />

              <div className="form-group">
                <label>Priority</label>
                <select className="form-control" name="priority" value={formData.priority} onChange={handleInputChange}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>{formLoading ? 'Processing...' : 'Submit'}</button>
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="btn btn-secondary" disabled={formLoading}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="card">
          <h3>Issues ({issues.length})</h3>
          {!issues.length ? <p>No issues found</p> : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {issues.map(issue => (
                <div key={issue._id} className="card" style={{ padding: '1rem', borderLeft: `4px solid ${getStatusColor(issue.status)}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <h4 style={{ margin: 0 }}>{issue.title}</h4>
                        <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', backgroundColor: getStatusColor(issue.status), color: 'white', fontSize: '0.75rem', fontWeight: 'bold' }}>{issue.status}</span>
                        <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', backgroundColor: getPriorityColor(issue.priority), color: 'white', fontSize: '0.75rem', fontWeight: 'bold' }}>{issue.priority}</span>
                      </div>
                      <p style={{ color: '#666', marginBottom: '1rem' }}>{issue.description}</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.9rem' }}>
                        <div><strong>Category:</strong> {issue.category?.name}</div>
                        <div><strong>Created by:</strong> {issue.createdBy?.name}</div>
                        {issue.assignedTo && <div><strong>Assigned to:</strong> {issue.assignedTo?.name}</div>}
                        <div><strong>Created:</strong> {new Date(issue.createdAt).toLocaleDateString()}</div>
                      </div>
                      {issue.photoURL && <div style={{ marginTop: '1rem' }}><img src={issue.photoURL} alt="Issue" style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'cover', borderRadius: '4px' }} /></div>}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column', minWidth: '120px' }}>
                      <button onClick={() => { setSelectedIssue(issue); setShowDetailModal(true); }} className="btn btn-primary" style={{ fontSize: '0.8rem' }}>Details</button>
                      {(user?.role === 'authority' || user?.role === 'admin') && (
                        <select value={issue.status} onChange={(e) => handleStatusUpdate(issue._id, e.target.value)} style={{ fontSize: '0.8rem', padding: '0.4rem' }}>
                          <option value="Reported">Reported</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      )}
                      {(user?.role === 'admin' || (user?.role === 'resident' && issue.createdBy?._id === user?._id)) && (
                        <>
                          <button onClick={() => handleEdit(issue)} className="btn btn-warning" style={{ fontSize: '0.8rem' }}>Edit</button>
                          <button onClick={() => handleDelete(issue._id)} className="btn btn-danger" style={{ fontSize: '0.8rem' }}>Delete</button>
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

      {showDetailModal && selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          onClose={() => setShowDetailModal(false)}
          onUpdate={async (id, data) => {
            await issueService.updateIssue(id, data);
            setSuccess('Updated');
            await loadIssues();
            setShowDetailModal(false);
          }}
          user={user}
        />
      )}
    </div>
  );
};

export default Issues;
