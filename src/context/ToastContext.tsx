import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ToastContext,
  type ToastContextType,
  type ToastOptions,
  type ToastType,
} from "./toast-context";

type ToastItem = {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration: number;
};

const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 4000,
  error: 5500,
  warning: 5000,
  info: 4500,
};

function buildToastId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeoutMapRef = useRef(new Map<string, number>());
  const recentSignatureMapRef = useRef(new Map<string, number>());

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));

    const timeoutId = timeoutMapRef.current.get(id);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeoutMapRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (type: ToastType, options: ToastOptions) => {
      const message = options.message.trim();
      if (!message) return;

      const signature = options.dedupeKey ?? `${type}|${options.title ?? ""}|${message}`;
      const now = Date.now();
      const lastShownAt = recentSignatureMapRef.current.get(signature);

      // React Strict Mode replays effects in development. Ignore immediate duplicates.
      if (lastShownAt && now - lastShownAt < 750) {
        return;
      }

      recentSignatureMapRef.current.set(signature, now);

      const id = buildToastId();
      const duration = options.duration ?? DEFAULT_DURATIONS[type];
      const toast: ToastItem = {
        id,
        type,
        title: options.title,
        message,
        duration,
      };

      setToasts((current) => [...current, toast]);

      const timeoutId = window.setTimeout(() => {
        dismissToast(id);
      }, duration);

      timeoutMapRef.current.set(id, timeoutId);
    },
    [dismissToast]
  );

  useEffect(() => {
    return () => {
      timeoutMapRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      timeoutMapRef.current.clear();
    };
  }, []);

  const value = useMemo<ToastContextType>(
    () => ({
      showToast,
      success: (message, options) => showToast("success", { ...options, message }),
      error: (message, options) => showToast("error", { ...options, message }),
      warning: (message, options) => showToast("warning", { ...options, message }),
      info: (message, options) => showToast("info", { ...options, message }),
      dismissToast,
    }),
    [dismissToast, showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="toast-container toast-top-right" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`ngx-toastr toast-${toast.type}`}
            role={toast.type === "error" || toast.type === "warning" ? "alert" : "status"}
            onClick={() => dismissToast(toast.id)}
          >
            <button
              className="toast-close-button"
              type="button"
              aria-label="Close notification"
              onClick={(event) => {
                event.stopPropagation();
                dismissToast(toast.id);
              }}
            >
              ×
            </button>

            {toast.title ? <div className="toast-title">{toast.title}</div> : null}
            <div className="toast-message">{toast.message}</div>
            <div
              className="toast-progress"
              style={{ animationDuration: `${toast.duration}ms` }}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
