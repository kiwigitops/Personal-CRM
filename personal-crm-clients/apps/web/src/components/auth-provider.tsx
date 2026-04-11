"use client";

import type { AuthPayload, AuthUser } from "@personal-crm/types";
import { createContext, useContext, useEffect, useState } from "react";

import { createApiClient } from "@/lib/api";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
};

type AuthContextValue = AuthState & {
  api: ReturnType<typeof createApiClient>;
  loading: boolean;
  setSession: (payload: AuthPayload) => void;
  signOut: () => Promise<void>;
};

const storageKey = "personal-crm.auth";
const AuthContext = createContext<AuthContextValue | null>(null);

function readInitialState(): AuthState {
  if (typeof window === "undefined") {
    return { accessToken: null, refreshToken: null, user: null };
  }

  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return { accessToken: null, refreshToken: null, user: null };
  }

  try {
    return JSON.parse(raw) as AuthState;
  } catch {
    return { accessToken: null, refreshToken: null, user: null };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    accessToken: null,
    refreshToken: null,
    user: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setState(readInitialState());
    setLoading(false);
  }, []);

  const setSession = (payload: AuthPayload) => {
    const nextState = {
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      user: payload.user
    };
    setState(nextState);
    window.localStorage.setItem(storageKey, JSON.stringify(nextState));
  };

  const clearSession = () => {
    setState({ accessToken: null, refreshToken: null, user: null });
    window.localStorage.removeItem(storageKey);
  };

  const api = createApiClient({
    getToken: () => state.accessToken,
    getWorkspaceId: () => state.user?.currentWorkspaceId ?? null,
    onUnauthorized: clearSession
  });

  const signOut = async () => {
    if (state.refreshToken) {
      await api.signOut({ refreshToken: state.refreshToken }).catch(() => undefined);
    }
    clearSession();
  };

  return (
    <AuthContext.Provider value={{ ...state, api, loading, setSession, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

