import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import issueService from '../services/issueService';
import categoryService from '../services/categoryService';
import LocationPicker from '../components/LocationPicker';
import PhotoUpload from '../components/PhotoUpload';
import IssueFilters from '../components/IssueFilters';
import IssueDetailModal from '../components/IssueDetailModal';
import { Plus, Search, Filter, MapPin, Calendar, User, AlertCircle, CheckCircle, Clock, Trash2, Edit, Eye } from 'lucide-react';

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
      setLoading(true);
      setError('');
      
      const params = {};
      if (customFilters.status) params.status = customFilters.status;
      if (customFilters.category) params.category = customFilters.category;
      if (customFilters.priority) params.priority = customFilters.priority;
      if (customFilters.search) params.search = customFilters.search;
      if (customFilters.assignedTo) params.assignedTo = customFilters.assignedTo;
      if (customFilters.dateRange) params.dateRange = customFilters.dateRange;
      if (customFilters.sortBy) params.sortBy = customFilters.sortBy;
      if (customFilters.sortOrder) params.sortOrder = customFilters.sortOrder;

      console.log('Loading issues with params:', params);
      const response = await issueService.getIssues(params);
      console.log('Issues response:', response.data);
      
      if (response.data && response.data.issues) {
        setIssues(response.data.issues);
      } else {
        setIssues([]);
        setError('No issues data received from server');
      }
    } catch (error) {
      console.error('Error loading issues:', error);
      setError(error.response?.data?.message || 'Failed to load issues. Please check your connection.');
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      console.log('Loading categories...');
      const response = await categoryService.getCategories();
      console.log('Categories response:', response.data);
      
      if (response.data && response.data.categories) {
        setCategories(response.data.categories);
      } else {
        console.warn('No categories data received');
        setCategories([]);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      setError('Failed to load categories. Please refresh the page.');
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
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Issues Management</h1>
              <p className="text-gray-600 mt-1">Track and manage community issues efficiently</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => setShowForm(true)}
              className="btn btn-primary flex items-center gap-2 px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              Report New Issue
            </button>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {/* Filters Section */}
      <div className="mb-8">
        <IssueFilters
          categories={categories}
          onFiltersChange={handleFilterChange}
          initialFilters={filters}
        />
      </div>

      {/* Issue Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Edit className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingIssue ? 'Edit Issue' : 'Report New Issue'}
                </h3>
              </div>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Issue Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter a descriptive title for the issue"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Provide detailed information about the issue"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a category</option>
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

                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                    Priority Level
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    value={formData.priority}
                    onChange={handleInputChange}
                  >
                    <option value="Low">🟢 Low Priority</option>
                    <option value="Medium">🟡 Medium Priority</option>
                    <option value="High">🟠 High Priority</option>
                    <option value="Critical">🔴 Critical Priority</option>
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button 
                    type="submit" 
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
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
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Clock className="w-5 h-5" />
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Issues List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Community Issues ({issues.length})
            </h3>
          </div>
        </div>
        {issues.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No issues found</h3>
            <p className="text-gray-500 mb-6">No issues match your current filters or there are no issues yet.</p>
            <button 
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Report First Issue
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {issues.map(issue => (
              <div key={issue._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                          {issue.title}
                        </h4>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            issue.status === 'Reported' ? 'bg-yellow-100 text-yellow-800' :
                            issue.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {issue.status === 'Reported' ? <Clock className="w-3 h-3 mr-1" /> :
                             issue.status === 'In Progress' ? <Clock className="w-3 h-3 mr-1" /> :
                             <CheckCircle className="w-3 h-3 mr-1" />}
                            {issue.status}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            issue.priority === 'Low' ? 'bg-green-100 text-green-800' :
                            issue.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            issue.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {issue.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4 line-clamp-3">{issue.description}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="p-1 bg-blue-100 rounded">
                          <AlertCircle className="w-4 h-4 text-blue-600" />
                        </div>
                        <span><strong>Category:</strong> {issue.category?.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="p-1 bg-green-100 rounded">
                          <User className="w-4 h-4 text-green-600" />
                        </div>
                        <span><strong>Created by:</strong> {issue.createdBy?.name}</span>
                      </div>
                      {issue.assignedTo && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="p-1 bg-purple-100 rounded">
                            <User className="w-4 h-4 text-purple-600" />
                          </div>
                          <span><strong>Assigned to:</strong> {issue.assignedTo?.name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="p-1 bg-orange-100 rounded">
                          <MapPin className="w-4 h-4 text-orange-600" />
                        </div>
                        <span><strong>Location:</strong> {issue.location?.latitude?.toFixed(4)}, {issue.location?.longitude?.toFixed(4)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="p-1 bg-gray-100 rounded">
                          <Calendar className="w-4 h-4 text-gray-600" />
                        </div>
                        <span><strong>Created:</strong> {new Date(issue.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {issue.photoURL && (
                      <div className="mb-4">
                        <img 
                          src={issue.photoURL} 
                          alt="Issue photo" 
                          className="w-full max-w-sm h-32 object-cover rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 min-w-[200px]">
                    <button 
                      onClick={() => handleViewDetails(issue)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    
                    {(user?.role === 'authority' || user?.role === 'admin') && (
                      <select
                        value={issue.status}
                        onChange={(e) => handleStatusUpdate(issue._id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        {user?.role === 'admin' && (
                          <button 
                            onClick={() => handleDelete(issue._id)}
                            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
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
