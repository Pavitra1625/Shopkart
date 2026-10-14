const mongoose = require('mongoose');
const Customer = require('../models/customer.model');
const Product = require('../models/product.model');

const getCustomerWithCart = async (userId) => {
  return Customer.findById(userId).populate({
    path: 'cart.product',
    select: 'name description price category image stock createdAt'
  });
};

const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const customer = await Customer.findById(req.user._id);

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const existingItem = customer.cart.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      if (existingItem.quantity + 1 > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} unit${product.stock === 1 ? '' : 's'} available`
        });
      }

      existingItem.quantity += 1;
    } else {
      if (product.stock < 1) {
        return res.status(400).json({
          success: false,
          message: 'Product is out of stock'
        });
      }

      customer.cart.push({
        product: product._id,
        quantity: 1
      });
    }

    await customer.save();

    const updatedCustomer = await getCustomerWithCart(customer._id);

    return res.json({
      success: true,
      message: 'Cart updated',
      cart: updatedCustomer.cart
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

const getCart = async (req, res) => {
  try {
    const customer = await getCustomerWithCart(req.user._id);

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Customer not found'
      });
    }

    return res.json({
      success: true,
      cart: customer.cart || []
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

const updateCartQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    if (typeof quantity !== 'number' || !Number.isInteger(quantity)) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a number'
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} unit${product.stock === 1 ? '' : 's'} available`
      });
    }

    const customer = await Customer.findById(req.user._id);

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const cartItem = customer.cart.find(
      (item) => item.product.toString() === productId
    );

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Product not in cart'
      });
    }

    cartItem.quantity = quantity;
    await customer.save();

    const updatedCustomer = await getCustomerWithCart(customer._id);

    return res.json({
      success: true,
      message: 'Cart quantity updated',
      cart: updatedCustomer.cart
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    const customer = await Customer.findById(req.user._id);

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const originalLength = customer.cart.length;

    customer.cart = customer.cart.filter(
      (item) => item.product.toString() !== productId
    );

    if (customer.cart.length === originalLength) {
      return res.status(404).json({
        success: false,
        message: 'Product not in cart'
      });
    }

    await customer.save();

    const updatedCustomer = await getCustomerWithCart(customer._id);

    return res.json({
      success: true,
      message: 'Product removed from cart',
      cart: updatedCustomer.cart
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart
};
