import { createContext } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export type ToastOptions = {
  message: string;
  title?: string;
  duration?: number;
  dedupeKey?: string;
};

export type ToastContextType = {
  showToast: (type: ToastType, options: ToastOptions) => void;
  success: (message: string, options?: Omit<ToastOptions, "message">) => void;
  error: (message: string, options?: Omit<ToastOptions, "message">) => void;
  warning: (message: string, options?: Omit<ToastOptions, "message">) => void;
  info: (message: string, options?: Omit<ToastOptions, "message">) => void;
  dismissToast: (id: string) => void;
};

export const ToastContext = createContext<ToastContextType | undefined>(undefined);
