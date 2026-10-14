import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../services/api";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const location = useLocation();
  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState("");

  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  const refreshCart = useCallback(async () => {
    setCartLoading(true);
    setCartError("");

    try {
      const response = await api.get("/cart");
      setCartItems(response.data.cart || []);
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        setCartItems([]);
        setCartError("");
      } else {
        console.error(requestError);
        setCartError(
          requestError.response?.data?.message ||
          "Unable to load your cart."
        );
      }
    } finally {
      setCartLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthPage) {
      setCartItems([]);
      setCartError("");
      return;
    }

    refreshCart();
  }, [isAuthPage, refreshCart]);

  const addToCart = useCallback(async (productId) => {
    const response = await api.post(`/cart/${productId}`);
    setCartItems(response.data.cart || []);
    return response.data;
  }, []);

  const updateQuantity = useCallback(async (productId, quantity) => {
    const response = await api.patch(`/cart/${productId}`, { quantity });
    setCartItems(response.data.cart || []);
    return response.data;
  }, []);

  const removeFromCart = useCallback(async (productId) => {
    const response = await api.delete(`/cart/${productId}`);
    setCartItems(response.data.cart || []);
    return response.data;
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setCartError("");
  }, []);

  const totalUnits = useMemo(
    () => cartItems.reduce((total, item) => total + Number(item.quantity || 0), 0),
    [cartItems]
  );

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (total, item) =>
          total + Number(item.product?.price || 0) * Number(item.quantity || 0),
        0
      ),
    [cartItems]
  );

  const value = useMemo(
    () => ({
      cartItems,
      cartLoading,
      cartError,
      totalUnits,
      subtotal,
      refreshCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart
    }),
    [
      cartItems,
      cartLoading,
      cartError,
      totalUnits,
      subtotal,
      refreshCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
