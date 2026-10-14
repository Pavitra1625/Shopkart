import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/orders');
      setOrders(response.data.orders || []);
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.response?.data?.message || 'Unable to load your orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <>
      <Navbar />
      <main className="orders-page">
        <section className="orders-header">
          <p className="section-label">SHOPKART</p>
          <h1>My Orders</h1>
          <p>Your previous ShopKart purchases.</p>
        </section>

        {loading && (
          <div className="products-state"><div className="loader"></div><p>Loading your orders...</p></div>
        )}

        {!loading && error && (
          <div className="products-state error-state">
            <h2>Something went wrong.</h2>
            <p>{error}</p>
            <button className="wishlist-primary-btn" onClick={loadOrders}>Try Again</button>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="products-state cart-empty-state">
            <div className="wishlist-empty-icon">📦</div>
            <h2>No orders yet</h2>
            <p>You have not placed any orders yet.</p>
            <button className="wishlist-primary-btn" onClick={() => navigate('/products')}>Start Shopping</button>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <section className="orders-list">
            {orders.map((order) => (
              <article className="order-card" key={order._id}>
                <div className="order-card-top">
                  <div>
                    <span className="section-label">ORDER</span>
                    <h2>#{String(order._id).slice(-8)}</h2>
                    <p>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <span className="order-status">{order.status}</span>
                </div>

                <div className="order-items-preview">
                  {order.items.map((item) => (
                    <p key={`${order._id}-${item.product}`}>
                      {item.name} × {item.quantity}
                    </p>
                  ))}
                </div>

                <div className="order-card-bottom">
                  <strong>Total: ₹{Number(order.totalAmount).toLocaleString('en-IN')}</strong>
                  <button className="wishlist-primary-btn" onClick={() => navigate(`/orders/${order._id}`)}>
                    View Details
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </>
  );
}

export default Orders;
