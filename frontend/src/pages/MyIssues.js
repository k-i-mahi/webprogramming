import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import issueService from '../services/issueService';

const MyIssues = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMyIssues = useCallback(async () => {
    setLoading(true);
    try {
      const issuesData = await issueService.getIssues({ 
        createdBy: user.id, 
        limit: 100, 
        sortBy: 'createdAt', 
        sortOrder: 'desc' 
      });
      
      if (Array.isArray(issuesData)) {
        setIssues(issuesData);
      } else {
        setIssues([]);
      }
      setError('');
    } catch (err) {
      console.error('❌ Failed to load issues:', err);
      setError('Failed to load your issues');
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    if (user?.id) {
      loadMyIssues();
    }
  }, [user?.id, loadMyIssues]);

  const getStatusColor = (status) => {
    const colors = {
      'Reported': '#ffc107',
      'In Progress': '#17a2b8',
      'Resolved': '#28a745'
    };
    return colors[status] || '#6c757d';
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
      <div className="card">
        <h1>My Issues</h1>

        {error && <div className="alert alert-danger">{error}</div>}

        {issues.length === 0 ? (
          <p>You haven't submitted any issues yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {issues.map(issue => (
              <div key={issue._id} className="card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                      <h4 style={{ margin: 0 }}>{issue.title}</h4>
                      <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', backgroundColor: getStatusColor(issue.status), color: 'white', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        {issue.status}
                      </span>
                    </div>

                    <p style={{ color: '#666', marginBottom: '1rem' }}>{issue.description}</p>

                    {issue.photoURL && (
                      <div style={{ marginBottom: '1rem' }}>
                        <img 
                          src={issue.photoURL} 
                          alt="Issue submission" 
                          style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'cover', borderRadius: '4px' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    )}

                    <div>
                      <h5 style={{ margin: '1rem 0 0.5rem 0' }}>Status History</h5>
                      {(!issue.statusHistory || issue.statusHistory.length === 0) ? (
                        <p style={{ color: '#666' }}>No status changes yet.</p>
                      ) : (
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                          {issue.statusHistory
                            .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt))
                            .map((entry, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                                <div>
                                  <strong>{entry.status}</strong>
                                  <span style={{ color: '#666', marginLeft: '0.5rem' }}>
                                    {new Date(entry.changedAt).toLocaleString()}
                                  </span>
                                </div>
                                <div style={{ color: '#666' }}>
                                  {entry.changedBy?.name ? `by ${entry.changedBy.name}` : ''}
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', color: '#666', minWidth: '200px' }}>
                    <div><strong>Category:</strong> {issue.category?.name || 'N/A'}</div>
                    <div><strong>Created:</strong> {new Date(issue.createdAt).toLocaleDateString()}</div>
                    <div><strong>Location:</strong> {issue.location?.coordinates?.[1]?.toFixed(4)}, {issue.location?.coordinates?.[0]?.toFixed(4)}</div>
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


