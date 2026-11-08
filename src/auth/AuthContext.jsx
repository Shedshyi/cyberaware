import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase, backendEnabled } from "../lib/supabase";
import { setCurrentUser, hydrateFromServer, clearPersonalData } from "../lib/store";

const AuthContext = createContext({
  enabled: false, loading: false, user: null, profile: null,
  sendLoginEmail: async () => {}, verifyCode: async () => {}, signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(backendEnabled);

  const applySession = useCallback(async (session) => {
    const u = session?.user ?? null;
    setUser(u);
    setCurrentUser(u?.id ?? null);
    if (u) setProfile(await hydrateFromServer(u.id));
    else setProfile(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => applySession(data.session));

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      // INITIAL_SESSION уже обработан через getSession; TOKEN_REFRESHED не меняет пользователя
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") applySession(session);
    });

    // После перехода по ссылке из письма в адресе остаётся ?code=... — убираем
    const url = new URL(window.location.href);
    if (url.searchParams.has("code")) {
      url.searchParams.delete("code");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
    return () => sub.subscription.unsubscribe();
  }, [applySession]);

  const sendLoginEmail = useCallback(async (email) => {
    const redirectTo = window.location.origin + import.meta.env.BASE_URL;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
    });
    if (error) throw error;
  }, []);

  const verifyCode = useCallback(async (email, token) => {
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    clearPersonalData();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!supabase || !user) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    setProfile(data);
  }, [user]);

  return (
    <AuthContext.Provider value={{
      enabled: backendEnabled, loading, user, profile,
      sendLoginEmail, verifyCode, signOut, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
