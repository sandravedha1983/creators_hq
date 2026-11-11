import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isInitializing, setIsInitializing] = useState(true)

  const loadAdminProfile = useCallback(async (authUser) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, name, role, is_blocked, is_suspended')
      .eq('id', authUser.id)
      .single()

    if (error) throw error
    if (!profile || profile.role !== 'admin' || profile.is_blocked || profile.is_suspended) {
      await supabase.auth.signOut()
      throw new Error('This account is not authorized for admin access.')
    }

    const adminUser = { id: authUser.id, email: profile.email, name: profile.name, role: profile.role }
    setUser(adminUser)
    return adminUser
  }, [])

  useEffect(() => {
    let active = true

    const initialize = async () => {
      try {
        if (isSupabaseConfigured()) {
          const { data, error } = await supabase.auth.getSession()
          if (error) throw error
          if (data.session?.user) await loadAdminProfile(data.session.user)
        }
      } catch (error) {
        console.error('[ADMIN AUTH INIT]', error)
        if (active) setUser(null)
      } finally {
        if (active) setIsInitializing(false)
      }
    }
    void initialize()

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
      } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        void loadAdminProfile(session.user).catch(error => {
          console.error('[ADMIN PROFILE SYNC]', error)
          setUser(null)
        })
      }
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [loadAdminProfile])

  const login = async (email, password) => {
    if (!isSupabaseConfigured()) throw new Error('Supabase authentication is not configured.')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (!data.user || !data.session) throw new Error('Supabase did not create an authenticated session.')
    return loadAdminProfile(data.user)
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isInitializing }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
