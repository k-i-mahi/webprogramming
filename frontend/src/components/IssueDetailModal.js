import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const IssueDetailModal = ({ issue, isOpen, onClose, onUpdate }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: issue?.title || '',
    description: issue?.description || '',
    priority: issue?.priority || 'Medium'
  });
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !issue) return null;

  const canEdit = user?.role === 'admin' || 
    (user?.role === 'authority' && issue.category?.assignedUsers?.includes(user.id)) ||
    (user?.role === 'resident' && issue.createdBy?._id === user.id);

  const canChangeStatus = user?.role === 'admin' || user?.role === 'authority';

  const handleEdit = () => {
    setEditData({
      title: issue.title,
      description: issue.description,
      priority: issue.priority
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await onUpdate(issue._id, editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating issue:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      title: issue.title,
      description: issue.description,
      priority: issue.priority
    });
  };

  const handleStatusChange = async (newStatus) => {
    setIsSubmitting(true);
    try {
      await onUpdate(issue._id, { status: newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsSubmitting(false);
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Low': return '#28a745';
      case 'Medium': return '#ffc107';
      case 'High': return '#fd7e14';
      case 'Critical': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #dee2e6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>
            {isEditing ? 'Edit Issue' : 'Issue Details'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6c757d'
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {isEditing ? (
            <div>
              <div className="form-group">
                <label htmlFor="editTitle">Title</label>
                <input
                  type="text"
                  id="editTitle"
                  className="form-control"
                  value={editData.title}
                  onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label htmlFor="editDescription">Description</label>
                <textarea
                  id="editDescription"
                  className="form-control"
                  rows="4"
                  value={editData.description}
                  onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label htmlFor="editPriority">Priority</label>
                <select
                  id="editPriority"
                  className="form-control"
                  value={editData.priority}
                  onChange={(e) => setEditData(prev => ({ ...prev, priority: e.target.value }))}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="btn btn-primary"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Issue Info */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, flex: 1 }}>{issue.title}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: getStatusColor(issue.status),
                      color: 'white',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}>
                      {issue.status}
                    </span>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: getPriorityColor(issue.priority),
                      color: 'white',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}>
                      {issue.priority}
                    </span>
                  </div>
                </div>

                <p style={{ color: '#666', marginBottom: '1rem' }}>{issue.description}</p>

                {/* Status Controls */}
                {canChangeStatus && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label>Change Status:</label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      {['Reported', 'In Progress', 'Resolved'].map(status => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(status)}
                          disabled={isSubmitting || issue.status === status}
                          className={`btn ${issue.status === status ? 'btn-primary' : 'btn-outline-primary'}`}
                          style={{ fontSize: '0.8rem' }}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Issue Details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <strong>Category:</strong> {issue.category?.name}
                  </div>
                  <div>
                    <strong>Created by:</strong> {issue.createdBy?.name} ({issue.createdBy?.role})
                  </div>
                  {issue.assignedTo && (
                    <div>
                      <strong>Assigned to:</strong> {issue.assignedTo?.name}
                    </div>
                  )}
                  <div>
                    <strong>Created:</strong> {new Date(issue.createdAt).toLocaleDateString()}
                  </div>
                  {issue.location && (
                    <div>
                      <strong>Location:</strong> {issue.location.latitude}, {issue.location.longitude}
                      <a
                        href={`https://www.google.com/maps?q=${issue.location.latitude},${issue.location.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ marginLeft: '0.5rem', color: '#007bff' }}
                      >
                        View on Map
                      </a>
                    </div>
                  )}
                </div>

                {/* Photo */}
                {issue.photoURL && (
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>Photo:</strong>
                    <div style={{ marginTop: '0.5rem' }}>
                      <img
                        src={issue.photoURL}
                        alt="Issue photo"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '300px',
                          objectFit: 'cover',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Comments */}
                {issue.comments && issue.comments.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>Comments ({issue.comments.length}):</strong>
                    <div style={{ marginTop: '0.5rem', maxHeight: '200px', overflow: 'auto' }}>
                      {issue.comments.map((comment, index) => (
                        <div key={index} style={{
                          padding: '0.5rem',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '4px',
                          marginBottom: '0.5rem'
                        }}>
                          <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>
                            {comment.user?.name} - {new Date(comment.createdAt).toLocaleString()}
                          </div>
                          <div>{comment.comment}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Comment */}
                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="newComment">Add Comment:</label>
                  <textarea
                    id="newComment"
                    className="form-control"
                    rows="3"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    style={{ marginTop: '0.5rem' }}
                  />
                  <button
                    onClick={() => {
                      // Handle comment submission
                      setNewComment('');
                    }}
                    disabled={!newComment.trim()}
                    className="btn btn-primary"
                    style={{ marginTop: '0.5rem' }}
                  >
                    Add Comment
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                {canEdit && (
                  <button
                    onClick={handleEdit}
                    className="btn btn-secondary"
                  >
                    Edit Issue
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="btn btn-primary"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IssueDetailModal;
