import { createContext } from "react";
import type { SessionUser } from "../types/auth";

type SetSessionPayload = {
  accessToken?: string | null;
  refreshToken?: string | null;
  user?: SessionUser | null;
};

export type AuthContextType = {
  user: SessionUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  setSession: (payload: SetSessionPayload) => Promise<void>;
  login: (payload: SetSessionPayload) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
