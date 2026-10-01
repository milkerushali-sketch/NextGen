import express from "express";
import dotenv from "dotenv";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const tokenize = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

const uniqueById = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = item?._id?.toString?.() || item.id || item.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getHistoryKeywords = async (pool) => {
  const { rows: recentChats } = await pool.query(
    "SELECT query, response FROM chats ORDER BY created_at DESC LIMIT 20",
  );
  return recentChats.flatMap((entry) =>
    tokenize(`${entry.query} ${entry.response}`),
  );
};

const getPriceBounds = (message) => {
  const value = String(message);
  const rangeMatch = value.match(
    /(?:between|from|range)[^\d]*([\d,]+)[^\d]+([\d,]+)/i,
  );
  if (rangeMatch) {
    const first = Number(rangeMatch[1].replace(/,/g, ""));
    const second = Number(rangeMatch[2].replace(/,/g, ""));
    return { min: Math.min(first, second), max: Math.max(first, second) };
  }

  const underMatch = value.match(
    /(?:under|below|within|max(?:imum)?|less than|up to)[^\d]*([\d,]+)/i,
  );
  if (underMatch) {
    return { min: 0, max: Number(underMatch[1].replace(/,/g, "")) };
  }

  return null;
};

const buildRecommendationSet = (message, products, historyKeywords = []) => {
  const queryTokens = tokenize(message);
  const allTokens = Array.from(new Set([...queryTokens, ...historyKeywords]));
  const faqAnswer =
    "Here are the answers I can help with:\n\n" +
    "🚚 Shipping: Orders are prepared after checkout. Ask me to track an order and share your order number.\n" +
    "🔁 Returns: Tell me you want to return an order and share the order number so we can guide you through the next step.\n" +
    "💸 Refunds: Refund timing depends on your payment provider. Share your order number for help checking the status.\n" +
    "💳 Payments: We can help with payment or NovaCart Credit issues. Please do not share your card number or password.\n" +
    "📩 Support: Type “Get in Touch” and include a short description of the issue.";
  const isFaqRequest = /\b(faq|frequently asked|shipping|delivery|how long)\b/i.test(
    message,
  );
  const faq = [
    "How long does shipping take?",
    "How do I return an order?",
    "When will I receive my refund?",
    "What payment methods are supported?",
  ];

  if (isFaqRequest) {
    return {
      intent: "general-help",
      answer: faqAnswer,
      recommendations: [],
      similarProducts: [],
      faq,
    };
  }

  const priceBounds = getPriceBounds(message);
  const isSupportRequest =
    /\b(track|order|return|refund|cancel|payment|gift card|credit|account)\b/i.test(
      message,
    );
  const styleMatch = /\b(house|home|living room|bedroom|room)\b/i.test(message)
    ? {
        answer:
          "For your home, I’d recommend the Glow Desk Lamp for a warm atmosphere and the Beam Pro Speaker for relaxed music. Together, they make an easy, stylish upgrade to any room.",
        ids: ["Glow Desk Lamp", "Beam Pro Speaker"],
      }
    : /\b(work|office|desk|study|studying|student|college)\b/i.test(message)
      ? {
          answer:
            "For work or study, I’d recommend the Orbit Laptop Stand with the Glow Desk Lamp. If you like background audio, the Pulse Earbuds are a practical add-on.",
          ids: ["Orbit Laptop Stand", "Glow Desk Lamp", "Pulse Earbuds"],
        }
      : null;

  const scoredProducts = products
    .map((product) => {
      const haystack = [
        product.name,
        product.category,
        product.description,
        ...(product.tags || []),
      ]
        .join(" ")
        .toLowerCase();

      let score = 0;
      queryTokens.forEach((token) => {
        if (haystack.includes(token)) score += 10;
      });
      allTokens.forEach((token) => {
        if (haystack.includes(token)) score += 3;
      });

      score += product.rating * 4;
      score += product.reviews / 25;
      if (priceBounds && product.price >= priceBounds.min && product.price <= priceBounds.max) {
        score += 15;
      }
      if (priceBounds && (product.price < priceBounds.min || product.price > priceBounds.max)) {
        score -= 20;
      }

      return { ...product, score };
    })
    .sort((a, b) => b.score - a.score);

  const withinBudget =
    !priceBounds
      ? scoredProducts
      : scoredProducts.filter(
          (product) =>
            product.price >= priceBounds.min && product.price <= priceBounds.max,
        );
  const fallback = withinBudget.slice(0, 8);
  const exactMatches = fallback.filter((product) =>
    queryTokens.some((token) =>
      `${product.name} ${product.category} ${product.description}`
        .toLowerCase()
        .includes(token),
    ),
  );

  const toRecommendation = (product, reason) => ({
    id: product._id?.toString?.() || product.id || product.name,
    name: product.name,
    category: product.category,
    price: product.price,
    reason:
      reason || `Popular in ${product.category} and highly rated by shoppers.`,
  });

  let recommendations = uniqueById(
    (exactMatches.length ? exactMatches : fallback).slice(0, 4),
  ).map((product) => toRecommendation(product));

  const isBrowsing = /\b(just looking|only looking|browsing|window shopping|looking around)\b/i.test(
    message,
  );
  const isGiftRequest =
    /\bgift\b/i.test(message) && !/\bgift card\b/i.test(message);
  const isPurchaseMention =
    /\b(i bought|i purchased|i got|just bought|just purchased)\b/i.test(
      message,
    );

  if (styleMatch) {
    const styleRecommendations = uniqueById(
      styleMatch.ids
        .map((name) => scoredProducts.find((product) => product.name === name))
        .filter(Boolean),
    ).map((product) => toRecommendation(product, `A great match for your ${/\b(study|studying|student|college|work|office|desk)\b/i.test(message) ? "study or work" : "home"} style.`));
    recommendations = styleRecommendations;
  } else if (!isSupportRequest && (isPurchaseMention || isGiftRequest || isBrowsing)) {
    let pool = scoredProducts;
    if (priceBounds) {
      pool = pool.filter(
        (product) =>
          product.price >= priceBounds.min && product.price <= priceBounds.max,
      );
    }
    if (isPurchaseMention || isGiftRequest) {
      const preferred = pool.filter((product) =>
        /wearable|accessor|audio|smart device/i.test(product.category || ""),
      );
      if (preferred.length) pool = preferred;
    }
    const personaRecs = uniqueById(pool)
      .slice(0, 4)
      .map((product) =>
        toRecommendation(
          product,
          isPurchaseMention
            ? "A complementary add-on for what you already picked."
            : isGiftRequest
              ? "A thoughtful gift-friendly pick from the shop."
              : "One of today’s best deals in the store.",
        ),
      );
    if (personaRecs.length) recommendations = personaRecs;
  }

  const primary = recommendations[0];

  const similarProducts = scoredProducts
    .filter(
      (product) =>
        primary &&
        product.category === primary.category &&
        product.name !== primary.name,
    )
    .slice(0, 2)
    .map((product) => ({
      ...product,
      reason: `Similar to ${primary.name} in ${primary.category}.`,
    }));

  const recName = (index) => recommendations[index]?.name;
  const recPrice = (index) => recommendations[index]?.price;

  let answer;
  if (isSupportRequest) {
    answer =
      "Happy to help with that. Share your order number, or tell me whether this is about tracking, a return, a refund, or payment, and I’ll walk you through the next step.";
  } else if (styleMatch) {
    answer = `${styleMatch.answer} What kind of look do you prefer: minimal, cozy, or premium?`;
  } else if (isBrowsing) {
    answer =
      "No worries, take your time! Want me to show you today’s best deals?";
  } else if (priceBounds && !primary) {
    answer = `I couldn’t find a product between ₹${priceBounds.min} and ₹${priceBounds.max} in the current catalog. Would you like to increase the budget or browse all products?`;
  } else if (!primary) {
    answer =
      "Are you shopping for yourself or someone else? Once I know that, I can suggest a few lovely options.";
  } else if (isGiftRequest && priceBounds !== null) {
    answer = `Looking for a gift between ₹${priceBounds.min} and ₹${priceBounds.max}? I think you’ll love ${recName(0)} at ₹${recPrice(0)}. ${recName(1) ? `${recName(1)}` : "Another shop favorite"} ${recName(2) ? `and ${recName(2)}` : ""} also make thoughtful picks from our catalog. Ready to check out when you are.`;
  } else if (isGiftRequest) {
    answer = `A gift is a lovely idea. I think you’ll love ${recName(0)}. Are you shopping for yourself or someone else? Share a budget and I can add a matching extra before checkout.`;
  } else if (isPurchaseMention) {
    answer = `Nice pick! If we don’t stock that exact accessory, may I suggest ${recName(0)}${recName(1) ? ` and ${recName(1)}` : ""} as complementary add-ons from the shop? Want me to guide you to checkout?`;
  } else if (priceBounds && primary) {
    answer = `I think you’ll love ${primary.name} at ₹${primary.price}. It fits your price range, and I can also compare it with another ${primary.category.toLowerCase()} option if you’d like. Shall I help you check out?`;
  } else {
    answer = `I think you’ll love ${primary.name}. It’s a popular ${primary.category.toLowerCase()} pick, and ${similarProducts[0]?.name || "another catalog option"} could be a nice alternative. Would you like the best value, a premium option, or help heading to checkout?`;
  }

  return {
    intent: isSupportRequest
      ? "order-support"
      : exactMatches.length
        ? "product-match"
        : "trend-discovery",
    answer,
    recommendations: isSupportRequest ? [] : recommendations,
    similarProducts,
    faq,
  };
};

