import { useSelector, useDispatch } from "react-redux";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { clearCart, setCart, setCartError, setCartLoading } from "@/redux/slices/cartSlice";
import { addToCart as addToCartRequest, fetchCart } from "@/services/cartService";
import { useAuth } from "@/hooks/useAuth";
import { isMongoObjectId } from "@/utils/helpers";

export const useCart = () => {
  const dispatch = useDispatch();
  const { items, loading, error, hydrated } = useSelector((state) => state.cart);
  const { initialized, isAuthenticated, user } = useAuth();
  const lastSyncedUserIdRef = useRef(null);
  const mergedGuestItemsForUserRef = useRef(null);
  const refreshInFlightRef = useRef(null);
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const refreshCart = useCallback(async ({ mergeGuestItems = true } = {}) => {
    const userId = String(user?.id || user?._id || '');

    if (!initialized || !isAuthenticated || user?.role !== 'user' || !userId) {
      return null;
    }

    if (refreshInFlightRef.current) {
      return refreshInFlightRef.current;
    }

    dispatch(setCartLoading(true));

    const request = (async () => {
      try {
        if (mergeGuestItems && mergedGuestItemsForUserRef.current !== userId) {
          const guestItems = itemsRef.current.filter((item) => item.source === 'local' && isMongoObjectId(item.productId));
          for (const item of guestItems) {
            await addToCartRequest(item.productId, item.quantity);
          }
          mergedGuestItemsForUserRef.current = userId;
        }

        const response = await fetchCart();
        lastSyncedUserIdRef.current = userId;
        dispatch(setCart(response.items ?? []));
        return response;
      } catch (fetchError) {
        dispatch(setCartError(fetchError.message || 'Failed to load cart'));
        throw fetchError;
      } finally {
        refreshInFlightRef.current = null;
      }
    })();

    refreshInFlightRef.current = request;
    return request;
  }, [dispatch, initialized, isAuthenticated, user?.id, user?._id, user?.role]);

  useEffect(() => {
    if (!isAuthenticated) {
      lastSyncedUserIdRef.current = null;
      mergedGuestItemsForUserRef.current = null;
      refreshInFlightRef.current = null;
      dispatch(setCartLoading(false));
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    const userId = String(user?.id || user?._id || '');

    if (!initialized || !isAuthenticated || user?.role !== 'user' || !userId) {
      return;
    }
    if (lastSyncedUserIdRef.current === userId && hydrated) {
      return;
    }

    let active = true;

    const loadCart = async () => {
      try {
        const response = await refreshCart({ mergeGuestItems: true });
        if (!active) {
          return;
        }

        if (!response) {
          dispatch(setCart([]));
        }
      } catch (fetchError) {
        if (!active) {
          return;
        }
      }
    };

    loadCart();

    return () => {
      active = false;
    };
  }, [dispatch, hydrated, initialized, isAuthenticated, refreshCart, user?.id, user?._id, user?.role]);

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
    refreshCart,
    clearCartItems: () => dispatch(clearCart()),
  };
};
