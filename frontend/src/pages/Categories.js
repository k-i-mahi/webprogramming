import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import categoryService from '../services/categoryService';
import authService from '../services/authService';

const Categories = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    assignedUsers: []
  });

  useEffect(() => {
    loadCategories();
    loadUsers();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categoryService.getCategories();
      setCategories(response.data.categories);
    } catch (error) {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await authService.getUsers();
      setUsers(response.data.users);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUserSelection = (userId, isSelected) => {
    setFormData(prev => ({
      ...prev,
      assignedUsers: isSelected 
        ? [...prev.assignedUsers, userId]
        : prev.assignedUsers.filter(id => id !== userId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory._id, formData);
        setSuccess('Category updated successfully');
      } else {
        await categoryService.createCategory(formData);
        setSuccess('Category created successfully');
      }
      
      setShowForm(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '', assignedUsers: [] });
      loadCategories();
    } catch (error) {
      setError(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      assignedUsers: category.assignedUsers.map(user => user._id)
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await categoryService.deleteCategory(id);
        setSuccess('Category deleted successfully');
        loadCategories();
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to delete category');
      }
    }
  };

  const handleAssignUsers = async (categoryId, userIds) => {
    try {
      await categoryService.assignUsersToCategory(categoryId, userIds);
      setSuccess('Users assigned successfully');
      loadCategories();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to assign users');
    }
  };

  const handleUnassignUsers = async (categoryId, userIds) => {
    try {
      await categoryService.unassignUsersFromCategory(categoryId, userIds);
      setSuccess('Users removed successfully');
      loadCategories();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to remove users');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="container">
        <div className="card">
          <h1>Access Denied</h1>
          <p>Only administrators can manage categories.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container">
        <div className="card text-center">
          <h2>Loading categories...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1>Category Management</h1>
          <button 
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            + Add Category
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

        {showForm && (
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3>{editingCategory ? 'Edit Category' : 'Create New Category'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Category Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="form-control"
                  value={formData.name}
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
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Assign Users</label>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px' }}>
                  {users.map(user => (
                    <div key={user._id} style={{ marginBottom: '5px' }}>
                      <label style={{ display: 'flex', alignItems: 'center' }}>
                        <input
                          type="checkbox"
                          checked={formData.assignedUsers.includes(user._id)}
                          onChange={(e) => handleUserSelection(user._id, e.target.checked)}
                          style={{ marginRight: '8px' }}
                        />
                        {user.name} ({user.email}) - {user.role}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary">
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingCategory(null);
                    setFormData({ name: '', description: '', assignedUsers: [] });
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
          <h3>Categories ({categories.length})</h3>
          {categories.length === 0 ? (
            <p>No categories found.</p>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {categories.map(category => (
                <div key={category._id} className="card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <h4>{category.name}</h4>
                      {category.description && (
                        <p style={{ color: '#666', marginBottom: '1rem' }}>{category.description}</p>
                      )}
                      <p><strong>Assigned Users:</strong> {category.assignedUsersCount}</p>
                      {category.assignedUsers && category.assignedUsers.length > 0 && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <strong>Users:</strong>
                          <ul style={{ margin: '0.5rem 0', paddingLeft: '1rem' }}>
                            {category.assignedUsers.map(user => (
                              <li key={user._id}>
                                {user.name} ({user.email}) - {user.role}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <p style={{ fontSize: '0.9rem', color: '#666' }}>
                        Created: {new Date(category.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => handleEdit(category)}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.8rem' }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(category._id)}
                        className="btn btn-danger"
                        style={{ fontSize: '0.8rem' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Categories;
