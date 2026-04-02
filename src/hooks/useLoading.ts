import { useSyncExternalStore } from "react";
import { loadingService } from "../services/loading.service";

export default function useLoading() {
  return useSyncExternalStore(
    loadingService.subscribe,
    loadingService.isLoading,
    loadingService.isLoading
  );
}
