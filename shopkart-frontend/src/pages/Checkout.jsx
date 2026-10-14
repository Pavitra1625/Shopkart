import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useCart } from '../context/CartContext';
import api from '../services/api';

const initialForm = {
  fullName: '',
  phone: '',
  addressLine1: '',
  city: '',
  state: '',
  pincode: ''
};

function Checkout() {
  const navigate = useNavigate();
  const { cartItems, cartLoading, cartError, subtotal, totalUnits, clearCart } = useCart();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setSubmitError('');
  };

  const validate = () => {
    const nextErrors = {};

    Object.entries(form).forEach(([field, value]) => {
      if (!value.trim()) nextErrors[field] = 'This field is required.';
    });

    if (form.phone.trim() && !/^\d{10}$/.test(form.phone.trim())) {
      nextErrors.phone = 'Phone must contain 10 digits.';
    }

    if (form.pincode.trim() && !/^\d{6}$/.test(form.pincode.trim())) {
      nextErrors.pincode = 'Pincode must contain 6 digits.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const loadRazorpayScript = () => new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  const verifyPayment = async (paymentResponse, shopKartOrderId) => {
    try {
      const response = await api.post('/orders/verify-payment', {
        shopKartOrderId,
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature
      });

      clearCart();
      navigate(`/order-success/${response.data.order._id}`, {
        state: { order: response.data.order }
      });
    } catch (error) {
      setSubmitError(
        error.response?.data?.message ||
        'Payment verification failed. Your cart has not been cleared.'
      );
      setPlacingOrder(false);
    }
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    setSubmitError('');

    if (!validate()) return;

    setPlacingOrder(true);

    try {
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        throw new Error('Unable to load Razorpay Checkout. Please try again.');
      }

      const response = await api.post('/orders/create-payment-order', {
        shippingAddress: form
      });

      const data = response.data;

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: 'ShopKart',
        description: 'ShopKart Order',
        order_id: data.razorpayOrderId,
        handler: (paymentResponse) => {
          verifyPayment(paymentResponse, data.shopKartOrderId);
        },
        prefill: {
          name: form.fullName,
          contact: form.phone
        },
        theme: {}
      };

      const paymentObject = new window.Razorpay(options);

      paymentObject.on('payment.failed', () => {
        setSubmitError('Payment failed. Your cart has not been cleared. Please try again.');
        setPlacingOrder(false);
      });

      paymentObject.open();
    } catch (error) {
      console.error(error);
      setSubmitError(
        error.response?.data?.message ||
        error.message ||
        'Unable to start checkout. Please try again.'
      );
      setPlacingOrder(false);
    }
  };

  if (cartLoading) {
    return (
      <>
        <Navbar />
        <div className="products-state"><div className="loader"></div><p>Loading checkout...</p></div>
      </>
    );
  }

  if (cartError) {
    return (
      <>
        <Navbar />
        <div className="products-state error-state">
          <h2>Unable to load checkout.</h2>
          <p>{cartError}</p>
          <button className="wishlist-primary-btn" onClick={() => navigate('/cart')}>Back to Cart</button>
        </div>
      </>
    );
  }

  if (cartItems.length === 0) {
    return (
      <>
        <Navbar />
        <div className="products-state cart-empty-state">
          <div className="wishlist-empty-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Add products before proceeding to checkout.</p>
          <button className="wishlist-primary-btn" onClick={() => navigate('/products')}>Browse Products</button>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="checkout-page">
        <section className="checkout-header">
          <p className="section-label">SHOPKART</p>
          <h1>Checkout</h1>
          <p>Enter your shipping details and review your order.</p>
        </section>

        <form className="checkout-layout" onSubmit={placeOrder}>
          <section className="checkout-form-card">
            <p className="section-label">SHIPPING DETAILS</p>
            <h2>Delivery Address</h2>

            {[
              ['fullName', 'Full Name', 'text'],
              ['phone', 'Phone Number', 'tel'],
              ['addressLine1', 'Address Line', 'text'],
              ['city', 'City', 'text'],
              ['state', 'State', 'text'],
              ['pincode', 'Pincode', 'text']
            ].map(([name, label, type]) => (
              <label className="checkout-field" key={name}>
                <span>{label}</span>
                <input
                  type={type}
                  name={name}
                  value={form[name]}
                  onChange={updateField}
                  placeholder={`Enter ${label.toLowerCase()}`}
                  maxLength={name === 'phone' ? 10 : name === 'pincode' ? 6 : undefined}
                />
                {errors[name] && <small>{errors[name]}</small>}
              </label>
            ))}

            {submitError && <div className="checkout-error">{submitError}</div>}

            <button className="checkout-submit-btn" type="submit" disabled={placingOrder}>
              {placingOrder ? 'Opening Payment...' : 'Place Order & Pay'}
            </button>
          </section>

          <aside className="cart-summary checkout-summary-card">
            <p className="section-label">ORDER SUMMARY</p>
            <h2>Review Order</h2>

            {cartItems.map((item) => (
              <div className="checkout-summary-item" key={item.product._id}>
                <span>{item.product.name} × {item.quantity}</span>
                <strong>
                  ₹{(Number(item.product.price) * Number(item.quantity)).toLocaleString('en-IN')}
                </strong>
              </div>
            ))}

            <div className="summary-row">
              <span>Items</span>
              <strong>{totalUnits}</strong>
            </div>
            <div className="summary-row summary-total">
              <span>Total</span>
              <strong>₹{subtotal.toLocaleString('en-IN')}</strong>
            </div>
            <p className="checkout-note">Final price and stock are verified by the server.</p>
          </aside>
        </form>
      </main>
    </>
  );
}

export default Checkout;
