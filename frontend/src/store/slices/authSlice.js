import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: null,
  profile: null,
  session: null,
  loading: true,
  isAdmin: false,
  role: 'customer'
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
      // RBAC: derive role from DB or fallback
      const fallbackRole = action.payload?.email === 'eswar2731@gmail.com' ? 'super_admin' : 'customer'
      state.role = action.payload?.role || fallbackRole
      state.isAdmin = ['admin', 'super_admin', 'support_agent', 'content_manager'].includes(state.role)
    },
    clearAuth: (state) => {
      state.user = null
      state.profile = null
      state.session = null
      state.isAdmin = false
      state.role = 'customer'
      state.loading = false
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
  },
})

export const { setSession, setProfile, clearAuth, setLoading, setUser } = authSlice.actions
export default authSlice.reducer
