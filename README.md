# NextGen
# NovaCart AI

## Agentic E-Commerce Support, Order Tracking, and Policy Resolution Assistant

NovaCart AI upgrades the existing NovaCart product-recommendation chatbot into an intelligent AI agent. It helps users discover products, track orders, check payment/refund status, understand company policies, create support tickets, and escalate risky cases to human support teams.

## Features

- Product recommendations based on user needs, category, style, price, and rating
- Price filtering, for example: products under ₹200
- Product cards with image, price, rating, review, and product link
- Product availability and stock checking
- Cart assistance and add-to-cart confirmation
- Secure checkout guidance
- Order tracking and delivery status
- Payment, cancellation, and refund-status checking
- Return, refund, cancellation, delivery, replacement, and privacy-policy support
- Kaggle-trained ML intent, priority, and sentiment classification
- RAG-based internal policy search using PostgreSQL pgvector
- OpenAI or Anthropic LLM-powered responses
- Support-ticket creation and human escalation
- JWT authentication, bcrypt password hashing, and audit logs

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, JavaScript, Tailwind CSS |
| Backend | Node.js, Express.js, PostgreSQL, `pg` |
| AI Service | Python, FastAPI |
| ML | Pandas, Scikit-learn, Logistic Regression |
| AI Agent | LangChain, LangChain Community |
| LLM | OpenAI API |
| RAG | PostgreSQL |
| Security | JWT, bcrypt |

## Architecture

```text
Customer → React NovaAssistant → Express API → Python FastAPI AI Agent
         → ML Intent/Priority/Sentiment Model
         → PostgreSQL Product/Order/Payment Tools
         → pgvector Policy RAG
         → OpenAI/Anthropic LLM
         → Auto Resolution or Human Escalation
```

## Project Structure

```text
ai-service/
  dataset/       # Kaggle dataset and cleaned data
  models/        # Trained .joblib ML models
  training/      # Preprocessing and training scripts
  app/           # FastAPI, agent, tools, RAG, escalation logic

REACT-APP/
  backend/       # Express API bridge
  src/           # React frontend and NovaAssistant UI

database/
  schema.sql
  seed.sql
  policies.sql
  pgvector_setup.sql
```

## Installation

```powershell
git clone <repository-url>
cd NovaCart-AI
```

Install React and Express dependencies:

```powershell
cd REACT-APP
npm install
```

Install Python AI dependencies:

```powershell
cd ../ai-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

## Environment Variables

Create `ai-service/.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/novacart_db
LLM_PROVIDER=openai
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini
ANTHROPIC_API_KEY=your_anthropic_key
ESCALATION_CONFIDENCE_THRESHOLD=0.70
```

Create `REACT-APP/backend/.env`:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/novacart_db
JWT_SECRET=your_secure_jwt_secret
AI_SERVICE_URL=http://127.0.0.1:8000
```

## Run Project

Initialize PostgreSQL database:

```powershell
psql -U postgres -d novacart_db -f database/schema.sql
psql -U postgres -d novacart_db -f database/pgvector_setup.sql
psql -U postgres -d novacart_db -f database/seed.sql
```

Start Python AI service:

```powershell
cd ai-service
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

Start React and Express application:

```powershell
cd REACT-APP
npm run dev:full
```

Open:

```text
http://localhost:5173
```

## Demo Prompts

```text
I need a product for studying.
Show products under ₹200.
I want a cozy product for my home.
Track my order ORD-1001.
How do I return an order?
My order was cancelled but payment was deducted.
I want to speak with a human agent.
```

## AI Escalation Rules

The agent escalates when there is fraud, duplicate/unauthorized payment, refund dispute, privacy issue, legal issue, customer request for a human, low confidence below 0.70, missing policy, conflicting records, or repeated unresolved complaints.

## Important Note

The Kaggle dataset trains ML classifiers for intent, priority, and sentiment. The LLM is not
