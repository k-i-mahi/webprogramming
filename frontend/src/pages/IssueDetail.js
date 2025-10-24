import React, { useState, useEffect } from 'react';
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
  const [activeTab, setActiveTab] = useState('details'); // details, comments, activity
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [voteStatus, setVoteStatus] = useState({
    voted: false,
    voteType: null,
  });
  const [isFollowing, setIsFollowing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');

  useEffect(() => {
    loadIssueDetails();
  }, [id]);

  const loadIssueDetails = async () => {
    try {
      setLoading(true);

      const response = await issueService.getIssueById(id);
      const issueData = response.data;
      
      setIssue(issueData);
      
      // Check if current user is in followers array
      if (user && issueData.followers) {
        const isUserFollowing = issueData.followers.some(
          (followerId) => {
            const fId = typeof followerId === 'object' ? followerId._id : followerId;
            return fId?.toString() === user._id?.toString();
          }
        );
        setIsFollowing(isUserFollowing);
      }

      // Determine vote status from issue data
      if (user && issueData.votes) {
        const hasUpvoted = issueData.votes.upvotes?.some(
          (voterId) => {
            const vId = typeof voterId === 'object' ? voterId._id : voterId;
            return vId?.toString() === user._id?.toString();
          }
        );
        const hasDownvoted = issueData.votes.downvotes?.some(
          (voterId) => {
            const vId = typeof voterId === 'object' ? voterId._id : voterId;
            return vId?.toString() === user._id?.toString();
          }
        );
        
        setVoteStatus({
          voted: hasUpvoted || hasDownvoted,
          voteType: hasUpvoted ? 'upvote' : hasDownvoted ? 'downvote' : null,
        });
      }
    } catch (error) {
      console.error('Load issue error:', error);
      showError('Failed to load issue details');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (voteType) => {
    if (!user) {
      showError('Please login to vote');
      return;
    }

    try {
      await issueService.voteOnIssue(id, voteType);
      await loadIssueDetails();
      success('Vote recorded');
    } catch (error) {
      showError('Failed to vote');
    }
  };

  const handleToggleFollow = async () => {
    if (!user) {
      showError('Please login to follow');
      return;
    }

    try {
      await issueService.toggleFollow(id);
      setIsFollowing(!isFollowing);
      success(isFollowing ? 'Unfollowed issue' : 'Following issue');
      await loadIssueDetails();
    } catch (error) {
      showError('Failed to update follow status');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!commentText.trim()) return;

    if (!user) {
      showError('Please login to comment');
      return;
    }

    try {
      setIsCommenting(true);
      await issueService.addComment(id, commentText.trim());
      setCommentText('');
      await loadIssueDetails();
      success('Comment added');
    } catch (error) {
      showError('Failed to add comment');
    } finally {
      setIsCommenting(false);
    }
  };

  const handleStatusChange = async (e) => {
    e.preventDefault();

    try {
      await issueService.changeStatus(id, newStatus, statusReason);
      setShowStatusModal(false);
      setNewStatus('');
      setStatusReason('');
      await loadIssueDetails();
      success('Status updated');
    } catch (error) {
      showError('Failed to update status');
    }
  };

  const handleDelete = async () => {
    try {
      await issueService.deleteIssue(id);
      success('Issue deleted');
      navigate('/issues');
    } catch (error) {
      showError('Failed to delete issue');
    }
  };

  const canEdit = () => {
    return (
      user && (user._id === issue?.reportedBy?._id || user.role === 'admin')
    );
  };

  const canDelete = () => {
    return (
      user && (user._id === issue?.reportedBy?._id || user.role === 'admin')
    );
  };

  const canChangeStatus = () => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'authority' && issue?.assignedTo?._id === user._id)
      return true;
    return false;
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="issue-detail-page">
        <Feedback type="loading" fullPage={true} />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="issue-detail-page">
        <Feedback
          type="error"
          title="Issue Not Found"
          message="The issue you're looking for doesn't exist or has been removed."
          icon="🔍"
          fullPage={true}
        />
      </div>
    );
  }

  return (
    <div className="issue-detail-page">
      <div className="issue-detail-container">
        {/* Back Button */}
        <Link to="/issues" className="back-link">
          ← Back to Issues
        </Link>

        {/* Issue Header */}
        <div className="issue-header">
          <div className="issue-header-top">
            <div className="issue-title-section">
              <h1 className="issue-title">{issue.title}</h1>
              <div className="issue-badges">
                <Badge type="status" value={issue.status} size="medium" />
                <Badge type="priority" value={issue.priority} size="medium" />
              </div>
            </div>

            {canEdit() && (
              <div className="issue-actions">
                <button
                  className="btn btn-outline"
                  onClick={() => navigate(`/issues/${id}/edit`)}
                >
                  ✏️ Edit
                </button>
                {canDelete() && (
                  <button
                    className="btn btn-outline btn-danger"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    🗑️ Delete
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="issue-action-buttons">
            <button
              className={`action-btn ${
                voteStatus.voteType === 'upvote' ? 'active' : ''
              }`}
              onClick={() => handleVote('upvote')}
              disabled={!user}
            >
              <span className="action-icon">👍</span>
              <span className="action-count">{issue.stats?.upvotes || 0}</span>
            </button>

            <button
              className={`action-btn ${
                voteStatus.voteType === 'downvote' ? 'active' : ''
              }`}
              onClick={() => handleVote('downvote')}
              disabled={!user}
            >
              <span className="action-icon">👎</span>
              <span className="action-count">
                {issue.stats?.downvotes || 0}
              </span>
            </button>

            <button
              className={`action-btn ${isFollowing ? 'active' : ''}`}
              onClick={handleToggleFollow}
              disabled={!user}
            >
              <span className="action-icon">{isFollowing ? '★' : '☆'}</span>
              <span className="action-text">
                {isFollowing ? 'Following' : 'Follow'}
              </span>
            </button>

            <div className="action-btn-info">
              <span className="action-icon">👁</span>
              <span className="action-count">{issue.stats?.views || 0}</span>
            </div>

            {canChangeStatus() && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowStatusModal(true)}
              >
                Change Status
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="issue-tabs">
          <button
            className={`tab ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button
            className={`tab ${activeTab === 'comments' ? 'active' : ''}`}
            onClick={() => setActiveTab('comments')}
          >
            Comments ({issue.stats?.commentCount || 0})
          </button>
          <button
            className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            Activity
          </button>
        </div>

        {/* Tab Content */}
        <div className="issue-content">
          {activeTab === 'details' && (
            <div className="details-tab">
              {/* Images */}
              {issue.images && issue.images.length > 0 && (
                <div className="issue-images">
                  {issue.images.map((image, index) => (
                    <img
                      key={index}
                      src={image.url}
                      alt={`Issue ${index + 1}`}
                      className="issue-image"
                    />
                  ))}
                </div>
              )}

              {/* Description */}
              <div className="detail-section">
                <h3 className="section-title">Description</h3>
                <p className="description-text">{issue.description}</p>
              </div>

              {/* Details Grid */}
              <div className="detail-section">
                <h3 className="section-title">Information</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Category</span>
                    <span className="detail-value">
                      <span className="category-icon">
                        {issue.category?.icon}
                      </span>
                      {issue.category?.displayName}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Reported By</span>
                    <div className="user-info">
                      <Avatar
                        src={issue.reportedBy?.avatar}
                        name={issue.reportedBy?.name}
                        size="small"
                      />
                      <span>{issue.reportedBy?.name}</span>
                    </div>
                  </div>

                  {issue.assignedTo && (
                    <div className="detail-item">
                      <span className="detail-label">Assigned To</span>
                      <div className="user-info">
                        <Avatar
                          src={issue.assignedTo.avatar}
                          name={issue.assignedTo.name}
                          size="small"
                        />
                        <span>{issue.assignedTo.name}</span>
                      </div>
                    </div>
                  )}

                  <div className="detail-item">
                    <span className="detail-label">Location</span>
                    <span className="detail-value">
                      📍 {issue.location?.address || 'Location provided'}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Created</span>
                    <span className="detail-value">
                      {getTimeAgo(issue.createdAt)}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Updated</span>
                    <span className="detail-value">
                      {getTimeAgo(issue.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {issue.tags && issue.tags.length > 0 && (
                <div className="detail-section">
                  <h3 className="section-title">Tags</h3>
                  <div className="tags-list">
                    {issue.tags.map((tag, index) => (
                      <span key={index} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="comments-tab">
              {/* Add Comment Form */}
              {user && (
                <form onSubmit={handleAddComment} className="comment-form">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="comment-input"
                    rows="3"
                  />
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={isCommenting || !commentText.trim()}
                  >
                    {isCommenting ? 'Posting...' : 'Post Comment'}
                  </button>
                </form>
              )}

              {/* Comments List */}
              <div className="comments-list">
                {!issue.comments || issue.comments.length === 0 ? (
                  <Feedback
                    type="empty"
                    title="No Comments Yet"
                    message="Be the first to comment on this issue"
                    icon="💬"
                  />
                ) : (
                  issue.comments.map((comment) => (
                    <div key={comment._id} className="comment-item">
                      <Avatar
                        src={comment.user?.avatar}
                        name={comment.user?.name}
                        size="medium"
                      />
                      <div className="comment-content">
                        <div className="comment-header">
                          <span className="comment-author">
                            {comment.user?.name}
                          </span>
                          <span className="comment-time">
                            {getTimeAgo(comment.createdAt)}
                          </span>
                        </div>
                        <p className="comment-text">{comment.commentText}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="activity-tab">
              <div className="activity-timeline">
                {!issue.activities || issue.activities.length === 0 ? (
                  <Feedback
                    type="empty"
                    title="No Activity Yet"
                    message="Activity will appear here as the issue progresses"
                    icon="📊"
                  />
                ) : (
                  issue.activities.map((activity) => (
                    <div key={activity._id} className="activity-item">
                      <div className="activity-icon">
                        {activity.action === 'created' && '➕'}
                        {activity.action === 'updated' && '✏️'}
                        {activity.action === 'status_changed' && '🔄'}
                        {activity.action === 'assigned' && '📌'}
                        {activity.action === 'commented' && '💬'}
                      </div>
                      <div className="activity-content">
                        <div className="activity-header">
                          <span className="activity-user">
                            {activity.user?.name}
                          </span>
                          <span className="activity-action">
                            {activity.action.replace('_', ' ')}
                          </span>
                        </div>
                        {activity.reason && (
                          <p className="activity-reason">{activity.reason}</p>
                        )}
                        <span className="activity-time">
                          {getTimeAgo(activity.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Issue"
        message="Are you sure you want to delete this issue? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Status Change Modal */}
      {showStatusModal && (
        <Modal
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          title="Change Status"
          size="small"
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setShowStatusModal(false)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleStatusChange}>
                Update Status
              </button>
            </>
          }
        >
          <form onSubmit={handleStatusChange} className="status-form">
            <div className="form-group">
              <label className="form-label">New Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="form-input"
                required
              >
                <option value="">Select status</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
                {user?.role === 'admin' && (
                  <option value="rejected">Rejected</option>
                )}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Reason (optional)</label>
              <textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                className="form-input"
                rows="3"
                placeholder="Provide a reason for this status change..."
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default IssueDetail;
