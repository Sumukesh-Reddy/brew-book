import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import './SigninPage.css';

const SigninPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [infoMessage, setInfoMessage] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    userRole: 'customer', // User role selection
    email: '',
    password: '',
    rememberMe: false
  });

  // Errors state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // User roles for icons
  const userRoles = [
    { 
      value: 'customer', 
      label: 'Customer', 
      icon: 'fas fa-user',
      description: 'Book tables & order food'
    },
    { 
      value: 'cafeOwner', 
      label: 'Cafe Owner', 
      icon: 'fas fa-store',
      description: 'Manage cafe & staff'
    },
    { 
      value: 'chef', 
      label: 'Chef', 
      icon: 'fas fa-utensils',
      description: 'Prepare customer orders'
    },
    { 
      value: 'waiter', 
      label: 'Waiter', 
      icon: 'fas fa-concierge-bell',
      description: 'Serve orders to customers'
    }
  ];

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  // Handle role selection
  const handleRoleSelect = (roleValue) => {
    setFormData({
      ...formData,
      userRole: roleValue
    });

    // Clear role error if any
    if (errors.userRole) {
      setErrors({
        ...errors,
        userRole: ''
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.userRole) {
      newErrors.userRole = 'Please select a user role';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission - Connect to backend API
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      try {
        // Prepare data for API call
        const loginData = {
          email: formData.email,
          password: formData.password
        };
        
        console.log('Sending login data:', loginData);
        
        // Call backend API
        const response = await fetch('http://localhost:8080/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(loginData)
        });
        
        const result = await response.json();
        console.log('API Response:', result);
        
        if (result.success) {
          // Check if password change is required
          if (result.data.passwordChangeRequired) {
            // Redirect to password change page
            navigate('/change-password', { 
              state: { email: formData.email } 
            });
            return;
          }
          
          // Show success message with role
          const roleLabel = userRoles.find(r => r.value === formData.userRole)?.label || formData.userRole;
          alert(`Login successful as ${roleLabel}! Welcome back.`);
          
          // Store user data in localStorage/sessionStorage
          localStorage.setItem('user', JSON.stringify(result.data));
          localStorage.setItem('userRole', formData.userRole);
          
          // Reset form
          setFormData({
            userRole: 'customer',
            email: '',
            password: '',
            rememberMe: false
          });
          
          // Redirect based on user role
          switch(formData.userRole) {
            case 'customer':
              navigate('/customer/dashboard');
              break;
            case 'cafeOwner':
              navigate('/owner/dashboard');
              break;
            case 'chef':
              navigate('/chef-dashboard');
              break;
            case 'waiter':
              navigate('/waiter-dashboard');
              break;
            default:
              navigate('/');
          }
        } else {
          alert(`Login failed: ${result.message}`);
        }
      } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please make sure the backend server is running on port 8080 and try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Handle back to home
  const handleBackToHome = () => {
    navigate('/');
  };

  // Handle forgot password
  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  useEffect(() => {
    const message = location.state?.message;
    if (message) {
      setInfoMessage(message);
      // Clear state so refresh doesn't re-show it
      navigate(location.pathname, { replace: true });
    }
  }, [location.pathname, location.state, navigate]);

  return (
    <div className="signin-page">
      <div className="signin-container">
        {/* Left Side: Branding & Info */}
        <div className="signin-left">
          <div>
            <div className="logo">
              <i className="fas fa-mug-hot"></i>
              <h1>Brew & Book</h1>
            </div>
            
            <div className="welcome-text">
              <h2>Welcome Back</h2>
              <p>Sign in to your account to continue your seamless coffee experience.</p>
              
              <ul className="benefits-list">
                <li><i className="fas fa-check-circle"></i> Access your table bookings</li>
                <li><i className="fas fa-check-circle"></i> View order history</li>
                <li><i className="fas fa-check-circle"></i> Manage your profile</li>
                <li><i className="fas fa-check-circle"></i> Get personalized offers</li>
                <li><i className="fas fa-check-circle"></i> Fast checkout for repeat orders</li>
              </ul>
            </div>
          </div>
          
          <div className="signin-footer">
            <button 
              onClick={handleBackToHome}
              className="back-button"
            >
              <i className="fas fa-arrow-left"></i> Back to Home Page
            </button>
            
            <div>
              New to Brew & Book? <Link to="/signup">Create an account</Link>
            </div>
          </div>
        </div>
        
        {/* Right Side: Signin Form */}
        <div className="signin-right">
          <div className="signin-header">
            <h2>Sign In to Your Account</h2>
            <p>Select your role and enter your credentials</p>
          </div>

          {infoMessage && (
            <div className="signin-info-message">
              <i className="fas fa-info-circle"></i>
              <span>{infoMessage}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="signin-form">
            {/* User Role Selection - Icons instead of dropdown */}
            <div className={`form-group role-icons-group ${errors.userRole ? 'has-error' : ''}`}>
              <label className="required">Select Your Role</label>
              <div className="role-icons-container">
                {userRoles.map((role) => (
                  <div
                    key={role.value}
                    className={`role-icon-card ${formData.userRole === role.value ? 'selected' : ''}`}
                    onClick={() => handleRoleSelect(role.value)}
                  >
                    <i className={role.icon}></i>
                    <span className="role-label">{role.label}</span>
                    <span className="role-description-icon">{role.description}</span>
                  </div>
                ))}
              </div>
              {errors.userRole && <div className="error-message">{errors.userRole}</div>}
            </div>
            
            {/* Email Field */}
            <div className={`form-group ${errors.email ? 'has-error' : ''}`}>
              <label htmlFor="email" className="required">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
                disabled={isSubmitting}
              />
              {errors.email && <div className="error-message">{errors.email}</div>}
            </div>
            
            {/* Password Field */}
            <div className={`form-group ${errors.password ? 'has-error' : ''}`}>
              <label htmlFor="password" className="required">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                disabled={isSubmitting}
              />
              {errors.password && <div className="error-message">{errors.password}</div>}
            </div>
            
            {/* Remember Me & Forgot Password */}
            <div className="form-options">
              <div className="remember-me">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                />
                <label htmlFor="rememberMe">Remember me</label>
              </div>
              
              <button
                type="button"
                onClick={handleForgotPassword}
                className="forgot-password"
                disabled={isSubmitting}
              >
                Forgot password?
              </button>
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Signing In...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt"></i> Sign In
                </>
              )}
            </button>
            
            {/* Divider */}
            <div className="divider">
              <span>Or continue with</span>
            </div>
            
            {/* Social Login Options - Google Only */}
            <div className="social-login">
              <button type="button" className="social-btn google" disabled={isSubmitting}>
                <i className="fab fa-google"></i> Sign in with Google
              </button>
            </div>
          </form>
          
          {/* Security Information */}
          <div className="security-info">
            <h4><i className="fas fa-shield-alt"></i> Secure Login</h4>
            <p>Your credentials are encrypted and securely stored. We never share your personal information.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SigninPage;