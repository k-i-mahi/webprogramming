import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import categoryService from '../services/categoryService';
import Modal, { ConfirmDialog } from '../components/Modal';
import Feedback from '../components/Feedback';
import Badge from '../components/Badge';
import './Categories.css';

const Categories = () => {
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    category: null,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive

  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    icon: '',
    color: '#667eea',
    order: 0,
    isActive: true,
  });

  const [formErrors, setFormErrors] = useState({});

  // Memoize loadCategories to prevent recreation
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await categoryService.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      showError('Failed to load categories');
      console.error('Load categories error:', error);
    } finally {
      setLoading(false);
    }
  }, [showError]); // Only depends on showError

  useEffect(() => {
    loadCategories();
  }, [loadCategories]); // Include loadCategories in dependencies

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.name)) {
      errors.name = 'Name must be lowercase alphanumeric with hyphens';
    }

    if (!formData.displayName.trim()) {
      errors.displayName = 'Display name is required';
    }

    if (formData.icon && formData.icon.length > 10) {
      errors.icon = 'Icon must be 10 characters or less';
    }

    if (formData.color && !/^#[0-9A-Fa-f]{6}$/.test(formData.color)) {
      errors.color = 'Invalid color format (use #RRGGBB)';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory._id, formData);
        showSuccess('Category updated successfully');
      } else {
        await categoryService.createCategory(formData);
        showSuccess('Category created successfully');
      }

      handleCloseModal();
      loadCategories();
    } catch (error) {
      showError(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      displayName: category.displayName || '',
      description: category.description || '',
      icon: category.icon || '',
      color: category.color || '#667eea',
      order: category.order || 0,
      isActive: category.isActive !== undefined ? category.isActive : true,
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm.category) return;

    try {
      await categoryService.deleteCategory(deleteConfirm.category._id);
      showSuccess('Category deleted successfully');
      setDeleteConfirm({ show: false, category: null });
      loadCategories();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to delete category');
    }
  };

  const handleToggleStatus = async (category) => {
    try {
      await categoryService.toggleCategoryStatus(category._id);
      showSuccess(
        `Category ${
          category.isActive ? 'deactivated' : 'activated'
        } successfully`,
      );
      loadCategories();
    } catch (error) {
      showError('Failed to update category status');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      displayName: '',
      description: '',
      icon: '',
      color: '#667eea',
      order: 0,
      isActive: true,
    });
    setFormErrors({});
  };

  const filteredCategories = categories.filter((cat) => {
    const matchesSearch =
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.displayName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && cat.isActive) ||
      (filterStatus === 'inactive' && !cat.isActive);

    return matchesSearch && matchesStatus;
  });

  // Access Control
  if (user?.role !== 'admin') {
    return (
      <div className="categories-page">
        <Feedback
          type="error"
          title="Access Denied"
          message="Only administrators can manage categories."
          icon="🚫"
          fullPage={true}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="categories-page">
        <Feedback type="loading" fullPage={true} />
      </div>
    );
  }

  return (
    <div className="categories-page">
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">Category Management</h1>
            <p className="page-subtitle">
              Manage issue categories and their settings
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            <span className="btn-icon">➕</span>
            <span>Add Category</span>
          </button>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                className="search-clear"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>

          <div className="filter-tabs">
            <button
              className={`filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              All ({categories.length})
            </button>
            <button
              className={`filter-tab ${
                filterStatus === 'active' ? 'active' : ''
              }`}
              onClick={() => setFilterStatus('active')}
            >
              Active ({categories.filter((c) => c.isActive).length})
            </button>
            <button
              className={`filter-tab ${
                filterStatus === 'inactive' ? 'active' : ''
              }`}
              onClick={() => setFilterStatus('inactive')}
            >
              Inactive ({categories.filter((c) => !c.isActive).length})
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">{categories.length}</div>
              <div className="stat-label">Total Categories</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-value">
                {categories.filter((c) => c.isActive).length}
              </div>
              <div className="stat-label">Active</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div className="stat-content">
              <div className="stat-value">
                {categories.reduce(
                  (sum, c) => sum + (c.metadata?.issueCount || 0),
                  0,
                )}
              </div>
              <div className="stat-label">Total Issues</div>
            </div>
          </div>
        </div>

        {/* Categories List */}
        {filteredCategories.length === 0 ? (
          <Feedback
            type="empty"
            title="No Categories Found"
            message={
              searchQuery
                ? 'No categories match your search'
                : 'Get started by creating your first category'
            }
            icon="📁"
            action={!searchQuery ? () => setShowModal(true) : undefined}
            actionText="Create Category"
          />
        ) : (
          <div className="categories-grid">
            {filteredCategories.map((category) => (
              <div key={category._id} className="category-card">
                <div className="category-header">
                  <div
                    className="category-icon-box"
                    style={{ background: category.color }}
                  >
                    <span className="category-icon-large">
                      {category.icon || '📁'}
                    </span>
                  </div>
                  <div className="category-actions">
                    <button
                      className="action-btn"
                      onClick={() => handleEdit(category)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      className="action-btn"
                      onClick={() => handleToggleStatus(category)}
                      title={category.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {category.isActive ? '🔓' : '🔒'}
                    </button>
                    <button
                      className="action-btn danger"
                      onClick={() => setDeleteConfirm({ show: true, category })}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="category-body">
                  <div className="category-title-row">
                    <h3 className="category-title">{category.displayName}</h3>
                    {!category.isActive && (
                      <Badge type="custom" value="Inactive" variant="#6b7280" />
                    )}
                  </div>

                  <p className="category-name">@{category.name}</p>

                  {category.description && (
                    <p className="category-description">
                      {category.description}
                    </p>
                  )}

                  <div className="category-meta">
                    <div className="meta-item">
                      <span className="meta-icon">📝</span>
                      <span className="meta-text">
                        {category.metadata?.issueCount || 0} issues
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">📊</span>
                      <span className="meta-text">Order: {category.order}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">🎨</span>
                      <div
                        className="color-preview"
                        style={{ background: category.color }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingCategory ? 'Edit Category' : 'Create New Category'}
        size="medium"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCloseModal}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              onClick={handleSubmit}
            >
              {editingCategory ? 'Update Category' : 'Create Category'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="category-form">
          {/* Name */}
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Name (URL-friendly) *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`form-input ${formErrors.name ? 'error' : ''}`}
              placeholder="e.g., water-supply"
              disabled={!!editingCategory}
            />
            {formErrors.name && (
              <span className="field-error">{formErrors.name}</span>
            )}
            <span className="field-hint">
              Lowercase letters, numbers, and hyphens only
            </span>
          </div>

          {/* Display Name */}
          <div className="form-group">
            <label htmlFor="displayName" className="form-label">
              Display Name *
            </label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              className={`form-input ${formErrors.displayName ? 'error' : ''}`}
              placeholder="e.g., Water Supply"
            />
            {formErrors.displayName && (
              <span className="field-error">{formErrors.displayName}</span>
            )}
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="form-input"
              rows="3"
              placeholder="Brief description of this category"
            />
          </div>

          {/* Icon & Color Row */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="icon" className="form-label">
                Icon (Emoji)
              </label>
              <input
                type="text"
                id="icon"
                name="icon"
                value={formData.icon}
                onChange={handleInputChange}
                className={`form-input ${formErrors.icon ? 'error' : ''}`}
                placeholder="💧"
                maxLength="10"
              />
              {formErrors.icon && (
                <span className="field-error">{formErrors.icon}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="color" className="form-label">
                Color
              </label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className="color-picker"
                />
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className={`form-input ${formErrors.color ? 'error' : ''}`}
                  placeholder="#667eea"
                />
              </div>
              {formErrors.color && (
                <span className="field-error">{formErrors.color}</span>
              )}
            </div>
          </div>

          {/* Order */}
          <div className="form-group">
            <label htmlFor="order" className="form-label">
              Display Order
            </label>
            <input
              type="number"
              id="order"
              name="order"
              value={formData.order}
              onChange={handleInputChange}
              className="form-input"
              min="0"
            />
            <span className="field-hint">Lower numbers appear first</span>
          </div>

          {/* Active Status */}
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
              />
              <span>Active (visible to users)</span>
            </label>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, category: null })}
        onConfirm={handleDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteConfirm.category?.displayName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default Categories;
