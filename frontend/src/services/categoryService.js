import api from './api';
import { API_ENDPOINTS } from '../config/api.config';

const categoryService = {
  // ============================================
  // CATEGORY CRUD OPERATIONS
  // ============================================

  /**
   * Get all categories
   * @param {Object} params - Query parameters (search, isActive, sortBy, etc.)
   * @returns {Promise}
   */
  getCategories: async (params = {}) => {
    try {
      const response = await api.get(API_ENDPOINTS.CATEGORIES.LIST, { params });
      return response.data;
    } catch (error) {
      console.error('Get categories error:', error);
      throw error;
    }
  },

  /**
   * Get single category by ID
   * @param {string} id - Category ID
   * @returns {Promise}
   */
  getCategoryById: async (id) => {
    try {
      const response = await api.get(API_ENDPOINTS.CATEGORIES.DETAIL(id));
      return response.data;
    } catch (error) {
      console.error('Get category by ID error:', error);
      throw error;
    }
  },

  /**
   * Get category by name
   * @param {string} name - Category name (slug)
   * @returns {Promise}
   */
  getCategoryByName: async (name) => {
    try {
      const response = await api.get(API_ENDPOINTS.CATEGORIES.LIST, {
        params: { name },
      });
      return response.data?.data?.[0] || null;
    } catch (error) {
      console.error('Get category by name error:', error);
      throw error;
    }
  },

  /**
   * Create new category (Admin only)
   * @param {Object} categoryData - Category data
   * @returns {Promise}
   */
  createCategory: async (categoryData) => {
    try {
      const response = await api.post(
        API_ENDPOINTS.CATEGORIES.CREATE,
        categoryData,
      );
      return response.data;
    } catch (error) {
      console.error('Create category error:', error);
      throw error;
    }
  },

  /**
   * Update category (Admin only)
   * @param {string} id - Category ID
   * @param {Object} categoryData - Updated category data
   * @returns {Promise}
   */
  updateCategory: async (id, categoryData) => {
    try {
      const response = await api.put(
        API_ENDPOINTS.CATEGORIES.UPDATE(id),
        categoryData,
      );
      return response.data;
    } catch (error) {
      console.error('Update category error:', error);
      throw error;
    }
  },

  /**
   * Delete category (Admin only)
   * @param {string} id - Category ID
   * @returns {Promise}
   */
  deleteCategory: async (id) => {
    try {
      const response = await api.delete(API_ENDPOINTS.CATEGORIES.DELETE(id));
      return response.data;
    } catch (error) {
      console.error('Delete category error:', error);
      throw error;
    }
  },

  // ============================================
  // CATEGORY STATUS MANAGEMENT
  // ============================================

  /**
   * Toggle category status (Admin only)
   * @param {string} id - Category ID
   * @returns {Promise}
   */
  toggleCategoryStatus: async (id) => {
    try {
      const response = await api.patch(
        API_ENDPOINTS.CATEGORIES.TOGGLE_STATUS(id),
      );
      return response.data;
    } catch (error) {
      console.error('Toggle category status error:', error);
      throw error;
    }
  },

  /**
   * Activate category (Admin only)
   * @param {string} id - Category ID
   * @returns {Promise}
   */
  activateCategory: async (id) => {
    try {
      const response = await api.patch(`/categories/${id}/activate`);
      return response.data;
    } catch (error) {
      console.error('Activate category error:', error);
      throw error;
    }
  },

  /**
   * Deactivate category (Admin only)
   * @param {string} id - Category ID
   * @returns {Promise}
   */
  deactivateCategory: async (id) => {
    try {
      const response = await api.patch(`/categories/${id}/deactivate`);
      return response.data;
    } catch (error) {
      console.error('Deactivate category error:', error);
      throw error;
    }
  },

  // ============================================
  // CATEGORY STATISTICS
  // ============================================

  /**
   * Get category statistics
   * @param {string} id - Category ID
   * @returns {Promise}
   */
  getCategoryStats: async (id) => {
    try {
      const response = await api.get(`/categories/${id}/stats`);
      return response.data;
    } catch (error) {
      console.error('Get category stats error:', error);
      throw error;
    }
  },

  /**
   * Get all categories statistics
   * @returns {Promise}
   */
  getAllCategoriesStats: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.CATEGORIES.STATS);
      return response.data;
    } catch (error) {
      console.error('Get all categories stats error:', error);
      throw error;
    }
  },

  /**
   * Get category usage statistics
   * @param {string} id - Category ID
   * @param {Object} params - Date range params
   * @returns {Promise}
   */
  getCategoryUsageStats: async (id, params = {}) => {
    try {
      const response = await api.get(`/categories/${id}/usage`, { params });
      return response.data;
    } catch (error) {
      console.error('Get category usage stats error:', error);
      throw error;
    }
  },

  /**
   * Get trending categories
   * @param {number} limit - Number of categories
   * @returns {Promise}
   */
  getTrendingCategories: async (limit = 10) => {
    try {
      const response = await api.get('/categories/trending', {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error('Get trending categories error:', error);
      throw error;
    }
  },

  // ============================================
  // CATEGORY FILTERING & SEARCH
  // ============================================

  /**
   * Get active categories only
   * @returns {Promise}
   */
  getActiveCategories: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.CATEGORIES.LIST, {
        params: { isActive: true, sortBy: 'order' },
      });
      return response.data;
    } catch (error) {
      console.error('Get active categories error:', error);
      throw error;
    }
  },

  /**
   * Get inactive categories
   * @returns {Promise}
   */
  getInactiveCategories: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.CATEGORIES.LIST, {
        params: { isActive: false },
      });
      return response.data;
    } catch (error) {
      console.error('Get inactive categories error:', error);
      throw error;
    }
  },

  /**
   * Search categories
   * @param {string} query - Search query
   * @returns {Promise}
   */
  searchCategories: async (query) => {
    try {
      const response = await api.get(API_ENDPOINTS.CATEGORIES.LIST, {
        params: { search: query },
      });
      return response.data;
    } catch (error) {
      console.error('Search categories error:', error);
      throw error;
    }
  },

  /**
   * Get categories with issues
   * @returns {Promise}
   */
  getCategoriesWithIssues: async () => {
    try {
      const response = await api.get('/categories/with-issues');
      return response.data;
    } catch (error) {
      console.error('Get categories with issues error:', error);
      throw error;
    }
  },

  // ============================================
  // CATEGORY ORDERING
  // ============================================

  /**
   * Reorder categories (Admin only)
   * @param {Array} categories - Array of {id, order} objects
   * @returns {Promise}
   */
  reorderCategories: async (categories) => {
    try {
      const response = await api.put('/categories/reorder', { categories });
      return response.data;
    } catch (error) {
      console.error('Reorder categories error:', error);
      throw error;
    }
  },

  /**
   * Move category up
   * @param {string} id - Category ID
   * @returns {Promise}
   */
  moveCategoryUp: async (id) => {
    try {
      const response = await api.patch(`/categories/${id}/move-up`);
      return response.data;
    } catch (error) {
      console.error('Move category up error:', error);
      throw error;
    }
  },

  /**
   * Move category down
   * @param {string} id - Category ID
   * @returns {Promise}
   */
  moveCategoryDown: async (id) => {
    try {
      const response = await api.patch(`/categories/${id}/move-down`);
      return response.data;
    } catch (error) {
      console.error('Move category down error:', error);
      throw error;
    }
  },

  // ============================================
  // BULK OPERATIONS
  // ============================================

  /**
   * Bulk create categories (Admin only)
   * @param {Array} categories - Array of category objects
   * @returns {Promise}
   */
  bulkCreateCategories: async (categories) => {
    try {
      const response = await api.post('/categories/bulk-create', {
        categories,
      });
      return response.data;
    } catch (error) {
      console.error('Bulk create categories error:', error);
      throw error;
    }
  },

  /**
   * Bulk update categories (Admin only)
   * @param {Array} updates - Array of {id, data} objects
   * @returns {Promise}
   */
  bulkUpdateCategories: async (updates) => {
    try {
      const response = await api.put('/categories/bulk-update', { updates });
      return response.data;
    } catch (error) {
      console.error('Bulk update categories error:', error);
      throw error;
    }
  },

  /**
   * Bulk delete categories (Admin only)
   * @param {Array} ids - Array of category IDs
   * @returns {Promise}
   */
  bulkDeleteCategories: async (ids) => {
    try {
      const response = await api.post('/categories/bulk-delete', { ids });
      return response.data;
    } catch (error) {
      console.error('Bulk delete categories error:', error);
      throw error;
    }
  },

  /**
   * Bulk toggle status (Admin only)
   * @param {Array} ids - Array of category IDs
   * @param {boolean} isActive - Active status
   * @returns {Promise}
   */
  bulkToggleStatus: async (ids, isActive) => {
    try {
      const response = await api.patch('/categories/bulk-toggle', {
        ids,
        isActive,
      });
      return response.data;
    } catch (error) {
      console.error('Bulk toggle status error:', error);
      throw error;
    }
  },

  // ============================================
  // CATEGORY VALIDATION
  // ============================================

  /**
   * Check if category name exists
   * @param {string} name - Category name
   * @param {string} excludeId - ID to exclude from check (for updates)
   * @returns {Promise}
   */
  checkNameExists: async (name, excludeId = null) => {
    try {
      const response = await api.get('/categories/check-name', {
        params: { name, excludeId },
      });
      return response.data;
    } catch (error) {
      console.error('Check name exists error:', error);
      throw error;
    }
  },

  /**
   * Validate category data
   * @param {Object} categoryData - Category data to validate
   * @returns {Object} Validation result
   */
  validateCategory: (categoryData) => {
    const errors = {};

    if (!categoryData.name || categoryData.name.trim() === '') {
      errors.name = 'Name is required';
    } else if (!/^[a-z0-9-]+$/.test(categoryData.name)) {
      errors.name = 'Name must be lowercase alphanumeric with hyphens';
    }

    if (!categoryData.displayName || categoryData.displayName.trim() === '') {
      errors.displayName = 'Display name is required';
    }

    if (categoryData.icon && categoryData.icon.length > 10) {
      errors.icon = 'Icon must be 10 characters or less';
    }

    if (categoryData.color && !/^#[0-9A-Fa-f]{6}$/.test(categoryData.color)) {
      errors.color = 'Invalid color format (use #RRGGBB)';
    }

    if (categoryData.order !== undefined && categoryData.order < 0) {
      errors.order = 'Order must be a positive number';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Get category icon
   * @param {Object} category - Category object
   * @returns {string}
   */
  getCategoryIcon: (category) => {
    return category?.icon || '📁';
  },

  /**
   * Get category color
   * @param {Object} category - Category object
   * @returns {string}
   */
  getCategoryColor: (category) => {
    return category?.color || '#667eea';
  },

  /**
   * Format category for display
   * @param {Object} category - Category object
   * @returns {Object}
   */
  formatCategory: (category) => {
    return {
      id: category._id,
      name: category.name,
      displayName: category.displayName,
      description: category.description,
      icon: categoryService.getCategoryIcon(category),
      color: categoryService.getCategoryColor(category),
      order: category.order || 0,
      isActive: category.isActive !== false,
      issueCount: category.metadata?.issueCount || 0,
    };
  },

  /**
   * Sort categories by order
   * @param {Array} categories - Array of categories
   * @returns {Array}
   */
  sortByOrder: (categories) => {
    return [...categories].sort((a, b) => (a.order || 0) - (b.order || 0));
  },

  /**
   * Group categories by status
   * @param {Array} categories - Array of categories
   * @returns {Object}
   */
  groupByStatus: (categories) => {
    return {
      active: categories.filter((cat) => cat.isActive !== false),
      inactive: categories.filter((cat) => cat.isActive === false),
    };
  },

  /**
   * Get category options for select
   * @param {Array} categories - Array of categories
   * @returns {Array}
   */
  getCategoryOptions: (categories) => {
    return categories.map((cat) => ({
      value: cat._id,
      label: cat.displayName,
      icon: cat.icon,
      color: cat.color,
    }));
  },

  // ============================================
  // CACHE MANAGEMENT
  // ============================================

  /**
   * Get cached categories
   * @returns {Array|null}
   */
  getCachedCategories: () => {
    try {
      const cached = sessionStorage.getItem('categories_cache');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Cache valid for 5 minutes
        if (Date.now() - timestamp < 300000) {
          return data;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  },

  /**
   * Set cached categories
   * @param {Array} categories - Categories to cache
   */
  setCachedCategories: (categories) => {
    try {
      sessionStorage.setItem(
        'categories_cache',
        JSON.stringify({
          data: categories,
          timestamp: Date.now(),
        }),
      );
    } catch (error) {
      console.error('Cache categories error:', error);
    }
  },

  /**
   * Clear category cache
   */
  clearCache: () => {
    sessionStorage.removeItem('categories_cache');
  },

  // ============================================
  // EXPORT & IMPORT
  // ============================================

  /**
   * Export categories to JSON
   * @param {Array} categoryIds - Array of category IDs (optional)
   * @returns {Promise}
   */
  exportCategories: async (categoryIds = null) => {
    try {
      const response = await api.post(
        '/categories/export',
        { categoryIds },
        {
          responseType: 'blob',
        },
      );
      return response.data;
    } catch (error) {
      console.error('Export categories error:', error);
      throw error;
    }
  },

  /**
   * Import categories from JSON
   * @param {File} file - JSON file
   * @returns {Promise}
   */
  importCategories: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/categories/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error('Import categories error:', error);
      throw error;
    }
  },
};

export default categoryService;
