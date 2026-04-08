// src/components/Receipt/Receipt.js
import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import './Receipt.css';

const Receipt = ({ 
  bookingDetails, 
  orderItems, 
  paymentDetails, 
  cafeDetails, 
  onClose,
  onDownload 
}) => {
  const receiptRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Receipt_${bookingDetails?.bookingId || 'booking'}`,
    onAfterPrint: () => console.log('Print completed'),
  });

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const calculateSubtotal = () => {
    return orderItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.05;
  };

  const calculateTableCharge = () => {
    return bookingDetails?.tableRevenue || 0;
  };

  const calculateGrandTotal = () => {
    return calculateSubtotal() + calculateTax() + calculateTableCharge();
  };

  return (
    <div className="receipt-modal-overlay" onClick={onClose}>
      <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="receipt-header">
          <h2><i className="fas fa-receipt"></i> Payment Receipt</h2>
          <div className="receipt-header-actions">
            <button className="receipt-print-btn" onClick={handlePrint}>
              <i className="fas fa-print"></i> Print
            </button>
            <button className="receipt-download-btn" onClick={onDownload}>
              <i className="fas fa-download"></i> Download
            </button>
            <button className="receipt-close-btn" onClick={onClose}>
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div className="receipt-content" ref={receiptRef}>
          {/* Cafe Details */}
          <div className="receipt-cafe-details">
            <h2>{cafeDetails?.cafeName || 'Cafe Name'}</h2>
            {cafeDetails?.address && (
              <p>
                {cafeDetails.address.street}, {cafeDetails.address.city}, {cafeDetails.address.pincode}
              </p>
            )}
            <p>GST: {cafeDetails?.gstNumber || 'N/A'}</p>
          </div>

          {/* Receipt Info */}
          <div className="receipt-info">
            <div className="receipt-info-row">
              <span>Receipt No:</span>
              <strong>RCP-{bookingDetails?.bookingId}-{Date.now().toString().slice(-6)}</strong>
            </div>
            <div className="receipt-info-row">
              <span>Date & Time:</span>
              <strong>{formatDate(new Date())}</strong>
            </div>
            <div className="receipt-info-row">
              <span>Payment ID:</span>
              <strong>{paymentDetails?.paymentId || paymentDetails?.razorpayPaymentId || 'CASH'}</strong>
            </div>
            <div className="receipt-info-row">
              <span>Payment Method:</span>
              <strong className="payment-method-badge">
                {paymentDetails?.method || paymentDetails?.paymentMethod || 'Cash'}
              </strong>
            </div>
          </div>

          {/* Customer Details */}
          <div className="receipt-customer-details">
            <h4>Customer Details</h4>
            <div className="receipt-customer-grid">
              <div>
                <span>Name:</span>
                <strong>{bookingDetails?.customerName}</strong>
              </div>
              <div>
                <span>Phone:</span>
                <strong>{bookingDetails?.customerPhone || 'N/A'}</strong>
              </div>
              <div>
                <span>Table No:</span>
                <strong>#{bookingDetails?.tableNumber || 'N/A'}</strong>
              </div>
              <div>
                <span>Booking ID:</span>
                <strong>#{bookingDetails?.bookingId}</strong>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="receipt-items">
            <h4>Order Summary</h4>
            <table className="receipt-items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {orderItems?.map((item, index) => (
                  <tr key={index}>
                    <td>
                      {item.itemName || item.name}
                      {item.specialRequest && (
                        <small className="receipt-item-note">{item.specialRequest}</small>
                      )}
                    </td>
                    <td>{item.quantity}</td>
                    <td>₹{item.price?.toFixed(2)}</td>
                    <td className="receipt-amount">₹{(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bill Summary */}
          <div className="receipt-summary">
            <div className="receipt-summary-row">
              <span>Subtotal:</span>
              <span>₹{calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className="receipt-summary-row">
              <span>Tax (5% GST):</span>
              <span>₹{calculateTax().toFixed(2)}</span>
            </div>
            <div className="receipt-summary-row">
              <span>Table Charges:</span>
              <span>₹{calculateTableCharge().toFixed(2)}</span>
            </div>
            <div className="receipt-summary-row receipt-total">
              <span>Grand Total:</span>
              <span>₹{calculateGrandTotal().toFixed(2)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="receipt-footer">
            <p>Thank you for dining with us!</p>
            <p className="receipt-footer-small">This is a computer generated receipt</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Receipt;