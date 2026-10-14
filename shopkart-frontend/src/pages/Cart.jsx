import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";

function Cart() {
  const navigate = useNavigate();
  const {
    cartItems,
    cartLoading,
    cartError,
    subtotal,
    totalUnits,
    refreshCart,
    updateQuantity,
    removeFromCart
  } = useCart();

  const [updatingId, setUpdatingId] = useState("");
  const [removingId, setRemovingId] = useState("");

  const changeQuantity = async (productId, quantity) => {
    setUpdatingId(productId);

    try {
      await updateQuantity(productId, quantity);
    } catch (requestError) {
      console.error(requestError);
      alert(
        requestError.response?.data?.message ||
        "Unable to update quantity. Please try again."
      );
    } finally {
      setUpdatingId("");
    }
  };

  const removeProduct = async (productId) => {
    setRemovingId(productId);

    try {
      await removeFromCart(productId);
    } catch (requestError) {
      console.error(requestError);
      alert(
        requestError.response?.data?.message ||
        "Unable to remove product from cart."
      );
    } finally {
      setRemovingId("");
    }
  };

  return (
    <>
      <Navbar />

      <main className="cart-page">
        <section className="cart-header">
          <p className="section-label">SHOPKART</p>
          <h1>My Cart</h1>
          {!cartLoading && !cartError && (
            <p>
              {totalUnits} {totalUnits === 1 ? "item" : "items"} in your cart
            </p>
          )}
        </section>

        {cartLoading && (
          <div className="products-state">
            <div className="loader"></div>
            <p>Loading your cart...</p>
          </div>
        )}

        {!cartLoading && cartError && (
          <div className="products-state error-state">
            <h2>Something went wrong.</h2>
            <p>{cartError}</p>
            <button className="wishlist-primary-btn" onClick={refreshCart}>
              Try Again
            </button>
          </div>
        )}

        {!cartLoading && !cartError && cartItems.length === 0 && (
          <div className="products-state cart-empty-state">
            <div className="wishlist-empty-icon">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added anything yet.</p>
            <button
              className="wishlist-primary-btn"
              onClick={() => navigate("/products")}
            >
              Browse Products
            </button>
          </div>
        )}

        {!cartLoading && !cartError && cartItems.length > 0 && (
          <section className="cart-layout">
            <div className="cart-items-list">
              {cartItems.map((item) => {
                const product = item.product;
                if (!product) return null;

                const quantity = Number(item.quantity);
                const stock = Number(product.stock);
                const lineTotal = Number(product.price) * quantity;
                const isUpdating = updatingId === product._id;
                const isRemoving = removingId === product._id;

                return (
                  <article className="cart-item" key={product._id}>
                    <div className="cart-item-image-wrapper">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="cart-item-image"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://placehold.co/600x400?text=ShopKart";
                        }}
                      />
                    </div>

                    <div className="cart-item-details">
                      <span className="product-category">{product.category}</span>
                      <h2>{product.name}</h2>
                      <p className="cart-item-price">
                        ₹{Number(product.price).toLocaleString("en-IN")}
                      </p>
                      <p className="cart-stock-note">
                        {stock} {stock === 1 ? "unit" : "units"} available
                      </p>

                      <div className="cart-item-actions">
                        <div className="quantity-control">
                          <button
                            type="button"
                            onClick={() => changeQuantity(product._id, quantity - 1)}
                            disabled={isUpdating || quantity <= 1}
                            aria-label={`Decrease ${product.name} quantity`}
                          >
                            −
                          </button>
                          <span>{quantity}</span>
                          <button
                            type="button"
                            onClick={() => changeQuantity(product._id, quantity + 1)}
                            disabled={isUpdating || quantity >= stock}
                            aria-label={`Increase ${product.name} quantity`}
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          className="cart-remove-btn"
                          onClick={() => removeProduct(product._id)}
                          disabled={isRemoving || isUpdating}
                        >
                          {isRemoving ? "Removing..." : "Remove"}
                        </button>
                      </div>
                    </div>

                    <strong className="cart-line-total">
                      ₹{lineTotal.toLocaleString("en-IN")}
                    </strong>
                  </article>
                );
              })}
            </div>

            <aside className="cart-summary">
              <p className="section-label">ORDER SUMMARY</p>
              <h2>Summary</h2>

              <div className="summary-row">
                <span>Items</span>
                <strong>{totalUnits}</strong>
              </div>
              <div className="summary-row summary-total">
                <span>Subtotal</span>
                <strong>₹{subtotal.toLocaleString("en-IN")}</strong>
              </div>

              <button className="checkout-btn" type="button" onClick={() => navigate("/checkout")}>
                Proceed to Checkout
              </button>
              <p className="checkout-note">Secure Test Mode payment with Razorpay.</p>
            </aside>
          </section>
        )}
      </main>
    </>
  );
}

export default Cart;
