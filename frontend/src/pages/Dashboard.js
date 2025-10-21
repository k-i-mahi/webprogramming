import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import issueService from '../services/issueService';
import categoryService from '../services/categoryService';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalIssues: 0,
    myIssues: 0,
    assignedIssues: 0,
    recentIssues: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load recent issues
      const issuesResponse = await issueService.getIssues({ limit: 5 });
      const recentIssues = issuesResponse.data.issues || [];

      // Calculate stats based on user role
      let totalIssues = 0;
      let myIssues = 0;
      let assignedIssues = 0;

      if (user?.role === 'resident') {
        myIssues = recentIssues.filter(issue => issue.createdBy?._id === user.id).length;
        totalIssues = myIssues;
      } else if (user?.role === 'authority') {
        totalIssues = recentIssues.length;
        assignedIssues = recentIssues.filter(issue => issue.assignedTo?._id === user.id).length;
      } else if (user?.role === 'admin') {
        totalIssues = recentIssues.length;
        myIssues = recentIssues.filter(issue => issue.createdBy?._id === user.id).length;
        assignedIssues = recentIssues.filter(issue => issue.assignedTo?._id === user.id).length;
      }

      setStats({
        totalIssues,
        myIssues,
        assignedIssues,
        recentIssues
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBasedContent = () => {
    switch (user?.role) {
      case 'resident':
        return (
          <div>
            <h3>Your Issues</h3>
            <p>You have {stats.myIssues} issue(s) reported.</p>
            <div style={{ marginTop: '2rem' }}>
              <h4>Quick Actions</h4>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <a href="/issues" className="btn btn-primary">Report New Issue</a>
                <a href="/issues" className="btn btn-secondary">View My Issues</a>
              </div>
            </div>
          </div>
        );
      
      case 'authority':
        return (
          <div>
            <h3>Authority Dashboard</h3>
            <p>You have {stats.assignedIssues} issue(s) assigned to you.</p>
            <p>Total issues in your categories: {stats.totalIssues}</p>
            <div style={{ marginTop: '2rem' }}>
              <h4>Quick Actions</h4>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <a href="/issues" className="btn btn-primary">View All Issues</a>
                <a href="/issues" className="btn btn-secondary">My Assigned Issues</a>
              </div>
            </div>
          </div>
        );
      
      case 'admin':
        return (
          <div>
            <h3>Admin Dashboard</h3>
            <p>Total issues in system: {stats.totalIssues}</p>
            <p>Issues you created: {stats.myIssues}</p>
            <p>Issues assigned to you: {stats.assignedIssues}</p>
            <div style={{ marginTop: '2rem' }}>
              <h4>Quick Actions</h4>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <a href="/issues" className="btn btn-primary">Manage Issues</a>
                <a href="/categories" className="btn btn-secondary">Manage Categories</a>
                <a href="/users" className="btn btn-secondary">Manage Users</a>
              </div>
            </div>
          </div>
        );
      
      default:
        return <p>Welcome to Civita!</p>;
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card text-center">
          <h2>Loading dashboard...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <h1>Dashboard</h1>
        <p>Welcome to your dashboard, {user?.name}!</p>
        
        <div style={{ marginTop: '2rem' }}>
          <h3>User Information</h3>
          <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '5px' }}>
            <p><strong>Name:</strong> {user?.name}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Role:</strong> 
              <span style={{ 
                padding: '0.25rem 0.5rem', 
                borderRadius: '4px', 
                backgroundColor: user?.role === 'admin' ? '#dc3545' : user?.role === 'authority' ? '#17a2b8' : '#28a745',
                color: 'white',
                fontSize: '0.8rem',
                marginLeft: '0.5rem'
              }}>
                {user?.role?.toUpperCase()}
              </span>
            </p>
            {user?.location && (
              <>
                <p><strong>Location:</strong> {user.location.latitude}, {user.location.longitude}</p>
                <p><strong>Coordinates:</strong> 
                  <a 
                    href={`https://www.google.com/maps?q=${user.location.latitude},${user.location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ marginLeft: '0.5rem', color: '#007bff' }}
                  >
                    View on Map
                  </a>
                </p>
              </>
            )}
          </div>
        </div>

        {getRoleBasedContent()}

        {stats.recentIssues.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3>Recent Issues</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {stats.recentIssues.slice(0, 3).map(issue => (
                <div key={issue._id} className="card" style={{ padding: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>{issue.title}</h4>
                  <p style={{ color: '#666', margin: '0 0 0.5rem 0' }}>{issue.description}</p>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      backgroundColor: issue.status === 'Reported' ? '#ffc107' : issue.status === 'In Progress' ? '#17a2b8' : '#28a745',
                      color: 'white',
                      fontSize: '0.8rem'
                    }}>
                      {issue.status}
                    </span>
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>
                      {issue.category?.name}
                    </span>
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
