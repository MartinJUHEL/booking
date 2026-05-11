const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5062";

class ApiClient {
  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("jwt_token");
  }

  setToken(token: string) {
    localStorage.setItem("jwt_token", token);
  }

  clearToken() {
    localStorage.removeItem("jwt_token");
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      // Only clear token if the auth check itself failed (user/me)
      // For other endpoints, the 401 might mean an external token expired
      // (e.g. Google Calendar), not the user's session
      if (path === "/api/user/me" || path === "/api/auth/google") {
        this.clearToken();
      }
      throw new Error("Unauthorized");
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || `HTTP ${res.status}`);
    }

    // Handle empty responses (204, etc.)
    const text = await res.text();
    return text ? JSON.parse(text) : ({} as T);
  }

  get<T>(path: string) {
    return this.request<T>(path, { method: "GET" });
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: "DELETE" });
  }
}

export const api = new ApiClient();
export { API_BASE_URL };
