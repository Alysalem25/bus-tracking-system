import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import apiClient from "../lib/api";

interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: "student" | "driver" | "admin";
  number?: string;
  studentCode?: string;
  licenseNumber?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true });
          alert("trying to login");
          const response = await apiClient.post("/login", { email, password });
          console.log("✅ User logged in:", response.data);
          alert("Login successful!");
          const { user, accessToken } = response.data.data;

          if (typeof window !== "undefined") {
            localStorage.setItem("accessToken", accessToken);
          }

          set({
            user,
            accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({ isLoading: false });
          console.error("Login error:", error);
          throw new Error(
            error.response?.data?.message || "Login failed. Please check your credentials."
          );
        }
      },

      logout: async () => {
        try {
          await apiClient.post("/api/auth/logout");
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          if (typeof window !== "undefined") {
            localStorage.removeItem("accessToken");
          }
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
          });
        }
      },

      refreshUser: async () => {
        try {
          const response = await apiClient.get("/api/auth/me");
          set({ user: response.data.data.user });
        } catch (error) {
          console.error("Error refreshing user:", error);
          get().logout();
        }
      },

      checkAuth: async () => {
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        if (token) {
          set({ accessToken: token, isAuthenticated: true });
          try {
            await get().refreshUser();
          } catch (error) {
            // Token invalid, clear auth
            get().logout();
          }
        }
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },

      setToken: (token: string | null) => {
        if (typeof window !== "undefined") {
          if (token) {
            localStorage.setItem("accessToken", token);
          } else {
            localStorage.removeItem("accessToken");
          }
        }
        set({ accessToken: token, isAuthenticated: !!token });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);


