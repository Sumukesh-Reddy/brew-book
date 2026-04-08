import React, { useState, useEffect } from 'react';
import './UnifiedCart.css';

const UnifiedCart = ({ cartItems, customerId, customerPhone: initialPhone, onClose, onSuccess, onUpdateCart }) => {
  const [items, setItems] = useState(cartItems || []);
  const [customerPhone, setCustomerPhone] = useState(initialPhone || '');
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityResults, setAvailabilityResults] = useState({});

  // Group items by cafe for better organization
  const itemsByCafe = items.reduce((acc, item) => {
    if (!acc[item.cafeId]) {
      acc[item.cafeId] = {
        cafeId: item.cafeId,
        cafeName: item.cafeName,
        cafeCity: item.cafeCity,
        items: []
      };
    }
    acc[item.cafeId].items.push(item);
    return acc;
  }, {});

  const cafesList = Object.values(itemsByCafe);

  const updateQuantity = (cafeId, tableTypeId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(cafeId, tableTypeId);
      return;
    }
    
    const updatedItems = items.map(item =>
      item.cafeId === cafeId && item.tableTypeId === tableTypeId
        ? { ...item, quantity: newQuantity }
        : item
    );
    setItems(updatedItems);
    onUpdateCart(updatedItems);
  };

  const removeItem = (cafeId, tableTypeId) => {
    const updatedItems = items.filter(
      item => !(item.cafeId === cafeId && item.tableTypeId === tableTypeId)
    );
    setItems(updatedItems);
    onUpdateCart(updatedItems);
  };

  const updateSpecialRequests = (cafeId, tableTypeId, requests) => {
    const updatedItems = items.map(item =>
      item.cafeId === cafeId && item.tableTypeId === tableTypeId
        ? { ...item, specialRequests: requests }
        : item
    );
    setItems(updatedItems);
    onUpdateCart(updatedItems);
  };

  const calculateItemTotal = (item) => {
    const hours = item.durationMinutes / 60;
    return item.quantity * (item.pricePerHour * hours);
  };

  const calculateCafeSubtotal = (cafeItems) => {
    return cafeItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const checkAvailability = async () => {
    setCheckingAvailability(true);
    setAvailabilityResults({});

    try {
      // Check availability for each cafe separately
      const availabilityPromises = cafesList.map(async (cafe) => {
        // We need to check each item's time separately since they might have different times
        const cafeResults = [];
        for (const item of cafe.items) {
          const res = await fetch(
            `http://localhost:8080/api/tables/availability/detailed/${cafe.cafeId}?dateTime=${item.bookingDateTime}&duration=${item.durationMinutes}`
          );
          const data = await res.json();
          cafeResults.push({
            item,
            data: data.success ? data.data : null
          });
        }
        return { cafeId: cafe.cafeId, results: cafeResults };
      });

      const results = await Promise.all(availabilityPromises);
      
      // Check each item's availability
      const unavailableItems = [];
      results.forEach(cafeResult => {
        cafeResult.results.forEach(({ item, data }) => {
          if (data && data.tableTypes) {
            const tableTypeInfo = data.tableTypes.find(t => t.tableTypeId === item.tableTypeId);
            if (!tableTypeInfo || !tableTypeInfo.isAvailable || tableTypeInfo.availableForTime < item.quantity) {
              unavailableItems.push({
                ...item,
                available: tableTypeInfo ? tableTypeInfo.availableForTime : 0
              });
            }
          } else {
            unavailableItems.push(item);
          }
        });
      });

      if (unavailableItems.length > 0) {
        const unavailableMsg = unavailableItems.map(
          item => `${item.tableTypeName} from ${item.cafeName} at ${item.bookingDateTime} - Available: ${item.available || 0}, Requested: ${item.quantity}`
        ).join('\n');
        
        setAvailabilityResults({
          status: 'unavailable',
          message: `Some items are not available:\n${unavailableMsg}`
        });
      } else {
        setAvailabilityResults({
          status: 'available',
          message: 'All items are available for your selected times!'
        });
      }
    } catch (error) {
      console.error('Failed to check availability:', error);
      setAvailabilityResults({
        status: 'error',
        message: 'Failed to check availability. Please try again.'
      });
    } finally {
      setCheckingAvailability(false);
    }
  };

  const submitBookings = async () => {
    if (items.length === 0) {
      alert('Cart is empty');
      return;
    }

    if (!customerPhone.trim()) {
      alert('Please enter your phone number for contact');
      return;
    }

    // Validate phone number (simple validation)
    const phoneRegex = /^[0-9+\-\s]{10,15}$/;
    if (!phoneRegex.test(customerPhone.replace(/\s/g, ''))) {
      alert('Please enter a valid phone number');
      return;
    }

    setLoading(true);

    try {
      const successfulBookings = [];
      const failedBookings = [];

      // Submit bookings for each cafe separately
      for (const cafe of cafesList) {
        try {
          // Group items by time slot for the same cafe
          const itemsByTime = {};
          cafe.items.forEach(item => {
            const key = `${item.bookingDateTime}_${item.durationMinutes}`;
            if (!itemsByTime[key]) {
              itemsByTime[key] = [];
            }
            itemsByTime[key].push(item);
          });

          // Submit bookings for each time slot
          for (const timeKey in itemsByTime) {
            const timeItems = itemsByTime[timeKey];
            const [bookingDateTime, durationMinutes] = timeKey.split('_');
            
            const requestBody = {
              cafeId: Number(cafe.cafeId),
              customerId: Number(customerId),
              customerPhone: customerPhone,
              items: timeItems.map(item => ({
                tableTypeId: item.tableTypeId,
                tableTypeName: item.tableTypeName,
                quantity: item.quantity,
                specialRequests: item.specialRequests || ''
              })),
              bookingDateTime: bookingDateTime,
              durationMinutes: parseInt(durationMinutes),
              notes: timeItems.map(i => i.specialRequests).filter(Boolean).join('; ') || ''
            };

            console.log(`Sending booking for ${cafe.cafeName} at ${bookingDateTime}:`, requestBody);

            const res = await fetch('http://localhost:8080/api/tables/book-cart', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody)
            });

            const data = await res.json();
            
            if (data.success) {
              successfulBookings.push({
                cafeName: cafe.cafeName,
                dateTime: bookingDateTime,
                bookings: data.data || []
              });
            } else {
              failedBookings.push({
                cafeName: cafe.cafeName,
                dateTime: bookingDateTime,
                reason: data.message || 'Booking failed'
              });
            }
          }
        } catch (error) {
          console.error(`Failed to submit booking for ${cafe.cafeName}:`, error);
          failedBookings.push({
            cafeName: cafe.cafeName,
            reason: 'Unable to connect to server'
          });
        }
      }

      // Show results
      if (successfulBookings.length > 0) {
        const successMsg = `Successfully booked at:\n${successfulBookings.map(b => `✓ ${b.cafeName} (${b.dateTime}): ${b.bookings.length} tables`).join('\n')}`;
        
        if (failedBookings.length > 0) {
          const failMsg = `\n\nFailed at:\n${failedBookings.map(f => `✗ ${f.cafeName}${f.dateTime ? ' ('+f.dateTime+')' : ''}: ${f.reason}`).join('\n')}`;
          alert(successMsg + failMsg);
        } else {
          alert(successMsg);
        }

        // Get all successful bookings
        const allBookings = successfulBookings.flatMap(b => b.bookings);
        onSuccess(allBookings);
      } else {
        alert(`All bookings failed:\n${failedBookings.map(f => `${f.cafeName}${f.dateTime ? ' ('+f.dateTime+')' : ''}: ${f.reason}`).join('\n')}`);
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to submit bookings:', error);
      alert('Unable to connect to server. Please try again.');
      setLoading(false);
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = calculateTotal();

  return (
    <div className="uc-modal-overlay" onClick={onClose}>
      <div className="uc-modal" onClick={e => e.stopPropagation()}>
        <div className="uc-header">
          <h2>
            <i className="fas fa-shopping-cart"></i> 
            Your Cart ({totalItems} items from {cafesList.length} cafes)
          </h2>
          <button className="uc-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="uc-body">
          {/* Cart Items by Cafe */}
          <div className="uc-cart-section">
            <h3>Selected Tables</h3>
            
            {items.length === 0 ? (
              <div className="uc-empty-cart">
                <i className="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
                <small>Add tables from cafe pages</small>
              </div>
            ) : (
              <div className="uc-cafes-list">
                {cafesList.map(cafe => (
                  <div key={cafe.cafeId} className="uc-cafe-group">
                    <div className="uc-cafe-header">
                      <h4>
                        <i className="fas fa-store"></i> 
                        {cafe.cafeName}
                        {cafe.cafeCity && <span className="uc-cafe-city">{cafe.cafeCity}</span>}
                      </h4>
                      <div className="uc-cafe-subtotal">
                        Subtotal: ₹{calculateCafeSubtotal(cafe.items).toFixed(2)}
                      </div>
                    </div>

                    {cafe.items.map(item => (
                      <div key={`${cafe.cafeId}-${item.tableTypeId}-${item.bookingDateTime}`} className="uc-cart-item">
                        <div className="uc-item-info">
                          <strong>{item.tableTypeName}</strong>
                          <span>Seats: {item.seatingCapacity}</span>
                          <span className="uc-price">₹{item.pricePerHour}/hr</span>
                        </div>
                        
                        <div className="uc-item-datetime">
                          <small>
                            <i className="fas fa-calendar"></i> {new Date(item.bookingDateTime).toLocaleString()}
                          </small>
                          <small>
                            <i className="fas fa-clock"></i> {item.durationMinutes} min
                          </small>
                        </div>
                        
                        <div className="uc-item-actions">
                          <input
                            type="number"
                            min="1"
                            max={item.availableTables || 10}
                            value={item.quantity}
                            onChange={(e) => updateQuantity(
                              cafe.cafeId,
                              item.tableTypeId,
                              parseInt(e.target.value) || 1
                            )}
                            className="uc-quantity"
                          />
                          <button 
                            className="uc-remove-btn"
                            onClick={() => removeItem(cafe.cafeId, item.tableTypeId)}
                            title="Remove item"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                        
                        <div className="uc-item-total">
                          Total: ₹{calculateItemTotal(item).toFixed(2)}
                        </div>
                        
                        <input
                          type="text"
                          placeholder="Special requests"
                          value={item.specialRequests || ''}
                          onChange={(e) => updateSpecialRequests(
                            cafe.cafeId,
                            item.tableTypeId,
                            e.target.value
                          )}
                          className="uc-requests"
                        />
                      </div>
                    ))}
                  </div>
                ))}

                <div className="uc-totals">
                  <div className="uc-total-row uc-grand-total">
                    <span>Grand Total:</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Booking Details */}
          <div className="uc-booking-section">
            <h3>Booking Details</h3>
            
            <div className="uc-form-group">
              <label>Phone Number <span style={{color: '#e74c3c'}}>*</span></label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Enter your phone number"
                className="uc-input"
              />
              <small className="uc-hint">We'll use this for booking confirmation (required)</small>
            </div>

            {availabilityResults.message && (
              <div className={`uc-availability-message uc-${availabilityResults.status}`}>
                <i className={`fas fa-${availabilityResults.status === 'available' ? 'check-circle' : 'exclamation-circle'}`}></i>
                <pre>{availabilityResults.message}</pre>
              </div>
            )}

            <button 
              className="uc-check-btn"
              onClick={checkAvailability}
              disabled={checkingAvailability || items.length === 0}
            >
              {checkingAvailability ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Checking Availability...
                </>
              ) : (
                <>
                  <i className="fas fa-search"></i>
                  Check All Availability
                </>
              )}
            </button>
          </div>
        </div>

        <div className="uc-footer">
          <button className="uc-secondary-btn" onClick={onClose}>
            Continue Shopping
          </button>
          <button 
            className="uc-primary-btn"
            onClick={submitBookings}
            disabled={loading || items.length === 0 || !customerPhone.trim()}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Processing...
              </>
            ) : (
              <>
                <i className="fas fa-check"></i>
                Confirm All Bookings (₹{total.toFixed(2)})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnifiedCart;