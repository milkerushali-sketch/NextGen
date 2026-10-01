import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import AOS from "aos";
import "aos/dist/aos.css";
import {
  FaArrowRight,
  FaBolt,
  FaCheck,
  FaChevronDown,
  FaHeadset,
  FaRobot,
  FaSearch,
  FaShieldAlt,
  FaTruck,
} from "react-icons/fa";
import ProductCard from "../components/ProductCard";
import { useNavigate } from "react-router-dom";

const categories = [
  {
    name: "Smart Devices",
    tag: "Trending",
    accent: "from-violet-500 to-indigo-500",
  },
  { name: "Audio", tag: "Fresh", accent: "from-cyan-500 to-sky-500" },
  { name: "Wearables", tag: "Popular", accent: "from-amber-500 to-orange-500" },
  {
    name: "Workspace",
    tag: "Top Rated",
    accent: "from-emerald-500 to-teal-500",
  },
];

const demoProducts = [
  {
    id: 1,
    name: "Aero X Headphones",
    category: "Audio",
    price: 249,
    oldPrice: 319,
    rating: 4.9,
    reviews: 128,
    image:
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80",
    description:
      "High-quality wireless headphones with premium sound and active noise cancellation.",
  },
  {
    id: 2,
    name: "Nova Smartwatch",
    category: "Wearables",
    price: 199,
    oldPrice: 259,
    rating: 4.8,
    reviews: 96,
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80",
    description:
      "Track workouts, notifications, and wellness insights with a sleek modern look.",
  },
  {
    id: 3,
    name: "Beam Pro Speaker",
    category: "Smart Devices",
    price: 179,
    oldPrice: 229,
    rating: 4.7,
    reviews: 84,
    image:
      "https://images.unsplash.com/photo-1518444065439-e933c06ce9cd?auto=format&fit=crop&w=900&q=80",
    description:
      "Deep bass and room-filling sound designed for immersive listening and meetings.",
  },
  {
    id: 4,
    name: "Orbit Laptop Stand",
    category: "Workspace",
    price: 99,
    oldPrice: 139,
    rating: 4.9,
    reviews: 154,
    image:
      "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=900&q=80",
    description:
      "Boost your desk ergonomics with a lightweight, stable workspace upgrade.",
  },
  {
    id: 5,
    name: "Pulse Earbuds",
    category: "Audio",
    price: 159,
    oldPrice: 210,
    rating: 4.8,
    reviews: 151,
    image:
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80",
    description:
      "Compact earbuds tuned for clarity, battery life, and all-day comfort.",
  },
  {
    id: 6,
    name: "Glow Desk Lamp",
    category: "Workspace",
    price: 89,
    oldPrice: 120,
    rating: 4.6,
    reviews: 63,
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
    description:
      "Elegant lighting for focused work and relaxing evening productivity.",
  },
];

const purchaseHistory = ["Smartwatch", "Wireless Earbuds", "Laptop Stand"];

