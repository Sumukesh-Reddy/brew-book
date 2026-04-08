// src/components/UPIPaymentModal/UPIPaymentModal.js
import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import './UPIPaymentModal.css';

const UPIPaymentModal = ({ 
  bookingId, 
  amount, 
  customerDetails, 
  cafeDetails,
  onSuccess, 
  onClose,
  embedded = false 
}) => {
  const [selectedApp, setSelectedApp] = useState('gpay');
  const [timeLeft, setTimeLeft] = useState(300);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [paymentId, setPaymentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const qrCanvasRef = useRef(null);

  const upiIds = {
    gpay: 'sumukeshreddy1@oksbi',
    phonepe: 'sumukeshreddy1@oksbi',
    paytm: 'sumukeshreddy1@oksbi',
    bhim: 'sumukeshreddy1@oksbi',
    any: 'sumukeshreddy1@oksbi'
  };

  const appNames = {
    gpay: 'Google Pay',
    phonepe: 'PhonePe',
    paytm: 'Paytm',
    bhim: 'BHIM UPI',
    any: 'Any UPI App'
  };

  const generateQRCode = async () => {
    try {
      const upiId = upiIds[selectedApp] || upiIds.any;
      const payeeName = encodeURIComponent(cafeDetails?.cafeName || 'Brew & Book Cafe');
      
      const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${payeeName}&am=${amount.toFixed(2)}&cu=INR&tn=Booking%20${bookingId}`;
      
      const canvas = qrCanvasRef.current;
      if (canvas) {
        await QRCode.toCanvas(canvas, upiUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        });
      }
    } catch (err) {
      setError('Failed to generate QR code. Please try again.');
    }
  };

  useEffect(() => {
    generateQRCode();
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          generateQRCode();
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedApp, amount, bookingId]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const openUPIApp = () => {
    const upiId = upiIds[selectedApp] || upiIds.any;
    const payeeName = encodeURIComponent(cafeDetails?.cafeName || 'Cafe');
    const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${payeeName}&am=${amount.toFixed(2)}&cu=INR&tn=Booking%20${bookingId}`;
    window.location.href = upiUrl;
    
    setTimeout(() => {
      simulatePayment();
    }, 5000);
  };

  const simulatePayment = async () => {
    setLoading(true);
    setPaymentStatus('verifying');
    
    try {
      const mockPaymentId = `UPI${Date.now()}${Math.floor(Math.random() * 1000)}`;
      setPaymentId(mockPaymentId);
      
      const response = await fetch('http://localhost:8080/api/payments/verify-upi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          amount,
          upiTransactionId: mockPaymentId,
          upiApp: selectedApp,
          status: 'success'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPaymentStatus('success');
        setReceiptData({
          bookingId,
          paymentId: mockPaymentId,
          amount,
          customerName: customerDetails?.name,
          customerPhone: customerDetails?.phone,
          cafeName: cafeDetails?.cafeName,
          cafeAddress: cafeDetails?.address,
          paymentMethod: `UPI (${appNames[selectedApp]})`,
          date: new Date().toISOString()
        });
        setShowReceipt(true);
        onSuccess(data.data);
      } else {
        setPaymentStatus('failed');
        setError(data.message || 'Payment verification failed');
      }
    } catch (error) {
      setPaymentStatus('failed');
      setError('Payment verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = () => {
    if (!receiptData) return;
    
    const receiptHTML = generateReceiptHTML(receiptData);
    const blob = new Blob([receiptHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt_${receiptData.bookingId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateReceiptHTML = (data) => {
    const date = new Date(data.date).toLocaleString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Payment Receipt</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .receipt { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #8b4513; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { margin: 0; color: #2c1810; font-size: 28px; }
        .header p { margin: 5px 0; color: #666; }
        .details { margin-bottom: 20px; }
        .row { display: flex; justify-content: space-between; margin-bottom: 10px; padding: 5px 0; border-bottom: 1px dashed #ddd; }
        .row.total { border-top: 2px solid #333; border-bottom: none; padding-top: 10px; font-weight: bold; font-size: 18px; }
        .label { color: #666; }
        .value { font-weight: 600; color: #2c1810; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
        .success-icon { text-align: center; margin-bottom: 20px; }
        .success-icon i { font-size: 60px; color: #27ae60; }
        .payment-method { background: #f8f5f0; padding: 10px; border-radius: 5px; margin: 15px 0; text-align: center; }
        @media print { body { background: white; } .receipt { box-shadow: none; } }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="success-icon"><i>✓</i></div>
        <div class="header">
            <h1>${data.cafeName || 'Brew & Book Cafe'}</h1>
            <p>${data.cafeAddress ? `${data.cafeAddress.street}, ${data.cafeAddress.city}` : ''}</p>
            <p>GST: 27ABCDE1234F1Z5</p>
        </div>
        <div class="details">
            <div class="row"><span class="label">Receipt No:</span><span class="value">RCP-${data.bookingId}-${Date.now().toString().slice(-6)}</span></div>
            <div class="row"><span class="label">Date & Time:</span><span class="value">${date}</span></div>
            <div class="row"><span class="label">Transaction ID:</span><span class="value">${data.paymentId}</span></div>
            <div class="payment-method"><strong>Payment Method:</strong> ${data.paymentMethod}</div>
            <div class="row"><span class="label">Customer Name:</span><span class="value">${data.customerName || 'Guest'}</span></div>
            <div class="row"><span class="label">Booking ID:</span><span class="value">#${data.bookingId}</span></div>
            <div class="row total"><span class="label">Total Amount:</span><span class="value">₹${data.amount.toFixed(2)}</span></div>
        </div>
        <div class="footer">
            <p>Thank you for dining with us!</p>
            <p>This is a computer generated receipt</p>
        </div>
    </div>
</body>
</html>
    `;
  };

  const handlePrint = () => {
    if (!receiptData) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(generateReceiptHTML(receiptData));
    printWindow.document.close();
    printWindow.print();
  };

  // If showing receipt
  if (showReceipt) {
    return (
      <div className="upip-receipt-view">
        <div className="upip-receipt-content">
          <div className="upip-receipt-header">
            <h3>{cafeDetails?.cafeName || 'Brew & Book Cafe'}</h3>
            {cafeDetails?.address && (
              <p>{cafeDetails.address.street}, {cafeDetails.address.city}</p>
            )}
          </div>

          <div className="upip-receipt-details">
            <div className="upip-receipt-row">
              <span>Receipt No:</span>
              <strong>RCP-{receiptData?.bookingId}-{Date.now().toString().slice(-6)}</strong>
            </div>
            <div className="upip-receipt-row">
              <span>Date & Time:</span>
              <strong>{new Date().toLocaleString()}</strong>
            </div>
            <div className="upip-receipt-row">
              <span>Transaction ID:</span>
              <strong>{receiptData?.paymentId}</strong>
            </div>
            <div className="upip-receipt-row">
              <span>Payment Method:</span>
              <strong className="upip-payment-badge">{receiptData?.paymentMethod}</strong>
            </div>
            <div className="upip-receipt-row">
              <span>Customer Name:</span>
              <strong>{receiptData?.customerName || 'Guest'}</strong>
            </div>
            <div className="upip-receipt-row upip-receipt-total">
              <span>Total Amount:</span>
              <strong>₹{receiptData?.amount.toFixed(2)}</strong>
            </div>
          </div>

          <div className="upip-receipt-footer">
            <p>Thank you for dining with us!</p>
          </div>
        </div>

        <div className="upip-receipt-actions">
          <button className="upip-print-btn" onClick={handlePrint}>
            <i className="fas fa-print"></i> Print
          </button>
          <button className="upip-download-btn" onClick={downloadReceipt}>
            <i className="fas fa-download"></i> Download
          </button>
          <button className="upip-close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    );
  }

  // If embedded, just return the QR code section
  if (embedded) {
    return (
      <div className="upip-embedded">
        <div className="upip-app-selector">
          <button 
            className={`upip-app-btn ${selectedApp === 'gpay' ? 'active' : ''}`}
            onClick={() => setSelectedApp('gpay')}
          >
            <img src="https://cdn.worldvectorlogo.com/logos/google-pay-1.svg" alt="GPay" />
          </button>
          <button 
            className={`upip-app-btn ${selectedApp === 'phonepe' ? 'active' : ''}`}
            onClick={() => setSelectedApp('phonepe')}
          >
            <img src="https://cdn.worldvectorlogo.com/logos/phonepe-1.svg" alt="PhonePe" />
          </button>
          <button 
            className={`upip-app-btn ${selectedApp === 'paytm' ? 'active' : ''}`}
            onClick={() => setSelectedApp('paytm')}
          >
            <img src="https://cdn.worldvectorlogo.com/logos/paytm-1.svg" alt="Paytm" />
          </button>
          <button 
            className={`upip-app-btn ${selectedApp === 'bhim' ? 'active' : ''}`}
            onClick={() => setSelectedApp('bhim')}
          >
            <img src="https://cdn.worldvectorlogo.com/logos/bhim-1.svg" alt="BHIM" />
          </button>
        </div>

        <div className="upip-timer">
          <i className="fas fa-clock"></i>
          <span>QR expires in: {formatTime(timeLeft)}</span>
        </div>

        <div className="upip-qr-container">
          <canvas ref={qrCanvasRef} className="upip-qr-code"></canvas>
          <p className="upip-qr-hint">Scan with {appNames[selectedApp]}</p>
          <button className="upip-open-app-btn" onClick={openUPIApp}>
            <i className="fas fa-external-link-alt"></i> Open App
          </button>
        </div>

        {paymentStatus === 'verifying' && (
          <div className="upip-verifying">
            <div className="upip-spinner"></div>
            <p>Verifying payment...</p>
          </div>
        )}

        {error && (
          <div className="upip-error">
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        )}

        <button 
          className="upip-verify-manual"
          onClick={simulatePayment}
          disabled={loading}
        >
          {loading ? 'Verifying...' : "I've Completed Payment"}
        </button>
      </div>
    );
  }

  // Full modal view
  return (
    <div className="upip-modal-overlay" onClick={onClose}>
      <div className="upip-modal" onClick={(e) => e.stopPropagation()}>
        <div className="upip-modal-header">
          <h2><i className="fas fa-qrcode"></i> Scan & Pay with UPI</h2>
          <button className="upip-modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="upip-modal-body">
          <div className="upip-amount-display">
            <span className="upip-amount-label">Amount to Pay:</span>
            <span className="upip-amount-value">₹{amount?.toFixed(2)}</span>
          </div>

          <div className="upip-app-selector">
            <button 
              className={`upip-app-btn ${selectedApp === 'gpay' ? 'active' : ''}`}
              onClick={() => setSelectedApp('gpay')}
            >
              <img src="https://cdn.worldvectorlogo.com/logos/google-pay-1.svg" alt="GPay" />
              <span>GPay</span>
            </button>
            <button 
              className={`upip-app-btn ${selectedApp === 'phonepe' ? 'active' : ''}`}
              onClick={() => setSelectedApp('phonepe')}
            >
              <img src="https://cdn.worldvectorlogo.com/logos/phonepe-1.svg" alt="PhonePe" />
              <span>PhonePe</span>
            </button>
            <button 
              className={`upip-app-btn ${selectedApp === 'paytm' ? 'active' : ''}`}
              onClick={() => setSelectedApp('paytm')}
            >
              <img src="https://cdn.worldvectorlogo.com/logos/paytm-1.svg" alt="Paytm" />
              <span>Paytm</span>
            </button>
            <button 
              className={`upip-app-btn ${selectedApp === 'bhim' ? 'active' : ''}`}
              onClick={() => setSelectedApp('bhim')}
            >
              <img src="https://cdn.worldvectorlogo.com/logos/bhim-1.svg" alt="BHIM" />
              <span>BHIM</span>
            </button>
          </div>

          <div className="upip-timer">
            <i className="fas fa-clock"></i>
            <span>QR Code expires in: {formatTime(timeLeft)}</span>
          </div>

          <div className="upip-qr-container">
            <canvas ref={qrCanvasRef} className="upip-qr-code"></canvas>
            <p className="upip-qr-hint">Scan this QR code with {appNames[selectedApp]}</p>
            <button className="upip-open-app-btn" onClick={openUPIApp}>
              <i className="fas fa-external-link-alt"></i> Open {appNames[selectedApp]}
            </button>
          </div>

          {paymentStatus === 'verifying' && (
            <div className="upip-verifying">
              <div className="upip-spinner"></div>
              <p>Verifying payment...</p>
            </div>
          )}

          {error && (
            <div className="upip-error">
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}

          <div className="upip-instructions">
            <h4>How to Pay:</h4>
            <ol>
              <li>Open {appNames[selectedApp]} on your phone</li>
              <li>Tap on "Scan QR Code"</li>
              <li>Scan the QR code above</li>
              <li>Verify amount: ₹{amount?.toFixed(2)}</li>
              <li>Complete the payment</li>
            </ol>
          </div>

          <button 
            className="upip-verify-manual" 
            onClick={simulatePayment}
            disabled={loading}
          >
            {loading ? (
              <><i className="fas fa-spinner fa-spin"></i> Verifying...</>
            ) : (
              <><i className="fas fa-check"></i> I've Completed the Payment</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UPIPaymentModal;