import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { branchesService } from "../../services/branches.service";
import useCurrentLocation from "../../hooks/useCurrentLocation";
import type {
  Branch,
  BranchOpeningHour,
  BranchPhoto,
  BranchPolicies,
} from "../../types/branch";
import {
  buildDistanceLabel,
  buildGuestPolicySentences,
  buildRestaurantSlides,
  formatDayLabel,
  formatOpeningHoursLabel,
  formatStatusLabel,
  getErrorMessage,
  getStatusClass,
  isActiveBranch,
  normalizeBranch,
  normalizeBranchPolicies,
  normalizeBranchPhoto,
  normalizeOpeningHour,
  resolveArray,
} from "../../utils/restaurants";
import CreateDirectReservationDrawer from "../reservations/CreateDirectReservationDrawer";
import ErrorMessage from "../ErrorMessage";
import Loader from "../Loader";
import SuccessMessage from "../SuccessMessage";
import type { BranchProfileRouteState } from "./BranchProfileWorkspace";
import RestaurantImageSlider from "./RestaurantImageSlider";

type Props = {
  branchId: string;
  routeState?: BranchProfileRouteState | null;
};

function DetailList({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <section className="surface restaurant-details-section">
      <div className="restaurant-details-section-title">{title}</div>
      <div className="restaurant-details-list">
        {items.map((item) => (
          <div key={item.label} className="restaurant-details-list-item">
            <div className="restaurant-details-list-label">{item.label}</div>
            <div className="restaurant-details-list-value">{item.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function WalletIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4.5 7.5A2.5 2.5 0 0 1 7 5h9.5A2.5 2.5 0 0 1 19 7.5v9A2.5 2.5 0 0 1 16.5 19H7A2.5 2.5 0 0 1 4.5 16.5v-9Z" />
      <path d="M4.5 9.5h11.75a2.25 2.25 0 0 1 0 4.5H15" />
      <circle cx="15.75" cy="11.75" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function RestaurantDetailsWorkspace({ branchId, routeState }: Props) {
  const { coords: currentLocation, loading: locatingCurrentLocation } =
    useCurrentLocation();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [photos, setPhotos] = useState<BranchPhoto[]>([]);
  const [openingHours, setOpeningHours] = useState<BranchOpeningHour[]>([]);
  const [policies, setPolicies] = useState<BranchPolicies | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [reserveOpen, setReserveOpen] = useState(false);

  useEffect(() => {
    if (!branchId) return;

    let cancelled = false;

    const loadRestaurant = async () => {
      setLoading(true);
      setError("");

      try {
        const [branchResult, photosResult, openingHoursResult, policiesResult] = await Promise.all([
          branchesService.getBranch(branchId),
          branchesService.listBranchPhotos(branchId).catch(() => []),
          branchesService.getOpeningHours(branchId).catch(() => []),
          branchesService.getBranchPolicies(branchId).catch(() => null),
        ]);

        if (cancelled) return;

        const nextBranch = normalizeBranch(
          (branchResult?.data ?? branchResult) as Record<string, unknown> | null
        );

        if (!nextBranch) {
          throw new Error("Restaurant details could not be loaded.");
        }

        const nextPhotos = resolveArray<Record<string, unknown>>(photosResult)
          .map((photo) => normalizeBranchPhoto(photo))
          .filter((photo): photo is BranchPhoto => photo !== null);

        const nextOpeningHours = resolveArray<Record<string, unknown>>(openingHoursResult)
          .map((row) => normalizeOpeningHour(row))
          .filter((row): row is BranchOpeningHour => row !== null);
        const nextPolicies = normalizeBranchPolicies(
          ((policiesResult as { data?: unknown } | null)?.data ??
            policiesResult) as Record<string, unknown> | null
        );

        setBranch(nextBranch);
        setPhotos(nextPhotos);
        setOpeningHours(nextOpeningHours);
        setPolicies(nextPolicies);
      } catch (nextError: unknown) {
        if (cancelled) return;

        setBranch(null);
        setPhotos([]);
        setOpeningHours([]);
        setPolicies(null);
        setError(getErrorMessage(nextError, "Failed to load restaurant details."));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadRestaurant();

    return () => {
      cancelled = true;
    };
  }, [branchId]);

  const companyLabel = branch?.companyName || routeState?.companyName || "Restaurant";
  const returnTo = routeState?.returnTo || "/branches";
  const restaurantSlides = useMemo(
    () => (branch ? buildRestaurantSlides(branch, photos) : []),
    [branch, photos]
  );
  const orderedOpeningHours = useMemo(() => {
    const hoursByDay = new Map(openingHours.map((row) => [row.dayOfWeek, row]));

    return Array.from({ length: 7 }, (_, dayOfWeek) => ({
      dayOfWeek,
      label: formatDayLabel(dayOfWeek),
      value: formatOpeningHoursLabel(hoursByDay.get(dayOfWeek) ?? null),
    }));
  }, [openingHours]);
  const guestPolicySentences = useMemo(
    () => buildGuestPolicySentences(policies),
    [policies]
  );
  const distanceLabel = useMemo(
    () => buildDistanceLabel(branch, currentLocation, locatingCurrentLocation),
    [branch, currentLocation, locatingCurrentLocation]
  );

  if (loading) {
    return <Loader text="Loading restaurant details..." />;
  }

  if (!loading && !branch && error) {
    return (
      <>
        <ErrorMessage message={error} />
        <section className="surface restaurant-empty">
          <div className="restaurant-empty-title">Restaurant details are unavailable.</div>
          <Link className="restaurant-back-link" to={returnTo}>
            Back to Restaurants
          </Link>
        </section>
      </>
    );
  }

  if (!branch) {
    return null;
  }

  if (!isActiveBranch(branch.status)) {
    return (
      <section className="surface restaurant-empty">
        <div className="restaurant-empty-title">Only active restaurants can be viewed here.</div>
        <p className="restaurant-empty-copy">
          This branch is currently marked as {formatStatusLabel(branch.status)}.
        </p>
        <Link className="restaurant-back-link" to={returnTo}>
          Back to Restaurants
        </Link>
      </section>
    );
  }

  const overviewCopy =
    branch.about ||
    "This restaurant is active and available in a read-only profile view.";

  const identityItems = [
    { label: "Restaurant", value: branch.name || "-" },
    { label: "Brand", value: companyLabel || "-" },
    { label: "Slug", value: branch.slug || "-" },
    { label: "Timezone", value: branch.timezone || "-" },
    { label: "Phone", value: branch.phone || "-" },
    { label: "Email", value: branch.email || "-" },
    { label: "Updated", value: branch.updatedAt || branch.createdAt || "-" },
  ];

  return (
    <>
      {error ? <ErrorMessage message={error} /> : null}
      <SuccessMessage message={successMessage} />

      <section className="surface restaurant-details-hero">
        <Link className="restaurant-back-link" to={returnTo}>
          Back to Restaurants
        </Link>

        <div className="restaurant-details-hero-layout">
          <div className="restaurant-details-hero-copy">
            <div className="restaurant-details-eyebrow">Active Restaurant</div>
            <div className="restaurant-details-title-row">
              <div className="restaurant-details-title-group">
                <div className="restaurant-details-brand">{companyLabel}</div>
                <h2 className="restaurant-details-title">{branch.name}</h2>
              </div>

              <span className={`table-status-pill ${getStatusClass(branch.status)}`}>
                {formatStatusLabel(branch.status)}
              </span>
            </div>

            <p className="restaurant-details-subtitle">{overviewCopy}</p>

            <div className="restaurant-details-meta">
              <span>{distanceLabel}</span>
              {currentLocation ? <span>From your current location</span> : null}
            </div>

            <div className="restaurant-details-actions">
              <button
                type="button"
                className="branch-manage-pill-btn"
                onClick={() => setReserveOpen(true)}
              >
                <WalletIcon />
                Reserve Table
              </button>
            </div>
          </div>

          <RestaurantImageSlider
            slides={restaurantSlides}
            placeholderLabel={branch.name}
            variant="hero"
            showCaption
          />
        </div>
      </section>

      <section className="surface restaurant-details-section restaurant-details-section-wide">
        <div className="restaurant-details-section-title">Overview</div>
        <p className="restaurant-details-overview">{overviewCopy}</p>
      </section>

      <section className="surface restaurant-details-section restaurant-details-section-wide">
        <div className="restaurant-details-section-title">Reservation Policies</div>
        {guestPolicySentences.length > 0 ? (
          <div className="restaurant-policy-list">
            {guestPolicySentences.map((sentence, index) => (
              <div key={`${index}-${sentence}`} className="restaurant-policy-item">
                {sentence}
              </div>
            ))}
          </div>
        ) : (
          <p className="restaurant-policy-empty">
            Reservation policies are not available right now. You can still open the
            reserve flow to see live availability for this restaurant.
          </p>
        )}
      </section>

      <div className="restaurant-details-grid">
        <DetailList title="Identity & Contact" items={identityItems} />

        <section className="surface restaurant-details-section">
          <div className="restaurant-details-section-title">Opening Hours</div>

          <div className="restaurant-hours-list">
            {orderedOpeningHours.map((item) => (
              <div key={item.dayOfWeek} className="restaurant-hour-row">
                <span className="restaurant-hour-day">{item.label}</span>
                <span className="restaurant-hour-value">{item.value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <CreateDirectReservationDrawer
        open={reserveOpen}
        onClose={() => setReserveOpen(false)}
        onSubmitted={(message) => {
          setReserveOpen(false);
          setSuccessMessage(message);
        }}
        fixedBranch={{
          id: branch.id,
          name: branch.name,
          companyName: branch.companyName || routeState?.companyName || null,
          status: branch.status || null,
        }}
      />
    </>
  );
}
