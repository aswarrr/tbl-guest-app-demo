import type { Branch, BranchPhoto } from "../../types/branch";
import {
  buildBranchAddress,
  buildBranchLocation,
  buildRestaurantSlides,
  formatStatusLabel,
  getStatusClass,
} from "../../utils/restaurants";
import RestaurantImageSlider from "./RestaurantImageSlider";

type Props = {
  branch: Branch;
  photos?: BranchPhoto[];
  distanceLabel: string;
  onViewDetails: () => void;
};

export default function RestaurantCard({
  branch,
  photos = [],
  distanceLabel,
  onViewDetails,
}: Props) {
  const slides = buildRestaurantSlides(branch, photos);
  const locationLabel = buildBranchLocation(branch);
  const addressLabel = buildBranchAddress(branch);
  const description =
    branch.about ||
    "Browse the restaurant profile to view contact details, location info, and opening hours.";

  return (
    <article className="restaurant-card">
      <RestaurantImageSlider
        slides={slides}
        placeholderLabel={branch.name}
        variant="card"
      />

      <div className="restaurant-card-body">
        <div className="restaurant-card-header">
          <div className="restaurant-card-heading">
            <div className="restaurant-card-brand">
              {branch.companyName && branch.companyName !== branch.name
                ? branch.companyName
                : "Restaurant"}
            </div>
            <h2 className="restaurant-card-title">{branch.name}</h2>
            <div className="restaurant-card-location">{locationLabel}</div>
          </div>

          <span className={`table-status-pill ${getStatusClass(branch.status)}`}>
            {formatStatusLabel(branch.status)}
          </span>
        </div>

        <p className="restaurant-card-copy">{description}</p>

        <div className="restaurant-card-detail-grid">
          <div className="restaurant-card-detail">
            <div className="restaurant-card-detail-label">Address</div>
            <div className="restaurant-card-detail-value">{addressLabel}</div>
          </div>

          <div className="restaurant-card-detail">
            <div className="restaurant-card-detail-label">Phone</div>
            <div className="restaurant-card-detail-value">{branch.phone || "-"}</div>
          </div>

          <div className="restaurant-card-detail">
            <div className="restaurant-card-detail-label">Distance</div>
            <div className="restaurant-card-detail-value">{distanceLabel}</div>
          </div>
        </div>

        <button
          type="button"
          className="branch-manage-pill-btn restaurant-card-action"
          onClick={onViewDetails}
        >
          View Details
        </button>
      </div>
    </article>
  );
}
