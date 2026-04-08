// TableOrderManagement.js - Fix the undefined variables and missing imports
import React, { useState, useEffect } from 'react';
import RazorpayPaymentModal from '../../components/RazorpayPaymentModal/RazorpayPaymentModal';
import UPIPaymentModal from '../../components/UPIPaymentModal/UPIPaymentModal';
import PaymentModal from '../../components/PaymentModal/PaymentModal';
import Receipt from '../../components/Receipt/Receipt';
import './TableOrderManagement.css';

const TableOrderManagement = ({ cafeData, ownerId, onClose, onOrderComplete }) => {
  const [activeTab, setActiveTab] = useState('occupied');
  const [occupiedTables, setOccupiedTables] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [tableTypes, setTableTypes] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [orderNotes, setOrderNotes] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [currentBill, setCurrentBill] = useState(null);
  const [waiterInfo, setWaiterInfo] = useState(null);
  const [specialRequest, setSpecialRequest] = useState('');
  const [error, setError] = useState('');

  // For order tracking
  const [activeOrders, setActiveOrders] = useState([]);
  const [ordersByTable, setOrdersByTable] = useState({});
  // eslint-disable-next-line no-unused-vars
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [readyOrders, setReadyOrders] = useState([]);
  const [preparingOrders, setPreparingOrders] = useState([]);

  // History state
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('today');
  const [historySearch, setHistorySearch] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const HISTORY_PAGE_SIZE = 8;

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

  const loadTableTypes = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/table-types/cafe/${cafeData.id}`);
      const data = await res.json();
      if (data.success) {
        setTableTypes(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load table types:', error);
    }
  };

  const loadMenuItems = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/menu/my?ownerId=${ownerId}`);
      const data = await res.json();
      if (data.success) {
        setMenuItems(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load menu items:', error);
    }
  };

  const loadActiveOrders = async () => {
    if (!cafeData?.id) return;
    
    setLoadingOrders(true);
    try {
      const res = await fetch(`http://localhost:8080/api/orders/waiter/${cafeData.id}`);
      const data = await res.json();
      if (data.success) {
        const orders = data.data || [];
        setActiveOrders(orders);
        setReadyOrders(orders.filter(o => o.status === 'ready'));
        setPreparingOrders(orders.filter(o => o.status === 'preparing'));
        
        const byTable = {};
        orders.forEach(order => {
          if (!byTable[order.tableNumber]) {
            byTable[order.tableNumber] = [];
          }
          byTable[order.tableNumber].push(order);
        });
        setOrdersByTable(byTable);
      }
    } catch (error) {
      console.error('Failed to load active orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (cafeData?.id) {
      loadOccupiedTables();
      loadTableTypes();
      loadMenuItems();
      loadActiveOrders();
      
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setWaiterInfo(user);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cafeData]);

  useEffect(() => {
    if (cafeData?.id) {
      const interval = setInterval(() => {
        loadActiveOrders();
        loadOccupiedTables();
      }, 10000);
      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cafeData]);

  // Load history when History tab is opened or filter changes
  useEffect(() => {
    if (activeTab === 'history' && cafeData?.id) {
      loadHistory();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, historyFilter, cafeData]);

  const loadHistory = async () => {
    if (!cafeData?.id) return;
    setHistoryLoading(true);
    try {
      // Calculate date range based on filter
      const now = new Date();
      let fromDate = null;
      if (historyFilter === 'today') {
        fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (historyFilter === 'week') {
        fromDate = new Date(now);
        fromDate.setDate(fromDate.getDate() - 7);
      } else if (historyFilter === 'month') {
        fromDate = new Date(now);
        fromDate.setDate(fromDate.getDate() - 30);
      }

      // Fetch completed bookings for the owner
      const url = `http://localhost:8080/api/bookings/owner?ownerId=${ownerId}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data.success) { setHistoryData([]); return; }

      let completedBookings = (data.data || []).filter(b => b.status === 'completed');

      // Apply date filter
      if (fromDate) {
        completedBookings = completedBookings.filter(b => {
          const d = new Date(b.updatedAt || b.endTime || b.startTime);
          return d >= fromDate;
        });
      }

      // Sort newest first
      completedBookings.sort((a, b) =>
        new Date(b.updatedAt || b.endTime || 0) - new Date(a.updatedAt || a.endTime || 0)
      );

      // Fetch order+bill details for each booking (batch, limit to first 30)
      const slice = completedBookings.slice(0, 30);
      const enriched = await Promise.all(
        slice.map(async (booking) => {
          try {
            const billRes = await fetch(`http://localhost:8080/api/orders/bill/${booking.id}`);
            const billData = await billRes.json();
            if (billData.success) {
              return {
                ...booking,
                bill: billData.data,
                orders: billData.data?.orders || [],
                grandTotal: billData.data?.grandTotal || 0,
                foodSubtotal: billData.data?.foodSubtotal || 0,
                paymentMethod: billData.data?.paymentMethod || 'N/A',
                paymentId: billData.data?.paymentId || null,
              };
            }
          } catch {}
          return { ...booking, bill: null, orders: [], grandTotal: 0 };
        })
      );

      setHistoryData(enriched);
      setHistoryPage(1);
    } catch (e) {
      console.error('Failed to load history:', e);
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadReceiptForHistory = async (booking) => {
    setLoadingReceipt(true);
    try {
      // Use already-fetched bill if available
      let bill = booking.bill;
      if (!bill) {
        const res = await fetch(`http://localhost:8080/api/orders/bill/${booking.id}`);
        const data = await res.json();
        bill = data.success ? data.data : null;
      }
      const allItems = (bill?.orders || []).flatMap(o => o.items || []);
      setReceiptData({
        bookingDetails: {
          bookingId: booking.id,
          customerName: booking.customerName,
          customerPhone: booking.customerPhone || 'N/A',
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
          cafeName: cafeData?.cafeName,
          address: cafeData?.address,
          gstNumber: cafeData?.gstNumber,
        },
      });
      setShowReceiptModal(true);
    } catch (e) {
      alert('Failed to load receipt: ' + e.message);
    } finally {
      setLoadingReceipt(false);
    }
  };

  const loadOrdersForTable = async (tableNumber) => {
    if (!cafeData?.id) return;
    
    try {
      const res = await fetch(`http://localhost:8080/api/orders/table/${cafeData.id}/${tableNumber}`);
      const data = await res.json();
      if (data.success) {
        setOrdersByTable(prev => ({
          ...prev,
          [tableNumber]: data.data
        }));
      }
    } catch (error) {
      console.error('Failed to load table orders:', error);
    }
  };

  const addToOrder = (item) => {
    const existing = cartItems.find(cartItem => cartItem.menuItemId === item.id);
    if (existing) {
      setCartItems(cartItems.map(cartItem =>
        cartItem.menuItemId === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCartItems([...cartItems, { 
        menuItemId: item.id,
        itemName: item.name,
        price: item.price,
        quantity: 1,
        specialRequest: ''
      }]);
    }
  };

  const updateQuantity = (index, newQuantity) => {
    if (newQuantity <= 0) {
      setCartItems(cartItems.filter((_, i) => i !== index));
    } else {
      setCartItems(cartItems.map((item, i) =>
        i === index ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const updateSpecialRequest = (index, request) => {
    setCartItems(cartItems.map((item, i) =>
      i === index ? { ...item, specialRequest: request } : item
    ));
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.05;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const submitOrder = async () => {
    if (cartItems.length === 0) {
      alert('Please add items to the order');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderData = {
        cafeId: cafeData.id,
        tableNumber: selectedTable.tableNumber,
        bookingId: selectedTable.bookingId,
        waiterId: waiterInfo?.id,
        customerName: selectedTable.customerName,
        customerPhone: selectedTable.customerPhone,
        orderType: 'DINE_IN',
        specialInstructions: specialRequest,
        items: cartItems.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          specialRequest: item.specialRequest
        }))
      };

      const res = await fetch('http://localhost:8080/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const data = await res.json();
      if (data.success) {
        alert('Order submitted successfully!');
        setCartItems([]);
        setSpecialRequest('');
        setSelectedTable(null);
        loadActiveOrders();
        if (selectedTable) {
          loadOrdersForTable(selectedTable.tableNumber);
        }
      } else {
        setError(data.message || 'Failed to submit order');
      }
    } catch (error) {
      console.error('Failed to submit order:', error);
      setError('Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const serveOrder = async (orderId) => {
    try {
      const res = await fetch(`http://localhost:8080/api/orders/${orderId}/serve?waiterId=${waiterInfo?.id}`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (data.success) {
        alert('Order marked as served');
        loadActiveOrders();
        if (selectedTable) {
          loadOrdersForTable(selectedTable.tableNumber);
        }
      } else {
        alert(data.message || 'Failed to serve order');
      }
    } catch (error) {
      console.error('Failed to serve order:', error);
    }
  };

  const loadBillForTable = async (bookingId, tableNumber) => {
    try {
      setError('');
      const res = await fetch(`http://localhost:8080/api/orders/bill/${bookingId}`);
      const data = await res.json();
      if (data.success) {
        setCurrentBill({ ...data.data, tableNumber, bookingId });
        setShowPaymentModal(true);
      } else {
        alert(data.message || 'Failed to load bill');
      }
    } catch (error) {
      console.error('Failed to load bill:', error);
      setError('Failed to load bill: ' + error.message);
    }
  };

  const processCashPayment = async () => {
    setProcessingPayment(true);
    setError('');

    try {
      const totalRevenue = currentBill.grandTotal;

      // Update cafe revenue
      await fetch(`http://localhost:8080/api/cafe/${cafeData.id}/revenue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalRevenue,
          bookingId: currentBill.bookingId,
          paymentMethod: 'cash',
          notes: orderNotes
        })
      });

      // Complete the booking
      await fetch(`http://localhost:8080/api/tables/${currentBill.bookingId}/complete?ownerId=${ownerId}`, {
        method: 'POST'
      });

      alert(`Cash payment of ₹${totalRevenue.toFixed(2)} processed successfully!`);
      setShowPaymentModal(false);
      setCurrentBill(null);
      setSelectedTable(null);
      setCartItems([]);
      loadOccupiedTables();
      loadActiveOrders();
      
      if (onOrderComplete) onOrderComplete();
      
    } catch (error) {
      console.error('Failed to process cash payment:', error);
      setError('Failed to process payment: ' + error.message);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePaymentSuccess = (paymentData) => {
    setShowRazorpayModal(false);
    setShowPaymentModal(false);
    setCurrentBill(null);
    
    alert(`Payment of ₹${paymentData.amount?.toFixed(2) || paymentData.grandTotal?.toFixed(2)} successful!`);
    
    // Refresh data
    loadOccupiedTables();
    loadActiveOrders();
    setSelectedTable(null);
    setCartItems([]);
    
    if (onOrderComplete) onOrderComplete();
  };

  const getOrderStatusBadge = (status) => {
    switch(status) {
      case 'waiting': return <span className="tom-badge waiting"><i className="fas fa-clock"></i> Waiting</span>;
      case 'preparing': return <span className="tom-badge preparing"><i className="fas fa-fire"></i> Preparing</span>;
      case 'ready': return <span className="tom-badge ready"><i className="fas fa-check-circle"></i> Ready</span>;
      case 'served': return <span className="tom-badge served"><i className="fas fa-utensils"></i> Served</span>;
      default: return <span className="tom-badge">{status}</span>;
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="tom-container">
      <div className="tom-header">
        <h2><i className="fas fa-utensils"></i> Table Order Management</h2>
        <div className="tom-header-actions">
          <button className="tom-refresh-btn" onClick={loadActiveOrders} title="Refresh">
            <i className="fas fa-sync-alt"></i>
          </button>
          <button className="tom-close-btn" onClick={onClose} title="Close">
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="tom-stats-grid">
        <div className="tom-stat-card">
          <div className="tom-stat-icon" style={{ background: '#3498db20', color: '#3498db' }}>
            <i className="fas fa-chair"></i>
          </div>
          <div className="tom-stat-details">
            <span className="tom-stat-label">Occupied Tables</span>
            <span className="tom-stat-value">{occupiedTables.length}</span>
          </div>
        </div>

        <div className="tom-stat-card">
          <div className="tom-stat-icon" style={{ background: '#f39c1220', color: '#f39c12' }}>
            <i className="fas fa-clock"></i>
          </div>
          <div className="tom-stat-details">
            <span className="tom-stat-label">Preparing</span>
            <span className="tom-stat-value">{preparingOrders.length}</span>
          </div>
        </div>

        <div className="tom-stat-card">
          <div className="tom-stat-icon" style={{ background: '#27ae6020', color: '#27ae60' }}>
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="tom-stat-details">
            <span className="tom-stat-label">Ready to Serve</span>
            <span className="tom-stat-value">{readyOrders.length}</span>
          </div>
        </div>

        <div className="tom-stat-card">
          <div className="tom-stat-icon" style={{ background: '#e74c3c20', color: '#e74c3c' }}>
            <i className="fas fa-fire"></i>
          </div>
          <div className="tom-stat-details">
            <span className="tom-stat-label">Total Orders</span>
            <span className="tom-stat-value">{activeOrders.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tom-tabs">
        <button 
          className={`tom-tab ${activeTab === 'occupied' ? 'tom-active' : ''}`}
          onClick={() => setActiveTab('occupied')}
        >
          <i className="fas fa-chair"></i> Occupied Tables ({occupiedTables.length})
        </button>
        <button 
          className={`tom-tab ${activeTab === 'ready' ? 'tom-active' : ''}`}
          onClick={() => setActiveTab('ready')}
        >
          <i className="fas fa-utensils"></i> Ready to Serve ({readyOrders.length})
        </button>
        <button 
          className={`tom-tab ${activeTab === 'preparing' ? 'tom-active' : ''}`}
          onClick={() => setActiveTab('preparing')}
        >
          <i className="fas fa-fire"></i> Preparing ({preparingOrders.length})
        </button>
        <button 
          className={`tom-tab ${activeTab === 'history' ? 'tom-active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <i className="fas fa-history"></i> Order History
        </button>
      </div>

      {/* Content */}
      <div className="tom-content">
        {/* Occupied Tables Tab */}
        {activeTab === 'occupied' && (
          <div className="tom-occupied-grid">
            {occupiedTables.map(table => {
              const tableOrders = ordersByTable[table.tableNumber] || [];
              const readyCount = tableOrders.filter(o => o.status === 'ready').length;
              
              return (
                <div key={table.bookingId} className="tom-table-card">
                  <div className="tom-table-header">
                    <h3>Table #{table.tableNumber}</h3>
                    <span className={`tom-status-badge ${table.isWalkIn ? 'walkin' : 'booked'}`}>
                      {table.isWalkIn ? 'Walk-in' : 'Booked'}
                    </span>
                  </div>
                  
                  <div className="tom-table-details">
                    <p><i className="fas fa-user"></i> {table.customerName}</p>
                    <p><i className="fas fa-phone"></i> {table.customerPhone || 'No phone'}</p>
                    <p><i className="fas fa-clock"></i> Since {formatTime(table.startTime)}</p>
                    <p><i className="fas fa-tag"></i> {table.tableType}</p>
                    
                    {readyCount > 0 && (
                      <p className="tom-ready-notice">
                        <i className="fas fa-bell"></i> {readyCount} order(s) ready!
                      </p>
                    )}
                  </div>

                  <div className="tom-table-actions">
                    <button 
                      className="tom-order-btn"
                      onClick={() => {
                        setSelectedTable(table);
                        loadOrdersForTable(table.tableNumber);
                      }}
                    >
                      <i className="fas fa-shopping-cart"></i> Take Order
                    </button>
                    <button 
                      className="tom-bill-btn"
                      onClick={() => loadBillForTable(table.bookingId, table.tableNumber)}
                    >
                      <i className="fas fa-file-invoice"></i> View Bill
                    </button>
                  </div>

                  {tableOrders.length > 0 && (
                    <div className="tom-mini-orders">
                      <h4>Recent Orders</h4>
                      {tableOrders.slice(0, 3).map(order => (
                        <div key={order.id} className="tom-mini-order">
                          <div className="tom-mini-order-header">
                            {getOrderStatusBadge(order.status)}
                            <span className="tom-mini-order-time">
                              {formatTime(order.createdAt)}
                            </span>
                          </div>
                          <div className="tom-mini-order-items">
                            {order.items.map((item, idx) => (
                              <span key={idx}>
                                {item.quantity}x {item.itemName}
                                {idx < order.items.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </div>
                          <div className="tom-mini-order-total">
                            ₹{order.totalAmount?.toFixed(2)}
                          </div>
                        </div>
                      ))}
                      {tableOrders.length > 3 && (
                        <button 
                          className="tom-view-all-btn"
                          onClick={() => {
                            setSelectedTable(table);
                          }}
                        >
                          View all {tableOrders.length} orders
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {occupiedTables.length === 0 && (
              <div className="tom-empty-state">
                <i className="fas fa-smile"></i>
                <h3>No Occupied Tables</h3>
                <p>All tables are currently empty</p>
              </div>
            )}
          </div>
        )}

        {/* Ready to Serve Tab */}
        {activeTab === 'ready' && (
          <div className="tom-ready-grid">
            {readyOrders.length === 0 ? (
              <div className="tom-empty-state">
                <i className="fas fa-utensils"></i>
                <h3>No Ready Orders</h3>
                <p>Orders that are ready to serve will appear here</p>
              </div>
            ) : (
              readyOrders.map(order => (
                <div key={order.id} className="tom-ready-card">
                  <div className="tom-ready-header">
                    <span className="tom-table-badge">Table #{order.tableNumber}</span>
                    <span className="tom-ready-time">Ready {formatTime(order.readyAt)}</span>
                  </div>
                  
                  <div className="tom-ready-customer">
                    <i className="fas fa-user"></i> {order.customerName}
                  </div>

                  <div className="tom-ready-items">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="tom-ready-item">
                        <span className="tom-item-qty">{item.quantity}x</span>
                        <span className="tom-item-name">{item.itemName}</span>
                        {item.specialRequest && (
                          <span className="tom-item-special" title={item.specialRequest}>
                            <i className="fas fa-info-circle"></i>
                          </span>
                        )}
                        <span className="tom-item-price">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="tom-ready-total">
                    <strong>Total:</strong> ₹{order.totalAmount?.toFixed(2)}
                  </div>

                  <button 
                    className="tom-serve-btn"
                    onClick={() => serveOrder(order.id)}
                  >
                    <i className="fas fa-utensils"></i> Mark as Served
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Preparing Tab */}
        {activeTab === 'preparing' && (
          <div className="tom-preparing-grid">
            {preparingOrders.length === 0 ? (
              <div className="tom-empty-state">
                <i className="fas fa-fire"></i>
                <h3>No Orders in Preparation</h3>
                <p>Orders being prepared will appear here</p>
              </div>
            ) : (
              preparingOrders.map(order => (
                <div key={order.id} className="tom-preparing-card">
                  <div className="tom-preparing-header">
                    <span className="tom-table-badge">Table #{order.tableNumber}</span>
                    <span className="tom-preparing-time">Started {formatTime(order.acceptedAt)}</span>
                  </div>
                  
                  <div className="tom-preparing-customer">{order.customerName}</div>
                  
                  <div className="tom-preparing-items">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="tom-preparing-item">
                        <span>{item.quantity}x {item.itemName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (() => {
          // Filter by search
          const searched = historyData.filter(b => {
            if (!historySearch.trim()) return true;
            const q = historySearch.toLowerCase();
            return (
              (b.customerName || '').toLowerCase().includes(q) ||
              (b.customerPhone || '').includes(q) ||
              String(b.tableNumber || '').includes(q) ||
              String(b.id || '').includes(q)
            );
          });
          const totalPages = Math.ceil(searched.length / HISTORY_PAGE_SIZE);
          const paginated = searched.slice((historyPage - 1) * HISTORY_PAGE_SIZE, historyPage * HISTORY_PAGE_SIZE);
          const totalRevenue = historyData.reduce((s, b) => s + (b.grandTotal || 0), 0);
          const totalOrders = historyData.reduce((s, b) => s + (b.orders?.length || 0), 0);

          return (
            <div className="tom-history-container">
              {/* History Header */}
              <div className="tom-history-header">
                <div className="tom-history-summary-cards">
                  <div className="tom-history-summary-card">
                    <i className="fas fa-calendar-check"></i>
                    <div>
                      <span className="tom-hs-label">Completed Bookings</span>
                      <span className="tom-hs-value">{historyData.length}</span>
                    </div>
                  </div>
                  <div className="tom-history-summary-card">
                    <i className="fas fa-receipt"></i>
                    <div>
                      <span className="tom-hs-label">Total Orders</span>
                      <span className="tom-hs-value">{totalOrders}</span>
                    </div>
                  </div>
                  <div className="tom-history-summary-card tom-hs-revenue">
                    <i className="fas fa-rupee-sign"></i>
                    <div>
                      <span className="tom-hs-label">Total Revenue</span>
                      <span className="tom-hs-value">₹{totalRevenue.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Filters */}
                <div className="tom-history-filters">
                  <div className="tom-history-filter-group">
                    {['today', 'week', 'month', 'all'].map(f => (
                      <button
                        key={f}
                        className={`tom-filter-btn ${historyFilter === f ? 'tom-active' : ''}`}
                        onClick={() => { setHistoryFilter(f); setHistoryPage(1); }}
                      >
                        {f === 'today' ? 'Today' : f === 'week' ? 'Last 7 Days' : f === 'month' ? 'Last 30 Days' : 'All Time'}
                      </button>
                    ))}
                  </div>
                  <div className="tom-history-search-row">
                    <div className="tom-history-search">
                      <i className="fas fa-search"></i>
                      <input
                        type="text"
                        placeholder="Search name, phone, table, booking ID..."
                        value={historySearch}
                        onChange={e => { setHistorySearch(e.target.value); setHistoryPage(1); }}
                      />
                      {historySearch && (
                        <button onClick={() => setHistorySearch('')} className="tom-search-clear">
                          <i className="fas fa-times"></i>
                        </button>
                      )}
                    </div>
                    <button className="tom-refresh-history-btn" onClick={loadHistory} disabled={historyLoading}>
                      <i className={`fas fa-sync-alt ${historyLoading ? 'fa-spin' : ''}`}></i>
                    </button>
                  </div>
                </div>
              </div>

              {/* History List */}
              {historyLoading ? (
                <div className="tom-history-loading">
                  <div className="tom-spinner"></div>
                  <p>Loading order history...</p>
                </div>
              ) : searched.length === 0 ? (
                <div className="tom-empty-state">
                  <i className="fas fa-history"></i>
                  <h3>No History Found</h3>
                  <p>{historySearch ? 'No results match your search.' : 'No completed orders for this period.'}</p>
                </div>
              ) : (
                <>
                  <div className="tom-history-list">
                    {paginated.map(booking => {
                      const allItems = (booking.orders || []).flatMap(o => o.items || []);
                      const itemCount = allItems.reduce((s, i) => s + (i.quantity || 0), 0);
                      const completedAt = booking.updatedAt || booking.endTime;
                      return (
                        <div key={booking.id} className="tom-history-row">
                          {/* Left: customer + meta */}
                          <div className="tom-history-row-main">
                            <div className="tom-history-row-top">
                              <div className="tom-history-row-identity">
                                <div className="tom-history-avatar">
                                  {(booking.customerName || 'C')[0].toUpperCase()}
                                </div>
                                <div>
                                  <strong className="tom-history-customer-name">{booking.customerName || 'Customer'}</strong>
                                  <div className="tom-history-meta">
                                    {booking.customerPhone && (
                                      <span><i className="fas fa-phone"></i> {booking.customerPhone}</span>
                                    )}
                                    <span><i className="fas fa-chair"></i> Table #{booking.tableNumber || 'N/A'}</span>
                                    <span><i className="fas fa-hashtag"></i> #{booking.id}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="tom-history-row-right">
                                <span className="tom-history-amount">₹{(booking.grandTotal || 0).toFixed(2)}</span>
                                <span className={`tom-history-pay-badge ${(booking.paymentMethod || 'cash').toLowerCase()}`}>
                                  {booking.paymentMethod || 'Cash'}
                                </span>
                              </div>
                            </div>

                            {/* Items preview */}
                            {allItems.length > 0 && (
                              <div className="tom-history-items-preview">
                                {allItems.slice(0, 4).map((item, idx) => (
                                  <span key={idx} className="tom-history-item-chip">
                                    {item.quantity}× {item.itemName || item.name}
                                  </span>
                                ))}
                                {allItems.length > 4 && (
                                  <span className="tom-history-item-chip tom-more-chip">
                                    +{allItems.length - 4} more
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Footer: time + actions */}
                            <div className="tom-history-row-footer">
                              <div className="tom-history-row-stats">
                                <span><i className="fas fa-box"></i> {itemCount} items across {booking.orders?.length || 0} order{booking.orders?.length !== 1 ? 's' : ''}</span>
                                {completedAt && (
                                  <span><i className="fas fa-clock"></i> {new Date(completedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                                )}
                                {booking.tableTypeName && (
                                  <span><i className="fas fa-tag"></i> {booking.tableTypeName}</span>
                                )}
                              </div>
                              <button
                                className="tom-receipt-btn"
                                onClick={() => loadReceiptForHistory(booking)}
                                disabled={loadingReceipt}
                              >
                                {loadingReceipt
                                  ? <><i className="fas fa-spinner fa-spin"></i> Loading...</>
                                  : <><i className="fas fa-receipt"></i> View Receipt</>
                                }
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="tom-history-pagination">
                      <button
                        className="tom-page-btn"
                        onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                        disabled={historyPage === 1}
                      >
                        <i className="fas fa-chevron-left"></i>
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button
                          key={p}
                          className={`tom-page-num ${historyPage === p ? 'tom-active' : ''}`}
                          onClick={() => setHistoryPage(p)}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        className="tom-page-btn"
                        onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                        disabled={historyPage === totalPages}
                      >
                        <i className="fas fa-chevron-right"></i>
                      </button>
                      <span className="tom-page-info">
                        {(historyPage - 1) * HISTORY_PAGE_SIZE + 1}–{Math.min(historyPage * HISTORY_PAGE_SIZE, searched.length)} of {searched.length}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })()}
      </div>

      {/* Order Modal */}
      {selectedTable && (
        <div className="tom-modal-overlay" onClick={() => setSelectedTable(null)}>
          <div className="tom-modal tom-large-modal" onClick={e => e.stopPropagation()}>
            <div className="tom-modal-header">
              <h3>
                <i className="fas fa-shopping-cart"></i> 
                Order for Table #{selectedTable.tableNumber} - {selectedTable.customerName}
              </h3>
              <button className="tom-modal-close" onClick={() => setSelectedTable(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="tom-modal-body">
              <div className="tom-order-layout">
                {/* Menu Items */}
                <div className="tom-menu-section">
                  <h4>Menu Items</h4>
                  <div className="tom-menu-grid">
                    {menuItems.map(item => (
                      <div key={item.id} className="tom-menu-item">
                        {item.images && item.images.length > 0 && (
                          <img 
                            src={`data:${item.images[0].fileType};base64,${item.images[0].fileData}`}
                            alt={item.name}
                            className="tom-menu-item-image"
                          />
                        )}
                        <div className="tom-menu-item-info">
                          <h5>{item.name}</h5>
                          <p className="tom-menu-item-price">₹{item.price}</p>
                          {item.description && (
                            <small>{item.description}</small>
                          )}
                        </div>
                        <button 
                          className="tom-add-btn"
                          onClick={() => addToOrder(item)}
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Cart */}
                <div className="tom-cart-section">
                  <h4>Current Order</h4>
                  
                  {cartItems.length === 0 ? (
                    <div className="tom-empty-cart">
                      <i className="fas fa-shopping-cart"></i>
                      <p>No items added yet</p>
                    </div>
                  ) : (
                    <>
                      {cartItems.map((item, index) => (
                        <div key={index} className="tom-cart-item">
                          <div className="tom-cart-item-info">
                            <strong>{item.itemName}</strong>
                            <span className="tom-cart-item-price">₹{item.price}</span>
                          </div>
                          
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 0)}
                            className="tom-quantity-input"
                          />
                          
                          <input
                            type="text"
                            placeholder="Special request"
                            value={item.specialRequest}
                            onChange={(e) => updateSpecialRequest(index, e.target.value)}
                            className="tom-special-input"
                          />
                          
                          <div className="tom-cart-item-total">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </div>
                          
                          <button 
                            className="tom-remove-btn"
                            onClick={() => updateQuantity(index, 0)}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ))}

                      <div className="tom-cart-summary">
                        <div className="tom-summary-row">
                          <span>Subtotal:</span>
                          <span>₹{calculateSubtotal().toFixed(2)}</span>
                        </div>
                        <div className="tom-summary-row">
                          <span>Tax (5%):</span>
                          <span>₹{calculateTax().toFixed(2)}</span>
                        </div>
                        <div className="tom-summary-row tom-total">
                          <span>Total:</span>
                          <span>₹{calculateTotal().toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="tom-notes">
                        <label>Order Notes:</label>
                        <textarea
                          value={specialRequest}
                          onChange={(e) => setSpecialRequest(e.target.value)}
                          placeholder="Any special instructions for the whole order?"
                          rows="2"
                        />
                      </div>

                      {error && (
                        <div className="tom-error">
                          <i className="fas fa-exclamation-circle"></i>
                          {error}
                        </div>
                      )}

                      <button 
                        className="tom-submit-order-btn"
                        onClick={submitOrder}
                        disabled={loading}
                      >
                        {loading ? (
                          <><i className="fas fa-spinner fa-spin"></i> Submitting...</>
                        ) : (
                          <><i className="fas fa-paper-plane"></i> Submit Order</>
                        )}
                      </button>
                    </>
                  )}

                  {/* Display existing orders for this table */}
                  {ordersByTable[selectedTable.tableNumber]?.length > 0 && (
                    <div className="tom-existing-orders">
                      <h4>Existing Orders</h4>
                      {ordersByTable[selectedTable.tableNumber].map(order => (
                        <div key={order.id} className="tom-existing-order">
                          <div className="tom-order-header-mini">
                            {getOrderStatusBadge(order.status)}
                            <span className="tom-order-time">
                              {formatTime(order.createdAt)}
                            </span>
                          </div>
                          {order.items.map((item, idx) => (
                            <div key={idx} className="tom-existing-item">
                              <span>{item.quantity}x {item.itemName}</span>
                              <span>₹{item.price * item.quantity}</span>
                              {item.specialRequest && (
                                <small className="tom-special">{item.specialRequest}</small>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
        {showPaymentModal && currentBill && (
          <PaymentModal
            bookingId={currentBill.bookingId}
            amount={currentBill.grandTotal}
            customerDetails={{
              name: currentBill.customerName,
              phone: currentBill.customerPhone,
              email: waiterInfo?.email || ''
            }}
            cafeDetails={{
              cafeName: cafeData?.cafeName,
              address: cafeData?.address
            }}
            onSuccess={handlePaymentSuccess}
            onClose={() => setShowPaymentModal(false)}
          />
        )}

      {/* Razorpay Payment Modal (kept for compatibility) */}
      {showRazorpayModal && currentBill && false && (
        <RazorpayPaymentModal
          bookingId={currentBill.bookingId}
          amount={currentBill.grandTotal}
          customerDetails={{
            name: currentBill.customerName,
            phone: currentBill.customerPhone,
            email: waiterInfo?.email || ''
          }}
          cafeName={cafeData?.cafeName}
          cafeId={cafeData?.id}
          onSuccess={handlePaymentSuccess}
          onClose={() => {
            setShowRazorpayModal(false);
            setShowPaymentModal(true);
          }}
        />
      )}

      {/* Receipt Modal */}
      {showReceiptModal && receiptData && (
        <Receipt
          bookingDetails={receiptData.bookingDetails}
          orderItems={receiptData.orderItems}
          paymentDetails={receiptData.paymentDetails}
          cafeDetails={receiptData.cafeDetails}
          onClose={() => { setShowReceiptModal(false); setReceiptData(null); }}
          onDownload={() => window.print()}
        />
      )}
    </div>
  );
};

export default TableOrderManagement;