import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Products from './pages/Products'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Tracking from './pages/Tracking'
import UserConsole from './pages/UserConsole'
import OrderConsole from './pages/OrderConsole'
import CustomerDashboard from './pages/CustomerDashboard'
import FranchiseDashboard from './pages/FranchiseDashboard'
import Store from './pages/Store'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute';
import { AdminLogin } from './components/AdminLogin';
import { NotificationProvider } from './components/NotificationContext';
import UserLogin from './components/UserLogin';
import BuildingStorePage from './components/BuildingStorePage';
import ProtectedStoreRoute from './components/ProtectedStoreRoute';
const DefaultLayout = ({ children }) => (
  <div className="min-h-screen bg-gray-50 flex flex-col w-full">
    <Navbar />
    <main className="flex-grow mx-auto w-full">
      {children}
    </main>
    <Footer />
  </div>
);

const CheckoutLayout = ({ children }) => (
  <div className="min-h-screen w-full">
    {children}
  </div>
);

const TrackingLayout = ({ children }) => (
  <div className="min-h-screen bg-gray-50 flex flex-col w-full">
    <main className="flex-grow w-full">
      {children}
    </main>
    <Footer />
  </div>
);

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <Routes>
              {/* Auth Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/login" element={<UserLogin />} />

              {/* Protected Admin Routes */}
              <Route
                path="/admin/*"
                element={
                  <DefaultLayout>
                    <ProtectedRoute requiredRole="webmaster">
                      <Routes>
                        <Route path="/users" element={<UserConsole />} />
                        <Route path="/orders" element={<OrderConsole />} />
                      </Routes>
                    </ProtectedRoute>
                  </DefaultLayout>
                }
              />

              {/* Protected User Routes */}
              <Route
                path="/customer/dashboard"
                element={
                  <DefaultLayout>
                    <ProtectedRoute requiredRole={["customer", "test"]}>
                      <CustomerDashboard />
                    </ProtectedRoute>
                  </DefaultLayout>
                }
              />

              <Route
                path="/franchise/*"
                element={
                  <DefaultLayout>
                    <ProtectedRoute requiredRole="franchise">
                      <Routes>
                        <Route path="/dashboard" element={<FranchiseDashboard />} />
                      </Routes>
                    </ProtectedRoute>
                  </DefaultLayout>
                }
              />

              {/* Store Routes */}
              <Route 
                path="/:storeSlug/store" 
                element={
                  <DefaultLayout>
                    <Store />
                  </DefaultLayout>
                } 
              />
              <Route 
                path="/:storeSlug" 
                element={
                  <DefaultLayout>
                    <Store />
                  </DefaultLayout>
                } 
              />
              <Route 
                path="/:storeSlug/checkout" 
                element={
                  <CheckoutLayout>
                    <Checkout />
                  </CheckoutLayout>
                } 
              />

              {/* Public Routes */}
              <Route
                path="/store"
                element={
                  <DefaultLayout>
                    <Store />
                  </DefaultLayout>
                }
              />

              <Route
                path="/"
                element={
                  <DefaultLayout>
                    <Home />
                  </DefaultLayout>
                }
              />

              <Route
                path="/products"
                element={
                  <DefaultLayout>
                    <Products />
                  </DefaultLayout>
                }
              />

              {/* Protected Routes */}
              <Route
                path="/checkout"
                element={
                  <CheckoutLayout>
                    <Checkout />
                  </CheckoutLayout>
                }
              />

              <Route
                path="/order/:customerUserId/:orderCodeWithFranchise"
                element={
                  <TrackingLayout>
                    <ProtectedRoute requiredRole="customer">
                      <Tracking />
                    </ProtectedRoute>
                  </TrackingLayout>
                }
              />

              {/* Catch-all route */}
              <Route
                path="*"
                element={
                  <DefaultLayout>
                    <Home />
                  </DefaultLayout>
                }
              />
            </Routes>
          </Router>
        </CartProvider>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App
