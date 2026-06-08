import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

export const getRedirectUrl = (path = '') => {
  const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin
  const base = siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl
  return `${base}${path}`
}

export default supabase

