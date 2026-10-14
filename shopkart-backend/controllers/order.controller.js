const mongoose = require('mongoose');
const crypto = require('crypto');

const Customer = require('../models/customer.model');
const Product = require('../models/product.model');
const Order = require('../models/order.model');
const razorpay = require('../config/razorpay');

const validateShippingAddress = (shippingAddress) => {
  const requiredFields = [
    'fullName',
    'phone',
    'addressLine1',
    'city',
    'state',
    'pincode'
  ];

  if (!shippingAddress || typeof shippingAddress !== 'object') {
    return 'Shipping address is required';
  }

  for (const field of requiredFields) {
    if (
      typeof shippingAddress[field] !== 'string' ||
      !shippingAddress[field].trim()
    ) {
      return `${field} is required`;
    }
  }

  if (!/^\d{10}$/.test(shippingAddress.phone.trim())) {
    return 'Phone must contain 10 digits';
  }

  if (!/^\d{6}$/.test(shippingAddress.pincode.trim())) {
    return 'Pincode must contain 6 digits';
  }

  return null;
};


// =====================================================
// CREATE RAZORPAY PAYMENT ORDER
// =====================================================

const createPaymentOrder = async (req, res) => {
  try {
    const { shippingAddress } = req.body;

    const shippingError = validateShippingAddress(shippingAddress);

    if (shippingError) {
      return res.status(400).json({
        success: false,
        message: shippingError
      });
    }

    const customer = await Customer.findById(req.user._id).populate({
      path: 'cart.product',
      select: 'name price image stock'
    });

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Check cart
    if (!customer.cart || customer.cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty'
      });
    }

    const orderItems = [];
    let totalAmount = 0;

    // =================================================
    // FINAL STOCK + PRICE VALIDATION
    // =================================================

    for (const cartItem of customer.cart) {
      const product = cartItem.product;

      if (!product) {
        return res.status(400).json({
          success: false,
          message: 'A product in your cart is no longer available'
        });
      }

      // Final stock check
      if (cartItem.quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Only ${product.stock} available.`
        });
      }

      // Create order snapshot
      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: cartItem.quantity,
        image: product.image
      });

      // Calculate total using latest product price
      totalAmount += product.price * cartItem.quantity;
    }

    totalAmount = Number(totalAmount.toFixed(2));

    // =================================================
    // CREATE SHOPKART ORDER
    // =================================================

    const order = await Order.create({
      user: customer._id,

      items: orderItems,

      shippingAddress: {
        fullName: shippingAddress.fullName.trim(),
        phone: shippingAddress.phone.trim(),
        addressLine1: shippingAddress.addressLine1.trim(),
        city: shippingAddress.city.trim(),
        state: shippingAddress.state.trim(),
        pincode: shippingAddress.pincode.trim()
      },

      totalAmount,

      paymentStatus: 'PENDING',

      status: 'PENDING_PAYMENT'
    });

    try {
      // =================================================
      // CREATE RAZORPAY ORDER
      // =================================================

      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100),
        currency: 'INR',
        receipt: order._id.toString()
      });

      // Save Razorpay order ID
      order.razorpayOrderId = razorpayOrder.id;

      await order.save();

      return res.status(201).json({
        success: true,

        shopKartOrderId: order._id,

        razorpayOrderId: razorpayOrder.id,

        amount: razorpayOrder.amount,

        currency: razorpayOrder.currency,

        key: process.env.RAZORPAY_KEY_ID
      });

    } catch (razorpayError) {

      // If Razorpay order creation fails,
      // remove the pending ShopKart order.
      await Order.findByIdAndDelete(order._id);

      throw razorpayError;
    }

  } catch (error) {

    console.error('Create payment order error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to create payment order'
    });
  }
};


// =====================================================
// VERIFY PAYMENT
// =====================================================

const verifyPayment = async (req, res) => {
  try {

    const {
      shopKartOrderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;


    // =================================================
    // VALIDATE SHOPKART ORDER ID
    // =================================================

    if (!mongoose.Types.ObjectId.isValid(shopKartOrderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ShopKart order ID'
      });
    }


    // =================================================
    // FIND USER'S ORDER
    // =================================================

    const order = await Order.findOne({
      _id: shopKartOrderId,
      user: req.user._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }


    // =================================================
    // CHECK RAZORPAY ORDER ID
    // =================================================

    if (
      !order.razorpayOrderId ||
      order.razorpayOrderId !== razorpay_order_id
    ) {
      return res.status(400).json({
        success: false,
        message: 'Razorpay order does not match'
      });
    }


    // =================================================
    // CHECK PAYMENT DATA
    // =================================================

    if (!razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification data is incomplete'
      });
    }


    // =================================================
    // VERIFY RAZORPAY SIGNATURE
    // =================================================

    const body =
      `${order.razorpayOrderId}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac(
        'sha256',
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(body)
      .digest('hex');


    const expectedBuffer = Buffer.from(expectedSignature);
    const receivedBuffer = Buffer.from(razorpay_signature);

    const signaturesMatch =
      expectedBuffer.length === receivedBuffer.length &&
      crypto.timingSafeEqual(
        expectedBuffer,
        receivedBuffer
      );


    // Invalid signature
    if (!signaturesMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }


    // =================================================
    // ONLY PROCESS ONCE
    // =================================================

    if (order.paymentStatus !== 'PAID') {

      // =================================================
      // REDUCE PRODUCT STOCK
      // =================================================

      for (const item of order.items) {

        const product = await Product.findOneAndUpdate(
          {
            _id: item.product,

            // Make sure enough stock still exists
            stock: { $gte: item.quantity }
          },
          {
            $inc: {
              stock: -item.quantity
            }
          },
          {
            new: true
          }
        );

        // If product doesn't exist or stock became
        // insufficient, don't complete the order.
        if (!product) {

          return res.status(400).json({
            success: false,
            message:
              `Insufficient stock for ${item.name}. Please try again.`
          });
        }
      }


      // =================================================
      // MARK ORDER AS PAID
      // =================================================

      order.paymentStatus = 'PAID';

      order.status = 'PLACED';

      order.razorpayPaymentId =
        razorpay_payment_id;

      await order.save();


      // =================================================
      // CLEAR CART
      // =================================================

      await Customer.findByIdAndUpdate(
        req.user._id,
        {
          $set: {
            cart: []
          }
        }
      );
    }


    // =================================================
    // GET UPDATED ORDER
    // =================================================

    const confirmedOrder =
      await Order.findById(order._id);


    return res.json({

      success: true,

      message:
        'Payment verified and order placed successfully',

      order: confirmedOrder
    });


  } catch (error) {

    console.error(
      'Verify payment error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to verify payment'
    });
  }
};


// =====================================================
// GET ALL ORDERS
// =====================================================

const getOrders = async (req, res) => {

  try {

    const orders =
      await Order.find({
        user: req.user._id
      })
      .sort({
        createdAt: -1
      });


    return res.json({

      success: true,

      orders
    });


  } catch (error) {

    console.error(
      'Get orders error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to load orders'
    });
  }
};


// =====================================================
// GET SINGLE ORDER
// =====================================================

const getOrderById = async (req, res) => {

  try {

    const { id } = req.params;


    if (!mongoose.Types.ObjectId.isValid(id)) {

      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }


    const order =
      await Order.findOne({
        _id: id,
        user: req.user._id
      });


    if (!order) {

      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }


    return res.json({

      success: true,

      order
    });


  } catch (error) {

    console.error(
      'Get order error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to load order'
    });
  }
};


module.exports = {

  createPaymentOrder,

  verifyPayment,

  getOrders,

  getOrderById

};