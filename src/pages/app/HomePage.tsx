import { useEffect, useMemo, useState } from "react";
import AppShell from "../../layouts/AppShell";
import WorkspaceSummaryCard from "../../components/workspace/WorkspaceSummaryCard";
import useAuth from "../../hooks/useAuth";
import useWorkspace from "../../hooks/useWorkspace";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import {
  DashboardActionCard,
  DashboardBarChartCard,
  DashboardDonutChartCard,
  DashboardLineChartCard,
  DashboardListCard,
  DashboardMetricCard,
  DashboardSectionHeading,
  type DashboardMetric,
} from "../../components/dashboard/DashboardWidgets";
import { companiesService } from "../../services/companies.service";
import { branchesService } from "../../services/branches.service";
import {
  dashboardService,
  type KycStats,
  type MessagingStatus,
  type NotificationDeliveryRow,
  type PendingKycRow,
} from "../../services/dashboard.service";
import { floorplanService } from "../../services/floorplan.service";
import { reservationsService } from "../../services/reservations.service";
import { staffService } from "../../services/staff.service";
import type {
  Branch,
  BranchOpeningHour,
  PublishedFloorplanVersion,
} from "../../types/branch";
import type { Company } from "../../types/company";
import type {
  ReservationApiRecord,
  ReservationRecord,
} from "../../types/reservation";
import type { StaffMember } from "../../types/staff";
import {
  formatReservationDateTime,
  getReservationAccess,
  normalizeReservation,
} from "../../utils/reservations";
import {
  average,
  buildCountSeries,
  buildDailySeries,
  buildHourlySeries,
  formatCompactNumber,
  getStatusTone,
  getUpcomingReservations,
  isInNextDays,
  isInNextHours,
  isOpenDay,
  isSameLocalDay,
  normalizeBranch,
  normalizeCompany,
  normalizeFloorTable,
  normalizeOpeningHour,
  normalizePublishedFloorplanVersion,
  normalizeStaffMember,
  normalizeStatusLabel,
  resolveArray,
  resolveObject,
  toNumber,
  toText,
  type DashboardListItem,
  type FloorTableSummary,
} from "../../utils/dashboard";

type DashboardMode =
  | "SUPER_ADMIN"
  | "COMPANY_MANAGER"
  | "BRANCH_MANAGER"
  | "EMPTY";

type SuperAdminDashboardData = {
  companies: Company[];
  branches: Branch[];
  reservations: ReservationRecord[];
  kycStats: KycStats | null;
  pendingKyc: PendingKycRow[];
  failedDeliveries: NotificationDeliveryRow[];
  messagingStatus: MessagingStatus | null;
};

type CompanyDashboardData = {
  companyName: string;
  branches: Branch[];
  reservations: ReservationRecord[];
  staff: StaffMember[];
};

type BranchDashboardData = {
  branch: Branch | null;
  reservations: ReservationRecord[];
  openingHours: BranchOpeningHour[];
  floorplanVersion: PublishedFloorplanVersion | null;
  floorTables: FloorTableSummary[];
};

type DashboardPayload =
  | { mode: "SUPER_ADMIN"; data: SuperAdminDashboardData }
  | { mode: "COMPANY_MANAGER"; data: CompanyDashboardData }
  | { mode: "BRANCH_MANAGER"; data: BranchDashboardData }
  | { mode: "EMPTY"; data: null };

const NON_ACTIONABLE_RESERVATION_STATUSES = new Set([
  "CANCELLED",
  "HOLD_EXPIRED",
  "PAYMENT_FAILED",
  "NO_SHOW",
]);

function isActionableReservation(reservation: ReservationRecord) {
  return !NON_ACTIONABLE_RESERVATION_STATUSES.has(
    (reservation.status || "").toUpperCase()
  );
}

function getTodayReservations(reservations: ReservationRecord[]) {
  const today = new Date();
  return reservations.filter((reservation) =>
    isSameLocalDay(reservation.reservationTime, today)
  );
}

function getUpcomingReservationItems(
  reservations: ReservationRecord[],
  limit: number,
  to = "/reservations"
): DashboardListItem[] {
  return getUpcomingReservations(
    reservations.filter(isActionableReservation),
    limit
  ).map((reservation) => ({
    title: reservation.customerName,
    subtitle: [
      reservation.branchName,
      reservation.partySize ? `${reservation.partySize} guests` : null,
    ]
      .filter(Boolean)
      .join(" - "),
    meta: [
      formatReservationDateTime(reservation.reservationTime),
      normalizeStatusLabel(reservation.status),
    ]
      .filter(Boolean)
      .join(" - "),
    to,
  }));
}