const extractJsonFromText = (text) => {
  if (!text) return null;

  const cleaned = String(text)
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return null;
      }
    }

    return null;
  }
};

const generateOpenAIResponse = async ({
  message,
  userName,
  recentPurchases,
  products,
}) => {
  if (!OPENAI_API_KEY || !OPENAI_API_KEY.startsWith("sk-")) {
    throw new Error(
      "OPENAI_API_KEY is missing or invalid. Add a valid OpenAI API key beginning with sk- to .env and restart the backend.",
    );
  }

  const productContext = (products || [])
    .slice(0, 100)
    .map(
      (product) =>
        `- id: ${product._id} | ${product.name} | category: ${product.category} | price: ₹${product.price} | rating: ${product.rating} | description: ${product.description || ""}`,
    )
    .join("\n");

  const systemPrompt = `You are Nova AI, a friendly shopkeeper for NovaCart.
Always greet warmly, ask clarifying questions, recommend products conversationally, upsell gently, and guide checkout.
Stay in character for every input. Never sound like a generic chatbot, never say you are an AI model, and never dump unexplained product lists.

Persona rules:
- Speak like a helpful store clerk. Use phrases such as "I think you'll love this..." or "Since you picked those shoes, may I suggest...".
- Keep replies short, polite, and action-oriented.
- After a good match, invite the customer toward checkout without pressure.

How to handle inputs (catalog-aware):
- If the customer mentions a purchase (example: "I bought Nike shoes"), suggest complementary add-ons in shopkeeper voice. Prefer real catalog items such as Accessories, Wearables, Audio, or similar. If Nike, socks, or a gym bag are not in the catalog, say so briefly and recommend the closest in-catalog complements. Never invent products.
- If they want a gift with a budget (example: "I need a gift under ₹2000"), recommend gift-worthy catalog items within that budget conversationally (speakers, accessories, wearables, etc.), then offer to help check out.
- If they ask for a style, mood, or setup (for example minimalist, premium, cozy, modern, work, or study), explain why the recommended catalog products fit that style and ask one natural follow-up question.
- If they are browsing (example: "I'm just looking"), reply: "No worries, take your time! Want me to show you today’s best deals?" You may attach top catalog recommendations.
- If the input is vague, ask one gentle clarifying question such as "Are you shopping for yourself or someone else?" You may also ask about budget or category if still needed.

Accuracy rules:
- Only recommend products from the supplied catalog. Never invent products, prices, ratings, availability, order status, policies, or account information.
- Recommendation ids must exactly match catalog ids. Return at most four recommendations.
- For order, return, refund, payment, or account questions, explain what the customer can do next without claiming that an action was completed. Stay warm and in character.
- If the catalog does not contain a suitable product, say so honestly and ask a useful follow-up question.
- Use Indian rupee pricing when mentioning prices.

Customer info:
- Name: ${userName || "Shopper"}
- Recent purchases: ${recentPurchases && recentPurchases.length ? recentPurchases.join(", ") : "No recent purchases found"}

Product catalog:
${productContext}

Respond in valid JSON only with this exact structure:
{
  "answer": "short, conversational answer",
  "intent": "shopping-help|order-support|refund-help|returns|general-help",
  "recommendations": [
    { "id": "catalog-id", "name": "Catalog product name", "category": "Catalog category", "price": 999, "reason": "Why it matches" }
  ]
}

Rules:
- Do not include markdown, code fences, or extra text outside JSON.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.4,
      max_tokens: 500,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenAI API request failed: ${response.status} ${errorText}`,
    );
  }

  const data = await response.json();
  const rawText = data?.choices?.[0]?.message?.content || "";

  const parsed = extractJsonFromText(rawText);

  if (!parsed || !parsed.answer) {
    throw new Error("OpenAI returned an empty or invalid response");
  }

  return {
    answer: String(parsed.answer),
    intent: String(parsed.intent || "shopping-help"),
    recommendations: Array.isArray(parsed.recommendations)
      ? parsed.recommendations
          .map((item) => {
            const product = products.find(
              (candidate) =>
                candidate._id?.toString() === String(item.id) ||
                candidate.name === item.name,
            );
            if (!product) return null;
            return {
              id: product._id.toString(),
              name: product.name,
              category: product.category,
              price: product.price,
              reason: String(
                item.reason || "A good match for your shopping goals.",
              ),
            };
          })
          .filter(Boolean)
          .slice(0, 4)
      : [],
  };
};

