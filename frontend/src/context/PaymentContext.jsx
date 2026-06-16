import React, { createContext, useState, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { paymentService } from '../services';
import toast from 'react-hot-toast';

const PaymentContext = createContext();

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};

export const PaymentProvider = ({ children }) => {
  const { user, updateUser } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(false);

  const initiatePayment = useCallback(async (paymentData) => {
    setProcessing(true);
    try {
      const result = await paymentService.initiatePayment(paymentData);
      toast.success('Payment initiated. Please check your phone.');
      
      // Add transaction to list
      setTransactions(prev => [result.transaction, ...prev]);
      
      return { success: true, transaction: result.transaction };
    } catch (error) {
      const message = error.response?.data?.error || 'Payment failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setProcessing(false);
    }
  }, []);

  const checkPaymentStatus = useCallback(async (transactionId) => {
    try {
      const status = await paymentService.checkPaymentStatus(transactionId);
      
      // Update transaction in list
      setTransactions(prev => 
        prev.map(t => 
          t.id === transactionId ? { ...t, status: status.status } : t
        )
      );

      if (status.status === 'COMPLETED') {
        toast.success('Payment completed successfully!');
        // Refresh user data
        if (updateUser) {
          await updateUser({ subscription_tier: status.subscription_tier });
        }
      }

      return status;
    } catch (error) {
      console.error('Failed to check payment status:', error);
      return null;
    }
  }, [updateUser]);

  const getSubscriptionTiers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await paymentService.getSubscriptionTiers();
      setTiers(data);
      return data;
    } catch (error) {
      console.error('Failed to load subscription tiers:', error);
      toast.error('Failed to load subscription plans');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getTransactionHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await paymentService.getTransactionHistory();
      setTransactions(data);
      return data;
    } catch (error) {
      console.error('Failed to load transactions:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getBoostStatus = useCallback(async () => {
    try {
      const data = await paymentService.getBoostStatus();
      return data;
    } catch (error) {
      console.error('Failed to get boost status:', error);
      return null;
    }
  }, []);

  const purchaseBoost = useCallback(async (phoneNumber) => {
    setProcessing(true);
    try {
      const result = await paymentService.purchaseBoost(phoneNumber);
      toast.success('Boost purchase initiated. Please check your phone.');
      return { success: true, transaction: result.transaction };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to purchase boost';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setProcessing(false);
    }
  }, []);

  const value = {
    processing,
    loading,
    transactions,
    tiers,
    initiatePayment,
    checkPaymentStatus,
    getSubscriptionTiers,
    getTransactionHistory,
    getBoostStatus,
    purchaseBoost,
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};