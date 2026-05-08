'use client';

import { useSelector, useDispatch } from 'react-redux';
import { removeFromWishlist } from '@/redux/slices/wishlistSlice';

export default function WishlistPage() {
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const dispatch = useDispatch();

  return (
    <div style={{ padding: '20px' }}>
      <h1>My Wishlist ❤️</h1>

      {wishlistItems.length === 0 ? (
        <p>No items in wishlist</p>
      ) : (
        wishlistItems.map((item) => (
          <div key={item.id} style={{ marginBottom: '10px' }}>
            <p>{item.name}</p>
            <button onClick={() => dispatch(removeFromWishlist(item.id))}>
              Remove
            </button>
          </div>
        ))
      )}
    </div>
  );
}