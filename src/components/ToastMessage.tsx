import { useEffect } from "react";
import useToast from "../hooks/useToast";
import type { ToastType } from "../context/toast-context";

type Props = {
  message?: string;
  type: ToastType;
  title?: string;
  duration?: number;
};

export default function ToastMessage({ message, type, title, duration }: Props) {
  const toast = useToast();

  useEffect(() => {
    if (!message) return;

    toast.showToast(type, {
      message,
      title,
      duration,
    });
  }, [duration, message, title, toast, type]);

  return null;
}
