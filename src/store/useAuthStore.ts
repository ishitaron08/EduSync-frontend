"use client";

import { create } from "zustand";
import api from "@/lib/api";

type Role = "admin" | "teacher" | "student";
const LOGOUT_IN_PROGRESS_KEY = "auth_logout_in_progress";
type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
};

interface AuthState {
  token: string | null;
  role: Role | null;
  user: AuthUser | null;
  isHydrated: boolean;
  login: (email: string, password: string, portalRole: Role) => Promise<void>;
  register: (name: string, email: string, password: string, role: Role) => Promise<void>;
  logout: () => Promise<void>;
  bootstrapAuth: () => Promise<void>;
  syncToken: (token: string | null) => void;
  updateProfile: (payload: { name: string; phone?: string | null }) => Promise<AuthUser>;
  changePassword: (payload: { currentPassword: string; newPassword: string; confirmPassword: string }) => Promise<void>;
}

function decodeRole(token: string): Role | null {
  try {
    const base = token.split(".")[1];
    const decoded = JSON.parse(atob(base));
    return decoded.role as Role;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  role: null,
  user: null,
  isHydrated: false,
  syncToken: (token) => {
    if (typeof window === "undefined") return;
    if (!token) {
      localStorage.removeItem("token");
      set({ token: null, role: null, user: null });
      return;
    }
    localStorage.setItem("token", token);
    set({ token, role: decodeRole(token), user: null });
  },
  login: async (email, password, portalRole) => {
    const { data } = await api.post<{ token: string; user: AuthUser }>(
      "/auth/login",
      { email, password, portalRole },
      { headers: { "x-skip-refresh-interceptor": "1" } }
    );
    set({ token: data.token, role: decodeRole(data.token), user: data.user ?? null });
    localStorage.setItem("token", data.token);
  },
  register: async (name, email, password, role) => {
    const { data } = await api.post<{ token: string; user: AuthUser }>(
      "/auth/register",
      { name, email, password, role },
      { headers: { "x-skip-refresh-interceptor": "1" } }
    );
    set({ token: data.token, role: decodeRole(data.token), user: data.user ?? null });
    localStorage.setItem("token", data.token);
  },
  logout: async () => {
    localStorage.setItem(LOGOUT_IN_PROGRESS_KEY, "1");
    try {
      await api.post("/auth/logout", {}, { headers: { "x-skip-refresh-interceptor": "1" } });
    } catch {
      // Clear client auth state regardless of API outcome.
    }
    localStorage.removeItem("token");
    localStorage.removeItem(LOGOUT_IN_PROGRESS_KEY);
    set({ token: null, role: null, user: null, isHydrated: true });
  },
  bootstrapAuth: async () => {
    if (typeof window === "undefined") {
      set({ isHydrated: true });
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      set({ token: null, role: null, user: null, isHydrated: true });
      return;
    }
    set({ token, role: decodeRole(token), user: null });
    try {
      const { data } = await api.get<{ user?: AuthUser }>("/auth/me");
      const serverRole = data?.user?.role ?? decodeRole(token);
      set({ token, role: serverRole ?? null, user: data?.user ?? null, isHydrated: true });
    } catch {
      localStorage.removeItem("token");
      set({ token: null, role: null, user: null, isHydrated: true });
    }
  },
  updateProfile: async (payload) => {
    const { data } = await api.patch<{ user: AuthUser }>("/auth/profile", payload);
    set((state) => ({
      user: data.user,
      role: data.user?.role ?? state.role
    }));
    return data.user;
  },
  changePassword: async (payload) => {
    await api.post("/auth/change-password", payload);
  }
}));
