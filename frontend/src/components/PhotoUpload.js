import React, { useState, useRef } from 'react';

const PhotoUpload = ({ 
  onPhotoChange, 
  existingPhoto = null,
  maxSize = 5 * 1024 * 1024, // 5MB
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(existingPhoto || null);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    if (!acceptedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
      return false;
    }

    if (file.size > maxSize) {
      setError(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
      return false;
    }

    setError('');
    return true;
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    if (validateFile(file)) {
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      onPhotoChange && onPhotoChange(file);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removePhoto = () => {
    setSelectedFile(null);
    setPreview(null);
    setError('');
    onPhotoChange && onPhotoChange(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
        Photo (Optional)
      </label>
      
      <div
        style={{
          border: `2px dashed ${isDragOver ? '#007bff' : '#dee2e6'}`,
          borderRadius: '8px',
          padding: '1rem',
          textAlign: 'center',
          backgroundColor: isDragOver ? '#f8f9fa' : '#fff',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={triggerFileInput}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
        
        {preview ? (
          <div>
            <img
              src={preview}
              alt="Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '200px',
                objectFit: 'cover',
                borderRadius: '4px',
                marginBottom: '0.5rem'
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerFileInput();
                }}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem' }}
              >
                Change Photo
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removePhoto();
                }}
                className="btn btn-danger"
                style={{ fontSize: '0.8rem' }}
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
            <p style={{ margin: '0 0 0.5rem 0', color: '#666' }}>
              {isDragOver ? 'Drop your photo here' : 'Click to upload or drag and drop'}
            </p>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#999' }}>
              PNG, JPG, WebP, GIF up to {Math.round(maxSize / 1024 / 1024)}MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <div style={{ 
          color: '#dc3545', 
          fontSize: '0.8rem', 
          marginTop: '0.5rem',
          padding: '0.5rem',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}

      {selectedFile && (
        <div style={{ 
          color: '#28a745', 
          fontSize: '0.8rem', 
          marginTop: '0.5rem',
          padding: '0.5rem',
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '4px'
        }}>
          ✅ Photo selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;