export default function Home() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  const scrollToShop = () => {
    document.getElementById("shop")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const showCollection = (category) => {
    setSelectedCategory(category);
    setCategoryFilter(category || "");
    requestAnimationFrame(() => scrollToShop());
  };

  const visibleProducts = demoProducts.filter((product) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      `${product.name} ${product.category}`.toLowerCase().includes(query);
    const matchesCategory =
      !categoryFilter || product.category === categoryFilter;
    const matchesMin = !minPrice || product.price >= Number(minPrice);
    const matchesMax = !maxPrice || product.price <= Number(maxPrice);
    return matchesSearch && matchesCategory && matchesMin && matchesMax;
  });

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("");
    setMinPrice("");
    setMaxPrice("");
    setSelectedCategory(null);
  };

  const openAssistant = () => {
    window.dispatchEvent(new CustomEvent("open-nova-assistant"));
  };

  return (
    <main>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-20">
        <div className="flex flex-col justify-center" data-aos="fade-right">
          <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200">
            <FaBolt /> Smart deals for modern living
          </div>
          <h1 className="max-w-xl text-5xl font-black leading-[1.05] tracking-tight text-slate-900 dark:text-white sm:text-6xl">
            Upgrade your life with{" "}
            <span className="text-violet-600 dark:text-violet-400">
              smarter picks
            </span>
            .
          </h1>
          <p className="mt-6 max-w-lg text-lg text-slate-600 dark:text-slate-300">
            Discover curated tech, productivity essentials, and lifestyle
            upgrades designed for today’s fast-moving businesses and shoppers.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#shop"
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-700 dark:bg-violet-500 dark:text-slate-950 dark:hover:bg-violet-400"
            >
              Shop now <FaArrowRight />
            </a>
            <button
              type="button"
              onClick={openAssistant}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <FaRobot /> AI recommendations
            </button>
          </div>

          <div className="mt-10 grid max-w-xl grid-cols-3 gap-4 text-left">
            {[
              ["120k+", "happy shoppers"],
              ["4.9/5", "average rating"],
              ["24/7", "customer care"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-200 bg-white/60 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
              >
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {value}
                </div>
                <div className="mt-1 text-xs uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative" data-aos="fade-left">
          <div className="absolute -left-8 top-10 h-36 w-36 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute -right-8 bottom-8 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl" />

          <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-4 shadow-[0_40px_120px_rgba(76,29,149,0.18)] dark:border-slate-800 dark:bg-slate-900">
            <div className="rounded-[28px] bg-gradient-to-br from-slate-900 via-violet-900 to-slate-900 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-violet-200">
                    This week
                  </p>
                  <h2 className="mt-2 text-3xl font-black">
                    Smart starter pack
                  </h2>
                </div>
                <div className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-violet-100">
                  -30%
                </div>
              </div>

              <div className="mt-8 rounded-[28px] bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur-sm">
                <img
                  src="https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=900&q=80"
                  alt="Premium headset"
                  className="h-64 w-full rounded-2xl object-cover"
                />
              </div>

              <div className="mt-6 flex items-center justify-between rounded-2xl bg-white/5 p-4">
                <div>
                  <div className="text-sm text-violet-200">Top pick</div>
                  <div className="text-2xl font-black">₹249</div>
                </div>
                <button
                  type="button"
                  className="rounded-full bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-400"
                >
                  Add to cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden border-y border-slate-200 bg-white/70 py-5 dark:border-slate-800 dark:bg-slate-900/50">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            duration: 25,
            ease: "linear",
            repeat: Infinity,
          }}
          className="flex min-w-max gap-10 px-4 text-center text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400"
        >
          {Array.from({ length: 2 }).flatMap((_, repeatIndex) =>
            ["Shopify", "Notion", "Stripe", "Slack", "Spotify", "Dropbox"].map(
              (brand) => (
                <div
                  key={`${brand}-${repeatIndex}`}
                  className="min-w-[130px] opacity-75 grayscale transition hover:opacity-100"
                >
                  {brand}
                </div>
              ),
            ),
          )}
        </motion.div>
      </section>

      <section
        id="featured"
        className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
              Featured collections
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Built for work, play, and growth
            </h2>
          </div>
          <button
            type="button"
            onClick={() => showCollection(null)}
            className="hidden items-center gap-2 text-sm font-semibold text-slate-700 md:inline-flex dark:text-slate-200"
          >
            View all <FaChevronDown className="rotate-[-90deg]" />
          </button>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {categories.map((item, index) => (
            <div
              key={item.name}
              data-aos="zoom-in"
              data-aos-delay={index * 100}
              className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div
                className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-r ${item.accent} opacity-90`}
              />
              <div className="relative flex h-52 flex-col justify-between rounded-[22px] bg-slate-950/10 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-700">
                    {item.tag}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const product = demoProducts.find(
                        (entry) => entry.category === item.name,
                      );
                      if (product) {
                        navigate(`/product/${product.id}`, {
                          state: { product },
                        });
                      } else {
                        showCollection(item.name);
                      }
                    }}
                    className="rounded-full bg-white/80 p-2 text-slate-900 transition hover:scale-105 hover:bg-white"
                    aria-label={`View ${item.name} collection`}
                  >
                    ↗
                  </button>
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{item.name}</p>
                  <div className="mt-2 text-sm text-slate-200">
                    Curated essentials
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="shop" className="bg-slate-950 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">
                Best sellers
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">
                Exclusive deals for savvy shoppers
              </h2>
            </div>
            <button
              type="button"
              onClick={() => showCollection(null)}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {selectedCategory
                ? `All ${selectedCategory}`
                : "Explore all products"}
            </button>
          </div>

          <div className="mt-8 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-[1.5fr_1fr_0.7fr_0.7fr_auto]">
            <label className="relative">
              <span className="sr-only">Search products</span>
              <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search products"
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-10 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400"
              />
            </label>
            <label>
              <span className="sr-only">Filter by category</span>
              <select
                value={categoryFilter}
                onChange={(event) => {
                  setCategoryFilter(event.target.value);
                  setSelectedCategory(event.target.value || null);
                }}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-sm text-white outline-none focus:border-violet-400"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.name} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">Minimum price</span>
              <input
                type="number"
                min="0"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                placeholder="Min ₹"
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400"
              />
            </label>
            <label>
              <span className="sr-only">Maximum price</span>
              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                placeholder="Max ₹"
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400"
              />
            </label>
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Clear
            </button>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visibleProducts.map((product, index) => (
              <div
                data-aos="fade-up"
                data-aos-delay={index * 80}
                key={product.id}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
          {!visibleProducts.length && (
            <p className="mt-10 text-center text-slate-400">
              No products match those filters.
            </p>
          )}
        </div>
      </section>

      <section
        id="support"
        className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div
            className="rounded-[30px] border border-slate-200 bg-gradient-to-br from-violet-500 via-indigo-600 to-sky-500 p-8 text-white shadow-[0_20px_60px_rgba(79,70,229,0.35)]"
            data-aos="fade-right"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-100">
              AI shopping assistant
            </p>
            <h2 className="mt-4 text-3xl font-black">
              Personalized recommendations based on your behavior.
            </h2>
            <p className="mt-4 text-violet-100">
              The AI looks at your purchase history and browsing preferences to
              suggest products that match your taste and intent.
            </p>

            <div className="mt-8 rounded-[24px] bg-white/10 p-5 backdrop-blur-sm">
              <div className="mb-3 flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-violet-100">
                <FaRobot /> Recommended for you
              </div>
              <div className="rounded-2xl bg-slate-950/25 p-4">
                <div className="text-xl font-black">Aero X Headphones</div>
                <div className="mt-2 flex items-center justify-between text-sm text-violet-100">
                  <span>Based on: {purchaseHistory.join(", ")}</span>
                  <span>₹249</span>
                </div>
              </div>
            </div>
          </div>

          <div
            className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            data-aos="fade-left"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
                  Why shop with us
                </p>
                <h3 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                  Built for happy customers
                </h3>
              </div>
              <div className="rounded-full bg-violet-100 p-3 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                <FaCheck />
              </div>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {[
                {
                  icon: FaTruck,
                  title: "Fast delivery",
                  text: "Same-day dispatch on top products",
                },
                {
                  icon: FaShieldAlt,
                  title: "Secure checkout",
                  text: "Protected payments and order tracking",
                },
                {
                  icon: FaHeadset,
                  title: "24/7 support",
                  text: "Real humans ready to help anytime",
                },
              ].map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="rounded-[22px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/70"
                >
                  <div className="mb-4 inline-flex rounded-2xl bg-violet-100 p-3 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                    <Icon />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                    {title}
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-8 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.32),_transparent_45%),linear-gradient(135deg,#020817_0%,#111827_40%,#0f172a_100%)] text-slate-200">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 font-black text-white shadow-lg shadow-violet-500/30">
                N
              </div>
              <div>
                <div className="text-xl font-black text-white">NovaCart</div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-slate-400">
                  smart shopping
                </div>
              </div>
            </div>
            <p className="mt-6 max-w-md text-slate-300">
              Build your dream setup with curated tech, premium essentials, and
              personalized recommendations that actually fit your lifestyle.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">Explore</h3>
            <ul className="mt-5 space-y-3 text-sm text-slate-300">
              <li>Featured picks</li>
              <li>Top categories</li>
              <li>New arrivals</li>
              <li>Gift cards</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">Support</h3>
            <ul className="mt-5 space-y-3 text-sm text-slate-300">
              <li>Shipping & returns</li>
              <li>Customer care</li>
              <li>Track order</li>
              <li>Privacy policy</li>
            </ul>
          </div>
        </div>
      </footer>
    </main>
  );
}
