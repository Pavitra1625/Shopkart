import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";

function Wishlist() {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState("");

  const loadWishlist = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/wishlist");
      setWishlist(response.data.wishlist || []);
    } catch (requestError) {
      console.error(requestError);
      setWishlist([]);
      setError(
        requestError.response?.data?.message ||
        "We couldn't load your wishlist."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const removeProduct = async (productId) => {
    setRemovingId(productId);

    try {
      await api.delete(`/wishlist/${productId}`);
      setWishlist((current) =>
        current.filter((product) => product._id !== productId)
      );
    } catch (requestError) {
      console.error(requestError);
      alert(
        requestError.response?.data?.message ||
        "Unable to remove product from wishlist."
      );
    } finally {
      setRemovingId("");
    }
  };

  return (
    <>
      <Navbar />

      <main className="wishlist-page">
        <section className="wishlist-header">
          <p className="section-label">SHOPKART</p>
          <h1>My Wishlist</h1>
          {!loading && !error && (
            <p>
              {wishlist.length} {wishlist.length === 1 ? "product" : "products"} saved
            </p>
          )}
        </section>

        {loading && (
          <div className="products-state">
            <div className="loader"></div>
            <p>Loading your wishlist...</p>
          </div>
        )}

        {!loading && error && (
          <div className="products-state error-state">
            <h2>Something went wrong.</h2>
            <p>{error}</p>
            <button className="wishlist-primary-btn" onClick={loadWishlist}>
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && wishlist.length === 0 && (
          <div className="products-state wishlist-empty-state">
            <div className="wishlist-empty-icon">❤️</div>
            <h2>Your wishlist is empty</h2>
            <p>Save products you love and find them here later.</p>
            <button
              className="wishlist-primary-btn"
              onClick={() => navigate("/products")}
            >
              Browse Products
            </button>
          </div>
        )}

        {!loading && !error && wishlist.length > 0 && (
          <section className="wishlist-grid">
            {wishlist.map((product) => {
              const inStock = Number(product.stock) > 0;

              return (
                <article className="wishlist-card" key={product._id}>
                  <div className="wishlist-image-wrapper">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="wishlist-image"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://placehold.co/600x400?text=ShopKart";
                      }}
                    />
                    <span
                      className={`stock-badge ${
                        inStock ? "stock-badge-in" : "stock-badge-out"
                      }`}
                    >
                      {inStock ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>

                  <div className="wishlist-card-content">
                    <span className="product-category">{product.category}</span>
                    <h3>{product.name}</h3>
                    <p className="product-price">
                      ₹{Number(product.price).toLocaleString("en-IN")}
                    </p>
                    <p className={inStock ? "product-stock in-stock" : "product-stock out-stock"}>
                      {inStock ? `${product.stock} units left` : "Currently unavailable"}
                    </p>

                    <div className="wishlist-actions">
                      <button
                        className="view-details-btn"
                        onClick={() => navigate(`/products/${product._id}`)}
                      >
                        View Details <span>→</span>
                      </button>
                      <button
                        className="wishlist-remove-btn"
                        onClick={() => removeProduct(product._id)}
                        disabled={removingId === product._id}
                      >
                        {removingId === product._id ? "Removing..." : "Remove ♥"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </>
  );
}

export default Wishlist;
