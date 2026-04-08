import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/HomePage/LandingPage';
import SignupPage from './pages/SignupPage/SignupPage';
import SigninPage from './pages/SigninPage/SigninPage';
import ProfilePage from './pages/ProfilePage/profilePage';

import AdminDashboard from './pages/AdminDashboard/AdminDashboard';

import ChangePasswordPage from './pages/ChangePasswordPage/ChangePasswordPage';
import ForgotPasswordPage from './pages/ForgotPassword/ForgotPasswordPage';

import OwnerDashboard from './pages/OwnerDashboard/OwnerDashboard';
import CafeRegistrationForm from './pages/CafeRegistrationForm/CafeRegistrationForm';
import CustomerDashboard from './pages/CustomerDashboard/CustomerDashboard';
import CafeDetailsPage from './pages/CafeDetails/CafeDetailsPage';

import WaiterDashboard from './pages/WaiterDashboard/WaiterDashboard';
import ChefDashboard from './pages/ChefDashboard/ChefDashboard';

import TableCart from './pages/TableCart/TableCart';
import UnifiedCart from './pages/UnifiedCart/UnifiedCart';
import TableOrderManagement from './pages/TableOrderManagement/TableOrderManagement';

import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/signin" element={<SigninPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
          <Route path="/waiter-dashboard" element={<WaiterDashboard />} />
          <Route path="/chef-dashboard" element={<ChefDashboard />} />
          <Route path="/owner/register-cafe" element={<CafeRegistrationForm />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          <Route path="/TableCart" element={<TableCart />} />
          <Route path="/UnifiedCart" element={<UnifiedCart />} />
          <Route path="/TableOrderManagement" element={<TableOrderManagement />} />
          <Route path="/cafes/:cafeId" element={<CafeDetailsPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          
        </Routes>
      </div>
    </Router>
  );
}

export default App;