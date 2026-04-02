import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { authService } from "../services/auth.service";
import {
  AUTH_STORAGE_EVENT,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "../utils/tokenStorage";
import type { CurrentUserApi, JwtPayload, SessionUser } from "../types/auth";
import { AuthContext, type AuthContextType } from "./auth-context";

type SetSessionPayload = {
  accessToken?: string | null;
  refreshToken?: string | null;
  user?: SessionUser | null;
};

function decodeTokenUser(token: string | null): SessionUser | null {
  if (!token) return null;

  try {
    const decoded = jwtDecode<JwtPayload>(token);

    return {
      id: decoded.sub,
      email: decoded.email,
      mobile: decoded.mobile,
      mobileE164: decoded.mobile ?? null,
      isSuperAdmin: decoded.is_super_admin,
      source: "token",
      raw: decoded,
    };
  } catch {
    return null;
  }
}

function normalizeApiUser(result: unknown): SessionUser | null {
  const resolved =
    (result as { data?: { user?: unknown } | unknown; user?: unknown } | null)
      ?.data &&
    typeof (result as { data?: unknown }).data === "object"
      ? ((result as { data?: { user?: unknown } | unknown }).data as
          | { user?: unknown }
          | unknown)
      : (result as { data?: unknown } | null)?.data ??
        (result as { user?: unknown } | null)?.user ??
        result;

  if (!resolved || typeof resolved !== "object") return null;

  const apiUser = resolved as CurrentUserApi;

  return {
    ...apiUser,
    source: "api",
    raw: resolved,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const location = useLocation();

  const [user, setUser] = useState<SessionUser | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(
    getAccessToken()
  );
  const [refreshToken, setRefreshTokenState] = useState<string | null>(
    getRefreshToken()
  );
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const bootstrapSession = useCallback(async (options?: { silent?: boolean }) => {
    const silent = !!options?.silent;

    let currentAccessToken = getAccessToken();
    const currentRefreshToken = getRefreshToken();

    setAccessTokenState(currentAccessToken);
    setRefreshTokenState(currentRefreshToken);

    if (!silent) {
      setIsBootstrapping(true);
    }

    if (!currentAccessToken && currentRefreshToken) {
      try {
        const refreshed = await authService.refresh();
        currentAccessToken = refreshed.accessToken ?? getAccessToken();
      } catch {
        currentAccessToken = null;
      }

      setAccessTokenState(getAccessToken());
      setRefreshTokenState(getRefreshToken());
    }

    if (!currentAccessToken) {
      setUser(null);
      setIsBootstrapping(false);
      return;
    }

    try {
      const meFn = authService.me;

      if (typeof meFn === "function") {
        const result = await meFn();
        const apiUser = normalizeApiUser(result);

        if (apiUser) {
          setUser(apiUser);
        } else {
          setUser(decodeTokenUser(getAccessToken() ?? currentAccessToken));
        }
      } else {
        setUser(decodeTokenUser(getAccessToken() ?? currentAccessToken));
      }
    } catch {
      const latestAccessToken = getAccessToken();
      setUser(latestAccessToken ? decodeTokenUser(latestAccessToken) : null);
    } finally {
      setAccessTokenState(getAccessToken());
      setRefreshTokenState(getRefreshToken());
      setIsBootstrapping(false);
    }
  }, []);

  const setSession = useCallback(
    async ({ accessToken, refreshToken, user }: SetSessionPayload) => {
      setTokens({ accessToken, refreshToken });

      setAccessTokenState(getAccessToken());
      setRefreshTokenState(getRefreshToken());

      if (user !== undefined) {
        setUser(user);
        setIsBootstrapping(false);
        return;
      }

      await bootstrapSession();
    },
    [bootstrapSession]
  );

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    setAccessTokenState(null);
    setRefreshTokenState(null);
    setIsBootstrapping(false);
  }, []);

  useEffect(() => {
    void bootstrapSession();
  }, [bootstrapSession]);

  useEffect(() => {
    const syncSession = () => {
      void bootstrapSession({ silent: true });
    };

    window.addEventListener(AUTH_STORAGE_EVENT, syncSession);
    window.addEventListener("storage", syncSession);

    return () => {
      window.removeEventListener(AUTH_STORAGE_EVENT, syncSession);
      window.removeEventListener("storage", syncSession);
    };
  }, [bootstrapSession]);

  useEffect(() => {
    const storedAccessToken = getAccessToken();
    const storedRefreshToken = getRefreshToken();

    if (
      storedAccessToken !== accessToken ||
      storedRefreshToken !== refreshToken
    ) {
      void bootstrapSession({ silent: true });
    }
  }, [location.pathname, accessToken, refreshToken, bootstrapSession]);

  const safeAccessToken = accessToken ?? getAccessToken();
  const safeRefreshToken = refreshToken ?? getRefreshToken();
  const isAuthenticated = !!safeAccessToken;

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      accessToken: safeAccessToken,
      refreshToken: safeRefreshToken,
      isAuthenticated,
      isBootstrapping,
      setSession,
      login: setSession,
      logout,
      refreshSession: async () => {
        await authService.refresh();
        await bootstrapSession();
      },
    }),
    [
      user,
      safeAccessToken,
      safeRefreshToken,
      isAuthenticated,
      isBootstrapping,
      setSession,
      logout,
      bootstrapSession,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
