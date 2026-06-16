import React, { useState } from 'react';
import { FiTrash2, FiStar, FiCamera } from 'react-icons/fi';
import Loader from '../common/Loader';

const ProfileGallery = ({ images, onDelete, loading }) => {
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async (imageId) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      setDeleting(imageId);
      await onDelete(imageId);
      setDeleting(null);
    }
  };

  if (!images || images.length === 0) {
    return (
      <div className="gallery-empty">
        <FiCamera size={48} />
        <p>No photos yet</p>
        <span>Add photos to increase your matches</span>
      </div>
    );
  }

  return (
    <div className="gallery-grid">
      {images.map((image) => (
        <div key={image.id} className="gallery-item">
          <img src={image.image} alt="Profile" />
          {image.is_primary && (
            <div className="primary-badge">
              <FiStar /> Primary
            </div>
          )}
          <button
            className="delete-image-btn"
            onClick={() => handleDelete(image.id)}
            disabled={deleting === image.id}
          >
            {deleting === image.id ? (
              <Loader size="small" />
            ) : (
              <FiTrash2 />
            )}
          </button>
        </div>
      ))}
    </div>
  );
};

export default ProfileGallery;