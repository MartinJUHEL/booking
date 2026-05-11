const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5160";

class ApiClient {
  /** @deprecated kept for backward compat during migration — no longer stores JWT */
  setToken(_token: string) {
    // JWT is now managed via httpOnly cookie set by the backend
    // Clean up any legacy localStorage token
    if (typeof window !== "undefined") {
      localStorage.removeItem("jwt_token");
    }
  }

  /** @deprecated kept for backward compat during migration */
  clearToken() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("jwt_token");
    }
  }

  /** Auth state is now determined by calling /api/user/me (cookie-based) */
  isAuthenticated(): boolean {
    // Cannot check httpOnly cookie from JS — always return true,
    // actual auth is verified server-side on each request
    return true;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: "include",
    });

    if (res.status === 401) {
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

  async upload<T>(path: string, file: File): Promise<T> {
    const formData = new FormData();
    formData.append("file", file);

    // Do NOT set Content-Type — browser sets it with boundary for multipart
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (res.status === 401) {
      throw new Error("Unauthorized");
    }
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: "Upload failed" }));
      throw new Error(error.error || `HTTP ${res.status}`);
    }

    const text = await res.text();
    return text ? JSON.parse(text) : ({} as T);
  }

  ticketDownloadUrl(legId: string): string {
    return `${API_BASE_URL}/api/transport-legs/${legId}/ticket`;
  }

  async downloadFile(path: string, fileName: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const api = new ApiClient();
export { API_BASE_URL };
