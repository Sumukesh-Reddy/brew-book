import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './CafeDetailsPage.css';

const CafeDetailsPage = () => {
  const { cafeId } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [loading, setLoading] = useState(true);
  const [cafe, setCafe] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [tableTypes, setTableTypes] = useState([]);
  const [cafeImages, setCafeImages] = useState([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const menuScrollRef = useRef(null);

  const [bookingForm, setBookingForm] = useState({
    tableTypeId: '',
    startTime: '',
    durationMinutes: 60,
    notes: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Cart state for this cafe
  const [cartItems, setCartItems] = useState([]);
  const [showLocalCart, setShowLocalCart] = useState(false);
  const [selectedTableType, setSelectedTableType] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [specialRequests, setSpecialRequests] = useState('');

  useEffect(() => {
    if (!user?.id) {
      navigate('/signin');
      return;
    }
    load();
  }, [cafeId]);

  const load = async () => {
    setLoading(true);
    try {
      // Fetch cafe details first
      const cafeRes = await fetch(`http://localhost:8080/api/cafe/${cafeId}`);
      const cafeData = await cafeRes.json();
      
      if (cafeData.success) {
        setCafe(cafeData.data);
        if (cafeData.data.images) {
          setCafeImages(cafeData.data.images);
        }
      }

      const [menuRes, tableRes] = await Promise.all([
        fetch(`http://localhost:8080/api/menu/cafe/${cafeId}`),
        fetch(`http://localhost:8080/api/table-types/cafe/${cafeId}`)
      ]);
      
      const [menuData, tableData] = await Promise.all([menuRes.json(), tableRes.json()]);

      if (menuData.success) {
        setMenuItems(menuData.data.menuItems || []);
      }

      if (tableData.success) {
        setTableTypes(tableData.data || []);
        // Set default table type if available
        if (tableData.data && tableData.data.length > 0) {
          setBookingForm(prev => ({ ...prev, tableTypeId: tableData.data[0].id.toString() }));
        }
      }
    } catch (e) {
      console.error('Failed to load cafe details:', e);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!bookingForm.startTime) {
      errors.startTime = 'Please select date & time';
    }
    if (!bookingForm.tableTypeId) {
      errors.tableTypeId = 'Please select table type';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submitBooking = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const requestBody = {
        cafeId: Number(cafeId),
        customerId: user.id,
        tableTypeId: Number(bookingForm.tableTypeId),
        startTime: bookingForm.startTime,
        durationMinutes: Number(bookingForm.durationMinutes),
        notes: bookingForm.notes || ''
      };

      console.log('Sending booking request:', requestBody);

      const res = await fetch('http://localhost:8080/api/bookings/request', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await res.json();
      console.log('Booking response:', data);
      
      if (!data.success) {
        alert(data.message || 'Booking failed');
        return;
      }
      alert('Booking request sent successfully! The owner will confirm your booking shortly.');
      navigate('/customer/dashboard');
    } catch (e) {
      console.error('Booking request failed:', e);
      alert('Unable to connect to server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Add to Unified Cart function
  const addToUnifiedCart = () => {
    if (!selectedTableType) {
      alert('Please select a table type');
      return;
    }

    if (!selectedDate || !selectedTime) {
      alert('Please select date and time');
      return;
    }

    const cartKey = `unified_cart_${user.id}`;
    const existingCart = JSON.parse(localStorage.getItem(cartKey) || '[]');
    
    const dateTime = `${selectedDate}T${selectedTime}:00`;
    
    // Check if item already exists with same cafe, table type, and time
    const existingItemIndex = existingCart.findIndex(
      item => item.cafeId === cafe?.id && 
              item.tableTypeId === selectedTableType.id &&
              item.bookingDateTime === dateTime
    );
    
    let updatedCart;
    if (existingItemIndex >= 0) {
      // Update quantity
      updatedCart = [...existingCart];
      updatedCart[existingItemIndex] = {
        ...updatedCart[existingItemIndex],
        quantity: updatedCart[existingItemIndex].quantity + selectedQuantity
      };
    } else {
      // Add new item
      updatedCart = [...existingCart, {
        cafeId: cafe?.id,
        cafeName: cafe?.cafeName,
        cafeCity: cafe?.city,
        tableTypeId: selectedTableType.id,
        tableTypeName: selectedTableType.typeName,
        seatingCapacity: selectedTableType.seatingCapacityPerTable,
        pricePerHour: selectedTableType.pricePerHour || 0,
        quantity: selectedQuantity,
        bookingDateTime: dateTime,
        durationMinutes: selectedDuration,
        specialRequests: specialRequests,
        availableTables: selectedTableType.availableTables || selectedTableType.tableCount
      }];
    }
    
    // Save to localStorage
    localStorage.setItem(cartKey, JSON.stringify(updatedCart));
    
    alert(`Added ${selectedQuantity} × ${selectedTableType.typeName} from ${cafe?.cafeName} to cart!`);
    setShowLocalCart(false);
    // Reset selections
    setSelectedTableType(null);
    setSelectedQuantity(1);
    setSelectedDate('');
    setSelectedTime('');
    setSelectedDuration(60);
    setSpecialRequests('');
  };

  const openLocalCart = () => {
    setShowLocalCart(true);
  };

  const closeLocalCart = () => {
    setShowLocalCart(false);
    setSelectedTableType(null);
    setSelectedQuantity(1);
    setSelectedDate('');
    setSelectedTime('');
    setSelectedDuration(60);
    setSpecialRequests('');
  };

  const openImageGallery = (images, startIndex = 0) => {
    if (images && images.length > 0) {
      setSelectedImages(images);
      setCurrentImageIndex(startIndex);
      setShowImageModal(true);
    }
  };

  const scrollMenu = (direction) => {
    if (menuScrollRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = menuScrollRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      menuScrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  if (loading) {
    return (
      <div className="cp-loading-container">
        <div className="cp-loading-spinner"></div>
        <p>Loading cafe details...</p>
      </div>
    );
  }

  return (
    <div className="cp-page">
      {/* Header with Back Button and Cafe Info */}
      <div className="cp-header">
        <button className="cp-back-btn" onClick={() => navigate('/customer/dashboard')}>
          <i className="fas fa-arrow-left"></i>
          <span>Back</span>
        </button>
        
        <div className="cp-cafe-info-header">
          <h1>{cafe?.cafeName || 'Cafe'}</h1>
          {cafe?.city && (
            <span className="cp-cafe-location">
              <i className="fas fa-map-marker-alt"></i> {cafe.city}
            </span>
          )}
          <p className="cp-cafe-description-header">{cafe?.description || 'Browse our delicious menu and book a table.'}</p>
        </div>
      </div>

      {/* Cafe Images Gallery */}
      {cafeImages && cafeImages.length > 0 && (
        <div className="cp-cafe-gallery">
          <div className="cp-gallery-grid">
            {cafeImages.slice(0, 4).map((img, index) => (
              <div 
                key={index} 
                className={`cp-gallery-item cp-gallery-item-${index + 1}`}
                onClick={() => openImageGallery(cafeImages, index)}
              >
                <img src={`data:${img.fileType};base64,${img.fileData}`} alt={`Cafe ${index + 1}`} />
                {img.isPrimary && <span className="cp-primary-badge">Primary</span>}
                {index === 3 && cafeImages.length > 4 && (
                  <div className="cp-more-images">
                    <span>+{cafeImages.length - 4}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="cp-content-grid">
        {/* Booking Form Section */}
        <div className="cp-booking-section">
          <div className="cp-section-card">
            <h2><i className="fas fa-calendar-check"></i> Quick Book</h2>
            
            <div className="cp-booking-form">
              <div className="cp-form-group">
                <label>
                  <i className="fas fa-chair"></i>
                  Table Type *
                </label>
                <select
                  value={bookingForm.tableTypeId}
                  onChange={(e) => {
                    setBookingForm(prev => ({ ...prev, tableTypeId: e.target.value }));
                    if (formErrors.tableTypeId) {
                      setFormErrors(prev => ({ ...prev, tableTypeId: '' }));
                    }
                  }}
                  className={formErrors.tableTypeId ? 'cp-error' : ''}
                >
                  <option value="">Select table type</option>
                  {tableTypes.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.typeName} • {t.seatingCapacityPerTable} seats • {t.tableCount} tables • ₹{t.pricePerHour}/hour
                    </option>
                  ))}
                </select>
                {formErrors.tableTypeId && (
                  <span className="cp-error-message">{formErrors.tableTypeId}</span>
                )}
              </div>

              <div className="cp-form-row">
                <div className="cp-form-group">
                  <label>
                    <i className="fas fa-calendar"></i>
                    Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={bookingForm.startTime}
                    min={`${getTodayDate()}T00:00`}
                    onChange={(e) => {
                      setBookingForm(prev => ({ ...prev, startTime: e.target.value }));
                      if (formErrors.startTime) {
                        setFormErrors(prev => ({ ...prev, startTime: '' }));
                      }
                    }}
                    className={formErrors.startTime ? 'cp-error' : ''}
                  />
                  {formErrors.startTime && (
                    <span className="cp-error-message">{formErrors.startTime}</span>
                  )}
                </div>

                <div className="cp-form-group">
                  <label>
                    <i className="fas fa-hourglass-half"></i>
                    Duration
                  </label>
                  <select
                    value={bookingForm.durationMinutes}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, durationMinutes: e.target.value }))}
                  >
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                    <option value={180}>3 hours</option>
                  </select>
                </div>
              </div>

              <div className="cp-form-group">
                <label>
                  <i className="fas fa-sticky-note"></i>
                  Special Requests
                </label>
                <textarea
                  placeholder="Birthday, anniversary, dietary restrictions..."
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows="3"
                />
              </div>

              <button 
                className="cp-submit-btn" 
                onClick={submitBooking}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Sending Request...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i>
                    Send Booking Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Menu Section */}
        <div className="cp-menu-section">
          <div className="cp-section-card">
            <div className="cp-menu-header">
              <h2><i className="fas fa-utensils"></i> Our Menu</h2>
              {menuItems.length > 4 && (
                <div className="cp-menu-nav">
                  <button className="cp-nav-btn" onClick={() => scrollMenu('left')}>
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <button className="cp-nav-btn" onClick={() => scrollMenu('right')}>
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              )}
            </div>

            {menuItems.length === 0 ? (
              <div className="cp-empty-menu">
                <i className="fas fa-utensils"></i>
                <h3>Menu Coming Soon</h3>
                <p>The cafe is preparing their delicious menu. Check back later!</p>
              </div>
            ) : (
              <div className="cp-menu-scroll-container" ref={menuScrollRef}>
                <div className="cp-menu-horizontal">
                  {menuItems.map(item => {
                    const primaryImage = item.images?.find(img => img.isPrimary) || item.images?.[0];
                    
                    return (
                      <div key={item.id} className="cp-menu-card">
                        <div className="cp-menu-image-container">
                          {primaryImage ? (
                            <>
                              <img 
                                src={`data:${primaryImage.fileType};base64,${primaryImage.fileData}`} 
                                alt={item.name}
                                className="cp-menu-image"
                                onClick={() => item.images?.length > 0 && openImageGallery(item.images, 0)}
                              />
                              {item.images?.length > 1 && (
                                <button 
                                  className="cp-image-count-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openImageGallery(item.images, 0);
                                  }}
                                >
                                  <i className="fas fa-images"></i>
                                  {item.images.length}
                                </button>
                              )}
                            </>
                          ) : (
                            <div className="cp-menu-placeholder">
                              <i className="fas fa-mug-hot"></i>
                            </div>
                          )}
                          {item.isAvailable === false && (
                            <span className="cp-unavailable-badge">Unavailable</span>
                          )}
                        </div>
                        
                        <div className="cp-menu-details">
                          <div className="cp-menu-name-price">
                            <h3>{item.name}</h3>
                            <span className="cp-menu-price">₹{item.price}</span>
                          </div>
                          
                          {item.category && (
                            <span className="cp-menu-category">
                              <i className="fas fa-tag"></i>
                              {item.category}
                            </span>
                          )}
                          
                          {item.description && (
                            <p className="cp-menu-description">{item.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add to Cart Section */}
      <div className="cp-cart-section" style={{ marginTop: '30px' }}>
        <div className="cp-section-card">
          <h2><i className="fas fa-cart-plus"></i> Add to Unified Cart</h2>
          <p className="cp-cart-description">Select tables to add to your cart. You can combine tables from multiple cafes.</p>
          
          <button className="cp-open-cart-btn" onClick={openLocalCart} style={{
            padding: '12px 24px',
            background: '#d4a574',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px'
          }}>
            <i className="fas fa-cart-plus"></i>
            Add Tables to Cart
          </button>

          {/* Quick Add Table Cards */}
          <div className="cp-table-types-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '15px'
          }}>
            {tableTypes.slice(0, 3).map(type => (
              <div key={type.id} className="cp-table-type-card" style={{
                background: '#f8f5f0',
                padding: '15px',
                borderRadius: '10px',
                border: '1px solid #e8dfca'
              }}>
                <h3 style={{ margin: '0 0 10px', color: '#2c1810' }}>{type.typeName}</h3>
                <div style={{ marginBottom: '10px' }}>
                  <p><i className="fas fa-users"></i> {type.seatingCapacityPerTable} seats</p>
                  <p><i className="fas fa-tag"></i> ₹{type.pricePerHour}/hour</p>
                  <p><i className="fas fa-check-circle"></i> {type.availableTables || type.tableCount} available</p>
                </div>
                <button 
                  onClick={() => {
                    setSelectedTableType(type);
                    openLocalCart();
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#d4a574',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  <i className="fas fa-cart-plus"></i> Select
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Local Cart Modal for adding to Unified Cart */}
      {showLocalCart && (
        <div className="cp-modal-overlay" onClick={closeLocalCart}>
          <div className="cp-local-cart-modal" onClick={(e) => e.stopPropagation()} style={{
            background: 'white',
            borderRadius: '20px',
            width: '90%',
            maxWidth: '500px',
            padding: '30px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#2c1810' }}>Add to Unified Cart</h2>
              <button onClick={closeLocalCart} style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#999'
              }}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Select Table Type *</label>
              <select 
                value={selectedTableType?.id || ''} 
                onChange={(e) => {
                  const type = tableTypes.find(t => t.id === parseInt(e.target.value));
                  setSelectedTableType(type);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e8dfca',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              >
                <option value="">Choose a table type</option>
                {tableTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.typeName} - ₹{type.pricePerHour}/hour ({type.seatingCapacityPerTable} seats)
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Date *</label>
                <input 
                  type="date" 
                  value={selectedDate}
                  min={getTodayDate()}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e8dfca',
                    borderRadius: '8px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Time *</label>
                <input 
                  type="time" 
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e8dfca',
                    borderRadius: '8px'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Duration</label>
              <select 
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e8dfca',
                  borderRadius: '8px'
                }}
              >
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
                <option value="180">3 hours</option>
                <option value="240">4 hours</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Quantity</label>
              <input 
                type="number" 
                min="1"
                max={selectedTableType?.availableTables || 10}
                value={selectedQuantity}
                onChange={(e) => setSelectedQuantity(parseInt(e.target.value) || 1)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e8dfca',
                  borderRadius: '8px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Special Requests</label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Any special requests for this booking?"
                rows="3"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e8dfca',
                  borderRadius: '8px'
                }}
              />
            </div>

            {selectedTableType && selectedDate && selectedTime && (
              <div style={{
                background: '#f0f7f0',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <h4 style={{ margin: '0 0 10px', color: '#27ae60' }}>Estimated Price</h4>
                <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#27ae60' }}>
                  ₹{(selectedTableType.pricePerHour * (selectedDuration / 60) * selectedQuantity).toFixed(2)}
                </p>
                <small>Rate: ₹{selectedTableType.pricePerHour}/hour × {selectedDuration} min × {selectedQuantity} table(s)</small>
              </div>
            )}

            <div style={{ display: 'flex', gap: '15px' }}>
              <button 
                onClick={closeLocalCart}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#f8f5f0',
                  border: '1px solid #e8dfca',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={addToUnifiedCart}
                disabled={!selectedTableType || !selectedDate || !selectedTime}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#d4a574',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: !selectedTableType || !selectedDate || !selectedTime ? 'not-allowed' : 'pointer',
                  opacity: !selectedTableType || !selectedDate || !selectedTime ? 0.5 : 1
                }}
              >
                <i className="fas fa-cart-plus"></i> Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Gallery Modal */}
      {showImageModal && (
        <div className="cp-modal-overlay" onClick={() => setShowImageModal(false)}>
          <div className="cp-image-gallery-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cp-gallery-header">
              <span className="cp-gallery-counter">
                {currentImageIndex + 1} / {selectedImages.length}
              </span>
              <button className="cp-gallery-close" onClick={() => setShowImageModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="cp-gallery-content">
              {currentImageIndex > 0 && (
                <button 
                  className="cp-gallery-nav cp-gallery-prev"
                  onClick={() => setCurrentImageIndex(currentImageIndex - 1)}
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
              )}

              <div className="cp-gallery-image-container">
                <img 
                  src={`data:${selectedImages[currentImageIndex].fileType};base64,${selectedImages[currentImageIndex].fileData}`}
                  alt="Gallery"
                  className="cp-gallery-main-image"
                />
                {selectedImages[currentImageIndex].caption && (
                  <div className="cp-gallery-caption">
                    {selectedImages[currentImageIndex].caption}
                  </div>
                )}
              </div>

              {currentImageIndex < selectedImages.length - 1 && (
                <button 
                  className="cp-gallery-nav cp-gallery-next"
                  onClick={() => setCurrentImageIndex(currentImageIndex + 1)}
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              )}
            </div>

            <div className="cp-gallery-thumbnails">
              {selectedImages.map((img, idx) => (
                <button
                  key={idx}
                  className={`cp-gallery-thumbnail ${idx === currentImageIndex ? 'cp-active' : ''}`}
                  onClick={() => setCurrentImageIndex(idx)}
                >
                  <img 
                    src={`data:${img.fileType};base64,${img.fileData}`}
                    alt={`Thumbnail ${idx + 1}`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CafeDetailsPage;