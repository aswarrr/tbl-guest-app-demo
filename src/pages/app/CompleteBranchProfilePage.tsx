import { useLocation, useParams } from "react-router-dom";
import BranchProfileWorkspace, {
  type BranchProfileRouteState,
} from "../../components/branch/BranchProfileWorkspace";
import AppShell from "../../layouts/AppShell";

export default function CompleteBranchProfilePage() {
  const { branchId = "" } = useParams();
  const location = useLocation();
  const routeState = (location.state as BranchProfileRouteState | null) ?? null;

  return (
    <AppShell title="Complete Branch Profile">
      <BranchProfileWorkspace
        branchId={branchId}
        mode="complete"
        routeState={routeState}
      />
    </AppShell>
  );
}
