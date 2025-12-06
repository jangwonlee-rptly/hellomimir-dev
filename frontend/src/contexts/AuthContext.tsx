"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { getAuthClient } from "@/lib/supabaseClient";
import type { UserProfileWithField } from "@/types";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfileWithField | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfileWithField | null>(null);
  const [loading, setLoading] = useState(true);

  // Use ref to avoid recreating the client on each render
  const supabaseRef = useRef(getAuthClient());
  const supabase = supabaseRef.current;

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*, fields(*)")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }

      if (data) {
        // Cast to handle Supabase's complex return type
        const profileData = data as {
          id: string;
          preferred_field_id: string | null;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
          fields: {
            id: string;
            name: string;
            slug: string;
            description: string | null;
            arxiv_query: string;
            created_at: string;
          } | null;
        };

        // Get avatar from profile, or fall back to OAuth user metadata (Google uses 'picture')
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        const avatarUrl = profileData.avatar_url
          || currentUser?.user_metadata?.avatar_url
          || currentUser?.user_metadata?.picture
          || null;

        setProfile({
          id: profileData.id,
          preferred_field_id: profileData.preferred_field_id,
          preferred_field: profileData.fields,
          display_name: profileData.display_name || currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.name || null,
          avatar_url: avatarUrl,
          created_at: profileData.created_at,
          updated_at: profileData.updated_at,
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  }, [supabase]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  const signInWithGoogle = async () => {
    // Use explicit origin to avoid Docker's 0.0.0.0 hostname issues
    const origin = typeof window !== "undefined"
      ? window.location.origin.replace("0.0.0.0", "localhost")
      : "";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });
    if (error) throw error;
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUpWithEmail = async (email: string, password: string) => {
    // Use explicit origin to avoid Docker's 0.0.0.0 hostname issues
    const origin = typeof window !== "undefined"
      ? window.location.origin.replace("0.0.0.0", "localhost")
      : "";
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
