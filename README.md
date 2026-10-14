# ShopKart — Full-Stack E-Commerce Application

ShopKart is a full-stack e-commerce web application built using React, Node.js, Express, and MongoDB. It provides an online shopping experience with customer authentication, product browsing, cart management, wishlist functionality, order management, and Razorpay payment integration in Test Mode.

## Features

- **User Authentication:** Customer registration, login, and protected routes.
- **Product Browsing:** View products and explore product details.
- **Shopping Cart:** Add products, update quantities, and manage cart items.
- **Wishlist:** Save products for later.
- **Checkout:** Enter shipping details and proceed to payment.
- **Payment Integration:** Razorpay Test Mode integration with server-side payment verification.
- **Order Management:** Place orders and view order history and order details.
- **Stock Management:** Validate and update product stock during order processing.
- **Database Integration:** Store customer, product, cart, wishlist, and order data in MongoDB.

## Tech Stack

### Frontend
- React
- Vite
- React Router
- Axios
- JavaScript
- CSS

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT-based authentication
- Razorpay API

## Project Structure

```text
SHOPKART_FINAL/
├── shopkart-backend/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── .env.example
│   ├── index.js
│   └── package.json
├── shopkart-frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

## Prerequisites

Install the following before running the application:

- Node.js and npm
- MongoDB Atlas account or a MongoDB instance
- Razorpay account with Test Mode API credentials

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Pavitra1625/Shopkart.git
cd Shopkart
```

### 2. Configure the Backend

Navigate to the backend directory:

```bash
cd shopkart-backend
npm install
```

Create a `.env` file inside `shopkart-backend/`. You can use `.env.example` as a reference.

Configure the following environment variables:

```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=your_razorpay_test_key_id
RAZORPAY_KEY_SECRET=your_razorpay_test_key_secret
```

Replace the placeholder values with your own configuration.

- `PORT`: Port used by the backend server.
- `MONGO_URI`: MongoDB connection string.
- `JWT_SECRET`: Secret used for JWT authentication.
- `RAZORPAY_KEY_ID`: Razorpay Test Mode key ID.
- `RAZORPAY_KEY_SECRET`: Razorpay Test Mode key secret.

**Important:** The environment variable names must match those referenced in your backend code. Keep your actual `.env` file private and never commit it to GitHub.

### 3. Start the Backend

From the `shopkart-backend` directory, run:

```bash
npm run
```

Check the available scripts printed by npm. Start the server using the development or start script defined in `package.json`, for example:

```bash
npm run dev
```

If your project does not define a `dev` script, use the appropriate script listed in `package.json`.

### 4. Configure the Frontend

Open a second terminal and navigate to the frontend directory from the project root:

```bash
cd shopkart-frontend
npm install
```

Check `src/services/api.js` and confirm that the API base URL points to the address and port where your backend is running.

If necessary, update the development API URL to match your backend configuration.

### 5. Start the Frontend

From `shopkart-frontend`, run:

```bash
npm run dev
```

Open the local URL printed by Vite in your browser.

Keep both the frontend and backend terminals running while using the application.

## Payment Integration

ShopKart integrates Razorpay for payment processing.

The payment flow includes:

1. The customer proceeds to checkout.
2. The backend creates a Razorpay payment order.
3. The customer completes the payment using Razorpay Test Mode.
4. The backend verifies the payment signature.
5. The application processes the order after successful verification.
6. The application updates order and stock information according to the implemented checkout flow.

Use Razorpay Test Mode credentials and supported test payment details while developing. Do not use real payment credentials in public source code.

## Security Considerations

- Environment variables are used for sensitive configuration.
- `.env` files are excluded using `.gitignore`.
- JWT authentication protects relevant customer routes.
- Payment signatures are verified on the backend.
- Order access should be restricted to the authenticated customer who owns the order.
- Never expose the Razorpay Key Secret or JWT secret in frontend code.
