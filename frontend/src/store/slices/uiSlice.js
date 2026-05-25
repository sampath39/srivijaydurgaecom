import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    darkMode: localStorage.getItem('svdke_dark') === 'true',
    searchOpen: false,
    mobileMenuOpen: false,
    notifications: [],
  },
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode
      localStorage.setItem('svdke_dark', state.darkMode)
      if (state.darkMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    },
    setDarkMode: (state, action) => {
      state.darkMode = action.payload
      if (action.payload) document.documentElement.classList.add('dark')
      else document.documentElement.classList.remove('dark')
    },
    toggleSearch:     (state) => { state.searchOpen = !state.searchOpen },
    closeSearch:      (state) => { state.searchOpen = false },
    toggleMobileMenu: (state) => { state.mobileMenuOpen = !state.mobileMenuOpen },
    closeMobileMenu:  (state) => { state.mobileMenuOpen = false },
  },
})

export const { toggleDarkMode, setDarkMode, toggleSearch, closeSearch, toggleMobileMenu, closeMobileMenu } = uiSlice.actions
export default uiSlice.reducer
