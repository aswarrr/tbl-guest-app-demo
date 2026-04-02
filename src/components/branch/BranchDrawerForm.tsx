import { useEffect, useMemo, useState, type FormEvent } from "react";
import RightDrawer from "../ui/RightDrawer";
import ErrorMessage from "../ErrorMessage";
import Loader from "../Loader";
import MapPicker from "./MapPicker";
import { companiesService } from "../../services/companies.service";
import { branchesService } from "../../services/branches.service";
import type { Branch } from "../../types/branch";

const COUNTRY_OPTIONS = ["Egypt"];

const EGYPT_CITY_OPTIONS = [
  "Cairo",
  "Giza",
  "Alexandria",
  "Dakahlia",
  "Red Sea",
  "Beheira",
  "Fayoum",
  "Gharbia",
  "Ismailia",
  "Menofia",
  "Minya",
  "Qalyubia",
  "New Valley",
  "Suez",
  "Aswan",
  "Assiut",
  "Beni Suef",
  "Port Said",
  "Damietta",
  "Sharkia",
  "South Sinai",
  "Kafr El Sheikh",
  "Matrouh",
  "Luxor",
  "Qena",
  "North Sinai",
  "Sohag",
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function normalizeBranch(result: any): Branch | null {
  const resolved =
    result?.data?.branch ??
    result?.data ??
    result?.branch ??
    result ??
    null;

  if (!resolved?.id) return null;

  return {
    id: resolved.id,
    companyId: resolved.companyId ?? "",
    name: resolved.name ?? "",
    slug: resolved.slug ?? "",
    addressLine1: resolved.addressLine1 ?? "",
    addressLine2: resolved.addressLine2 ?? null,
    area: resolved.area ?? null,
    city: resolved.city ?? "",
    governorate: resolved.governorate ?? null,
    postalCode: resolved.postalCode ?? null,
    landmark: resolved.landmark ?? null,
    country: resolved.country ?? "",
    latitude: Number(resolved.latitude ?? 0),
    longitude: Number(resolved.longitude ?? 0),
    phone: resolved.phone ?? null,
    email: resolved.email ?? null,
    timezone: resolved.timezone ?? null,
    status: resolved.status ?? null,
    about: resolved.about ?? null,
    placeId: resolved.placeId ?? null,
    geocodeProvider: resolved.geocodeProvider ?? null,
    geocodeAccuracy: resolved.geocodeAccuracy ?? null,
    coverUrl: resolved.coverUrl ?? null,
    amenitiesMode: resolved.amenitiesMode ?? null,
    tagsMode: resolved.tagsMode ?? null,
    createdAt: resolved.createdAt ?? null,
    updatedAt: resolved.updatedAt ?? null,
    raw: resolved,
  };
}

type Props = {
  open: boolean;
  mode: "create" | "edit";
  companyId: string;
  branchId?: string | null;
  initialBranch?: Branch | null;
  onClose: () => void;
  onSaved: (branch: Branch | null, message: string) => void;
};

export default function BranchDrawerForm({
  open,
  mode,
  companyId,
  branchId,
  initialBranch,
  onClose,
  onSaved,
}: Props) {
  const [form, setForm] = useState({
    name: "",
    slug: "",
    addressLine1: "",
    addressLine2: "",
    city: "Cairo",
    country: "Egypt",
    postalCode: "",
    landmark: "",
    latitude: "30.0289",
    longitude: "31.4913",
    phone: "",
    email: "",
    timezone: "Africa/Cairo",
    about: "",
  });

  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [error, setError] = useState("");

  const suggestedSlug = useMemo(() => slugify(form.name), [form.name]);

  useEffect(() => {
    if (!open) return;

    setError("");
    setSlugTouched(false);

    if (mode === "create") {
      setForm({
        name: "",
        slug: "",
        addressLine1: "",
        addressLine2: "",
        city: "Cairo",
        country: "Egypt",
        postalCode: "",
        landmark: "",
        latitude: "30.0289",
        longitude: "31.4913",
        phone: "",
        email: "",
        timezone: "Africa/Cairo",
        about: "",
      });
      return;
    }

    if (mode === "edit") {
      if (initialBranch) {
        setForm({
          name: initialBranch.name || "",
          slug: initialBranch.slug || "",
          addressLine1: initialBranch.addressLine1 || "",
          addressLine2: initialBranch.addressLine2 || "",
          city: initialBranch.city || "Cairo",
          country: initialBranch.country || "Egypt",
          postalCode: initialBranch.postalCode || "",
          landmark: initialBranch.landmark || "",
          latitude: String(initialBranch.latitude ?? 30.0289),
          longitude: String(initialBranch.longitude ?? 31.4913),
          phone: initialBranch.phone || "",
          email: initialBranch.email || "",
          timezone: initialBranch.timezone || "Africa/Cairo",
          about: initialBranch.about || "",
        });
      }

      if (branchId) {
        setLoadingInitial(true);

        void branchesService
          .getBranch(branchId)
          .then((result) => {
            const branch = normalizeBranch(result);
            if (!branch) return;

            setForm({
              name: branch.name || "",
              slug: branch.slug || "",
              addressLine1: branch.addressLine1 || "",
              addressLine2: branch.addressLine2 || "",
              city: branch.city || "Cairo",
              country: branch.country || "Egypt",
              postalCode: branch.postalCode || "",
              landmark: branch.landmark || "",
              latitude: String(branch.latitude ?? 30.0289),
              longitude: String(branch.longitude ?? 31.4913),
              phone: branch.phone || "",
              email: branch.email || "",
              timezone: branch.timezone || "Africa/Cairo",
              about: branch.about || "",
            });
          })
          .catch(() => {
            // keep initial branch fallback
          })
          .finally(() => setLoadingInitial(false));
      }
    }
  }, [open, mode, initialBranch, branchId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Branch name is required.");
      return;
    }

    if (mode === "create" && !form.slug.trim()) {
      setError("Slug is required.");
      return;
    }

    if (!form.addressLine1.trim()) {
      setError("Address line 1 is required.");
      return;
    }

    if (!form.phone.trim()) {
      setError("Phone is required.");
      return;
    }

    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }

    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      setError("Latitude and longitude must be valid numbers.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "create") {
        const result = await companiesService.createBranch(companyId, {
          name: form.name.trim(),
          slug: form.slug.trim(),
          addressLine1: form.addressLine1.trim(),
          addressLine2: form.addressLine2.trim() || undefined,
          city: form.city,
          country: form.country,
          postalCode: form.postalCode.trim() || undefined,
          landmark: form.landmark.trim() || undefined,
          latitude,
          longitude,
          phone: form.phone.trim(),
          email: form.email.trim(),
          timezone: form.timezone.trim(),
          about: form.about.trim() || undefined,
        });

        onSaved(normalizeBranch(result), "Branch saved successfully.");
        return;
      }

      if (!branchId) throw new Error("Missing branch ID.");

      const result = await branchesService.updateBranch(branchId, {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        addressLine1: form.addressLine1.trim(),
        addressLine2: form.addressLine2.trim() || undefined,
        city: form.city,
        country: form.country,
        postalCode: form.postalCode.trim() || undefined,
        landmark: form.landmark.trim() || undefined,
        latitude,
        longitude,
        phone: form.phone.trim(),
        email: form.email.trim(),
        timezone: form.timezone.trim() || undefined,
        about: form.about.trim() || undefined,
      });

      onSaved(normalizeBranch(result), "Branch saved successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to save branch");
    } finally {
      setLoading(false);
    }
  };

  const title = mode === "edit" ? "Edit Branch" : "New Branch";

  return (
    <RightDrawer
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button className="button button-secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="primary-dark-btn"
            type="submit"
            form="branch-drawer-form"
            disabled={loading || loadingInitial}
          >
            Save
          </button>
        </>
      }
    >
      <div className="drawer-upload-section">
        <div className="drawer-avatar">
          {form.name?.trim()?.[0]?.toUpperCase() || "B"}
        </div>
        <div className="form-note">
          {mode === "edit"
            ? "Edit branch operational details."
            : "Create a new branch for the selected restaurant."}
        </div>
      </div>

      <ErrorMessage message={error} />
      {(loading || loadingInitial) && <Loader text="Saving branch..." />}

      <form id="branch-drawer-form" className="drawer-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label className="field-label" htmlFor="branch-name">
            Branch Name
          </label>
          <input
            id="branch-name"
            className="input"
            placeholder="Enter branch name"
            value={form.name}
            onChange={(e) => {
              const nextName = e.target.value;
              setForm((prev) => ({
                ...prev,
                name: nextName,
                slug:
                  mode === "create" && !slugTouched
                    ? slugify(nextName)
                    : prev.slug,
              }));
            }}
          />
        </div>

        <div className="form-field">
          <label className="field-label" htmlFor="branch-slug">
            Slug
          </label>
          <input
            id="branch-slug"
            className="input"
            placeholder="Enter branch slug"
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              setForm((prev) => ({
                ...prev,
                slug: slugify(e.target.value),
              }));
            }}
          />
        </div>

        {mode === "edit" && (
          <div className="form-note">
            Update the branch profile fields used in the management workspace.
          </div>
        )}

        <div className="form-field">
          <label className="field-label" htmlFor="branch-address-line-1">
            Address Line 1
          </label>
          <input
            id="branch-address-line-1"
            className="input"
            placeholder="Enter address line 1"
            value={form.addressLine1}
            onChange={(e) => setForm((prev) => ({ ...prev, addressLine1: e.target.value }))}
          />
        </div>

        <div className="form-field">
          <label className="field-label" htmlFor="branch-address-line-2">
            Address Line 2
          </label>
          <input
            id="branch-address-line-2"
            className="input"
            placeholder="Enter address line 2"
            value={form.addressLine2}
            onChange={(e) => setForm((prev) => ({ ...prev, addressLine2: e.target.value }))}
          />
        </div>

        <div className="form-grid-2">
          <div className="form-field">
            <label className="field-label" htmlFor="branch-country">
              Country
            </label>
            <select
              id="branch-country"
              className="input"
              value={form.country}
              onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
            >
              {COUNTRY_OPTIONS.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="field-label" htmlFor="branch-city">
              City / Governorate
            </label>
            <select
              id="branch-city"
              className="input"
              value={form.city}
              onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
            >
              {EGYPT_CITY_OPTIONS.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-field">
            <label className="field-label" htmlFor="branch-postal-code">
              Postal Code
            </label>
            <input
              id="branch-postal-code"
              className="input"
              placeholder="Enter postal code"
              value={form.postalCode}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, postalCode: e.target.value }))
              }
            />
          </div>

          <div className="form-field">
            <label className="field-label" htmlFor="branch-landmark">
              Landmark
            </label>
            <input
              id="branch-landmark"
              className="input"
              placeholder="Enter landmark"
              value={form.landmark}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, landmark: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="form-field">
          <label className="field-label">Location on Map</label>
          <MapPicker
            latitude={Number(form.latitude)}
            longitude={Number(form.longitude)}
            onChange={(lat, lng) =>
              setForm((prev) => ({
                ...prev,
                latitude: String(lat),
                longitude: String(lng),
              }))
            }
          />
        </div>

        <div className="form-grid-2">
          <div className="form-field">
            <label className="field-label" htmlFor="branch-latitude">
              Latitude
            </label>
            <input
              id="branch-latitude"
              className="input"
              placeholder="Enter latitude"
              value={form.latitude}
              onChange={(e) => setForm((prev) => ({ ...prev, latitude: e.target.value }))}
            />
          </div>

          <div className="form-field">
            <label className="field-label" htmlFor="branch-longitude">
              Longitude
            </label>
            <input
              id="branch-longitude"
              className="input"
              placeholder="Enter longitude"
              value={form.longitude}
              onChange={(e) => setForm((prev) => ({ ...prev, longitude: e.target.value }))}
            />
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-field">
            <label className="field-label" htmlFor="branch-phone">
              Phone
            </label>
            <input
              id="branch-phone"
              className="input"
              placeholder="Enter phone number"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          <div className="form-field">
            <label className="field-label" htmlFor="branch-email">
              Email
            </label>
            <input
              id="branch-email"
              className="input"
              type="email"
              placeholder="Enter email address"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>
        </div>

        <div className="form-field">
          <label className="field-label" htmlFor="branch-timezone">
            Timezone
          </label>
          <input
            id="branch-timezone"
            className="input"
            placeholder="Enter timezone"
            value={form.timezone}
            onChange={(e) => setForm((prev) => ({ ...prev, timezone: e.target.value }))}
          />
        </div>

        <div className="form-field">
          <label className="field-label" htmlFor="branch-about">
            About
          </label>
          <textarea
            id="branch-about"
            className="input"
            placeholder="Enter branch description"
            rows={4}
            value={form.about}
            onChange={(e) => setForm((prev) => ({ ...prev, about: e.target.value }))}
            style={{ resize: "vertical" }}
          />
        </div>

        {mode === "create" && (
          <div className="form-note">
            Suggested slug: <strong>{suggestedSlug || "—"}</strong>
          </div>
        )}
      </form>
    </RightDrawer>
  );
}
