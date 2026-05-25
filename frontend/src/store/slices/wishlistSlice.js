import { createSlice } from '@reduxjs/toolkit'

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: {
    items: JSON.parse(localStorage.getItem('svdke_wishlist') || '[]'),
  },
  reducers: {
    toggleWishlist: (state, action) => {
      const product = action.payload
      const exists = state.items.find(i => i.id === product.id)
      if (exists) {
        state.items = state.items.filter(i => i.id !== product.id)
      } else {
        state.items.push(product)
      }
      localStorage.setItem('svdke_wishlist', JSON.stringify(state.items))
    },
    setWishlist: (state, action) => {
      state.items = action.payload
    },
    clearWishlist: (state) => {
      state.items = []
      localStorage.removeItem('svdke_wishlist')
    },
  },
})

export const selectWishlistItems = (state) => state.wishlist.items
export const selectIsWishlisted  = (productId) => (state) => state.wishlist.items.some(i => i.id === productId)

export const { toggleWishlist, setWishlist, clearWishlist } = wishlistSlice.actions
export default wishlistSlice.reducer
