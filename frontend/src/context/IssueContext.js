import React, { createContext, useState, useContext, useCallback } from 'react';
import issueService from '../services/issueService';

const IssueContext = createContext();

export const useIssue = () => {
  const context = useContext(IssueContext);
  if (!context) {
    throw new Error('useIssue must be used within IssueProvider');
  }
  return context;
};

export const IssueProvider = ({ children }) => {
  const [issues, setIssues] = useState([]);
  const [currentIssue, setCurrentIssue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch all issues
  const fetchIssues = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await issueService.getIssues(params);

      setIssues(response.data || []);

      if (response.pagination) {
        setPagination(response.pagination);
      }

      return response.data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || 'Failed to fetch issues';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch single issue
  const fetchIssue = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);

      const response = await issueService.getIssueById(id);

      setCurrentIssue(response.data);

      return response.data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || 'Failed to fetch issue';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create issue
  const createIssue = useCallback(async (issueData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await issueService.createIssue(issueData);

      // Add new issue to the list
      setIssues((prev) => [response.data, ...prev]);

      return response.data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || 'Failed to create issue';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update issue
  const updateIssue = useCallback(
    async (id, issueData) => {
      try {
        setLoading(true);
        setError(null);

        const response = await issueService.updateIssue(id, issueData);

        // Update issue in the list
        setIssues((prev) =>
          prev.map((issue) => (issue._id === id ? response.data : issue)),
        );

        // Update current issue if it's the same
        if (currentIssue?._id === id) {
          setCurrentIssue(response.data);
        }

        return response.data;
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || 'Failed to update issue';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentIssue],
  );

  // Delete issue
  const deleteIssue = useCallback(
    async (id) => {
      try {
        setLoading(true);
        setError(null);

        await issueService.deleteIssue(id);

        // Remove issue from the list
        setIssues((prev) => prev.filter((issue) => issue._id !== id));

        // Clear current issue if it's the deleted one
        if (currentIssue?._id === id) {
          setCurrentIssue(null);
        }

        return true;
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || 'Failed to delete issue';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentIssue],
  );

  // Vote on issue
  const voteOnIssue = useCallback(
    async (id, voteType) => {
      try {
        const response = await issueService.voteOnIssue(id, voteType);

        console.log('🗳️ Vote response in context:', response);

        // Update issue in the list with new vote data
        setIssues((prev) =>
          prev.map((issue) => {
            if (issue._id === id) {
              // Backend returns the full issue with updated votes
              return response.data.issue || {
                ...issue,
                votes: response.data.votes || response.data,
                stats: {
                  ...issue.stats,
                  upvotes: response.data.upvotes || response.data.votes?.upvotes?.length || 0,
                  downvotes: response.data.downvotes || response.data.votes?.downvotes?.length || 0,
                },
              };
            }
            return issue;
          }),
        );

        // Update current issue if it's the same
        if (currentIssue?._id === id) {
          setCurrentIssue((prev) => ({
            ...prev,
            votes: response.data.votes || response.data,
            stats: {
              ...prev.stats,
              upvotes: response.data.upvotes || response.data.votes?.upvotes?.length || 0,
              downvotes: response.data.downvotes || response.data.votes?.downvotes?.length || 0,
            },
          }));
        }

        return response.data;
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to vote';
        setError(errorMessage);
        console.error('❌ Vote error in context:', err);
        throw err;
      }
    },
    [currentIssue],
  );

  // Toggle follow
  const toggleFollow = useCallback(
    async (id) => {
      try {
        const response = await issueService.toggleFollow(id);

        console.log('👁️ Toggle follow response in context:', response);

        // Refresh the current issue data to get accurate follower info
        if (currentIssue?._id === id) {
          const refreshed = await issueService.getIssueById(id);
          setCurrentIssue(refreshed.data);
        }

        // Update issues list - refetch to ensure accuracy
        setIssues((prev) =>
          prev.map((issue) => {
            if (issue._id === id) {
              // Backend returns the full issue with updated followers
              return response.data.issue || {
                ...issue,
                followers: response.data.followers || issue.followers,
              };
            }
            return issue;
          }),
        );

        return response.data;
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || err.message || 'Failed to toggle follow';
        setError(errorMessage);
        console.error('❌ Toggle follow error in context:', err);
        throw err;
      }
    },
    [currentIssue],
  );

  const value = {
    // State
    issues,
    currentIssue,
    loading,
    error,
    pagination,

    // Actions
    fetchIssues,
    fetchIssue,
    createIssue,
    updateIssue,
    deleteIssue,
    voteOnIssue,
    toggleFollow,
    clearError,
    setCurrentIssue,
  };

  return (
    <IssueContext.Provider value={value}>{children}</IssueContext.Provider>
  );
};

export default IssueContext;
