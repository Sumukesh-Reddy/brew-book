import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UnifiedCart from '../UnifiedCart/UnifiedCart.js';
import './CustomerDashboard.css';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [activeTab, setActiveTab] = useState('cafes');
  const [cafesLoading, setCafesLoading] = useState(true);
  const [cafes, setCafes] = useState([]);
  const [favoriteCafes, setFavoriteCafes] = useState([]);
  const [recentCafes, setRecentCafes] = useState([]);

  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [pastBookings, setPastBookings] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [cities, setCities] = useState([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  // Unified Cart state
  const [showCart, setShowCart] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [cartItemCount, setCartItemCount] = useState(0);

  // Load cart from localStorage on mount
  useEffect(() => {
    if (!user?.id) {
      navigate('/signin');
      return;
    }
    loadCafes();
    loadFavorites();
    loadRecentCafes();
    loadCartFromStorage();
  }, []);

  useEffect(() => {
    if (activeTab === 'bookings' && user?.id) {
      loadBookings();
    }
  }, [activeTab]);

  const loadCartFromStorage = () => {
    const cartKey = `unified_cart_${user.id}`;
    const saved = localStorage.getItem(cartKey);
    if (saved) {
      const items = JSON.parse(saved);
      setCartItems(items);
      updateCartCount(items);
    }
  };

  const updateCartCount = (items) => {
    const total = items.reduce((sum, item) => sum + item.quantity, 0);
    setCartItemCount(total);
  };

  const saveCartToStorage = (items) => {
    const cartKey = `unified_cart_${user.id}`;
    localStorage.setItem(cartKey, JSON.stringify(items));
    setCartItems(items);
    updateCartCount(items);
  };

  const addToCart = (cafe, tableType) => {
    const existingItemIndex = cartItems.findIndex(
      item => item.cafeId === cafe.id && item.tableTypeId === tableType.id
    );

    let updatedItems;
    if (existingItemIndex >= 0) {
      // Update existing item
      updatedItems = [...cartItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + 1
      };
    } else {
      // Add new item
      updatedItems = [...cartItems, {
        cafeId: cafe.id,
        cafeName: cafe.cafeName,
        cafeCity: cafe.city,
        tableTypeId: tableType.id,
        tableTypeName: tableType.typeName,
        seatingCapacity: tableType.seatingCapacityPerTable,
        pricePerHour: tableType.pricePerHour || 0,
        quantity: 1,
        specialRequests: '',
        availableTables: tableType.availableTables || tableType.tableCount
      }];
    }

    saveCartToStorage(updatedItems);
    alert(`Added ${tableType.typeName} from ${cafe.cafeName} to cart`);
  };

  const loadCafes = async () => {
    setCafesLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/cafe/public/approved');
      const data = await res.json();
      if (data.success) {
        setCafes(data.data || []);
        
        // Extract unique cities
        const uniqueCities = [...new Set(data.data.map(c => c.city).filter(Boolean))];
        setCities(uniqueCities);
      }
    } catch (e) {
      console.error('Failed to load cafes:', e);
    } finally {
      setCafesLoading(false);
    }
  };

  const loadFavorites = () => {
    const saved = localStorage.getItem(`favorites_${user.id}`);
    if (saved) {
      setFavoriteCafes(JSON.parse(saved));
    }
  };

  const loadRecentCafes = () => {
    const saved = localStorage.getItem(`recent_${user.id}`);
    if (saved) {
      setRecentCafes(JSON.parse(saved));
    }
  };

  const loadBookings = async () => {
    setBookingsLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/bookings/customer?customerId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        const allBookings = data.data || [];
        setBookings(allBookings);
        
        const now = new Date();
        const upcoming = allBookings.filter(b => 
          new Date(b.startTime) > now && 
          (b.status === 'accepted' || b.status === 'requested')
        );
        const past = allBookings.filter(b => 
          new Date(b.startTime) <= now || 
          b.status === 'completed' || 
          b.status === 'rejected'
        );
        
        setUpcomingBookings(upcoming);
        setPastBookings(past);
      }
    } catch (e) {
      console.error('Failed to load bookings:', e);
    } finally {
      setBookingsLoading(false);
    }
  };

  const toggleFavorite = (cafe) => {
    let updated;
    if (favoriteCafes.some(f => f.id === cafe.id)) {
      updated = favoriteCafes.filter(f => f.id !== cafe.id);
    } else {
      updated = [...favoriteCafes, cafe];
    }
    setFavoriteCafes(updated);
    localStorage.setItem(`favorites_${user.id}`, JSON.stringify(updated));
  };

  const addToRecent = (cafe) => {
    const updated = [cafe, ...recentCafes.filter(r => r.id !== cafe.id)].slice(0, 10);
    setRecentCafes(updated);
    localStorage.setItem(`recent_${user.id}`, JSON.stringify(updated));
  };

  const openImageGallery = (images, startIndex = 0) => {
    if (images && images.length > 0) {
      setSelectedImages(images);
      setCurrentImageIndex(startIndex);
      setShowImageModal(true);
    }
  };

  const viewBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setShowBookingDetails(true);
  };

  const openCart = () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty. Add some tables from cafes first!');
      return;
    }
    setShowCart(true);
  };

  const handleCartSuccess = (bookings) => {
    setShowCart(false);
    // Clear cart after successful booking
    const cartKey = `unified_cart_${user.id}`;
    localStorage.removeItem(cartKey);
    setCartItems([]);
    setCartItemCount(0);
    
    alert(`Successfully booked ${bookings.length} tables!`);
    
    if (activeTab === 'bookings') {
      loadBookings();
    }
  };

  const filteredCafes = cafes.filter(cafe => {
    const matchesSearch = cafe.cafeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (cafe.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = selectedCity === 'all' || cafe.city === selectedCity;
    return matchesSearch && matchesCity;
  });

  const getStatusIcon = (status) => {
    switch(status) {
      case 'requested': return '⏳';
      case 'accepted': return '✅';
      case 'completed': return '✔️';
      case 'rejected': return '❌';
      default: return '📅';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="cd-page">
      {/* Header */}
      <div className="cd-header">
        <div>
          <h1>Welcome back, {user.name || 'Customer'}! 👋</h1>
          <p>Find your perfect spot and book a table in seconds</p>
        </div>
        <div className="cd-header-actions">
          {/* Unified Cart Icon */}
          <div className="cart-icon-container" onClick={openCart}>
            <i className="fas fa-shopping-cart" style={{ fontSize: '24px', color: '#d4a574' }}></i>
            {cartItemCount > 0 && (
              <span className="cart-badge">{cartItemCount}</span>
            )}
          </div>
          <button className="cd-btn cd-btn-outline" onClick={() => navigate('/profile')}>
            <i className="fas fa-user"></i> Profile
          </button>
          <button className="cd-btn cd-btn-primary" onClick={() => { 
            localStorage.clear(); 
            navigate('/signin'); 
          }}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="cd-stats-grid">
        <div className="cd-stat-card">
          <i className="fas fa-calendar-check"></i>
          <div>
            <span className="cd-stat-value">{bookings.length}</span>
            <span className="cd-stat-label">Total Bookings</span>
          </div>
        </div>
        <div className="cd-stat-card">
          <i className="fas fa-clock"></i>
          <div>
            <span className="cd-stat-value">{upcomingBookings.length}</span>
            <span className="cd-stat-label">Upcoming</span>
          </div>
        </div>
        <div className="cd-stat-card">
          <i className="fas fa-heart" style={{ color: '#ff6b6b' }}></i>
          <div>
            <span className="cd-stat-value">{favoriteCafes.length}</span>
            <span className="cd-stat-label">Favorites</span>
          </div>
        </div>
        <div className="cd-stat-card">
          <i className="fas fa-store"></i>
          <div>
            <span className="cd-stat-value">{cafes.length}</span>
            <span className="cd-stat-label">Cafes</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="cd-tabs">
        <button 
          className={`cd-tab ${activeTab === 'cafes' ? 'cd-active' : ''}`} 
          onClick={() => setActiveTab('cafes')}
        >
          <i className="fas fa-store"></i> Browse Cafes
        </button>
        <button 
          className={`cd-tab ${activeTab === 'favorites' ? 'cd-active' : ''}`} 
          onClick={() => setActiveTab('favorites')}
        >
          <i className="fas fa-heart"></i> Favorites
        </button>
        <button 
          className={`cd-tab ${activeTab === 'recent' ? 'cd-active' : ''}`} 
          onClick={() => setActiveTab('recent')}
        >
          <i className="fas fa-history"></i> Recent
        </button>
        <button 
          className={`cd-tab ${activeTab === 'bookings' ? 'cd-active' : ''}`} 
          onClick={() => setActiveTab('bookings')}
        >
          <i className="fas fa-calendar-check"></i> My Bookings
        </button>
      </div>

      {/* Content */}
      <div className="cd-content">
        {/* Cafes Tab */}
        {activeTab === 'cafes' && (
          <>
            <div className="cd-search-section">
              <div className="cd-search-box">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search cafes by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select 
                className="cd-filter-select"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
              >
                <option value="all">All Cities</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {cafesLoading ? (
              <div className="cd-loading">
                <div className="cd-spinner"></div>
                <p>Discovering amazing cafes...</p>
              </div>
            ) : filteredCafes.length === 0 ? (
              <div className="cd-empty">
                <i className="fas fa-search"></i>
                <h3>No cafes found</h3>
                <p>Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="cd-cafe-grid">
                {filteredCafes.map((cafe) => (
                  <div key={cafe.id} className="cd-cafe-card">
                    <div className="cd-cafe-image-container">
                      {cafe.primaryImageData ? (
                        <>
                          <img
                            src={`data:${cafe.primaryImageType};base64,${cafe.primaryImageData}`}
                            alt={cafe.cafeName}
                            className="cd-cafe-image"
                            onClick={() => {
                              addToRecent(cafe);
                              navigate(`/cafes/${cafe.id}`);
                            }}
                          />
                          {cafe.images && cafe.images.length > 1 && (
                            <button 
                              className="cd-gallery-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                openImageGallery(cafe.images);
                              }}
                            >
                              <i className="fas fa-images"></i> {cafe.images.length}
                            </button>
                          )}
                        </>
                      ) : (
                        <div 
                          className="cd-cafe-placeholder" 
                          onClick={() => {
                            addToRecent(cafe);
                            navigate(`/cafes/${cafe.id}`);
                          }}
                        >
                          <i className="fas fa-mug-hot"></i>
                        </div>
                      )}
                      <button 
                        className={`cd-favorite-btn ${favoriteCafes.some(f => f.id === cafe.id) ? 'cd-active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(cafe);
                        }}
                      >
                        <i className="fas fa-heart"></i>
                      </button>
                    </div>
                    
                    <div className="cd-cafe-info">
                      <h3>{cafe.cafeName}</h3>
                      {cafe.city && (
                        <p className="cd-cafe-location">
                          <i className="fas fa-map-marker-alt"></i> {cafe.city}
                        </p>
                      )}
                      <p className="cd-cafe-description">{cafe.description || 'No description'}</p>
                      
                      <div className="cd-cafe-features">
                        {cafe.hasWifi && <span><i className="fas fa-wifi"></i> WiFi</span>}
                        {cafe.hasParking && <span><i className="fas fa-parking"></i> Parking</span>}
                        {cafe.hasAC && <span><i className="fas fa-snowflake"></i> AC</span>}
                      </div>
                      
                      <div className="cd-cafe-stats">
                        <span><i className="fas fa-chair"></i> {cafe.totalTables || 0} tables</span>
                        <span><i className="fas fa-users"></i> {cafe.seatingCapacity || 0} seats</span>
                      </div>
                      
                      <div className="cd-cafe-actions">
                        <button 
                          className="cd-book-btn"
                          onClick={() => {
                            addToRecent(cafe);
                            navigate(`/cafes/${cafe.id}`);
                          }}
                        >
                          View Details
                        </button>
                        <button 
                          className="cd-cart-btn"
                          onClick={() => {
                            // Navigate to cafe details page to select table types
                            addToRecent(cafe);
                            navigate(`/cafes/${cafe.id}`);
                          }}
                        >
                          <i className="fas fa-shopping-cart"></i> Select Tables
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div className="cd-section">
            <div className="cd-toolbar">
              <h2>Your Favorite Cafes</h2>
            </div>
            {favoriteCafes.length === 0 ? (
              <div className="cd-empty">
                <i className="fas fa-heart-broken"></i>
                <h3>No favorites yet</h3>
                <p>Heart cafes you love to find them here</p>
              </div>
            ) : (
              <div className="cd-cafe-grid">
                {favoriteCafes.map((cafe) => (
                  <div key={cafe.id} className="cd-cafe-card">
                    <div className="cd-cafe-image-container">
                      {cafe.primaryImageData ? (
                        <img
                          src={`data:${cafe.primaryImageType};base64,${cafe.primaryImageData}`}
                          alt={cafe.cafeName}
                          className="cd-cafe-image"
                          onClick={() => navigate(`/cafes/${cafe.id}`)}
                        />
                      ) : (
                        <div className="cd-cafe-placeholder" onClick={() => navigate(`/cafes/${cafe.id}`)}>
                          <i className="fas fa-mug-hot"></i>
                        </div>
                      )}
                      <button 
                        className="cd-favorite-btn cd-active"
                        onClick={() => toggleFavorite(cafe)}
                      >
                        <i className="fas fa-heart"></i>
                      </button>
                    </div>
                    
                    <div className="cd-cafe-info">
                      <h3>{cafe.cafeName}</h3>
                      {cafe.city && <p className="cd-cafe-location"><i className="fas fa-map-marker-alt"></i> {cafe.city}</p>}
                      <div className="cd-cafe-stats">
                        <span><i className="fas fa-chair"></i> {cafe.totalTables || 0} tables</span>
                      </div>
                      <div className="cd-cafe-actions">
                        <button 
                          className="cd-book-btn cd-small"
                          onClick={() => navigate(`/cafes/${cafe.id}`)}
                        >
                          View Cafe
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recent Tab */}
        {activeTab === 'recent' && (
          <div className="cd-section">
            <div className="cd-toolbar">
              <h2>Recently Viewed Cafes</h2>
            </div>
            {recentCafes.length === 0 ? (
              <div className="cd-empty">
                <i className="fas fa-history"></i>
                <h3>No recent cafes</h3>
                <p>Cafes you view will appear here</p>
              </div>
            ) : (
              <div className="cd-cafe-grid">
                {recentCafes.map((cafe) => (
                  <div key={cafe.id} className="cd-cafe-card cd-small">
                    <div className="cd-cafe-image-container">
                      {cafe.primaryImageData ? (
                        <img
                          src={`data:${cafe.primaryImageType};base64,${cafe.primaryImageData}`}
                          alt={cafe.cafeName}
                          className="cd-cafe-image"
                          onClick={() => navigate(`/cafes/${cafe.id}`)}
                        />
                      ) : (
                        <div className="cd-cafe-placeholder" onClick={() => navigate(`/cafes/${cafe.id}`)}>
                          <i className="fas fa-mug-hot"></i>
                        </div>
                      )}
                    </div>
                    <div className="cd-cafe-info">
                      <h3>{cafe.cafeName}</h3>
                      {cafe.city && <p className="cd-cafe-location"><i className="fas fa-map-marker-alt"></i> {cafe.city}</p>}
                      <div className="cd-cafe-actions">
                        <button 
                          className="cd-book-btn cd-small"
                          onClick={() => navigate(`/cafes/${cafe.id}`)}
                        >
                          View Again
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="cd-section">
            <div className="cd-toolbar">
              <h2>Your Bookings</h2>
              <button className="cd-btn cd-btn-outline" onClick={loadBookings}>
                <i className="fas fa-rotate"></i> Refresh
              </button>
            </div>

            {bookingsLoading ? (
              <div className="cd-loading">
                <div className="cd-spinner"></div>
                <p>Loading your bookings...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="cd-empty">
                <i className="fas fa-calendar-check"></i>
                <h3>No bookings yet</h3>
                <p>Book a table from the Cafes tab</p>
              </div>
            ) : (
              <>
                {/* Upcoming Bookings */}
                {upcomingBookings.length > 0 && (
                  <div className="cd-booking-section">
                    <h3 className="cd-section-title">
                      <i className="fas fa-clock"></i> Upcoming Bookings
                    </h3>
                    <div className="cd-booking-grid">
                      {upcomingBookings.map(booking => (
                        <div key={booking.id} className="cd-booking-card cd-upcoming">
                          <div className="cd-booking-header">
                            <div className="cd-booking-cafe">{booking.cafeName}</div>
                            <span className={`cd-booking-status cd-${booking.status}`}>
                              {getStatusIcon(booking.status)} {booking.status}
                            </span>
                          </div>
                          <div className="cd-booking-details">
                            <p><i className="fas fa-calendar"></i> {formatDate(booking.startTime)}</p>
                            <p><i className="fas fa-clock"></i> Duration: {Math.round((new Date(booking.endTime) - new Date(booking.startTime)) / 60000)} mins</p>
                            <p><i className="fas fa-chair"></i> Table: {booking.tableTypeName || 'Regular'}</p>
                            {booking.tableNumber && (
                              <p className="cd-table-number-badge">Table #{booking.tableNumber}</p>
                            )}
                          </div>
                          <button 
                            className="cd-view-details-btn"
                            onClick={() => viewBookingDetails(booking)}
                          >
                            View Details
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Past Bookings */}
                {pastBookings.length > 0 && (
                  <div className="cd-booking-section">
                    <h3 className="cd-section-title">
                      <i className="fas fa-history"></i> Past Bookings
                    </h3>
                    <div className="cd-booking-grid">
                      {pastBookings.slice(0, 5).map(booking => (
                        <div key={booking.id} className="cd-booking-card cd-past">
                          <div className="cd-booking-header">
                            <div className="cd-booking-cafe">{booking.cafeName}</div>
                            <span className={`cd-booking-status cd-${booking.status}`}>
                              {getStatusIcon(booking.status)} {booking.status}
                            </span>
                          </div>
                          <div className="cd-booking-details">
                            <p><i className="fas fa-calendar"></i> {formatDate(booking.startTime)}</p>
                            {booking.tableNumber && (
                              <p><i className="fas fa-chair"></i> Table #{booking.tableNumber}</p>
                            )}
                          </div>
                          <button 
                            className="cd-view-details-btn cd-small"
                            onClick={() => viewBookingDetails(booking)}
                          >
                            Details
                          </button>
                        </div>
                      ))}
                    </div>
                    {pastBookings.length > 5 && (
                      <button className="cd-view-all-btn" onClick={() => alert('View all past bookings')}>
                        View All Past Bookings
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {showBookingDetails && selectedBooking && (
        <div className="cd-modal-overlay" onClick={() => setShowBookingDetails(false)}>
          <div className="cd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cd-modal-header">
              <h3><i className="fas fa-calendar-check"></i> Booking Details</h3>
              <button className="cd-modal-close" onClick={() => setShowBookingDetails(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="cd-modal-body">
              <div className="cd-booking-info">
                <div className="cd-info-row">
                  <span className="cd-info-label">Cafe</span>
                  <span className="cd-info-value">{selectedBooking.cafeName}</span>
                </div>
                <div className="cd-info-row">
                  <span className="cd-info-label">Status</span>
                  <span className={`cd-booking-status cd-${selectedBooking.status}`}>
                    {selectedBooking.status}
                  </span>
                </div>
                <div className="cd-info-row">
                  <span className="cd-info-label">Date & Time</span>
                  <span className="cd-info-value">{formatDate(selectedBooking.startTime)}</span>
                </div>
                <div className="cd-info-row">
                  <span className="cd-info-label">Duration</span>
                  <span className="cd-info-value">
                    {Math.round((new Date(selectedBooking.endTime) - new Date(selectedBooking.startTime)) / 60000)} minutes
                  </span>
                </div>
                <div className="cd-info-row">
                  <span className="cd-info-label">Table Type</span>
                  <span className="cd-info-value">{selectedBooking.tableTypeName || 'Regular'}</span>
                </div>
                {selectedBooking.tableNumber && (
                  <div className="cd-info-row">
                    <span className="cd-info-label">Table Number</span>
                    <span className="cd-table-number-badge">#{selectedBooking.tableNumber}</span>
                  </div>
                )}
                {selectedBooking.notes && (
                  <div className="cd-info-row">
                    <span className="cd-info-label">Notes</span>
                    <span className="cd-info-value">{selectedBooking.notes}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="cd-modal-footer">
              <button className="cd-btn cd-btn-primary" onClick={() => setShowBookingDetails(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Gallery Modal */}
      {showImageModal && (
        <div className="cd-modal-overlay" onClick={() => setShowImageModal(false)}>
          <div className="cd-image-gallery-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cd-gallery-header">
              <span className="cd-gallery-counter">
                {currentImageIndex + 1} / {selectedImages.length}
              </span>
              <button className="cd-gallery-close" onClick={() => setShowImageModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="cd-gallery-content">
              {currentImageIndex > 0 && (
                <button 
                  className="cd-gallery-nav cd-gallery-prev"
                  onClick={() => setCurrentImageIndex(currentImageIndex - 1)}
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
              )}
              <div className="cd-gallery-image-container">
                <img 
                  src={`data:${selectedImages[currentImageIndex].fileType};base64,${selectedImages[currentImageIndex].fileData}`}
                  alt="Gallery"
                  className="cd-gallery-image"
                />
              </div>
              {currentImageIndex < selectedImages.length - 1 && (
                <button 
                  className="cd-gallery-nav cd-gallery-next"
                  onClick={() => setCurrentImageIndex(currentImageIndex + 1)}
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              )}
            </div>
            <div className="cd-gallery-thumbnails">
              {selectedImages.map((img, idx) => (
                <div 
                  key={idx}
                  className={`cd-gallery-thumbnail ${idx === currentImageIndex ? 'cd-active' : ''}`}
                  onClick={() => setCurrentImageIndex(idx)}
                >
                  <img 
                    src={`data:${img.fileType};base64,${img.fileData}`}
                    alt={`Thumbnail ${idx + 1}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Unified Cart Modal */}
      {showCart && (
        <UnifiedCart
          cartItems={cartItems}
          customerId={user.id}
          customerPhone={user.phone || ''}
          onClose={() => setShowCart(false)}
          onSuccess={handleCartSuccess}
          onUpdateCart={saveCartToStorage}
        />
      )}
    </div>
  );
};

export default CustomerDashboard;