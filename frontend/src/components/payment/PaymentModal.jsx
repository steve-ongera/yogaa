import React, { useState } from 'react';
import { usePayment } from '../../context/PaymentContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { FiX, FiCreditCard, FiSmartphone } from 'react-icons/fi';
import MpesaButton from './MpesaButton';

const PaymentModal = ({ isOpen, onClose, transactionType, subscriptionTier }) => {
  const { user } = useAuth();
  const { initiatePayment, processing } = usePayment();
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');

  const handleSubmit = async () => {
    if (!phoneNumber) {
      toast.error('Please enter your phone number');
      return;
    }

    const result = await initiatePayment({
      transaction_type: transactionType,
      subscription_tier: subscriptionTier,
      phone_number: phoneNumber,
    });

    if (result.success) {
      toast.success('Payment initiated. Please check your phone.');
      onClose();
    } else {
      toast.error(result.message || 'Payment failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Complete Payment</h2>
          <button className="close-btn" onClick={onClose}>
            <FiX size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="payment-details">
            <h3>{transactionType === 'SUBSCRIPTION' ? 'Subscription' : 'Boost'}</h3>
            {subscriptionTier && (
              <div className="tier-info">
                <span>{subscriptionTier.toUpperCase()} Plan</span>
                <span className="price">
                  {transactionType === 'SUBSCRIPTION' 
                    ? 'KES 500' 
                    : 'KES 200'}
                </span>
              </div>
            )}
          </div>

          <div className="payment-method">
            <div className="method-header">
              <FiSmartphone size={24} />
              <span>M-Pesa Payment</span>
            </div>
            
            <p className="method-description">
              You will receive a prompt on your phone to complete the payment.
            </p>

            <div className="phone-input">
              <label>Phone Number</label>
              <input
                type="tel"
                placeholder="e.g., 0712345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={processing}
              />
              <span className="input-hint">Enter the phone number registered with M-Pesa</span>
            </div>
          </div>

          <div className="payment-actions">
            <button 
              className="btn-secondary" 
              onClick={onClose}
              disabled={processing}
            >
              Cancel
            </button>
            <MpesaButton 
              onClick={handleSubmit} 
              loading={processing}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;