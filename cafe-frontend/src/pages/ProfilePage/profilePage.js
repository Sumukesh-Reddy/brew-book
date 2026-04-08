import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [cafeData, setCafeData] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      const userRole = localStorage.getItem('userRole');
      
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser({
          ...parsedUser,
          role: userRole || parsedUser.role || 'customer'
        });
        
        await fetchUserDetails(parsedUser.id);
        
        if (userRole === 'cafeOwner' || parsedUser.role === 'cafeOwner') {
          await fetchCafeDetails(parsedUser.id);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/users/${userId}/details`);
      const data = await response.json();
      
      if (data.success) {
        setUserDetail(data.data);
        // Format date for input if it exists
        if (data.data.dateOfBirth) {
          const date = new Date(data.data.dateOfBirth);
          const formattedDate = date.toISOString().split('T')[0];
          data.data.dateOfBirth = formattedDate;
        }
        setFormData(data.data);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const fetchCafeDetails = async (ownerId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/cafe/owner/${ownerId}`);
      const data = await response.json();
      
      if (data.success) {
        setCafeData(data.data);
      }
    } catch (error) {
      console.error('Error fetching cafe details:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...(prev.address || {}),
        [field]: value
      }
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validatePasswordForm = () => {
    const errors = {};
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    return errors;
  };

  const handlePasswordSubmit = async () => {
    const errors = validatePasswordForm();
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          oldPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Password changed successfully!');
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPasswordErrors({ submit: data.message || 'Failed to change password' });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordErrors({ submit: 'Unable to connect to server' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`http://localhost:8080/api/users/${user.id}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUserDetail(data.data);
        setEditMode(false);
        alert('Profile updated successfully!');
        // Refresh user details
        await fetchUserDetails(user.id);
      } else {
        alert(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch(role?.toLowerCase()) {
      case 'customer': return 'fa-user';
      case 'cafeowner': return 'fa-store';
      case 'admin': return 'fa-shield-alt';
      case 'chef': return 'fa-utensils';
      case 'waiter': return 'fa-concierge-bell';
      default: return 'fa-user-circle';
    }
  };

  const getRoleLabel = (role) => {
    switch(role?.toLowerCase()) {
      case 'customer': return 'Customer';
      case 'cafeowner': return 'Cafe Owner';
      case 'admin': return 'Administrator';
      case 'chef': return 'Chef';
      case 'waiter': return 'Waiter';
      default: return role || 'User';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return dateString;
    }
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

  if (loading) {
    return (
      <div className="pp-loading-container">
        <div className="pp-loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pp-error-container">
        <i className="fas fa-exclamation-circle"></i>
        <h2>Not Logged In</h2>
        <p>Please log in to view your profile.</p>
        <button className="pp-btn pp-btn-primary" onClick={() => navigate('/signin')}>
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="pp-profile-page">
      {/* Cover Photo */}
      <div className="pp-cover-photo">
        <div className="pp-cover-overlay"></div>
        <div className="pp-profile-header">
          <div className="pp-avatar-container">
            <div className="pp-avatar">
              {user.profilePicture ? (
                <img src={user.profilePicture} alt={user.name} />
              ) : (
                <span>{getInitials(user.name)}</span>
              )}
            </div>
            <button className="pp-avatar-edit" title="Change profile picture">
              <i className="fas fa-camera"></i>
            </button>
          </div>
          <div className="pp-user-info">
            <h1>{user.name}</h1>
            <p className="pp-user-email">{user.email}</p>
            <div className="pp-user-badge">
              <i className={`fas ${getRoleIcon(user.role)}`}></i>
              <span>{getRoleLabel(user.role)}</span>
            </div>
          </div>
          <button className="pp-edit-profile-btn" onClick={() => setEditMode(!editMode)}>
            <i className={`fas fa-${editMode ? 'times' : 'edit'}`}></i>
            {editMode ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="pp-content-container">
        {/* Tabs */}
        <div className="pp-tabs">
          <button 
            className={`pp-tab ${activeTab === 'profile' ? 'pp-active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <i className="fas fa-user"></i> Profile
          </button>
          <button 
            className={`pp-tab ${activeTab === 'account' ? 'pp-active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            <i className="fas fa-lock"></i> Account
          </button>
          {user.role === 'cafeOwner' && (
            <button 
              className={`pp-tab ${activeTab === 'cafe' ? 'pp-active' : ''}`}
              onClick={() => setActiveTab('cafe')}
            >
              <i className="fas fa-store"></i> My Cafe
            </button>
          )}
          <button 
            className={`pp-tab ${activeTab === 'activity' ? 'pp-active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            <i className="fas fa-history"></i> Activity
          </button>
        </div>

        {/* Tab Content */}
        <div className="pp-tab-content">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="pp-profile-section">
              {editMode ? (
                <form onSubmit={handleSubmit} className="pp-edit-form">
                  <h3>Edit Profile</h3>
                  
                  <div className="pp-form-row">
                    <div className="pp-form-group">
                      <label>First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName || ''}
                        onChange={handleInputChange}
                        placeholder="Enter first name"
                      />
                    </div>
                    <div className="pp-form-group">
                      <label>Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName || ''}
                        onChange={handleInputChange}
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>

                  <div className="pp-form-row">
                    <div className="pp-form-group">
                      <label>Date of Birth</label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="pp-form-group">
                      <label>Gender</label>
                      <select name="gender" value={formData.gender || ''} onChange={handleInputChange}>
                        <option value="">Select gender</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>

                  <h4>Address Information</h4>
                  
                  <div className="pp-form-group">
                    <label>Street Address</label>
                    <input
                      type="text"
                      value={formData.address?.street || ''}
                      onChange={(e) => handleAddressChange('street', e.target.value)}
                      placeholder="Enter street address"
                    />
                  </div>

                  <div className="pp-form-row">
                    <div className="pp-form-group">
                      <label>Plot/Apartment</label>
                      <input
                        type="text"
                        value={formData.address?.plotNo || ''}
                        onChange={(e) => handleAddressChange('plotNo', e.target.value)}
                        placeholder="Plot/Apt number"
                      />
                    </div>
                    <div className="pp-form-group">
                      <label>City</label>
                      <input
                        type="text"
                        value={formData.address?.city || ''}
                        onChange={(e) => handleAddressChange('city', e.target.value)}
                        placeholder="Enter city"
                      />
                    </div>
                  </div>

                  <div className="pp-form-row">
                    <div className="pp-form-group">
                      <label>Pincode</label>
                      <input
                        type="text"
                        value={formData.address?.pincode || ''}
                        onChange={(e) => handleAddressChange('pincode', e.target.value)}
                        placeholder="Enter pincode"
                      />
                    </div>
                    <div className="pp-form-group">
                      <label>Country</label>
                      <input
                        type="text"
                        value={formData.address?.country || 'India'}
                        onChange={(e) => handleAddressChange('country', e.target.value)}
                        placeholder="Enter country"
                      />
                    </div>
                  </div>

                  <div className="pp-form-actions">
                    <button type="submit" className="pp-btn pp-btn-primary" disabled={loading}>
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button type="button" className="pp-btn pp-btn-secondary" onClick={() => setEditMode(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="pp-profile-view">
                  <div className="pp-info-card">
                    <h3><i className="fas fa-user"></i> Personal Information</h3>
                    <div className="pp-info-grid">
                      <div className="pp-info-item">
                        <span className="pp-info-label">Full Name</span>
                        <span className="pp-info-value">
                          {userDetail?.firstName || user.name} {userDetail?.lastName || ''}
                        </span>
                      </div>
                      <div className="pp-info-item">
                        <span className="pp-info-label">Email Address</span>
                        <span className="pp-info-value">{user.email}</span>
                      </div>
                      <div className="pp-info-item">
                        <span className="pp-info-label">Date of Birth</span>
                        <span className="pp-info-value">{formatDate(userDetail?.dateOfBirth)}</span>
                      </div>
                      <div className="pp-info-item">
                        <span className="pp-info-label">Gender</span>
                        <span className="pp-info-value">{userDetail?.gender || 'Not specified'}</span>
                      </div>
                      <div className="pp-info-item">
                        <span className="pp-info-label">Member Since</span>
                        <span className="pp-info-value">{formatDate(user.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Academic Records - Keep if they exist */}
                  {userDetail?.academicRecords && userDetail.academicRecords.length > 0 && (
                    <div className="pp-info-card">
                      <h3><i className="fas fa-graduation-cap"></i> Academic Records</h3>
                      <div className="pp-records-list">
                        {userDetail.academicRecords.map((record, index) => (
                          <div key={index} className="pp-record-item">
                            <h4>{record.degree}</h4>
                            <p><strong>Institution:</strong> {record.institution}</p>
                            <p><strong>Year of Passing:</strong> {record.yearOfPassing}</p>
                            {record.gradeOrPercentage && (
                              <p><strong>Grade/Percentage:</strong> {record.gradeOrPercentage}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Work Experience - Keep if they exist */}
                  {userDetail?.workExperiences && userDetail.workExperiences.length > 0 && (
                    <div className="pp-info-card">
                      <h3><i className="fas fa-briefcase"></i> Work Experience</h3>
                      <div className="pp-records-list">
                        {userDetail.workExperiences.map((exp, index) => (
                          <div key={index} className="pp-record-item">
                            <h4>{exp.companyName}</h4>
                            <p><strong>Role:</strong> {exp.jobTitle}</p>
                            {exp.startDate && (
                              <p><strong>Duration:</strong> {formatDate(exp.startDate)} - {exp.currentlyWorkingHere ? 'Present' : formatDate(exp.endDate)}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="pp-account-section">
              <div className="pp-info-card">
                <h3><i className="fas fa-lock"></i> Security Settings</h3>
                <div className="pp-account-settings">
                  <div className="pp-setting-item">
                    <div className="pp-setting-info">
                      <h4>Change Password</h4>
                      <p>Update your password regularly to keep your account secure</p>
                    </div>
                    <button 
                      className="pp-btn pp-btn-outline"
                      onClick={() => setShowPasswordModal(true)}
                    >
                      Change Password
                    </button>
                  </div>

                  <div className="pp-setting-item">
                    <div className="pp-setting-info">
                      <h4>Email Verification</h4>
                      <p>Your email is {userDetail?.emailVerified ? 'verified' : 'not verified'}</p>
                    </div>
                    {!userDetail?.emailVerified && (
                      <button className="pp-btn pp-btn-primary">
                        Verify Email
                      </button>
                    )}
                    {userDetail?.emailVerified && (
                      <span className="pp-verified-badge">
                        <i className="fas fa-check-circle"></i> Verified
                      </span>
                    )}
                  </div>

                  <div className="pp-setting-item">
                    <div className="pp-setting-info">
                      <h4>Two-Factor Authentication</h4>
                      <p>Add an extra layer of security to your account</p>
                    </div>
                    <button className="pp-btn pp-btn-outline">
                      Enable
                    </button>
                  </div>
                </div>
              </div>

              <div className="pp-info-card">
                <h3><i className="fas fa-bell"></i> Notification Preferences</h3>
                <div className="pp-notification-settings">
                  <label className="pp-checkbox">
                    <input type="checkbox" defaultChecked />
                    <span>Email notifications for bookings</span>
                  </label>
                  <label className="pp-checkbox">
                    <input type="checkbox" defaultChecked />
                    <span>SMS alerts for order updates</span>
                  </label>
                  <label className="pp-checkbox">
                    <input type="checkbox" defaultChecked />
                    <span>Promotional offers and updates</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Cafe Tab */}
          {activeTab === 'cafe' && user.role === 'cafeOwner' && (
            <div className="pp-cafe-section">
              {cafeData ? (
                <>
                  <div className="pp-cafe-header">
                    <h2>{cafeData.cafeName}</h2>
                    <span className={`pp-cafe-status pp-status-${cafeData.status?.toLowerCase()}`}>
                      {cafeData.status}
                    </span>
                  </div>

                  <div className="pp-info-card">
                    <h3><i className="fas fa-info-circle"></i> Cafe Information</h3>
                    <div className="pp-info-grid">
                      <div className="pp-info-item">
                        <span className="pp-info-label">Description</span>
                        <span className="pp-info-value">{cafeData.description || 'No description'}</span>
                      </div>
                      <div className="pp-info-item">
                        <span className="pp-info-label">Email</span>
                        <span className="pp-info-value">{cafeData.email}</span>
                      </div>
                      <div className="pp-info-item">
                        <span className="pp-info-label">Phone</span>
                        <span className="pp-info-value">{cafeData.phone || 'Not provided'}</span>
                      </div>
                      <div className="pp-info-item">
                        <span className="pp-info-label">Established</span>
                        <span className="pp-info-value">{cafeData.establishedYear || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pp-info-card">
                    <h3><i className="fas fa-map-marker-alt"></i> Cafe Address</h3>
                    {cafeData.address ? (
                      <div className="pp-info-grid">
                        <div className="pp-info-item pp-full-width">
                          <span className="pp-info-label">Street Address</span>
                          <span className="pp-info-value">{cafeData.address.street || 'Not provided'}</span>
                        </div>
                        <div className="pp-info-item">
                          <span className="pp-info-label">Plot/Apartment</span>
                          <span className="pp-info-value">{cafeData.address.plotNo || 'Not provided'}</span>
                        </div>
                        <div className="pp-info-item">
                          <span className="pp-info-label">City</span>
                          <span className="pp-info-value">{cafeData.address.city || 'Not provided'}</span>
                        </div>
                        <div className="pp-info-item">
                          <span className="pp-info-label">Pincode</span>
                          <span className="pp-info-value">{cafeData.address.pincode || 'Not provided'}</span>
                        </div>
                        <div className="pp-info-item">
                          <span className="pp-info-label">Country</span>
                          <span className="pp-info-value">{cafeData.address.country || 'India'}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="pp-no-data">No address provided</p>
                    )}
                  </div>

                  <div className="pp-info-card">
                    <h3><i className="fas fa-cog"></i> Facilities</h3>
                    <div className="pp-facilities">
                      <span className={`pp-facility-tag ${cafeData.hasWifi ? 'pp-yes' : 'pp-no'}`}>
                        <i className={`fas fa-${cafeData.hasWifi ? 'check' : 'times'}`}></i>
                        WiFi
                      </span>
                      <span className={`pp-facility-tag ${cafeData.hasParking ? 'pp-yes' : 'pp-no'}`}>
                        <i className={`fas fa-${cafeData.hasParking ? 'check' : 'times'}`}></i>
                        Parking
                      </span>
                      <span className={`pp-facility-tag ${cafeData.hasAC ? 'pp-yes' : 'pp-no'}`}>
                        <i className={`fas fa-${cafeData.hasAC ? 'check' : 'times'}`}></i>
                        Air Conditioning
                      </span>
                    </div>
                  </div>

                  <div className="pp-info-card">
                    <h3><i className="fas fa-chart-line"></i> Capacity</h3>
                    <div className="pp-info-grid">
                      <div className="pp-info-item">
                        <span className="pp-info-label">Total Tables</span>
                        <span className="pp-info-value">{cafeData.totalTables || 0}</span>
                      </div>
                      <div className="pp-info-item">
                        <span className="pp-info-label">Seating Capacity</span>
                        <span className="pp-info-value">{cafeData.seatingCapacity || 0}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="pp-empty-state">
                  <i className="fas fa-store"></i>
                  <h3>No Cafe Registered</h3>
                  <p>You haven't registered your cafe yet.</p>
                  <button className="pp-btn pp-btn-primary" onClick={() => navigate('/owner-dashboard?tab=cafe')}>
                    Register Your Cafe
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="pp-activity-section">
              <div className="pp-info-card">
                <h3><i className="fas fa-clock"></i> Recent Activity</h3>
                <div className="pp-activity-list">
                  <div className="pp-activity-item">
                    <div className="pp-activity-icon pp-login">
                      <i className="fas fa-sign-in-alt"></i>
                    </div>
                    <div className="pp-activity-details">
                      <p>Last login: Today at {new Date().toLocaleTimeString()}</p>
                      <span>Just now</span>
                    </div>
                  </div>
                  {userDetail?.updatedAt && (
                    <div className="pp-activity-item">
                      <div className="pp-activity-icon pp-profile">
                        <i className="fas fa-user-edit"></i>
                      </div>
                      <div className="pp-activity-details">
                        <p>Profile last updated</p>
                        <span>{formatDate(userDetail.updatedAt)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pp-info-card">
                <h3><i className="fas fa-chart-simple"></i> Account Statistics</h3>
                <div className="pp-stats-grid">
                  <div className="pp-stat-item">
                    <span className="pp-stat-label">Account Age</span>
                    <span className="pp-stat-value">
                      {Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24))} days
                    </span>
                  </div>
                  <div className="pp-stat-item">
                    <span className="pp-stat-label">Last Updated</span>
                    <span className="pp-stat-value">{formatDate(user.updatedAt)}</span>
                  </div>
                  <div className="pp-stat-item">
                    <span className="pp-stat-label">Account Status</span>
                    <span className={`pp-status-badge ${user.active ? 'pp-active' : 'pp-inactive'}`}>
                      {user.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="pp-modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="pp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pp-modal-header">
              <h3><i className="fas fa-key"></i> Change Password</h3>
              <button className="pp-modal-close" onClick={() => setShowPasswordModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="pp-modal-body">
              <div className="pp-form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                />
                {passwordErrors.currentPassword && (
                  <span className="pp-error-text">{passwordErrors.currentPassword}</span>
                )}
              </div>

              <div className="pp-form-group">
                <label>New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password (min. 6 characters)"
                />
                {passwordErrors.newPassword && (
                  <span className="pp-error-text">{passwordErrors.newPassword}</span>
                )}
              </div>

              <div className="pp-form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                />
                {passwordErrors.confirmPassword && (
                  <span className="pp-error-text">{passwordErrors.confirmPassword}</span>
                )}
              </div>

              {passwordErrors.submit && (
                <div className="pp-error-message">{passwordErrors.submit}</div>
              )}
            </div>
            <div className="pp-modal-footer">
              <button className="pp-btn pp-btn-secondary" onClick={() => setShowPasswordModal(false)}>
                Cancel
              </button>
              <button className="pp-btn pp-btn-primary" onClick={handlePasswordSubmit}>
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;