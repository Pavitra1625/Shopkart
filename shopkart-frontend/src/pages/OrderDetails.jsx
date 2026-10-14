import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!order);
  const [error, setError] = useState('');

  useEffect(() => {
    if (order) return;

    const loadOrder = async () => {
      try {
        const response = await api.get(`/orders/${id}`);
        setOrder(response.data.order);
      } catch (requestError) {
        console.error(requestError);
        setError(requestError.response?.data?.message || 'Unable to load this order.');
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id, order]);

  return (
    <>
      <Navbar />
      <main className="order-details-page">
        {loading && <div className="products-state"><div className="loader"></div><p>Loading order...</p></div>}

        {!loading && error && (
          <div className="products-state error-state">
            <h2>Order not found</h2>
            <p>{error}</p>
            <button className="wishlist-primary-btn" onClick={() => navigate('/orders')}>Back to Orders</button>
          </div>
        )}

        {!loading && !error && order && (
          <section className="order-details-card">
            <p className="section-label">SHOPKART ORDER</p>
            <h1>Order #{String(order._id).slice(-8)}</h1>
            <div className="order-detail-status">
              <span>Payment: {order.paymentStatus}</span>
              <span>Status: {order.status}</span>
            </div>

            <div className="order-detail-section">
              <h2>Items</h2>
              {order.items.map((item) => (
                <div className="order-detail-item" key={`${item.product}-${item.quantity}`}>
                  <div>
                    <strong>{item.name}</strong>
                    <p>₹{Number(item.price).toLocaleString('en-IN')} × {item.quantity}</p>
                  </div>
                  <strong>₹{(Number(item.price) * Number(item.quantity)).toLocaleString('en-IN')}</strong>
                </div>
              ))}
            </div>

            <div className="order-detail-section">
              <h2>Shipping Address</h2>
              <p>{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.phone}</p>
              <p>{order.shippingAddress.addressLine1}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
            </div>

            <div className="order-detail-total">
              <span>Total</span>
              <strong>₹{Number(order.totalAmount).toLocaleString('en-IN')}</strong>
            </div>

            <div className="order-detail-actions">
              <button className="wishlist-primary-btn" onClick={() => navigate('/orders')}>My Orders</button>
              <button className="checkout-submit-btn" onClick={() => navigate('/products')}>Continue Shopping</button>
            </div>
          </section>
        )}
      </main>
    </>
  );
}

export default OrderDetails;
