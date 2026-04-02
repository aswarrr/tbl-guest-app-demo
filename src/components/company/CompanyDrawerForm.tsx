import { useEffect, useMemo, useState, type FormEvent } from "react";
import RightDrawer from "../ui/RightDrawer";
import ErrorMessage from "../ErrorMessage";
import Loader from "../Loader";
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

function resolveArray<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];

  if (Array.isArray((result as { data?: unknown } | null)?.data)) {
    return (result as { data: T[] }).data;
  }

  if (Array.isArray((result as { items?: unknown } | null)?.items)) {
    return (result as { items: T[] }).items;
  }

  return [];
}

function normalizeCompany(result: unknown): Company | null {
  const resolved =
    (result as { data?: { company?: unknown } | unknown } | null)?.data &&
    typeof (result as { data?: unknown }).data === "object" &&
    !Array.isArray((result as { data?: unknown }).data)
      ? ((result as { data?: { company?: unknown } | Record<string, unknown> }).data as
          | { company?: unknown }
          | Record<string, unknown>)
      : result;

  const company =
    (resolved as { company?: unknown } | null)?.company ??
    (resolved as Record<string, unknown> | null);

  if (!company || typeof company !== "object") {
    return null;
  }

  const record = company as Record<string, unknown>;

  if (typeof record.id !== "string") {
    return null;
  }

  return {
    id: record.id,
    name: typeof record.name === "string" ? record.name : "Unnamed Restaurant",
    slug: typeof record.slug === "string" ? record.slug : "",
    about: typeof record.about === "string" ? record.about : null,
    logoUrl: typeof record.logoUrl === "string" ? record.logoUrl : null,
    coverUrl: typeof record.coverUrl === "string" ? record.coverUrl : null,
    currency: typeof record.currency === "string" ? record.currency : null,
    cuisineId: typeof record.cuisineId === "string" ? record.cuisineId : null,
    status: typeof record.status === "string" ? record.status : null,
    address: typeof record.address === "string" ? record.address : null,
    city: typeof record.city === "string" ? record.city : null,
    country: typeof record.country === "string" ? record.country : null,
    email: typeof record.email === "string" ? record.email : null,
    phone: typeof record.phone === "string" ? record.phone : null,
    timezone: typeof record.timezone === "string" ? record.timezone : null,
    createdAt:
      typeof record.createdAt === "string"
        ? record.createdAt
        : typeof record.created_at === "string"
          ? record.created_at
          : null,
    updatedAt:
      typeof record.updatedAt === "string"
        ? record.updatedAt
        : typeof record.updated_at === "string"
          ? record.updated_at
          : null,
    raw: record,
  };
}

type CatalogOption = {
  id: string;
  name: string;
  slug: string | null;
};

function normalizeCatalogOption(item: Record<string, unknown>): CatalogOption | null {
  if (typeof item.id !== "string" || typeof item.name !== "string") {
    return null;
  }

  return {
    id: item.id,
    name: item.name,
    slug: typeof item.slug === "string" ? item.slug : null,
  };
}

function formatSelectionSummary(selectedIds: string[], options: CatalogOption[], emptyText: string) {
  const selectedNames = options
    .filter((option) => selectedIds.includes(option.id))
    .map((option) => option.name);

  if (selectedNames.length === 0) return emptyText;
  if (selectedNames.length <= 2) return selectedNames.join(", ");

  return `${selectedNames.slice(0, 2).join(", ")} +${selectedNames.length - 2} more`;
}

type Props = {
  open: boolean;
  mode: "create" | "edit" | "complete";
  companyId?: string | null;
  onClose: () => void;
  onSaved: (company: Company | null, message: string) => void;
};

