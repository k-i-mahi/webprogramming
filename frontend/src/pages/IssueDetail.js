import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import issueService from '../services/issueService';
import Badge from '../components/Badge';
import Avatar from '../components/Avatar';
import Feedback from '../components/Feedback';
import Modal, { ConfirmDialog } from '../components/Modal';
import './IssueDetail.css';

const IssueDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');

  // Load issue details
  const loadIssueDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await issueService.getIssueById(id);
      setIssue(response.data);
    } catch (err) {
      showError(err.message || 'Failed to load issue details');
    } finally {
      setLoading(false);
    }
  }, [id, showError]);

  useEffect(() => {
    loadIssueDetails();
  }, [loadIssueDetails]);

  // Derived states
  const voteStatus = (() => {
    if (!user || !issue || !issue.votes)
      return { voted: false, voteType: null };
    const hasUpvoted = issue.votes.upvotes?.some(
      (v) => (typeof v === 'object' ? v._id : v)?.toString() === user._id,
    );
    const hasDownvoted = issue.votes.downvotes?.some(
      (v) => (typeof v === 'object' ? v._id : v)?.toString() === user._id,
    );
    return {
      voted: hasUpvoted || hasDownvoted,
      voteType: hasUpvoted ? 'upvote' : hasDownvoted ? 'downvote' : null,
    };
  })();

  const isFollowing = (() => {
    if (!user || !issue) return false;
    return issue.followers?.some(
      (f) => (typeof f === 'object' ? f._id : f)?.toString() === user._id,
    );
  })();

  // Voting
  const handleVote = async (voteType) => {
    if (!user) return showError('Please login to vote');
    try {
      const response = await issueService.voteOnIssue(id, voteType);
      setIssue(response.data);
      success('Vote recorded');
    } catch (err) {
      showError(err.message || 'Failed to vote');
    }
  };

  // Follow/unfollow
  const handleToggleFollow = async () => {
    if (!user) return showError('Please login to follow');
    try {
      const response = await issueService.toggleFollow(id);
      setIssue(response.data);
      success(isFollowing ? 'Unfollowed issue' : 'Following issue');
    } catch (err) {
      showError(err.message || 'Failed to update follow status');
    }
  };

  // Add comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!user) return showError('Please login to comment');
    try {
      setIsCommenting(true);
      const response = await issueService.addComment(id, commentText.trim());
      setIssue(response.data);
      setCommentText('');
      success('Comment added');
    } catch (err) {
      showError(err.message || 'Failed to add comment');
    } finally {
      setIsCommenting(false);
    }
  };

  // Status change
  const handleStatusChange = async (e) => {
    e.preventDefault();
    try {
      const response = await issueService.changeStatus(
        id,
        newStatus,
        statusReason,
      );
      setIssue(response.data);
      setShowStatusModal(false);
      setNewStatus('');
      setStatusReason('');
      success('Status updated');
    } catch (err) {
      showError('Failed to update status');
    }
  };

  // Delete issue
  const handleDelete = async () => {
    try {
      await issueService.deleteIssue(id);
      success('Issue deleted');
      navigate('/issues');
    } catch (err) {
      showError('Failed to delete issue');
    }
  };

  // Permission checks
  const canEdit =
    user && (user._id === issue?.reportedBy?._id || user.role === 'admin');
  const canDelete = canEdit;
  const canChangeStatus =
    user &&
    (user.role === 'admin' ||
      (user.role === 'authority' && issue?.assignedTo?._id === user._id));

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  if (loading) return <Feedback type="loading" fullPage />;

  if (!issue)
    return (
      <Feedback
        type="error"
        title="Issue Not Found"
        message="The issue doesn't exist."
        fullPage
      />
    );

  return (
    <div className="issue-detail-page">
      <div className="issue-detail-container">
        <Link to="/issues" className="back-link">
          ← Back to Issues
        </Link>

        <div className="issue-header">
          <div className="issue-title-section">
            <h1>{issue.title}</h1>
            <div className="issue-badges">
              <Badge type="status" value={issue.status} />
              <Badge type="priority" value={issue.priority} />
            </div>
          </div>

          {canEdit && (
            <div className="issue-actions">
              <button onClick={() => navigate(`/issues/${id}/edit`)}>
                ✏️ Edit
              </button>
              {canDelete && (
                <button onClick={() => setShowDeleteConfirm(true)}>
                  🗑️ Delete
                </button>
              )}
            </div>
          )}

          <div className="issue-action-buttons">
            <button
              className={voteStatus.voteType === 'upvote' ? 'active' : ''}
              onClick={() => handleVote('upvote')}
            >
              👍 {issue.stats?.upvotes || 0}
            </button>
            <button
              className={voteStatus.voteType === 'downvote' ? 'active' : ''}
              onClick={() => handleVote('downvote')}
            >
              👎 {issue.stats?.downvotes || 0}
            </button>
            <button
              className={isFollowing ? 'active' : ''}
              onClick={handleToggleFollow}
            >
              {isFollowing ? '★ Following' : '☆ Follow'}
            </button>
            <span>👁 {issue.stats?.views || 0}</span>
            {canChangeStatus && (
              <button onClick={() => setShowStatusModal(true)}>
                Change Status
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="issue-tabs">
          <button
            className={activeTab === 'details' ? 'active' : ''}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button
            className={activeTab === 'comments' ? 'active' : ''}
            onClick={() => setActiveTab('comments')}
          >
            Comments ({issue.stats?.commentCount || 0})
          </button>
          <button
            className={activeTab === 'activity' ? 'active' : ''}
            onClick={() => setActiveTab('activity')}
          >
            Activity
          </button>
        </div>

        <div className="issue-content">
          {activeTab === 'details' && (
            <div className="details-tab">
              {issue.images?.length > 0 && (
                <div className="issue-images">
                  {issue.images.map((img, i) => (
                    <img key={i} src={img.url} alt={`Issue ${i + 1}`} />
                  ))}
                </div>
              )}
              <h3>Description</h3>
              <p>{issue.description}</p>

              <h3>Information</h3>
              <div className="details-grid">
                <div>Category: {issue.category?.displayName}</div>
                <div>
                  Reported By:{' '}
                  <Avatar
                    src={issue.reportedBy?.avatar}
                    name={issue.reportedBy?.name}
                  />{' '}
                  {issue.reportedBy?.name}
                </div>
                {issue.assignedTo && (
                  <div>
                    Assigned To:{' '}
                    <Avatar
                      src={issue.assignedTo.avatar}
                      name={issue.assignedTo.name}
                    />{' '}
                    {issue.assignedTo.name}
                  </div>
                )}
                <div>Location: {issue.location?.address || 'N/A'}</div>
                <div>Created: {getTimeAgo(issue.createdAt)}</div>
                <div>Updated: {getTimeAgo(issue.updatedAt)}</div>
              </div>

              {issue.tags?.length > 0 && (
                <div className="tags-list">
                  {issue.tags.map((t, i) => (
                    <span key={i} className="tag">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="comments-tab">
              {user && (
                <form onSubmit={handleAddComment}>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add comment..."
                  />
                  <button
                    type="submit"
                    disabled={isCommenting || !commentText.trim()}
                  >
                    {isCommenting ? 'Posting...' : 'Post Comment'}
                  </button>
                </form>
              )}
              {issue.comments?.length === 0 ? (
                <Feedback type="empty" title="No Comments" />
              ) : (
                issue.comments.map((c) => (
                  <div key={c._id} className="comment-item">
                    <Avatar src={c.user?.avatar} name={c.user?.name} />
                    <div>
                      <strong>{c.user?.name}</strong> ·{' '}
                      {getTimeAgo(c.createdAt)}
                      <p>{c.commentText}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="activity-tab">
              {issue.activities?.length === 0 ? (
                <Feedback type="empty" title="No Activity" />
              ) : (
                issue.activities.map((a) => (
                  <div key={a._id} className="activity-item">
                    <span>
                      {a.user?.name} {a.action.replace('_', ' ')} ·{' '}
                      {getTimeAgo(a.createdAt)}
                    </span>
                    {a.reason && <p>{a.reason}</p>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Issue"
        message="Are you sure you want to delete this issue?"
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {showStatusModal && (
        <Modal
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          title="Change Status"
        >
          <form onSubmit={handleStatusChange}>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              required
            >
              <option value="">Select Status</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
              {user?.role === 'admin' && (
                <option value="rejected">Rejected</option>
              )}
            </select>
            <textarea
              placeholder="Reason (optional)"
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
            />
            <button type="submit">Update Status</button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default IssueDetail;
