// {
//   "productId": "PRODUCT_ID_FROM_MONGODB",
//   "quantity": 1
// }

export async function addToCart(productId, quantity = 1) {
  const res = await fetch('/api/cart/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productId, quantity }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to add to cart');
  }
  return res.json();
}

// addToCart(123,2);

// import axios from 'axios';
// async function addToCart(productId, quantity = 1) {
//   const response = await axios.post('/api/cart/add', { productId, quantity });
//   return response.data;
// }



// const handleAddToCart = async () => {
//   try {
//     const result = await addToCart(product._id, 1);
//     console.log('Added to cart', result);
//   } catch (err) {
//     console.error(err.message);
//   }
// };