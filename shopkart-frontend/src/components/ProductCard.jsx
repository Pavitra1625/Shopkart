import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useCart } from "../context/CartContext";

function ProductCard({ product }) {
  const navigate = useNavigate();
  const inStock = Number(product.stock) > 0;
  const { addToCart } = useCart();
  const [wishlistStatus, setWishlistStatus] = useState("checking");
  const [wishlistMessage, setWishlistMessage] = useState("");
  const [cartStatus, setCartStatus] = useState("idle");
  const [cartMessage, setCartMessage] = useState("");

  const addProductToCart = async () => {
    if (cartStatus === "saving") return;

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

  // Load the real wishlist state from the backend when the card appears.
  // This makes the toggle work correctly after refresh/navigation too.
  useEffect(() => {
    let isMounted = true;

    const loadWishlistStatus = async () => {
      try {
        const response = await api.get("/wishlist");
        const wishlist = response.data.wishlist || [];
        const alreadyWishlisted = wishlist.some(
          (item) => (item?._id || item)?.toString() === product._id.toString()
        );

        if (isMounted) {
          setWishlistStatus(alreadyWishlisted ? "added" : "idle");
        }
      } catch (requestError) {
        // A logged-out user can still see products. The API will reject the
        // actual wishlist action until they log in.
        console.error("Unable to load wishlist status:", requestError);
        if (isMounted) {
          setWishlistStatus("idle");
        }
      }
    };

    loadWishlistStatus();

    return () => {
      isMounted = false;
    };
  }, [product._id]);

  const toggleWishlist = async () => {
    if (wishlistStatus === "saving" || wishlistStatus === "checking") return;

    const isWishlisted = wishlistStatus === "added";
    setWishlistStatus("saving");
    setWishlistMessage("");

    try {
      if (isWishlisted) {
        await api.delete(`/wishlist/${product._id}`);
        setWishlistStatus("idle");
      } else {
        await api.post(`/wishlist/${product._id}`);
        setWishlistStatus("added");
      }
    } catch (requestError) {
      console.error(requestError);
      setWishlistStatus(isWishlisted ? "added" : "idle");
      setWishlistMessage(
        requestError.response?.data?.message ||
        `Unable to ${isWishlisted ? "remove product from" : "add product to"} wishlist. Please try again.`
      );
    }
  };

  return (
    <article className="product-card">
      <div className="product-image-wrapper">
        <img
          src={product.image}
          alt={product.name}
          className="product-image"
          onError={(e) => {
            e.currentTarget.src = "https://placehold.co/600x400?text=ShopKart";
          }}
        />
        <span className={`stock-badge ${inStock ? "stock-badge-in" : "stock-badge-out"}`}>
          {inStock ? "In Stock" : "Out of Stock"}
        </span>
      </div>

      <div className="product-card-content">
        <span className="product-category">{product.category}</span>
        <h3 className="product-card-title">{product.name}</h3>
        <p className="product-card-description">
          {product.description || "Quality product available at ShopKart."}
        </p>

        <div className="product-card-bottom">
          <div>
            <p className="product-price">₹{Number(product.price).toLocaleString("en-IN")}</p>
            <p className={inStock ? "product-stock in-stock" : "product-stock out-stock"}>
              {inStock ? `${product.stock} units left` : "Currently unavailable"}
            </p>
          </div>
        </div>

        <button
          className="view-details-btn"
          onClick={() => navigate(`/products/${product._id}`)}
        >
          View Details <span>→</span>
        </button>

        <button
          className={`cart-add-btn ${cartStatus === "added" ? "cart-added" : ""}`}
          onClick={addProductToCart}
          disabled={!inStock || cartStatus === "saving"}
        >
          {cartStatus === "saving" && "⏳ Adding..."}
          {cartStatus === "added" && "🛒 Add Another"}
          {cartStatus === "error" && "🛒 Try Again"}
          {cartStatus === "idle" && (inStock ? "🛒 Add to Cart" : "Out of Stock")}
        </button>

        {cartMessage && cartStatus === "error" && (
          <p className="cart-error-message">{cartMessage}</p>
        )}

        <button
          className={`wishlist-add-btn ${wishlistStatus === "added" ? "wishlist-added" : ""}`}
          onClick={toggleWishlist}
          disabled={wishlistStatus === "saving" || wishlistStatus === "checking"}
          aria-pressed={wishlistStatus === "added"}
        >
          {wishlistStatus === "checking" && "⏳ Checking..."}
          {wishlistStatus === "saving" && "⏳ Saving..."}
          {wishlistStatus === "added" && "♥ Wishlisted (click to remove)"}
          {wishlistStatus === "idle" && "♡ Add to Wishlist"}
        </button>

        {wishlistMessage && (
          <p className="wishlist-error-message">{wishlistMessage}</p>
        )}
      </div>
    </article>
  );
}

export default ProductCard;
