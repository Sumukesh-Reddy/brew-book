import React, { useState, useEffect } from 'react';
import './TableCart.css';

const TableCart = ({ cafeId, customerId, onClose, onSuccess }) => {
  const [cartItems, setCartItems] = useState([]);
  const [tableTypes, setTableTypes] = useState([]);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [cafeName, setCafeName] = useState('');

  useEffect(() => {
    loadCafeDetails();
    loadTableTypes();
    loadCartFromStorage();
  }, [cafeId]);

  const loadCafeDetails = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/cafe/${cafeId}`);
      const data = await res.json();
      if (data.success) {
        setCafeName(data.data.cafeName || 'Cafe');
      }
    } catch (error) {
      console.error('Failed to load cafe details:', error);
    }
  };

  const loadTableTypes = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/table-types/cafe/${cafeId}`);
      const data = await res.json();
      if (data.success) {
        setTableTypes(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load table types:', error);
    }
  };

  const loadCartFromStorage = () => {
    // Load cart for this specific cafe only
    const cartKey = `cart_${cafeId}_${customerId}`;
    const saved = localStorage.getItem(cartKey);
    if (saved) {
      setCartItems(JSON.parse(saved));
    } else {
      setCartItems([]);
    }
  };

  const saveCartToStorage = (items) => {
    // Save cart for this specific cafe only
    const cartKey = `cart_${cafeId}_${customerId}`;
    localStorage.setItem(cartKey, JSON.stringify(items));
  };

  const addToCart = (tableType) => {
    const existing = cartItems.find(item => item.tableTypeId === tableType.id);
    if (existing) {
      const updated = cartItems.map(item =>
        item.tableTypeId === tableType.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      setCartItems(updated);
      saveCartToStorage(updated);
    } else {
      const newItem = {
        tableTypeId: tableType.id,
        tableTypeName: tableType.typeName,
        quantity: 1,
        seatingCapacity: tableType.seatingCapacityPerTable,
        pricePerHour: tableType.pricePerHour || 0,
        specialRequests: ''
      };
      const updated = [...cartItems, newItem];
      setCartItems(updated);
      saveCartToStorage(updated);
    }
  };

  const updateQuantity = (tableTypeId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(tableTypeId);
      return;
    }
    const updated = cartItems.map(item =>
      item.tableTypeId === tableTypeId
        ? { ...item, quantity: newQuantity }
        : item
    );
    setCartItems(updated);
    saveCartToStorage(updated);
  };

  const removeFromCart = (tableTypeId) => {
    const updated = cartItems.filter(item => item.tableTypeId !== tableTypeId);
    setCartItems(updated);
    saveCartToStorage(updated);
  };

  const calculateItemTotal = (item) => {
    const hours = duration / 60;
    return item.quantity * (item.pricePerHour * hours);
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const checkAvailability = async () => {
    if (!bookingDate || !bookingTime) {
      alert('Please select date and time');
      return;
    }

    const dateTime = `${bookingDate}T${bookingTime}:00`;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/tables/availability/${cafeId}?date=${dateTime}`);
      const data = await res.json();
      if (data.success) {
        setAvailability(data.data);
        
        const unavailable = cartItems.filter(item => {
          const typeAvail = data.data.tableTypes[item.tableTypeId];
          return !typeAvail || typeAvail.availableTables < item.quantity;
        });

        if (unavailable.length > 0) {
          alert(`Some items are not available: ${unavailable.map(u => u.tableTypeName).join(', ')}`);
        } else {
          alert('All items are available for your selected time!');
        }
      }
    } catch (error) {
      console.error('Failed to check availability:', error);
      alert('Failed to check availability. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitBooking = async () => {
    if (cartItems.length === 0) {
      alert('Cart is empty');
      return;
    }

    if (!bookingDate || !bookingTime) {
      alert('Please select date and time');
      return;
    }

    const dateTime = `${bookingDate}T${bookingTime}:00`;
    setLoading(true);

    try {
      const requestBody = {
        cafeId: Number(cafeId),
        customerId: Number(customerId),
        items: cartItems.map(item => ({
          tableTypeId: item.tableTypeId,
          tableTypeName: item.tableTypeName,
          quantity: item.quantity,
          specialRequests: item.specialRequests || ''
        })),
        bookingDateTime: dateTime,
        durationMinutes: duration,
        notes: notes || ''
      };

      console.log('Sending cart booking:', requestBody);

      const res = await fetch('http://localhost:8080/api/tables/book-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await res.json();
      console.log('Cart booking response:', data);
      
      if (data.success) {
        // Clear cart for this cafe only
        const cartKey = `cart_${cafeId}_${customerId}`;
        localStorage.removeItem(cartKey);
        setCartItems([]);
        
        alert(`Successfully booked ${data.data?.length || 0} tables for ₹${subtotal.toFixed(2)}!`);
        
        onSuccess(data.data || []);
      } else {
        alert(data.message || 'Failed to book tables');
      }
    } catch (error) {
      console.error('Failed to submit booking:', error);
      alert('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = calculateSubtotal();

  return (
    <div className="tc-modal-overlay" onClick={onClose}>
      <div className="tc-modal" onClick={e => e.stopPropagation()}>
        <div className="tc-header">
          <h2>
            <i className="fas fa-shopping-cart"></i> 
            Book Tables - {cafeName || 'Cafe'}
          </h2>
          <button className="tc-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="tc-body">
          {/* Table Types List */}
          <div className="tc-table-types">
            <h3>Available Tables at {cafeName}</h3>
            <div className="tc-types-grid">
              {tableTypes.map(type => (
                <div key={type.id} className="tc-type-card">
                  <div className="tc-type-info">
                    <h4>{type.typeName}</h4>
                    <p>Seats: {type.seatingCapacityPerTable}</p>
                    <p className="tc-price">₹{type.pricePerHour}/hour</p>
                    <p className="tc-available">Available: {type.availableTables || type.tableCount}</p>
                  </div>
                  <button 
                    className="tc-add-btn"
                    onClick={() => addToCart(type)}
                    disabled={(type.availableTables || 0) === 0}
                  >
                    <i className="fas fa-plus"></i> Add
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Cart */}
          <div className="tc-cart">
            <h3>Your Cart ({totalItems} items)</h3>
            
            {cartItems.length === 0 ? (
              <div className="tc-empty-cart">
                <i className="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
                <small>Add tables from the list above</small>
              </div>
            ) : (
              <>
                {cartItems.map(item => (
                  <div key={item.tableTypeId} className="tc-cart-item">
                    <div className="tc-item-info">
                      <strong>{item.tableTypeName}</strong>
                      <span>Seats: {item.seatingCapacity}</span>
                      <span>₹{item.pricePerHour}/hr</span>
                    </div>
                    
                    <div className="tc-item-actions">
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(
                          item.tableTypeId, 
                          parseInt(e.target.value) || 1
                        )}
                        className="tc-quantity"
                      />
                      <button 
                        className="tc-remove-btn"
                        onClick={() => removeFromCart(item.tableTypeId)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                    
                    <div className="tc-item-total">
                      Total: ₹{calculateItemTotal(item).toFixed(2)}
                    </div>
                    
                    <input
                      type="text"
                      placeholder="Special requests"
                      value={item.specialRequests}
                      onChange={(e) => {
                        const updated = cartItems.map(i =>
                          i.tableTypeId === item.tableTypeId
                            ? { ...i, specialRequests: e.target.value }
                            : i
                        );
                        setCartItems(updated);
                        saveCartToStorage(updated);
                      }}
                      className="tc-requests"
                    />
                  </div>
                ))}

                <div className="tc-totals">
                  <div className="tc-total-row tc-grand-total">
                    <span>Total:</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Booking Details */}
          <div className="tc-booking-details">
            <h3>Booking Details for {cafeName}</h3>
            
            <div className="tc-datetime">
              <div className="tc-field">
                <label>Date</label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="tc-field">
                <label>Time</label>
                <input
                  type="time"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                />
              </div>
              
              <div className="tc-field">
                <label>Duration</label>
                <select value={duration} onChange={(e) => setDuration(parseInt(e.target.value))}>
                  <option value="30">30 min</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                  <option value="180">3 hours</option>
                  <option value="240">4 hours</option>
                </select>
              </div>
            </div>

            <div className="tc-field">
              <label>Additional Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requirements?"
                rows="3"
              />
            </div>

            <button 
              className="tc-check-btn"
              onClick={checkAvailability}
              disabled={loading || !bookingDate || !bookingTime || cartItems.length === 0}
            >
              <i className="fas fa-search"></i> Check Availability
            </button>
          </div>
        </div>

        <div className="tc-footer">
          <button className="tc-secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="tc-primary-btn"
            onClick={submitBooking}
            disabled={loading || cartItems.length === 0 || !bookingDate || !bookingTime}
          >
            {loading ? 'Processing...' : `Confirm Booking (₹${subtotal.toFixed(2)})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableCart;