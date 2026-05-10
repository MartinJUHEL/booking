"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
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
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => false,
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

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
