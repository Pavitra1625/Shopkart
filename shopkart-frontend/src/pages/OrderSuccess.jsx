import { useNavigate, useLocation, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';

function OrderSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const order = location.state?.order;

  return (
    <>
      <Navbar />
      <main className="order-success-page">
        <section className="order-success-card">
          <div className="success-icon">✓</div>
          <p className="section-label">SHOPKART</p>
          <h1>Order Placed Successfully</h1>
          <p>Your payment was verified and your order has been saved.</p>

          <div className="success-order-info">
            <div><span>Order ID</span><strong>{id}</strong></div>
            <div><span>Total</span><strong>{order ? `₹${Number(order.totalAmount).toLocaleString('en-IN')}` : 'Paid'}</strong></div>
            <div><span>Status</span><strong>{order?.status || 'PLACED'}</strong></div>
          </div>

          <div className="order-success-actions">
            <button className="wishlist-primary-btn" onClick={() => navigate('/orders')}>View My Orders</button>
            <button className="checkout-submit-btn" onClick={() => navigate('/products')}>Continue Shopping</button>
          </div>
        </section>
      </main>
    </>
  );
}

export default OrderSuccess;
