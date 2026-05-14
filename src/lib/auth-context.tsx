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
  agencyId: string | null;
  agencyName: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (idToken: string, accessToken?: string, refreshToken?: string, expiresAt?: number) => Promise<boolean>;
  loginWithCredentials: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsVerification?: boolean; needsPassword?: boolean; email?: string }>;
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  verifyEmail: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  resendCode: (email: string) => Promise<void>;
  setPassword: (email: string, code: string, password: string) => Promise<{ success: boolean; error?: string }>;
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
  setPassword: async () => ({ success: false }),
  logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await api.get<User>("/api/user/me");
      setUser(userData);
    } catch {
      setUser(null);
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
      await api.post<{ user: User }>("/api/auth/google", {
        idToken,
        accessToken,
        refreshToken,
        expiresAt,
      });
      // Fetch full user profile (login response may omit agencyId, etc.)
      const userData = await api.get<User>("/api/user/me");
      setUser(userData);
      return true;
    } catch {
      return false;
    }
  }

  async function logout() {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // Best effort — cookie might already be expired
    }
    setUser(null);
    window.location.href = "/login";
  }

  async function loginWithCredentials(
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; needsVerification?: boolean; needsPassword?: boolean; email?: string }> {
    try {
      await api.post<{ user: User }>("/api/auth/login", {
        email,
        password,
      });
      // Fetch full user profile (login response may omit agencyId, etc.)
      const userData = await api.get<User>("/api/user/me");
      setUser(userData);
      return { success: true };
    } catch (e: unknown) {
      const err = e as Error & { status?: number; body?: { needsPassword?: boolean; needsVerification?: boolean; email?: string } };
      if (err.status === 409 && err.body?.needsPassword) {
        return { success: false, needsPassword: true, email: err.body.email || email, error: err.message };
      }
      if (err.status === 403 || (e instanceof Error && e.message.includes("non vérifié"))) {
        return { success: false, needsVerification: true, email, error: err.message };
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
      await api.post<{ user: User }>("/api/auth/verify-email", {
        email,
        code,
      });
      // Fetch full user profile
      const userData = await api.get<User>("/api/user/me");
      setUser(userData);
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

  async function setPassword(
    email: string,
    code: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await api.post<{ user: User }>("/api/auth/set-password", {
        email,
        code,
        password,
      });
      const userData = await api.get<User>("/api/user/me");
      setUser(userData);
      return { success: true };
    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : "Code invalide";
      return { success: false, error };
    }
  }

  const value = useMemo(
    () => ({ user, loading, login, loginWithCredentials, register, verifyEmail, resendCode, setPassword, logout, refreshUser }),
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
