import React from 'react';
import { FiCheckCircle } from 'react-icons/fi';

const VerificationBadge = ({ className }) => {
  return (
    <div className={`verification-badge ${className || ''}`}>
      <FiCheckCircle />
      <span>Verified</span>
    </div>
  );
};

export default VerificationBadge;