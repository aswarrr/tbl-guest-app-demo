import "axios";

declare module "axios" {
  export interface AxiosRequestConfig {
    skipGlobalLoading?: boolean;
  }

  export interface InternalAxiosRequestConfig {
    skipGlobalLoading?: boolean;
  }
}
