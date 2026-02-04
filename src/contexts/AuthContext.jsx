import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check active sessions and sets the user
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchProfile(session.user.id)
            } else {
                setLoading(false)
            }
        }

        getSession()

        // Listen for changes on auth state (logged in, signed out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchProfile(session.user.id)
            } else {
                setProfile(null)
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error && error.code !== 'PGRST116') throw error
            setProfile(data)
        } catch (error) {
            console.error('Error fetching profile:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password })
    const signUp = (email, password, metadata) => supabase.auth.signUp({
        email,
        password,
        options: {
            data: metadata
        }
    })
    const signOut = () => supabase.auth.signOut()
    const resetPassword = (email) => supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
    })
    const updatePassword = (newPassword) => supabase.auth.updateUser({ password: newPassword })

    const dismissFirstLogin = async () => {
        if (!user) return
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ must_change_password: false })
                .eq('id', user.id)

            if (error) throw error
            // Refresh profile
            fetchProfile(user.id)
        } catch (error) {
            console.error('Error dismissing first login modal:', error.message)
        }
    }

    const value = {
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        dismissFirstLogin,
        isAdmin: profile?.role === 'admin'
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
