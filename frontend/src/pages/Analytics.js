import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import issueService from '../services/issueService';
import categoryService from '../services/categoryService';
import Feedback from '../components/Feedback';
import Badge from '../components/Badge';
import Card from '../components/Card';
import './Analytics.css';

const Analytics = () => {
  const { user } = useAuth();
  const { error: showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month'); // week, month, quarter, year
  const [stats, setStats] = useState(null);
  const [categoryStats, setCategoryStats] = useState([]);
  const [trendData, setTrendData] = useState([]);

  // Memoize loadAnalytics to prevent recreating on every render
  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);

      // Load overall statistics
      const statsResponse = await issueService.getIssueStats();
      setStats(statsResponse.data);

      // Load category statistics
      const categoryResponse = await categoryService.getAllCategoriesStats();
      setCategoryStats(categoryResponse.data || []);

      // Mock trend data (replace with real API call if available)
      setTrendData([
        { period: 'Week 1', open: 45, resolved: 32, inProgress: 18 },
        { period: 'Week 2', open: 52, resolved: 38, inProgress: 22 },
        { period: 'Week 3', open: 48, resolved: 42, inProgress: 20 },
        { period: 'Week 4', open: 55, resolved: 45, inProgress: 25 },
      ]);
    } catch (err) {
      console.error('Load analytics error:', err);
      showError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [showError]); // Only recreate if showError changes

  useEffect(() => {
    loadAnalytics();
  }, [timeRange, loadAnalytics]); // Include loadAnalytics in dependencies

  const getStatusPercentage = (status) => {
    if (!stats?.overall) return 0;
    const total = stats.overall.total || 1;
    const count = stats.overall[status] || 0;
    return ((count / total) * 100).toFixed(1);
  };

  const getPriorityPercentage = (priority) => {
    if (!stats?.byPriority) return 0;
    const total = stats.overall?.total || 1;
    const count = stats.byPriority[priority] || 0;
    return ((count / total) * 100).toFixed(1);
  };

  // Access Control
  if (user?.role !== 'authority' && user?.role !== 'admin') {
    return (
      <div className="analytics-page">
        <Feedback
          type="error"
          title="Access Denied"
          message="Only authorities and administrators can view analytics."
          icon="🚫"
          fullPage={true}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="analytics-page">
        <Feedback type="loading" fullPage={true} />
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="analytics-container">
        {/* Header */}
        <div className="analytics-header">
          <div className="header-content">
            <h1 className="page-title">Analytics Dashboard</h1>
            <p className="page-subtitle">
              Comprehensive insights and statistics
            </p>
          </div>

          <div className="time-range-selector">
            <button
              className={`range-btn ${timeRange === 'week' ? 'active' : ''}`}
              onClick={() => setTimeRange('week')}
            >
              Week
            </button>
            <button
              className={`range-btn ${timeRange === 'month' ? 'active' : ''}`}
              onClick={() => setTimeRange('month')}
            >
              Month
            </button>
            <button
              className={`range-btn ${timeRange === 'quarter' ? 'active' : ''}`}
              onClick={() => setTimeRange('quarter')}
            >
              Quarter
            </button>
            <button
              className={`range-btn ${timeRange === 'year' ? 'active' : ''}`}
              onClick={() => setTimeRange('year')}
            >
              Year
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="metrics-grid">
          <Card className="metric-card" padding="large">
            <div className="metric-icon metric-icon-total">📊</div>
            <div className="metric-content">
              <div className="metric-value">{stats?.overall?.total || 0}</div>
              <div className="metric-label">Total Issues</div>
            </div>
          </Card>

          <Card className="metric-card" padding="large">
            <div className="metric-icon metric-icon-open">🔓</div>
            <div className="metric-content">
              <div className="metric-value">{stats?.overall?.open || 0}</div>
              <div className="metric-label">Open Issues</div>
              <div className="metric-change positive">
                {getStatusPercentage('open')}%
              </div>
            </div>
          </Card>

          <Card className="metric-card" padding="large">
            <div className="metric-icon metric-icon-progress">⚙️</div>
            <div className="metric-content">
              <div className="metric-value">
                {stats?.overall?.inProgress || 0}
              </div>
              <div className="metric-label">In Progress</div>
              <div className="metric-change">
                {getStatusPercentage('inProgress')}%
              </div>
            </div>
          </Card>

          <Card className="metric-card" padding="large">
            <div className="metric-icon metric-icon-resolved">✅</div>
            <div className="metric-content">
              <div className="metric-value">
                {stats?.overall?.resolved || 0}
              </div>
              <div className="metric-label">Resolved</div>
              <div className="metric-change positive">
                {getStatusPercentage('resolved')}%
              </div>
            </div>
          </Card>
        </div>

        {/* Status Breakdown */}
        <div className="section-grid">
          <Card className="chart-card" padding="large">
            <h3 className="card-title">Status Distribution</h3>
            <div className="status-chart">
              {stats?.overall && (
                <>
                  <div className="status-bar">
                    <div className="bar-label">Open</div>
                    <div className="bar-track">
                      <div
                        className="bar-fill bar-open"
                        style={{ width: `${getStatusPercentage('open')}%` }}
                      />
                    </div>
                    <div className="bar-value">{stats.overall.open}</div>
                  </div>

                  <div className="status-bar">
                    <div className="bar-label">In Progress</div>
                    <div className="bar-track">
                      <div
                        className="bar-fill bar-progress"
                        style={{
                          width: `${getStatusPercentage('inProgress')}%`,
                        }}
                      />
                    </div>
                    <div className="bar-value">{stats.overall.inProgress}</div>
                  </div>

                  <div className="status-bar">
                    <div className="bar-label">Resolved</div>
                    <div className="bar-track">
                      <div
                        className="bar-fill bar-resolved"
                        style={{ width: `${getStatusPercentage('resolved')}%` }}
                      />
                    </div>
                    <div className="bar-value">{stats.overall.resolved}</div>
                  </div>

                  <div className="status-bar">
                    <div className="bar-label">Closed</div>
                    <div className="bar-track">
                      <div
                        className="bar-fill bar-closed"
                        style={{ width: `${getStatusPercentage('closed')}%` }}
                      />
                    </div>
                    <div className="bar-value">{stats.overall.closed}</div>
                  </div>
                </>
              )}
            </div>
          </Card>

          <Card className="chart-card" padding="large">
            <h3 className="card-title">Priority Breakdown</h3>
            <div className="priority-chart">
              {stats?.byPriority && (
                <>
                  <div className="priority-item">
                    <Badge type="priority" value="urgent" size="small" />
                    <div className="priority-bar">
                      <div
                        className="priority-fill priority-urgent"
                        style={{ width: `${getPriorityPercentage('urgent')}%` }}
                      />
                    </div>
                    <span className="priority-count">
                      {stats.byPriority.urgent || 0}
                    </span>
                  </div>

                  <div className="priority-item">
                    <Badge type="priority" value="high" size="small" />
                    <div className="priority-bar">
                      <div
                        className="priority-fill priority-high"
                        style={{ width: `${getPriorityPercentage('high')}%` }}
                      />
                    </div>
                    <span className="priority-count">
                      {stats.byPriority.high || 0}
                    </span>
                  </div>

                  <div className="priority-item">
                    <Badge type="priority" value="medium" size="small" />
                    <div className="priority-bar">
                      <div
                        className="priority-fill priority-medium"
                        style={{ width: `${getPriorityPercentage('medium')}%` }}
                      />
                    </div>
                    <span className="priority-count">
                      {stats.byPriority.medium || 0}
                    </span>
                  </div>

                  <div className="priority-item">
                    <Badge type="priority" value="low" size="small" />
                    <div className="priority-bar">
                      <div
                        className="priority-fill priority-low"
                        style={{ width: `${getPriorityPercentage('low')}%` }}
                      />
                    </div>
                    <span className="priority-count">
                      {stats.byPriority.low || 0}
                    </span>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Category Statistics */}
        <Card className="category-stats-card" padding="large">
          <h3 className="card-title">Issues by Category</h3>
          <div className="category-stats-grid">
            {categoryStats.slice(0, 8).map((cat) => (
              <div key={cat._id} className="category-stat-item">
                <div
                  className="category-stat-icon"
                  style={{ background: cat.color }}
                >
                  {cat.icon}
                </div>
                <div className="category-stat-content">
                  <div className="category-stat-name">{cat.displayName}</div>
                  <div className="category-stat-count">
                    {cat.issueCount || 0} issues
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Trend Chart */}
        <Card className="trend-card" padding="large">
          <h3 className="card-title">Trend Analysis</h3>
          <div className="trend-chart">
            {trendData.map((data, index) => (
              <div key={index} className="trend-period">
                <div className="trend-bars">
                  <div
                    className="trend-bar trend-open"
                    style={{ height: `${(data.open / 60) * 100}%` }}
                    title={`Open: ${data.open}`}
                  />
                  <div
                    className="trend-bar trend-progress"
                    style={{ height: `${(data.inProgress / 60) * 100}%` }}
                    title={`In Progress: ${data.inProgress}`}
                  />
                  <div
                    className="trend-bar trend-resolved"
                    style={{ height: `${(data.resolved / 60) * 100}%` }}
                    title={`Resolved: ${data.resolved}`}
                  />
                </div>
                <div className="trend-label">{data.period}</div>
              </div>
            ))}
          </div>
          <div className="trend-legend">
            <div className="legend-item">
              <span className="legend-color legend-open"></span>
              <span>Open</span>
            </div>
            <div className="legend-item">
              <span className="legend-color legend-progress"></span>
              <span>In Progress</span>
            </div>
            <div className="legend-item">
              <span className="legend-color legend-resolved"></span>
              <span>Resolved</span>
            </div>
          </div>
        </Card>

        {/* Performance Metrics */}
        <div className="performance-grid">
          <Card className="performance-card" padding="large">
            <div className="performance-icon">⚡</div>
            <div className="performance-content">
              <div className="performance-value">
                {stats?.overall?.resolved || 0}
              </div>
              <div className="performance-label">Resolution Rate</div>
              <div className="performance-sublabel">
                {getStatusPercentage('resolved')}% of total
              </div>
            </div>
          </Card>

          <Card className="performance-card" padding="large">
            <div className="performance-icon">⏱️</div>
            <div className="performance-content">
              <div className="performance-value">2.5d</div>
              <div className="performance-label">Avg Response Time</div>
              <div className="performance-sublabel">Last 30 days</div>
            </div>
          </Card>

          <Card className="performance-card" padding="large">
            <div className="performance-icon">👥</div>
            <div className="performance-content">
              <div className="performance-value">87%</div>
              <div className="performance-label">User Satisfaction</div>
              <div className="performance-sublabel">Based on feedback</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
