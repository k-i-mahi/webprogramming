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

        // Update issue in the list with new vote stats
        setIssues((prev) =>
          prev.map((issue) => {
            if (issue._id === id) {
              return {
                ...issue,
                stats: {
                  ...issue.stats,
                  upvotes: response.data.upvotes,
                  downvotes: response.data.downvotes,
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
            stats: {
              ...prev.stats,
              upvotes: response.data.upvotes,
              downvotes: response.data.downvotes,
            },
          }));
        }

        return response.data;
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Failed to vote';
        setError(errorMessage);
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

        // Refresh the current issue data
        if (currentIssue?._id === id) {
          const refreshed = await issueService.getIssueById(id);
          setCurrentIssue(refreshed.data);
        }

        // Update issues list
        setIssues((prev) =>
          prev.map((issue) => {
            if (issue._id === id) {
              return {
                ...issue,
                followers: response.data.isFollowing
                  ? [...(issue.followers || [])]
                  : (issue.followers || []).filter(() => true), // Let backend handle the actual update
              };
            }
            return issue;
          }),
        );

        return response.data;
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || 'Failed to toggle follow';
        setError(errorMessage);
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
