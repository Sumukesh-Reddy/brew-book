import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './ChangePasswordPage.css';

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const [formData, setFormData] = useState({
    email: email,
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    if (name === 'newPassword') {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength('');
      return;
    }
    
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const strength = [hasLowerCase, hasUpperCase, hasNumbers, hasSpecial].filter(Boolean).length;
    
    if (password.length < 6) {
      setPasswordStrength('weak');
    } else if (strength >= 3 && password.length >= 8) {
      setPasswordStrength('strong');
    } else if (strength >= 2) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('weak');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    }
    
    if (!formData.oldPassword) {
      newErrors.oldPassword = 'Current/Temporary password is required';
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    } else if (passwordStrength === 'weak') {
      newErrors.newPassword = 'Password is too weak. Include uppercase, numbers, or special characters';
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:8080/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Password changed successfully! You can now login with your new password.');
        navigate('/signin');
      } else {
        setErrors({ submit: data.message || 'Failed to change password' });
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setErrors({ submit: 'Unable to connect to server. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="cpp-change-password-page">
      <div className="cpp-change-password-container">
        <div className="cpp-change-password-header">
          <div className="cpp-change-password-logo">
            <i className="fas fa-lock"></i>
            <h1>Change Password</h1>
          </div>
          <p>Please change your temporary password to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="cpp-change-password-form">
          <div className={`cpp-form-group ${errors.email ? 'has-error' : ''}`}>
            <label htmlFor="email" className="required">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your@email.com"
              disabled={!!email}
            />
            {errors.email && <div className="cpp-error-message"><i className="fas fa-exclamation-circle"></i> {errors.email}</div>}
          </div>

          <div className={`cpp-form-group ${errors.oldPassword ? 'has-error' : ''}`}>
            <label htmlFor="oldPassword" className="required">
              Current/Temporary Password/OTP
            </label>
            <input
              type="password"
              id="oldPassword"
              name="oldPassword"
              value={formData.oldPassword}
              onChange={handleInputChange}
              placeholder="Enter your current or temporary password"
            />
            {errors.oldPassword && <div className="cpp-error-message"><i className="fas fa-exclamation-circle"></i> {errors.oldPassword}</div>}
          </div>

          <div className={`cpp-form-group ${errors.newPassword ? 'has-error' : ''}`}>
            <label htmlFor="newPassword" className="required">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              placeholder="At least 6 characters"
            />
            <div className="cpp-password-strength">
              <div className={`cpp-password-strength-bar ${passwordStrength}`}></div>
            </div>
            <div className="cpp-password-hint">
              Use uppercase, numbers & special characters for strong password
            </div>
            {errors.newPassword && <div className="cpp-error-message"><i className="fas fa-exclamation-circle"></i> {errors.newPassword}</div>}
          </div>

          <div className={`cpp-form-group ${errors.confirmPassword ? 'has-error' : ''}`}>
            <label htmlFor="confirmPassword" className="required">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Re-enter new password"
            />
            {errors.confirmPassword && <div className="cpp-error-message"><i className="fas fa-exclamation-circle"></i> {errors.confirmPassword}</div>}
          </div>

          {errors.submit && (
            <div className="cpp-error-message cpp-submit-error">
              <i className="fas fa-exclamation-circle"></i> {errors.submit}
            </div>
          )}

          <button type="submit" className="cpp-submit-btn" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Changing Password...
              </>
            ) : (
              <>
                <i className="fas fa-key"></i> Change Password
              </>
            )}
          </button>

          <div className="cpp-form-footer">
            <button type="button" className="cpp-back-link" onClick={() => navigate('/signin')}>
              <i className="fas fa-arrow-left"></i> Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordPage;