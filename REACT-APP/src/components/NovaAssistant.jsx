import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FaCommentDots, FaPaperPlane, FaRobot, FaTimes } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { apiEndpoints, apiUrl, authHeaders } from "../config/api";
import { useNavigate } from "react-router-dom";
import ProductCard from "./ProductCard";
import OrderTrackingCard from "./OrderTrackingCard";
import TicketStatusCard from "./TicketStatusCard";
import PolicyCard from "./PolicyCard";
import EscalationCard from "./EscalationCard";
import { getLocalOrders, saveLocalOrders } from "../utils/localOrder";
import {
  handleLocalDemoOrderRequest,
  resolveOrderFollowup,
} from "../utils/orderSupport";

const shopProducts = [
  {
    id: 2,
    name: "Nova Smartwatch",
    category: "Wearables",
    price: 199,
    oldPrice: 259,
    rating: 4.7,
    reviews: 128,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80",
    description: "A sleek smartwatch for everyday activity and notifications.",
  },
  {
    id: 5,
    name: "Pulse Earbuds",
    category: "Audio",
    price: 159,
    oldPrice: 210,
    rating: 4.5,
    reviews: 112,
    image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=900&q=80",
    description: "Compact wireless earbuds with clear sound for daily listening.",
  },
  {
    id: 3,
    name: "Beam Pro Speaker",
    category: "Smart Devices",
    price: 179,
    oldPrice: 229,
    rating: 4.6,
    reviews: 84,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=80",
    description: "Room-filling sound in a compact, modern design.",
  },
  {
    id: 6,
    name: "Glow Desk Lamp",
    category: "Workspace",
    price: 89,
    oldPrice: 120,
    rating: 4.7,
    reviews: 63,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80",
    description: "Warm adjustable lighting for work, reading, and relaxing.",
  },
  {
    id: 1,
    name: "Aero X Headphones",
    category: "Audio",
    price: 249,
    oldPrice: 319,
    rating: 4.8,
    reviews: 151,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
    description: "Immersive wireless headphones with a comfortable premium fit.",
  },
  {
    id: 4,
    name: "Orbit Laptop Stand",
    category: "Workspace",
    price: 99,
    oldPrice: 139,
    rating: 4.8,
    reviews: 96,
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=80",
    description: "An ergonomic aluminum stand for a cleaner desk setup.",
  },
];

const quickOptions = [
  "I’m just looking",
  "I need a gift under ₹2000",
  "I bought Nike shoes",
  "📦Track Order",
  "🔁 Return Your Order",
  "💸 Refund Query",
  "❌ Cancel Order",
  "🎁 Use Gift Card",
  "💳 NovaCart Credit issues?",
  "➕ Use NovaCart Credit",
  "❓ FAQs",
  "💬 Get in Touch",
];

const faqAnswer =
  "Here are the answers I can help with:\n\n" +
  "🚚 Shipping: Orders are prepared after checkout. Ask me to track an order and share your order number.\n" +
  "🔁 Returns: Tell me you want to return an order and share the order number so we can guide you through the next step.\n" +
  "💸 Refunds: Refund timing depends on your payment provider. Share your order number for help checking the status.\n" +
  "💳 Payments: We can help with payment or NovaCart Credit issues. Please do not share your card number or password.\n" +
  "📩 Support: Type “Get in Touch” and include a short description of the issue.";

const getFaqFallback = (message) => {
  const lower = message.toLowerCase();

  if (/\b(faq|frequently asked|shipping|delivery|how long)\b/.test(lower)) {
    return { text: faqAnswer, recommendations: [] };
  }

  if (/\b(return|exchange)\b/.test(lower)) {
    return {
      text: "I can help with a return. Please share your order number and tell me which item you want to return. Keep the item unused and in its original packaging where possible.",
      recommendations: [],
    };
  }

  if (/\b(refund|money back)\b/.test(lower)) {
    return {
      text: "I can help check a refund. Please share your order number and payment method. Refund timing depends on your payment provider, and we will never ask for your full card number.",
      recommendations: [],
    };
  }

  if (/\b(payment|credit card|nova ?cart credit)\b/.test(lower)) {
    return {
      text: "For payment or NovaCart Credit issues, share your order number and the error message you saw. Please do not share card numbers, CVVs, passwords, or OTPs.",
      recommendations: [],
    };
  }

  if (/\b(track|where is my order|delivery status)\b/.test(lower)) {
    return {
      text: "I can help track your order. Please share your order number, but never share your password, card number, CVV, or OTP.",
      recommendations: [],
    };
  }

  return null;
};

