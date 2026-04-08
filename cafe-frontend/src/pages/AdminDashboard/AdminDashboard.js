import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [owners, setOwners] = useState([]);
  const [verifiedUsers, setVerifiedUsers] = useState([]);
  const [verifiedOwners, setVerifiedOwners] = useState([]);
  const [showVerified, setShowVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    pendingUsers: 0,
    pendingOwners: 0,
    totalUsers: 0,
    totalOwners: 0,
    activeUsers: 0,
    activeOwners: 0,
    totalRegistrations: 0
  });
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState('personal');
  const [processingId, setProcessingId] = useState(null);
  const [dateRange, setDateRange] = useState('week');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPendingUsers(),
        fetchPendingOwners(),
        fetchVerifiedUsers(),
        fetchVerifiedOwners(),
        fetchStats()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingUsers = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/admin/pending-users?type=user');
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching pending users:', err);
      setError('Unable to fetch pending users');
    }
  };

  const fetchPendingOwners = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/admin/pending-users?type=owner');
      const data = await response.json();
      
      if (data.success) {
        setOwners(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching pending owners:', err);
    }
  };

  const fetchVerifiedUsers = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/admin/verified-users?type=user');
      const data = await response.json();
      
      if (data.success) {
        setVerifiedUsers(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching verified users:', err);
    }
  };

  const fetchVerifiedOwners = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/admin/verified-users?type=owner');
      const data = await response.json();
      
      if (data.success) {
        setVerifiedOwners(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching verified owners:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/admin/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(prev => ({ 
          ...prev, 
          ...data.data
        }));
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleApproveUser = async (userId, type = 'user') => {
    setProcessingId(userId);
    try {
      setError('');
      setSuccess('');
      
      const response = await fetch(`http://localhost:8080/api/admin/approve-user/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`User approved! OTP sent to their email.`);
        
        // Refresh data
        await fetchAllData();
        
        setShowDetails(false);
        setSelectedUser(null);
        
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(data.message || 'Failed to approve user');
      }
    } catch (err) {
      console.error('Error approving user:', err);
      setError('Unable to connect to server');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectUser = async (userId, type = 'user') => {
    if (!window.confirm('Are you sure you want to reject this user? This action cannot be undone.')) {
      return;
    }

    setProcessingId(userId);
    try {
      setError('');
      setSuccess('');
      
      const response = await fetch(`http://localhost:8080/api/admin/reject-user/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, reason: 'Application rejected by admin' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('User rejected and removed');
        
        await fetchAllData();
        
        setShowDetails(false);
        setSelectedUser(null);
        
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(data.message || 'Failed to reject user');
      }
    } catch (err) {
      console.error('Error rejecting user:', err);
      setError('Unable to connect to server');
    } finally {
      setProcessingId(null);
    }
  };

  const viewUserDetails = (user) => {
    setSelectedUser(user);
    setActiveDetailTab('personal');
    setShowDetails(true);
  };

  const viewDocument = (document) => {
    setSelectedDocument(document);
  };

  const closeDocument = () => {
    setSelectedDocument(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getDocumentIcon = (fileType) => {
    if (fileType?.includes('pdf')) return 'fa-file-pdf';
    if (fileType?.includes('image')) return 'fa-file-image';
    if (fileType?.includes('word')) return 'fa-file-word';
    if (fileType?.includes('excel')) return 'fa-file-excel';
    return 'fa-file';
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (active) => {
    return active ? 
      <span className="ad-status-badge ad-status-approved"><i className="fas fa-check-circle"></i> Verified</span> :
      <span className="ad-status-badge ad-status-pending"><i className="fas fa-clock"></i> Pending</span>;
  };

  // Get recent items from actual data
  const getRecentUsers = () => {
    return [...users, ...verifiedUsers]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);
  };

  const getRecentOwners = () => {
    return [...owners, ...verifiedOwners]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);
  };

  // Filter users based on active tab and search
  const getFilteredUsers = () => {
    let source = [];
    if (activeTab === 'users') {
      source = showVerified ? verifiedUsers : users;
    } else if (activeTab === 'owners') {
      source = showVerified ? verifiedOwners : owners;
    } else {
      return [];
    }

    return source.filter(user => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
      return (
        (user.name?.toLowerCase() || '').includes(searchLower) ||
        (user.email?.toLowerCase() || '').includes(searchLower) ||
        fullName.includes(searchLower)
      );
    });
  };

  // Generate chart data from actual user data
  const getChartData = () => {
    const now = new Date();
    const labels = [];
    const userData = [];
    const ownerData = [];

    // Combine all users for chart data
    const allUsers = [...users, ...verifiedUsers];
    const allOwners = [...owners, ...verifiedOwners];

    if (dateRange === 'week') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-IN', { weekday: 'short' }));
        
        // Count users created on this day
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        
        const userCount = allUsers.filter(u => {
          const created = new Date(u.createdAt);
          return created >= dayStart && created <= dayEnd;
        }).length;
        
        const ownerCount = allOwners.filter(o => {
          const created = new Date(o.createdAt);
          return created >= dayStart && created <= dayEnd;
        }).length;
        
        userData.push(userCount);
        ownerData.push(ownerCount);
      }
    } else if (dateRange === 'month') {
      // Last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        labels.push(`Week ${4-i}`);
        
        const userCount = allUsers.filter(u => {
          const created = new Date(u.createdAt);
          return created >= weekStart && created <= weekEnd;
        }).length;
        
        const ownerCount = allOwners.filter(o => {
          const created = new Date(o.createdAt);
          return created >= weekStart && created <= weekEnd;
        }).length;
        
        userData.push(userCount);
        ownerData.push(ownerCount);
      }
    } else {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(date.toLocaleDateString('en-IN', { month: 'short' }));
        
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
        
        const userCount = allUsers.filter(u => {
          const created = new Date(u.createdAt);
          return created >= monthStart && created <= monthEnd;
        }).length;
        
        const ownerCount = allOwners.filter(o => {
          const created = new Date(o.createdAt);
          return created >= monthStart && created <= monthEnd;
        }).length;
        
        userData.push(userCount);
        ownerData.push(ownerCount);
      }
    }

    return { labels, userData, ownerData };
  };

  const chartData = getChartData();
  const maxValue = Math.max(...chartData.userData, ...chartData.ownerData, 1);
  const recentUsersList = getRecentUsers();
  const recentOwnersList = getRecentOwners();
  const filteredUsers = getFilteredUsers();

  return (
    <div className="ad-admin-dashboard">
      {/* Sidebar */}
      <div className="ad-admin-sidebar">
        <div className="ad-sidebar-header">
          <h2><i className="fas fa-coffee"></i> <span>Brew & Book</span></h2>
          <p>Management Dashboard</p>
        </div>
        
        <div className="ad-sidebar-menu">
          <div 
            className={`ad-sidebar-item ${activeTab === 'dashboard' ? 'ad-active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <i className="fas fa-tachometer-alt"></i>
            <span>Dashboard</span>
          </div>
          
          <div 
            className={`ad-sidebar-item ${activeTab === 'users' ? 'ad-active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <i className="fas fa-users"></i>
            <span>Users</span>
            {stats.pendingUsers > 0 && !showVerified && (
              <span className="ad-sidebar-badge">{stats.pendingUsers}</span>
            )}
          </div>
          
          <div 
            className={`ad-sidebar-item ${activeTab === 'owners' ? 'ad-active' : ''}`}
            onClick={() => setActiveTab('owners')}
          >
            <i className="fas fa-store"></i>
            <span>Cafe Owners</span>
            {stats.pendingOwners > 0 && !showVerified && (
              <span className="ad-sidebar-badge">{stats.pendingOwners}</span>
            )}
          </div>
          
          <div 
            className={`ad-sidebar-item ${activeTab === 'charts' ? 'ad-active' : ''}`}
            onClick={() => setActiveTab('charts')}
          >
            <i className="fas fa-chart-pie"></i>
            <span>Analytics</span>
          </div>
        </div>
        
        <div className="ad-sidebar-footer">
          <button onClick={() => navigate('/')}>
            <i className="fas fa-home"></i> <span>Back to Home</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ad-admin-main">
        {/* Header */}
        <div className="ad-admin-header">
          <div className="ad-header-content">
            <h1>
              <i className="fas fa-shield-alt"></i>
              {activeTab === 'dashboard' && 'Dashboard Overview'}
              {activeTab === 'users' && (showVerified ? 'Verified Users' : 'Pending Users')}
              {activeTab === 'owners' && (showVerified ? 'Verified Cafe Owners' : 'Pending Cafe Owners')}
              {activeTab === 'charts' && 'Analytics & Reports'}
            </h1>
            <p>
              {activeTab === 'dashboard' && 'Welcome back! Here\'s what\'s happening today'}
              {activeTab === 'users' && (showVerified ? 'View all approved users' : 'Review and verify pending user registrations')}
              {activeTab === 'owners' && (showVerified ? 'View all approved cafe owners' : 'Review and verify pending cafe owner registrations')}
              {activeTab === 'charts' && 'View registration trends and analytics'}
            </p>
          </div>
          <div className="ad-header-stats">
            {(activeTab === 'users' || activeTab === 'owners') && (
              <button 
                className={`ad-toggle-view ${showVerified ? 'ad-verified' : 'ad-pending'}`}
                onClick={() => setShowVerified(!showVerified)}
              >
                <i className={`fas fa-${showVerified ? 'clock' : 'check-circle'}`}></i>
                {showVerified ? 'Show Pending' : 'Show Verified'}
              </button>
              
            )}
            <div className="ad-header-stat">
              <span>{stats.pendingUsers + stats.pendingOwners}</span>
              <label>Pending</label>
            </div>
            <div className="ad-header-stat">
              <span>{stats.activeUsers + stats.activeOwners}</span>
              <label>Verified</label>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="ad-alert ad-alert-error">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {success && (
          <div className="ad-alert ad-alert-success">
            <i className="fas fa-check-circle"></i> {success}
          </div>
        )}

        {/* DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <>
            {/* Quick Stats */}
            <div className="ad-stats-grid">
              <div className="ad-stat-card">
                <div className="ad-stat-icon">
                  <i className="fas fa-users"></i>
                </div>
                <div className="ad-stat-details">
                  <h3>Total Users</h3>
                  <span>{stats.totalUsers}</span>
                  <small>Registered users</small>
                </div>
              </div>
              
              <div className="ad-stat-card">
                <div className="ad-stat-icon">
                  <i className="fas fa-store"></i>
                </div>
                <div className="ad-stat-details">
                  <h3>Total Owners</h3>
                  <span>{stats.totalOwners}</span>
                  <small>Cafe owners</small>
                </div>
              </div>
              
              <div className="ad-stat-card">
                <div className="ad-stat-icon">
                  <i className="fas fa-clock"></i>
                </div>
                <div className="ad-stat-details">
                  <h3>Pending</h3>
                  <span>{stats.pendingUsers + stats.pendingOwners}</span>
                  <small>Awaiting review</small>
                </div>
              </div>
              
              <div className="ad-stat-card">
                <div className="ad-stat-icon">
                  <i className="fas fa-check-circle"></i>
                </div>
                <div className="ad-stat-details">
                  <h3>Verified</h3>
                  <span>{stats.activeUsers + stats.activeOwners}</span>
                  <small>Approved users</small>
                </div>
              </div>
            </div>

            {/* Recent Activity - Two Column Layout */}
            <div className="ad-dashboard-grid">
              {/* Recent Users */}
              <div className="ad-dashboard-card">
                <div className="ad-card-header">
                  <h3><i className="fas fa-user-plus"></i> Recent Users</h3>
                  <button className="ad-view-all" onClick={() => { setActiveTab('users'); setShowVerified(false); }}>
                    View All <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
                <div className="ad-recent-list">
                  {recentUsersList.length > 0 ? (
                    recentUsersList.map(user => (
                      <div key={user.id} className="ad-recent-item">
                        <div className="ad-recent-avatar">
                          {getInitials(user.name || `${user.firstName} ${user.lastName}`)}
                        </div>
                        <div className="ad-recent-info">
                          <div className="ad-recent-name">
                            {user.name || `${user.firstName} ${user.lastName}`}
                            {getStatusBadge(user.active)}
                          </div>
                          <div className="ad-recent-meta">
                            <span><i className="fas fa-envelope"></i> {user.email}</span>
                            <span><i className="fas fa-clock"></i> {formatDate(user.createdAt)}</span>
                          </div>
                        </div>
                        <button 
                          className="ad-btn-icon"
                          onClick={() => viewUserDetails(user)}
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="ad-empty-state" style={{ padding: '20px' }}>
                      <p>No users yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Cafe Owners */}
              <div className="ad-dashboard-card">
                <div className="ad-card-header">
                  <h3><i className="fas fa-store-alt"></i> Recent Cafe Owners</h3>
                  <button className="ad-view-all" onClick={() => { setActiveTab('owners'); setShowVerified(false); }}>
                    View All <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
                <div className="ad-recent-list">
                  {recentOwnersList.length > 0 ? (
                    recentOwnersList.map(owner => (
                      <div key={owner.id} className="ad-recent-item">
                        <div className="ad-recent-avatar" style={{ background: '#8b4513' }}>
                          {getInitials(owner.name || `${owner.firstName} ${owner.lastName}`)}
                        </div>
                        <div className="ad-recent-info">
                          <div className="ad-recent-name">
                            {owner.name || `${owner.firstName} ${owner.lastName}`}
                            {getStatusBadge(owner.active)}
                          </div>
                          <div className="ad-recent-meta">
                            <span><i className="fas fa-envelope"></i> {owner.email}</span>
                            <span><i className="fas fa-clock"></i> {formatDate(owner.createdAt)}</span>
                          </div>
                        </div>
                        <button 
                          className="ad-btn-icon"
                          onClick={() => viewUserDetails(owner)}
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="ad-empty-state" style={{ padding: '20px' }}>
                      <p>No cafe owners yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mini Chart Preview */}
            <div className="ad-dashboard-card ad-chart-preview">
              <div className="ad-card-header">
                <h3><i className="fas fa-chart-line"></i> Registration Trends (Last 7 Days)</h3>
                <button className="ad-view-all" onClick={() => setActiveTab('charts')}>
                  View Full Analytics <i className="fas fa-chart-bar"></i>
                </button>
              </div>
              <div className="ad-mini-chart">
                {chartData.labels.map((label, index) => {
                  const userHeight = maxValue > 0 ? (chartData.userData[index] / maxValue) * 100 : 0;
                  const ownerHeight = maxValue > 0 ? (chartData.ownerData[index] / maxValue) * 100 : 0;
                  return (
                    <div key={label} className="ad-chart-bar-group">
                      <div className="ad-chart-bar-container">
                        <div 
                          className="ad-chart-bar ad-user-bar" 
                          style={{ height: `${userHeight}%` }}
                          title={`Users: ${chartData.userData[index]}`}
                        ></div>
                        <div 
                          className="ad-chart-bar ad-owner-bar" 
                          style={{ height: `${ownerHeight}%` }}
                          title={`Owners: ${chartData.ownerData[index]}`}
                        ></div>
                      </div>
                      <span className="ad-chart-label">{label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="ad-chart-legend">
                <span><span className="ad-legend-dot ad-user-dot"></span> Users</span>
                <span><span className="ad-legend-dot ad-owner-dot"></span> Cafe Owners</span>
              </div>
            </div>
          </>
        )}

        {/* USERS VIEW */}
        {activeTab === 'users' && (
          <div className="ad-admin-content">
            <div className="ad-content-header">
              <h2>
                <i className={`fas fa-${showVerified ? 'check-circle' : 'users'}`}></i>
                {showVerified ? `Verified Users (${verifiedUsers.length})` : `Pending Users (${users.length})`}
              </h2>
              <div className="ad-search-box">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="ad-loading">
                <div className="ad-loading-spinner"></div>
                <p>Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="ad-empty-state">
                <i className={`fas fa-${showVerified ? 'users' : 'check-circle'}`}></i>
                <h3>No {showVerified ? 'Verified' : 'Pending'} Users</h3>
                <p>All user registrations have been {showVerified ? 'approved' : 'reviewed'}.</p>
              </div>
            ) : (
              <div className="ad-users-grid">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="ad-user-card">
                    <div className="ad-user-header">
                      <div className="ad-user-avatar">
                        {getInitials(user.name || `${user.firstName} ${user.lastName}`)}
                      </div>
                      <div className="ad-user-info">
                        <h3>{user.name || `${user.firstName} ${user.lastName}`}</h3>
                        <p><i className="fas fa-envelope"></i> {user.email}</p>
                        <span className="ad-user-type">User</span>
                        {getStatusBadge(user.active)}
                      </div>
                    </div>
                    
                    <div className="ad-user-body">
                      <div className="ad-user-detail-item">
                        <i className="fas fa-calendar"></i>
                        <span>Registered: {formatDate(user.createdAt)}</span>
                      </div>
                      
                      {user.governmentDocuments && user.governmentDocuments.length > 0 && (
                        <div className="ad-user-detail-item">
                          <i className="fas fa-id-card"></i>
                          <div>
                            <strong>Documents:</strong>
                            <div style={{ marginTop: '5px' }}>
                              {user.governmentDocuments.map((doc, index) => (
                                <span 
                                  key={index} 
                                  className="ad-document-badge"
                                  onClick={() => viewDocument(doc)}
                                >
                                  <i className={`fas ${getDocumentIcon(doc.fileType)}`}></i>
                                  {doc.documentType}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {user.address && (
                        <div className="ad-user-detail-item">
                          <i className="fas fa-map-marker-alt"></i>
                          <span>{user.address.city}, {user.address.country}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="ad-user-footer">
                      <button 
                        className="ad-btn ad-btn-view"
                        onClick={() => viewUserDetails(user)}
                        disabled={processingId === user.id}
                      >
                        <i className="fas fa-eye"></i> View
                      </button>
                      {!showVerified && !user.active && (
                        <>
                          <button 
                            className="ad-btn ad-btn-approve"
                            onClick={() => handleApproveUser(user.id, 'user')}
                            disabled={processingId === user.id}
                          >
                            {processingId === user.id ? (
                              <><i className="fas fa-spinner fa-spin"></i> Processing...</>
                            ) : (
                              <><i className="fas fa-check"></i> Approve</>
                            )}
                          </button>
                          <button 
                            className="ad-btn ad-btn-reject"
                            onClick={() => handleRejectUser(user.id, 'user')}
                            disabled={processingId === user.id}
                          >
                            {processingId === user.id ? (
                              <><i className="fas fa-spinner fa-spin"></i> Processing...</>
                            ) : (
                              <><i className="fas fa-times"></i> Reject</>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* OWNERS VIEW */}
        {activeTab === 'owners' && (
          <div className="ad-admin-content">
            <div className="ad-content-header">
              <h2>
                <i className={`fas fa-${showVerified ? 'check-circle' : 'store'}`}></i>
                {showVerified ? `Verified Cafe Owners (${verifiedOwners.length})` : `Pending Cafe Owners (${owners.length})`}
              </h2>
              <div className="ad-search-box">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="ad-loading">
                <div className="ad-loading-spinner"></div>
                <p>Loading cafe owners...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="ad-empty-state">
                <i className={`fas fa-${showVerified ? 'store' : 'check-circle'}`}></i>
                <h3>No {showVerified ? 'Verified' : 'Pending'} Cafe Owners</h3>
                <p>All cafe owner registrations have been {showVerified ? 'approved' : 'reviewed'}.</p>
              </div>
            ) : (
              <div className="ad-users-grid">
                {filteredUsers.map((owner) => (
                  <div key={owner.id} className="ad-user-card">
                    <div className="ad-user-header">
                      <div className="ad-user-avatar" style={{ background: '#8b4513' }}>
                        {getInitials(owner.name || `${owner.firstName} ${owner.lastName}`)}
                      </div>
                      <div className="ad-user-info">
                        <h3>{owner.name || `${owner.firstName} ${owner.lastName}`}</h3>
                        <p><i className="fas fa-envelope"></i> {owner.email}</p>
                        <span className="ad-user-type">Cafe Owner</span>
                        {getStatusBadge(owner.active)}
                      </div>
                    </div>
                    
                    <div className="ad-user-body">
                      <div className="ad-user-detail-item">
                        <i className="fas fa-calendar"></i>
                        <span>Registered: {formatDate(owner.createdAt)}</span>
                      </div>
                      
                      {owner.governmentDocuments && owner.governmentDocuments.length > 0 && (
                        <div className="ad-user-detail-item">
                          <i className="fas fa-id-card"></i>
                          <div>
                            <strong>Documents:</strong>
                            <div style={{ marginTop: '5px' }}>
                              {owner.governmentDocuments.map((doc, index) => (
                                <span 
                                  key={index} 
                                  className="ad-document-badge"
                                  onClick={() => viewDocument(doc)}
                                >
                                  <i className={`fas ${getDocumentIcon(doc.fileType)}`}></i>
                                  {doc.documentType}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {owner.address && (
                        <div className="ad-user-detail-item">
                          <i className="fas fa-map-marker-alt"></i>
                          <span>{owner.address.city}, {owner.address.country}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="ad-user-footer">
                      <button 
                        className="ad-btn ad-btn-view"
                        onClick={() => viewUserDetails(owner)}
                        disabled={processingId === owner.id}
                      >
                        <i className="fas fa-eye"></i> View
                      </button>
                      {!showVerified && !owner.active && (
                        <>
                          <button 
                            className="ad-btn ad-btn-approve"
                            onClick={() => handleApproveUser(owner.id, 'owner')}
                            disabled={processingId === owner.id}
                          >
                            {processingId === owner.id ? (
                              <><i className="fas fa-spinner fa-spin"></i> Processing...</>
                            ) : (
                              <><i className="fas fa-check"></i> Approve</>
                            )}
                          </button>
                          <button 
                            className="ad-btn ad-btn-reject"
                            onClick={() => handleRejectUser(owner.id, 'owner')}
                            disabled={processingId === owner.id}
                          >
                            {processingId === owner.id ? (
                              <><i className="fas fa-spinner fa-spin"></i> Processing...</>
                            ) : (
                              <><i className="fas fa-times"></i> Reject</>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ANALYTICS VIEW */}
        {activeTab === 'charts' && (
          <div className="ad-admin-content">
            <div className="ad-content-header">
              <h2>
                <i className="fas fa-chart-pie"></i>
                Registration Analytics
              </h2>
              <div className="ad-date-range">
                <button 
                  className={`ad-range-btn ${dateRange === 'week' ? 'ad-active' : ''}`}
                  onClick={() => setDateRange('week')}
                >
                  Week
                </button>
                <button 
                  className={`ad-range-btn ${dateRange === 'month' ? 'ad-active' : ''}`}
                  onClick={() => setDateRange('month')}
                >
                  Month
                </button>
                <button 
                  className={`ad-range-btn ${dateRange === 'year' ? 'ad-active' : ''}`}
                  onClick={() => setDateRange('year')}
                >
                  Year
                </button>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="ad-stats-grid">
              <div className="ad-stat-card">
                <div className="ad-stat-icon">
                  <i className="fas fa-chart-bar"></i>
                </div>
                <div className="ad-stat-details">
                  <h3>Total Registrations</h3>
                  <span>{stats.totalRegistrations}</span>
                  <small>All time</small>
                </div>
              </div>
              
              <div className="ad-stat-card">
                <div className="ad-stat-icon">
                  <i className="fas fa-users"></i>
                </div>
                <div className="ad-stat-details">
                  <h3>Total Users</h3>
                  <span>{stats.totalUsers}</span>
                  <small>Customer accounts</small>
                </div>
              </div>
              
              <div className="ad-stat-card">
                <div className="ad-stat-icon">
                  <i className="fas fa-store"></i>
                </div>
                <div className="ad-stat-details">
                  <h3>Total Owners</h3>
                  <span>{stats.totalOwners}</span>
                  <small>Cafe owners</small>
                </div>
              </div>
            </div>

            {/* Main Chart */}
            <div className="ad-chart-container">
              <h3 className="ad-chart-title">
                <i className="fas fa-chart-line"></i>
                Registration Trends
              </h3>
              <div className="ad-main-chart">
                {chartData.labels.map((label, index) => {
                  const userHeight = maxValue > 0 ? (chartData.userData[index] / maxValue) * 100 : 0;
                  const ownerHeight = maxValue > 0 ? (chartData.ownerData[index] / maxValue) * 100 : 0;
                  return (
                    <div key={label} className="ad-chart-column">
                      <span className="ad-chart-value">{chartData.userData[index] + chartData.ownerData[index]}</span>
                      <div className="ad-chart-bars">
                        <div 
                          className="ad-chart-bar ad-user-bar" 
                          style={{ height: `${userHeight}%` }}
                          title={`Users: ${chartData.userData[index]}`}
                        ></div>
                        <div 
                          className="ad-chart-bar ad-owner-bar" 
                          style={{ height: `${ownerHeight}%` }}
                          title={`Owners: ${chartData.ownerData[index]}`}
                        ></div>
                      </div>
                      <div className="ad-chart-label">{label}</div>
                    </div>
                  );
                })}
              </div>
              <div className="ad-chart-legend">
                <span><span className="ad-legend-dot ad-user-dot"></span> Users</span>
                <span><span className="ad-legend-dot ad-owner-dot"></span> Cafe Owners</span>
              </div>
            </div>

            {/* Stats Breakdown */}
            <div className="ad-breakdown-grid">
              <div className="ad-breakdown-card">
                <h4><i className="fas fa-users"></i> User Statistics</h4>
                <div className="ad-breakdown-stats">
                  <div className="ad-breakdown-item">
                    <span>Total Users</span>
                    <strong>{stats.totalUsers}</strong>
                  </div>
                  <div className="ad-breakdown-item">
                    <span>Verified Users</span>
                    <strong>{stats.activeUsers}</strong>
                  </div>
                  <div className="ad-breakdown-item">
                    <span>Pending Users</span>
                    <strong>{stats.pendingUsers}</strong>
                  </div>
                </div>
              </div>

              <div className="ad-breakdown-card">
                <h4><i className="fas fa-store"></i> Cafe Owner Statistics</h4>
                <div className="ad-breakdown-stats">
                  <div className="ad-breakdown-item">
                    <span>Total Owners</span>
                    <strong>{stats.totalOwners}</strong>
                  </div>
                  <div className="ad-breakdown-item">
                    <span>Verified Owners</span>
                    <strong>{stats.activeOwners}</strong>
                  </div>
                  <div className="ad-breakdown-item">
                    <span>Pending Owners</span>
                    <strong>{stats.pendingOwners}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showDetails && selectedUser && (
        <div className="ad-modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="ad-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ad-modal-header">
              <h2>
                <i className="fas fa-user-circle"></i>
                User Details: {selectedUser.firstName} {selectedUser.lastName}
              </h2>
              <button className="ad-modal-close" onClick={() => setShowDetails(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="ad-modal-content">
              {/* Tabs */}
              <div className="ad-detail-tabs">
                <button 
                  className={`ad-tab ${activeDetailTab === 'personal' ? 'ad-active' : ''}`}
                  onClick={() => setActiveDetailTab('personal')}
                >
                  <i className="fas fa-user"></i> Personal
                </button>
                <button 
                  className={`ad-tab ${activeDetailTab === 'address' ? 'ad-active' : ''}`}
                  onClick={() => setActiveDetailTab('address')}
                >
                  <i className="fas fa-map-marker-alt"></i> Address
                </button>
                <button 
                  className={`ad-tab ${activeDetailTab === 'academic' ? 'ad-active' : ''}`}
                  onClick={() => setActiveDetailTab('academic')}
                >
                  <i className="fas fa-graduation-cap"></i> Academic
                </button>
                <button 
                  className={`ad-tab ${activeDetailTab === 'work' ? 'ad-active' : ''}`}
                  onClick={() => setActiveDetailTab('work')}
                >
                  <i className="fas fa-briefcase"></i> Work
                </button>
                <button 
                  className={`ad-tab ${activeDetailTab === 'documents' ? 'ad-active' : ''}`}
                  onClick={() => setActiveDetailTab('documents')}
                >
                  <i className="fas fa-id-card"></i> Documents
                </button>
              </div>

              {/* Personal Information Tab */}
              {activeDetailTab === 'personal' && (
                <div className="ad-detail-section">
                  <h3><i className="fas fa-user"></i> Personal Information</h3>
                  <div className="ad-detail-grid">
                    <div className="ad-detail-item">
                      <strong>Full Name</strong>
                      <span>{selectedUser.firstName} {selectedUser.lastName}</span>
                    </div>
                    <div className="ad-detail-item">
                      <strong>Email</strong>
                      <span>{selectedUser.email}</span>
                    </div>
                    <div className="ad-detail-item">
                      <strong>Date of Birth</strong>
                      <span>{formatDate(selectedUser.dateOfBirth)}</span>
                    </div>
                    <div className="ad-detail-item">
                      <strong>Gender</strong>
                      <span>{selectedUser.gender || 'Not specified'}</span>
                    </div>
                    <div className="ad-detail-item">
                      <strong>Role</strong>
                      <span>{selectedUser.role === 'owner' ? 'Cafe Owner' : 'User'}</span>
                    </div>
                    <div className="ad-detail-item">
                      <strong>Registered On</strong>
                      <span>{formatDate(selectedUser.createdAt)}</span>
                    </div>
                    <div className="ad-detail-item">
                      <strong>Status</strong>
                      <span>{getStatusBadge(selectedUser.active)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Address Tab */}
              {activeDetailTab === 'address' && selectedUser.address && (
                <div className="ad-detail-section">
                  <h3><i className="fas fa-map-marker-alt"></i> Address Details</h3>
                  <div className="ad-detail-grid">
                    <div className="ad-detail-item">
                      <strong>Street Address</strong>
                      <span>{selectedUser.address.street}</span>
                    </div>
                    <div className="ad-detail-item">
                      <strong>Plot/Apartment</strong>
                      <span>{selectedUser.address.plotNo}</span>
                    </div>
                    <div className="ad-detail-item">
                      <strong>City</strong>
                      <span>{selectedUser.address.city}</span>
                    </div>
                    <div className="ad-detail-item">
                      <strong>Pincode</strong>
                      <span>{selectedUser.address.pincode}</span>
                    </div>
                    <div className="ad-detail-item">
                      <strong>Country</strong>
                      <span>{selectedUser.address.country}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Academic Records Tab */}
              {activeDetailTab === 'academic' && selectedUser.academicRecords && selectedUser.academicRecords.length > 0 && (
                <div className="ad-detail-section">
                  <h3><i className="fas fa-graduation-cap"></i> Academic Records</h3>
                  {selectedUser.academicRecords.map((record, index) => (
                    <div key={index} className="ad-record-item">
                      <div className="ad-record-header">
                        <h4>{record.degree}</h4>
                        <span>{record.yearOfPassing}</span>
                      </div>
                      <div className="ad-record-details">
                        <div><strong>Institution:</strong> {record.institution}</div>
                        {record.gradeOrPercentage && (
                          <div><strong>Grade/Percentage:</strong> {record.gradeOrPercentage}</div>
                        )}
                        {record.additionalNotes && (
                          <div><strong>Notes:</strong> {record.additionalNotes}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Work Experience Tab */}
              {activeDetailTab === 'work' && selectedUser.workExperiences && selectedUser.workExperiences.length > 0 && (
                <div className="ad-detail-section">
                  <h3><i className="fas fa-briefcase"></i> Work Experience</h3>
                  {selectedUser.workExperiences.map((exp, index) => (
                    <div key={index} className="ad-record-item">
                      <div className="ad-record-header">
                        <h4>{exp.companyName}</h4>
                        {exp.currentlyWorkingHere && <span>Current</span>}
                      </div>
                      <div className="ad-record-details">
                        <div><strong>Job Title:</strong> {exp.jobTitle}</div>
                        {exp.startDate && <div><strong>Start Date:</strong> {formatDate(exp.startDate)}</div>}
                        {exp.endDate && <div><strong>End Date:</strong> {formatDate(exp.endDate)}</div>}
                        {exp.jobDescription && <div><strong>Description:</strong> {exp.jobDescription}</div>}
                        {exp.skillsGained && <div><strong>Skills:</strong> {exp.skillsGained}</div>}
                        {exp.achievements && <div><strong>Achievements:</strong> {exp.achievements}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Documents Tab */}
              {activeDetailTab === 'documents' && selectedUser.governmentDocuments && selectedUser.governmentDocuments.length > 0 && (
                <div className="ad-detail-section">
                  <h3><i className="fas fa-id-card"></i> Government Documents</h3>
                  <div className="ad-document-grid">
                    {selectedUser.governmentDocuments.map((doc, index) => (
                      <div 
                        key={index} 
                        className="ad-document-card"
                        onClick={() => viewDocument(doc)}
                      >
                        <i className={`fas ${getDocumentIcon(doc.fileType)}`}></i>
                        <h4>{doc.documentType}</h4>
                        <p>{doc.fileName}</p>
                        <p>{formatFileSize(doc.fileSize)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="ad-modal-actions">
                {!selectedUser.active && (
                  <>
                    <button 
                      className="ad-btn ad-btn-approve"
                      onClick={() => handleApproveUser(selectedUser.id, selectedUser.role === 'owner' ? 'owner' : 'user')}
                      disabled={processingId === selectedUser.id}
                    >
                      {processingId === selectedUser.id ? (
                        <><i className="fas fa-spinner fa-spin"></i> Processing...</>
                      ) : (
                        <><i className="fas fa-check"></i> Approve & Send OTP</>
                      )}
                    </button>
                    <button 
                      className="ad-btn ad-btn-reject"
                      onClick={() => handleRejectUser(selectedUser.id, selectedUser.role === 'owner' ? 'owner' : 'user')}
                      disabled={processingId === selectedUser.id}
                    >
                      {processingId === selectedUser.id ? (
                        <><i className="fas fa-spinner fa-spin"></i> Processing...</>
                      ) : (
                        <><i className="fas fa-times"></i> Reject & Send Notification</>
                      )}
                    </button>
                  </>
                )}
                {selectedUser.active && (
                  <button 
                    className="ad-btn ad-btn-view"
                    onClick={() => setShowDetails(false)}
                    style={{ width: '100%' }}
                  >
                    <i className="fas fa-check"></i> Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {/* Document Preview Modal */}
{selectedDocument && (
  <div className="ad-modal-overlay" onClick={closeDocument}>
    <div className="ad-document-preview" onClick={(e) => e.stopPropagation()}>
      <div className="ad-document-preview-header">
        <h3>
          <i className={`fas ${getDocumentIcon(selectedDocument.fileType)}`}></i>
          {selectedDocument.documentType}
        </h3>
        <button className="ad-modal-close" onClick={closeDocument}>
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      <div className="ad-document-viewer">
        {selectedDocument.fileType?.includes('pdf') ? (
          <iframe
            src={`data:application/pdf;base64,${selectedDocument.fileData}`}
            title={selectedDocument.fileName}
            width="100%"
            height="500px"
            style={{ border: '2px solid #e8dfca', borderRadius: '10px' }}
          />
        ) : selectedDocument.fileType?.includes('image') ? (
          <img 
            src={`data:${selectedDocument.fileType};base64,${selectedDocument.fileData}`} 
            alt={selectedDocument.fileName}
            className="ad-document-image"
          />
        ) : (
          <div className="ad-document-placeholder">
            <i className="fas fa-file-pdf" style={{ fontSize: '64px', color: '#8b4513' }}></i>
            <p>{selectedDocument.fileName}</p>
            <a 
              href={`data:application/pdf;base64,${selectedDocument.fileData}`}
              download={selectedDocument.fileName}
              className="ad-btn ad-btn-view"
              style={{ marginTop: '20px' }}
            >
              <i className="fas fa-download"></i> Download PDF
            </a>
          </div>
        )}
      </div>
      
      <div className="ad-document-info">
        <p>
          <strong>File Name:</strong>
          <span>{selectedDocument.fileName}</span>
        </p>
        <p>
          <strong>File Size:</strong>
          <span>{formatFileSize(selectedDocument.fileSize)}</span>
        </p>
        <p>
          <strong>Document Type:</strong>
          <span>{selectedDocument.documentType}</span>
        </p>
        <p>
          <strong>File Type:</strong>
          <span>{selectedDocument.fileType || 'Unknown'}</span>
        </p>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default AdminDashboard;