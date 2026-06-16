import React from 'react';
import { FiSmartphone } from 'react-icons/fi';

const MpesaButton = ({ onClick, loading, disabled }) => {
  return (
    <button 
      className="mpesa-btn"
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <>
          <span className="loader-small"></span>
          Processing...
        </>
      ) : (
        <>
          <FiSmartphone className="mpesa-icon" />
          Pay with M-Pesa
        </>
      )}
    </button>
  );
};

export default MpesaButton;