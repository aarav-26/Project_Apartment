import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Flats from './pages/Flats';
import Residents from './pages/Residents';
import Maintenance from './pages/Maintenance';
import Complaints from './pages/Complaints';
import Visitors from './pages/Visitors';
import Staff from './pages/Staff';
import WorkOrders from './pages/WorkOrders';
import Inventory from './pages/Inventory';
import LaborPayments from './pages/LaborPayments';
import LandingPage from './pages/LandingPage';
import Layout from './components/Layout';


function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/flats" element={<Flats />} />
                      <Route path="/residents" element={<Residents />} />
                      <Route path="/maintenance" element={<Maintenance />} />
                      <Route path="/complaints" element={<Complaints />} />
                      <Route path="/visitors" element={<Visitors />} />
                      <Route path="/staff" element={<Staff />} />
                      <Route path="/work-orders" element={<WorkOrders />} />
                      <Route path="/inventory" element={<Inventory />} />
                      <Route path="/labor-payments" element={<LaborPayments />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;