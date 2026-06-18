'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
const REFRESH_MARGIN_MS = 60 * 1000;

type AuthUser = {
  id: string;
  email: string;
  display_name: string;
};

type AuthResponse = {
  access_token: string;
  user: AuthUser;
};

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function parseErrorMessage(res: Response, fallback: string) {
  const body = await res.json().catch(() => ({ error: fallback }));
  return body.error ?? fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshRef = useRef<() => Promise<void>>(async () => {});

  const clearSession = useCallback(() => {
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
    setUser(null);
    setAccessToken(null);
  }, []);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
    }
    refreshTimer.current = setTimeout(
      () => refreshRef.current(),
      ACCESS_TOKEN_TTL_MS - REFRESH_MARGIN_MS
    );
  }, []);

  const applyAuthResponse = useCallback(
    (data: AuthResponse) => {
      setUser(data.user);
      setAccessToken(data.access_token);
      scheduleRefresh();
    },
    [scheduleRefresh]
  );

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        clearSession();
        return;
      }
      const data: AuthResponse = await res.json();
      applyAuthResponse(data);
    } catch {
      clearSession();
    }
  }, [applyAuthResponse, clearSession]);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    refresh().finally(() => setIsLoading(false));
    return () => {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
      }
    };
    // Intentionally run only on mount: refresh() is re-bound via refreshRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        throw new Error(await parseErrorMessage(res, 'login failed'));
      }
      const data: AuthResponse = await res.json();
      applyAuthResponse(data);
    },
    [applyAuthResponse]
  );

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          display_name: displayName,
        }),
      });
      if (!res.ok) {
        throw new Error(await parseErrorMessage(res, 'registration failed'));
      }
      const data: AuthResponse = await res.json();
      applyAuthResponse(data);
    },
    [applyAuthResponse]
  );

  const logout = useCallback(async () => {
    if (accessToken) {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { Authorization: `Bearer ${accessToken}` },
      }).catch(() => undefined);
    }
    clearSession();
  }, [accessToken, clearSession]);

  return (
    <AuthContext.Provider
      value={{ user, accessToken, isLoading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
