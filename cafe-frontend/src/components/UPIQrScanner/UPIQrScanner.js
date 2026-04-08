// src/components/UPIQrScanner/UPIQrScanner.js
import React, { useState, useEffect, useRef } from 'react';
import './UPIQrScanner.css';

const UPIQrScanner = ({ 
  amount, 
  customerName, 
  cafeName, 
  bookingId,
  onSuccess,
  onClose 
}) => {
  const [selectedApp, setSelectedApp] = useState('gpay');
  const [qrCode, setQrCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, verifying, success, failed
  const intervalRef = useRef(null);

  // UPI IDs for different apps
  const upiIds = {
    gpay: 'sumukeshreddy1@oksbi', 
    phonepe: 'sumukeshreddy1@oksbi',
    paytm: 'sumukeshreddy1@oksbi',  
    bhim: 'sumukeshreddy1@oksbi'    
  };

  useEffect(() => {
    generateQRCode();
    
    // Timer for QR code expiry
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          generateQRCode(); // Regenerate QR code
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    // Simulate payment verification (in production, use webhooks)
    const checkPaymentInterval = setInterval(() => {
      // This would be replaced with actual payment verification
      // For demo, we'll simulate a payment after 30 seconds
      if (paymentStatus === 'pending') {
        // In production, you would check with your payment gateway
      }
    }, 5000);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(checkPaymentInterval);
    };
  }, [selectedApp]);

  const generateQRCode = () => {
    // Create UPI payment URL
    const upiUrl = `upi://pay?pa=${encodeURIComponent(upiIds[selectedApp])}&pn=${encodeURIComponent(cafeName || 'Cafe')}&am=${amount}&cu=INR&tn=Booking%20${bookingId}`;
    
    // In production, you would use a QR code generation library
    // For now, we'll create a simple representation
    setQrCode(upiUrl);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAppSelect = (app) => {
    setSelectedApp(app);
    setTimeLeft(300);
  };

  const verifyPayment = async () => {
    setPaymentStatus('verifying');
    
    try {
      // In production, this would call your backend to verify payment
      // For demo, we'll simulate verification
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setPaymentStatus('success');
      onSuccess();
    } catch (error) {
      setPaymentStatus('failed');
    }
  };

  const openUPIApp = () => {
    const upiUrl = qrCode;
    window.location.href = upiUrl;
  };

  return (
    <div className="upi-scanner-overlay" onClick={onClose}>
      <div className="upi-scanner-modal" onClick={(e) => e.stopPropagation()}>
        <div className="upi-scanner-header">
          <h2><i className="fas fa-qrcode"></i> Scan & Pay</h2>
          <button className="upi-scanner-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="upi-scanner-body">
          <div className="upi-payment-info">
            <div className="upi-amount">
              <span>Amount to Pay:</span>
              <h3>₹{amount?.toFixed(2)}</h3>
            </div>
            <div className="upi-timer">
              <i className="fas fa-clock"></i>
              <span>QR Code expires in: {formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* App Selection */}
          <div className="upi-app-selector">
            <button 
              className={`upi-app-btn ${selectedApp === 'gpay' ? 'active' : ''}`}
              onClick={() => handleAppSelect('gpay')}
            >
              <img src="https://cdn.worldvectorlogo.com/logos/google-pay-1.svg" alt="GPay" />
              <span>GPay</span>
            </button>
            <button 
              className={`upi-app-btn ${selectedApp === 'phonepe' ? 'active' : ''}`}
              onClick={() => handleAppSelect('phonepe')}
            >
              <img src="https://cdn.worldvectorlogo.com/logos/phonepe-1.svg" alt="PhonePe" />
              <span>PhonePe</span>
            </button>
            <button 
              className={`upi-app-btn ${selectedApp === 'paytm' ? 'active' : ''}`}
              onClick={() => handleAppSelect('paytm')}
            >
              <img src="https://cdn.worldvectorlogo.com/logos/paytm-1.svg" alt="Paytm" />
              <span>Paytm</span>
            </button>
            <button 
              className={`upi-app-btn ${selectedApp === 'bhim' ? 'active' : ''}`}
              onClick={() => handleAppSelect('bhim')}
            >
              <img src="https://cdn.worldvectorlogo.com/logos/bhim-1.svg" alt="BHIM" />
              <span>BHIM</span>
            </button>
          </div>

          {/* QR Code Display */}
          <div className="upi-qr-container">
            <div className="upi-qr-code">
              {/* In production, use a QR code library */}
              <div className="upi-qr-placeholder">
                <i className="fas fa-qrcode"></i>
                <p>Scan this QR code with {selectedApp === 'gpay' ? 'GPay' : selectedApp === 'phonepe' ? 'PhonePe' : selectedApp === 'paytm' ? 'Paytm' : 'BHIM UPI'} app</p>
              </div>
            </div>
            <p className="upi-qr-hint">or</p>
            <button className="upi-open-app-btn" onClick={openUPIApp}>
              <i className="fas fa-external-link-alt"></i> Open {selectedApp === 'gpay' ? 'GPay' : selectedApp === 'phonepe' ? 'PhonePe' : selectedApp === 'paytm' ? 'Paytm' : 'BHIM'} App
            </button>
          </div>

          {/* Payment Status */}
          {paymentStatus === 'verifying' && (
            <div className="upi-verifying">
              <div className="upi-spinner"></div>
              <p>Verifying payment...</p>
            </div>
          )}

          {paymentStatus === 'success' && (
            <div className="upi-success">
              <i className="fas fa-check-circle"></i>
              <p>Payment Successful!</p>
            </div>
          )}

          {paymentStatus === 'failed' && (
            <div className="upi-failed">
              <i className="fas fa-times-circle"></i>
              <p>Payment verification failed</p>
              <button className="upi-retry-btn" onClick={() => setPaymentStatus('pending')}>
                Try Again
              </button>
            </div>
          )}

          {/* Instructions */}
          <div className="upi-instructions">
            <h4>How to Pay:</h4>
            <ol>
              <li>Open your {selectedApp === 'gpay' ? 'GPay' : selectedApp === 'phonepe' ? 'PhonePe' : selectedApp === 'paytm' ? 'Paytm' : 'BHIM'} app</li>
              <li>Tap on "Scan QR Code" option</li>
              <li>Scan the QR code above</li>
              <li>Verify amount and complete payment</li>
              <li>Wait for confirmation</li>
            </ol>
          </div>

          {/* Manual Verification (for demo) */}
          <button className="upi-verify-manual" onClick={verifyPayment}>
            <i className="fas fa-check"></i> I've Completed the Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default UPIQrScanner;