# NovaCart AI service

Kaggle customer-support ticket data trains the supervised machine-learning classifiers. The LLM is used for conversational generation and tool orchestration. RAG retrieves current internal company-policy documents.

The classifiers use the licensed dataset supplied by the project owner. No Kaggle dataset or trained model artifacts were present in this checkout, so the service uses an explicitly identified heuristic fallback until real data is supplied and models are trained. It does not claim that the LLM was trained on the ticket data.

## Local setup

1. Create a Python environment and install `ai-service/requirements.txt`.
2. Copy `.env.example` to `.env` and configure the PostgreSQL URL, service token, and optional LLM provider key. Keep `.env` private.
3. Start the existing Express backend once. Its idempotent initialization creates the additive order, cart, payment, delivery, ticket, policy, and audit tables alongside existing data.
4. Apply `migrations/001_agentic_support_pgvector.sql` to that database using a PostgreSQL role permitted to install `pgvector`. It is additive and leaves existing users, products, reviews, and chats in place.
5. Copy the licensed ticket CSV into `dataset/kaggle_support_tickets.csv`, then run from `ai-service`:

   ```text
   python training/preprocess_dataset.py
   python training/train_intent_model.py
   python training/train_priority_model.py
   python training/train_sentiment_model.py
   python training/evaluate_model.py intent
   python training/evaluate_model.py priority
   python training/evaluate_model.py sentiment
   ```

6. Start FastAPI from `ai-service` with `uvicorn app.main:app --host 127.0.0.1 --port 8000`. Set the same `AI_SERVICE_TOKEN` and `AI_SERVICE_URL` in the private Express environment; set `AI_AGENT_ENABLED=true` to enable the agent through the existing `/assistant/query` bridge. Without it, the existing recommendation assistant remains the fallback.

The service exposes `/health`, `/agent/classify`, `/agent/chat`, `/rag/search`, and `/rag/index-policy`. The React application continues to use the existing PostgreSQL-backed product catalog and JWT login. Customer cart/order/ticket endpoints require the existing signed JWT; a user ID submitted in a request body is never used as authorization.

## Order questions and requests

Order, delivery, payment, and refund-status answers come only from the authenticated customer's PostgreSQL records. If the customer does not provide an order number, the assistant checks that account's most recent order and identifies it as the latest order in the reply. Catalog CSV files are not used as order or payment records.

Return, refund, and cancellation requests show the verified order and require an explicit confirmation before the assistant opens a support ticket. Submitting that ticket does not itself change order status or issue a refund; this project has no connected cancellation or payment-provider operation. Eligibility is only described when supported by approved, indexed policy text; otherwise support must review it.

## Policy indexing

Only current, approved internal policy text belongs in policy RAG. The project does not seed guessed policy wording. Apply the pgvector migration, then have an authorized operator index approved text with `POST /rag/index-policy` using `{ "title": "Return Policy", "policy_text": "<approved text>" }`. Repeat for the approved Refund, Cancellation, Replacement, Delivery, Payment, Privacy, and Damaged Product policies. Retrieval filters by `POLICY_MIN_SIMILARITY`; if no matching approved content meets the configured threshold, the assistant escalates rather than inventing policy terms.

## API smoke tests

Use the internal service token configured in the local environment (never commit or paste the real token):

```text
GET  http://127.0.0.1:8000/health
POST http://127.0.0.1:8000/agent/classify
     {"message":"Where is my order?"}
POST http://127.0.0.1:8000/agent/chat
     {"customer_id":1,"order_id":1001,"message":"Track my order"}
POST http://127.0.0.1:8000/rag/search
     {"query":"How do returns work?","limit":4}
```

For Express, sign in through the existing `/api/auth/login` route and send its bearer token to `POST /assistant/query` with `{"message":"Track my order","orderId":1001}`. The order number must belong to that signed-in customer. Never send card details or use sample order numbers that are not present in the local database.

## Demo flow

1. Sign in, search the catalog or ask for a price/category/style, then inspect database-backed product cards.
2. Choose a product and explicitly confirm adding it to the cart; continue through the existing cart and checkout.
3. Ask to track an order without supplying its number; the assistant checks the latest order belonging to the signed-in account. Missing status values are reported as unavailable rather than fabricated.
4. Ask for a return, refund, or cancellation request. Review the order and confirm the support-ticket request; verify that the order/payment state was not changed by submitting the ticket.
5. Ask about a policy after approved text has been indexed; verify the policy reference. Without an indexed policy, verify that eligibility is not invented and the request is routed for human review.
6. Create or escalate a support ticket and confirm it appears only in the authenticated user's ticket list.

## Viva summary

The supervised sklearn models classify ticket intent, priority, and sentiment and provide the intent probability as confidence. The LLM does conversational generation and selects only the request-scoped tools provided to it. PostgreSQL is the authority for catalog and customer records; pgvector RAG is reserved for approved company policies. Express validates the existing JWT and supplies the customer ID to the internal FastAPI service. Database-backed operations validate ownership again. Adding to cart requires a separate explicit confirmation, and checkout/payment entry stays outside the chat.
