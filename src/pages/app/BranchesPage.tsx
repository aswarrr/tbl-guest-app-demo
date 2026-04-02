import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import RestaurantCard from "../../components/branch/RestaurantCard";
import ErrorMessage from "../../components/ErrorMessage";
import Loader from "../../components/Loader";
import AdminSearchBar from "../../components/ui/AdminSearchBar";
import AppShell from "../../layouts/AppShell";
import useCurrentLocation from "../../hooks/useCurrentLocation";
import { branchesService } from "../../services/branches.service";
import type { Branch, BranchPhoto } from "../../types/branch";
import {
  buildDistanceLabel,
  getErrorMessage,
  isActiveBranch,
  normalizeBranch,
  normalizeBranchPhoto,
  resolveArray,
} from "../../utils/restaurants";

export default function BranchesPage() {
  const navigate = useNavigate();
  const { companyId } = useParams<{ companyId?: string }>();
  const { coords: currentLocation, loading: locatingCurrentLocation } =
    useCurrentLocation();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchPhotos, setBranchPhotos] = useState<Record<string, BranchPhoto[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadBranches = async () => {
      setLoading(true);
      setError("");

      try {
        const result = await branchesService.listManaged();

        if (cancelled) return;

        const nextBranches = resolveArray<Record<string, unknown>>(result)
          .map((item) => normalizeBranch(item))
          .filter((branch): branch is Branch => branch !== null)
          .filter((branch) => (!companyId ? true : branch.companyId === companyId))
          .filter((branch) => isActiveBranch(branch.status));

        setBranches(nextBranches);
      } catch (nextError: unknown) {
        if (cancelled) return;

        setBranches([]);
        setBranchPhotos({});
        setError(getErrorMessage(nextError, "Failed to load restaurants."));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadBranches();

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  useEffect(() => {
    if (branches.length === 0) {
      setBranchPhotos({});
      return;
    }

    let cancelled = false;

    const loadPhotos = async () => {
      const photoEntries = await Promise.all(
        branches.map(async (branch) => {
          try {
            const result = await branchesService.listBranchPhotos(branch.id);
            const photos = resolveArray<Record<string, unknown>>(result)
              .map((photo) => normalizeBranchPhoto(photo))
              .filter((photo): photo is BranchPhoto => photo !== null);

            return [branch.id, photos] as const;
          } catch {
            return [branch.id, []] as const;
          }
        })
      );

      if (!cancelled) {
        setBranchPhotos(Object.fromEntries(photoEntries));
      }
    };

    void loadPhotos();

    return () => {
      cancelled = true;
    };
  }, [branches]);

  const filteredBranches = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return branches;

    return branches.filter((branch) =>
      [
        branch.companyName,
        branch.name,
        branch.slug,
        branch.addressLine1,
        branch.area,
        branch.city,
        branch.governorate,
        branch.country,
        branch.phone,
        branch.email,
        branch.about,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [branches, search]);

  return (
    <AppShell title="Restaurants">
      <section className="surface restaurants-hero">
        <div className="restaurants-hero-copy">
          <h2 className="admin-page-title">Restaurants</h2>
          <p className="restaurants-subtitle">
            Active restaurants are sourced from the existing branch endpoints and presented
            in a guest-friendly gallery view.
          </p>
        </div>

        <div className="entities-toolbar">
          <AdminSearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search restaurants, locations, or contact info..."
          />

          <div className="restaurants-summary-row">
            <div className="restaurants-summary-chip">
              <span className="restaurants-summary-value">{branches.length}</span>
              <span className="restaurants-summary-label">
                Active restaurant{branches.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <ErrorMessage message={error} />
      {loading ? <Loader text="Loading restaurants..." /> : null}

      {!loading && filteredBranches.length === 0 ? (
        <section className="surface restaurant-empty">
          <div className="restaurant-empty-title">No active restaurants found.</div>
          <p className="restaurant-empty-copy">
            Try a different search or wait until an active branch becomes available in your
            scope.
          </p>
        </section>
      ) : null}

      {!loading && filteredBranches.length > 0 ? (
        <section className="restaurant-grid">
          {filteredBranches.map((branch) => (
            <RestaurantCard
              key={branch.id}
              branch={branch}
              photos={branchPhotos[branch.id] ?? []}
              distanceLabel={buildDistanceLabel(
                branch,
                currentLocation,
                locatingCurrentLocation
              )}
              onViewDetails={() =>
                navigate(`/branches/${branch.id}/profile`, {
                  state: {
                    companyId: branch.companyId,
                    companyName: branch.companyName || "Restaurant",
                    branchName: branch.name,
                    branchStatus: branch.status,
                    returnTo: "/branches",
                  },
                })
              }
            />
          ))}
        </section>
      ) : null}
    </AppShell>
  );
}
