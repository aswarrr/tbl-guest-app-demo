import { api, refreshSessionTokens } from "./api";
import { getRefreshToken } from "../utils/tokenStorage";
import type { CurrentUserApi } from "../types/auth";

export type LoginEmailPayload = {
  email: string;
  password: string;
};

export type LoginMobilePayload = {
  mobile: string;
  password: string;
};

export type RequestMobileOtpPayload = {
  mobile: string;
};

export type VerifyMobileOtpPayload = {
  mobile: string;
  otp: string;
};

export type SignupStartPayload = {
  first_name: string;
  last_name: string;
  username: string;
  email?: string;
  mobile: string;
  whatsapp?: string;
  password: string;
  invitationToken?: string;
};

export type SignupVerifyPayload = {
  mobile: string;
  otp: string;
};

export const authService = {
  loginEmail: async (payload: LoginEmailPayload) => {
    const res = await api.post("/api/auth/login/email", payload);
    return res.data;
  },

  loginMobile: async (payload: LoginMobilePayload) => {
    const res = await api.post("/api/auth/login/mobile", payload);
    return res.data;
  },

  requestMobileOtp: async (payload: RequestMobileOtpPayload) => {
    const res = await api.post("/api/auth/login/mobile-otp/request", payload);
    return res.data;
  },

  verifyMobileOtp: async (payload: VerifyMobileOtpPayload) => {
    const res = await api.post("/api/auth/login/mobile-otp/verify", payload);
    return res.data;
  },

  signupStart: async (payload: SignupStartPayload) => {
    const res = await api.post("/api/auth/signup/start", payload);
    return res.data;
  },

  signupVerify: async (payload: SignupVerifyPayload) => {
    const res = await api.post("/api/auth/signup/verify", payload);
    return res.data;
  },

  refresh: async () => {
    const accessToken = await refreshSessionTokens();

    return {
      accessToken,
      refreshToken: getRefreshToken(),
    };
  },

  me: async (): Promise<{ data: CurrentUserApi } | CurrentUserApi> => {
    const res = await api.get("/api/auth/me");
    return res.data;
  },
};
