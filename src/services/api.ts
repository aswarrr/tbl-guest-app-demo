import axios, {
  type AxiosInstance,
  AxiosHeaders,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "../utils/tokenStorage";
import { loadingService } from "./loading.service";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export const api = axios.create({
  baseURL,
});

const refreshApi = axios.create({
  baseURL,
});

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type TokensPayload = {
  accessToken?: string | null;
  refreshToken?: string | null;
};

let refreshTokensPromise: Promise<string | null> | null = null;

function attachLoadingInterceptors(client: AxiosInstance) {
  client.interceptors.request.use((config) => {
    loadingService.setLoading(true);
    return config;
  });

  client.interceptors.response.use(
    (response) => {
      loadingService.setLoading(false);
      return response;
    },
    (error) => {
      loadingService.setLoading(false);
      return Promise.reject(error);
    }
  );
}

function resolveBackendMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      "Something went wrong"
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
}

function toError(error: unknown) {
  return new Error(resolveBackendMessage(error));
}

function readTokens(value: unknown): TokensPayload {
  if (!value || typeof value !== "object") {
    return {};
  }

  const result = value as {
    data?: { accessToken?: string | null; refreshToken?: string | null };
    accessToken?: string | null;
    refreshToken?: string | null;
  };

  return {
    accessToken: result.data?.accessToken ?? result.accessToken ?? null,
    refreshToken: result.data?.refreshToken ?? result.refreshToken ?? null,
  };
}

function buildHeaders(config: RetryableRequestConfig) {
  return config.headers instanceof AxiosHeaders
    ? config.headers
    : new AxiosHeaders(config.headers);
}

function applyAuthorizationHeader(
  config: RetryableRequestConfig,
  token: string | null
) {
  const headers = buildHeaders(config);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  } else {
    headers.delete("Authorization");
  }

  config.headers = headers;
}

function applyContentTypeHeader(config: RetryableRequestConfig) {
  const headers = buildHeaders(config);
  const isFormData =
    typeof FormData !== "undefined" && config.data instanceof FormData;

  if (isFormData) {
    headers.delete("Content-Type");
  } else {
    headers.set("Content-Type", "application/json");
  }

  config.headers = headers;
}

export async function refreshSessionTokens(): Promise<string | null> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearTokens();
    return null;
  }

  if (!refreshTokensPromise) {
    refreshTokensPromise = refreshApi
      .post("/api/auth/refresh", { refreshToken })
      .then((response) => {
        const tokens = readTokens(response.data);

        if (!tokens.accessToken || !tokens.refreshToken) {
          throw new Error("Refresh response did not include a valid token pair.");
        }

        setTokens(tokens);
        return tokens.accessToken;
      })
      .catch((error) => {
        clearTokens();
        throw toError(error);
      })
      .finally(() => {
        refreshTokensPromise = null;
      });
  }

  return refreshTokensPromise;
}

attachLoadingInterceptors(api);
attachLoadingInterceptors(refreshApi);

api.interceptors.request.use((config) => {
  const requestConfig = config as RetryableRequestConfig;
  applyAuthorizationHeader(requestConfig, getAccessToken());
  applyContentTypeHeader(requestConfig);

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const isRefreshRequest = originalRequest?.url?.includes("/api/auth/refresh");

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isRefreshRequest &&
      getRefreshToken()
    ) {
      originalRequest._retry = true;

      try {
        const nextAccessToken = await refreshSessionTokens();

        if (nextAccessToken) {
          applyAuthorizationHeader(originalRequest, nextAccessToken);
          return api(originalRequest);
        }
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(toError(error));
  }
);
