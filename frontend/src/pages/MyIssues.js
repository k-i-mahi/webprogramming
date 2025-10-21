import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import issueService from '../services/issueService';

const MyIssues = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadMyIssues();
    }
  }, [user]);

  const loadMyIssues = async () => {
    try {
      const response = await issueService.getIssues({ createdBy: user.id, limit: 100, sortBy: 'createdAt', sortOrder: 'desc' });
      setIssues(response.data.issues);
    } catch (err) {
      setError('Failed to load your issues');
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

  if (loading) {
    return (
      <div className="container">
        <div className="card text-center">
          <h2>Loading your issues...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-card">
        <div className="page-header">
          <div className="page-header-icon">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div className="page-header-content">
            <h1>My Issues</h1>
            <p>Track your submitted community issues</p>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger">{error}</div>
        )}

        {issues.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="empty-state-title">No issues submitted yet</h3>
            <p className="empty-state-description">You haven't submitted any issues to the community.</p>
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
                      </div>
                    </div>

                    <p className="issue-description">{issue.description}</p>

                    {issue.photoURL && (
                      <div className="issue-photo">
                        <img 
                          src={issue.photoURL} 
                          alt="Issue photo" 
                          className="max-w-xs max-h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}

                    <div className="status-history">
                      <h5 className="status-history-title">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Status History
                      </h5>
                      {(!issue.statusHistory || issue.statusHistory.length === 0) ? (
                        <p className="text-gray-500 text-sm">No status changes yet.</p>
                      ) : (
                        <div className="status-history-list">
                          {issue.statusHistory
                            .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt))
                            .map((entry, idx) => (
                            <div key={idx} className="status-history-item">
                              <div className="status-history-left">
                                <span className="status-history-status">{entry.status}</span>
                                <span className="status-history-date">
                                  {new Date(entry.changedAt).toLocaleString()}
                                </span>
                              </div>
                              <div className="status-history-user">
                                {entry.changedBy?.name ? `by ${entry.changedBy.name}` : ''}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-gray-600 min-w-[200px]">
                    <div className="space-y-2 text-sm">
                      <div className="issue-detail">
                        <svg className="issue-detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span><strong>Category:</strong> {issue.category?.name}</span>
                      </div>
                      <div className="issue-detail">
                        <svg className="issue-detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span><strong>Created:</strong> {new Date(issue.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="issue-detail">
                        <svg className="issue-detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span><strong>Location:</strong> {issue.location?.latitude}, {issue.location?.longitude}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyIssues;



