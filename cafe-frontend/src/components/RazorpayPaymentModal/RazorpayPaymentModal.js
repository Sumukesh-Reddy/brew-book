// src/components/RazorpayPaymentModal/RazorpayPaymentModal.js
import React, { useState, useEffect } from 'react';
import './RazorpayPaymentModal.css';

const RazorpayPaymentModal = ({ 
  bookingId, 
  amount, 
  customerDetails, 
  cafeDetails,
  onSuccess, 
  onClose,
  embedded = false 
}) => {
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState('');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log('Razorpay script loaded successfully');
      setRazorpayLoaded(true);
    };
    script.onerror = () => {
      setError('Failed to load payment gateway. Please try again.');
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const createRazorpayOrder = async () => {
    try {
      let numericBookingId;
      
      if (typeof bookingId === 'number') {
        numericBookingId = bookingId;
      } else if (typeof bookingId === 'string') {
        numericBookingId = parseInt(bookingId, 10);
        if (isNaN(numericBookingId)) {
          throw new Error(`Cannot parse bookingId: ${bookingId}`);
        }
      } else {
        throw new Error(`Invalid bookingId type: ${typeof bookingId}`);
      }

      const response = await fetch('http://localhost:8080/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: numericBookingId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to create payment order');
      }
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw error;
    }
  };

  const verifyPayment = async (paymentData) => {
    try {
      const response = await fetch('http://localhost:8080/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  };

  const handleRazorpayPayment = async () => {
    if (!razorpayLoaded) {
      setError('Payment gateway not loaded. Please try again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderData = await createRazorpayOrder();
      
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: cafeDetails?.cafeName || 'Brew & Book Cafe',
        description: `Payment for Booking #${bookingId}`,
        image: 'https://via.placeholder.com/100x100?text=Cafe',
        order_id: orderData.razorpayOrderId,
        handler: async (response) => {
          setProcessingPayment(true);
          
          try {
            const numericBookingId = typeof bookingId === 'number' ? bookingId : Number(bookingId);
            
            const verificationData = {
              bookingId: numericBookingId,
              amount: amount,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              paymentMethod: 'razorpay'
            };
            
            const result = await verifyPayment(verificationData);
            
            if (result.success) {
              onSuccess(result.data);
            } else {
              setError(result.message || 'Payment verification failed');
            }
          } catch (error) {
            setError('Payment verification failed: ' + error.message);
          } finally {
            setProcessingPayment(false);
            setLoading(false);
          }
        },
        prefill: {
          name: customerDetails?.name || '',
          email: customerDetails?.email || '',
          contact: customerDetails?.phone || ''
        },
        notes: {
          bookingId: String(bookingId)
        },
        theme: {
          color: '#8b4513'
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setError('Payment cancelled');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      setError(error.message || 'Payment failed. Please try again.');
      setLoading(false);
    }
  };

  // If embedded, just return the payment button
  if (embedded) {
    return (
      <div className="rzp-embedded">
        <button 
          className="rzp-pay-btn rzp-full-width"
          onClick={handleRazorpayPayment}
          disabled={loading || processingPayment}
        >
          {loading || processingPayment ? (
            <><i className="fas fa-spinner fa-spin"></i> Processing...</>
          ) : (
            <>Pay with Razorpay</>
          )}
        </button>
        
        {error && (
          <div className="rzp-error rzp-small">
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        )}
      </div>
    );
  }

  // Full modal view
  return (
    <div className="rzp-modal-overlay" onClick={onClose}>
      <div className="rzp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rzp-modal-header">
          <h3><i className="fas fa-credit-card"></i> Razorpay Payment</h3>
          <button className="rzp-modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="rzp-modal-body">
          <div className="rzp-amount-display">
            <span className="rzp-amount-label">Amount:</span>
            <span className="rzp-amount-value">₹{amount?.toFixed(2)}</span>
          </div>

          {error && (
            <div className="rzp-error">
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}

          <div className="rzp-payment-info">
            <p><i className="fas fa-user"></i> {customerDetails?.name}</p>
            <p><i className="fas fa-phone"></i> {customerDetails?.phone}</p>
            <p><i className="fas fa-envelope"></i> {customerDetails?.email}</p>
          </div>

          <div className="rzp-payment-features">
            <h4>Accepted Payment Methods:</h4>
            <ul>
              <li><i className="fas fa-credit-card"></i> Credit/Debit Cards</li>
              <li><i className="fas fa-mobile-alt"></i> UPI (GPay, PhonePe, Paytm)</li>
              <li><i className="fas fa-university"></i> Net Banking</li>
              <li><i className="fas fa-wallet"></i> Wallets</li>
            </ul>
          </div>
        </div>

        <div className="rzp-modal-footer">
          <button className="rzp-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="rzp-pay-btn"
            onClick={handleRazorpayPayment}
            disabled={loading || processingPayment}
          >
            {loading || processingPayment ? (
              <><i className="fas fa-spinner fa-spin"></i> Processing...</>
            ) : (
              <>Pay ₹{amount?.toFixed(2)}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RazorpayPaymentModal;