const getDisplayName = (user) => user?.name || "there";
const requestActionLabels = {
  return_request: "return",
  refund_request: "refund",
  cancel_request: "cancellation",
};

const buildWelcomeMessages = (user) => {
  const name = getDisplayName(user);
  const greeting = name === "there" ? "Hi 👋 Welcome in!" : `Hi 👋 Welcome, ${name}!`;

  return [
    {
      sender: "bot",
      text: `${greeting}\nI’m Nova AI, your friendly NovaCart shopkeeper. Tell me what you need, ask for a gift, or just browse — I’ll recommend, upsell gently, and help you check out.\nAre you shopping for yourself or someone else? You can also tap an option below 👇`,
    },
  ];
};

const pickShopRecs = (ids) =>
  shopProducts.filter((product) => ids.includes(product.id)).slice(0, 3);

const buildDummyAssistantResponse = (message) => {
  const lower = String(message || "").toLowerCase();
  const orderReference = String(message || "").match(
    /\border\s*(?:(?:id|number)\s*)?#?\s*(DEMO-\d{1,16}|\d{1,12})\b/i,
  )?.[1];

  if (/under\s*₹?\s*2000|gift under|gift.*2000|budget.*2000/.test(lower)) {
    return {
      text:
        "Here are a few gift-worthy picks under ₹2000: the Glow Desk Lamp, Pulse Earbuds, and Beam Pro Speaker are all popular and budget-friendly. I can help you pick the best one based on the person you’re buying for.",
      recommendations: pickShopRecs([6, 5, 3]),
    };
  }

  if (/nike|shoes|sports shoes|sneakers/.test(lower)) {
    return {
      text:
        "Nice pick! Since you mentioned Nike shoes, I’d suggest the Pulse Earbuds, Beam Pro Speaker, or Nova Smartwatch as the perfect add-ons. They make a thoughtful upgrade and work well with a sporty lifestyle.",
      recommendations: pickShopRecs([5, 3, 2]),
    };
  }

  if (/track order|tracking|order status/.test(lower)) {
    return {
      text: orderReference
        ? `I couldn't verify order #${orderReference} because the secure order service is unavailable. No live status was retrieved; please try again later.`
        : "Please share your order number so I can check its recorded status. I can't verify live tracking while the order service is unavailable.",
      recommendations: [],
    };
  }

  if (/return.*order|return your order|return/.test(lower)) {
    return {
      text: orderReference
        ? `I couldn't verify order #${orderReference}, so no return request was submitted. Please try again when the secure order service is available.`
        : "I can help with a return. Please share your order number and the item you want to return.",
      recommendations: [],
    };
  }

  if (/refund|refund query/.test(lower)) {
    return {
      text: orderReference
        ? `I couldn't verify the payment or refund status for order #${orderReference} because the secure order service is unavailable.`
        : "Please share your order number so I can check the recorded payment and refund status. I can't verify a refund without the order record.",
      recommendations: [],
    };
  }

  if (/cancel.*order|cancel order/.test(lower)) {
    return {
      text: orderReference
        ? `I couldn't verify order #${orderReference}, so no cancellation was submitted. Please try again when the secure order service is available.`
        : "I can check whether cancellation is available. Please share your order number first.",
      recommendations: [],
    };
  }

  if (/gift card/.test(lower)) {
    return {
      text:
        "Gift cards can be redeemed during checkout. You can apply the balance before placing the order, and I can help you choose the best product to use it on.",
      recommendations: pickShopRecs([3, 2, 6]),
    };
  }

  if (/novacart credit|credit issues|use novacart credit/.test(lower)) {
    return {
      text:
        "Your NovaCart Credit balance can be applied at checkout. If you’re seeing an issue, I can help verify the balance or guide you to the right support page.",
      recommendations: pickShopRecs([1, 2, 3]),
    };
  }

  if (/faq|frequently asked|help/.test(lower)) {
    return {
      text: faqAnswer,
      recommendations: [],
    };
  }

  return getShopkeeperFallback(message);
};

