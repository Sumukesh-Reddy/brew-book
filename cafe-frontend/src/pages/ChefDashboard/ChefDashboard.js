// ChefDashboard.js - Fixed version
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ChefDashboard.css';

const ChefDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cafe, setCafe] = useState(null);
  const [orders, setOrders] = useState({
    waiting: [],
    preparing: [],
    ready: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('waiting');
  const [stats, setStats] = useState({
    totalToday: 0,
    completedToday: 0,
    avgPrepTime: 0
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userData || !userData.id) {
      navigate('/signin');
      return;
    }
    setUser(userData);
    
    // For chefs, we need to find which cafe they work at
    loadChefCafe(userData.id);
  }, []);

  useEffect(() => {
    if (cafe?.id) {
      loadOrders();
      // Poll for new orders every 5 seconds
      const interval = setInterval(loadOrders, 5000);
      return () => clearInterval(interval);
    }
  }, [cafe]);

  const loadChefCafe = async (userId) => {
    try {
      // First, get all approved cafes
      const cafesRes = await fetch('http://localhost:8080/api/cafe/public/approved');
      const cafesData = await cafesRes.json();
      
      if (cafesData.success && cafesData.data) {
        // For now, we'll assume the chef works at the first cafe
        if (cafesData.data.length > 0) {
          setCafe(cafesData.data[0]);
          console.log('Chef assigned to cafe:', cafesData.data[0].cafeName);
        } else {
          setError('No cafes found in the system');
        }
      }
    } catch (error) {
      console.error('Failed to load cafe:', error);
      setError('Failed to load cafe information');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    if (!cafe?.id) return;

    try {
      const res = await fetch(`http://localhost:8080/api/orders/chef/${cafe.id}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
        
        // Calculate stats
        const allOrders = [...data.data.waiting, ...data.data.preparing, ...data.data.ready];
        setStats(prev => ({
          ...prev,
          totalToday: allOrders.length,
          completedToday: allOrders.filter(o => o.status === 'ready').length
        }));
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const acceptOrder = async (orderId) => {
    try {
      const res = await fetch(`http://localhost:8080/api/orders/${orderId}/accept?chefId=${user.id}`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (data.success) {
        loadOrders();
      } else {
        alert(data.message || 'Failed to accept order');
      }
    } catch (error) {
      console.error('Failed to accept order:', error);
    }
  };

  const markReady = async (orderId) => {
    try {
      const res = await fetch(`http://localhost:8080/api/orders/${orderId}/ready?chefId=${user.id}`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (data.success) {
        loadOrders();
      } else {
        alert(data.message || 'Failed to mark order ready');
      }
    } catch (error) {
      console.error('Failed to mark order ready:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    navigate('/signin');
  };

  const getTimeElapsed = (timestamp) => {
    if (!timestamp) return '';
    const created = new Date(timestamp);
    const now = new Date();
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="cd-loading">
        <div className="cd-spinner"></div>
        <p>Loading chef dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cd-no-cafe">
        <i className="fas fa-exclamation-triangle" style={{ color: '#e74c3c' }}></i>
        <h2>Error</h2>
        <p>{error}</p>
        <button className="cd-btn" onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  if (!cafe) {
    return (
      <div className="cd-no-cafe">
        <i className="fas fa-store"></i>
        <h2>No Cafe Assigned</h2>
        <p>You haven't been assigned to any cafe yet. Please contact the cafe owner.</p>
        <button className="cd-btn" onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  return (
    <div className="cd-chef-dashboard">
      {/* Header */}
      <div className="cd-header">
        <div className="cd-header-left">
          <h1><i className="fas fa-utensils"></i> Chef Dashboard - {cafe.cafeName}</h1>
          <p>Welcome back, {user?.name || 'Chef'}!</p>
        </div>
        <div className="cd-header-right">
          
          <button className="cd-logout-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="cd-stats-grid">
        <div className="cd-stat-card">
          <div className="cd-stat-icon" style={{ background: '#f39c1220', color: '#f39c12' }}>
            <i className="fas fa-clock"></i>
          </div>
          <div className="cd-stat-details">
            <span className="cd-stat-label">Waiting</span>
            <span className="cd-stat-value">{orders.waiting.length}</span>
          </div>
        </div>

        <div className="cd-stat-card">
          <div className="cd-stat-icon" style={{ background: '#e67e2220', color: '#e67e22' }}>
            <i className="fas fa-fire"></i>
          </div>
          <div className="cd-stat-details">
            <span className="cd-stat-label">Preparing</span>
            <span className="cd-stat-value">{orders.preparing.length}</span>
          </div>
        </div>

        <div className="cd-stat-card">
          <div className="cd-stat-icon" style={{ background: '#27ae6020', color: '#27ae60' }}>
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="cd-stat-details">
            <span className="cd-stat-label">Ready</span>
            <span className="cd-stat-value">{orders.ready.length}</span>
          </div>
        </div>

      </div>

      {/* Tabs */}
      <div className="cd-tabs">
        <button 
          className={`cd-tab ${activeTab === 'waiting' ? 'cd-active' : ''}`}
          onClick={() => setActiveTab('waiting')}
        >
          <i className="fas fa-clock"></i> Waiting ({orders.waiting.length})
        </button>
        <button 
          className={`cd-tab ${activeTab === 'preparing' ? 'cd-active' : ''}`}
          onClick={() => setActiveTab('preparing')}
        >
          <i className="fas fa-fire"></i> Preparing ({orders.preparing.length})
        </button>
        <button 
          className={`cd-tab ${activeTab === 'ready' ? 'cd-active' : ''}`}
          onClick={() => setActiveTab('ready')}
        >
          <i className="fas fa-check-circle"></i> Ready ({orders.ready.length})
        </button>
      </div>

      {/* Content */}
      <div className="cd-content">
        {/* Waiting Orders */}
        {activeTab === 'waiting' && (
          <div className="cd-orders-grid">
            {orders.waiting.length === 0 ? (
              <div className="cd-empty-state">
                <i className="fas fa-smile"></i>
                <h3>No Waiting Orders</h3>
                <p>All caught up! Take a break while waiting for new orders.</p>
              </div>
            ) : (
              orders.waiting.map(order => (
                <div key={order.id} className="cd-order-card waiting">
                  <div className="cd-order-header">
                    <div>
                      <span className="cd-table-badge">Table #{order.tableNumber}</span>
                      <span className="cd-time">{getTimeElapsed(order.createdAt)}</span>
                    </div>
                    <span className="cd-order-id">Order #{order.id}</span>
                  </div>

                  <div className="cd-customer-info">
                    <i className="fas fa-user"></i> {order.customerName}
                    {order.customerPhone && (
                      <span className="cd-phone"> 📞 {order.customerPhone}</span>
                    )}
                  </div>

                  <div className="cd-items-list">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="cd-order-item">
                        <span className="cd-item-quantity">{item.quantity}x</span>
                        <span className="cd-item-name">{item.itemName}</span>
                        {item.specialRequest && (
                          <span className="cd-item-special" title={item.specialRequest}>
                            <i className="fas fa-info-circle"></i>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {order.specialInstructions && (
                    <div className="cd-order-notes">
                      <i className="fas fa-sticky-note"></i> {order.specialInstructions}
                    </div>
                  )}

                  <div className="cd-order-actions">
                    <button 
                      className="cd-accept-btn"
                      onClick={() => acceptOrder(order.id)}
                    >
                      <i className="fas fa-check"></i> Accept Order
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Preparing Orders */}
        {activeTab === 'preparing' && (
          <div className="cd-orders-grid">
            {orders.preparing.length === 0 ? (
              <div className="cd-empty-state">
                <i className="fas fa-smile"></i>
                <h3>No Orders in Preparation</h3>
                <p>Accept some orders from the waiting list.</p>
              </div>
            ) : (
              orders.preparing.map(order => (
                <div key={order.id} className="cd-order-card preparing">
                  <div className="cd-order-header">
                    <div>
                      <span className="cd-table-badge">Table #{order.tableNumber}</span>
                      <span className="cd-time">Started {getTimeElapsed(order.acceptedAt)}</span>
                    </div>
                    <span className="cd-order-id">Order #{order.id}</span>
                  </div>

                  <div className="cd-items-list">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="cd-order-item">
                        <span className="cd-item-quantity">{item.quantity}x</span>
                        <span className="cd-item-name">{item.itemName}</span>
                        {item.specialRequest && (
                          <span className="cd-item-special">{item.specialRequest}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="cd-order-actions">
                    <button 
                      className="cd-ready-btn"
                      onClick={() => markReady(order.id)}
                    >
                      <i className="fas fa-check-circle"></i> Mark as Ready
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="cd-progress-bar">
                    <div className="cd-progress-fill" style={{ width: '50%' }}></div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Ready Orders */}
        {activeTab === 'ready' && (
          <div className="cd-orders-grid">
            {orders.ready.length === 0 ? (
              <div className="cd-empty-state">
                <i className="fas fa-smile"></i>
                <h3>No Ready Orders</h3>
                <p>Orders that are ready will appear here.</p>
              </div>
            ) : (
              orders.ready.map(order => (
                <div key={order.id} className="cd-order-card ready">
                  <div className="cd-order-header">
                    <div>
                      <span className="cd-table-badge">Table #{order.tableNumber}</span>
                      <span className="cd-time">Ready {getTimeElapsed(order.readyAt)}</span>
                    </div>
                    <span className="cd-order-id">Order #{order.id}</span>
                  </div>

                  <div className="cd-items-list">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="cd-order-item">
                        <span className="cd-item-quantity">{item.quantity}x</span>
                        <span className="cd-item-name">{item.itemName}</span>
                      </div>
                    ))}
                  </div>

                  <div className="cd-order-actions">
                    <button 
                      className="cd-served-btn" disabled
                    >
                      <i className="fas fa-utensils"></i> Ready for Waiter
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChefDashboard;