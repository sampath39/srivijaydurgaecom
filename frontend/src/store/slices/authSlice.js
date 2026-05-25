import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: null,
  profile: null,
  session: null,
  loading: true,
  isAdmin: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession: (state, action) => {
      state.session = action.payload
      state.user = action.payload?.user ?? null
      state.loading = false
    },
    setUser: (state, action) => {
      state.user = action.payload
      state.loading = false
    },
    setProfile: (state, action) => {
      state.profile = action.payload
      state.isAdmin = action.payload?.role === 'admin'
    },
    clearAuth: (state) => {
      state.user = null
      state.profile = null
      state.session = null
      state.isAdmin = false
      state.loading = false
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
  },
})

export const { setSession, setProfile, clearAuth, setLoading, setUser } = authSlice.actions
export default authSlice.reducer
