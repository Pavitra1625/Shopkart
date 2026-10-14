const express = require('express');

const {
  createPaymentOrder,
  verifyPayment,
  getOrders,
  getOrderById
} = require('../controllers/order.controller');

const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/create-payment-order', authMiddleware, createPaymentOrder);
router.post('/verify-payment', authMiddleware, verifyPayment);
router.get('/', authMiddleware, getOrders);
router.get('/:id', authMiddleware, getOrderById);

module.exports = router;
