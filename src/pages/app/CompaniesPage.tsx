import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../layouts/AppShell";
import useAuth from "../../hooks/useAuth";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import SuccessMessage from "../../components/SuccessMessage";
import AdminSearchBar from "../../components/ui/AdminSearchBar";
import AdminDataTable, {
  type AdminTableColumn,
} from "../../components/ui/AdminDataTable";
import CompanyDrawerForm from "../../components/company/CompanyDrawerForm";
import CompanyKycDrawer from "../../components/company/CompanyKycDrawer";
import InviteStaffDrawer from "../../components/shared/InviteStaffDrawer";
import { companiesService } from "../../services/companies.service";
import type { Company } from "../../types/company";

function resolveArray<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (Array.isArray((result as { data?: unknown } | null)?.data)) {
    return (result as { data: T[] }).data;
  }
  if (Array.isArray((result as { data?: { items?: unknown } } | null)?.data?.items)) {
    return (result as { data: { items: T[] } }).data.items;
  }
  if (Array.isArray((result as { items?: unknown } | null)?.items)) {
    return (result as { items: T[] }).items;
  }
  return [];
}

function normalizeCompany(item: Record<string, unknown>): Company {
  return {
    id: typeof item.id === "string" ? item.id : "",
    name: typeof item.name === "string" ? item.name : "Unnamed Restaurant",
    slug: typeof item.slug === "string" ? item.slug : "",
    about: typeof item.about === "string" ? item.about : null,
    logoUrl: typeof item.logoUrl === "string" ? item.logoUrl : null,
    coverUrl: typeof item.coverUrl === "string" ? item.coverUrl : null,
    currency: typeof item.currency === "string" ? item.currency : null,
    cuisineId: typeof item.cuisineId === "string" ? item.cuisineId : null,
    status: typeof item.status === "string" ? item.status : null,
    address: typeof item.address === "string" ? item.address : null,
    city: typeof item.city === "string" ? item.city : null,
    country: typeof item.country === "string" ? item.country : null,
    email: typeof item.email === "string" ? item.email : null,
    phone: typeof item.phone === "string" ? item.phone : null,
    timezone: typeof item.timezone === "string" ? item.timezone : null,
    createdAt:
      typeof item.createdAt === "string"
        ? item.createdAt
        : typeof item.created_at === "string"
          ? item.created_at
          : null,
    updatedAt:
      typeof item.updatedAt === "string"
        ? item.updatedAt
        : typeof item.updated_at === "string"
          ? item.updated_at
          : null,
    raw: item,
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function isPendingKyc(status?: string | null) {
  return (status || "").toUpperCase() === "PENDING_KYC";
}

function isPendingProfile(status?: string | null) {
  return (status || "").toUpperCase() === "PENDING_PROFILE";
}

function isPendingAdminApproval(status?: string | null) {
  return (status || "").toUpperCase() === "PENDING_ADMIN_APPROVAL";
}

export default function CompaniesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = !!user?.isSuperAdmin;
  const companyRoleIds = useMemo(
    () =>
      new Set(
        (Array.isArray(user?.companyRoles) ? user.companyRoles : [])
          .map((role) => role.companyId)
          .filter((value): value is string => typeof value === "string" && value.length > 0)
      ),
    [user?.companyRoles]
  );
  const hasCompanyScope =
    isSuperAdmin ||
    (Array.isArray(user?.companyRoles) && user.companyRoles.length > 0);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [approveLoadingId, setApproveLoadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Company | null>(null);
  const [completeTarget, setCompleteTarget] = useState<Company | null>(null);
  const [kycTarget, setKycTarget] = useState<Company | null>(null);
  const [inviteTarget, setInviteTarget] = useState<Company | null>(null);

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await companiesService.listCompanies();
      setCompanies(resolveArray<Record<string, unknown>>(result).map(normalizeCompany));
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load restaurants"));
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  const filteredCompanies = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return companies;

    return companies.filter((company) =>
      [
        company.name,
        company.slug,
        company.status,
        company.currency,
        company.city,
        company.country,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [companies, search]);

  const handleDelete = async (company: Company) => {
    const confirmed = window.confirm(`Delete restaurant "${company.name}"?`);
    if (!confirmed) return;

    setDeletingId(company.id);
    setError("");
    setSuccessMessage("");

    try {
      const result = await companiesService.deleteCompany(company.id);
      setSuccessMessage(result?.message || "Restaurant deleted successfully.");
      await loadCompanies();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to delete restaurant"));
    } finally {
      setDeletingId(null);
    }
  };

  const handleApprove = async (company: Company) => {
    setApproveLoadingId(company.id);
    setError("");
    setSuccessMessage("");

    try {
      const result = await companiesService.approveCompanyProfile(company.id);
      setSuccessMessage(result?.message || "Restaurant approved and is now active.");
      await loadCompanies();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to approve restaurant"));
    } finally {
      setApproveLoadingId(null);
    }
  };

  const columns: AdminTableColumn<Company>[] = [
    {
      key: "logo",
      label: "",
      minWidth: 70,
      render: (row) =>
        row.logoUrl ? (
          <img src={row.logoUrl} alt={`${row.name} logo`} className="table-logo-thumb" />
        ) : (
          <div className="table-logo-thumb table-logo-thumb-empty" />
        ),
    },
    {
      key: "name",
      label: "Name",
      minWidth: 260,
      render: (row) => (
        <div>
          <div className="table-primary-text">{row.name}</div>
          <div className="table-secondary-text">{row.slug}</div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      minWidth: 170,
      render: (row) => (
        <span className={`table-status-pill ${getStatusClass(row.status)}`}>
          {row.status || "-"}
        </span>
      ),
    },
    {
      key: "currency",
      label: "Currency",
      minWidth: 110,
      render: (row) => row.currency || "-",
    },
    {
      key: "invite",
      label: "Invite Staff",
      minWidth: 120,
      render: (row) =>
        isSuperAdmin || companyRoleIds.has(row.id) ? (
          <button
            className="table-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              setInviteTarget(row);
            }}
          >
            Invite Staff
          </button>
        ) : (
          <span className="table-action-placeholder">-</span>
        ),
    },
    ...(isSuperAdmin
      ? [
          {
            key: "kyc",
            label: "KYC",
            minWidth: 120,
            render: (row: Company) => (
              <button
                className="table-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setKycTarget(row);
                }}
              >
                {isPendingKyc(row.status) ? "Submit KYC" : "View KYC"}
              </button>
            ),
          } satisfies AdminTableColumn<Company>,
        ]
      : []),
    {
      key: "profile",
      label: "Complete Profile",
      minWidth: 150,
      render: (row) =>
        isPendingProfile(row.status) ? (
          <button
            className="table-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              setCompleteTarget(row);
            }}
          >
            Complete Profile
          </button>
        ) : (
          <span className="table-action-placeholder">-</span>
        ),
    },
    ...(isSuperAdmin
      ? [
          {
            key: "approve",
            label: "Approve",
            minWidth: 120,
            render: (row: Company) =>
              isPendingAdminApproval(row.status) ? (
                <button
                  className="table-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleApprove(row);
                  }}
                  disabled={approveLoadingId === row.id}
                >
                  {approveLoadingId === row.id ? "Approving..." : "Approve"}
                </button>
              ) : (
                <span className="table-action-placeholder">-</span>
              ),
          } satisfies AdminTableColumn<Company>,
        ]
      : []),
    {
      key: "edit",
      label: "Edit",
      minWidth: 90,
      render: (row) => (
        <button
          className="table-action-btn"
          onClick={(e) => {
            e.stopPropagation();
            setEditTarget(row);
          }}
        >
          Edit
        </button>
      ),
    },
    ...(isSuperAdmin
      ? [
          {
            key: "delete",
            label: "Delete",
            minWidth: 90,
            render: (row: Company) => (
              <button
                className="table-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleDelete(row);
                }}
                disabled={deletingId === row.id}
              >
                {deletingId === row.id ? "Deleting..." : "Delete"}
              </button>
            ),
          } satisfies AdminTableColumn<Company>,
        ]
      : []),
  ];

  return (
    <AppShell title="Restaurants">
      <section className="surface">
        <h1 className="admin-page-title">Restaurants</h1>

        <div className="entities-toolbar">
          <AdminSearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by restaurant name..."
          />

          <div className="entities-toolbar-actions">
            {isSuperAdmin ? (
              <button className="primary-dark-btn" onClick={() => setCreateOpen(true)}>
                + Create Restaurant
              </button>
            ) : null}
          </div>
        </div>

        {!hasCompanyScope && !loading ? (
          <div className="form-note">No restaurants are available within your scope.</div>
        ) : null}
      </section>

      <ErrorMessage message={error} />
      <SuccessMessage message={successMessage} />
      {loading && <Loader text="Loading restaurants..." />}

      <AdminDataTable
        rows={filteredCompanies}
        rowKey={(row) => row.id}
        columns={columns}
        emptyText={
          hasCompanyScope
            ? "No restaurants found."
            : "No restaurants are available within your scope."
        }
        onRowClick={(row) =>
          navigate(`/companies/${row.id}/branches`, {
            state: { companyName: row.name },
          })
        }
      />

      <CompanyDrawerForm
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSaved={(_, message) => {
          setCreateOpen(false);
          setSuccessMessage(message);
          void loadCompanies();
        }}
      />

      <CompanyDrawerForm
        open={!!editTarget}
        mode="edit"
        companyId={editTarget?.id ?? undefined}
        onClose={() => setEditTarget(null)}
        onSaved={(_, message) => {
          setEditTarget(null);
          setSuccessMessage(message);
          void loadCompanies();
        }}
      />

      <CompanyDrawerForm
        open={!!completeTarget}
        mode="complete"
        companyId={completeTarget?.id ?? undefined}
        onClose={() => setCompleteTarget(null)}
        onSaved={(_, message) => {
          setCompleteTarget(null);
          setSuccessMessage(message);
          void loadCompanies();
        }}
      />

      <CompanyKycDrawer
        open={!!kycTarget}
        company={kycTarget}
        onClose={() => setKycTarget(null)}
        onSubmitted={(message: string) => {
          setKycTarget(null);
          setSuccessMessage(message);
          void loadCompanies();
        }}
      />

      <InviteStaffDrawer
        open={!!inviteTarget}
        onClose={() => setInviteTarget(null)}
        scopeType="COMPANY"
        scopeId={inviteTarget?.id ?? ""}
        title={`Invite Staff${inviteTarget ? ` to ${inviteTarget.name}` : ""}`}
        onSent={(message: string) => {
          setSuccessMessage(message);
        }}
      />
    </AppShell>
  );
}

function getStatusClass(status?: string | null) {
  const normalized = (status || "").toUpperCase();

  if (normalized === "ACTIVE") return "status-active";
  if (normalized === "PENDING_ADMIN_APPROVAL") return "status-pending-admin";
  if (normalized === "PENDING_PROFILE") return "status-pending-profile";
  if (normalized === "PENDING_KYC") return "status-pending-kyc";
  return "status-generic";
}