const assistantRouter = ({ pool }) => {
  const router = express.Router();

  router.post("/query", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    if (!message) {
      return res
        .status(400)
        .json({ message: "A shopping question is required." });
    }

    const { rows: products } = await pool.query(
      "SELECT *, id AS _id FROM products ORDER BY rating DESC, reviews DESC LIMIT 100",
    );
    const historyKeywords = await getHistoryKeywords(pool);
    const priceBounds = getPriceBounds(message);
    const fallbackSet = buildRecommendationSet(
      message,
      products,
      historyKeywords,
    );

    let answerSet = fallbackSet;

    try {
      const userName = req.body?.context?.userName || "Shopper";
      const recentPurchases = Array.isArray(req.body?.context?.recentPurchases)
        ? req.body.context.recentPurchases
        : [];

      const aiResult = await generateOpenAIResponse({
        message,
        userName,
        recentPurchases,
        products,
      });

      const constrainedRecommendations = priceBounds
      ? aiResult.recommendations.filter(
          (product) =>
            Number(product.price) >= priceBounds.min &&
            Number(product.price) <= priceBounds.max,
        )
      : aiResult.recommendations;

      answerSet = {
      ...fallbackSet,
      ...aiResult,
      answer: priceBounds ? fallbackSet.answer : aiResult.answer,
      faq: fallbackSet.faq,
      similarProducts: fallbackSet.similarProducts,
      recommendations: constrainedRecommendations?.length
        ? constrainedRecommendations
        : fallbackSet.recommendations,
      };
    } catch (error) {
      console.warn("OpenAI fallback used for NovaAssistant:", error.message);
    }

    await pool.query(
      `INSERT INTO chats (user_id, user_email, query, response, intent, recommendations)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [
        req.body?.userId || null,
        req.body?.email || "guest",
        message,
        answerSet.answer,
        answerSet.intent,
        JSON.stringify(answerSet.recommendations),
      ],
    );

    return res.json({
      answer: answerSet.answer,
      recommendations: answerSet.recommendations,
      faqs: answerSet.faq,
      intent: answerSet.intent,
      similarProducts: answerSet.similarProducts,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to generate recommendations right now.",
      error: error.message,
    });
  }
  });

  return router;
};

export { assistantRouter };
