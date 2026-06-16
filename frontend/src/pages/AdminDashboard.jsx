import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import Loader from '../components/common/Loader';
import { adminService } from '../services';
import { 
  FiUsers, 
  FiCheckCircle, 
  FiXCircle, 
  FiClock, 
  FiDollarSign,
  FiTrendingUp,
  FiUserCheck,
  FiUserX,
  FiEye,
  FiCheck,
  FiX
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!user.is_staff) {
      window.location.href = '/discover';
      return;
    }
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, verificationsData] = await Promise.all([
        adminService.getStats(),
        adminService.getPendingVerifications()
      ]);
      setStats(statsData);
      setVerifications(verificationsData);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationAction = async (verificationId, action) => {
    setProcessing(verificationId);
    try {
      await adminService.processVerification(verificationId, action);
      toast.success(`Verification ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      loadDashboardData();
    } catch (error) {
      toast.error('Failed to process verification');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="admin-page">
          <Loader />
        </div>
      </>
    );
  }

  if (!user.is_staff) {
    return null;
  }

  const statCards = [
    { 
      icon: FiUsers, 
      label: 'Total Users', 
      value: stats?.total_users || 0,
      color: 'blue'
    },
    { 
      icon: FiUserCheck, 
      label: 'Verified Users', 
      value: stats?.verified_users || 0,
      color: 'green'
    },
    { 
      icon: FiTrendingUp, 
      label: 'Premium Users', 
      value: stats?.premium_users || 0,
      color: 'purple'
    },
    { 
      icon: FiDollarSign, 
      label: 'Revenue (KES)', 
      value: stats?.revenue || 0,
      color: 'orange'
    },
  ];

  return (
    <>
      <Navbar />
      <div className="admin-page">
        <div className="admin-container">
          <div className="admin-header">
            <h1>Admin Dashboard</h1>
            <p>Manage your platform</p>
          </div>

          {/* Stats */}
          <div className="admin-stats">
            {statCards.map((stat, index) => (
              <div key={index} className={`stat-card stat-${stat.color}`}>
                <div className="stat-icon">
                  <stat.icon />
                </div>
                <div className="stat-info">
                  <h3>{stat.value}</h3>
                  <p>{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="admin-tabs">
            <button 
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`tab-btn ${activeTab === 'verifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('verifications')}
            >
              Verifications ({verifications.length})
            </button>
          </div>

          {/* Tab Content */}
          <div className="admin-content">
            {activeTab === 'verifications' && (
              <div className="verifications-section">
                <h2>Pending Verifications</h2>
                {verifications.length === 0 ? (
                  <div className="empty-state">
                    <FiCheckCircle size={48} />
                    <p>No pending verifications</p>
                  </div>
                ) : (
                  <div className="verifications-list">
                    {verifications.map((verification) => (
                      <div key={verification.id} className="verification-item">
                        <div className="verification-user">
                          <div className="user-avatar">
                            {verification.user.username?.[0]?.toUpperCase()}
                          </div>
                          <div className="user-info">
                            <h4>{verification.user.username}</h4>
                            <p>{verification.document_type}</p>
                            <span className="submitted-date">
                              Submitted {new Date(verification.submitted_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="verification-documents">
                          <div className="doc-preview">
                            <img 
                              src={verification.document_front} 
                              alt="Document Front"
                              className="doc-image"
                            />
                            <span className="doc-label">Front</span>
                          </div>
                          {verification.document_back && (
                            <div className="doc-preview">
                              <img 
                                src={verification.document_back} 
                                alt="Document Back"
                                className="doc-image"
                              />
                              <span className="doc-label">Back</span>
                            </div>
                          )}
                          <div className="doc-preview">
                            <img 
                              src={verification.selfie} 
                              alt="Selfie"
                              className="doc-image"
                            />
                            <span className="doc-label">Selfie</span>
                          </div>
                        </div>

                        <div className="verification-actions">
                          <button 
                            className="btn-approve"
                            onClick={() => handleVerificationAction(verification.id, 'approve')}
                            disabled={processing === verification.id}
                          >
                            {processing === verification.id ? (
                              <Loader size="small" />
                            ) : (
                              <>
                                <FiCheck /> Approve
                              </>
                            )}
                          </button>
                          <button 
                            className="btn-reject"
                            onClick={() => {
                              const notes = prompt('Reason for rejection:');
                              if (notes !== null) {
                                handleVerificationAction(verification.id, 'reject');
                              }
                            }}
                            disabled={processing === verification.id}
                          >
                            {processing === verification.id ? (
                              <Loader size="small" />
                            ) : (
                              <>
                                <FiX /> Reject
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'overview' && (
              <div className="overview-section">
                <div className="overview-grid">
                  <div className="overview-card">
                    <h3>Recent Activity</h3>
                    <div className="activity-list">
                      <div className="activity-item">
                        <FiUserCheck className="activity-icon" />
                        <div className="activity-info">
                          <p>New user registered</p>
                          <span>2 minutes ago</span>
                        </div>
                      </div>
                      <div className="activity-item">
                        <FiCheckCircle className="activity-icon" />
                        <div className="activity-info">
                          <p>User verification approved</p>
                          <span>15 minutes ago</span>
                        </div>
                      </div>
                      <div className="activity-item">
                        <FiDollarSign className="activity-icon" />
                        <div className="activity-info">
                          <p>New subscription purchased</p>
                          <span>1 hour ago</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="overview-card">
                    <h3>Quick Actions</h3>
                    <div className="quick-actions">
                      <button className="quick-action-btn">
                        <FiUsers /> View All Users
                      </button>
                      <button className="quick-action-btn">
                        <FiEye /> View Reports
                      </button>
                      <button className="quick-action-btn">
                        <FiDollarSign /> View Revenue
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;