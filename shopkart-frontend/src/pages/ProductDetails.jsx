import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { useCart } from "../context/CartContext";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartStatus, setCartStatus] = useState("idle");
  const [cartMessage, setCartMessage] = useState("");
  const { addToCart } = useCart();

  useEffect(() => {
    const getProduct = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(`/products/${id}`);
        setProduct(response.data.product);
      } catch (requestError) {
        console.error(requestError);
        setProduct(null);
        setError(
          requestError.response?.data?.message ||
          "Something went wrong while loading the product."
        );
      } finally {
        setLoading(false);
      }
    };

    getProduct();
  }, [id]);

  const addProductToCart = async () => {
    if (!product || product.stock <= 0 || cartStatus === "saving") return;

    setCartStatus("saving");
    setCartMessage("");

    try {
      await addToCart(product._id);
      setCartStatus("added");
      setCartMessage("Added to Cart");
    } catch (requestError) {
      console.error(requestError);
      setCartStatus("error");
      setCartMessage(
        requestError.response?.data?.message ||
        "Unable to add product to cart. Please try again."
      );
    }
  };

  return (
    <>
      <Navbar />

      <main className="product-details-page">
        {loading && (
          <div className="products-state">
            <div className="loader"></div>
            <p>Loading product...</p>
          </div>
        )}

        {!loading && error && (
          <div className="products-state error-state">
            <p>{error}</p>
            <button className="back-products-btn" onClick={() => navigate("/products")}>
              Back to Products
            </button>
          </div>
        )}

        {!loading && !error && product && (
          <section className="product-details-card">
            <button className="back-products-btn" onClick={() => navigate("/products")}>
              ← Back to Products
            </button>

            <div className="product-details-layout">
              <div className="product-details-image-wrapper">
                <img
                  src={product.image}
                  alt={product.name}
                  className="product-details-image"
                  onError={(e) => {
                    e.currentTarget.src = "https://placehold.co/800x600?text=ShopKart";
                  }}
                />
              </div>

              <div className="product-details-info">
                <span className="product-category">{product.category}</span>
                <h1>{product.name}</h1>
                <p className="details-price">₹{Number(product.price).toLocaleString("en-IN")}</p>
                <p className="details-description">{product.description}</p>

                <div className="details-stock">
                  <span>Stock</span>
                  <strong className={product.stock > 0 ? "in-stock" : "out-stock"}>
                    {product.stock > 0 ? `${product.stock} units available` : "Out of stock"}
                  </strong>
                </div>

                <button
                  className="add-cart-btn"
                  type="button"
                  onClick={addProductToCart}
                  disabled={product.stock <= 0 || cartStatus === "saving"}
                >
                  {cartStatus === "saving" && "⏳ Adding..."}
                  {cartStatus === "added" && "🛒 Add Another"}
                  {cartStatus === "error" && "🛒 Try Again"}
                  {cartStatus === "idle" && (product.stock > 0 ? "Add to Cart" : "Out of Stock")}
                </button>
                {cartMessage && (
                  <p className={cartStatus === "error" ? "cart-error-message" : "cart-note"}>
                    {cartMessage}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}

export default ProductDetails;
