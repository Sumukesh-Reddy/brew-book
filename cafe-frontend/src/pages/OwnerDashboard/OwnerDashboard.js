import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CafeRegistrationForm from '../CafeRegistrationForm/CafeRegistrationForm';
import TableOrderManagement from '../TableOrderManagement/TableOrderManagement';
import Receipt from '../../components/Receipt/Receipt';
import './OwnerDashboard.css';

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [cafeData, setCafeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCafeForm, setShowCafeForm] = useState(false);
  const [ownerInfo, setOwnerInfo] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    acceptedBookings: 0,
    completedBookings: 0,
    rejectedBookings: 0,
    totalRevenue: 0,
    menuItems: 0,
    staffCount: 0,
    occupiedTables: 0,
    totalTables: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [editingStaff, setEditingStaff] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [revenueStats, setRevenueStats] = useState(null);
  const [occupiedTablesCount, setOccupiedTablesCount] = useState(0);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setOwnerInfo(user);
    checkCafeStatus(user?.id);
  }, []);

  const checkCafeStatus = async (ownerId) => {
    try {
      const url = ownerId
        ? `http://localhost:8080/api/cafe/status?ownerId=${ownerId}`
        : 'http://localhost:8080/api/cafe/status';

      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success && data.data) {
        setCafeData(data.data);
        if (data.data.hasCafe) {
          await fetchCafeDetails(ownerId);
          await fetchDashboardData(ownerId);
          await fetchRevenueStats(ownerId);
          await fetchOccupiedTables(ownerId);
        }
      }
    } catch (error) {
      console.error('Error checking cafe status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCafeDetails = async (ownerId) => {
    try {
      const url = ownerId
        ? `http://localhost:8080/api/cafe/my-cafe?ownerId=${ownerId}`
        : 'http://localhost:8080/api/cafe/my-cafe';

      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success && data.data) {
        setCafeData(data.data);
      }
    } catch (error) {
      console.error('Error fetching cafe details:', error);
    }
  };

  const fetchOccupiedTables = async (ownerId) => {
    try {
      const res = await fetch(`http://localhost:8080/api/tables/owner/${ownerId}/occupied`);
      const data = await res.json();
      if (data.success) {
        setOccupiedTablesCount(data.data?.length || 0);
      }
    } catch (error) {
      console.error('Failed to load occupied tables:', error);
    }
  };

  const fetchRevenueStats = async (ownerId) => {
    try {
      const res = await fetch(`http://localhost:8080/api/tables/revenue/stats/${ownerId}`);
      const data = await res.json();
      if (data.success) {
        setRevenueStats(data.data);
      }
    } catch (error) {
      console.error('Failed to load revenue stats:', error);
    }
  };

  const fetchDashboardData = async (ownerId) => {
    try {
      const bookingsUrl = ownerId
        ? `http://localhost:8080/api/bookings/owner?ownerId=${ownerId}`
        : 'http://localhost:8080/api/bookings/owner';
      const menuUrl = ownerId
        ? `http://localhost:8080/api/menu/my?ownerId=${ownerId}`
        : 'http://localhost:8080/api/menu/my';
      const staffUrl = ownerId
        ? `http://localhost:8080/api/staff/my?ownerId=${ownerId}`
        : 'http://localhost:8080/api/staff/my';
      const activityUrl = ownerId
        ? `http://localhost:8080/api/activity/my?ownerId=${ownerId}`
        : 'http://localhost:8080/api/activity/my';

      const [bookingsRes, menuRes, staffRes, activityRes] = await Promise.all([
        fetch(bookingsUrl),
        fetch(menuUrl),
        fetch(staffUrl),
        fetch(activityUrl)
      ]);

      const [bookingsData, menuData, staffData, activityData] = await Promise.all([
        bookingsRes.json(),
        menuRes.json(),
        staffRes.json(),
        activityRes.json()
      ]);

      const bookings = bookingsData?.success ? (bookingsData.data || []) : [];
      const menuItems = menuData?.success ? (menuData.data || []) : [];
      const staff = staffData?.success ? (staffData.data || []) : [];
      const activities = activityData?.success ? (activityData.data || []) : [];

      const pending = bookings.filter(b => b.status === 'requested').length;
      const accepted = bookings.filter(b => b.status === 'accepted').length;
      const completed = bookings.filter(b => b.status === 'completed').length;
      const rejected = bookings.filter(b => b.status === 'rejected').length;

      setDashboardStats(prev => ({
        ...prev,
        totalBookings: bookings.length,
        pendingBookings: pending,
        acceptedBookings: accepted,
        completedBookings: completed,
        rejectedBookings: rejected,
        menuItems: menuItems.length,
        staffCount: staff.length,
        totalTables: cafeData?.totalTables || 0
      }));
      
      setRecentActivity(activities.slice(0, 5));
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    navigate('/signin');
  };

  const getStatusBadge = (status) => {
    switch(status?.toLowerCase()) {
      case 'approved':
        return <span className="od-status-badge od-status-approved"><i className="fas fa-check-circle"></i> Approved</span>;
      case 'pending':
        return <span className="od-status-badge od-status-pending"><i className="fas fa-clock"></i> Pending Review</span>;
      case 'rejected':
        return <span className="od-status-badge od-status-rejected"><i className="fas fa-times-circle"></i> Rejected</span>;
      default:
        return <span className="od-status-badge od-status-pending"><i className="fas fa-clock"></i> Not Registered</span>;
    }
  };

  const openImageGallery = (images, startIndex = 0) => {
    if (images && images.length > 0) {
      setSelectedImages(images);
      setCurrentImageIndex(startIndex);
      setShowImageModal(true);
    }
  };

  const goToProfile = () => {
    navigate('/profile');
  };

  const refreshData = () => {
    if (ownerInfo?.id) {
      fetchDashboardData(ownerInfo.id);
      fetchRevenueStats(ownerInfo.id);
      fetchOccupiedTables(ownerInfo.id);
    }
  };

  return (
    <div className="od-owner-dashboard">
      {/* Sidebar */}
      <div className="od-sidebar">
        <div className="od-sidebar-header">
          <div className="od-logo">
            <i className="fas fa-mug-hot"></i>
            <h2>Brew & Book</h2>
          </div>
          <p className="od-welcome">Welcome, {ownerInfo?.name || 'Owner'}!</p>
        </div>

        <div className="od-sidebar-menu">
          <div 
            className={`od-menu-item ${activeTab === 'dashboard' ? 'od-active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <i className="fas fa-tachometer-alt"></i>
            <span>Dashboard</span>
          </div>

          <div 
            className={`od-menu-item ${activeTab === 'order-management' ? 'od-active' : ''}`}
            onClick={() => setActiveTab('order-management')}
          >
            <i className="fas fa-utensils"></i>
            <span>Order Management</span>
            {occupiedTablesCount > 0 && (
              <span className="od-menu-badge">{occupiedTablesCount}</span>
            )}
          </div>

          <div 
            className={`od-menu-item ${activeTab === 'menu' ? 'od-active' : ''}`}
            onClick={() => setActiveTab('menu')}
          >
            <i className="fas fa-utensils"></i>
            <span>Menu</span>
          </div>

          <div 
            className={`od-menu-item ${activeTab === 'cafe' ? 'od-active' : ''}`}
            onClick={() => setActiveTab('cafe')}
          >
            <i className="fas fa-store"></i>
            <span>My Cafe</span>
          </div>

          <div 
            className={`od-menu-item ${activeTab === 'tables' ? 'od-active' : ''}`}
            onClick={() => setActiveTab('tables')}
          >
            <i className="fas fa-chair"></i>
            <span>Tables</span>
          </div>

          <div 
            className={`od-menu-item ${activeTab === 'bookings' ? 'od-active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <i className="fas fa-calendar-check"></i>
            <span>Bookings</span>
          </div>

          <div 
            className={`od-menu-item ${activeTab === 'staff' ? 'od-active' : ''}`}
            onClick={() => setActiveTab('staff')}
          >
            <i className="fas fa-users"></i>
            <span>Staff</span>
          </div>

          <div 
            className={`od-menu-item ${activeTab === 'reports' ? 'od-active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <i className="fas fa-chart-bar"></i>
            <span>Reports</span>
          </div>

          <div 
            className={`od-menu-item ${activeTab === 'profile' ? 'od-active' : ''}`}
            onClick={goToProfile}
          >
            <i className="fas fa-user-circle"></i>
            <span>My Profile</span>
          </div>
        </div>

        <div className="od-sidebar-footer">
          <button className="od-logout-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="od-main-content">
        {/* Header */}
        <div className="od-content-header">
          <h1>
            {activeTab === 'dashboard' && 'Dashboard Overview'}
            {activeTab === 'order-management' && 'Table Order Management'}
            {activeTab === 'cafe' && 'My Cafe'}
            {activeTab === 'tables' && 'Table Management'}
            {activeTab === 'bookings' && 'Table Bookings'}
            {activeTab === 'menu' && 'Cafe Menu'}
            {activeTab === 'staff' && 'Staff Management'}
            {activeTab === 'reports' && 'Reports & Analytics'}
            {activeTab === 'profile' && 'My Profile'}
          </h1>
          <div className="od-header-actions">
            <button className="od-notification-btn" onClick={refreshData}>
              <i className="fas fa-sync-alt"></i>
            </button>
            <button className="od-notification-btn">
              <i className="fas fa-bell"></i>
              <span className="od-notification-badge">
                {dashboardStats.pendingBookings > 0 ? dashboardStats.pendingBookings : 0}
              </span>
            </button>
            <div className="od-user-profile" onClick={goToProfile} style={{ cursor: 'pointer' }}>
              <img src={`https://ui-avatars.com/api/?name=${ownerInfo?.name || 'Owner'}&background=8b4513&color=fff&size=40`} alt="Profile" />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="od-content-area">
          {activeTab === 'dashboard' && (
            <DashboardContent 
              cafeData={cafeData}
              loading={loading}
              dashboardStats={dashboardStats}
              recentActivity={recentActivity}
              revenueStats={revenueStats}
              occupiedTablesCount={occupiedTablesCount}
              onAddCafe={() => {
                setActiveTab('cafe');
                setShowCafeForm(true);
              }}
              getStatusBadge={getStatusBadge}
              onRefresh={refreshData}
            />
          )}

          {activeTab === 'order-management' && cafeData?.hasCafe && (
            <TableOrderManagement
              cafeData={cafeData}
              ownerId={ownerInfo?.id}
              userRole="owner"
              onClose={() => setActiveTab('dashboard')}
              onOrderComplete={refreshData}
            />
          )}

          {activeTab === 'cafe' && (
            <CafeContent 
              cafeData={cafeData}
              loading={loading}
              showForm={showCafeForm}
              setShowForm={setShowCafeForm}
              onCafeRegistered={() => {
                checkCafeStatus(ownerInfo?.id);
                setShowCafeForm(false);
              }}
              getStatusBadge={getStatusBadge}
              openImageGallery={openImageGallery}
            />
          )}

          {activeTab === 'tables' && (
            <WalkInManagement 
              cafeData={cafeData}
              ownerId={ownerInfo?.id}
              onTableOccupied={refreshData}
            />
          )}

          {activeTab === 'bookings' && (
            <BookingsContent 
              setSelectedBooking={setSelectedBooking}
              setShowBookingDetails={setShowBookingDetails}
            />
          )}
          
          {activeTab === 'menu' && (
            <MenuContent 
              editingItem={editingItem}
              setEditingItem={setEditingItem}
              openImageGallery={openImageGallery}
            />
          )}
          
          {activeTab === 'staff' && (
            <StaffContent 
              editingStaff={editingStaff}
              setEditingStaff={setEditingStaff}
            />
          )}
          
          {activeTab === 'reports' && (
            <ReportsContent 
              dashboardStats={dashboardStats} 
              revenueStats={revenueStats}
            />
          )}
          
          {activeTab === 'profile' && <ProfileContent user={ownerInfo} />}
        </div>
      </div>

      {/* Booking Details Modal */}
      {showBookingDetails && selectedBooking && (
        <BookingDetailsModal 
          booking={selectedBooking}
          onClose={() => setShowBookingDetails(false)}
        />
      )}

      {/* Image Gallery Modal */}
      {showImageModal && (
        <ImageGalleryModal 
          images={selectedImages}
          currentIndex={currentImageIndex}
          onClose={() => setShowImageModal(false)}
          onNavigate={(index) => setCurrentImageIndex(index)}
        />
      )}
    </div>
  );
};

// Image Gallery Modal Component
const ImageGalleryModal = ({ images, currentIndex, onClose, onNavigate }) => {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < images.length - 1) {
      onNavigate(currentIndex + 1);
    }
    if (isRightSwipe && currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  };

  const currentImage = images[currentIndex];

  return (
    <div className="od-modal-overlay" onClick={onClose}>
      <div className="od-image-gallery-modal" onClick={(e) => e.stopPropagation()}>
        <div className="od-gallery-header">
          <span className="od-gallery-counter">
            {currentIndex + 1} / {images.length}
          </span>
          <button className="od-gallery-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div 
          className="od-gallery-content"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {currentIndex > 0 && (
            <button 
              className="od-gallery-nav od-gallery-prev"
              onClick={() => onNavigate(currentIndex - 1)}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
          )}

          <div className="od-gallery-image-container">
            <img 
              src={`data:${currentImage.fileType};base64,${currentImage.fileData}`}
              alt={currentImage.caption || 'Gallery image'}
              className="od-gallery-image"
            />
            {currentImage.caption && (
              <div className="od-gallery-caption">{currentImage.caption}</div>
            )}
          </div>

          {currentIndex < images.length - 1 && (
            <button 
              className="od-gallery-nav od-gallery-next"
              onClick={() => onNavigate(currentIndex + 1)}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          )}
        </div>

        <div className="od-gallery-thumbnails">
          {images.map((img, idx) => (
            <div 
              key={idx}
              className={`od-gallery-thumbnail ${idx === currentIndex ? 'od-active' : ''}`}
              onClick={() => onNavigate(idx)}
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
  );
};

// Dashboard Content Component
const DashboardContent = ({ cafeData, loading, onAddCafe, getStatusBadge, dashboardStats, recentActivity, revenueStats, onRefresh, occupiedTablesCount }) => {
  const stats = [
    { label: 'Total Bookings', value: String(dashboardStats?.totalBookings || 0), icon: 'fa-calendar-check', color: '#3498db' },
    { label: 'Pending Requests', value: String(dashboardStats?.pendingBookings || 0), icon: 'fa-clock', color: '#f39c12' },
    { label: 'Total Revenue', value: `₹${revenueStats?.totalRevenue?.toFixed(2) || 0}`, icon: 'fa-rupee-sign', color: '#27ae60' },
    { label: 'Menu Items', value: String(dashboardStats?.menuItems || 0), icon: 'fa-utensils', color: '#9b59b6' },
    { label: 'Staff Members', value: String(dashboardStats?.staffCount || 0), icon: 'fa-users', color: '#e74c3c' },
    { label: 'Tables', value: `${occupiedTablesCount || 0}/${cafeData?.totalTables || 0}`, icon: 'fa-chair', color: '#e67e22' }
  ];

  const completedBookings = dashboardStats?.completedBookings || 0;
  const acceptedBookings = dashboardStats?.acceptedBookings || 0;
  const pendingBookings = dashboardStats?.pendingBookings || 0;
  const rejectedBookings = dashboardStats?.rejectedBookings || 0;
  const totalBookings = dashboardStats?.totalBookings || 0;

  const completedPercentage = totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(1) : 0;
  const acceptedPercentage = totalBookings > 0 ? ((acceptedBookings / totalBookings) * 100).toFixed(1) : 0;
  const pendingPercentage = totalBookings > 0 ? ((pendingBookings / totalBookings) * 100).toFixed(1) : 0;
  const rejectedPercentage = totalBookings > 0 ? ((rejectedBookings / totalBookings) * 100).toFixed(1) : 0;

  const pieData = [
    { label: 'Completed', value: completedBookings, percentage: completedPercentage, color: '#27ae60' },
    { label: 'Accepted', value: acceptedBookings, percentage: acceptedPercentage, color: '#3498db' },
    { label: 'Pending', value: pendingBookings, percentage: pendingPercentage, color: '#f39c12' },
    { label: 'Rejected', value: rejectedBookings, percentage: rejectedPercentage, color: '#e74c3c' }
  ].filter(item => item.value > 0);

  // Revenue by table type chart
  const revenueByType = revenueStats?.revenueByTableType || {};

  return (
    <div className="od-dashboard">
      {/* Cafe Header Bar */}
      <div className="od-cafe-header-bar">
        <div className="od-cafe-header-info">
          <i className="fas fa-mug-hot"></i>
          <div>
            <h2 className="od-cafe-header-name">{cafeData?.cafeName || 'My Cafe'}</h2>
            <span className="od-cafe-header-status">{getStatusBadge(cafeData?.status)}</span>
          </div>
        </div>
        <button className="od-refresh-btn" onClick={onRefresh} title="Refresh Data">
          <i className="fas fa-sync-alt"></i>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="od-stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="od-stat-card">
            <div className="od-stat-icon" style={{ background: stat.color + '20', color: stat.color }}>
              <i className={`fas ${stat.icon}`}></i>
            </div>
            <div className="od-stat-details">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="od-charts-row">
        <div className="od-chart-card">
          <h3><i className="fas fa-chart-pie"></i> Booking Distribution</h3>
          <div className="od-pie-chart-container">
            {(() => {
              const size = 180;
              const cx = size / 2;
              const cy = size / 2;
              const r = 65;
              const innerR = 38;
              let cumulativePercent = 0;

              // Build slices — handle the 100% single-slice case (SVG arc breaks at 360°)
              const allLegendItems = [
                { label: 'Completed', value: completedBookings, percentage: completedPercentage, color: '#27ae60' },
                { label: 'Accepted',  value: acceptedBookings,  percentage: acceptedPercentage,  color: '#3498db' },
                { label: 'Pending',   value: pendingBookings,   percentage: pendingPercentage,   color: '#f39c12' },
                { label: 'Rejected',  value: rejectedBookings,  percentage: rejectedPercentage,  color: '#e74c3c' },
              ];

              const slices = pieData.length === 1
                ? null  // will render as full circle below
                : pieData.length > 1 ? pieData.map((item) => {
                    const percent = item.value / totalBookings;
                    const startAngle = cumulativePercent * 360 - 90;
                    cumulativePercent += percent;
                    const endAngle = cumulativePercent * 360 - 90;
                    const largeArc = percent > 0.5 ? 1 : 0;
                    const startRad = (startAngle * Math.PI) / 180;
                    const endRad = (endAngle * Math.PI) / 180;
                    const x1 = cx + r * Math.cos(startRad);
                    const y1 = cy + r * Math.sin(startRad);
                    const x2 = cx + r * Math.cos(endRad);
                    const y2 = cy + r * Math.sin(endRad);
                    const ix1 = cx + innerR * Math.cos(startRad);
                    const iy1 = cy + innerR * Math.sin(startRad);
                    const ix2 = cx + innerR * Math.cos(endRad);
                    const iy2 = cy + innerR * Math.sin(endRad);
                    const d = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
                    return { ...item, d };
                  }) : null;

              return (
                <>
                  <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
                    {/* No data */}
                    {totalBookings === 0 && (
                      <>
                        <circle cx={cx} cy={cy} r={r} fill="#f0f0f0" />
                        <circle cx={cx} cy={cy} r={innerR} fill="white" />
                      </>
                    )}
                    {/* Single status — full donut ring */}
                    {pieData.length === 1 && (
                      <>
                        <circle cx={cx} cy={cy} r={r} fill={pieData[0].color} />
                        <circle cx={cx} cy={cy} r={innerR} fill="white" />
                      </>
                    )}
                    {/* Multiple statuses — arc slices */}
                    {slices && slices.map((slice, i) => (
                      <path key={i} d={slice.d} fill={slice.color} stroke="white" strokeWidth="3" />
                    ))}
                    {totalBookings > 0 && <circle cx={cx} cy={cy} r={innerR} fill="white" />}
                    <text x={cx} y={cy - 6} textAnchor="middle" fontSize="22" fontWeight="700" fill="#2c1810">{totalBookings}</text>
                    <text x={cx} y={cy + 13} textAnchor="middle" fontSize="11" fill="#8b6b4d">Total</text>
                  </svg>
                  <div className="od-pie-legend">
                    {totalBookings === 0
                      ? <div key="none" className="od-legend-item">
                          <span className="od-legend-color" style={{ background: '#ccc' }}></span>
                          <span className="od-legend-label">No Bookings</span>
                          <span className="od-legend-value">0 (0%)</span>
                        </div>
                      : allLegendItems.map(item => (
                          <div key={item.label} className="od-legend-item">
                            <span className="od-legend-color" style={{ background: item.color }}></span>
                            <span className="od-legend-label">{item.label}</span>
                            <span className="od-legend-value">{item.value} ({item.percentage}%)</span>
                          </div>
                        ))
                    }
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        <div className="od-chart-card">
          <h3><i className="fas fa-chart-line"></i> Revenue Overview</h3>
          <div className="od-revenue-chart">
            <div className="od-revenue-total">
              <span>Total Revenue</span>
              <h2>₹{revenueStats?.totalRevenue?.toFixed(2) || 0}</h2>
            </div>
            
            {/* Revenue by Table Type */}
            {Object.keys(revenueByType).length > 0 && (
              <div className="od-revenue-breakdown">
                <h4>Revenue by Table Type</h4>
                {Object.entries(revenueByType).map(([type, amount]) => (
                  <div key={type} className="od-revenue-item">
                    <span>{type}</span>
                    <span className="od-revenue-amount">₹{amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Daily Revenue Chart */}
            {revenueStats?.dailyRevenue && (
              <div className="od-daily-revenue">
                <h4>Last 7 Days</h4>
                <div className="od-mini-bars">
                  {Object.entries(revenueStats.dailyRevenue)
                    .sort(([a], [b]) => new Date(a) - new Date(b))
                    .map(([date, amount]) => {
                    const maxAmount = Math.max(...Object.values(revenueStats.dailyRevenue));
                    const height = maxAmount > 0 ? (amount / maxAmount) * 50 : 0;
                    return (
                      <div key={date} className="od-mini-bar-item" title={`${date}: ₹${amount.toFixed(2)}`}>
                        <div className="od-mini-bar" style={{ height: `${height}px` }}></div>
                        <span className="od-mini-bar-label">{new Date(date).toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="od-revenue-stats">
              <div className="od-revenue-stat">
                <span>Completed Bookings</span>
                <strong>{dashboardStats?.completedBookings || 0}</strong>
              </div>
              <div className="od-revenue-stat">
                <span>Avg. per Booking</span>
                <strong>₹{dashboardStats?.completedBookings > 0 
                  ? ((revenueStats?.totalRevenue || 0) / dashboardStats.completedBookings).toFixed(2)
                  : 0}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="od-recent-activity">
        <h3><i className="fas fa-history"></i> Recent Activity (Last 5)</h3>
        {recentActivity && recentActivity.length > 0 ? (
          <div className="od-activity-list">
            {recentActivity.slice(0, 5).map((a) => (
              <div key={a.id} className="od-activity-item">
                <div className="od-activity-dot"></div>
                <div className="od-activity-text">
                  <div className="od-activity-message">{a.message}</div>
                  <div className="od-activity-time">{a.createdAt?.replace('T', ' ')}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="od-empty-activity">
            <i className="fas fa-inbox"></i>
            <p>No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
};

// WalkIn Management Component - Enhanced with Table Types Display
const WalkInManagement = ({ cafeData, ownerId, onTableOccupied }) => {
  const [tableTypes, setTableTypes] = useState([]);
  const [form, setForm] = useState({
    tableTypeId: '',
    quantity: 1,
    customerName: '',
    customerPhone: '',
    durationMinutes: 60,
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [occupiedTables, setOccupiedTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(true);

  useEffect(() => {
    if (cafeData?.id) {
      loadTableTypes();
      loadOccupiedTables();
    }
  }, [cafeData]);

  const loadTableTypes = async () => {
    setLoadingTables(true);
    try {
      const res = await fetch(`http://localhost:8080/api/table-types/cafe/${cafeData.id}/with-bookings`);
      const data = await res.json();
      if (data.success) {
        setTableTypes(data.data || []);
        
        const allOccupied = [];
        data.data.forEach(type => {
          if (type.currentBookings && type.currentBookings.length > 0) {
            type.currentBookings.forEach(booking => {
              allOccupied.push({
                bookingId: booking.bookingId,
                tableNumber: booking.tableNumber,
                tableType: type.typeName,
                customerName: booking.customerName,
                startTime: booking.startTime,
                endTime: booking.endTime,
                status: booking.status,
                isWalkIn: booking.isWalkIn,
                customerPhone: booking.customerPhone
              });
            });
          }
        });
        setOccupiedTables(allOccupied);
      }
    } catch (error) {
      console.error('Failed to load table types:', error);
    } finally {
      setLoadingTables(false);
    }
  };

  const loadOccupiedTables = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/tables/owner/${ownerId}/occupied`);
      const data = await res.json();
      if (data.success) {
        setOccupiedTables(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load occupied tables:', error);
    }
  };

  const handleWalkIn = async () => {
    if (!form.tableTypeId) {
      alert('Please select table type');
      return;
    }
    if (!form.customerName.trim()) {
      alert('Please enter customer name');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/tables/walk-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cafeId: cafeData.id,
          ownerId,
          tableTypeId: form.tableTypeId,
          quantity: form.quantity,
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          durationMinutes: form.durationMinutes,
          notes: form.notes
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('Walk-in customer seated successfully');
        setForm({
          tableTypeId: '',
          quantity: 1,
          customerName: '',
          customerPhone: '',
          durationMinutes: 60,
          notes: ''
        });
        loadTableTypes();
        if (onTableOccupied) onTableOccupied();
      } else {
        alert(data.message || 'Failed to seat customer');
      }
    } catch (error) {
      console.error('Failed to create walk-in:', error);
      alert('Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const completeWalkIn = async (bookingId) => {
    if (!window.confirm('Mark this booking as completed?')) return;

    try {
      const res = await fetch(`http://localhost:8080/api/tables/${bookingId}/complete?ownerId=${ownerId}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        alert('Booking completed');
        loadTableTypes();
        loadOccupiedTables();
        if (onTableOccupied) onTableOccupied();
      } else {
        alert(data.message || 'Failed to complete booking');
      }
    } catch (error) {
      console.error('Failed to complete booking:', error);
    }
  };

  if (loadingTables) {
    return (
      <div className="od-loading">
        <div className="od-loading-spinner"></div>
        <p>Loading table types...</p>
      </div>
    );
  }

  // Styles as a separate object instead of jsx prop
  const styles = {
    container: { padding: '20px' },
    grid: { 
      display: 'grid', 
      gridTemplateColumns: '350px 1fr', 
      gap: '20px', 
      marginBottom: '30px' 
    },
    card: { 
      background: 'white', 
      borderRadius: '12px', 
      padding: '20px', 
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)' 
    },
    cardTitle: { 
      margin: '0 0 20px', 
      color: '#2c1810', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px',
      borderBottom: '2px solid #f0f0f0',
      paddingBottom: '10px'
    },
    section: { 
      background: 'white', 
      borderRadius: '12px', 
      padding: '20px', 
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)', 
      marginTop: '20px' 
    },
    typesGrid: { 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
      gap: '20px' 
    },
    typeCard: { 
      background: '#f8f5f0', 
      borderRadius: '10px', 
      padding: '15px', 
      border: '1px solid #e8dfca' 
    },
    typeHeader: { 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: '15px' 
    },
    totalBadge: { 
      background: '#3498db20', 
      color: '#3498db', 
      padding: '4px 8px', 
      borderRadius: '4px', 
      fontSize: '12px', 
      fontWeight: '600' 
    },
    availableBadge: { 
      background: '#27ae6020', 
      color: '#27ae60', 
      padding: '4px 8px', 
      borderRadius: '4px', 
      fontSize: '12px', 
      fontWeight: '600' 
    },
    bookingItem: { 
      background: 'white', 
      borderRadius: '8px', 
      padding: '12px', 
      marginBottom: '10px', 
      borderLeft: '3px solid #d4a574', 
      position: 'relative' 
    },
    statusWalkin: { 
      background: '#3498db20', 
      color: '#3498db', 
      border: '1px solid #3498db', 
      padding: '4px 8px', 
      borderRadius: '20px', 
      fontSize: '11px', 
      fontWeight: '600' 
    },
    statusBooked: { 
      background: '#f39c1220', 
      color: '#f39c12', 
      border: '1px solid #f39c12', 
      padding: '4px 8px', 
      borderRadius: '20px', 
      fontSize: '11px', 
      fontWeight: '600' 
    },
    formGroup: { marginBottom: '15px' },
    formLabel: { 
      display: 'block', 
      marginBottom: '5px', 
      color: '#666', 
      fontSize: '13px', 
      fontWeight: '500' 
    },
    formInput: { 
      width: '100%', 
      padding: '10px', 
      border: '2px solid #f0f0f0', 
      borderRadius: '8px', 
      fontSize: '14px' 
    },
    submitBtn: { 
      width: '100%', 
      padding: '12px', 
      background: 'linear-gradient(135deg, #2c1810, #3d2a1e)', 
      color: 'white', 
      border: 'none', 
      borderRadius: '8px', 
      fontWeight: '600', 
      cursor: 'pointer' 
    },
    occupiedGrid: { 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
      gap: '15px' 
    },
    occupiedCard: { 
      background: '#f8f5f0', 
      borderRadius: '8px', 
      padding: '15px', 
      borderLeft: '4px solid #d4a574' 
    },
    completeBtn: { 
      width: '100%', 
      padding: '8px', 
      background: '#27ae60', 
      color: 'white', 
      border: 'none', 
      borderRadius: '6px', 
      fontSize: '13px', 
      fontWeight: '500', 
      cursor: 'pointer' 
    },
    noOccupied: { 
      textAlign: 'center', 
      padding: '40px', 
      color: '#999' 
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.grid}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}><i className="fas fa-user-plus"></i> Seat Walk-in Customer</h3>
          
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Table Type</label>
            <select
              value={form.tableTypeId}
              onChange={(e) => setForm({...form, tableTypeId: e.target.value})}
              style={styles.formInput}
            >
              <option value="">Select Table Type</option>
              {tableTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.typeName} - {type.availableTables || 0} available 
                  ({type.currentBookings?.length || 0} occupied)
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Quantity</label>
            <input
              type="number"
              min="1"
              max={tableTypes.find(t => t.id === parseInt(form.tableTypeId))?.availableTables || 1}
              value={form.quantity}
              onChange={(e) => setForm({...form, quantity: parseInt(e.target.value) || 1})}
              style={styles.formInput}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Customer Name</label>
            <input
              type="text"
              value={form.customerName}
              onChange={(e) => setForm({...form, customerName: e.target.value})}
              placeholder="Enter customer name"
              style={styles.formInput}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Customer Phone (Optional)</label>
            <input
              type="tel"
              value={form.customerPhone}
              onChange={(e) => setForm({...form, customerPhone: e.target.value})}
              placeholder="Phone number"
              style={styles.formInput}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Duration (minutes)</label>
            <select
              value={form.durationMinutes}
              onChange={(e) => setForm({...form, durationMinutes: parseInt(e.target.value)})}
              style={styles.formInput}
            >
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
              <option value="180">3 hours</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Notes (Optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({...form, notes: e.target.value})}
              placeholder="Any special requests?"
              rows="2"
              style={styles.formInput}
            />
          </div>

          <button 
            style={styles.submitBtn}
            onClick={handleWalkIn}
            disabled={loading}
          >
            {loading ? 'Seating...' : 'Seat Customer'}
          </button>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}><i className="fas fa-chair"></i> Currently Occupied</h3>
          
          {occupiedTables.length === 0 ? (
            <div style={styles.noOccupied}>
              <i className="fas fa-smile" style={{ fontSize: '48px', color: '#d4a574', opacity: 0.5, marginBottom: '10px' }}></i>
              <p>No tables occupied right now</p>
            </div>
          ) : (
            <div style={styles.occupiedGrid}>
              {occupiedTables.map(table => (
                <div key={table.bookingId} style={styles.occupiedCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 600, color: '#2c1810' }}>Table #{table.tableNumber}</span>
                    <span style={table.isWalkIn ? styles.statusWalkin : styles.statusBooked}>
                      {table.isWalkIn ? 'Walk-in' : 'Booked'}
                    </span>
                  </div>
                  
                  <div style={{ marginBottom: '10px' }}>
                    <p style={{ margin: '5px 0', fontSize: '13px', color: '#333', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fas fa-user" style={{ width: '16px', color: '#d4a574' }}></i> {table.customerName}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '13px', color: '#333', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fas fa-phone" style={{ width: '16px', color: '#d4a574' }}></i> {table.customerPhone || 'No phone'}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '13px', color: '#333', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fas fa-clock" style={{ width: '16px', color: '#d4a574' }}></i> 
                      {table.startTime ? new Date(table.startTime).toLocaleTimeString() : ''} - 
                      {table.endTime ? new Date(table.endTime).toLocaleTimeString() : ''}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '13px', color: '#333', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fas fa-utensils" style={{ width: '16px', color: '#d4a574' }}></i> {table.tableType}
                    </p>
                  </div>

                  <button 
                    style={styles.completeBtn}
                    onClick={() => completeWalkIn(table.bookingId)}
                  >
                    Mark Completed
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.cardTitle}><i className="fas fa-table"></i> Table Types & Current Bookings</h3>
        <div style={styles.typesGrid}>
          {tableTypes.map(type => (
            <div key={type.id} style={styles.typeCard}>
              <div style={styles.typeHeader}>
                <h4 style={{ margin: 0, color: '#2c1810', fontSize: '18px' }}>{type.typeName}</h4>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span style={styles.totalBadge}>Total: {type.tableCount}</span>
                  <span style={styles.availableBadge}>Available: {type.availableTables}</span>
                </div>
              </div>
              
              {type.currentBookings && type.currentBookings.length > 0 ? (
                <div style={{ marginTop: '10px' }}>
                  <h5 style={{ margin: '0 0 10px', color: '#666', fontSize: '14px' }}>Current Bookings:</h5>
                  {type.currentBookings.map(booking => (
                    <div key={booking.bookingId} style={styles.bookingItem}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 600, color: '#2c1810' }}>Table #{booking.tableNumber}</span>
                        <span style={booking.isWalkIn ? styles.statusWalkin : styles.statusBooked}>
                          {booking.isWalkIn ? 'Walk-in' : 'Booked'}
                        </span>
                      </div>
                      <div>
                        <p style={{ margin: '4px 0', fontSize: '13px', color: '#666', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <i className="fas fa-user" style={{ width: '16px', color: '#d4a574' }}></i> {booking.customerName}
                        </p>
                        <p style={{ margin: '4px 0', fontSize: '13px', color: '#666', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <i className="fas fa-phone" style={{ width: '16px', color: '#d4a574' }}></i> {booking.customerPhone || 'No phone'}
                        </p>
                        <p style={{ margin: '4px 0', fontSize: '13px', color: '#666', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <i className="fas fa-clock" style={{ width: '16px', color: '#d4a574' }}></i> 
                          {booking.startTime ? new Date(booking.startTime).toLocaleTimeString() : ''} - 
                          {booking.endTime ? new Date(booking.endTime).toLocaleTimeString() : ''}
                        </p>
                      </div>
                      <button 
                        onClick={() => completeWalkIn(booking.bookingId)}
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          padding: '4px 12px',
                          background: '#27ae60',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        Complete
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#999', padding: '20px', background: 'white', borderRadius: '8px' }}>
                  No current bookings
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Cafe Content Component with Table Types Edit
const CafeContent = ({ cafeData, loading, showForm, setShowForm, onCafeRegistered, getStatusBadge, openImageGallery }) => {
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [tableTypes, setTableTypes] = useState([]);
  const [loadingTableTypes, setLoadingTableTypes] = useState(false);

  useEffect(() => {
    if (cafeData) {
      setEditForm(cafeData);
      if (cafeData.images) {
        setSelectedImages(cafeData.images);
      }
      if (cafeData.id) {
        loadTableTypes(cafeData.id);
      }
    }
  }, [cafeData]);

  const loadTableTypes = async (cafeId) => {
    setLoadingTableTypes(true);
    try {
      // Use /with-bookings endpoint — it returns pricePerHour + all fields
      const res = await fetch(`http://localhost:8080/api/table-types/cafe/${cafeId}/with-bookings`);
      const data = await res.json();
      if (data.success) {
        setTableTypes(data.data || []);
      } else {
        // Fallback to base endpoint
        const res2 = await fetch(`http://localhost:8080/api/table-types/cafe/${cafeId}`);
        const data2 = await res2.json();
        if (data2.success) setTableTypes(data2.data || []);
      }
    } catch (error) {
      console.error('Failed to load table types:', error);
    } finally {
      setLoadingTableTypes(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddressChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      address: {
        ...(prev.address || {}),
        [field]: value
      }
    }));
  };

  const handleTableTypeChange = (index, field, value) => {
    const updated = [...tableTypes];
    
    if (field === 'tableCount' || field === 'seatingCapacityPerTable' || field === 'pricePerHour') {
      const numValue = parseFloat(value) || 0;
      updated[index][field] = numValue;
    } else {
      updated[index][field] = value;
    }
    
    setTableTypes(updated);
  };

  const addTableType = () => {
    setTableTypes([
      ...tableTypes,
      {
        typeName: '',
        description: '',
        tableCount: 1,
        seatingCapacityPerTable: 4,
        pricePerHour: 500,
        isActive: true
      }
    ]);
  };

  const removeTableType = (index) => {
    setTableTypes(tableTypes.filter((_, i) => i !== index));
  };

  const saveTableTypes = async () => {
    if (!cafeData?.id) return;

    const owner = JSON.parse(localStorage.getItem('user') || '{}');
    const ownerId = owner?.id;

    for (const type of tableTypes) {
      if (!type.typeName?.trim()) continue; // skip blank rows

      const payload = {
        typeName: type.typeName,
        description: type.description || '',
        tableCount: Number(type.tableCount) || 1,
        seatingCapacityPerTable: Number(type.seatingCapacityPerTable) || 4,
        pricePerHour: Number(type.pricePerHour) || 0,
        isActive: type.isActive !== false,
        cafeId: cafeData.id,
      };

      let res;
      if (type.id) {
        // Update existing table type
        res = await fetch(
          `http://localhost:8080/api/table-types/${type.id}${ownerId ? `?ownerId=${ownerId}` : ''}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );
      } else {
        // Create new table type
        res = await fetch(
          `http://localhost:8080/api/table-types/cafe/${cafeData.id}${ownerId ? `?ownerId=${ownerId}` : ''}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Failed to save table type "${type.typeName}" (HTTP ${res.status})`);
      }

      const result = await res.json();
      if (!result.success) {
        throw new Error(result.message || `Failed to save table type "${type.typeName}"`);
      }
    }
  };

  const onImagePick = async (files) => {
    if (!files || files.length === 0) return;
    
    const newImages = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`);
        continue;
      }
      
      const reader = new FileReader();
      const imageData = await new Promise((resolve) => {
        reader.onloadend = () => {
          const base64 = String(reader.result || '').split(',')[1] || '';
          resolve({
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            fileData: base64,
            isPrimary: selectedImages.length === 0 && i === 0,
            caption: ''
          });
        };
        reader.readAsDataURL(file);
      });
      
      newImages.push(imageData);
    }
    
    setSelectedImages([...selectedImages, ...newImages]);
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const setPrimaryImage = (index) => {
    setSelectedImages(prev => prev.map((img, i) => ({
      ...img,
      isPrimary: i === index
    })));
  };

  const saveCafeChanges = async () => {
    setSaving(true);
    try {
      await saveTableTypes();

      const formData = new FormData();
      
      const cafeDetails = {
        cafeName: editForm.cafeName || cafeData.cafeName,
        description: editForm.description || cafeData.description,
        email: editForm.email || cafeData.email,
        phone: editForm.phone || cafeData.phone,
        establishedYear: editForm.establishedYear || cafeData.establishedYear,
        totalTables: editForm.totalTables || cafeData.totalTables,
        seatingCapacity: editForm.seatingCapacity || cafeData.seatingCapacity,
        hasWifi: editForm.hasWifi || false,
        hasParking: editForm.hasParking || false,
        hasAC: editForm.hasAC || false,
        address: editForm.address || cafeData.address
      };
      
      formData.append('cafe', new Blob([JSON.stringify(cafeDetails)], { type: 'application/json' }));
      
      if (selectedImages && selectedImages.length > 0) {
        for (let i = 0; i < selectedImages.length; i++) {
          const img = selectedImages[i];
          
          const byteCharacters = atob(img.fileData);
          const byteNumbers = new Array(byteCharacters.length);
          for (let j = 0; j < byteCharacters.length; j++) {
            byteNumbers[j] = byteCharacters.charCodeAt(j);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: img.fileType });
          
          const file = new File([blob], img.fileName || `image_${i}.jpg`, { type: img.fileType });
          
          formData.append('images', file);
          formData.append(`image_${i}_isPrimary`, img.isPrimary ? 'true' : 'false');
          formData.append(`image_${i}_caption`, img.caption || '');
        }
      }
  
      const response = await fetch(`http://localhost:8080/api/cafe/${cafeData.id}/update-with-images`, {
        method: 'PUT',
        body: formData
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Cafe details updated successfully');
        setEditMode(false);
        window.location.reload();
      } else {
        alert(data.message || 'Failed to update cafe');
      }
    } catch (error) {
      console.error('Error updating cafe:', error);
      alert('Unable to connect to server. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (showForm) {
    return <CafeRegistrationForm onSuccess={onCafeRegistered} onCancel={() => setShowForm(false)} />;
  }

  if (loading) {
    return (
      <div className="od-loading">
        <div className="od-loading-spinner"></div>
        <p>Loading cafe details...</p>
      </div>
    );
  }

  if (!cafeData?.hasCafe) {
    return (
      <div className="od-empty-state">
        <i className="fas fa-store"></i>
        <h3>No Cafe Registered</h3>
        <p>You haven't registered your cafe yet. Click the button below to get started.</p>
        <button className="od-add-cafe-btn" onClick={() => setShowForm(true)}>
          <i className="fas fa-plus"></i> Register Your Cafe
        </button>
      </div>
    );
  }

  if (editMode) {
    return (
      <div className="od-cafe-edit">
        <div className="od-cafe-header">
          <h2>Edit Cafe Details</h2>
          <div className="od-header-actions">
            <button className="od-secondary-btn" onClick={() => setEditMode(false)}>
              Cancel
            </button>
            <button className="od-primary-btn" onClick={saveCafeChanges} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="od-edit-form">
          <div className="od-form-section">
            <h3>Basic Information</h3>
            <div className="od-form-grid">
              <div className="od-form-group">
                <label>Cafe Name *</label>
                <input 
                  type="text" 
                  name="cafeName"
                  value={editForm.cafeName || ''} 
                  onChange={handleEditChange}
                  className="od-input"
                />
              </div>
              <div className="od-form-group od-full-width">
                <label>Description</label>
                <textarea 
                  name="description"
                  value={editForm.description || ''} 
                  onChange={handleEditChange}
                  className="od-textarea"
                  rows="3"
                />
              </div>
              <div className="od-form-group">
                <label>Email</label>
                <input 
                  type="email"
                  name="email"
                  value={editForm.email || ''} 
                  onChange={handleEditChange}
                  className="od-input"
                />
              </div>
              <div className="od-form-group">
                <label>Phone</label>
                <input 
                  type="text"
                  name="phone"
                  value={editForm.phone || ''} 
                  onChange={handleEditChange}
                  className="od-input"
                />
              </div>
              <div className="od-form-group">
                <label>Established Year</label>
                <input 
                  type="number"
                  name="establishedYear"
                  value={editForm.establishedYear || ''} 
                  onChange={handleEditChange}
                  className="od-input"
                />
              </div>
            </div>
          </div>

          <div className="od-form-section">
            <h3>Address</h3>
            <div className="od-form-grid">
              <div className="od-form-group od-full-width">
                <label>Street Address</label>
                <input 
                  type="text"
                  value={editForm.address?.street || ''} 
                  onChange={(e) => handleAddressChange('street', e.target.value)}
                  className="od-input"
                />
              </div>
              <div className="od-form-group">
                <label>Plot/Apartment</label>
                <input 
                  type="text"
                  value={editForm.address?.plotNo || ''} 
                  onChange={(e) => handleAddressChange('plotNo', e.target.value)}
                  className="od-input"
                />
              </div>
              <div className="od-form-group">
                <label>City</label>
                <input 
                  type="text"
                  value={editForm.address?.city || ''} 
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                  className="od-input"
                />
              </div>
              <div className="od-form-group">
                <label>Pincode</label>
                <input 
                  type="text"
                  value={editForm.address?.pincode || ''} 
                  onChange={(e) => handleAddressChange('pincode', e.target.value)}
                  className="od-input"
                />
              </div>
              <div className="od-form-group">
                <label>Country</label>
                <input 
                  type="text"
                  value={editForm.address?.country || 'India'} 
                  onChange={(e) => handleAddressChange('country', e.target.value)}
                  className="od-input"
                />
              </div>
            </div>
          </div>

          <div className="od-form-section">
            <h3>Facilities</h3>
            <div className="od-checkbox-group">
              <label className="od-checkbox">
                <input 
                  type="checkbox"
                  name="hasWifi"
                  checked={editForm.hasWifi || false}
                  onChange={handleEditChange}
                />
                <span>WiFi Available</span>
              </label>
              <label className="od-checkbox">
                <input 
                  type="checkbox"
                  name="hasParking"
                  checked={editForm.hasParking || false}
                  onChange={handleEditChange}
                />
                <span>Parking Available</span>
              </label>
              <label className="od-checkbox">
                <input 
                  type="checkbox"
                  name="hasAC"
                  checked={editForm.hasAC || false}
                  onChange={handleEditChange}
                />
                <span>Air Conditioning</span>
              </label>
            </div>
          </div>

          <div className="od-form-section">
            <h3>Table Types & Pricing</h3>
            {loadingTableTypes ? (
              <div className="od-loading">Loading table types...</div>
            ) : (
              <>
                {tableTypes.map((type, index) => (
                  <div key={index} className="od-table-type-edit" style={{ 
                    background: '#f9f9f9', 
                    padding: '15px', 
                    marginBottom: '15px', 
                    borderRadius: '8px',
                    border: '1px solid #e8dfca',
                    position: 'relative'
                  }}>
                    <button 
                      onClick={() => removeTableType(index)}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'none',
                        border: 'none',
                        color: '#e74c3c',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                    
                    <div className="od-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      <div className="od-form-group">
                        <label>Type Name *</label>
                        <input
                          type="text"
                          value={type.typeName || ''}
                          onChange={(e) => handleTableTypeChange(index, 'typeName', e.target.value)}
                          className="od-input"
                          placeholder="e.g., Regular, Birthday"
                        />
                      </div>
                      
                      <div className="od-form-group">
                        <label>Description</label>
                        <input
                          type="text"
                          value={type.description || ''}
                          onChange={(e) => handleTableTypeChange(index, 'description', e.target.value)}
                          className="od-input"
                          placeholder="Brief description"
                        />
                      </div>
                    </div>

                    <div className="od-form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                      <div className="od-form-group">
                        <label>Table Count *</label>
                        <input
                          type="number"
                          value={type.tableCount || 0}
                          onChange={(e) => handleTableTypeChange(index, 'tableCount', e.target.value)}
                          className="od-input"
                          min="1"
                        />
                      </div>
                      
                      <div className="od-form-group">
                        <label>Seats/Table *</label>
                        <input
                          type="number"
                          value={type.seatingCapacityPerTable || 4}
                          onChange={(e) => handleTableTypeChange(index, 'seatingCapacityPerTable', e.target.value)}
                          className="od-input"
                          min="1"
                        />
                      </div>
                      
                      <div className="od-form-group">
                        <label>Price/Hour (₹) *</label>
                        <input
                          type="number"
                          value={type.pricePerHour || 0}
                          onChange={(e) => handleTableTypeChange(index, 'pricePerHour', e.target.value)}
                          className="od-input"
                          min="0"
                          step="50"
                        />
                      </div>
                    </div>

                    <div className="od-form-group">
                      <label className="od-checkbox">
                        <input
                          type="checkbox"
                          checked={type.isActive !== false}
                          onChange={(e) => handleTableTypeChange(index, 'isActive', e.target.checked)}
                        />
                        <span>Active (available for booking)</span>
                      </label>
                    </div>
                  </div>
                ))}

                <button 
                  type="button"
                  onClick={addTableType}
                  className="od-secondary-btn"
                  style={{ width: '100%', marginTop: '10px' }}
                >
                  <i className="fas fa-plus"></i> Add Table Type
                </button>
              </>
            )}
          </div>

          <div className="od-form-section">
            <h3>Cafe Images</h3>
            <div className="od-form-group od-full-width">
              <input 
                type="file" 
                accept="image/*" 
                multiple 
                onChange={(e) => onImagePick(e.target.files)} 
                className="od-file-input"
              />
              
              {selectedImages.length > 0 && (
                <div className="od-image-preview-grid">
                  {selectedImages.map((img, index) => (
                    <div key={index} className="od-image-preview-item">
                      <img 
                        src={`data:${img.fileType};base64,${img.fileData}`} 
                        alt={`Preview ${index}`}
                      />
                      <div className="od-image-actions">
                        {!img.isPrimary && (
                          <button 
                            type="button"
                            className="od-image-action od-set-primary"
                            onClick={() => setPrimaryImage(index)}
                            title="Set as primary"
                          >
                            <i className="fas fa-star"></i>
                          </button>
                        )}
                        {img.isPrimary && (
                          <span className="od-primary-badge-small">
                            <i className="fas fa-crown"></i> Primary
                          </span>
                        )}
                        <button 
                          type="button"
                          className="od-image-action od-remove-image"
                          onClick={() => removeImage(index)}
                          title="Remove image"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="od-cafe-details">
      <div className="od-cafe-header">
        <div className="od-cafe-title">
          <h2>{cafeData.cafeName}</h2>
          {getStatusBadge(cafeData.status)}
        </div>
        <button className="od-edit-btn" onClick={() => setEditMode(true)}>
          <i className="fas fa-edit"></i> Edit Cafe
        </button>
      </div>

      <div className="od-cafe-info-grid">
        <div className="od-info-card">
          <h4><i className="fas fa-info-circle"></i> Basic Information</h4>
          <div className="od-info-item">
            <span>Description:</span>
            <p>{cafeData.description || 'No description provided'}</p>
          </div>
          <div className="od-info-item">
            <span>Email:</span>
            <p>{cafeData.email}</p>
          </div>
          <div className="od-info-item">
            <span>Phone:</span>
            <p>{cafeData.phone || 'Not provided'}</p>
          </div>
          <div className="od-info-item">
            <span>Established:</span>
            <p>{cafeData.establishedYear || 'Not specified'}</p>
          </div>
        </div>

        <div className="od-info-card">
          <h4><i className="fas fa-map-marker-alt"></i> Address</h4>
          {cafeData.address ? (
            <>
              <div className="od-info-item">
                <span>Street:</span>
                <p>{cafeData.address.street}</p>
              </div>
              <div className="od-info-item">
                <span>Plot/Apt:</span>
                <p>{cafeData.address.plotNo}</p>
              </div>
              <div className="od-info-item">
                <span>City:</span>
                <p>{cafeData.address.city}</p>
              </div>
              <div className="od-info-item">
                <span>Pincode:</span>
                <p>{cafeData.address.pincode}</p>
              </div>
              <div className="od-info-item">
                <span>Country:</span>
                <p>{cafeData.address.country}</p>
              </div>
            </>
          ) : (
            <p>No address provided</p>
          )}
        </div>

        <div className="od-info-card">
          <h4><i className="fas fa-cog"></i> Facilities</h4>
          <div className="od-facilities">
            <div className="od-facility-item">
              <i className={`fas fa-${cafeData.hasWifi ? 'check-circle' : 'times-circle'} ${cafeData.hasWifi ? 'od-yes' : 'od-no'}`}></i>
              <span>WiFi</span>
            </div>
            <div className="od-facility-item">
              <i className={`fas fa-${cafeData.hasParking ? 'check-circle' : 'times-circle'} ${cafeData.hasParking ? 'od-yes' : 'od-no'}`}></i>
              <span>Parking</span>
            </div>
            <div className="od-facility-item">
              <i className={`fas fa-${cafeData.hasAC ? 'check-circle' : 'times-circle'} ${cafeData.hasAC ? 'od-yes' : 'od-no'}`}></i>
              <span>Air Conditioning</span>
            </div>
          </div>
        </div>

        <div className="od-info-card">
          <h4><i className="fas fa-chart-line"></i> Capacity & Revenue</h4>
          <div className="od-info-item">
            <span>Total Tables:</span>
            <p>{cafeData.totalTables || 0}</p>
          </div>
          <div className="od-info-item">
            <span>Seating Capacity:</span>
            <p>{cafeData.seatingCapacity || 0}</p>
          </div>
          <div className="od-info-item">
            <span>Total Revenue:</span>
            <p style={{ color: '#27ae60', fontWeight: 'bold' }}>₹{cafeData.totalRevenue?.toFixed(2) || 0}</p>
          </div>
        </div>
      </div>

      {/* Table Types Section */}
      <div className="od-table-types-section" style={{ marginTop: '30px' }}>
        <h3><i className="fas fa-chair"></i> Table Types & Pricing</h3>
        <div className="od-table-types-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '15px',
          marginTop: '15px'
        }}>
          {/* Use tableTypes state (loaded via /with-bookings) which includes pricePerHour */}
          {(tableTypes.length > 0 ? tableTypes : (cafeData.tableTypes || [])).length > 0 ? (
            (tableTypes.length > 0 ? tableTypes : cafeData.tableTypes).map((type, index) => (
              <div key={type.id || index} className="od-table-type-card" style={{
                background: '#f8f5f0',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #e8dfca'
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#2c1810' }}>{type.typeName}</h4>
                {type.description && <p style={{ color: '#666', marginBottom: '10px' }}>{type.description}</p>}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span>Tables:</span>
                  <strong>{type.tableCount}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span>Seats per table:</span>
                  <strong>{type.seatingCapacityPerTable}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span>Price per hour:</span>
                  <strong style={{ color: '#27ae60' }}>
                    {type.pricePerHour != null && type.pricePerHour !== '' ? `₹${Number(type.pricePerHour).toLocaleString('en-IN')}` : 'Not set'}
                  </strong>
                </div>
              </div>
            ))
          ) : (
            <p>No table types configured</p>
          )}
        </div>
      </div>

      {cafeData.documents && cafeData.documents.length > 0 && (
        <div className="od-documents-section">
          <h3><i className="fas fa-file-alt"></i> Uploaded Documents</h3>
          <div className="od-documents-grid">
            {cafeData.documents.map((doc, index) => (
              <div key={index} className="od-document-card">
                <i className="fas fa-file-pdf"></i>
                <div className="od-document-info">
                  <strong>{doc.documentType}</strong>
                  <small>{doc.fileName}</small>
                </div>
                <button className="od-view-btn" onClick={() => window.open(`data:application/pdf;base64,${doc.fileData}`, '_blank')}>
                  <i className="fas fa-eye"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {cafeData.images && cafeData.images.length > 0 && (
        <div className="od-images-section">
          <h3><i className="fas fa-images"></i> Cafe Images</h3>
          <div className="od-images-grid">
            {cafeData.images.map((img, index) => (
              <div key={index} className="od-image-card" onClick={() => openImageGallery(cafeData.images, index)}>
                <img src={`data:${img.fileType};base64,${img.fileData}`} alt={img.caption || 'Cafe'} />
                {img.isPrimary && <span className="od-primary-badge">Primary</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Bookings Content Component
const BookingsContent = ({ setSelectedBooking, setShowBookingDetails }) => {
  const owner = JSON.parse(localStorage.getItem('user') || '{}');
  const ownerId = owner?.id;

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [userDetails, setUserDetails] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  // Receipt state
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  // Build a lookup map: bookingId -> { customerPhone, tableTypeName }
  // from the table-types/with-bookings API (same source as Order Management page)
  const fetchTableEnrichment = async (cafeId) => {
    try {
      const res = await fetch(`http://localhost:8080/api/table-types/cafe/${cafeId}/with-bookings`);
      const data = await res.json();
      if (!data.success) return {};
      const map = {};
      (data.data || []).forEach(type => {
        (type.currentBookings || []).forEach(b => {
          map[b.bookingId] = {
            customerPhone: b.customerPhone,
            tableTypeName: type.typeName,
          };
        });
      });
      return map;
    } catch {
      return {};
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const url = ownerId
        ? `http://localhost:8080/api/bookings/owner?ownerId=${ownerId}`
        : 'http://localhost:8080/api/bookings/owner';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        const rawBookings = data.data || [];

        // Fetch cafe details to get cafeId for enrichment API
        let enrichMap = {};
        try {
          const cafeRes = await fetch(
            ownerId
              ? `http://localhost:8080/api/cafe/my-cafe?ownerId=${ownerId}`
              : 'http://localhost:8080/api/cafe/my-cafe'
          );
          const cafeData = await cafeRes.json();
          const cafeId = cafeData?.data?.id;
          if (cafeId) {
            enrichMap = await fetchTableEnrichment(cafeId);
          }
        } catch { /* enrichment is best-effort */ }

        // Merge enrichment into each booking
        const enriched = rawBookings.map(b => ({
          ...b,
          customerPhone: b.customerPhone || enrichMap[b.id]?.customerPhone || null,
          tableTypeName: b.tableTypeName || enrichMap[b.id]?.tableTypeName || null,
        }));

        // Fetch user details — try /details first, fallback to base /users/{id}
        const fetchOneUser = async (id) => {
          try {
            const r1 = await fetch(`http://localhost:8080/api/users/${id}/details`);
            const d1 = await r1.json();
            if (d1.success && d1.data) return { id, detail: d1.data };
          } catch {}
          try {
            const r2 = await fetch(`http://localhost:8080/api/users/${id}`);
            const d2 = await r2.json();
            if (d2.success && d2.data) return { id, detail: d2.data };
            // Sometimes the user object is the root
            if (d2.id || d2.phone || d2.email) return { id, detail: d2 };
          } catch {}
          return null;
        };

        // Helper to extract phone from any user detail shape
        const extractPhone = (detail) => {
          if (!detail) return null;
          return detail.phone || detail.phoneNumber || detail.mobile ||
            detail.contactNumber || detail.mobileNumber || detail.contact || null;
        };

        const uniqueIds = [...new Set(enriched.map(b => b.customerId).filter(Boolean))];
        const results = await Promise.allSettled(uniqueIds.map(id => fetchOneUser(id)));
        const detailMap = {};
        results.forEach(r => {
          if (r.status === 'fulfilled' && r.value) {
            detailMap[r.value.id] = r.value.detail;
          }
        });

        // Merge phone from userDetails into bookings if not already present
        const withPhone = enriched.map(b => ({
          ...b,
          customerPhone: b.customerPhone || extractPhone(detailMap[b.customerId]) || null,
        }));

        setBookings(withPhone);
        setUserDetails(detailMap);
      }
    } catch (e) {
      console.error('Error fetching bookings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const act = async (bookingId, action) => {
    try {
      const url = ownerId
        ? `http://localhost:8080/api/bookings/${bookingId}/${action}?ownerId=${ownerId}`
        : `http://localhost:8080/api/bookings/${bookingId}/${action}`;
      const res = await fetch(url, { method: 'POST' });
      const data = await res.json();
      if (!data.success) alert(data.message || 'Action failed');
      await fetchBookings();
    } catch (e) {
      console.error('Booking action failed:', e);
      alert('Unable to connect to server');
    }
  };

  const loadReceiptForBooking = async (booking) => {
    setLoadingReceipt(true);
    try {
      // Fetch bill/order details for this booking
      const res = await fetch(`http://localhost:8080/api/orders/bill/${booking.id}`);
      const data = await res.json();
      const bill = data.success ? data.data : null;
      const allItems = bill ? (bill.orders || []).flatMap(o => o.items || []) : [];

      // Fetch cafe details for receipt
      const cafeRes = await fetch(
        ownerId
          ? `http://localhost:8080/api/cafe/my-cafe?ownerId=${ownerId}`
          : 'http://localhost:8080/api/cafe/my-cafe'
      );
      const cafeData = await cafeRes.json();
      const cafe = cafeData?.data || {};

      setReceiptData({
        bookingDetails: {
          bookingId: booking.id,
          customerName: booking.customerName,
          customerPhone: booking.customerPhone,
          tableNumber: booking.tableNumber,
          tableRevenue: bill?.tableRevenue || 0,
        },
        orderItems: allItems,
        paymentDetails: {
          method: bill?.paymentMethod || 'Cash',
          paymentId: bill?.paymentId || 'N/A',
          amount: bill?.grandTotal || 0,
        },
        cafeDetails: {
          cafeName: cafe.cafeName,
          address: cafe.address,
          gstNumber: cafe.gstNumber,
        },
      });
      setShowReceipt(true);
    } catch (e) {
      alert('Failed to load receipt: ' + e.message);
    } finally {
      setLoadingReceipt(false);
    }
  };

  const viewBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setShowBookingDetails(true);
  };

  const filtered = bookings.filter(b => filter === 'all' ? true : b.status === filter);
  const counts = {
    requested: bookings.filter(b => b.status === 'requested').length,
    accepted: bookings.filter(b => b.status === 'accepted').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    rejected: bookings.filter(b => b.status === 'rejected').length
  };

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedBookings = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  return (
    <div className="od-bookings">
      <div className="od-toolbar">
        <div className="od-toolbar-left">
          <div className="od-chip">Total: {bookings.length}</div>
          <div className="od-chip od-chip-requested">Requested: {counts.requested}</div>
          <div className="od-chip od-chip-accepted">Accepted: {counts.accepted}</div>
          <div className="od-chip od-chip-completed">Completed: {counts.completed}</div>
          <div className="od-chip od-chip-rejected">Rejected: {counts.rejected}</div>
        </div>
        <div className="od-toolbar-right">
          <select value={filter} onChange={(e) => handleFilterChange(e.target.value)} className="od-select">
            <option value="all">All Bookings</option>
            <option value="requested">Requested</option>
            <option value="accepted">Accepted</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
          <button className="od-secondary-btn" onClick={fetchBookings}>
            <i className="fas fa-rotate"></i> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="od-loading">
          <div className="od-loading-spinner"></div>
          <p>Loading bookings...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="od-empty-state">
          <i className="fas fa-calendar-check"></i>
          <h3>No bookings</h3>
          <p>Customer booking requests will appear here.</p>
        </div>
      ) : (
        <>
        <div className="od-cards-grid">
          {paginatedBookings.map((b) => {
            const userDetail = userDetails[b.customerId];
            return (
              <div key={b.id} className="od-card od-booking-card">
                <div className="od-card-header">
                  <div>
                    <div className="od-card-title">{b.customerName || 'Customer'}</div>
                    <div className="od-card-subtitle">
                      <i className="fas fa-clock"></i> {b.startTime?.replace('T', ' ')} 
                    </div>
                  </div>
                  <span className={`od-pill od-pill-${b.status}`}>{b.status}</span>
                </div>
                
                <div className="od-card-body">
                  <div className="od-card-row">
                    <i className="fas fa-phone"></i>
                    <strong>Phone:</strong> {
                      b.customerPhone || b.phone || 'Not provided'
                    }
                  </div>
                  <div className="od-card-row">
                    <i className="fas fa-envelope"></i>
                    <strong>Email:</strong> {
                      b.customerEmail || b.email ||
                      userDetail?.email || userDetail?.emailAddress || 'Not provided'
                    }
                  </div>
                  <div className="od-card-row">
                    <i className="fas fa-chair"></i>
                    <strong>Table type:</strong> {b.tableTypeName || b.tableType || b.type || 'Regular'}
                  </div>
                  <div className="od-card-row">
                    <i className="fas fa-hashtag"></i>
                    <strong>Table number:</strong> {b.tableNumber || 'Not assigned'}
                  </div>
                  {b.notes && (
                    <div className="od-card-row">
                      <i className="fas fa-sticky-note"></i>
                      <strong>Notes:</strong> {b.notes}
                    </div>
                  )}
                  
                  {userDetail && (
                    <div className="od-user-details-mini">
                      <div className="od-user-details-header" onClick={() => viewBookingDetails(b)}>
                        <i className="fas fa-user-circle"></i>
                        <span>View Full Details</span>
                        <i className="fas fa-chevron-right"></i>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="od-card-actions">
                  {b.status === 'requested' && (
                    <>
                      <button className="od-primary-btn" onClick={() => act(b.id, 'accept')}>
                        <i className="fas fa-check"></i> Accept
                      </button>
                      <button className="od-danger-btn" onClick={() => act(b.id, 'reject')}>
                        <i className="fas fa-times"></i> Reject
                      </button>
                    </>
                  )}
                  {b.status === 'accepted' && (
                    <button className="od-primary-btn" onClick={() => act(b.id, 'complete')}>
                      <i className="fas fa-flag-checkered"></i> Mark Completed
                    </button>
                  )}
                  {(b.status === 'completed' || b.status === 'rejected') && (
                    <>
                      <button className="od-secondary-btn" onClick={() => viewBookingDetails(b)}>
                        <i className="fas fa-circle-info"></i> View Details
                      </button>
                      {b.status === 'completed' && (
                        <button
                          className="od-receipt-btn"
                          onClick={() => loadReceiptForBooking(b)}
                          disabled={loadingReceipt}
                        >
                          {loadingReceipt
                            ? <><i className="fas fa-spinner fa-spin"></i> Loading...</>
                            : <><i className="fas fa-receipt"></i> Receipt</>
                          }
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="od-pagination">
            <button
              className="od-page-btn"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <div className="od-page-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`od-page-num ${currentPage === page ? 'od-active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              className="od-page-btn"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
            <span className="od-page-info">
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
            </span>
          </div>
        )}
        </>
      )}

      {/* Receipt Modal */}
      {showReceipt && receiptData && (
        <Receipt
          bookingDetails={receiptData.bookingDetails}
          orderItems={receiptData.orderItems}
          paymentDetails={receiptData.paymentDetails}
          cafeDetails={receiptData.cafeDetails}
          onClose={() => { setShowReceipt(false); setReceiptData(null); }}
          onDownload={() => window.print()}
        />
      )}
    </div>
  );
};

// Booking Details Modal
const BookingDetailsModal = ({ booking, onClose }) => {
  const [userDetail, setUserDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (booking.customerId) {
      fetchUserDetails(booking.customerId);
    }
  }, [booking.customerId]);

  const fetchUserDetails = async (userId) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/users/${userId}/details`);
      const data = await response.json();
      if (data.success) {
        setUserDetail(data.data);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
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

  const calculateDuration = () => {
    if (!booking.startTime || !booking.endTime) return 0;
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);
    return Math.round((end - start) / 60000); // minutes
  };

  const calculateRevenue = () => {
    if (!booking.startTime || !booking.endTime || !booking.tableTypeName) return 0;
    // This would need the price per hour from somewhere
    return 0;
  };

  return (
    <div className="od-modal-overlay" onClick={onClose}>
      <div className="od-modal od-large-modal" onClick={(e) => e.stopPropagation()}>
        <div className="od-modal-header">
          <h3><i className="fas fa-calendar-check"></i> Booking Details</h3>
          <button className="od-modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="od-modal-body">
          {loading ? (
            <div className="od-loading">
              <div className="od-loading-spinner"></div>
              <p>Loading user details...</p>
            </div>
          ) : (
            <>
              <div className="od-detail-section">
                <h4>Booking Information</h4>
                <div className="od-detail-grid">
                  <div className="od-detail-item">
                    <span className="od-detail-label">Booking ID</span>
                    <span className="od-detail-value">#{booking.id}</span>
                  </div>
                  <div className="od-detail-item">
                    <span className="od-detail-label">Status</span>
                    <span className={`od-pill od-pill-${booking.status}`}>{booking.status}</span>
                  </div>
                  <div className="od-detail-item">
                    <span className="od-detail-label">Start Time</span>
                    <span className="od-detail-value">{formatDate(booking.startTime)}</span>
                  </div>
                  <div className="od-detail-item">
                    <span className="od-detail-label">End Time</span>
                    <span className="od-detail-value">{formatDate(booking.endTime)}</span>
                  </div>
                  <div className="od-detail-item">
                    <span className="od-detail-label">Duration</span>
                    <span className="od-detail-value">{calculateDuration()} minutes</span>
                  </div>
                  <div className="od-detail-item">
                    <span className="od-detail-label">Table Type</span>
                    <span className="od-detail-value">{booking.tableTypeName || 'Regular'}</span>
                  </div>
                  <div className="od-detail-item">
                    <span className="od-detail-label">Table Number</span>
                    <span className="od-detail-value">{booking.tableNumber || 'Not assigned'}</span>
                  </div>
                  <div className="od-detail-item">
                    <span className="od-detail-label">Customer Phone</span>
                    <span className="od-detail-value">{booking.customerPhone || 'Not provided'}</span>
                  </div>
                  {booking.notes && (
                    <div className="od-detail-item od-full-width">
                      <span className="od-detail-label">Notes</span>
                      <span className="od-detail-value">{booking.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {userDetail && (
                <div className="od-detail-section">
                  <h4>Customer Information</h4>
                  <div className="od-user-profile-compact">
                    <div className="od-user-avatar">
                      {userDetail.firstName ? (
                        `${userDetail.firstName[0]}${userDetail.lastName ? userDetail.lastName[0] : ''}`
                      ) : (
                        <i className="fas fa-user-circle"></i>
                      )}
                    </div>
                    <div className="od-user-info">
                      <h5>{userDetail.firstName} {userDetail.lastName}</h5>
                      <p><i className="fas fa-envelope"></i> {userDetail.email || booking.customerEmail}</p>
                      <p><i className="fas fa-phone"></i> {userDetail.phone || booking.customerPhone || 'Not provided'}</p>
                    </div>
                  </div>

                  {userDetail.address && (
                    <div className="od-detail-subsection">
                      <h5>Address</h5>
                      <p>
                        {userDetail.address.street}, {userDetail.address.plotNo}<br />
                        {userDetail.address.city}, {userDetail.address.pincode}<br />
                        {userDetail.address.country}
                      </p>
                    </div>
                  )}

                  {userDetail.academicRecords && userDetail.academicRecords.length > 0 && (
                    <div className="od-detail-subsection">
                      <h5>Academic Records</h5>
                      {userDetail.academicRecords.map((record, idx) => (
                        <div key={idx} className="od-compact-item">
                          <strong>{record.degree}</strong> - {record.institution} ({record.yearOfPassing})
                        </div>
                      ))}
                    </div>
                  )}

                  {userDetail.workExperiences && userDetail.workExperiences.length > 0 && (
                    <div className="od-detail-subsection">
                      <h5>Work Experience</h5>
                      {userDetail.workExperiences.map((exp, idx) => (
                        <div key={idx} className="od-compact-item">
                          <strong>{exp.jobTitle}</strong> at {exp.companyName}
                          {exp.startDate && <div className="od-text-small">{formatDate(exp.startDate)} - {exp.currentlyWorkingHere ? 'Present' : formatDate(exp.endDate)}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="od-modal-footer">
          <button className="od-primary-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Menu Content Component
const MenuContent = ({ editingItem, setEditingItem, openImageGallery }) => {
  const owner = JSON.parse(localStorage.getItem('user') || '{}');
  const ownerId = owner?.id;

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    images: []
  });

  const load = async () => {
    setLoading(true);
    try {
      const url = ownerId
        ? `http://localhost:8080/api/menu/my?ownerId=${ownerId}`
        : 'http://localhost:8080/api/menu/my';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setItems(data.data || []);
    } catch (e) {
      console.error('Error loading menu:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (editingItem) {
      setForm({
        id: editingItem.id,
        name: editingItem.name || '',
        description: editingItem.description || '',
        price: editingItem.price || '',
        category: editingItem.category || '',
        images: editingItem.images || []
      });
      setShowAdd(true);
    }
  }, [editingItem]);

  const onImagePick = async (files) => {
    if (!files || files.length === 0) return;
    
    const newImages = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`);
        continue;
      }
      
      const reader = new FileReader();
      const imageData = await new Promise((resolve) => {
        reader.onloadend = () => {
          const base64 = String(reader.result || '').split(',')[1] || '';
          resolve({
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            fileData: base64,
            isPrimary: form.images.length === 0 && i === 0,
            caption: ''
          });
        };
        reader.readAsDataURL(file);
      });
      
      newImages.push(imageData);
    }
    
    setForm(prev => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }));
  };

  const removeImage = (index) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const setPrimaryImage = (index) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.map((img, i) => ({
        ...img,
        isPrimary: i === index
      }))
    }));
  };

  const submit = async () => {
    if (!form.name.trim()) return alert('Item name is required');
    const price = parseFloat(form.price);
    if (!price || price <= 0) return alert('Valid price is required');

    try {
      const url = editingItem
        ? `http://localhost:8080/api/menu/${editingItem.id}?ownerId=${ownerId}`
        : `http://localhost:8080/api/menu/my?ownerId=${ownerId}`;
      
      const method = editingItem ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, price })
      });
      
      const data = await res.json();
      if (!data.success) {
        alert(data.message || `Failed to ${editingItem ? 'update' : 'create'} menu item`);
        return;
      }
      
      setShowAdd(false);
      setEditingItem(null);
      setForm({ name: '', description: '', price: '', category: '', images: [] });
      await load();
    } catch (e) {
      console.error('Menu save failed:', e);
      alert('Unable to connect to server');
    }
  };

  const deleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    
    setDeletingId(itemId);
    try {
      const response = await fetch(`http://localhost:8080/api/menu/${itemId}?ownerId=${ownerId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        await load();
      } else {
        alert(data.message || 'Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting menu item:', error);
      alert('Unable to connect to server');
    } finally {
      setDeletingId(null);
    }
  };

  const categories = Array.from(new Set(items.map(i => i.category).filter(Boolean)));
  const filtered = items.filter(i => {
    const matchesQuery = !query
      ? true
      : `${i.name || ''} ${i.description || ''}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === 'all' ? true : (i.category || '') === category;
    return matchesQuery && matchesCategory;
  });

  return (
    <div className="od-menu">
      <div className="od-toolbar">
        <div className="od-toolbar-left">
          <button className="od-primary-btn" onClick={() => {
            setEditingItem(null);
            setForm({ name: '', description: '', price: '', category: '', images: [] });
            setShowAdd(true);
          }}>
            <i className="fas fa-plus"></i> Add Menu Item
          </button>
        </div>
        <div className="od-toolbar-right">
          <input
            className="od-input"
            placeholder="Search menu..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="od-select">
            <option value="all">All categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="od-secondary-btn" onClick={load}>
            <i className="fas fa-rotate"></i> Refresh
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="od-modal-overlay" onClick={() => {
          setShowAdd(false);
          setEditingItem(null);
        }}>
          <div className="od-modal od-large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="od-modal-header">
              <h3><i className="fas fa-utensils"></i> {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
              <button className="od-modal-close" onClick={() => {
                setShowAdd(false);
                setEditingItem(null);
              }}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="od-modal-body">
              <div className="od-form-grid">
                <div className="od-form-group">
                  <label>Item name *</label>
                  <input 
                    className="od-input" 
                    value={form.name} 
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} 
                  />
                </div>
                <div className="od-form-group">
                  <label>Category</label>
                  <input 
                    className="od-input" 
                    value={form.category} 
                    onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))} 
                    placeholder="Coffee, Snacks..." 
                  />
                </div>
                <div className="od-form-group">
                  <label>Price (₹) *</label>
                  <input 
                    className="od-input" 
                    type="number" 
                    value={form.price} 
                    onChange={(e) => setForm(prev => ({ ...prev, price: e.target.value }))} 
                  />
                </div>
                <div className="od-form-group od-form-group-full">
                  <label>Description</label>
                  <textarea 
                    className="od-textarea" 
                    rows={3} 
                    value={form.description} 
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} 
                  />
                </div>
                
                <div className="od-form-group od-form-group-full">
                  <label>Photos (Multiple)</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={(e) => onImagePick(e.target.files)} 
                    className="od-file-input"
                  />
                  
                  {form.images.length > 0 && (
                    <div className="od-image-preview-grid">
                      {form.images.map((img, index) => (
                        <div key={index} className="od-image-preview-item">
                          <img 
                            src={`data:${img.fileType};base64,${img.fileData}`} 
                            alt={`Preview ${index}`}
                          />
                          <div className="od-image-actions">
                            {!img.isPrimary && (
                              <button 
                                type="button"
                                className="od-image-action od-set-primary"
                                onClick={() => setPrimaryImage(index)}
                                title="Set as primary"
                              >
                                <i className="fas fa-star"></i>
                              </button>
                            )}
                            {img.isPrimary && (
                              <span className="od-primary-badge-small">
                                <i className="fas fa-crown"></i> Primary
                              </span>
                            )}
                            <button 
                              type="button"
                              className="od-image-action od-remove-image"
                              onClick={() => removeImage(index)}
                              title="Remove image"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="od-modal-footer">
              <button className="od-secondary-btn" onClick={() => {
                setShowAdd(false);
                setEditingItem(null);
              }}>Cancel</button>
              <button className="od-primary-btn" onClick={submit}>
                <i className="fas fa-check"></i> {editingItem ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="od-loading">
          <div className="od-loading-spinner"></div>
          <p>Loading menu...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="od-empty-state">
          <i className="fas fa-utensils"></i>
          <h3>No menu items</h3>
          <p>Add your first menu item to show it to customers.</p>
        </div>
      ) : (
        <div className="od-cards-grid">
          {filtered.map((i) => {
            const primaryImage = i.images?.find(img => img.isPrimary) || i.images?.[0];
            
            return (
              <div key={i.id} className="od-card od-menu-card">
                {primaryImage && (
                  <div 
                    className="od-card-image-container"
                    onClick={() => i.images?.length > 0 && openImageGallery(i.images, 0)}
                    style={{ cursor: i.images?.length > 0 ? 'pointer' : 'default' }}
                  >
                    <img
                      alt={i.name}
                      className="od-card-image"
                      src={`data:${primaryImage.fileType};base64,${primaryImage.fileData}`}
                    />
                    {i.images?.length > 1 && (
                      <span className="od-image-count">
                        <i className="fas fa-images"></i> {i.images.length}
                      </span>
                    )}
                  </div>
                )}
                
                <div className="od-card-header">
                  <div className="od-card-title">{i.name}</div>
                  <div className="od-pill">₹{i.price}</div>
                </div>
                
                <div className="od-card-body">
                  <div className="od-card-row"><strong>Category:</strong> {i.category || '—'}</div>
                  <div className="od-card-row od-card-description">{i.description || 'No description'}</div>
                </div>
                
                <div className="od-card-actions">
                  <button 
                    className="od-icon-btn" 
                    onClick={() => setEditingItem(i)}
                    title="Edit"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button 
                    className="od-icon-btn od-danger-btn" 
                    onClick={() => deleteItem(i.id)}
                    disabled={deletingId === i.id}
                    title="Delete"
                  >
                    {deletingId === i.id ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <i className="fas fa-trash"></i>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Staff Content Component
const StaffContent = ({ editingStaff, setEditingStaff }) => {
  const owner = JSON.parse(localStorage.getItem('user') || '{}');
  const ownerId = owner?.id;

  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'waiter', password: '' });

  const load = async () => {
    setLoading(true);
    try {
      const url = ownerId
        ? `http://localhost:8080/api/staff/my?ownerId=${ownerId}`
        : 'http://localhost:8080/api/staff/my';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setStaff(data.data || []);
    } catch (e) {
      console.error('Error loading staff:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (editingStaff) {
      setForm({
        id: editingStaff.id,
        name: editingStaff.name || '',
        email: editingStaff.email || '',
        phone: editingStaff.phone || '',
        role: editingStaff.role || 'waiter',
        password: ''
      });
      setShowAdd(true);
    }
  }, [editingStaff]);

  const create = async () => {
    if (!form.name.trim()) return alert('Name is required');
    if (!form.email.trim()) return alert('Email is required');
    if (!editingStaff && (!form.password || form.password.length < 6)) {
      return alert('Password must be at least 6 characters');
    }

    try {
      const url = editingStaff
        ? `http://localhost:8080/api/staff/${editingStaff.id}?ownerId=${ownerId}`
        : `http://localhost:8080/api/staff/my?ownerId=${ownerId}`;
      
      const method = editingStaff ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      const data = await res.json();
      if (!data.success) {
        alert(data.message || `Failed to ${editingStaff ? 'update' : 'add'} staff`);
        return;
      }
      
      setShowAdd(false);
      setEditingStaff(null);
      setForm({ name: '', email: '', phone: '', role: 'waiter', password: '' });
      await load();
    } catch (e) {
      console.error('Staff save failed:', e);
      alert('Unable to connect to server');
    }
  };

  const deleteStaff = async (staffId) => {
    if (!window.confirm('Are you sure you want to remove this staff member?')) return;
    
    setDeletingId(staffId);
    try {
      const response = await fetch(`http://localhost:8080/api/staff/${staffId}?ownerId=${ownerId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        await load();
      } else {
        alert(data.message || 'Failed to delete staff');
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      alert('Unable to connect to server');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="od-staff">
      <div className="od-toolbar">
        <div className="od-toolbar-left">
          <button className="od-primary-btn" onClick={() => {
            setEditingStaff(null);
            setForm({ name: '', email: '', phone: '', role: 'waiter', password: '' });
            setShowAdd(true);
          }}>
            <i className="fas fa-user-plus"></i> Add Staff
          </button>
        </div>
        <div className="od-toolbar-right">
          <button className="od-secondary-btn" onClick={load}>
            <i className="fas fa-rotate"></i> Refresh
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="od-modal-overlay" onClick={() => {
          setShowAdd(false);
          setEditingStaff(null);
        }}>
          <div className="od-modal" onClick={(e) => e.stopPropagation()}>
            <div className="od-modal-header">
              <h3><i className="fas fa-users"></i> {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}</h3>
              <button className="od-modal-close" onClick={() => {
                setShowAdd(false);
                setEditingStaff(null);
              }}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="od-modal-body">
              <div className="od-form-grid">
                <div className="od-form-group">
                  <label>Name *</label>
                  <input 
                    className="od-input" 
                    value={form.name} 
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} 
                  />
                </div>
                <div className="od-form-group">
                  <label>Role *</label>
                  <select 
                    className="od-select" 
                    value={form.role} 
                    onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value }))}
                  >
                    <option value="waiter">Waiter</option>
                    <option value="chef">Chef</option>
                  </select>
                </div>
                <div className="od-form-group">
                  <label>Email *</label>
                  <input 
                    className="od-input" 
                    type="email"
                    value={form.email} 
                    onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} 
                  />
                </div>
                <div className="od-form-group">
                  <label>Phone</label>
                  <input 
                    className="od-input" 
                    value={form.phone} 
                    onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))} 
                  />
                </div>
                {!editingStaff && (
                  <div className="od-form-group od-form-group-full">
                    <label>Password *</label>
                    <input 
                      className="od-input" 
                      type="password" 
                      value={form.password} 
                      onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))} 
                    />
                    <small style={{ color: '#666' }}>Owner sets the password directly</small>
                  </div>
                )}
              </div>
            </div>
            <div className="od-modal-footer">
              <button className="od-secondary-btn" onClick={() => {
                setShowAdd(false);
                setEditingStaff(null);
              }}>Cancel</button>
              <button className="od-primary-btn" onClick={create}>
                <i className="fas fa-check"></i> {editingStaff ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="od-loading">
          <div className="od-loading-spinner"></div>
          <p>Loading staff...</p>
        </div>
      ) : staff.length === 0 ? (
        <div className="od-empty-state">
          <i className="fas fa-users"></i>
          <h3>No staff added</h3>
          <p>Add your chef/waiter here.</p>
        </div>
      ) : (
        <div className="od-cards-grid">
          {staff.map((s) => (
            <div key={s.id} className="od-card od-staff-card">
              <div className="od-card-header">
                <div>
                  <div className="od-card-title">{s.name}</div>
                  <div className="od-card-subtitle">{s.email}</div>
                </div>
                <span className="od-pill">{s.role}</span>
              </div>
              <div className="od-card-body">
                <div className="od-card-row">
                  <i className="fas fa-phone"></i>
                  <strong>Phone:</strong> {s.phone || '—'}
                </div>
                <div className="od-card-row">
                  <i className="fas fa-calendar"></i>
                  <strong>Added:</strong> {s.createdAt?.replace('T', ' ')}
                </div>
              </div>
              <div className="od-card-actions">
                <button 
                  className="od-icon-btn" 
                  onClick={() => setEditingStaff(s)}
                  title="Edit"
                >
                  <i className="fas fa-edit"></i>
                </button>
                <button 
                  className="od-icon-btn od-danger-btn" 
                  onClick={() => deleteStaff(s.id)}
                  disabled={deletingId === s.id}
                  title="Delete"
                >
                  {deletingId === s.id ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fas fa-trash"></i>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Reports Content Component
const ReportsContent = ({ dashboardStats, revenueStats }) => {
  const [reportType, setReportType] = useState('weekly');
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('bookings');
  const owner = JSON.parse(localStorage.getItem('user') || '{}');
  const ownerId = owner?.id;

  useEffect(() => {
    generateChartData();
  }, [reportType, selectedMetric]);

  const generateChartData = async () => {
    setLoading(true);
    try {
      const response = await fetch(ownerId
        ? `http://localhost:8080/api/bookings/owner?ownerId=${ownerId}`
        : 'http://localhost:8080/api/bookings/owner');
      const data = await response.json();
      const bookings = data.success ? (data.data || []) : [];

      const now = new Date();
      let labels = [];
      let values = [];

      if (reportType === 'weekly') {
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dayStart = new Date(date.setHours(0, 0, 0, 0));
          const dayEnd = new Date(date.setHours(23, 59, 59, 999));
          
          const dayBookings = bookings.filter(b => {
            const bookingDate = new Date(b.createdAt || b.startTime);
            return bookingDate >= dayStart && bookingDate <= dayEnd;
          });
          
          labels.push(date.toLocaleDateString('en-IN', { weekday: 'short' }));
          
          if (selectedMetric === 'bookings') {
            values.push(dayBookings.length);
          } else {
            const revenue = dayBookings.filter(b => b.status === 'completed').length * 500;
            values.push(revenue);
          }
        }
      } else if (reportType === 'monthly') {
        for (let i = 3; i >= 0; i--) {
          const weekStart = new Date(now);
          weekStart.setDate(weekStart.getDate() - (i * 7));
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);
          
          const weekBookings = bookings.filter(b => {
            const bookingDate = new Date(b.createdAt || b.startTime);
            return bookingDate >= weekStart && bookingDate <= weekEnd;
          });
          
          labels.push(`Week ${4-i}`);
          
          if (selectedMetric === 'bookings') {
            values.push(weekBookings.length);
          } else {
            const revenue = weekBookings.filter(b => b.status === 'completed').length * 500;
            values.push(revenue);
          }
        }
      } else if (reportType === 'yearly') {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
          const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
          
          const monthBookings = bookings.filter(b => {
            const bookingDate = new Date(b.createdAt || b.startTime);
            return bookingDate >= monthStart && bookingDate <= monthEnd;
          });
          
          labels.push(months[date.getMonth()]);
          
          if (selectedMetric === 'bookings') {
            values.push(monthBookings.length);
          } else {
            const revenue = monthBookings.filter(b => b.status === 'completed').length * 500;
            values.push(revenue);
          }
        }
      }

      setChartData({ labels, values });
    } catch (error) {
      console.error('Error generating chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalBookings = dashboardStats?.totalBookings || 0;
  const completedBookings = dashboardStats?.completedBookings || 0;
  const pendingBookings = dashboardStats?.pendingBookings || 0;
  const acceptedBookings = dashboardStats?.acceptedBookings || 0;
  const rejectedBookings = dashboardStats?.rejectedBookings || 0;
  const totalRevenue = revenueStats?.totalRevenue || 0;
  
  const completionRate = totalBookings > 0 
    ? ((completedBookings / totalBookings) * 100).toFixed(1) 
    : 0;

  const maxValue = chartData ? Math.max(...chartData.values, 1) : 1;

  return (
    <div className="od-reports-enhanced">
      <div className="od-report-controls">
        <div className="od-control-group">
          <label>Time Period:</label>
          <div className="od-button-group">
            <button 
              className={`od-period-btn ${reportType === 'weekly' ? 'od-active' : ''}`}
              onClick={() => setReportType('weekly')}
            >
              <i className="fas fa-calendar-week"></i> Weekly
            </button>
            <button 
              className={`od-period-btn ${reportType === 'monthly' ? 'od-active' : ''}`}
              onClick={() => setReportType('monthly')}
            >
              <i className="fas fa-calendar-alt"></i> Monthly
            </button>
            <button 
              className={`od-period-btn ${reportType === 'yearly' ? 'od-active' : ''}`}
              onClick={() => setReportType('yearly')}
            >
              <i className="fas fa-calendar"></i> Yearly
            </button>
          </div>
        </div>

        <div className="od-control-group">
          <label>Metric:</label>
          <div className="od-button-group">
            <button 
              className={`od-metric-btn ${selectedMetric === 'bookings' ? 'od-active' : ''}`}
              onClick={() => setSelectedMetric('bookings')}
            >
              <i className="fas fa-calendar-check"></i> Bookings
            </button>
            <button 
              className={`od-metric-btn ${selectedMetric === 'revenue' ? 'od-active' : ''}`}
              onClick={() => setSelectedMetric('revenue')}
            >
              <i className="fas fa-rupee-sign"></i> Revenue
            </button>
          </div>
        </div>

        <button className="od-secondary-btn od-reports-refresh-btn" onClick={generateChartData}>
          <i className="fas fa-sync-alt"></i> Refresh
        </button>
      </div>

      <div className="od-summary-grid">
        <div className="od-summary-card">
          <div className="od-summary-icon">
            <i className="fas fa-chart-line"></i>
          </div>
          <div className="od-summary-details">
            <span className="od-summary-label">Total Revenue</span>
            <span className="od-summary-value">₹{totalRevenue.toFixed(2)}</span>
          </div>
        </div>

        <div className="od-summary-card">
          <div className="od-summary-icon">
            <i className="fas fa-calendar-check"></i>
          </div>
          <div className="od-summary-details">
            <span className="od-summary-label">Total Bookings</span>
            <span className="od-summary-value">{totalBookings}</span>
          </div>
        </div>

        <div className="od-summary-card">
          <div className="od-summary-icon">
            <i className="fas fa-percent"></i>
          </div>
          <div className="od-summary-details">
            <span className="od-summary-label">Completion Rate</span>
            <span className="od-summary-value">{completionRate}%</span>
          </div>
        </div>

        <div className="od-summary-card">
          <div className="od-summary-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="od-summary-details">
            <span className="od-summary-label">Completed</span>
            <span className="od-summary-value">{completedBookings}</span>
          </div>
        </div>
      </div>

      {/* Revenue by Table Type */}
      {revenueStats?.revenueByTableType && Object.keys(revenueStats.revenueByTableType).length > 0 && (
        <div className="od-chart-container">
          <h3><i className="fas fa-chart-pie"></i> Revenue by Table Type</h3>
          <div className="od-revenue-breakdown-list">
            {Object.entries(revenueStats.revenueByTableType).map(([type, amount]) => (
              <div key={type} className="od-revenue-item">
                <span>{type}</span>
                <div className="od-revenue-bar">
                  <div 
                    className="od-revenue-bar-fill" 
                    style={{ width: `${(amount / totalRevenue) * 100}%` }}
                  ></div>
                </div>
                <span className="od-revenue-amount">₹{amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="od-chart-container">
        <h3>
          <i className="fas fa-chart-bar"></i>
          {selectedMetric === 'bookings' ? 'Booking Trends' : 'Revenue Trends'} - {reportType}
        </h3>
        
        {loading ? (
          <div className="od-chart-loading">
            <div className="od-spinner-small"></div>
            <p>Loading chart data...</p>
          </div>
        ) : chartData && (
          <div className="od-bar-chart">
            {chartData.labels.map((label, index) => {
              const height = (chartData.values[index] / maxValue) * 100;
              return (
                <div key={index} className="od-chart-column">
                  <div className="od-chart-bar-container">
                    <div 
                      className="od-chart-bar"
                      style={{ height: `${height}%` }}
                    >
                      <span className="od-chart-value">
                        {selectedMetric === 'revenue' ? `₹${chartData.values[index]}` : chartData.values[index]}
                      </span>
                    </div>
                  </div>
                  <span className="od-chart-label">{label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};


// Profile Content Component
const ProfileContent = ({ user }) => {
  return (
    <div className="od-profile">
      <div className="od-profile-header">
        <div className="od-profile-avatar">
          <img src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=8b4513&color=fff&size=100`} alt="Profile" />
        </div>
        <div className="od-profile-info">
          <h2>{user?.name}</h2>
          <p>{user?.email}</p>
          <p className="od-profile-role">{user?.role}</p>
        </div>
      </div>
      
      <div className="od-profile-details">
        <h3>Profile Information</h3>
        <p>Profile details coming soon...</p>
      </div>
    </div>
  );
};

export default OwnerDashboard;