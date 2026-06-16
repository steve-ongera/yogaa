import React from 'react';
import { FiCheck, FiX } from 'react-icons/fi';

const SubscriptionCard = ({ tier, features, isCurrent, onSubscribe }) => {
  const isPopular = tier.id === 'premium';
  const isFree = tier.id === 'free';

  return (
    <div className={`subscription-card ${isPopular ? 'popular' : ''} ${isCurrent ? 'current' : ''}`}>
      {isPopular && <span className="card-badge">Popular</span>}
      {isCurrent && <span className="card-badge">Current Plan</span>}
      
      <h3 className="plan-name">{tier.name}</h3>
      <p className="plan-description">
        {isFree ? 'Basic features to get started' : 'Unlock premium features'}
      </p>
      
      <div className="plan-price">
        {tier.price === 0 ? 'Free' : `KES ${tier.price}`}
        {tier.price > 0 && <span>/month</span>}
      </div>
      
      <ul className="plan-features">
        {features.map((feature, index) => (
          <li key={index}>
            <span className="feature-icon">
              <FiCheck size={16} />
            </span>
            <span className="feature-text">{feature}</span>
          </li>
        ))}
        {tier.id !== 'gold' && (
          <li>
            <span className="feature-icon disabled">
              <FiX size={16} />
            </span>
            <span className="feature-text disabled">Verification badge</span>
          </li>
        )}
      </ul>
      
      <div className="plan-action">
        {isCurrent ? (
          <button className="btn-secondary" disabled>
            Current Plan
          </button>
        ) : (
          <button 
            className={isFree ? 'btn-secondary' : 'btn-primary'}
            onClick={() => onSubscribe(tier)}
          >
            {isFree ? 'Downgrade' : 'Subscribe'}
          </button>
        )}
      </div>
    </div>
  );
};

export default SubscriptionCard;