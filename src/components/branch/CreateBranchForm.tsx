import { useMemo, useState, type FormEvent } from "react";
import ErrorMessage from "../ErrorMessage";
import Loader from "../Loader";
import SuccessMessage from "../SuccessMessage";
import MapPicker from "./MapPicker";
import { companiesService } from "../../services/companies.service";
import type { Branch } from "../../types/branch";

const CITY_OPTIONS = [
  "Cairo",
  "Giza",
  "Alexandria",
  "New Cairo",
  "Sheikh Zayed",
  "6th of October",
  "Madinaty",
  "Hurghada",
  "Sharm El Sheikh",
];

const COUNTRY_OPTIONS = [
  "Egypt",
  "Saudi Arabia",
  "United Arab Emirates",
  "Turkey",
  "Qatar",
  "Kuwait",
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
    companyId: resolved.companyId,
    name: resolved.name ?? "Unnamed Branch",
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
    createdAt: resolved.createdAt ?? resolved.created_at ?? null,
    updatedAt: resolved.updatedAt ?? resolved.updated_at ?? null,
    raw: resolved,
  };
}

export default function CreateBranchForm({
  companyId,
  onCreated,
  onCancel,
}: {
  companyId: string;
  onCreated: (branch: Branch | null, rawResponse: unknown) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    slug: "",
    addressLine1: "",
    city: "Cairo",
    country: "Egypt",
    latitude: "30.0289",
    longitude: "31.4913",
    phone: "",
    email: "",
    timezone: "Africa/Cairo",
    about: "",
  });

  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rawResponse, setRawResponse] = useState<unknown>(null);

  const suggestedSlug = useMemo(() => slugify(form.name), [form.name]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setRawResponse(null);

    if (!form.name.trim()) {
      setError("Branch name is required");
      return;
    }

    if (!form.slug.trim()) {
      setError("Slug is required");
      return;
    }

    if (!form.addressLine1.trim()) {
      setError("Address line 1 is required");
      return;
    }

    if (!form.phone.trim()) {
      setError("Phone is required");
      return;
    }

    if (!form.email.trim()) {
      setError("Email is required");
      return;
    }

    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      setError("Latitude and longitude must be valid numbers");
      return;
    }

    setLoading(true);

    try {
      const result = await companiesService.createBranch(companyId, {
        name: form.name.trim(),
        slug: form.slug.trim(),
        addressLine1: form.addressLine1.trim(),
        city: form.city,
        country: form.country,
        latitude,
        longitude,
        phone: form.phone.trim(),
        email: form.email.trim(),
        timezone: form.timezone.trim(),
        about: form.about.trim() || undefined,
      });

      setRawResponse(result);
      setSuccess("Branch created successfully.");
      onCreated(normalizeBranch(result), result);
    } catch (err: any) {
      setError(err.message || "Failed to create branch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 style={{ marginTop: 0, color: "#111827" }}>Create Branch</h3>

      <p style={{ color: "#4b5563", marginTop: 0 }}>
        Create a branch for the selected restaurant. The returned branch status will appear in the branches list after success.
      </p>

      <ErrorMessage message={error} />
      <SuccessMessage message={success} />
      {loading && <Loader text="Creating branch..." />}

      <form className="stack" onSubmit={handleSubmit}>
        <input
          className="input"
          placeholder="Branch name"
          value={form.name}
          onChange={(e) => {
            const nextName = e.target.value;
            setForm((prev) => ({
              ...prev,
              name: nextName,
              slug: slugTouched ? prev.slug : slugify(nextName),
            }));
          }}
        />

        <input
          className="input"
          placeholder="Slug"
          value={form.slug}
          onChange={(e) => {
            setSlugTouched(true);
            setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }));
          }}
        />

        <input
          className="input"
          placeholder="Address Line 1"
          value={form.addressLine1}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, addressLine1: e.target.value }))
          }
        />

        <select
          className="input"
          value={form.city}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, city: e.target.value }))
          }
        >
          {CITY_OPTIONS.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>

        <select
          className="input"
          value={form.country}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, country: e.target.value }))
          }
        >
          {COUNTRY_OPTIONS.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>

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

        <div className="info-grid">
          <input
            className="input"
            placeholder="Latitude"
            value={form.latitude}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, latitude: e.target.value }))
            }
          />

          <input
            className="input"
            placeholder="Longitude"
            value={form.longitude}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, longitude: e.target.value }))
            }
          />
        </div>

        <input
          className="input"
          placeholder="Phone"
          value={form.phone}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, phone: e.target.value }))
          }
        />

        <input
          className="input"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, email: e.target.value }))
          }
        />

        <input
          className="input"
          placeholder="Timezone"
          value={form.timezone}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, timezone: e.target.value }))
          }
        />

        <textarea
          className="input"
          placeholder="About"
          rows={4}
          value={form.about}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, about: e.target.value }))
          }
          style={{ resize: "vertical" }}
        />

        <div style={{ fontSize: 12, color: "#6b7280" }}>
          Suggested slug: <strong>{suggestedSlug || "—"}</strong>
        </div>

        <div className="stack">
          <button className="button" type="submit" disabled={loading}>
            Create Branch
          </button>

          <button
            className="button button-secondary"
            type="button"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 8, color: "#111827" }}>
          Payload preview
        </div>
        <pre className="pre">
          {JSON.stringify(
            {
              name: form.name.trim(),
              slug: form.slug.trim(),
              addressLine1: form.addressLine1.trim(),
              city: form.city,
              country: form.country,
              latitude: Number(form.latitude),
              longitude: Number(form.longitude),
              phone: form.phone.trim(),
              email: form.email.trim(),
              timezone: form.timezone.trim(),
              about: form.about.trim() || undefined,
            },
            null,
            2
          )}
        </pre>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 8, color: "#111827" }}>
          Raw create branch response
        </div>
        <pre className="pre">
          {JSON.stringify(rawResponse, null, 2) || "null"}
        </pre>
      </div>
    </div>
  );
}