export default function CompanyDrawerForm({
  open,
  mode,
  companyId,
  onClose,
  onSaved,
}: Props) {
  const [form, setForm] = useState({
    name: "",
    slug: "",
    about: "",
    currency: "EGP",
    cuisineId: "",
    amenityIds: [] as string[],
    tagIds: [] as string[],
  });
  const [slugTouched, setSlugTouched] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState("");
  const [existingLogoUrl, setExistingLogoUrl] = useState("");
  const [cuisines, setCuisines] = useState<CatalogOption[]>([]);
  const [amenities, setAmenities] = useState<CatalogOption[]>([]);
  const [tags, setTags] = useState<CatalogOption[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [error, setError] = useState("");

  const suggestedSlug = useMemo(() => slugify(form.name), [form.name]);
  const amenitySummary = useMemo(
    () => formatSelectionSummary(form.amenityIds, amenities, "Choose amenities"),
    [amenities, form.amenityIds]
  );
  const tagSummary = useMemo(
    () => formatSelectionSummary(form.tagIds, tags, "Choose tags"),
    [form.tagIds, tags]
  );

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    setError("");
    setLogoFile(null);
    setLogoPreviewUrl("");
    setExistingLogoUrl("");
    setSlugTouched(false);
    setCuisines([]);
    setAmenities([]);
    setTags([]);

    if (mode === "create") {
      setForm({
        name: "",
        slug: "",
        about: "",
        currency: "EGP",
        cuisineId: "",
        amenityIds: [],
        tagIds: [],
      });
      return;
    }

    if (!companyId) {
      setError("Missing restaurant ID.");
      return;
    }

    setLoadingInitial(true);

    void Promise.all([
      companiesService.getCompany(companyId),
      companiesService.listCuisines({ limit: 200, offset: 0 }),
      companiesService.listAmenities({ limit: 200, offset: 0 }),
      companiesService.listTags({ limit: 200, offset: 0 }),
      companiesService.listCompanyAmenities(companyId),
      companiesService.listCompanyTags(companyId),
    ])
      .then(
        ([
          companyResult,
          cuisinesResult,
          amenitiesResult,
          tagsResult,
          companyAmenitiesResult,
          companyTagsResult,
        ]) => {
          if (cancelled) return;

          const company = normalizeCompany(companyResult);
          const nextCuisines = resolveArray<Record<string, unknown>>(cuisinesResult)
            .map(normalizeCatalogOption)
            .filter((option): option is CatalogOption => option !== null);
          const nextAmenities = resolveArray<Record<string, unknown>>(amenitiesResult)
            .map(normalizeCatalogOption)
            .filter((option): option is CatalogOption => option !== null);
          const nextTags = resolveArray<Record<string, unknown>>(tagsResult)
            .map(normalizeCatalogOption)
            .filter((option): option is CatalogOption => option !== null);
          const nextAmenityIds = resolveArray<Record<string, unknown>>(companyAmenitiesResult)
            .map((item) => (typeof item.id === "string" ? item.id : null))
            .filter((value): value is string => value !== null);
          const nextTagIds = resolveArray<Record<string, unknown>>(companyTagsResult)
            .map((item) => (typeof item.id === "string" ? item.id : null))
            .filter((value): value is string => value !== null);

          setForm({
            name: company?.name || "",
            slug: company?.slug || "",
            about: company?.about || "",
            currency: (company?.currency || "EGP").toUpperCase(),
            cuisineId: company?.cuisineId || "",
            amenityIds: nextAmenityIds,
            tagIds: nextTagIds,
          });
          setExistingLogoUrl(company?.logoUrl || "");
          setCuisines(nextCuisines);
          setAmenities(nextAmenities);
          setTags(nextTags);
        }
      )
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load restaurant details");
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingInitial(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, mode, companyId]);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(logoFile);
    setLogoPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [logoFile]);

  const toggleMultiSelectValue = (key: "amenityIds" | "tagIds", value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((itemId) => itemId !== value)
        : [...prev[key], value],
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Restaurant name is required.");
      return;
    }

    if (mode === "create" && !form.slug.trim()) {
      setError("Slug is required.");
      return;
    }

    if (logoFile && !logoFile.type.startsWith("image/")) {
      setError("Selected logo must be an image file.");
      return;
    }

    if (logoFile && logoFile.size > 5 * 1024 * 1024) {
      setError("Logo file must be 5MB or smaller.");
      return;
    }

    if (mode !== "create") {
      if (!form.currency.trim() || form.currency.trim().length !== 3) {
        setError("Currency is required and must be a 3-letter code.");
        return;
      }

      if (!form.cuisineId) {
        setError("Choose one cuisine before continuing.");
        return;
      }

      if (form.amenityIds.length === 0) {
        setError("Choose at least one amenity.");
        return;
      }

      if (form.tagIds.length === 0) {
        setError("Choose at least one tag.");
        return;
      }
    }

    if (mode === "complete") {
      if (!form.about.trim()) {
        setError("Restaurant description is required before submission.");
        return;
      }

      if (!existingLogoUrl && !logoFile) {
        setError("Upload a restaurant logo before submission.");
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === "create") {
        const createResult = await companiesService.createCompany({
          name: form.name.trim(),
          slug: form.slug.trim(),
          about: form.about.trim() || undefined,
        });

        const createdCompany = normalizeCompany(createResult);
        let message = "Restaurant created successfully.";

        if (createdCompany?.id && logoFile) {
          await companiesService.uploadCompanyLogo(createdCompany.id, logoFile);
          message = "Restaurant saved successfully.";
        }

        onSaved(createdCompany, message);
        return;
      }

      if (!companyId) {
        throw new Error("Missing restaurant ID.");
      }

      const patchResult = await companiesService.updateCompany(companyId, {
        name: form.name.trim(),
        about: form.about.trim() || undefined,
        currency: form.currency.trim().toUpperCase(),
        cuisineId: form.cuisineId || null,
      });

      if (logoFile) {
        await companiesService.uploadCompanyLogo(companyId, logoFile);
      }

      await Promise.all([
        companiesService.setCompanyAmenities(companyId, form.amenityIds),
        companiesService.setCompanyTags(companyId, form.tagIds),
      ]);

      if (mode === "complete") {
        const submitResult = await companiesService.submitCompanyProfile(companyId);
        onSaved(
          normalizeCompany(submitResult) || normalizeCompany(patchResult),
          (submitResult as { message?: string } | null)?.message ||
            "Restaurant submitted for approval."
        );
        return;
      }

      onSaved(normalizeCompany(patchResult), "Restaurant saved successfully.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save restaurant");
    } finally {
      setLoading(false);
    }
  };

  const title =
    mode === "edit"
      ? "Edit Restaurant"
      : mode === "complete"
        ? "Complete Restaurant Profile"
        : "New Restaurant";
  const actionLabel = mode === "complete" ? "Submit Profile" : "Save";
  const loadingText = loadingInitial
    ? "Loading restaurant..."
    : mode === "complete"
      ? "Submitting restaurant..."
      : "Saving restaurant...";
  const visualLogo = logoPreviewUrl || existingLogoUrl;

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
            form="company-drawer-form"
            disabled={loading || loadingInitial}
          >
            {actionLabel}
          </button>
        </>
      }
    >
      <div className="drawer-upload-section">
        <div className="drawer-avatar">
          {visualLogo ? (
            <img src={visualLogo} alt="Restaurant logo preview" className="drawer-avatar-image" />
          ) : (
            form.name?.trim()?.[0]?.toUpperCase() || "R"
          )}
        </div>

        <label className="drawer-upload-link">
          Upload Restaurant Logo
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            style={{ display: "none" }}
            onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      <ErrorMessage message={error} />
      {(loading || loadingInitial) && <Loader text={loadingText} />}

      <form id="company-drawer-form" className="drawer-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label className="field-label" htmlFor="company-name">
            Restaurant Name
          </label>
          <input
            id="company-name"
            className="input"
            placeholder="Enter restaurant name"
            value={form.name}
            onChange={(e) => {
              const nextName = e.target.value;
              setForm((prev) => ({
                ...prev,
                name: nextName,
                slug: mode === "create" && !slugTouched ? slugify(nextName) : prev.slug,
              }));
            }}
          />
        </div>

        <div className="form-field">
          <label className="field-label" htmlFor="company-slug">
            Slug
          </label>
          <input
            id="company-slug"
            className="input"
            placeholder="Enter restaurant slug"
            value={form.slug}
            readOnly={mode !== "create"}
            onChange={(e) => {
              setSlugTouched(true);
              setForm((prev) => ({
                ...prev,
                slug: slugify(e.target.value),
              }));
            }}
          />
        </div>

        {mode !== "create" ? (
          <div className="form-note">Slug is shown for reference and is not edited here.</div>
        ) : null}

        <div className="form-field">
          <label className="field-label" htmlFor="company-about">
            About
          </label>
          <textarea
            id="company-about"
            className="input"
            placeholder="Enter restaurant description"
            rows={5}
            value={form.about}
            onChange={(e) => setForm((prev) => ({ ...prev, about: e.target.value }))}
            style={{ resize: "vertical" }}
          />
        </div>

        {mode !== "create" ? (
          <>
            <div className="form-grid-2">
              <div className="form-field">
                <label className="field-label" htmlFor="company-currency">
                  Currency
                </label>
                <input
                  id="company-currency"
                  className="input"
                  placeholder="EGP"
                  maxLength={3}
                  value={form.currency}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      currency: e.target.value.toUpperCase(),
                    }))
                  }
                />
              </div>

              <div className="form-field">
                <label className="field-label" htmlFor="company-cuisine">
                  Cuisine
                </label>
                <select
                  id="company-cuisine"
                  className="input"
                  value={form.cuisineId}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, cuisineId: e.target.value }))
                  }
                  disabled={loadingInitial}
                >
                  <option value="">Choose a cuisine</option>
                  {cuisines.map((cuisine) => (
                    <option key={cuisine.id} value={cuisine.id}>
                      {cuisine.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-field">
              <label className="field-label">Amenities</label>
              <details className="multi-select">
                <summary className="multi-select-trigger">{amenitySummary}</summary>
                <div className="multi-select-menu">
                  {amenities.map((amenity) => (
                    <label key={amenity.id} className="multi-select-option">
                      <input
                        type="checkbox"
                        checked={form.amenityIds.includes(amenity.id)}
                        onChange={() => toggleMultiSelectValue("amenityIds", amenity.id)}
                      />
                      <span>{amenity.name}</span>
                    </label>
                  ))}
                </div>
              </details>
            </div>

            <div className="form-field">
              <label className="field-label">Tags</label>
              <details className="multi-select">
                <summary className="multi-select-trigger">{tagSummary}</summary>
                <div className="multi-select-menu">
                  {tags.map((tag) => (
                    <label key={tag.id} className="multi-select-option">
                      <input
                        type="checkbox"
                        checked={form.tagIds.includes(tag.id)}
                        onChange={() => toggleMultiSelectValue("tagIds", tag.id)}
                      />
                      <span>{tag.name}</span>
                    </label>
                  ))}
                </div>
              </details>
            </div>
          </>
        ) : null}

        {mode === "create" ? (
          <div className="form-note">
            Suggested slug: <strong>{suggestedSlug || "(none)"}</strong>
          </div>
        ) : null}

        {mode === "complete" ? (
          <div className="form-note">
            Submission requires a logo, an about section, one cuisine, at least one
            amenity, and at least one tag.
          </div>
        ) : null}
      </form>
    </RightDrawer>
  );
}