function parseCount(value: unknown, fallback = 0) {
  return toNumber(value) ?? fallback;
}

function formatEventType(value: unknown) {
  return String(value || "Unknown event")
    .replace(/[._]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildMessagingItems(
  messagingStatus: MessagingStatus | null
): DashboardListItem[] {
  if (!messagingStatus) return [];

  const items: DashboardListItem[] = [];

  for (const channel of ["sms", "whatsapp", "email"] as const) {
    const health = messagingStatus[channel];
    if (!health) continue;

    const status =
      toText(health.status) ??
      (typeof health.configured === "boolean"
        ? health.configured
          ? "healthy"
          : "unconfigured"
        : "unknown");

    items.push({
      title: channel.toUpperCase(),
      subtitle: [
        toText(health.provider)?.toUpperCase(),
        toText(health.message) ?? toText(health.error),
      ]
        .filter(Boolean)
        .join(" - "),
      meta: normalizeStatusLabel(status),
      tone: getStatusTone(status),
    });
  }

  return items;
}

async function loadReservations(params?: {
  companyId?: string;
  branchId?: string;
}): Promise<ReservationRecord[]> {
  const result = await reservationsService.list({
    ...params,
    limit: 500,
    offset: 0,
  });

  return resolveArray<ReservationApiRecord>(result).map(normalizeReservation);
}

async function loadFloorplanTables(
  branchId: string,
  versionId: string
): Promise<FloorTableSummary[]> {
  const floorsResult = await floorplanService.listVersionFloors(branchId, versionId);
  const floors = resolveArray<Record<string, unknown>>(floorsResult);
  const floorIds = floors
    .map((floor) => toText(floor.id))
    .filter((value): value is string => !!value);

  const tableResults = await Promise.all(
    floorIds.map((floorId) => floorplanService.listFloorTables(branchId, floorId))
  );

  return tableResults
    .flatMap((result) => resolveArray<Record<string, unknown>>(result))
    .map(normalizeFloorTable)
    .filter((table): table is FloorTableSummary => !!table);
}

function buildQuickActions(options: {
  canAccessRestaurants: boolean;
  canAccessReservations: boolean;
}): Array<{ title: string; description: string; to: string }> {
  const actions: Array<{ title: string; description: string; to: string }> = [];

  if (options.canAccessRestaurants) {
    actions.push({
      title: "Restaurants",
      description: "Browse active restaurant locations and open their read-only profiles.",
      to: "/branches",
    });
  }

  if (options.canAccessReservations) {
    actions.push({
      title: "Reservations",
      description: "Open the reservation desk and work upcoming bookings.",
      to: "/reservations",
    });
  }

  return actions;
}

export default function HomePage() {
  const { user, isBootstrapping } = useAuth();
  const {
    companies,
    branches,
    activeCompany,
    activeCompanyId,
    activeBranch,
    activeBranchId,
    activeRoleOptions,
    setActiveBranchId,
    setActiveCompanyId,
  } = useWorkspace();

  const isSuperAdmin = !!user?.isSuperAdmin;
  const companyRoles = Array.isArray(user?.companyRoles) ? user.companyRoles : [];
  const branchRoles = Array.isArray(user?.branchRoles) ? user.branchRoles : [];
  const canAccessCompanies = isSuperAdmin || companyRoles.length > 0;
  const canAccessBranches = canAccessCompanies || branchRoles.length > 0;
  const reservationAccess = getReservationAccess(user);
  const hasCompanyManagerAccess = companyRoles.length > 0;
  const effectiveCompanyId =
    activeCompanyId ?? companies[0]?.companyId ?? companyRoles[0]?.companyId ?? null;

  const dashboardMode: DashboardMode = isSuperAdmin
    ? "SUPER_ADMIN"
    : activeBranchId
      ? "BRANCH_MANAGER"
      : effectiveCompanyId
        ? "COMPANY_MANAGER"
        : "EMPTY";

  const [dashboardPayload, setDashboardPayload] = useState<DashboardPayload>({
    mode: "EMPTY",
    data: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [refreshedAt, setRefreshedAt] = useState<number | null>(null);

  useEffect(() => {
    if (isBootstrapping) return;

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError("");

      try {
        if (dashboardMode === "SUPER_ADMIN") {
          const [companiesResult, branchesResult, reservationsResult] =
            await Promise.all([
              companiesService.listCompanies(),
              branchesService.listManaged(),
              loadReservations(),
            ]);

          const [
            kycStatsResult,
            pendingKycResult,
            failedDeliveriesResult,
            messagingStatusResult,
          ] = await Promise.all([
            dashboardService.getKycStats().catch(() => null),
            dashboardService.listPendingKyc(5).catch(() => []),
            dashboardService.listFailedDeliveries(6).catch(() => []),
            dashboardService.getMessagingStatus().catch(() => null),
          ]);

          if (cancelled) return;

          const companiesData = resolveArray<Record<string, unknown>>(companiesResult).map(
            normalizeCompany
          );
          const branchesData = resolveArray<Record<string, unknown>>(branchesResult).map(
            normalizeBranch
          );

          setDashboardPayload({
            mode: "SUPER_ADMIN",
            data: {
              companies: companiesData,
              branches: branchesData,
              reservations: reservationsResult,
              kycStats: kycStatsResult ? resolveObject<KycStats>(kycStatsResult) : null,
              pendingKyc: resolveArray<PendingKycRow>(pendingKycResult),
              failedDeliveries: resolveArray<NotificationDeliveryRow>(
                failedDeliveriesResult
              ),
              messagingStatus: messagingStatusResult
                ? resolveObject<MessagingStatus>(messagingStatusResult)
                : null,
            },
          });
          setRefreshedAt(Date.now());
          return;
        }

        if (dashboardMode === "COMPANY_MANAGER" && effectiveCompanyId) {
          const [branchesResult, staffResult, reservationsResult] = await Promise.all([
            companiesService.listBranches(effectiveCompanyId),
            staffService.listCompanyStaff(effectiveCompanyId),
            loadReservations({ companyId: effectiveCompanyId }),
          ]);

          if (cancelled) return;

          setDashboardPayload({
            mode: "COMPANY_MANAGER",
            data: {
              companyName:
                activeCompany?.companyName ||
                companies.find((company) => company.companyId === effectiveCompanyId)
                  ?.companyName ||
                "Restaurant",
              branches: resolveArray<Record<string, unknown>>(branchesResult).map(
                normalizeBranch
              ),
              reservations: reservationsResult,
              staff: resolveArray<Record<string, unknown>>(staffResult).map(
                normalizeStaffMember
              ),
            },
          });
          setRefreshedAt(Date.now());
          return;
        }

        if (dashboardMode === "BRANCH_MANAGER" && activeBranchId) {
          const [branchResult, reservationsResult, openingHoursResult, versionResult] =
            await Promise.all([
              branchesService.getBranch(activeBranchId),
              loadReservations({ branchId: activeBranchId }),
              branchesService.getOpeningHours(activeBranchId).catch(() => []),
              branchesService.getPublishedFloorplanVersion(activeBranchId).catch(
                () => null
              ),
            ]);

          const version = versionResult
            ? resolveObject<Record<string, unknown>>(versionResult)
            : null;
          const normalizedVersion = version
            ? normalizePublishedFloorplanVersion(version)
            : null;
          const floorTables = normalizedVersion
            ? await loadFloorplanTables(activeBranchId, normalizedVersion.id).catch(
                () => []
              )
            : [];

          if (cancelled) return;

          setDashboardPayload({
            mode: "BRANCH_MANAGER",
            data: {
              branch: normalizeBranch(
                resolveObject<Record<string, unknown>>(branchResult) ?? {}
              ),
              reservations: reservationsResult,
              openingHours: resolveArray<Record<string, unknown>>(openingHoursResult)
                .map(normalizeOpeningHour)
                .filter((row): row is BranchOpeningHour => !!row),
              floorplanVersion: normalizedVersion,
              floorTables,
            },
          });
          setRefreshedAt(Date.now());
          return;
        }

        if (!cancelled) {
          setDashboardPayload({ mode: "EMPTY", data: null });
          setRefreshedAt(Date.now());
        }
      } catch (nextError: unknown) {
        if (cancelled) return;
        setError(
          nextError instanceof Error
            ? nextError.message
            : "Failed to load the dashboard."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [
    activeBranchId,
    activeCompany?.companyName,
    companies,
    dashboardMode,
    effectiveCompanyId,
    isBootstrapping,
    refreshNonce,
  ]);

  const roleLabel = useMemo(() => {
    if (dashboardMode === "SUPER_ADMIN") return "Super Admin";
    if (dashboardMode === "BRANCH_MANAGER") return "Branch Manager";
    if (dashboardMode === "COMPANY_MANAGER") return "Company Manager";
    return "Workspace User";
  }, [dashboardMode]);

  const heroSubtitle = useMemo(() => {
    if (dashboardMode === "SUPER_ADMIN") {
      return "Platform-wide signals for restaurants, approvals, reservations, and delivery health.";
    }

    if (dashboardMode === "BRANCH_MANAGER") {
      return `Focused on ${
        activeBranch?.branchName || activeBranch?.branchSlug || "the active branch"
      } with arrivals, capacity, and readiness checks.`;
    }

    if (dashboardMode === "COMPANY_MANAGER") {
      return `Tracking ${
        activeCompany?.companyName || "the active restaurant"
      } across branch performance, staff coverage, and reservation flow.`;
    }

    return "Choose a workspace to start building out the operational view.";
  }, [activeBranch, activeCompany, dashboardMode]);

  const refreshLabel = refreshedAt
    ? new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
      }).format(refreshedAt)
    : "Not refreshed yet";

  const quickActions = buildQuickActions({
    canAccessRestaurants: canAccessBranches,
    canAccessReservations: reservationAccess.hasAccess,
  });

  return (
    <AppShell title="Dashboard">
      <section className="surface dashboard-hero">
        <div className="dashboard-hero-copy">
          <div className="dashboard-eyebrow">Role-aware overview</div>
          <div className="dashboard-hero-title-row">
            <h2 className="dashboard-hero-title">{roleLabel}</h2>
            <span className="dashboard-chip">{dashboardMode.replace("_", " ")}</span>
          </div>
          <p className="dashboard-hero-subtitle">{heroSubtitle}</p>
        </div>

        <div className="dashboard-hero-meta">
          <span className="dashboard-chip">Refreshed {refreshLabel}</span>
          {!isSuperAdmin && activeCompany ? (
            <span className="dashboard-chip">Restaurant: {activeCompany.companyName}</span>
          ) : null}
          {!isSuperAdmin && activeBranch ? (
            <span className="dashboard-chip">
              Branch: {activeBranch.branchName || activeBranch.branchSlug || activeBranch.branchId}
            </span>
          ) : null}
        </div>

        {!isSuperAdmin ? (
          <div className="dashboard-toolbar">
            <div className="dashboard-filter-grid">
              {companies.length > 0 ? (
                <label className="dashboard-filter">
                  <span className="dashboard-filter-label">Restaurant Scope</span>
                  <select
                    className="input"
                    value={activeCompanyId ?? ""}
                    onChange={(event) => setActiveCompanyId(event.target.value || null)}
                  >
                    {companies.map((company) => (
                      <option key={company.companyId} value={company.companyId}>
                        {company.companyName}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {branches.length > 0 ? (
                <label className="dashboard-filter">
                  <span className="dashboard-filter-label">Branch Scope</span>
                  <select
                    className="input"
                    value={activeBranchId ?? ""}
                    onChange={(event) => setActiveBranchId(event.target.value || null)}
                  >
                    {hasCompanyManagerAccess ? (
                      <option value="">Restaurant-level dashboard</option>
                    ) : null}

                    {branches.map((branch) => (
                      <option key={branch.branchId} value={branch.branchId}>
                        {branch.branchName || branch.branchSlug || branch.branchId}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>

            <div className="dashboard-toolbar-actions">
              <button
                className="button button-secondary"
                onClick={() => setRefreshNonce((current) => current + 1)}
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Refresh Dashboard"}
              </button>
            </div>
          </div>
        ) : (
          <div className="dashboard-toolbar-actions">
            <button
              className="button button-secondary"
              onClick={() => setRefreshNonce((current) => current + 1)}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh Dashboard"}
            </button>
          </div>
        )}

        {!isSuperAdmin && activeRoleOptions.length > 0 ? (
          <div className="dashboard-role-row">
            {activeRoleOptions.map((role) => (
              <span
                key={`${role.sourceScope}-${role.roleId}`}
                className="dashboard-chip dashboard-chip-muted"
              >
                {role.roleName} ({role.sourceScope})
              </span>
            ))}
          </div>
        ) : null}
      </section>

      {!isSuperAdmin ? <WorkspaceSummaryCard /> : null}

      <ErrorMessage message={error} />

      {loading || isBootstrapping ? (
        <section className="surface">
          <Loader text="Loading dashboard..." />
        </section>
      ) : null}

      {!loading && dashboardPayload.mode === "SUPER_ADMIN" ? (
        <SuperAdminDashboard data={dashboardPayload.data} />
      ) : null}

      {!loading && dashboardPayload.mode === "COMPANY_MANAGER" ? (
        <CompanyDashboard data={dashboardPayload.data} />
      ) : null}

      {!loading && dashboardPayload.mode === "BRANCH_MANAGER" ? (
        <BranchDashboard data={dashboardPayload.data} />
      ) : null}

      {!loading && dashboardPayload.mode === "EMPTY" ? (
        <section className="surface">
          <DashboardSectionHeading
            title="No Manager Scope Yet"
            subtitle="This dashboard lights up once the account has company, branch, or super-admin access."
          />
        </section>
      ) : null}

      {quickActions.length > 0 ? (
        <section className="surface dashboard-card">
          <DashboardSectionHeading
            title="Quick Actions"
            subtitle="Jump straight into the core operational areas."
          />

          <div className="dashboard-action-grid">
            {quickActions.map((action) => (
              <DashboardActionCard
                key={action.to}
                title={action.title}
                description={action.description}
                to={action.to}
              />
            ))}
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}

function SuperAdminDashboard({ data }: { data: SuperAdminDashboardData }) {
  const activeCompanies = data.companies.filter(
    (company) => (company.status || "").toUpperCase() === "ACTIVE"
  ).length;
  const pendingKycCount =
    parseCount(data.kycStats?.pending_count) ||
    data.companies.filter(
      (company) => (company.status || "").toUpperCase() === "PENDING_KYC"
    ).length;
  const pendingCompanyApprovals = data.companies.filter(
    (company) =>
      (company.status || "").toUpperCase() === "PENDING_ADMIN_APPROVAL"
  ).length;
  const pendingBranchApprovals = data.branches.filter(
    (branch) => (branch.status || "").toUpperCase() === "PENDING_ADMIN_APPROVAL"
  ).length;

  const metrics: DashboardMetric[] = [
    {
      label: "Restaurants",
      value: data.companies.length,
      hint: `${activeCompanies} active right now`,
    },
    {
      label: "Active Restaurants",
      value: activeCompanies,
      hint: "Approved and customer-visible",
      tone: "positive",
    },
    {
      label: "Pending KYC",
      value: pendingKycCount,
      hint: `${parseCount(data.kycStats?.total_count)} total KYC records`,
      tone: pendingKycCount > 0 ? "warning" : "positive",
    },
    {
      label: "Company Approvals",
      value: pendingCompanyApprovals,
      hint: "Awaiting admin review",
      tone: pendingCompanyApprovals > 0 ? "warning" : "positive",
    },
    {
      label: "Branches",
      value: data.branches.length,
      hint: `${pendingBranchApprovals} pending approval`,
    },
    {
      label: "Reservations",
      value: data.reservations.length,
      hint: "Current scoped history sample",
    },
  ];

  const companyStatusData = buildCountSeries(
    data.companies.map((company) => normalizeStatusLabel(company.status)),
    { top: 5 }
  );
  const branchStatusData = buildCountSeries(
    data.branches.map((branch) => normalizeStatusLabel(branch.status)),
    { top: 5 }
  );
  const reservationTrendData = buildDailySeries(data.reservations, 14);
  const topCompaniesData = buildCountSeries(
    data.reservations.map((reservation) => reservation.companyName || "Unknown"),
    { top: 5 }
  );

  const pendingKycItems: DashboardListItem[] =
    data.pendingKyc.length > 0
      ? data.pendingKyc.slice(0, 5).map((item) => ({
          title: toText(item.company_name) || "Restaurant awaiting KYC",
          subtitle: toText(item.company_slug) || "No slug yet",
          meta: normalizeStatusLabel(toText(item.kyc_status) || "pending"),
          tone: "warning",
          to: "/companies",
        }))
      : data.companies
          .filter((company) => (company.status || "").toUpperCase() === "PENDING_KYC")
          .slice(0, 5)
          .map((company) => ({
            title: company.name,
            subtitle: company.slug,
            meta: normalizeStatusLabel(company.status),
            tone: "warning",
            to: "/companies",
          }));

  const approvalQueueItems: DashboardListItem[] = [
    ...data.companies
      .filter((company) =>
        (company.status || "").toUpperCase().includes("PENDING")
      )
      .slice(0, 3)
      .map((company) => ({
        title: company.name,
        subtitle: `${company.slug} - Restaurant`,
        meta: normalizeStatusLabel(company.status),
        tone: getStatusTone(company.status),
        to: "/companies",
      })),
    ...data.branches
      .filter((branch) =>
        (branch.status || "").toUpperCase().includes("PENDING")
      )
      .slice(0, 3)
      .map((branch) => ({
        title: branch.name,
        subtitle: `${branch.companyName || "Restaurant"} - Branch`,
        meta: normalizeStatusLabel(branch.status),
        tone: getStatusTone(branch.status),
        to: "/branches",
      })),
  ];

  const deliveryItems: DashboardListItem[] = data.failedDeliveries
    .slice(0, 6)
    .map((item) => ({
      title: formatEventType(item.event_type),
      subtitle: [
        toText(item.channel)?.toUpperCase(),
        toText(item.recipient),
        toText(item.provider),
      ]
        .filter(Boolean)
        .join(" - "),
      meta: toText(item.last_error) || normalizeStatusLabel(toText(item.status)),
      tone: "danger",
    }));

  const messagingItems = buildMessagingItems(data.messagingStatus);

  return (
    <>
      <section className="dashboard-grid dashboard-kpi-grid">
        {metrics.map((metric) => (
          <DashboardMetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <section className="dashboard-grid dashboard-main-grid">
        <DashboardLineChartCard
          title="Reservation Trend"
          subtitle="Bookings scheduled over the last 14 days."
          data={reservationTrendData}
          emptyText="Reservation activity will appear here as bookings come in."
        />

        <DashboardDonutChartCard
          title="Restaurant Status Mix"
          subtitle="Where companies currently sit in the onboarding lifecycle."
          data={companyStatusData}
          emptyText="No restaurant status data is available yet."
        />
      </section>

      <section className="dashboard-grid dashboard-secondary-grid">
        <DashboardBarChartCard
          title="Top Restaurants By Reservations"
          subtitle="Highest booking volume in the current result set."
          data={topCompaniesData}
          emptyText="No reservation volume has been recorded yet."
        />

        <DashboardBarChartCard
          title="Branch Status Mix"
          subtitle="Operational state across all managed branches."
          data={branchStatusData}
          emptyText="Branch status counts will appear once branches exist."
        />
      </section>

      <section className="dashboard-grid dashboard-secondary-grid">
        <DashboardListCard
          title="Pending KYC Queue"
          subtitle="Restaurants waiting on compliance completion."
          items={pendingKycItems}
          emptyText="No KYC submissions are waiting right now."
        />

        <DashboardListCard
          title="Approval Queue"
          subtitle="Profiles that still need admin attention."
          items={approvalQueueItems}
          emptyText="No company or branch approvals are waiting."
        />
      </section>

      <section className="dashboard-grid dashboard-secondary-grid">
        <DashboardListCard
          title="Messaging Health"
          subtitle="Current provider readiness for outbound channels."
          items={messagingItems}
          emptyText="Provider health data is unavailable at the moment."
        />

        <DashboardListCard
          title="Recent Delivery Failures"
          subtitle="Latest notification sends that need review."
          items={deliveryItems}
          emptyText="No recent delivery failures were returned."
        />
      </section>
    </>
  );
}

function CompanyDashboard({ data }: { data: CompanyDashboardData }) {
  const activeBranches = data.branches.filter(
    (branch) => (branch.status || "").toUpperCase() === "ACTIVE"
  ).length;
  const attentionBranches = data.branches.filter((branch) =>
    ["PENDING_PROFILE", "PENDING_ADMIN_APPROVAL", "BLOCKED"].includes(
      (branch.status || "").toUpperCase()
    )
  ).length;
  const actionableReservations = data.reservations.filter(isActionableReservation);
  const todayReservations = getTodayReservations(actionableReservations);
  const upcomingWeekCount = actionableReservations.filter((reservation) =>
    isInNextDays(reservation.reservationTime, 7)
  ).length;

  const metrics: DashboardMetric[] = [
    {
      label: "Branches",
      value: data.branches.length,
      hint: `${activeBranches} active branches`,
    },
    {
      label: "Active Branches",
      value: activeBranches,
      hint: "Customer-ready branch profiles",
      tone: "positive",
    },
    {
      label: "Needs Attention",
      value: attentionBranches,
      hint: "Pending profile, approval, or blocked",
      tone: attentionBranches > 0 ? "warning" : "positive",
    },
    {
      label: "Staff",
      value: data.staff.length,
      hint: "People inside current restaurant scope",
    },
    {
      label: "Today Reservations",
      value: todayReservations.length,
      hint: "Actionable bookings scheduled today",
    },
    {
      label: "Upcoming 7 Days",
      value: upcomingWeekCount,
      hint: "Forward-looking reservation workload",
    },
  ];

  const reservationTrendData = buildDailySeries(actionableReservations, 14);
  const reservationsByBranchData = buildCountSeries(
    actionableReservations.map(
      (reservation) => reservation.branchName || "Unknown Branch"
    ),
    { top: 6 }
  );
  const statusMixData = buildCountSeries(
    data.reservations.map((reservation) => normalizeStatusLabel(reservation.status)),
    { top: 6 }
  );

  const attentionItems: DashboardListItem[] = data.branches
    .filter((branch) =>
      ["PENDING_PROFILE", "PENDING_ADMIN_APPROVAL", "BLOCKED"].includes(
        (branch.status || "").toUpperCase()
      )
    )
    .slice(0, 6)
    .map((branch) => ({
      title: branch.name,
      subtitle: [branch.city, branch.email, branch.phone]
        .filter(Boolean)
        .join(" - "),
      meta: normalizeStatusLabel(branch.status),
      tone: getStatusTone(branch.status),
      to: "/branches",
    }));

  const upcomingItems = getUpcomingReservationItems(actionableReservations, 6);

  return (
    <>
      <section className="dashboard-grid dashboard-kpi-grid">
        {metrics.map((metric) => (
          <DashboardMetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <section className="dashboard-grid dashboard-main-grid">
        <DashboardLineChartCard
          title="Reservation Trend"
          subtitle={`Booking pace for ${data.companyName} over the last 14 days.`}
          data={reservationTrendData}
          emptyText="Reservation trend data will appear here once bookings are scheduled."
        />

        <DashboardDonutChartCard
          title="Reservation Status Mix"
          subtitle="Current state across all visible company reservations."
          data={statusMixData}
          emptyText="Reservation statuses are not available yet."
        />
      </section>

      <section className="dashboard-grid dashboard-secondary-grid">
        <DashboardBarChartCard
          title="Reservations By Branch"
          subtitle="The busiest branches in the current company scope."
          data={reservationsByBranchData}
          emptyText="Branch activity will show up here once reservations exist."
        />

        <DashboardListCard
          title="Branches Needing Attention"
          subtitle="Keep profile work and approvals moving."
          items={attentionItems}
          emptyText="Every visible branch looks healthy right now."
        />
      </section>

      <section className="dashboard-grid dashboard-secondary-grid">
        <DashboardListCard
          title="Upcoming Reservations"
          subtitle="The next bookings your team will handle."
          items={upcomingItems}
          emptyText="There are no upcoming actionable reservations right now."
        />

        <DashboardListCard
          title="Team Snapshot"
          subtitle="A quick look at the people currently inside restaurant scope."
          items={data.staff.slice(0, 6).map((member) => ({
            title: member.displayName,
            subtitle: [member.email, member.mobileE164].filter(Boolean).join(" - "),
            meta: member.isSuperAdmin ? "Super Admin" : "Staff member",
            tone: member.isSuperAdmin ? "warning" : "default",
          }))}
          emptyText="No staff records were returned for this restaurant."
        />
      </section>
    </>
  );
}

function BranchDashboard({ data }: { data: BranchDashboardData }) {
  const actionableReservations = data.reservations.filter(isActionableReservation);
  const todayReservations = getTodayReservations(actionableReservations);
  const checkedInToday = todayReservations.filter((reservation) =>
    ["CHECKED_IN", "COMPLETED"].includes((reservation.status || "").toUpperCase())
  ).length;
  const cancelledOrNoShowToday = getTodayReservations(data.reservations).filter(
    (reservation) =>
      ["CANCELLED", "NO_SHOW"].includes((reservation.status || "").toUpperCase())
  ).length;
  const averagePartySize = average(
    todayReservations
      .map((reservation) => reservation.partySize ?? 0)
      .filter((partySize) => partySize > 0)
  );
  const reservableTables = data.floorTables.filter((table) => table.isReservable);
  const estimatedSeatCapacity = reservableTables.reduce(
    (total, table) => total + (table.maxPartySize ?? 0),
    0
  );
  const openDays = data.openingHours.filter(isOpenDay).length;
  const todayHours =
    data.openingHours.find((hour) => hour.dayOfWeek === new Date().getDay()) ?? null;

  const metrics: DashboardMetric[] = [
    {
      label: "Today Reservations",
      value: todayReservations.length,
      hint: "Actionable bookings scheduled today",
    },
    {
      label: "Next 2 Hours",
      value: actionableReservations.filter((reservation) =>
        isInNextHours(reservation.reservationTime, 2)
      ).length,
      hint: "Guests arriving soon",
    },
    {
      label: "Checked In Today",
      value: checkedInToday,
      hint: "Guests already seated or completed",
      tone: checkedInToday > 0 ? "positive" : "default",
    },
    {
      label: "Cancelled / No-show",
      value: cancelledOrNoShowToday,
      hint: "Today only",
      tone: cancelledOrNoShowToday > 0 ? "warning" : "positive",
    },
    {
      label: "Average Party Size",
      value:
        averagePartySize > 0 ? `${averagePartySize.toFixed(1)} guests` : "0 guests",
      hint: "Based on today's scheduled bookings",
    },
    {
      label: "Reservable Tables",
      value: reservableTables.length,
      hint: `${formatCompactNumber(estimatedSeatCapacity)} estimated seats`,
    },
  ];

  const hourlyTrendData = buildHourlySeries(actionableReservations);
  const sevenDayTrendData = buildDailySeries(actionableReservations, 7);
  const statusMixData = buildCountSeries(
    data.reservations.map((reservation) => normalizeStatusLabel(reservation.status)),
    { top: 6 }
  );
  const tableMixData = buildCountSeries(
    reservableTables.map((table) => table.type || "Other"),
    { top: 5 }
  );

  const readinessItems: DashboardListItem[] = [
    {
      title: "Profile Status",
      subtitle: data.branch?.companyName || "Active branch workspace",
      meta: normalizeStatusLabel(data.branch?.status),
      tone: getStatusTone(data.branch?.status),
    },
    {
      title: "Published Floorplan",
      subtitle: data.floorplanVersion
        ? `Version ${data.floorplanVersion.versionNo}`
        : "No published floorplan yet",
      meta: data.floorplanVersion ? "Ready" : "Missing",
      tone: data.floorplanVersion ? "positive" : "warning",
    },
    {
      title: "Opening Hours",
      subtitle:
        todayHours && isOpenDay(todayHours)
          ? `${todayHours.openTime} - ${todayHours.closeTime} today`
          : "Closed today or not configured",
      meta: `${openDays} open days this week`,
      tone: openDays > 0 ? "positive" : "warning",
    },
    {
      title: "Table Capacity",
      subtitle: `${reservableTables.length} reservable tables`,
      meta: `${estimatedSeatCapacity} estimated seats`,
    },
  ];

  const upcomingItems = getUpcomingReservationItems(actionableReservations, 6);

  return (
    <>
      <section className="dashboard-grid dashboard-kpi-grid">
        {metrics.map((metric) => (
          <DashboardMetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <section className="dashboard-grid dashboard-main-grid">
        <DashboardLineChartCard
          title="Reservations By Hour"
          subtitle="Today's booking load spread across the day."
          data={hourlyTrendData}
          emptyText="No reservations are scheduled for today yet."
        />

        <DashboardDonutChartCard
          title="Reservation Status Mix"
          subtitle="Current status balance for this branch."
          data={statusMixData}
          emptyText="Status breakdown will appear once reservations exist."
        />
      </section>

      <section className="dashboard-grid dashboard-secondary-grid">
        <DashboardLineChartCard
          title="7-Day Booking Trend"
          subtitle="Short-horizon demand for the active branch."
          data={sevenDayTrendData}
          emptyText="Seven-day trend data will appear once bookings are scheduled."
        />

        <DashboardBarChartCard
          title="Table Mix"
          subtitle="Reservable table templates currently published."
          data={tableMixData}
          emptyText="Publish a floorplan to see table mix and capacity."
        />
      </section>

      <section className="dashboard-grid dashboard-secondary-grid">
        <DashboardListCard
          title="Upcoming Arrivals"
          subtitle="The next guests the branch team should prepare for."
          items={upcomingItems}
          emptyText="No upcoming actionable reservations were found."
        />

        <DashboardListCard
          title="Branch Readiness"
          subtitle="A compact operational checklist for the active branch."
          items={readinessItems}
          emptyText="Branch readiness details are not available yet."
        />
      </section>
    </>
  );
}
