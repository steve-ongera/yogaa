import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePayment } from '../context/PaymentContext';
import { paymentService } from '../services';
import SubscriptionCard from '../components/payment/SubscriptionCard';
import PaymentModal from '../components/payment/PaymentModal';
import Loader from '../components/common/Loader';
import Navbar from '../components/common/Navbar';
import { FiCheckCircle, FiStar, FiAward } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Subscription = () => {
  const { user, updateUser } = useAuth();
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);

  useEffect(() => {
    loadTiers();
  }, []);

  const loadTiers = async () => {
    try {
      const data = await paymentService.getSubscriptionTiers();
      setTiers(data);
    } catch (error) {
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = (tier) => {
    setSelectedTier(tier);
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    // Refresh user data
    updateUser({ subscription_tier: selectedTier.id });
    toast.success(`You are now on the ${selectedTier.name} plan!`);
    setShowPayment(false);
    loadTiers();
  };

  const features = {
    free: ['10 swipes per day', 'Basic profile', '1 photo'],
    premium: ['50 swipes per day', 'Unlimited chat', '6 photos', 'See who liked you'],
    gold: ['100 swipes per day', 'Unlimited chat', '10 photos', 'See who liked you', 
           'Profile boost', 'Verification badge'],
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="subscription-container">
          <Loader />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="subscription-container">
        <div className="subscription-header">
          <h1>Choose Your Plan</h1>
          <p>Upgrade to get the most out of LoveConnect</p>
        </div>

        <div className="subscription-tiers">
          {tiers.map((tier) => (
            <SubscriptionCard
              key={tier.id}
              tier={tier}
              features={features[tier.id] || []}
              isCurrent={tier.is_current}
              onSubscribe={handleSubscribe}
            />
          ))}
        </div>

        <div className="subscription-footer">
          <h3>All plans include:</h3>
          <div className="benefits">
            <div className="benefit">
              <FiCheckCircle className="benefit-icon" />
              <span>Secure messaging</span>
            </div>
            <div className="benefit">
              <FiCheckCircle className="benefit-icon" />
              <span>Privacy controls</span>
            </div>
            <div className="benefit">
              <FiCheckCircle className="benefit-icon" />
              <span>24/7 support</span>
            </div>
          </div>
        </div>
      </div>

      {showPayment && selectedTier && (
        <PaymentModal
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          transactionType="SUBSCRIPTION"
          subscriptionTier={selectedTier.id}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
};

export default Subscription;