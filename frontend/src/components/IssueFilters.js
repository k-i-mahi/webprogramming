import React, { useState, useEffect } from 'react';

const IssueFilters = ({ 
  categories = [], 
  onFiltersChange, 
  initialFilters = {} 
}) => {
  const [filters, setFilters] = useState({
    search: initialFilters.search || '',
    status: initialFilters.status || '',
    category: initialFilters.category || '',
    priority: initialFilters.priority || '',
    assignedTo: initialFilters.assignedTo || '',
    dateRange: initialFilters.dateRange || '',
    sortBy: initialFilters.sortBy || 'createdAt',
    sortOrder: initialFilters.sortOrder || 'desc',
    ...initialFilters
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    onFiltersChange && onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      status: '',
      category: '',
      priority: '',
      assignedTo: '',
      dateRange: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    setFilters(clearedFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value && value !== '' && value !== 'createdAt' && value !== 'desc'
  );

  return (
    <div className="card" style={{ marginBottom: '2rem' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h3 style={{ margin: 0 }}>Filters</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem' }}
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="btn btn-danger"
              style={{ fontSize: '0.8rem' }}
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Basic Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="form-group">
          <label htmlFor="search">Search</label>
          <input
            type="text"
            id="search"
            className="form-control"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Search issues..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            className="form-control"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Reported">Reported</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            className="form-control"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            className="form-control"
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div style={{ 
          marginTop: '1rem', 
          paddingTop: '1rem', 
          borderTop: '1px solid #dee2e6' 
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="assignedTo">Assigned To</label>
              <select
                id="assignedTo"
                className="form-control"
                value={filters.assignedTo}
                onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
              >
                <option value="">All Users</option>
                <option value="me">Assigned to Me</option>
                <option value="unassigned">Unassigned</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="dateRange">Date Range</label>
              <select
                id="dateRange"
                className="form-control"
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="sortBy">Sort By</label>
              <select
                id="sortBy"
                className="form-control"
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <option value="createdAt">Created Date</option>
                <option value="updatedAt">Updated Date</option>
                <option value="title">Title</option>
                <option value="status">Status</option>
                <option value="priority">Priority</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="sortOrder">Sort Order</label>
              <select
                id="sortOrder"
                className="form-control"
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '0.5rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          fontSize: '0.9rem'
        }}>
          <strong>Active Filters:</strong>
          {Object.entries(filters).map(([key, value]) => {
            if (!value || value === '' || (key === 'sortBy' && value === 'createdAt') || (key === 'sortOrder' && value === 'desc')) {
              return null;
            }
            
            let displayValue = value;
            if (key === 'category') {
              const category = categories.find(c => c._id === value);
              displayValue = category ? category.name : value;
            }
            
            return (
              <span key={key} style={{ 
                display: 'inline-block',
                margin: '0.25rem',
                padding: '0.25rem 0.5rem',
                backgroundColor: '#007bff',
                color: 'white',
                borderRadius: '4px',
                fontSize: '0.8rem'
              }}>
                {key}: {displayValue}
                <button
                  type="button"
                  onClick={() => handleFilterChange(key, '')}
                  style={{
                    marginLeft: '0.5rem',
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IssueFilters;
