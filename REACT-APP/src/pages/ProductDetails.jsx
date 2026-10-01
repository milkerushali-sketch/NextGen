import { useEffect, useState } from "react";
import { FaArrowLeft, FaShoppingCart, FaStar } from "react-icons/fa";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { apiUrl } from "../config/api";
import { handleProductImageError } from "../utils/productImage";

export default function ProductDetails() {
  const { productId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState(location.state?.product || null);
  const [isLoading, setIsLoading] = useState(!product);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, text: "", imageUrl: "" });
  const [reviewMessage, setReviewMessage] = useState("");

  useEffect(() => {
    if (product) return;

    let isMounted = true;
    fetch(apiUrl("/api/products"))
      .then((response) => response.json())
      .then((products) => {
        const match = products.find(
          (item) => String(item.id || item._id) === String(productId),
        );
        if (isMounted) setProduct(match || null);
      })
      .catch(() => {
        if (isMounted) setProduct(null);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [product, productId]);

  useEffect(() => {
    fetch(apiUrl(`/api/products/${productId}/reviews`))
      .then((response) => (response.ok ? response.json() : []))
      .then(setReviews)
      .catch(() => setReviews([]));
  }, [productId]);

  const submitReview = async (event) => {
    event.preventDefault();
    if (!user?.email) {
      setReviewMessage("Please sign in before writing a review.");
      return;
    }
    setReviewMessage("Submitting...");
    const response = await fetch(apiUrl(`/api/products/${productId}/reviews`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...reviewForm,
        userEmail: user.email,
        userName: user.name || "NovaCart shopper",
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setReviewMessage(data.message || "Could not submit review.");
      return;
    }
    setReviews((current) => [data, ...current]);
    setReviewForm({ rating: 5, text: "", imageUrl: "" });
    setReviewMessage("Thanks! Your review is now visible.");
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-24 text-center">
        Loading product...
      </main>
    );
  }

  if (!product) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">
          Product unavailable
        </h1>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-full bg-violet-600 px-5 py-3 text-sm font-semibold text-white"
        >
          Back to shopping
        </Link>
      </main>
    );
  }

  const productKey = product.id || product._id;

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-violet-600 dark:text-slate-300"
      >
        <FaArrowLeft /> Back
      </button>
      <div className="grid gap-10 overflow-hidden rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-2 md:p-8">
        <img
          src={product.image}
          alt={product.name}
          onError={handleProductImageError}
          className="h-full min-h-80 w-full rounded-[24px] object-cover"
        />
        <div className="flex flex-col justify-center">
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
            {product.category}
          </div>
          <section className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                Customer reviews
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Real feedback to help you decide before buying.
              </p>
              <div className="mt-5 space-y-4">
                {reviews.length ? reviews.map((review) => (
                  <article key={review._id} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
                    <div className="flex items-center justify-between gap-3">
                      <strong className="text-sm text-slate-900 dark:text-white">{review.userName}</strong>
                      <span className="text-sm text-yellow-500">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{review.text}</p>
                    {review.imageUrl && <img src={review.imageUrl} alt="Customer review" onError={handleProductImageError} className="mt-3 max-h-48 rounded-xl object-cover" />}
                  </article>
                )) : <p className="text-sm text-slate-500">No reviews yet. Be the first to share your experience.</p>}
              </div>
            </div>
            <form onSubmit={submitReview} className="rounded-[28px] border border-violet-200 bg-violet-50 p-6 dark:border-violet-500/30 dark:bg-violet-500/10">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Share your feedback</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Purchased this product? Tell other shoppers what you think.</p>
              <label className="mt-5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Rating
                <select value={reviewForm.rating} onChange={(event) => setReviewForm({ ...reviewForm, rating: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                  {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
                </select>
              </label>
              <textarea required value={reviewForm.text} onChange={(event) => setReviewForm({ ...reviewForm, text: event.target.value })} placeholder="How does it look and feel?" className="mt-4 min-h-28 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-900" />
              <input value={reviewForm.imageUrl} onChange={(event) => setReviewForm({ ...reviewForm, imageUrl: event.target.value })} placeholder="Optional image URL" className="mt-3 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-900" />
              <button type="submit" className="mt-4 w-full rounded-full bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-500">Post review</button>
              {reviewMessage && <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{reviewMessage}</p>}
            </form>
          </section>
          <h1 className="mt-3 text-4xl font-black text-slate-900 dark:text-white">
            {product.name}
          </h1>
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300">
            <FaStar className="text-yellow-400" /> {product.rating || "4.5"} (
            {product.reviews || 0} reviews)
          </div>
          <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-300">
            {product.description}
          </p>
          <div className="mt-8 flex items-center justify-between gap-4">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              ₹{product.price}
            </span>
            <button
              type="button"
              onClick={() => addToCart({ ...product, id: productKey })}
              className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
            >
              <FaShoppingCart /> Add to cart
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
