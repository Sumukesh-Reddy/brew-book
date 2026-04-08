// src/components/PaymentModal/PaymentModal.js
import React, { useState } from 'react';
import RazorpayPaymentModal from '../RazorpayPaymentModal/RazorpayPaymentModal';
import UPIPaymentModal from '../UPIPaymentModal/UPIPaymentModal';
import './PaymentModal.css';

const PaymentModal = ({
  bookingId,
  amount,
  customerDetails,
  cafeDetails,
  onSuccess,
  onClose
}) => {
  const [paymentMethod, setPaymentMethod] = useState('razorpay'); // 'razorpay' or 'upi'

  return (
    <div className="pm-modal-overlay" onClick={onClose}>
      <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pm-modal-header">
          <h2><i className="fas fa-credit-card"></i> Complete Payment</h2>
          <button className="pm-modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="pm-modal-body">
          {/* Payment Method Tabs */}
          <div className="pm-method-tabs">
            <button
              className={`pm-method-tab ${paymentMethod === 'razorpay' ? 'pm-active' : ''}`}
              onClick={() => setPaymentMethod('razorpay')}
            >
              <i className="fas fa-credit-card"></i>
              <span>Razorpay</span>
              <small>Cards, UPI, NetBanking</small>
            </button>
            <button
              className={`pm-method-tab ${paymentMethod === 'upi' ? 'pm-active' : ''}`}
              onClick={() => setPaymentMethod('upi')}
            >
              <i className="fas fa-qrcode"></i>
              <span>QR Code</span>
              <small>GPay, PhonePe, Paytm</small>
            </button>
          </div>

          {/* Amount Display */}
          <div className="pm-amount-display">
            <span className="pm-amount-label">Total Amount:</span>
            <span className="pm-amount-value">₹{amount?.toFixed(2)}</span>
          </div>

          {/* Render selected payment method */}
          {paymentMethod === 'razorpay' ? (
            <RazorpayPaymentModal
              bookingId={bookingId}
              amount={amount}
              customerDetails={customerDetails}
              cafeDetails={cafeDetails}
              onSuccess={onSuccess}
              onClose={onClose}
              embedded={true}
            />
          ) : (
            <UPIPaymentModal
              bookingId={bookingId}
              amount={amount}
              customerDetails={customerDetails}
              cafeDetails={cafeDetails}
              onSuccess={onSuccess}
              onClose={onClose}
              embedded={true}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;