import { useState, useEffect, useCallback } from 'react';
// Trigger Vercel Rebuild
import { supabase } from '../lib/supabaseClient';

/**
 * Custom hook to manage Supabase authentication state.
 * Provides user object, loading state, and auth methods.
 */
export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check for existing session on mount
    useEffect(() => {
        if (!supabase) {
            setLoading(false);
            return;
        }

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null);
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // Sign in with Google
    const signInWithGoogle = useCallback(async () => {
        if (!supabase) {
            setError('Supabase not configured');
            return { error: 'Supabase not configured' };
        }

        setLoading(true);
        setError(null);

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin, // Redirect back to app after Google login
            },
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        }

        return { data, error };
    }, []);

    // Sign out
    const signOut = useCallback(async () => {
        if (!supabase) return;

        setLoading(true);
        await supabase.auth.signOut();
        setUser(null);
        setLoading(false);
    }, []);

    return {
        user,
        loading,
        error,
        isAuthenticated: !!user,
        isGuest: !user,
        signInWithGoogle,
        signOut,
        // Helper to get user ID (for API calls)
        userId: user?.id ?? null,
        userEmail: user?.email ?? null,
    };
};

export default useAuth;
