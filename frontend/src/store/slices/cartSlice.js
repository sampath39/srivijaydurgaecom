import { createSlice } from '@reduxjs/toolkit'

const loadCartFromStorage = () => {
  try { return JSON.parse(localStorage.getItem('svdke_cart') || '[]') } catch { return [] }
}

const saveCart = (items) => {
  localStorage.setItem('svdke_cart', JSON.stringify(items))
}

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: loadCartFromStorage(),
    isOpen: false,
  },
  reducers: {
    addToCart: (state, action) => {
      const { product, quantity = 1, size = null } = action.payload
      const existing = state.items.find(i => i.product.id === product.id && i.size === size)
      if (existing) {
        existing.quantity += quantity
      } else {
        state.items.push({ product, quantity, size })
      }
      saveCart(state.items)
    },
    removeFromCart: (state, action) => {
      const { productId, size } = action.payload
      state.items = state.items.filter(i => !(i.product.id === productId && i.size === size))
      saveCart(state.items)
    },
    updateQuantity: (state, action) => {
      const { productId, size, quantity } = action.payload
      const item = state.items.find(i => i.product.id === productId && i.size === size)
      if (item) {
        item.quantity = Math.max(1, quantity)
      }
      saveCart(state.items)
    },
    clearCart: (state) => {
      state.items = []
      localStorage.removeItem('svdke_cart')
    },
    toggleCart: (state) => { state.isOpen = !state.isOpen },
    openCart:   (state) => { state.isOpen = true },
    closeCart:  (state) => { state.isOpen = false },
    setCartFromServer: (state, action) => {
      state.items = action.payload
      saveCart(state.items)
    },
    loadCart: (state, action) => {
      state.items = action.payload || []
      saveCart(state.items)
    },
  },
})

// Selectors
export const selectCartItems   = (state) => state.cart.items
export const selectCartCount   = (state) => state.cart.items.reduce((s, i) => s + i.quantity, 0)
export const selectCartTotal   = (state) => state.cart.items.reduce((s, i) => s + (i.product.discount_price || i.product.price) * i.quantity, 0)
export const selectCartIsOpen  = (state) => state.cart.isOpen

export const { addToCart, removeFromCart, updateQuantity, clearCart, toggleCart, openCart, closeCart, setCartFromServer, loadCart } = cartSlice.actions
export default cartSlice.reducer
