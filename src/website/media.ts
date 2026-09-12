import useTenant from "../hooks/useTenant";
import { safeUrl, type MediaRef } from "./contract";
export function useMedia() {
  const { tenant, branches } = useTenant();
  return (ref: MediaRef | null): string | undefined => {
    if (!ref || ref.companyId !== tenant?.id) return;
    const branch = branches.find(
      (b) => b.id === ref.branchId && b.companyId === tenant.id,
    );
    const url =
      ref.kind === "company-logo"
        ? tenant.logoUrl
        : ref.kind === "company-cover"
          ? tenant.coverUrl
          : ref.kind === "branch-cover"
            ? branch?.coverImageUrl
            : branch?.photos.find((p) => p.id === ref.photoId)?.url;
    return url && safeUrl(url) ? url : undefined;
  };
}
