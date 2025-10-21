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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto shadow-2xl">
        {/* Header */}
        <div className="page-card-header">
          <div className="page-card-icon">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="page-card-title">
            {isEditing ? 'Edit Issue' : 'Issue Details'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isEditing ? (
            <div className="space-y-6">
              <div className="form-group">
                <label htmlFor="editTitle" className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Title
                </label>
                <input
                  type="text"
                  id="editTitle"
                  className="form-control"
                  value={editData.title}
                  onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label htmlFor="editDescription" className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Description
                </label>
                <textarea
                  id="editDescription"
                  className="form-control"
                  rows="4"
                  value={editData.description}
                  onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label htmlFor="editPriority" className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Priority
                </label>
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

              <div className="flex gap-4">
                <button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="btn btn-primary flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Issue Info */}
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <h3 className="flex-1 m-0">{issue.title}</h3>
                  <div className="flex gap-2">
                    <span className={`issue-badge status-${issue.status.toLowerCase().replace(' ', '-')}`}>
                      {issue.status}
                    </span>
                    <span className={`issue-badge priority-${issue.priority.toLowerCase()}`}>
                      {issue.priority}
                    </span>
                  </div>
                </div>

                <p className="issue-description">{issue.description}</p>

                {/* Status Controls */}
                {canChangeStatus && (
                  <div className="mb-4">
                    <label>Change Status:</label>
                    <div className="flex gap-2 mt-2">
                      {['Reported', 'In Progress', 'Resolved'].map(status => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(status)}
                          disabled={isSubmitting || issue.status === status}
                          className={`btn btn-sm ${issue.status === status ? 'btn-primary' : 'btn-outline'}`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Issue Details */}
                <div className="issue-details">
                  <div className="issue-detail">
                    <svg className="issue-detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span><strong>Category:</strong> {issue.category?.name}</span>
                  </div>
                  <div className="issue-detail">
                    <svg className="issue-detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span><strong>Created by:</strong> {issue.createdBy?.name} ({issue.createdBy?.role})</span>
                  </div>
                  {issue.assignedTo && (
                    <div className="issue-detail">
                      <svg className="issue-detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span><strong>Assigned to:</strong> {issue.assignedTo?.name}</span>
                    </div>
                  )}
                  <div className="issue-detail">
                    <svg className="issue-detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span><strong>Created:</strong> {new Date(issue.createdAt).toLocaleDateString()}</span>
                  </div>
                  {issue.location && (
                    <div className="issue-detail">
                      <svg className="issue-detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span><strong>Location:</strong> {issue.location.latitude}, {issue.location.longitude}</span>
                      <a
                        href={`https://www.google.com/maps?q=${issue.location.latitude},${issue.location.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 ml-2"
                      >
                        View on Map
                      </a>
                    </div>
                  )}
                </div>

                {/* Photo */}
                {issue.photoURL && (
                  <div className="issue-photo">
                    <strong>Photo:</strong>
                    <div className="mt-2">
                      <img
                        src={issue.photoURL}
                        alt="Issue"
                        className="max-w-full max-h-80 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  </div>
                )}

                {/* Comments */}
                {issue.comments && issue.comments.length > 0 && (
                  <div className="mb-4">
                    <strong>Comments ({issue.comments.length}):</strong>
                    <div className="mt-2 max-h-48 overflow-auto">
                      {issue.comments.map((comment, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg mb-2">
                          <div className="text-sm text-gray-600 mb-1">
                            {comment.user?.name} - {new Date(comment.createdAt).toLocaleString()}
                          </div>
                          <div className="text-gray-800">{comment.comment}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Comment */}
                <div className="mb-4">
                  <label htmlFor="newComment">Add Comment:</label>
                  <textarea
                    id="newComment"
                    className="form-control mt-2"
                    rows="3"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                  />
                  <button
                    onClick={() => {
                      // Handle comment submission
                      setNewComment('');
                    }}
                    disabled={!newComment.trim()}
                    className="btn btn-primary mt-2"
                  >
                    Add Comment
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 justify-end">
                {canEdit && (
                  <button
                    onClick={handleEdit}
                    className="btn btn-secondary flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Issue
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
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