const getShopkeeperFallback = (message) => {
  const lower = message.toLowerCase();
  const faqReply = getFaqFallback(message);

  if (faqReply) return faqReply;

  const styleMatches = [
    {
      pattern: /\b(minimal|minimalist|clean|simple|modern)\b/,
      text: "If you like a clean, modern look, I’d start with the Orbit Laptop Stand and Glow Desk Lamp. They keep a space polished without making it feel busy.",
      ids: [4, 6],
    },
    {
      pattern: /\b(premium|luxury|professional|executive)\b/,
      text: "For a more premium feel, I’d show you the Aero X Headphones and Nova Smartwatch. They’re sleek, useful, and easy to style with an everyday or work look.",
      ids: [1, 2],
    },
    {
      pattern: /\b(cozy|warm|relax|home|comfortable)\b/,
      text: "For a cozy setup, the Glow Desk Lamp paired with the Beam Pro Speaker is a lovely combination. The lamp adds warmth and the speaker gives the room a relaxed feel.",
      ids: [6, 3],
    },
    {
      pattern: /\b(house|home|living room|bedroom|room)\b/,
      text: "For your home, I’d recommend the Glow Desk Lamp for a warm atmosphere and the Beam Pro Speaker for relaxed music. Together, they make an easy, stylish upgrade to any room.",
      ids: [6, 3],
    },
    {
      pattern: /\b(work|office|desk|study|studying|student|college)\b/,
      text: "For work or study, I’d recommend the Orbit Laptop Stand with the Glow Desk Lamp. If you like background audio, the Pulse Earbuds are a practical add-on.",
      ids: [4, 6, 5],
    },
  ].find(({ pattern }) => pattern.test(lower));

  if (styleMatches) {
    return {
      text: `${styleMatches.text} What are you shopping for: yourself, a gift, or your workspace?`,
      recommendations: pickShopRecs(styleMatches.ids),
    };
  }

  if (
    /\b(just looking|only looking|browsing|window shopping|looking around)\b/.test(
      lower,
    )
  ) {
    return {
      text: "No worries, take your time! Want me to show you today’s best deals?",
      recommendations: pickShopRecs([2, 3, 5]),
    };
  }

  if (/\b(track|order|return|refund|cancel|payment|account)\b/.test(lower)) {
    return {
      text: "Happy to help with that. Share your order number, or tell me whether this is about tracking, a return, a refund, or payment, and I’ll walk you through the next step.",
      recommendations: [],
    };
  }

  if (/\bgift\b/.test(lower) && !/\bgift card\b/.test(lower)) {
    return {
      text: "Looking for a gift under ₹2000? We don’t have wallets or scarves in the shop today, but I think you’ll love the Beam Pro Speaker, Glow Desk Lamp, and Pulse Earbuds — all under budget. Ready to check out when you are.",
      recommendations: pickShopRecs([3, 6, 5]),
    };
  }

  if (/\b(i bought|i purchased|i got|just bought|nike|shoes)\b/.test(lower)) {
    return {
      text: "Nice pick! We don’t stock Nike socks or gym bags here, but since you mentioned those shoes, may I suggest the Nova Smartwatch, Pulse Earbuds, and Beam Pro Speaker as complementary add-ons? Want me to guide you to checkout?",
      recommendations: pickShopRecs([2, 5, 3]),
    };
  }

  return {
    text: "Are you shopping for yourself or someone else? Once I know that, I can suggest a few lovely options from the shop.",
    recommendations: [],
  };
};

