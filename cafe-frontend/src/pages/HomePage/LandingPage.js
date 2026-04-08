import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const [animationComplete, setAnimationComplete] = useState(false);
  const [loaded, setLoaded] = useState(false);
  
  // For How It Works 3D Carousel
  const [currentStep, setCurrentStep] = useState(0);
  
  // For Features Slider
  const [currentFeature, setCurrentFeature] = useState(0);
  const [featuresInView, setFeaturesInView] = useState(false);
  const featuresRef = useRef(null);
  const sliderRef = useRef(null);

  const steps = [
    {
      title: "Sign Up & Complete Profile",
      desc: "Register with your email, verify it, and complete your profile to get started."
    },
    {
      title: "Choose Cafe & Book Table",
      desc: "Select your preferred cafe and book a table for your desired date and time."
    },
    {
      title: "Browse Menu & Pre-Order",
      desc: "Explore the cafe's menu and pre-order your favorite food and drinks."
    },
    {
      title: "Pay Online & Enjoy",
      desc: "Make secure payment and arrive to find everything ready for you."
    }
  ];

  const features = [
    {
      icon: "fas fa-calendar-check",
      title: "Easy Table Booking",
      description: "Book your table in advance at your preferred time. No more waiting in lines."
    },
    {
      icon: "fas fa-utensils",
      title: "Pre-Order Food & Drinks",
      description: "Browse menus and pre-order your favorite items before you arrive."
    },
    {
      icon: "fas fa-bolt",
      title: "Real-Time Updates",
      description: "Get live updates on your order status from preparation to serving."
    },
    {
      icon: "fas fa-shield-alt",
      title: "Secure Payment",
      description: "Pay online securely with multiple payment options for a hassle-free experience."
    },
    {
      icon: "fas fa-clock",
      title: "Skip The Queue",
      description: "Save time by pre-ordering and arrive when your table is ready."
    },
    {
      icon: "fas fa-star",
      title: "Loyalty Rewards",
      description: "Earn points with every visit and redeem them for free coffee and discounts."
    }
  ];

  const totalFeatureSlides = Math.ceil(features.length / 3); // Show 3 cards at a time

  useEffect(() => {
    // Opening animation
    setTimeout(() => {
      setLoaded(true);
    }, 300);
    
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 2500);
    
    // Intersection Observer for features section
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setFeaturesInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -100px 0px' }
    );
    
    if (featuresRef.current) {
      observer.observe(featuresRef.current);
    }
    
    // Auto rotate steps in How It Works section
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 3500);
    
    // Auto rotate features slider
    const featureInterval = setInterval(() => {
      if (featuresInView) {
        setCurrentFeature((prev) => (prev + 1) % totalFeatureSlides);
      }
    }, 4000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(stepInterval);
      clearInterval(featureInterval);
      if (featuresRef.current) {
        observer.unobserve(featuresRef.current);
      }
    };
  }, [featuresInView, totalFeatureSlides]);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getStepPosition = (index) => {
    if (index === currentStep) return 'lp-active';
    if (index === (currentStep - 1 + steps.length) % steps.length) return 'lp-left';
    if (index === (currentStep + 1) % steps.length) return 'lp-right';
    return 'lp-back';
  };

  const nextFeature = () => {
    setCurrentFeature((prev) => (prev + 1) % totalFeatureSlides);
  };

  const prevFeature = () => {
    setCurrentFeature((prev) => (prev - 1 + totalFeatureSlides) % totalFeatureSlides);
  };

  return (
    <div className="lp-landing-page">
      {/* Opening Animation */}
      <div className={`lp-opening-animation ${animationComplete ? 'lp-hidden' : ''}`}>
        <div className="lp-animation-container">
          <div className="lp-coffee-cup">
            <div className="lp-cup"></div>
            <div className="lp-handle"></div>
            <div className="lp-steam lp-steam1"></div>
            <div className="lp-steam lp-steam2"></div>
            <div className="lp-steam lp-steam3"></div>
          </div>
          <div className="lp-text-animation">
            <span className={`lp-letter ${loaded ? 'lp-loaded' : ''}`}>B</span>
            <span className={`lp-letter ${loaded ? 'lp-loaded' : ''}`}>r</span>
            <span className={`lp-letter ${loaded ? 'lp-loaded' : ''}`}>e</span>
            <span className={`lp-letter ${loaded ? 'lp-loaded' : ''}`}>w</span>
            <span className={`lp-letter ${loaded ? 'lp-loaded' : ''}`}>&nbsp;</span>
            <span className={`lp-letter ${loaded ? 'lp-loaded' : ''}`}>&</span>
            <span className={`lp-letter ${loaded ? 'lp-loaded' : ''}`}>&nbsp;</span>
            <span className={`lp-letter ${loaded ? 'lp-loaded' : ''}`}>B</span>
            <span className={`lp-letter ${loaded ? 'lp-loaded' : ''}`}>o</span>
            <span className={`lp-letter ${loaded ? 'lp-loaded' : ''}`}>o</span>
            <span className={`lp-letter ${loaded ? 'lp-loaded' : ''}`}>k</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`lp-main-content ${animationComplete ? 'lp-visible' : ''}`}>
        {/* Navigation Bar */}
        <nav className="lp-navbar">
          <div className="lp-nav-container">
            <div className="lp-logo" onClick={() => scrollToSection('hero')}>
              <i className="fas fa-mug-hot"></i>
              <span>Brew & Book</span>
            </div>
            <div className="lp-nav-links">
              <button onClick={() => scrollToSection('hero')} className="lp-nav-link">Home</button>
              <button onClick={() => scrollToSection('about')} className="lp-nav-link">About</button>
              <button onClick={() => scrollToSection('features')} className="lp-nav-link">Features</button>
              <button onClick={() => scrollToSection('how-it-works')} className="lp-nav-link">How It Works</button>
            </div>
            <div className="lp-nav-buttons">
              <button className="lp-btn lp-btn-outline" onClick={() => navigate('/signin')}>
                <i className="fas fa-sign-in-alt"></i> Log In
              </button>
              <button className="lp-btn lp-btn-primary" onClick={() => navigate('/signup')}>
                <i className="fas fa-user-plus"></i> Sign Up
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section id="hero" className="lp-hero-section">
          <div className="lp-hero-content">
            <h1 className="lp-hero-title">
              Your Perfect <span className="lp-highlight">Coffee Experience</span> Starts Here
            </h1>
            <p className="lp-hero-subtitle">
              Book tables, pre-order your favorite coffee and food, and skip the wait at your favorite cafes. 
              All from one simple platform.
            </p>
            <div className="lp-hero-buttons">
              <button className="lp-btn lp-btn-primary lp-btn-large" onClick={() => navigate('/signup')}>
                <i className="fas fa-rocket"></i> Get Started
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="lp-btn lp-btn-outline lp-btn-large">
                <i className="fas fa-play-circle"></i> See How It Works
              </button>
            </div>
          </div>
          <div className="lp-hero-image">
            <div className="lp-image-placeholder">
              <i className="fas fa-coffee"></i>
              <p>Smart Coffee Ordering Platform</p>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="lp-about-section">
          <div className="lp-section-header">
            <h2>About Brew & Book</h2>
            <p>Transforming cafe experiences through technology</p>
          </div>
          <div className="lp-about-content">
            <div className="lp-about-text">
              <h3>Our Mission</h3>
              <p>
                Brew & Book is a comprehensive web-based platform designed to revolutionize 
                the traditional cafe experience. We connect customers with their favorite cafes 
                through a seamless digital interface that simplifies table booking, food ordering, 
                and payment processing.
              </p>
              <p>
                Our platform bridges the gap between cafe owners, staff, and customers, 
                ensuring smooth coordination and exceptional service for everyone involved.
              </p>
              <div className="lp-about-stats">
                <div className="lp-stat">
                  <h4>100%</h4>
                  <p>Digital Process</p>
                </div>
                <div className="lp-stat">
                  <h4>24/7</h4>
                  <p>Booking Availability</p>
                </div>
                <div className="lp-stat">
                  <h4>Secure</h4>
                  <p>Payment Processing</p>
                </div>
              </div>
            </div>
            <div className="lp-about-image">
              <div className="lp-image-placeholder">
                <i className="fas fa-laptop-code"></i>
                <p>Modern Web Platform</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section - Animated Slider */}
        <section 
          ref={featuresRef} 
          id="features" 
          className="lp-features-section"
        >
          <div className="lp-section-header">
            <h2>Why Choose Our Platform</h2>
            <p>Experience seamless coffee ordering and table booking</p>
          </div>
          
          <div className="lp-features-slider-container" ref={sliderRef}>
            <div 
              className="lp-features-track"
              style={{ transform: `translateX(-${currentFeature * 100}%)` }}
            >
              {features.map((feature, index) => (
                <div key={index} className="lp-feature-slide">
                  <div className="lp-feature-card">
                    <div className="lp-feature-icon">
                      <i className={feature.icon}></i>
                    </div>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="lp-features-nav">
            <button 
              className="lp-features-nav-btn" 
              onClick={prevFeature}
              disabled={currentFeature === 0}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <button 
              className="lp-features-nav-btn" 
              onClick={nextFeature}
              disabled={currentFeature === totalFeatureSlides - 1}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>

          {/* Feature Dots */}
          <div className="lp-features-dots">
            {Array.from({ length: totalFeatureSlides }).map((_, index) => (
              <button
                key={index}
                className={`lp-feature-dot ${currentFeature === index ? 'lp-active' : ''}`}
                onClick={() => setCurrentFeature(index)}
                aria-label={`Go to feature slide ${index + 1}`}
              />
            ))}
          </div>
        </section>

        {/* How It Works Section - 3D Carousel */}
        <section id="how-it-works" className="lp-how-it-works-section">
          <div className="lp-section-header">
            <h2>How It Works</h2>
            <p>Four simple steps to your perfect coffee experience</p>
          </div>
          
          <div className="lp-steps-container">
            {steps.map((step, index) => (
              <div key={index} className={`lp-step ${getStepPosition(index)}`}>
                <div className="lp-step-number">{index + 1}</div>
                <div className="lp-step-content">
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Step Navigation Dots */}
          <div className="lp-step-dots">
            {steps.map((_, index) => (
              <button
                key={index}
                className={`lp-step-dot ${currentStep === index ? 'lp-active' : ''}`}
                onClick={() => setCurrentStep(index)}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="lp-footer">
          <div className="lp-footer-container">
            <div className="lp-footer-section">
              <div className="lp-footer-logo">
                <i className="fas fa-mug-hot"></i>
                <span>Brew & Book</span>
              </div>
              <p className="lp-footer-description">
                A web-based platform transforming cafe experiences through 
                seamless table booking, pre-ordering, and secure payments.
              </p>
              <div className="lp-social-icons">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                  <i className="fab fa-linkedin-in"></i>
                </a>
              </div>
            </div>
            
            <div className="lp-footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><button onClick={() => scrollToSection('hero')} className="lp-footer-btn">Home</button></li>
                <li><button onClick={() => scrollToSection('about')} className="lp-footer-btn">About</button></li>
                <li><button onClick={() => scrollToSection('features')} className="lp-footer-btn">Features</button></li>
                <li><button onClick={() => scrollToSection('how-it-works')} className="lp-footer-btn">How It Works</button></li>
              </ul>
            </div>
            
            <div className="lp-footer-section">
              <h4>User Roles</h4>
              <ul>
                <li><i className="fas fa-user"></i> Customer</li>
                <li><i className="fas fa-store"></i> Cafe Owner</li>
                <li><i className="fas fa-utensils"></i> Chef</li>
                <li><i className="fas fa-user-tie"></i> Waiter</li>
                <li><i className="fas fa-user-shield"></i> Admin</li>
              </ul>
            </div>
            
            <div className="lp-footer-section">
              <h4>Contact Us</h4>
              <ul>
                <li><i className="fas fa-envelope"></i> sumukeshmopuram1@gmail.com</li>
                <li><i className="fas fa-phone"></i> 8790787664</li>
                <li><i className="fas fa-map-marker-alt"></i> Sri City, Andhra Pradesh</li>
              </ul>
            </div>
          </div>
          
          <div className="lp-footer-bottom">
            <p>&copy; {new Date().getFullYear()} Brew & Book. All rights reserved.</p>
            <div className="lp-footer-links">
              <button 
                className="lp-footer-link" 
                onClick={() => console.log('Privacy Policy clicked')}
              >
                Privacy Policy
              </button>
              <button 
                className="lp-footer-link" 
                onClick={() => console.log('Terms of Service clicked')}
              >
                Terms of Service
              </button>
              <button 
                className="lp-footer-link" 
                onClick={() => console.log('Cookie Policy clicked')}
              >
                Cookie Policy
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;