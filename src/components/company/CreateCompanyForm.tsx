import { useEffect, useMemo, useState, type FormEvent } from "react";
import ErrorMessage from "../ErrorMessage";
import Loader from "../Loader";
import SuccessMessage from "../SuccessMessage";
import { companiesService } from "../../services/companies.service";
import type { Company } from "../../types/company";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function normalizeCompany(result: any): Company | null {
  const resolved =
    result?.data?.company ??
    result?.data ??
    result?.company ??
    result ??
    null;

  if (!resolved?.id) return null;

  return {
    id: resolved.id,
    name: resolved.name ?? "Unnamed Restaurant",
    slug: resolved.slug ?? "",
    about: resolved.about ?? null,
    logoUrl: resolved.logoUrl ?? null,
    coverUrl: resolved.coverUrl ?? null,
    currency: resolved.currency ?? null,
    cuisineId: resolved.cuisineId ?? null,
    status: resolved.status ?? null,
    address: resolved.address ?? null,
    city: resolved.city ?? null,
    country: resolved.country ?? null,
    email: resolved.email ?? null,
    phone: resolved.phone ?? null,
    timezone: resolved.timezone ?? null,
    createdAt: resolved.createdAt ?? resolved.created_at ?? null,
    updatedAt: resolved.updatedAt ?? resolved.updated_at ?? null,
    raw: resolved,
  };
}

export default function CreateCompanyForm({
  onCreated,
  onCancel,
}: {
  onCreated: (company: Company | null, rawResponse: unknown) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    slug: "",
    about: "",
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [rawCreateResponse, setRawCreateResponse] = useState<unknown>(null);
  const [rawUploadResponse, setRawUploadResponse] = useState<unknown>(null);

  const suggestedSlug = useMemo(() => slugify(form.name), [form.name]);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(logoFile);
    setLogoPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [logoFile]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setRawCreateResponse(null);
    setRawUploadResponse(null);

    if (!form.name.trim()) {
      setError("Restaurant name is required");
      return;
    }

    if (!form.slug.trim()) {
      setError("Slug is required");
      return;
    }

    if (logoFile && !logoFile.type.startsWith("image/")) {
      setError("Selected logo must be an image file");
      return;
    }

    if (logoFile && logoFile.size > 5 * 1024 * 1024) {
      setError("Logo file must be 5MB or smaller");
      return;
    }

    setLoading(true);

    try {
      const createResult = await companiesService.createCompany({
        name: form.name.trim(),
        slug: form.slug.trim(),
        about: form.about.trim() || undefined,
      });

      setRawCreateResponse(createResult);

      const createdCompany = normalizeCompany(createResult);

      if (!createdCompany?.id) {
        throw new Error("Restaurant was created but no restaurant ID was returned");
      }

      const combinedResponse: {
        create: unknown;
        upload: unknown;
      } = {
        create: createResult,
        upload: null,
      };

      if (logoFile) {
        const uploadResult = await companiesService.uploadCompanyLogo(
          createdCompany.id,
          logoFile
        );
        setRawUploadResponse(uploadResult);
        combinedResponse.upload = uploadResult;
      }

      setSuccess(
        logoFile
          ? "Restaurant created and logo uploaded successfully."
          : "Restaurant created successfully."
      );

      onCreated(createdCompany, combinedResponse);
    } catch (err: any) {
      setError(err.message || "Failed to create restaurant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 style={{ marginTop: 0, color: "#111827" }}>Create Restaurant</h3>

      <p style={{ color: "#4b5563", marginTop: 0 }}>
        Step 1 creates the restaurant. Step 2 uploads the selected logo using the returned restaurant ID.
      </p>

      <ErrorMessage message={error} />
      <SuccessMessage message={success} />
      {loading && <Loader text="Creating restaurant..." />}

      <form className="stack" onSubmit={handleSubmit}>
        <input
          className="input"
          placeholder="Restaurant name"
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

        <div className="surface-muted">
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "#111827" }}>
            Restaurant Logo
          </div>

          <input
            className="input"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setLogoFile(file);
            }}
          />

          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
            Accepted: JPEG, PNG, WebP, GIF. Max 5MB.
          </div>
        </div>

        {logoFile && (
          <div className="surface-muted">
            <div style={{ fontWeight: 700, marginBottom: 8, color: "#111827" }}>
              Selected Logo
            </div>
            <div style={{ fontSize: 13, marginBottom: 8, color: "#374151" }}>
              {logoFile.name} ({Math.round(logoFile.size / 1024)} KB)
            </div>

            {logoPreviewUrl && (
              <img
                src={logoPreviewUrl}
                alt="Logo preview"
                className="logo-preview"
              />
            )}
          </div>
        )}

        <div style={{ fontSize: 12, color: "#6b7280" }}>
          Suggested slug: <strong>{suggestedSlug || "—"}</strong>
        </div>

        <div className="stack">
          <button className="button" type="submit" disabled={loading}>
            Create Restaurant
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
          Step 1 payload preview
        </div>
        <pre className="pre">
          {JSON.stringify(
            {
              name: form.name.trim(),
              slug: form.slug.trim(),
              about: form.about.trim() || undefined,
            },
            null,
            2
          )}
        </pre>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 8, color: "#111827" }}>
          Raw create restaurant response
        </div>
        <pre className="pre">
          {JSON.stringify(rawCreateResponse, null, 2) || "null"}
        </pre>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 8, color: "#111827" }}>
          Raw upload logo response
        </div>
        <pre className="pre">
          {JSON.stringify(rawUploadResponse, null, 2) || "null"}
        </pre>
      </div>
    </div>
  );
}