export default function NovaAssistant({
  isOpen: controlledOpen,
  onOpenChange,
}) {
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(() => {
    if (typeof window === "undefined") return buildWelcomeMessages(null);

    const saved = localStorage.getItem("novacart-assistant-chat");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) {
          return parsed;
        }
      } catch {
        // ignore malformed storage
      }
    }

    return buildWelcomeMessages(null);
  });
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const previousMessageCount = useRef(messages.length);

  const isOpen = controlledOpen ?? internalOpen;

  useEffect(() => {
    if (messages.length > previousMessageCount.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
    previousMessageCount.current = messages.length;
  }, [messages.length]);

  const setIsOpen = useCallback((value) => {
    if (onOpenChange) {
      onOpenChange(value);
      return;
    }
    setInternalOpen(value);
  }, [onOpenChange]);

  useEffect(() => {
    const handleAssistantOpen = () => {
      setIsOpen(true);
    };

    window.addEventListener("open-nova-assistant", handleAssistantOpen);
    return () => {
      window.removeEventListener("open-nova-assistant", handleAssistantOpen);
    };
  }, [setIsOpen]);

  useEffect(() => {
    const handleAssistantTopic = (event) => {
      if (event.detail) setInput(`Tell me about ${event.detail}`);
    };

    window.addEventListener("nova-assistant-topic", handleAssistantTopic);
    return () =>
      window.removeEventListener("nova-assistant-topic", handleAssistantTopic);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("novacart-assistant-chat", JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    const clearSession = () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("novacart-assistant-chat");
      }
    };

    window.addEventListener("beforeunload", clearSession);
    return () => {
      clearSession();
      window.removeEventListener("beforeunload", clearSession);
    };
  }, []);

  const resetAssistant = () => {
    const nextMessages = buildWelcomeMessages(user);
    setMessages(nextMessages);
    setInput("");
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "novacart-assistant-chat",
        JSON.stringify(nextMessages),
      );
    }
  };

  const sendMessage = async (message, confirmation = {}) => {
    const userMessage = { sender: "user", text: message };
    const previousUserMessage = [...messages]
      .reverse()
      .find((entry) => entry.sender === "user")?.text;
    const orderFollowup = resolveOrderFollowup(message, previousUserMessage);
    const requestMessage = orderFollowup.message;
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsLoading(true);

    const fallbackReply = getShopkeeperFallback(requestMessage);

    try {
      if (orderFollowup.demoOrderId) {
        const localResult = handleLocalDemoOrderRequest({
          demoOrderId: orderFollowup.demoOrderId,
          message: requestMessage,
          confirmedAction: confirmation.confirmedAction,
          orders: getLocalOrders(),
        });
        if (localResult) {
          saveLocalOrders(localResult.orders);
          setMessages((current) => [
            ...current,
            {
              sender: "bot",
              text: localResult.message,
              orderDetails: localResult.orderDetails,
              pendingAction: localResult.pendingAction,
              actionType: "order_tracking",
            },
          ]);
          return;
        }
      }

      const response = await fetch(apiUrl(apiEndpoints.agentQuery), {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({
          message: requestMessage,
          ...((confirmation.orderId || orderFollowup.orderId)
            ? { orderId: confirmation.orderId || orderFollowup.orderId }
            : {}),
          ...(confirmation.confirmedAction
            ? { confirmedAction: confirmation.confirmedAction }
            : {}),
          ...(confirmation.confirmedProductId
            ? {
                confirmedProductId: confirmation.confirmedProductId,
                quantity: confirmation.quantity || 1,
              }
            : {}),
        }),
      });

      if (!response.ok) {
        throw new Error(`Assistant request failed with status ${response.status}`);
      }

      const data = await response.json();
      const botReply =
        typeof data.message === "string"
          ? data.message
          : typeof data.answer === "string"
            ? data.answer
            : fallbackReply.text;

      const recommendations = Array.isArray(data.products) && data.products.length
        ? data.products.slice(0, 3)
        : Array.isArray(data.recommendations)
          ? data.recommendations.slice(0, 3)
        : fallbackReply.recommendations;

      setMessages((current) => [
        ...current,
        {
          sender: "bot",
          text: botReply,
          recommendations,
          actionType: data.actionType || data.action_type,
          orderDetails: data.orderDetails || data.order_details || null,
          pendingAction: data.pendingAction || data.pending_action || null,
          policyReference: data.policyReference || data.policy_reference || null,
          ticketId: data.ticketId || data.ticket_id || null,
          assignedTeam: data.assignedTeam || data.assigned_team || null,
          escalationReason: data.escalationReason || data.escalation_reason || null,
          toolsUsed: data.toolsUsed || data.tools_used || [],
          shouldEscalate: Boolean(data.shouldEscalate ?? data.should_escalate),
        },
      ]);
    } catch {
      const dummyReply = buildDummyAssistantResponse(requestMessage);
      const accountOrderQuestion =
        /\b(track|tracking|order|return|refund|cancel|payment)\b/i.test(requestMessage);
      setMessages((current) => [
        ...current,
        {
          sender: "bot",
          text: accountOrderQuestion
            ? dummyReply.text || "I couldn’t connect to the secure order service, so I couldn’t verify your order. Please try again shortly or open Orders to view your account details."
            : dummyReply.text || fallbackReply.text,
          recommendations:
            dummyReply.recommendations && dummyReply.recommendations.length
              ? dummyReply.recommendations
              : accountOrderQuestion
                ? []
                : fallbackReply.recommendations,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickOption = (option) => {
    if (isLoading) return;
    void sendMessage(option.replace(/^[^\w]*/, ""));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    void sendMessage(trimmed);
  };

  const greetingName = useMemo(
    () => getDisplayName(user || { name: "there" }),
    [user],
  );

  return (
    <div className="fixed bottom-2 right-2 z-50 sm:bottom-5 sm:right-5">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="mb-2 flex h-[min(720px,calc(100dvh-1rem))] w-[min(420px,calc(100vw-1rem))] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)] dark:border-slate-700 dark:bg-slate-900 sm:mb-4"
          >
            <div className="flex items-center justify-between bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-lg">
                  <FaRobot />
                </div>
                <div>
                  <div className="text-sm font-black">NovaAssistant</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-violet-100">
                    {isAuthenticated
                      ? `Hi, ${greetingName}`
                      : "Smart shopping guide"}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (typeof window !== "undefined") {
                    localStorage.removeItem("novacart-assistant-chat");
                  }
                  setMessages(buildWelcomeMessages(user));
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm hover:bg-white/20"
                aria-label="Close assistant"
              >
                <FaTimes />
              </button>
            </div>

            <div
              className="chat-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4 dark:bg-slate-950/60"
              aria-live="polite"
            >
              {messages.map((message, index) => (
                <div
                  key={`${message.sender}-${index}`}
                  className={`max-w-[94%] break-words rounded-2xl px-4 py-3 text-base leading-6 whitespace-pre-line ${
                    message.sender === "bot"
                      ? "bg-white text-slate-800 shadow-sm dark:bg-slate-800 dark:text-slate-100"
                      : "ml-auto bg-violet-600 text-white"
                  }`}
                >
                  {message.text}
                  {message.sender === "bot" && message.recommendations?.length > 0 && (
                      <div className="mt-3 grid gap-3">
                        {message.recommendations.map((product) => (
                          <ProductCard key={product.id || product._id} product={{
                            ...product,
                            id: product.id ?? product._id,
                            _id: product._id ?? String(product.id),
                            rating: product.rating || 4.5,
                            reviews: product.reviews || 0,
                            description: product.description || "A recommended pick from NovaCart.",
                          }} />
                        ))}
                      </div>
                    )}
                  {message.sender === "bot" && message.orderDetails && (
                    <div className="mt-3">
                      <OrderTrackingCard order={message.orderDetails} />
                    </div>
                  )}
                  {message.sender === "bot" &&
                    message.pendingAction &&
                    message.orderDetails?.id && (
                      <button
                        type="button"
                        disabled={isLoading || !isAuthenticated}
                        onClick={() =>
                          sendMessage(
                            `Please confirm and submit my request to ${
                              message.pendingAction === "cancel_request"
                                ? "cancel"
                                : message.pendingAction === "refund_request"
                                  ? "request a refund for"
                                  : "return"
                            } my order #${message.orderDetails.id}`,
                            {
                              confirmedAction: message.pendingAction,
                              orderId: message.orderDetails.id,
                            },
                          )
                        }
                        className="mt-3 w-full rounded-xl bg-violet-600 px-4 py-3 text-base font-semibold leading-6 text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Confirm and submit {requestActionLabels[message.pendingAction]} request
                      </button>
                    )}
                  {message.sender === "bot" && message.policyReference && (
                    <div className="mt-3">
                      <PolicyCard title={message.policyReference}>
                        {message.text}
                      </PolicyCard>
                    </div>
                  )}
                  {message.sender === "bot" && message.ticketId && (
                    <div className="mt-3">
                      <TicketStatusCard ticket={{
                        id: message.ticketId,
                        subject: `Support ticket #${message.ticketId}`,
                        status: message.shouldEscalate ? "escalated" : "open",
                        priority: "medium",
                        description: message.text,
                      }} />
                    </div>
                  )}
                  {message.sender === "bot" && message.shouldEscalate && (
                    <div className="mt-3">
                      <EscalationCard
                        reason={message.escalationReason}
                        assignedTeam={message.assignedTeam}
                        ticketId={message.ticketId}
                      />
                    </div>
                  )}
                  {message.sender === "bot" &&
                    message.actionType === "cart_update" &&
                    message.toolsUsed?.includes("get_product_details") &&
                    message.recommendations?.[0] && (
                      <button
                        type="button"
                        disabled={isLoading || !isAuthenticated}
                        onClick={() =>
                          sendMessage("Yes, add it to my cart", {
                            confirmedProductId: message.recommendations[0].id,
                          })
                        }
                        className="mt-3 w-full rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {isAuthenticated ? "Confirm add to cart" : "Sign in to add to cart"}
                      </button>
                    )}
                  {message.sender === "bot" &&
                    message.actionType === "cart_update" &&
                    message.toolsUsed?.includes("add_to_cart") && (
                      <button
                        type="button"
                        onClick={() => navigate("/cart")}
                        className="mt-3 w-full rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Continue to cart and secure checkout
                      </button>
                    )}
                </div>
              ))}

              {messages.length <= 1 && (
                <div className="space-y-2 pt-2">
                  {quickOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleQuickOption(option)}
                      className="w-full rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-left text-base font-semibold leading-6 text-violet-800 transition hover:bg-violet-100 dark:border-violet-400/50 dark:bg-violet-950 dark:text-violet-100 dark:hover:bg-violet-900"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              <div ref={messagesEndRef} className="h-px" />

              {(messages.length > 1 || !isAuthenticated) && (
                <button
                  type="button"
                  onClick={resetAssistant}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left text-xs font-medium uppercase tracking-[0.2em] text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  🔙 Back to Start
                </button>
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex gap-2 border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
            >
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about products, orders, returns..."
                className="min-w-0 flex-1 rounded-full border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-800 outline-none placeholder:text-slate-500 focus:border-violet-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? "..." : <FaPaperPlane />}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <motion.button
          type="button"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            setMessages(buildWelcomeMessages(user));
            setIsOpen(true);
          }}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-2xl text-white shadow-[0_25px_60px_rgba(124,58,237,0.45)]"
          aria-label="Open NovaAssistant"
        >
          <FaCommentDots />
        </motion.button>
      )}
    </div>
  );
}
