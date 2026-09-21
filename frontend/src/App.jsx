import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Toast from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import ReceiptModal from './components/ReceiptModal';
import OwnerProfileModal from './components/OwnerProfileModal';

import DashboardPage from './pages/DashboardPage';
import FlatsListPage from './pages/FlatsListPage';
import AddFlatPage from './pages/AddFlatPage';
import FlatDetailPage from './pages/FlatDetailPage';
import EditFlatPage from './pages/EditFlatPage';
import TenantCheckInPage from './pages/TenantCheckInPage';
import PaymentsPage from './pages/PaymentsPage';
import CustomersPage from './pages/CustomersPage';
import AuthPage from './pages/AuthPage';

import { api, getAuthToken, getAuthOwner, setAuthToken, setAuthOwner } from './services/api';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState(getAuthOwner());
  const [authToken, setAuthTokenState] = useState(getAuthToken());
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Navigation & View State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'flats', 'flat-detail', 'add-flat', 'edit-flat', 'tenant-checkin', 'payments', 'customers'

  // Entities
  const [stats, setStats] = useState(null);
  const [flats, setFlats] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Active Context / Selections
  const [selectedFlatId, setSelectedFlatId] = useState(null);
  const [selectedFlatDetail, setSelectedFlatDetail] = useState(null);
  const [editingFlat, setEditingFlat] = useState(null);
  const [checkInFlat, setCheckInFlat] = useState(null);

  // Filtering & Sorting State
  const [flatsSort, setFlatsSort] = useState('date');
  const [flatsSearch, setFlatsSearch] = useState('');
  const [paymentsStatusFilter, setPaymentsStatusFilter] = useState('All');
  const [customersSearch, setCustomersSearch] = useState('');

  // Modals & Feedback
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [receiptModal, setReceiptModal] = useState({ isOpen: false, data: null });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    confirmVariant: 'danger',
    onConfirm: () => {}
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // 1. Fetch Dashboard Stats
  const loadDashboard = async () => {
    try {
      const res = await api.getDashboard();
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
  };

  // 2. Fetch Flats List
  const loadFlats = async (sort = flatsSort, search = flatsSearch) => {
    try {
      const res = await api.getFlats(sort, search);
      setFlats(res.data);
    } catch (err) {
      console.error('Failed to load flats:', err);
    }
  };

  // 3. Fetch Single Flat Detail
  const loadFlatDetail = async (id) => {
    try {
      const res = await api.getFlat(id);
      setSelectedFlatDetail(res.data);
    } catch (err) {
      console.error('Failed to load flat detail:', err);
      showToast('Flat not found', 'error');
    }
  };

  // 4. Fetch Payments & Expenses
  const loadPayments = async (status = paymentsStatusFilter) => {
    try {
      const res = await api.getPayments(status);
      setPayments(res.data);
      const expRes = await api.getExpenses();
      setExpenses(expRes.data);
    } catch (err) {
      console.error('Failed to load payments:', err);
    }
  };

  // 5. Fetch Customers
  const loadCustomers = async (search = customersSearch) => {
    try {
      const res = await api.getCustomers(search);
      setCustomers(res.data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  // Check and initialize authentication session
  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const res = await api.getMe();
          setCurrentUser(res.owner);
          setAuthOwner(res.owner);
          setAuthTokenState(token);
        } catch (e) {
          // Token invalid or expired
          setAuthToken(null);
          setAuthOwner(null);
          setCurrentUser(null);
          setAuthTokenState(null);
        }
      } else {
        setCurrentUser(null);
        setAuthTokenState(null);
      }
      setCheckingAuth(false);
    };

    initAuth();
  }, []);

  // Reload all data whenever authenticated owner session changes
  const reloadAllData = () => {
    if (!authToken) return;
    loadDashboard();
    loadFlats(flatsSort, flatsSearch);
    loadPayments(paymentsStatusFilter);
    loadCustomers(customersSearch);
  };

  const mountedRef = useRef(false);

  useEffect(() => {
    if (authToken && currentUser) {
      reloadAllData();
      setTimeout(() => {
        mountedRef.current = true;
      }, 600);
    }
  }, [authToken]);

  // Sync changes when sort/search changes
  useEffect(() => {
    if (authToken && mountedRef.current) {
      loadFlats(flatsSort, flatsSearch);
    }
  }, [flatsSort, flatsSearch]);

  useEffect(() => {
    if (authToken && mountedRef.current) {
      loadPayments(paymentsStatusFilter);
    }
  }, [paymentsStatusFilter]);

  useEffect(() => {
    if (authToken && mountedRef.current) {
      loadCustomers(customersSearch);
    }
  }, [customersSearch]);

  // Handle successful login or OTP verification
  const handleAuthSuccess = (owner, token) => {
    setCurrentUser(owner);
    setAuthTokenState(token);
    setActiveTab('dashboard');
    setCurrentView('dashboard');
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // Ignore
    } finally {
      setCurrentUser(null);
      setAuthTokenState(null);
      setStats(null);
      setFlats([]);
      setPayments([]);
      setExpenses([]);
      setCustomers([]);
      showToast('Logged out of workspace', 'info');
    }
  };

  // Tab change handler
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setCurrentView(tabId);
    if (tabId === 'dashboard') loadDashboard();
    if (tabId === 'flats') loadFlats();
    if (tabId === 'payments') loadPayments();
    if (tabId === 'customers') loadCustomers();
  };

  // Open Flat Detail handler
  const handleOpenFlat = (id) => {
    setSelectedFlatId(id);
    loadFlatDetail(id);
    setCurrentView('flat-detail');
  };

  // Add Flat handler
  const handleFlatAdded = async (formData) => {
    const res = await api.addFlat(formData);
    showToast(`Flat ${res.data.flat_number} registered as Vacant!`, 'success');
    await loadFlats();
    await loadDashboard();
    setActiveTab('flats');
    setCurrentView('flats');
  };

  // Edit Flat handler
  const handleFlatUpdated = async (id, formData) => {
    await api.updateFlat(id, formData);
    showToast(`Flat details updated successfully!`, 'success');
    await loadFlatDetail(id);
    await loadFlats();
    await loadDashboard();
    setCurrentView('flat-detail');
  };

  // Delete Flat confirmation & execution
  const handleDeleteFlatClick = (flat) => {
    setConfirmModal({
      isOpen: true,
      title: `Delete ${flat.flat_number}?`,
      message: `Are you sure you want to delete ${flat.flat_number}? This will permanently remove its records from the system.`,
      confirmText: 'Yes, Delete Flat',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await api.deleteFlat(flat.id);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          showToast(`Flat ${flat.flat_number} deleted`, 'success');
          await loadFlats();
          await loadDashboard();
          if (currentView === 'flat-detail') {
            setActiveTab('flats');
            setCurrentView('flats');
          }
        } catch (err) {
          showToast(err.message || 'Failed to delete flat', 'error');
        }
      }
    });
  };

  // Tenant Check-in Initiation
  const handleCheckInClick = (flat) => {
    setCheckInFlat(flat);
    setCurrentView('tenant-checkin');
  };

  // Tenant Check-in Execution (Flow B)
  const handleCheckInComplete = async (formData) => {
    const res = await api.checkInTenant(formData);
    showToast(res.message, 'success');
    await loadDashboard();
    await loadFlats();
    await loadPayments();
    await loadCustomers();
    handleOpenFlat(formData.flat_id);
  };

  // Tenant Checkout Confirmation & Execution (Flow D)
  const handleCheckoutClick = (flat) => {
    setConfirmModal({
      isOpen: true,
      title: `Checkout Tenant from ${flat.flat_number}?`,
      message: `Are you sure you want to checkout ${flat.tenant_name}? Flat status will revert to Vacant, and the customer tenancy will be preserved as past history.`,
      confirmText: 'Confirm Checkout',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await api.checkoutTenant(flat.id);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          showToast(`Tenant checked out! Flat ${flat.flat_number} is now Vacant.`, 'success');
          await loadFlatDetail(flat.id);
          await loadFlats();
          await loadDashboard();
          await loadCustomers();
        } catch (err) {
          showToast(err.message || 'Checkout failed', 'error');
        }
      }
    });
  };

  // Mark Rent Paid (Flow C: One-tap action)
  const handleMarkPaid = async (paymentId, method = 'Bank Transfer') => {
    try {
      const res = await api.markPaymentPaid(paymentId, method);
      showToast('Rent marked as Paid! Digital receipt generated.', 'success');
      await loadPayments();
      await loadDashboard();
      if (selectedFlatId) await loadFlatDetail(selectedFlatId);

      // Open Digital Receipt Modal
      setReceiptModal({
        isOpen: true,
        data: {
          ...res.data.payment,
          receiptNumber: res.data.receiptNumber,
          waLink: res.data.waLink,
          paid_date: res.data.receiptDate
        }
      });
    } catch (err) {
      showToast(err.message || 'Payment update failed', 'error');
    }
  };

  // Update Payment Status & Amount (Flow C+: Live Sync Everywhere)
  const handleUpdatePaymentStatus = async (paymentId, payload) => {
    try {
      const res = await api.updatePaymentStatus(paymentId, payload);
      showToast(res.message || 'Payment updated successfully!', 'success');
      await loadPayments();
      await loadDashboard();
      await loadCustomers();
      if (selectedFlatId) await loadFlatDetail(selectedFlatId);

      if (res.data?.payment?.paid_amount > 0) {
        setReceiptModal({
          isOpen: true,
          data: {
            ...res.data.payment,
            receiptNumber: res.data.receiptNumber,
            waLink: res.data.waLink,
            paid_date: res.data.receiptDate
          }
        });
      }
      return res;
    } catch (err) {
      showToast(err.message || 'Payment update failed', 'error');
      throw err;
    }
  };

  // View Receipt
  const handleOpenReceipt = async (paymentId) => {
    try {
      const res = await api.getReceipt(paymentId);
      setReceiptModal({
        isOpen: true,
        data: res.data
      });
    } catch (err) {
      showToast(err.message || 'Could not load receipt', 'error');
    }
  };

  // Log Expense
  const handleLogExpense = async (expenseData) => {
    try {
      await api.addExpense(expenseData);
      showToast('Maintenance expense recorded!', 'success');
      await loadPayments();
      await loadDashboard();
    } catch (err) {
      showToast(err.message || 'Failed to log expense', 'error');
    }
  };

  // 1. Initial Auth Check Splash
  if (checkingAuth) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0F172A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFFFFF'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px'
        }}>
          <span style={{ fontWeight: '800', fontSize: '20px' }}>N</span>
        </div>
        <div style={{ fontSize: '13px', color: '#94A3B8' }}>Opening NEST Workspace...</div>
      </div>
    );
  }

  // 2. Unauthenticated: Show Login / Signup / OTP
  if (!currentUser || !authToken) {
    return (
      <>
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />
        <AuthPage onAuthSuccess={handleAuthSuccess} showToast={showToast} />
      </>
    );
  }

  // 3. Authenticated: Render App Shell
  return (
    <div className="app-shell">
      {/* Global App Top Header */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onEditProfile={() => setIsProfileModalOpen(true)}
      />

        {/* Main Content View Container */}
        <main className="app-content">
          {/* 1. Dashboard Page */}
          {currentView === 'dashboard' && (
            <DashboardPage
              stats={stats}
              onNavigate={(tab) => {
                if (tab === 'add-flat') {
                  setCurrentView('add-flat');
                } else {
                  handleTabChange(tab);
                }
              }}
              onOpenFlat={handleOpenFlat}
              onMarkPaidQuick={(pid) => handleMarkPaid(pid, 'Bank Transfer')}
            />
          )}

          {/* 2. Flats List Page */}
          {currentView === 'flats' && (
            <FlatsListPage
              flats={flats}
              sortOption={flatsSort}
              onSortChange={(sort) => setFlatsSort(sort)}
              searchQuery={flatsSearch}
              onSearchChange={(search) => setFlatsSearch(search)}
              onOpenFlat={handleOpenFlat}
              onAddFlatClick={() => setCurrentView('add-flat')}
              onDeleteFlatClick={handleDeleteFlatClick}
            />
          )}

          {/* 3. Add Flat Page */}
          {currentView === 'add-flat' && (
            <AddFlatPage
              onBack={() => setCurrentView('flats')}
              onFlatAdded={handleFlatAdded}
              showToast={showToast}
            />
          )}

          {/* 4. Flat Detail Page */}
          {currentView === 'flat-detail' && (
            <FlatDetailPage
              flat={selectedFlatDetail}
              onBack={() => setCurrentView('flats')}
              onEditFlat={(flat) => {
                setEditingFlat(flat);
                setCurrentView('edit-flat');
              }}
              onDeleteFlat={handleDeleteFlatClick}
              onCheckInClick={handleCheckInClick}
              onCheckoutClick={handleCheckoutClick}
              onMarkPaid={(pid) => handleMarkPaid(pid, 'Bank Transfer')}
              onViewCustomer={(cid) => {
                handleTabChange('customers');
              }}
            />
          )}

          {/* 5. Edit Flat Page */}
          {currentView === 'edit-flat' && editingFlat && (
            <EditFlatPage
              flat={editingFlat}
              onBack={() => setCurrentView('flat-detail')}
              onFlatUpdated={handleFlatUpdated}
              showToast={showToast}
            />
          )}

          {/* 6. Tenant Check-in & Registration (Flow B) */}
          {currentView === 'tenant-checkin' && checkInFlat && (
            <TenantCheckInPage
              flat={checkInFlat}
              onBack={() => setCurrentView('flat-detail')}
              onCheckInComplete={handleCheckInComplete}
              showToast={showToast}
            />
          )}

          {/* 7. Payments Page & Expenses */}
          {currentView === 'payments' && (
            <PaymentsPage
              payments={payments}
              expenses={expenses}
              statusFilter={paymentsStatusFilter}
              onStatusFilterChange={(st) => setPaymentsStatusFilter(st)}
              onMarkPaid={(pid) => handleMarkPaid(pid, 'Cash')}
              onUpdatePaymentStatus={handleUpdatePaymentStatus}
              onOpenReceipt={handleOpenReceipt}
              onLogExpense={handleLogExpense}
            />
          )}

          {/* 8. Customers Directory Page (Flow E) */}
          {currentView === 'customers' && (
            <CustomersPage
              customers={customers}
              searchQuery={customersSearch}
              onSearchChange={(query) => setCustomersSearch(query)}
              onSelectCustomer={(c) => {}}
              onUpdatePaymentStatus={handleUpdatePaymentStatus}
              onOpenReceipt={handleOpenReceipt}
            />
          )}
        </main>

        {/* 4 Fixed Bottom Navigation Tabs */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        {/* Global Modals */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          confirmVariant={confirmModal.confirmVariant}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        />

        <ReceiptModal
          isOpen={receiptModal.isOpen}
          receiptData={receiptModal.data}
          onClose={() => setReceiptModal({ isOpen: false, data: null })}
        />

        {/* Owner Profile Modal */}
        <OwnerProfileModal
          isOpen={isProfileModalOpen}
          owner={currentUser}
          onClose={() => setIsProfileModalOpen(false)}
          onProfileUpdated={(updatedOwner) => {
            setCurrentUser(updatedOwner);
            setAuthOwner(updatedOwner);
            showToast('Profile updated successfully!', 'success');
          }}
        />

        {/* Toast Feedback (Section 05) */}
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />
    </div>
  );
}
