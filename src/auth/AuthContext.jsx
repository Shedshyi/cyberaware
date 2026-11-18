import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase, backendEnabled } from "../lib/supabase";
import { setCurrentUser, hydrateFromServer, clearPersonalData } from "../lib/store";
import { hydrateGame } from "../game/game";

const AuthContext = createContext({
  enabled: false, loading: false, user: null, profile: null, research: { pre: null, post: null },
  sendLoginEmail: async () => {}, verifyCode: async () => {}, signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [research, setResearch] = useState({ pre: null, post: null });
  const [loading, setLoading] = useState(backendEnabled);

  const applySession = useCallback(async (session) => {
    const u = session?.user ?? null;
    setUser(u);
    setCurrentUser(u?.id ?? null);
    if (u) {
      const h = await hydrateFromServer(u.id);
      await hydrateGame(u.id);
      setProfile(h?.profile ?? null);
      setResearch(h?.research ?? { pre: null, post: null });
    } else {
      setProfile(null);
      setResearch({ pre: null, post: null });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => applySession(data.session));

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      // INITIAL_SESSION уже обработан через getSession; TOKEN_REFRESHED не меняет пользователя
      // Запросы к базе внутри этого колбэка могут заблокировать auth-лок supabase-js,
      // поэтому обработка откладывается до следующего тика.
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") setTimeout(() => applySession(session), 0);
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

  const signInWithPassword = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  /** Регистрация по паролю. Возвращает true, если сразу вошли (подтверждение почты выключено). */
  const signUpWithPassword = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin + import.meta.env.BASE_URL },
    });
    if (error) throw error;
    return !!data.session;
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

  /** Отметить сданный входной/итоговый тест без повторной загрузки с сервера. */
  const markAssessmentDone = useCallback((phase, result) => {
    setResearch(r => ({ ...r, [phase]: result }));
  }, []);

  return (
    <AuthContext.Provider value={{
      enabled: backendEnabled, loading, user, profile, research,
      sendLoginEmail, verifyCode, signInWithPassword, signUpWithPassword,
      signOut, refreshProfile, markAssessmentDone,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
