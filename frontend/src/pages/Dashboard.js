import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import issueService from '../services/issueService';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalIssues: 0,
    myIssues: 0,
    assignedIssues: 0,
    recentIssues: []
  });
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
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
  }, [user]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const getRoleBasedContent = () => {
    switch (user?.role) {
      case 'resident':
        return (
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="card-title text-xl">Your Issues</h3>
                    <p className="text-gray-600">Track your reported issues</p>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div className="text-center py-8">
                  <div className="text-4xl font-bold text-primary mb-2">{stats.myIssues}</div>
                  <p className="text-gray-600">Issue(s) reported</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title text-xl">Quick Actions</h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <a href="/issues" className="btn btn-primary w-full">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Report New Issue
                  </a>
                  <a href="/my-issues" className="btn btn-outline w-full">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    View My Issues
                  </a>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'authority':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <div className="card-header">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-info to-info-dark rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="card-title text-xl">Assigned Issues</h3>
                      <p className="text-gray-600">Issues assigned to you</p>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <div className="text-center py-4">
                    <div className="text-3xl font-bold text-info mb-2">{stats.assignedIssues}</div>
                    <p className="text-gray-600">Pending</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-secondary to-secondary-dark rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="card-title text-xl">Total Issues</h3>
                      <p className="text-gray-600">In your categories</p>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <div className="text-center py-4">
                    <div className="text-3xl font-bold text-secondary mb-2">{stats.totalIssues}</div>
                    <p className="text-gray-600">All Issues</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title text-xl">Quick Actions</h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <a href="/issues" className="btn btn-primary w-full">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    View All Issues
                  </a>
                  <a href="/my-issues" className="btn btn-outline w-full">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    My Assigned Issues
                  </a>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'admin':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <div className="card-header">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-secondary to-secondary-dark rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="card-title text-xl">Total Issues</h3>
                      <p className="text-gray-600">System wide</p>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <div className="text-center py-4">
                    <div className="text-3xl font-bold text-secondary mb-2">{stats.totalIssues}</div>
                    <p className="text-gray-600">All Issues</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="card-title text-xl">My Issues</h3>
                      <p className="text-gray-600">Created by you</p>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <div className="text-center py-4">
                    <div className="text-3xl font-bold text-primary mb-2">{stats.myIssues}</div>
                    <p className="text-gray-600">Your Issues</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-info to-info-dark rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="card-title text-xl">Assigned</h3>
                      <p className="text-gray-600">To you</p>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <div className="text-center py-4">
                    <div className="text-3xl font-bold text-info mb-2">{stats.assignedIssues}</div>
                    <p className="text-gray-600">Assigned</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title text-xl">Quick Actions</h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <a href="/issues" className="btn btn-primary w-full">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Manage Issues
                  </a>
                  <a href="/categories" className="btn btn-outline w-full">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Manage Categories
                  </a>
                  <a href="/users" className="btn btn-outline w-full">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Manage Users
                  </a>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="card">
            <div className="card-body text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Civita!</h3>
              <p className="text-gray-600">Your civic engagement platform</p>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="card">
          <div className="card-body text-center py-12">
            <div className="spinner mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900">Loading dashboard...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.name}!</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="flex items-center space-x-3 px-4 py-2 bg-gray-100 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{user?.name}</p>
                <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Role-based Content */}
      {getRoleBasedContent()}

      {/* Recent Issues */}
      {stats.recentIssues.length > 0 && (
        <div className="card mt-8">
          <div className="card-header">
            <h3 className="card-title text-xl">Recent Issues</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {stats.recentIssues.slice(0, 3).map(issue => (
                <div key={issue._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{issue.title}</h4>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{issue.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span>{issue.category?.name}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{issue.createdBy?.name}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      issue.status === 'Reported' ? 'bg-yellow-100 text-yellow-800' : 
                      issue.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {issue.status}
                    </span>
                    <a href="/issues" className="btn btn-outline btn-sm">
                      View
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
