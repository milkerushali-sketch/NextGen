import { useEffect, useRef, useState } from "react";
import {
  FaChevronDown,
  FaGift,
  FaHeart,
  FaHeadset,
  FaMoon,
  FaShoppingCart,
  FaSun,
  FaTrophy,
  FaUserCircle,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

export default function Navbar({ darkMode, setDarkMode }) {
  const { isAuthenticated, user, logout } = useAuth();
  const { itemCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const closeMenu = (event) => {
      if (!profileRef.current?.contains(event.target)) setIsProfileOpen(false);
    };
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  const openAssistant = (topic) => {
    setIsProfileOpen(false);
    window.dispatchEvent(new CustomEvent("open-nova-assistant"));
    window.dispatchEvent(
      new CustomEvent("nova-assistant-topic", { detail: topic }),
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/75">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 text-lg font-bold text-white shadow-lg shadow-violet-500/30">
            N
          </div>
          <div>
            <div className="text-xl font-black tracking-tight">NovaCart</div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
              smart shopping
            </div>
          </div>
        </Link>

        <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex dark:text-slate-300">
          <Link to="/" className="transition hover:text-violet-500">
            Home
          </Link>
          <a href="#featured" className="transition hover:text-violet-500">
            Featured
          </a>
          <a href="#shop" className="transition hover:text-violet-500">
            Shop
          </a>
          <Link to="/wishlist" className="transition hover:text-violet-500">
            Wishlist
          </Link>
          <Link to="/checkout" className="transition hover:text-violet-500">
            Checkout
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDarkMode((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-700 transition hover:border-violet-300 hover:text-violet-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>

          <Link
            to="/wishlist"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-700 transition hover:border-violet-300 hover:text-violet-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <FaHeart />
            {wishlistCount > 0 && (
              <span className="absolute -right-1 -top-1 rounded-full bg-pink-500 px-1.5 text-[10px] font-bold text-white">
                {wishlistCount}
              </span>
            )}
          </Link>

          <Link
            to="/cart"
            className="flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-100 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200"
          >
            <FaShoppingCart />
            Cart
            <span className="rounded-full bg-violet-600 px-2 py-0.5 text-xs text-white">
              {itemCount}
            </span>
          </Link>

          {isAuthenticated ? (
            <div ref={profileRef} className="relative flex items-center gap-3">
              <div className="hidden text-sm font-medium text-slate-600 md:block dark:text-slate-300">
                Hello, {user?.name || "Guest"}
              </div>
              <button
                type="button"
                onClick={() => setIsProfileOpen((value) => !value)}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-violet-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                aria-expanded={isProfileOpen}
                aria-label="Open profile menu"
              >
                <FaUserCircle className="text-lg text-violet-500" />
                <FaChevronDown className="text-xs" />
              </button>
              {isProfileOpen && (
                <div className="absolute right-0 top-14 z-50 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                  <Link
                    to="/profile"
                    state={{ edit: true }}
                    onClick={() => setIsProfileOpen(false)}
                    className="block rounded-xl px-3 py-2 text-sm font-semibold hover:bg-violet-50 dark:hover:bg-slate-800"
                  >
                    Edit profile
                  </Link>
                  <Link
                    to="/orders"
                    onClick={() => setIsProfileOpen(false)}
                    className="block rounded-xl px-3 py-2 text-sm font-semibold hover:bg-violet-50 dark:hover:bg-slate-800"
                  >
                    Orders
                  </Link>
                  <Link
                    to="/wishlist"
                    onClick={() => setIsProfileOpen(false)}
                    className="block rounded-xl px-3 py-2 text-sm font-semibold hover:bg-violet-50 dark:hover:bg-slate-800"
                  >
                    Wishlist
                  </Link>
                  <button
                    type="button"
                    onClick={() => openAssistant("rewards")}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold hover:bg-violet-50 dark:hover:bg-slate-800"
                  >
                    <FaTrophy className="text-amber-500" /> Rewards
                  </button>
                  <button
                    type="button"
                    onClick={() => openAssistant("gift cards")}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold hover:bg-violet-50 dark:hover:bg-slate-800"
                  >
                    <FaGift className="text-pink-500" /> Gift Cards
                  </button>
                  <button
                    type="button"
                    onClick={() => openAssistant("customer care")}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold hover:bg-violet-50 dark:hover:bg-slate-800"
                  >
                    <FaHeadset className="text-cyan-500" /> Customer Care
                  </button>
                  <button
                    type="button"
                    onClick={logout}
                    className="mt-1 w-full rounded-xl border-t border-slate-200 px-3 py-2 text-left text-sm font-semibold text-rose-600 dark:border-slate-700"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-violet-500 dark:text-slate-950 dark:hover:bg-violet-400"
            >
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
