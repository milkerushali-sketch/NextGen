import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import SplashCursor from "./components/SplashCursor";
import NovaAssistant from "./components/NovaAssistant";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import CartPage from "./pages/CartPage";
import WishlistPage from "./pages/WishlistPage";
import Checkout from "./pages/Checkout";
import OrdersPage from "./pages/OrdersPage";
import ProductDetails from "./pages/ProductDetails";
import ProfilePage from "./pages/ProfilePage";
import SupportPage from "./pages/SupportPage";
import MyTicketsPage from "./pages/MyTicketsPage";

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppShell() {
  const [darkMode, setDarkMode] = useState(true);
  const [assistantOpen, setAssistantOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    const handleAssistantOpen = () => {
      setAssistantOpen(true);
    };

    window.addEventListener("open-nova-assistant", handleAssistantOpen);
    return () =>
      window.removeEventListener("open-nova-assistant", handleAssistantOpen);
  }, []);

  return (
    <div className="page-shell min-h-screen bg-slate-100 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <SplashCursor
        COLOR="#8b5cf6"
        BACK_COLOR={{ r: 15, g: 23, b: 42 }}
        RAINBOW_MODE={false}
        SHADING={true}
      />

      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <CartPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wishlist"
          element={
            <ProtectedRoute>
              <WishlistPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/product/:productId" element={<ProductDetails />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="/support" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
        <Route path="/tickets" element={<ProtectedRoute><MyTicketsPage /></ProtectedRoute>} />
      </Routes>

      <NovaAssistant isOpen={assistantOpen} onOpenChange={setAssistantOpen} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <AppShell />
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
