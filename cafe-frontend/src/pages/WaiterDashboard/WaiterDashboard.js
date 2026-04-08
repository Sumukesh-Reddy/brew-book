// WaiterDashboard.js - With Razorpay + QR Scanner + Receipt
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import RazorpayPaymentModal from '../../components/RazorpayPaymentModal/RazorpayPaymentModal';
import Receipt from '../../components/Receipt/Receipt';
import './WaiterDashboard.css';

// ─── QR Scanner Modal ────────────────────────────────────────────────────────
const QRScannerModal = ({ onScan, onClose }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [manualInput, setManualInput] = useState('');

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setScanning(true);
        scanQR();
      }
    } catch (err) {
      setError('Camera not available. Please use manual entry below.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
  };

  const scanQR = async () => {
    if (!('BarcodeDetector' in window)) {
      setError('QR scanning not supported in this browser. Use manual entry.');
      return;
    }
    const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const loop = async () => {
      if (!videoRef.current || !scanning) return;
      if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        try {
          const codes = await detector.detect(canvas);
          if (codes.length > 0) {
            stopCamera();
            onScan(codes[0].rawValue);
            return;
          }
        } catch {}
      }
      requestAnimationFrame(loop);
    };
    loop();
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      stopCamera();
      onScan(manualInput.trim());
    }
  };

  return (
    <div className="wd-modal-overlay" onClick={onClose}>
      <div className="wd-modal wd-qr-modal" onClick={e => e.stopPropagation()}>
        <div className="wd-modal-header">
          <h3><i className="fas fa-qrcode"></i> Scan QR Code</h3>
          <button className="wd-modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="wd-modal-body">
          <div className="wd-qr-scanner-container">
            <video
              ref={videoRef}
              className="wd-qr-video"
              autoPlay
              playsInline
              muted
            />
            <div className="wd-qr-overlay">
              <div className="wd-qr-frame" />
              <p className="wd-qr-hint">Point camera at QR code</p>
            </div>
          </div>

          {error && (
            <div className="wd-qr-error">
              <i className="fas fa-exclamation-triangle"></i> {error}
            </div>
          )}

          <div className="wd-qr-manual">
            <p>Or enter Booking ID manually:</p>
            <div className="wd-qr-manual-row">
              <input
                type="text"
                value={manualInput}
                onChange={e => setManualInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
                placeholder="Enter Booking ID..."
                className="wd-qr-input"
              />
              <button className="wd-razorpay-btn" onClick={handleManualSubmit}>
                <i className="fas fa-search"></i> Find
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main WaiterDashboard ─────────────────────────────────────────────────────
const WaiterDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cafe, setCafe] = useState(null);
  const [activeTab, setActiveTab] = useState('tables');
  const [occupiedTables, setOccupiedTables] = useState([]);
  const [readyOrders, setReadyOrders] = useState([]);
  const [preparingOrders, setPreparingOrders] = useState([]);
  const [servedOrders, setServedOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [specialRequest, setSpecialRequest] = useState('');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [currentBill, setCurrentBill] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userData || !userData.id) { navigate('/signin'); return; }
    setUser(userData);
    loadWaiterCafe(userData.id);
  }, []);

  useEffect(() => {
    if (cafe?.id) {
      loadOccupiedTables();
      loadActiveOrders();
      loadMenuItems();
      const interval = setInterval(() => {
        loadOccupiedTables();
        loadActiveOrders();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [cafe]);

  // ── Data loaders ──────────────────────────────────────────────────────────

  const loadWaiterCafe = async (userId) => {
    try {
      setLoading(true);
      setError('');
      const staffRes = await fetch(`http://localhost:8080/api/staff/user/${userId}`);
      const staffData = await staffRes.json();
      if (staffData.success && staffData.data) {
        const cafeRes = await fetch(`http://localhost:8080/api/cafe/${staffData.data.cafeId}`);
        const cafeData = await cafeRes.json();
        if (cafeData.success && cafeData.data) { setCafe(cafeData.data); return; }
      }
      await findCafeFromStaffList(userId);
    } catch (e) {
      setError('Failed to load cafe information: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const findCafeFromStaffList = async (userId) => {
    try {
      const cafesRes = await fetch('http://localhost:8080/api/cafe/public/approved');
      const cafesData = await cafesRes.json();
      if (cafesData.success && cafesData.data) {
        for (const cafeItem of cafesData.data) {
          const staffRes = await fetch(`http://localhost:8080/api/staff/cafe/${cafeItem.id}`);
          const staffData = await staffRes.json();
          if (staffData.success && staffData.data?.some(s => s.userId === userId)) {
            setCafe(cafeItem); return;
          }
        }
      }
      setError('No cafe assigned to this waiter.');
    } catch (e) {
      setError('Failed to find assigned cafe');
    }
  };

  const loadOccupiedTables = async () => {
    if (!cafe?.id) return;
    try {
      const res = await fetch(`http://localhost:8080/api/tables/cafe/${cafe.id}/occupied`);
      const data = await res.json();
      if (data.success) {
        const tables = data.data || [];

        // Enrich tables that are missing phone numbers
        const enriched = await Promise.all(
          tables.map(async (table) => {
            if (table.customerPhone) return table; // already has phone

            let phone = null;

            // Try booking API
            try {
              const bRes = await fetch(`http://localhost:8080/api/bookings/${table.bookingId}`);
              const bData = await bRes.json();
              const booking = bData.success ? bData.data : bData;
              phone = booking?.customerPhone || booking?.phone || null;

              // Try user API if still missing
              if (!phone && (booking?.customerId || booking?.userId)) {
                const uid = booking.customerId || booking.userId;
                try {
                  const uRes = await fetch(`http://localhost:8080/api/users/${uid}/details`);
                  const uData = await uRes.json();
                  const ud = uData.success ? uData.data : uData;
                  phone = ud?.phone || ud?.phoneNumber || ud?.mobile
                    || ud?.contactNumber || ud?.mobileNumber || null;
                } catch {}
              }
            } catch {}

            return { ...table, customerPhone: phone };
          })
        );

        setOccupiedTables(enriched);
      }
    } catch (error) {
      console.error('Failed to load occupied tables:', error);
    }
  };

  const loadActiveOrders = async () => {
    if (!cafe?.id) return;
    try {
      const res = await fetch(`http://localhost:8080/api/orders/waiter/${cafe.id}`);
      const data = await res.json();
      if (data.success) {
        const all = data.data || [];
        setReadyOrders(all.filter(o => o.status === 'ready'));
        setPreparingOrders(all.filter(o => o.status === 'preparing'));
        setServedOrders(all.filter(o => o.status === 'served'));
      }
    } catch {}
  };

  const loadMenuItems = async () => {
    if (!cafe?.id) return;
    try {
      const res = await fetch(`http://localhost:8080/api/menu/cafe/${cafe.id}`);
      const data = await res.json();
      if (data.success) setMenuItems(data.data.menuItems || []);
    } catch {}
  };

  const loadBillForTable = async (bookingId, tableNumber) => {
    try {
      setError('');
      const res = await fetch(`http://localhost:8080/api/orders/bill/${bookingId}`);
      const data = await res.json();
      if (data.success) {
        const billData = data.data;

        // 1️⃣ Try to get phone from the already-loaded occupied tables list
        const matchedTable = occupiedTables.find(
          t => String(t.bookingId) === String(bookingId)
        );
        let customerPhone = billData.customerPhone
          || matchedTable?.customerPhone
          || null;

        // 2️⃣ If still missing, fetch from booking API
        if (!customerPhone) {
          try {
            const bRes = await fetch(`http://localhost:8080/api/bookings/${bookingId}`);
            const bData = await bRes.json();
            const booking = bData.success ? bData.data : bData;
            customerPhone = booking?.customerPhone || booking?.phone || null;

            // 3️⃣ If booking has customerId, fetch from user API
            if (!customerPhone && (booking?.customerId || booking?.userId)) {
              const uid = booking.customerId || booking.userId;
              try {
                const uRes = await fetch(`http://localhost:8080/api/users/${uid}/details`);
                const uData = await uRes.json();
                const ud = uData.success ? uData.data : uData;
                customerPhone = ud?.phone || ud?.phoneNumber || ud?.mobile
                  || ud?.contactNumber || ud?.mobileNumber || null;
              } catch {}
              if (!customerPhone) {
                try {
                  const uRes2 = await fetch(`http://localhost:8080/api/users/${uid}`);
                  const uData2 = await uRes2.json();
                  const ud2 = uData2.success ? uData2.data : uData2;
                  customerPhone = ud2?.phone || ud2?.phoneNumber || ud2?.mobile
                    || ud2?.contactNumber || ud2?.mobileNumber || null;
                } catch {}
              }
            }
          } catch {}
        }

        setCurrentBill({
          ...billData,
          tableNumber,
          bookingId,
          customerPhone,
        });
        setShowBillModal(true);
      } else {
        alert(data.message || 'Failed to load bill');
      }
    } catch (e) {
      setError('Failed to load bill: ' + e.message);
    }
  };

  // ── QR Scan handler ──────────────────────────────────────────────────────

  const handleQRScan = async (scannedValue) => {
    setShowQRScanner(false);
    // scannedValue could be a bookingId or a URL containing bookingId
    let bookingId = scannedValue;
    const urlMatch = scannedValue.match(/booking[Ii]d[=\/](\d+)/);
    if (urlMatch) bookingId = urlMatch[1];

    // Find matching table from occupied tables
    const matchedTable = occupiedTables.find(
      t => String(t.bookingId) === String(bookingId)
    );

    if (matchedTable) {
      await loadBillForTable(matchedTable.bookingId, matchedTable.tableNumber);
    } else {
      // Try to load bill directly by booking ID
      await loadBillForTable(bookingId, '?');
    }
  };

  // ── Payment handlers ─────────────────────────────────────────────────────

  const handlePaymentSuccess = (paymentData) => {
    setShowRazorpayModal(false);
    setShowBillModal(false);

    // Build receipt data
    const bill = currentBill;
    const allItems = (bill?.orders || []).flatMap(o => o.items || []);

    setReceiptData({
      bookingDetails: {
        bookingId: bill?.bookingId,
        customerName: bill?.customerName,
        customerPhone: bill?.customerPhone,
        tableNumber: bill?.tableNumber,
        tableRevenue: bill?.tableRevenue || 0,
      },
      orderItems: allItems,
      paymentDetails: paymentData,
      cafeDetails: {
        cafeName: cafe?.cafeName,
        address: cafe?.address,
        gstNumber: cafe?.gstNumber,
      },
    });
    setCurrentBill(null);
    setShowReceipt(true);

    loadOccupiedTables();
    loadActiveOrders();
  };

  const handleCashPayment = async () => {
    if (!currentBill) return;
    try {
      setProcessingPayment(true);
      const res = await fetch(`http://localhost:8080/api/orders/pay/${currentBill.bookingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: 'CASH',
          amount: currentBill.grandTotal,
          waiterId: user.id,
        }),
      });
      const data = await res.json();
      handlePaymentSuccess({
        method: 'Cash',
        paymentMethod: 'CASH',
        amount: currentBill.grandTotal,
        paymentId: data.data?.paymentId || 'CASH-' + Date.now(),
      });
    } catch (e) {
      alert('Cash payment recording failed: ' + e.message);
    } finally {
      setProcessingPayment(false);
    }
  };

  // ── Order helpers ────────────────────────────────────────────────────────

  const serveOrder = async (orderId) => {
    try {
      const res = await fetch(`http://localhost:8080/api/orders/${orderId}/serve?waiterId=${user.id}`, { method: 'PUT' });
      const data = await res.json();
      if (data.success) { loadActiveOrders(); loadOccupiedTables(); }
      else alert(data.message || 'Failed to serve order');
    } catch {}
  };

  const addToCart = (item) => {
    const existing = cartItems.find(c => c.menuItemId === item.id);
    if (existing) {
      setCartItems(cartItems.map(c => c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCartItems([...cartItems, { menuItemId: item.id, itemName: item.name, price: item.price, quantity: 1, specialRequest: '' }]);
    }
  };

  const updateQuantity = (index, qty) => {
    if (qty <= 0) setCartItems(cartItems.filter((_, i) => i !== index));
    else setCartItems(cartItems.map((item, i) => i === index ? { ...item, quantity: qty } : item));
  };

  const updateSpecialRequest = (index, req) => {
    setCartItems(cartItems.map((item, i) => i === index ? { ...item, specialRequest: req } : item));
  };

  const calcSubtotal = () => cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const calcTax = () => calcSubtotal() * 0.05;
  const calcTotal = () => calcSubtotal() + calcTax();

  const submitOrder = async () => {
    if (cartItems.length === 0) { alert('Please add items to the order'); return; }
    setProcessingPayment(true);
    setError('');
    try {
      const res = await fetch('http://localhost:8080/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cafeId: cafe.id,
          tableNumber: selectedTable.tableNumber,
          bookingId: selectedTable.bookingId,
          waiterId: user.id,
          customerName: selectedTable.customerName,
          customerPhone: selectedTable.customerPhone,
          orderType: 'DINE_IN',
          specialInstructions: specialRequest,
          items: cartItems.map(item => ({ menuItemId: item.menuItemId, quantity: item.quantity, specialRequest: item.specialRequest }))
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Order submitted successfully!');
        setCartItems([]); setSpecialRequest(''); setShowOrderModal(false); setSelectedTable(null);
        loadActiveOrders();
      } else { setError(data.message || 'Failed to submit order'); }
    } catch (e) { setError('Unable to connect to server'); }
    finally { setProcessingPayment(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('user'); localStorage.removeItem('userRole'); navigate('/signin');
  };

  const formatTime = (ts) => ts ? new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';

  // ── Render guards ─────────────────────────────────────────────────────────

  if (loading) return (
    <div className="wd-loading"><div className="wd-spinner"></div><p>Loading waiter dashboard...</p></div>
  );
  if (error) return (
    <div className="wd-no-cafe">
      <i className="fas fa-exclamation-triangle" style={{ color: '#e74c3c' }}></i>
      <h2>Error</h2><p>{error}</p>
      <button className="wd-btn" onClick={handleLogout}>Logout</button>
    </div>
  );
  if (!cafe) return (
    <div className="wd-no-cafe">
      <i className="fas fa-store"></i><h2>No Cafe Assigned</h2>
      <p>You haven't been assigned to any cafe yet.</p>
      <button className="wd-btn" onClick={handleLogout}>Logout</button>
    </div>
  );

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div className="wd-waiter-dashboard">
      {/* Header */}
      <div className="wd-header">
        <div className="wd-header-left">
          <h1><i className="fas fa-concierge-bell"></i> Waiter Dashboard - {cafe.cafeName}</h1>
          <p>Welcome back, {user?.name || 'Waiter'}!</p>
        </div>
        <div className="wd-header-right">
          {/* QR Scanner Button */}
          <button className="wd-qr-scan-btn" onClick={() => setShowQRScanner(true)} title="Scan table QR to pay">
            <i className="fas fa-qrcode"></i> Scan & Pay
          </button>
          <button className="wd-refresh-btn" onClick={() => { loadOccupiedTables(); loadActiveOrders(); }}>
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
          <button className="wd-logout-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="wd-stats-grid">
        <div className="wd-stat-card">
          <div className="wd-stat-icon" style={{ background: '#3498db20', color: '#3498db' }}><i className="fas fa-chair"></i></div>
          <div className="wd-stat-details"><span className="wd-stat-label">Occupied Tables</span><span className="wd-stat-value">{occupiedTables.length}</span></div>
        </div>
        <div className="wd-stat-card">
          <div className="wd-stat-icon" style={{ background: '#f39c1220', color: '#f39c12' }}><i className="fas fa-clock"></i></div>
          <div className="wd-stat-details"><span className="wd-stat-label">Preparing</span><span className="wd-stat-value">{preparingOrders.length}</span></div>
        </div>
        <div className="wd-stat-card">
          <div className="wd-stat-icon" style={{ background: '#27ae6020', color: '#27ae60' }}><i className="fas fa-utensils"></i></div>
          <div className="wd-stat-details"><span className="wd-stat-label">Ready to Serve</span><span className="wd-stat-value">{readyOrders.length}</span></div>
        </div>
        <div className="wd-stat-card">
          <div className="wd-stat-icon" style={{ background: '#9b59b620', color: '#9b59b6' }}><i className="fas fa-history"></i></div>
          <div className="wd-stat-details"><span className="wd-stat-label">Served Today</span><span className="wd-stat-value">{servedOrders.length}</span></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="wd-tabs">
        <button className={`wd-tab ${activeTab === 'tables' ? 'wd-active' : ''}`} onClick={() => setActiveTab('tables')}>
          <i className="fas fa-chair"></i> Occupied Tables ({occupiedTables.length})
        </button>
        <button className={`wd-tab ${activeTab === 'ready' ? 'wd-active' : ''}`} onClick={() => setActiveTab('ready')}>
          <i className="fas fa-utensils"></i> Ready to Serve ({readyOrders.length})
        </button>
        <button className={`wd-tab ${activeTab === 'preparing' ? 'wd-active' : ''}`} onClick={() => setActiveTab('preparing')}>
          <i className="fas fa-fire"></i> Preparing ({preparingOrders.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="wd-content">
        {/* Occupied Tables */}
        {activeTab === 'tables' && (
          <div className="wd-tables-grid">
            {occupiedTables.length === 0 ? (
              <div className="wd-empty-state"><i className="fas fa-smile"></i><h3>No Occupied Tables</h3><p>All tables are currently empty.</p></div>
            ) : (
              occupiedTables.map(table => (
                <div key={table.bookingId} className="wd-table-card">
                  <div className="wd-table-header">
                    <h3>Table #{table.tableNumber}</h3>
                    <span className={`wd-status-badge ${table.isWalkIn ? 'walkin' : 'booked'}`}>{table.isWalkIn ? 'Walk-in' : 'Booked'}</span>
                  </div>
                  <div className="wd-table-details">
                    <p><i className="fas fa-user"></i> {table.customerName}</p>
                    <p><i className="fas fa-phone"></i> {table.customerPhone || 'No phone'}</p>
                    <p><i className="fas fa-clock"></i> Since {formatTime(table.startTime)}</p>
                    <p><i className="fas fa-tag"></i> {table.tableType}</p>
                  </div>
                  <div className="wd-table-actions">
                    <button className="wd-order-btn" onClick={() => { setSelectedTable(table); setCartItems([]); setSpecialRequest(''); setShowOrderModal(true); }}>
                      <i className="fas fa-shopping-cart"></i> Take Order
                    </button>
                    <button className="wd-bill-btn" onClick={() => loadBillForTable(table.bookingId, table.tableNumber)}>
                      <i className="fas fa-file-invoice"></i> View Bill
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Ready Orders */}
        {activeTab === 'ready' && (
          <div className="wd-ready-grid">
            {readyOrders.length === 0 ? (
              <div className="wd-empty-state"><i className="fas fa-utensils"></i><h3>No Ready Orders</h3><p>Orders ready to serve will appear here.</p></div>
            ) : (
              readyOrders.map(order => (
                <div key={order.id} className="wd-ready-card">
                  <div className="wd-ready-header">
                    <span className="wd-table-badge">Table #{order.tableNumber}</span>
                    <span className="wd-ready-time">Ready {formatTime(order.readyAt)}</span>
                  </div>
                  <div className="wd-ready-customer"><i className="fas fa-user"></i> {order.customerName}</div>
                  <div className="wd-ready-items">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="wd-ready-item">
                        <span className="wd-item-qty">{item.quantity}x</span>
                        <span className="wd-item-name">{item.itemName}</span>
                        {item.specialRequest && <span className="wd-item-special" title={item.specialRequest}><i className="fas fa-info-circle"></i></span>}
                        <span className="wd-item-price">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="wd-ready-total"><strong>Total:</strong> ₹{order.totalAmount?.toFixed(2)}</div>
                  <button className="wd-serve-btn" onClick={() => serveOrder(order.id)}>
                    <i className="fas fa-utensils"></i> Mark as Served
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Preparing */}
        {activeTab === 'preparing' && (
          <div className="wd-preparing-grid">
            {preparingOrders.length === 0 ? (
              <div className="wd-empty-state"><i className="fas fa-fire"></i><h3>No Orders in Preparation</h3><p>Orders being prepared will appear here.</p></div>
            ) : (
              preparingOrders.map(order => (
                <div key={order.id} className="wd-preparing-card">
                  <div className="wd-preparing-header">
                    <span className="wd-table-badge">Table #{order.tableNumber}</span>
                    <span className="wd-preparing-time">Started {formatTime(order.acceptedAt)}</span>
                  </div>
                  <div className="wd-preparing-customer">{order.customerName}</div>
                  <div className="wd-preparing-items">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="wd-preparing-item"><span>{item.quantity}x {item.itemName}</span></div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Order Modal ─────────────────────────────────────────────────── */}
      {showOrderModal && selectedTable && (
        <div className="wd-modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="wd-modal wd-large-modal" onClick={e => e.stopPropagation()}>
            <div className="wd-modal-header">
              <h3><i className="fas fa-shopping-cart"></i> Take Order - Table #{selectedTable.tableNumber} ({selectedTable.customerName})</h3>
              <button className="wd-modal-close" onClick={() => setShowOrderModal(false)}><i className="fas fa-times"></i></button>
            </div>
            <div className="wd-modal-body">
              <div className="wd-order-layout">
                <div className="wd-menu-section">
                  <h4><i className="fas fa-utensils"></i> Menu Items</h4>
                  <div className="wd-menu-grid">
                    {menuItems.map(item => (
                      <div key={item.id} className="wd-menu-item">
                        {item.images?.length > 0 && (
                          <img src={`data:${item.images[0].fileType};base64,${item.images[0].fileData}`} alt={item.name} className="wd-menu-item-image" />
                        )}
                        <div className="wd-menu-item-info">
                          <h5>{item.name}</h5>
                          <p className="wd-menu-item-price">₹{item.price}</p>
                          {item.description && <small>{item.description.substring(0, 50)}...</small>}
                        </div>
                        <button className="wd-add-btn" onClick={() => addToCart(item)}><i className="fas fa-plus"></i></button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="wd-cart-section">
                  <h4><i className="fas fa-shopping-cart"></i> Current Order</h4>
                  {cartItems.length === 0 ? (
                    <div className="wd-empty-cart">
                      <i className="fas fa-shopping-cart"></i>
                      <p>No items added yet</p>
                      <p className="wd-empty-cart-hint">Click + on menu items to add</p>
                    </div>
                  ) : (
                    <>
                      {cartItems.map((item, index) => (
                        <div key={index} className="wd-cart-item">
                          <div className="wd-cart-item-info">
                            <strong>{item.itemName}</strong>
                            <span className="wd-cart-item-price">₹{item.price}</span>
                          </div>
                          <div className="wd-cart-item-controls">
                            <input type="number" min="0" max="20" value={item.quantity} onChange={e => updateQuantity(index, parseInt(e.target.value) || 0)} className="wd-quantity-input" />
                            <input type="text" placeholder="Special request" value={item.specialRequest} onChange={e => updateSpecialRequest(index, e.target.value)} className="wd-special-input" />
                          </div>
                          <div className="wd-cart-item-total">₹{(item.price * item.quantity).toFixed(2)}</div>
                          <button className="wd-remove-btn" onClick={() => updateQuantity(index, 0)}><i className="fas fa-times"></i></button>
                        </div>
                      ))}
                      <div className="wd-cart-summary">
                        <div className="wd-summary-row"><span>Subtotal:</span><span>₹{calcSubtotal().toFixed(2)}</span></div>
                        <div className="wd-summary-row"><span>Tax (5%):</span><span>₹{calcTax().toFixed(2)}</span></div>
                        <div className="wd-summary-row wd-total"><span>Total:</span><span>₹{calcTotal().toFixed(2)}</span></div>
                      </div>
                      <div className="wd-notes">
                        <label>Order Notes:</label>
                        <textarea value={specialRequest} onChange={e => setSpecialRequest(e.target.value)} placeholder="Any special instructions?" rows="2" className="wd-textarea" />
                      </div>
                      {error && <div className="wd-error"><i className="fas fa-exclamation-circle"></i> {error}</div>}
                      <button className="wd-submit-order-btn" onClick={submitOrder} disabled={processingPayment}>
                        {processingPayment ? <><i className="fas fa-spinner fa-spin"></i> Submitting...</> : <><i className="fas fa-paper-plane"></i> Submit Order</>}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Bill Modal ──────────────────────────────────────────────────── */}
      {showBillModal && currentBill && (
        <div className="wd-modal-overlay" onClick={() => setShowBillModal(false)}>
          <div className="wd-modal wd-large-modal" onClick={e => e.stopPropagation()}>
            <div className="wd-modal-header">
              <h3><i className="fas fa-file-invoice"></i> Bill - Table #{currentBill.tableNumber}</h3>
              <button className="wd-modal-close" onClick={() => setShowBillModal(false)}><i className="fas fa-times"></i></button>
            </div>
            <div className="wd-modal-body">
              <div className="wd-bill-details">
                <div className="wd-bill-header">
                  <div className="wd-bill-customer">
                    <p><strong>Customer:</strong> {currentBill.customerName}</p>
                    <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                    <p><strong>Time:</strong> {new Date().toLocaleTimeString()}</p>
                  </div>
                  <div className="wd-bill-cafe"><h4>{cafe.cafeName}</h4></div>
                </div>

                <div className="wd-bill-items">
                  <h4>Ordered Items</h4>
                  <table className="wd-bill-table">
                    <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
                    <tbody>
                      {currentBill.orders?.map(order =>
                        order.items?.map((item, idx) => (
                          <tr key={`${order.id}-${idx}`}>
                            <td>{item.itemName}</td>
                            <td>{item.quantity}</td>
                            <td>₹{item.price}</td>
                            <td>₹{(item.price * item.quantity).toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  <div className="wd-bill-totals">
                    <div className="wd-bill-row"><span>Food Subtotal:</span><span>₹{currentBill.foodSubtotal?.toFixed(2)}</span></div>
                    <div className="wd-bill-row"><span>Tax (5%):</span><span>₹{currentBill.foodTax?.toFixed(2)}</span></div>
                    <div className="wd-bill-row"><span>Table Revenue:</span><span>₹{currentBill.tableRevenue?.toFixed(2)}</span></div>
                    <div className="wd-bill-row wd-bill-total"><span>Grand Total:</span><span>₹{currentBill.grandTotal?.toFixed(2)}</span></div>
                  </div>
                </div>

                {/* Payment Options */}
                <div className="wd-payment-section">
                  <h4><i className="fas fa-credit-card"></i> Choose Payment Method</h4>
                  <div className="wd-payment-options">
                    {/* Razorpay / Online */}
                    <button
                      className="wd-pay-option-btn wd-razorpay-option"
                      onClick={() => { setShowBillModal(false); setShowRazorpayModal(true); }}
                    >
                      <div className="wd-pay-option-icon"><i className="fas fa-credit-card"></i></div>
                      <div className="wd-pay-option-label">
                        <strong>Online / UPI</strong>
                        <span>Razorpay — Card, UPI, Wallet</span>
                      </div>
                    </button>

                    {/* Cash */}
                    <button
                      className="wd-pay-option-btn wd-cash-option"
                      onClick={handleCashPayment}
                      disabled={processingPayment}
                    >
                      <div className="wd-pay-option-icon"><i className="fas fa-money-bill-wave"></i></div>
                      <div className="wd-pay-option-label">
                        <strong>Cash</strong>
                        <span>Pay at counter</span>
                      </div>
                    </button>

                    {/* QR Scanner */}
                    <button
                      className="wd-pay-option-btn wd-qr-option"
                      onClick={() => { setShowBillModal(false); setShowQRScanner(true); }}
                    >
                      <div className="wd-pay-option-icon"><i className="fas fa-qrcode"></i></div>
                      <div className="wd-pay-option-label">
                        <strong>QR Code</strong>
                        <span>Scan to pay</span>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="wd-payment-actions">
                  <button className="wd-cancel-btn" onClick={() => setShowBillModal(false)}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Razorpay Modal ───────────────────────────────────────────────── */}
      {showRazorpayModal && currentBill && (
        <RazorpayPaymentModal
          bookingId={currentBill.bookingId}
          amount={currentBill.grandTotal}
          customerDetails={{
            name: currentBill.customerName,
            phone: currentBill.customerPhone || '',
            phoneNumber: currentBill.customerPhone || '',
            mobile: currentBill.customerPhone || '',
            email: user?.email || ''
          }}
          customerName={currentBill.customerName}
          customerPhone={currentBill.customerPhone || ''}
          cafeName={cafe?.cafeName}
          cafeId={cafe?.id}
          onSuccess={handlePaymentSuccess}
          onClose={() => { setShowRazorpayModal(false); setShowBillModal(true); }}
        />
      )}

      {/* ── QR Scanner Modal ─────────────────────────────────────────────── */}
      {showQRScanner && (
        <QRScannerModal
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}

      {/* ── Receipt Modal ────────────────────────────────────────────────── */}
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

export default WaiterDashboard;