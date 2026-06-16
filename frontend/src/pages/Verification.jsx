import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import Loader from '../components/common/Loader';
import { verificationService } from '../services';
import { FiUpload, FiCheckCircle, FiXCircle, FiClock, FiAward } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Verification = () => {
  const { user, updateUser } = useAuth();
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    document_type: 'ID',
    document_front: null,
    document_back: null,
    selfie: null,
  });
  const [previews, setPreviews] = useState({
    document_front: null,
    document_back: null,
    selfie: null,
  });

  useEffect(() => {
    loadVerificationStatus();
  }, []);

  const loadVerificationStatus = async () => {
    try {
      const data = await verificationService.getStatus();
      setVerification(data);
    } catch (error) {
      // No verification found or error
      setVerification(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (field, file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
      setFormData(prev => ({ ...prev, [field]: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.document_front || !formData.selfie) {
      toast.error('Please upload required documents');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('document_type', formData.document_type);
      data.append('document_front', formData.document_front);
      if (formData.document_back) {
        data.append('document_back', formData.document_back);
      }
      data.append('selfie', formData.selfie);

      const result = await verificationService.submit(data);
      setVerification(result);
      toast.success('Verification submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit verification');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusDisplay = () => {
    if (!verification) return null;

    switch (verification.status) {
      case 'PENDING':
        return {
          icon: <FiClock className="status-icon pending" />,
          text: 'Pending Review',
          color: 'pending',
          message: 'Your verification is being reviewed by our team. This usually takes 24-48 hours.'
        };
      case 'APPROVED':
        return {
          icon: <FiCheckCircle className="status-icon approved" />,
          text: 'Verified',
          color: 'approved',
          message: 'Congratulations! Your profile is now verified.'
        };
      case 'REJECTED':
        return {
          icon: <FiXCircle className="status-icon rejected" />,
          text: 'Rejected',
          color: 'rejected',
          message: `Your verification was rejected. Reason: ${verification.admin_notes || 'Please submit new documents.'}`
        };
      default:
        return null;
    }
  };

  const status = getStatusDisplay();

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="verification-page">
          <Loader />
        </div>
      </>
    );
  }

  if (verification && verification.status === 'APPROVED') {
    return (
      <>
        <Navbar />
        <div className="verification-page">
          <div className="verification-container">
            <div className="verification-success">
              <div className="success-icon">
                <FiAward size={64} />
              </div>
              <h1>You're Verified! 🎉</h1>
              <p>Your profile has been verified. You now have a verification badge.</p>
              <div className="verification-details">
                <div className="detail-item">
                  <span className="detail-label">Document Type</span>
                  <span className="detail-value">{verification.document_type}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Verified On</span>
                  <span className="detail-value">
                    {new Date(verification.reviewed_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button className="btn-primary" onClick={() => window.location.href = '/profile'}>
                Go to Profile
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="verification-page">
        <div className="verification-container">
          <div className="verification-header">
            <h1>Profile Verification</h1>
            <p>Verify your identity to build trust and increase your matches</p>
          </div>

          {status && (
            <div className={`verification-status status-${status.color}`}>
              {status.icon}
              <div className="status-info">
                <h3>{status.text}</h3>
                <p>{status.message}</p>
              </div>
            </div>
          )}

          {(!verification || verification.status === 'REJECTED') && (
            <form onSubmit={handleSubmit} className="verification-form">
              <div className="form-group">
                <label>Document Type</label>
                <select
                  value={formData.document_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, document_type: e.target.value }))}
                  disabled={submitting}
                >
                  <option value="ID">National ID</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="DRIVER">Driver's License</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group file-upload">
                  <label>Front of Document *</label>
                  <div className="upload-area">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange('document_front', e.target.files[0])}
                      disabled={submitting}
                      required
                    />
                    {previews.document_front ? (
                      <img src={previews.document_front} alt="Document Front" />
                    ) : (
                      <div className="upload-placeholder">
                        <FiUpload size={32} />
                        <p>Upload front side</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group file-upload">
                  <label>Back of Document (Optional)</label>
                  <div className="upload-area">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange('document_back', e.target.files[0])}
                      disabled={submitting}
                    />
                    {previews.document_back ? (
                      <img src={previews.document_back} alt="Document Back" />
                    ) : (
                      <div className="upload-placeholder">
                        <FiUpload size={32} />
                        <p>Upload back side</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-group file-upload">
                <label>Selfie with Document *</label>
                <div className="upload-area">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('selfie', e.target.files[0])}
                    disabled={submitting}
                    required
                  />
                  {previews.selfie ? (
                    <img src={previews.selfie} alt="Selfie" />
                  ) : (
                    <div className="upload-placeholder">
                      <FiUpload size={32} />
                      <p>Upload selfie holding your document</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="verification-info">
                <h4>Why verify?</h4>
                <ul>
                  <li>✓ Get a verification badge on your profile</li>
                  <li>✓ Increase trust and credibility</li>
                  <li>✓ Get more matches</li>
                  <li>✓ Access to exclusive features</li>
                </ul>
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? <Loader size="small" /> : 'Submit Verification'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default Verification;