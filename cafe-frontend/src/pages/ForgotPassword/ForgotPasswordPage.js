import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ForgotPasswordPage.css';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8080/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('OTP has been sent to your email. Please check your inbox.');
        setStep(2);
        startResendCountdown();
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8080/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResetToken(data.data.resetToken);
        setSuccess('OTP verified successfully. Please set your new password.');
        setStep(3);
      } else {
        setError(data.message || 'Invalid OTP');
      }
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      setError('New password is required');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8080/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          resetToken, 
          newPassword 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/signin');
        }, 3000);
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendDisabled) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8080/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('New OTP has been sent to your email.');
        startResendCountdown();
      } else {
        setError(data.message || 'Failed to resend OTP');
      }
    } catch (err) {
      console.error('Error resending OTP:', err);
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startResendCountdown = () => {
    setResendDisabled(true);
    setCountdown(30);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
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

  const getPasswordStrengthText = () => {
    switch(passwordStrength) {
      case 'weak': return 'Weak - Add uppercase, numbers, or special characters';
      case 'medium': return 'Medium - Could be stronger';
      case 'strong': return 'Strong - Good password';
      default: return '';
    }
  };

  return (
    <div className="fp-forgot-password-page">
      <div className="fp-forgot-password-container">
        <div className="fp-forgot-password-header">
          <div className="fp-logo">
            <i className="fas fa-mug-hot"></i>
            <h1>Brew & Book</h1>
          </div>
          <h2>
            {step === 1 && 'Forgot Password'}
            {step === 2 && 'Verify OTP'}
            {step === 3 && 'Reset Password'}
          </h2>
          <p>
            {step === 1 && 'Enter your email address to receive a password reset OTP'}
            {step === 2 && `Enter the 6-digit OTP sent to ${email}`}
            {step === 3 && 'Create a new password for your account'}
          </p>
        </div>

        <div className="fp-forgot-password-form">
          {/* Step 1: Email */}
          {step === 1 && (
            <>
              <div className="fp-form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="fp-error-message">
                  <i className="fas fa-exclamation-circle"></i> {error}
                </div>
              )}

              {success && (
                <div className="fp-success-message">
                  <i className="fas fa-check-circle"></i> {success}
                </div>
              )}

              <button 
                className="fp-submit-btn" 
                onClick={handleSendOtp}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Sending...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i> Send OTP
                  </>
                )}
              </button>
            </>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <>
              <div className="fp-form-group">
                <label htmlFor="otp">Enter OTP</label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit OTP"
                  maxLength="6"
                  disabled={loading}
                />
                <div className="fp-otp-hint">
                  <i className="fas fa-info-circle"></i>
                  Please enter the 6-digit code sent to your email
                </div>
              </div>

              {error && (
                <div className="fp-error-message">
                  <i className="fas fa-exclamation-circle"></i> {error}
                </div>
              )}

              {success && (
                <div className="fp-success-message">
                  <i className="fas fa-check-circle"></i> {success}
                </div>
              )}

              <button 
                className="fp-submit-btn" 
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Verifying...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check"></i> Verify OTP
                  </>
                )}
              </button>

              <div className="fp-resend-otp">
                <span>Didn't receive OTP? </span>
                <button 
                  onClick={handleResendOtp}
                  disabled={resendDisabled || loading}
                >
                  Resend {resendDisabled ? `(${countdown}s)` : ''}
                </button>
              </div>
            </>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <>
              <div className="fp-form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    checkPasswordStrength(e.target.value);
                  }}
                  placeholder="At least 6 characters"
                  disabled={loading}
                />
                {newPassword && (
                  <>
                    <div className="fp-password-strength">
                      <div className={`fp-password-strength-bar ${passwordStrength}`}></div>
                    </div>
                    <div className={`fp-password-strength-text ${passwordStrength}`}>
                      {getPasswordStrengthText()}
                    </div>
                  </>
                )}
              </div>

              <div className="fp-form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="fp-error-message">
                  <i className="fas fa-exclamation-circle"></i> {error}
                </div>
              )}

              {success && (
                <div className="fp-success-message">
                  <i className="fas fa-check-circle"></i> {success}
                </div>
              )}

              <button 
                className="fp-submit-btn" 
                onClick={handleResetPassword}
                disabled={loading || !newPassword || !confirmPassword}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Resetting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-key"></i> Reset Password
                  </>
                )}
              </button>
            </>
          )}

          <div className="fp-form-footer">
            <button 
              type="button" 
              className="fp-back-link" 
              onClick={() => navigate('/signin')}
            >
              <i className="fas fa-arrow-left"></i> Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;