# NovaCart AI Recommendation System

NovaCart is a smart e-commerce store built with React and Vite, powered by MongoDB, and enhanced with an AI-driven NovaAssistant for product recommendations, customer support, order guidance, and personalized shopping experiences.

## Features

- AI shopping assistant for product discovery, FAQs, orders, returns, refunds, and customer care.
- Product recommendations based on the shopper's query, product catalog, and recent activity.
- Clickable AI recommendations that open product details.
- Product search with category and minimum/maximum price filters.
- Product detail pages with add-to-cart actions.
- Cart, checkout, wishlist, order history, and protected account routes.
- Profile dashboard with personal-information editing and persistent profile-photo upload preview.
- Authenticated profile menu with Profile, Orders, Wishlist, Rewards, Gift Cards, Customer Care, and Logout actions.
- Animated product cards, 3D product previews, scrolling brand collections, and splash cursor effects.
- Responsive light/dark UI built around NovaCart's existing violet, indigo, and slate theme.

## Tech Stack

### Frontend

- React 19
- Vite
- TailwindCSS
- Framer Motion and AOS for motion
- React Icons
- React Three Fiber, Three.js, and Drei for 3D previews

### Backend

- Node.js
- Express
- MongoDB and Mongoose
- JWT authentication
- bcryptjs password hashing

### AI

- Google Gemini models through the Generative Language API
- Product-catalog-aware recommendation scoring
- The assistant API is structured so another provider, including OpenAI GPT models, can be integrated through the backend

## Installation

### Prerequisites

- Node.js 18 or newer
- npm
- A MongoDB database, local or MongoDB Atlas
- A Google Gemini API key for AI responses

### Setup

```bash
git clone <your-repository-url>
cd REACT-APP
npm install
```

Create a `.env` file in the project root:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/novacart
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRE=7d
PORT=5000
FRONTEND_URL=http://localhost:5173
```

Never commit `.env` or API keys to source control. The frontend can optionally use a separate backend URL through `VITE_API_URL`:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend and backend together:

```bash
npm run dev:full
```

Or run them separately:

```bash
# Terminal 1: backend
npm run server

# Terminal 2: frontend
npm run dev
```

The frontend is normally available at `http://localhost:5173`. The backend selects the configured `PORT`, or an available port when no port is specified.

## Usage

1. Open the frontend URL in a browser.
2. Use the demo account from the login screen, or connect the backend to MongoDB and use a registered account.
3. Browse products, search by name or category, and narrow results with price filters.
4. Open NovaAssistant from the floating assistant button or the AI recommendations section.
5. Ask for recommendations, product comparisons, order help, returns, refunds, or customer support.
6. Click a recommendation to view its product details.
7. After login, open the profile icon to access account navigation and support actions.
8. Visit `/profile` to upload a profile image and update personal information.

## Project Structure

```text
REACT-APP/
├── backend/
│   ├── assistant.js       # Assistant API and catalog-aware recommendations
│   └── server.js          # Express server, auth, products, orders, and health API
├── public/                # Static public assets
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── NovaAssistant.jsx
│   │   ├── ProductCard.jsx
│   │   ├── Product3DView.jsx
│   │   └── ...
│   ├── config/api.js      # Frontend API URL helper
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   ├── CartContext.jsx
│   │   └── WishlistContext.jsx
│   ├── data/seedProducts.js
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── ProfilePage.jsx
│   │   ├── ProductDetails.jsx
│   │   └── ...
│   ├── App.jsx             # Routes and application providers
│   ├── App.css
│   └── index.css
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

## Available Commands

```bash
npm run dev           # Start the Vite development server
npm run server        # Start the Express backend
npm run dev:full      # Start frontend and backend together
npm run build         # Create a production frontend build
npm run preview       # Preview the production build
npm run lint          # Run Oxlint
npm run seed:products # Replace the MongoDB product collection with seed data
```

## Roadmap

### Completed

- React/Vite storefront with responsive NovaCart styling.
- MongoDB-backed products and authentication.
- AI recommendation and support assistant.
- Cart, wishlist, checkout, orders, profile editing, and product details.
- Search, category filtering, price-range filtering, and animated UI interactions.

### Future Planned

- Voice-enabled NovaAssistant.
- Omnichannel support across email, WhatsApp, and social messaging.
- Advanced personalization using richer browsing and purchase-event signals.
- Inventory-aware availability and delivery estimates.
- Automated recommendation evaluation and analytics dashboard.

## Contributing

1. Fork the repository and create a focused branch.
2. Keep changes consistent with the existing React, TailwindCSS, and backend patterns.
3. Do not commit secrets, local database files, or generated build output.
4. Run `npm run build` and `npm run lint` before opening a pull request.
5. Include a clear description, screenshots for UI changes, and test details.
6. Use issues for bugs and feature requests, including reproduction steps where relevant.

Pull requests should be small, reviewable, and explain any API or environment-variable changes.
