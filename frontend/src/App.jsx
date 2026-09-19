import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import CartDrawer from './components/Cart/CartDrawer';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import AdminLayout from './components/Admin/AdminLayout';

const HomePage = lazy(() => import('./pages/HomePage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const DashboardOverviewPage = lazy(() => import('./pages/admin/DashboardOverviewPage'));
const OrderManagementPage = lazy(() => import('./pages/admin/OrderManagementPage'));
const ProductManagementPage = lazy(() => import('./pages/admin/ProductManagementPage'));
const AddProductPage = lazy(() => import('./pages/admin/AddProductPage'));
const DataExportPage = lazy(() => import('./pages/admin/DataExportPage'));

const PageLoader = () => (
  <div className="flex min-h-[55vh] items-center justify-center bg-[#fff6e7] px-4">
    <div className="rounded-[1.5rem] border border-[#f3c17a] bg-white/90 px-6 py-4 text-sm font-black text-[#083344] shadow-[0_16px_36px_rgba(126,50,13,0.12)]">
      Đang tải...
    </div>
  </div>
);

const CustomerLayout = ({ onOpenCart }) => (
  <div className="flex min-h-screen min-w-[360px] flex-col overflow-x-clip font-sans">
    <Header onOpenCart={onOpenCart} />
    <main className="flex flex-1 flex-col">
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<CategoryPage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/order-success/:orderId" element={<OrderDetailPage />} />
        </Routes>
      </Suspense>
    </main>
    <Footer />
  </div>
);

const AdminSuspense = ({ children }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

const AppContent = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminSuspense><DashboardOverviewPage /></AdminSuspense>} />
          <Route path="orders" element={<AdminSuspense><OrderManagementPage /></AdminSuspense>} />
          <Route path="products" element={<AdminSuspense><ProductManagementPage /></AdminSuspense>} />
          <Route path="products/new" element={<AdminSuspense><AddProductPage /></AdminSuspense>} />
          <Route path="export" element={<AdminSuspense><DataExportPage /></AdminSuspense>} />
        </Route>

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
