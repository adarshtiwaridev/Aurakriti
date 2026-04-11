import { useSelector, useDispatch } from "react-redux";
import { useEffect, useMemo } from "react";
import { clearCart, setCart, setCartError, setCartLoading } from "@/redux/slices/cartSlice";
import { fetchCart } from "@/services/cartService";
import { useAuth } from "@/hooks/useAuth";

export const useCart = () => {
  const dispatch = useDispatch();
  const { items, loading, error, hydrated } = useSelector((state) => state.cart);
  const { initialized, isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!initialized || !isAuthenticated || user?.role !== 'user' || hydrated) {
      return;
    }

    let active = true;

    const loadCart = async () => {
      dispatch(setCartLoading(true));

      try {
        const response = await fetchCart();
        if (!active) {
          return;
        }

        dispatch(setCart(response.items ?? []));
      } catch (fetchError) {
        if (!active) {
          return;
        }

        dispatch(setCartError(fetchError.message || 'Failed to load cart'));
      }
    };

    loadCart();

    return () => {
      active = false;
    };
  }, [dispatch, hydrated, initialized, isAuthenticated, user?.role]);

  // Calculate totals using useMemo for performance
  const cartTotals = useMemo(() => {
    const totalPrice = items.reduce((total, item) => total + (item?.price || 0) * (item?.quantity || 0), 0);
    const itemCount = items.reduce((count, item) => count + (item?.quantity || 0), 0);
    const uniqueItems = items.length;

    return {
      totalPrice,
      itemCount,
      uniqueItems,
      shippingCost: totalPrice > 1000 ? 0 : totalPrice > 0 ? 50 : 0,
      finalTotal: totalPrice + (totalPrice > 1000 ? 0 : totalPrice > 0 ? 50 : 0),
    };
  }, [items]);

  return {
    cartItems: items,
    items,
    cartCount: cartTotals.itemCount,
    totalPrice: cartTotals.totalPrice,
    shippingCost: cartTotals.shippingCost,
    finalTotal: cartTotals.finalTotal,
    uniqueItems: cartTotals.uniqueItems,
    isEmpty: items.length === 0,
    loading,
    error,
    hydrated,
    clearCartItems: () => dispatch(clearCart()),
  };
};
