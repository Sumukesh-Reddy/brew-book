// src/services/razorpayService.js

const RAZORPAY_KEY_ID = 'rzp_test_SO2HYyrhu02R9s'; // Replace with your actual key

export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export const createRazorpayOrder = async (bookingId) => {
  try {
    const response = await fetch('http://localhost:8080/api/payments/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bookingId }),
    });
    
    const data = await response.json();
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

export const verifyPayment = async (paymentData) => {
  try {
    const response = await fetch('http://localhost:8080/api/payments/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};

export const openRazorpayCheckout = (options) => {
  return new Promise((resolve, reject) => {
    const razorpay = new window.Razorpay(options);
    
    razorpay.on('payment.success', (response) => {
      resolve(response);
    });
    
    razorpay.on('payment.error', (error) => {
      reject(error);
    });
    
    razorpay.on('payment.failed', (response) => {
      reject(response.error);
    });
    
    razorpay.open();
  });
};