"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { api } from "@/lib/api-client";

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string | null;
  artistName: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (idToken: string, accessToken?: string, refreshToken?: string, expiresAt?: number) => Promise<boolean>;
  loginWithCredentials: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsVerification?: boolean; email?: string }>;
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  verifyEmail: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  resendCode: (email: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => false,
  loginWithCredentials: async () => ({ success: false }),
  register: async () => ({ success: false }),
  verifyEmail: async () => ({ success: false }),
  resendCode: async () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!api.isAuthenticated()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const userData = await api.get<User>("/api/user/me");
      setUser(userData);
    } catch {
      setUser(null);
      api.clearToken();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  async function login(
    idToken: string,
    accessToken?: string,
    refreshToken?: string,
    expiresAt?: number
  ): Promise<boolean> {
    try {
      const res = await api.post<{ token: string; user: User }>("/api/auth/google", {
        idToken,
        accessToken,
        refreshToken,
        expiresAt,
      });
      api.setToken(res.token);
      setUser(res.user);
      return true;
    } catch {
      return false;
    }
  }

  function logout() {
    api.clearToken();
    setUser(null);
    window.location.href = "/login";
  }

  async function loginWithCredentials(
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; needsVerification?: boolean; email?: string }> {
    try {
      const res = await api.post<{ token: string; user: User }>("/api/auth/login", {
        email,
        password,
      });
      api.setToken(res.token);
      setUser(res.user);
      return { success: true };
    } catch (e: unknown) {
      // Check if the error response contains needsVerification
      if (e instanceof Error && e.message.includes("non vérifié")) {
        return { success: false, needsVerification: true, email, error: e.message };
      }
      const error = e instanceof Error ? e.message : "Erreur de connexion";
      return { success: false, error };
    }
  }

  async function register(
    email: string,
    password: string,
    name?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await api.post<{ message: string; email: string }>("/api/auth/register", {
        email,
        password,
        name,
      });
      return { success: true };
    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : "Erreur lors de l'inscription";
      return { success: false, error };
    }
  }

  async function verifyEmail(
    email: string,
    code: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await api.post<{ token: string; user: User }>("/api/auth/verify-email", {
        email,
        code,
      });
      api.setToken(res.token);
      setUser(res.user);
      return { success: true };
    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : "Code invalide";
      return { success: false, error };
    }
  }

  async function resendCode(email: string): Promise<void> {
    try {
      await api.post("/api/auth/resend-code", { email });
    } catch {
      // Silently fail — always 200 from backend
    }
  }

  const value = useMemo(
    () => ({ user, loading, login, loginWithCredentials, register, verifyEmail, resendCode, logout, refreshUser }),
    [user, loading, refreshUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
