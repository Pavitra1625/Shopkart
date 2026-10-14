import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useCart } from "../context/CartContext";

function Navbar() {
  const navigate = useNavigate();
  const { totalUnits, clearCart } = useCart();

  const logout = async () => {
    try {
      await api.post("/customers/logout");
    } catch (error) {
      console.log(error);
    }

    clearCart();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <h2>ShopKart</h2>

      <div className="navbar-actions">
        <button onClick={() => navigate("/products")}>
          Products
        </button>
        <button onClick={() => navigate("/wishlist")}>
          Wishlist
        </button>
        <button onClick={() => navigate("/cart")}>
          Cart ({totalUnits})
        </button>
        <button onClick={() => navigate("/orders")}>
          My Orders
        </button>
        <button onClick={logout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;