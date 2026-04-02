import { useLocation, useParams } from "react-router-dom";
import type { BranchProfileRouteState } from "../../components/branch/BranchProfileWorkspace";
import RestaurantDetailsWorkspace from "../../components/branch/RestaurantDetailsWorkspace";
import AppShell from "../../layouts/AppShell";

export default function BranchProfilePage() {
  const { branchId = "" } = useParams();
  const location = useLocation();
  const routeState = (location.state as BranchProfileRouteState | null) ?? null;

  return (
    <AppShell title="Restaurant Details">
      <RestaurantDetailsWorkspace branchId={branchId} routeState={routeState} />
    </AppShell>
  );
}
