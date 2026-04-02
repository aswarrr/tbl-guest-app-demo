import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Modal from "../Modal";
import ErrorMessage from "../ErrorMessage";
import Loader from "../Loader";
import SuccessMessage from "../SuccessMessage";
import { branchesService } from "../../services/branches.service";
import type { BranchPhoto, BranchPhotoKind } from "../../types/branch";

const PHOTO_KIND_OPTIONS: BranchPhotoKind[] = [
  "INTERIOR",
  "EXTERIOR",
  "FOOD",
  "SEATING",
  "ENTRANCE",
  "OTHER",
];

function normalizePhoto(item: any): BranchPhoto {
  return {
    id: item?.id ?? "",
    branchId: item?.branchId ?? "",
    url: item?.url ?? "",
    kind: item?.kind ?? "OTHER",
    caption: item?.caption ?? null,
    sortOrder: item?.sortOrder ?? null,
    createdAt: item?.createdAt ?? null,
    updatedAt: item?.updatedAt ?? null,
    raw: item,
  };
}

function resolveArray(result: any): any[] {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.items)) return result.items;
  return [];
}

function reorderArray<T>(items: T[], fromIndex: number, toIndex: number) {
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export default function BranchPhotoManager({
  branchId,
  onPhotoCountChange,
  showDebug = false,
  theme = "default",
}: {
  branchId: string;
  onPhotoCountChange?: (count: number) => void;
  showDebug?: boolean;
  theme?: "default" | "unit";
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [photos, setPhotos] = useState<BranchPhoto[]>([]);
  const [kind, setKind] = useState<BranchPhotoKind>("INTERIOR");
  const [caption, setCaption] = useState("---");

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rawResponse, setRawResponse] = useState<unknown>(null);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<BranchPhoto | null>(null);

  const canDeleteAll = photos.length > 0;
  const addButtonClassName =
    theme === "unit" ? "branch-manage-pill-btn" : "photo-add-link";
  const deleteAllClassName =
    theme === "unit"
      ? "branch-manage-pill-btn branch-manage-pill-btn-outline"
      : "photo-delete-all";

  const sortedPhotos = useMemo(() => {
    return [...photos].sort((a, b) => {
      const aOrder = a.sortOrder ?? 0;
      const bOrder = b.sortOrder ?? 0;
      return aOrder - bOrder;
    });
  }, [photos]);

  const refreshPhotos = async () => {
    setInitialLoading(true);
    setError("");

    try {
      const result = await branchesService.listBranchPhotos(branchId);
      const next = resolveArray(result).map(normalizePhoto);
      setPhotos(next);
      onPhotoCountChange?.(next.length);
      setRawResponse(result);
    } catch (err: any) {
      setError(err.message || "Failed to load branch photos");
      setPhotos([]);
      onPhotoCountChange?.(0);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    void refreshPhotos();
  }, [branchId]);

  const handleOpenFilePicker = () => {
    inputRef.current?.click();
  };

  const handleFilesSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);

    if (files.length === 0) return;

    setError("");
    setSuccess("");
    setRawResponse(null);

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setError(`"${file.name}" is not a valid image file`);
        continue;
      }

      setLoading(true);

      try {
        const result = await branchesService.uploadBranchPhoto(
          branchId,
          file,
          kind,
          caption
        );

        setRawResponse(result);
        setSuccess(`Uploaded "${file.name}" successfully.`);
        await refreshPhotos();
      } catch (err: any) {
        setError(err.message || `Failed to upload "${file.name}"`);
      } finally {
        setLoading(false);
      }
    }

    e.target.value = "";
  };

  const handleDeletePhoto = async (photoId: string) => {
    setError("");
    setSuccess("");
    setRawResponse(null);
    setLoading(true);

    try {
      const result = await branchesService.deleteBranchPhoto(branchId, photoId);
      setRawResponse(result);
      setSuccess("Photo deleted successfully.");
      await refreshPhotos();
    } catch (err: any) {
      setError(err.message || "Failed to delete photo");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!photos.length) return;

    setError("");
    setSuccess("");
    setRawResponse(null);
    setLoading(true);

    try {
      for (const photo of photos) {
        await branchesService.deleteBranchPhoto(branchId, photo.id);
      }

      setSuccess("All branch photos were deleted.");
      await refreshPhotos();
    } catch (err: any) {
      setError(err.message || "Failed to delete all photos");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = async (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      return;
    }

    const reordered = reorderArray(sortedPhotos, dragIndex, targetIndex).map(
      (photo, index) => ({
        ...photo,
        sortOrder: index,
      })
    );

    setPhotos(reordered);
    setDragIndex(null);
    setError("");
    setSuccess("");
    setRawResponse(null);

    try {
      const result = await branchesService.reorderBranchPhotos(
        branchId,
        reordered.map((photo) => photo.id)
      );
      setRawResponse(result);
      setSuccess("Photos reordered successfully.");
      await refreshPhotos();
    } catch (err: any) {
      setError(err.message || "Failed to reorder photos");
    }
  };

  return (
    <>
      <section className="surface">
        <div className="photo-toolbar">
          <div className="photo-toolbar-left">
            <button
              type="button"
              className={addButtonClassName}
              onClick={handleOpenFilePicker}
            >
              + Add image
            </button>
          </div>

          <button
            type="button"
            className={deleteAllClassName}
            onClick={handleDeleteAll}
            disabled={!canDeleteAll || loading}
          >
            Delete all images
          </button>
        </div>

        <div className="photo-controls">
          <select
            className="input"
            value={kind}
            onChange={(e) => setKind(e.target.value as BranchPhotoKind)}
          >
            {PHOTO_KIND_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <input
            className="input"
            placeholder="Caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          style={{ display: "none" }}
          onChange={handleFilesSelected}
        />

        <ErrorMessage message={error} />
        <SuccessMessage message={success} />
        {(loading || initialLoading) && <Loader text="Processing photos..." />}

        <div className="photo-grid">
          {sortedPhotos.map((photo, index) => (
            <div
              key={photo.id}
              className={`photo-tile ${dragIndex === index ? "photo-tile-dragging" : ""}`}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => void handleDrop(index)}
            >
              <button
                type="button"
                className="photo-remove-button"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleDeletePhoto(photo.id);
                }}
                title="Delete image"
              >
                ×
              </button>

              <button
                type="button"
                className="photo-preview-button"
                onClick={() => setPreviewPhoto(photo)}
              >
                <img
                  src={photo.url}
                  alt={photo.caption || photo.kind}
                  className="photo-thumb"
                />
              </button>

              <div className="photo-drag-dots">⋯⋯</div>
            </div>
          ))}

          <button
            type="button"
            className="photo-add-tile"
            onClick={handleOpenFilePicker}
          >
            <div className="photo-add-plus">+</div>
            <div>Image</div>
          </button>
        </div>

        {showDebug ? (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: "#111827" }}>
              Raw photos API response
            </div>
            <pre className="pre">
              {JSON.stringify(rawResponse, null, 2) || "null"}
            </pre>
          </div>
        ) : null}
      </section>

      <Modal
        open={!!previewPhoto}
        title={previewPhoto?.kind || "Photo Preview"}
        onClose={() => setPreviewPhoto(null)}
      >
        {previewPhoto && (
          <div className="stack">
            <img
              src={previewPhoto.url}
              alt={previewPhoto.caption || previewPhoto.kind}
              style={{
                width: "100%",
                maxHeight: "70vh",
                objectFit: "contain",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                background: "#ffffff",
              }}
            />

            <div className="surface-muted">
              <div style={{ color: "#111827", fontWeight: 700 }}>
                {previewPhoto.kind}
              </div>
              <div style={{ color: "#4b5563", marginTop: 4 }}>
                {previewPhoto.caption || "—"}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
