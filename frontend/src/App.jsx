import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import ProductDetailPage from './pages/ProductDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import CategoryPage from './pages/CategoryPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import AuthPage from './pages/AuthPage';
import CartDrawer from './components/Cart/CartDrawer';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';

// Admin Components
import AdminLayout from './components/Admin/AdminLayout';
import DashboardOverviewPage from './pages/admin/DashboardOverviewPage';
import OrderManagementPage from './pages/admin/OrderManagementPage';
import AddProductPage from './pages/admin/AddProductPage';
import ProductManagementPage from './pages/admin/ProductManagementPage';

const CustomerLayout = ({ onOpenCart }) => (
  <div className="min-h-screen flex flex-col font-sans">
    <Header onOpenCart={onOpenCart} />
    <main className="flex-1 flex flex-col">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CategoryPage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/order-success/:orderId"
          element={
            <div className="container mx-auto px-4 py-24 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-green-600 text-4xl">✓</span>
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">Đặt hàng thành công!</h1>
              <p className="text-slate-300 max-w-md mx-auto mb-8">
                Cảm ơn bạn đã tin tưởng dịch vụ của chúng tôi. Đơn hàng của bạn đang được xử lý và sẽ sớm được giao.
              </p>
              <Link
                to="/"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-xl transition-colors shadow-lg shadow-blue-500/30"
              >
                Tiếp tục mua sắm
              </Link>
            </div>
          }
        />
      </Routes>
    </main>
    <Footer />
  </div>
);

const AppContent = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        {/* Admin Dashboard Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardOverviewPage />} />
          <Route path="orders" element={<OrderManagementPage />} />
          <Route path="products" element={<ProductManagementPage />} />
          <Route path="products/new" element={<AddProductPage />} />
        </Route>

        {/* Customer Facing Routes */}
        <Route path="/*" element={<CustomerLayout onOpenCart={() => setIsCartOpen(true)} />} />
      </Routes>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </BrowserRouter>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
