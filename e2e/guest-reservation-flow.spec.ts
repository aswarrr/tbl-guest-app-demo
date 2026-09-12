import { expect, test, type Page, type Route } from "@playwright/test";

const apiOrigin = "http://127.0.0.1:4006";
const branchOne = "c9e2fc03-2be0-4b00-a18b-a83433729d53";
const branchTwo = "b7c269f6-fa7e-45b9-8e70-6f753fd42abc";
const slug = "sizzler-steak-house-and-co";
const company = { id: "company-1", name: "Sizzler Steak House & Co.", slug, about: "A steakhouse.", logoUrl: null, coverUrl: null, currency: "EGP", cuisineName: "Steakhouse" };
// Staff hold roles elsewhere in the platform; they are still ordinary diners here.
const adminUser = { id: "admin-1", email: "boss@tbl.test", isSuperAdmin: true, companyRoles: [{ companyId: "company-1", roleName: "restaurant_manager" }], branchRoles: [] };
const menu = { currency: "EGP", updatedAt: null, sections: [{ name: "Starters", eyebrow: "To begin", anchor: "starters", items: [{ name: "Charred Aubergine", description: "Tahini.", price: 180, tags: ["Vegetarian"], available: true, imageUrl: null }] }] };
const policy = { depositRequired: true, depositAmount: 200, depositCurrency: "EGP", bookingCutoffHours: 2, freeCancelWindowHours: 24, gracePeriodMinutes: 15, minPartySize: 1, maxPartySize: 8, minReservationDurationMinutes: 60, maxReservationDurationMinutes: 90, cancellationWindowHours: 24, lateCancelRefundPercent: 0, noShowRefundPercent: 0, turnTimeMinutes: 15 };
const branches = [
  { id: branchOne, companyId: "company-1", name: "Sizzler Steakhouse - CFC Mall", companyName: "Sizzler Steak House & Co.", companySlug: "sizzler-steak-house-and-co", cuisineName: "Steakhouse", coverImageUrl: "https://example.test/cfc.jpg", addressSummary: "Cairo Festival City Mall, Cairo, Egypt", phone: "+201000000001", timezone: "Africa/Cairo", isOpen: true, policySummary: policy },
  { id: branchTwo, companyId: "company-1", name: "Sizzler Steakhouse - Open Air Mall", companyName: "Sizzler Steak House & Co.", companySlug: "sizzler-steak-house-and-co", cuisineName: "Steakhouse", coverImageUrl: "https://example.test/oam.jpg", addressSummary: "Open Air Mall, Cairo, Egypt", phone: "+201000000002", timezone: "Africa/Cairo", isOpen: false, policySummary: policy },
];

function detail(branch: (typeof branches)[number]) {
  return { ...branch, about: "Sizzler is Cairo's original specialized steakhouse, serving memorable tables since 2014.", email: "hello@sizzler.test", hours: Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, dayLabel: "Day", isClosed: false, openTime: "10:00:00", closeTime: "22:00:00", summary: "10:00 - 22:00" })), amenities: [{ id: "amenity-1", name: "Outdoor Seating", slug: "outdoor-seating" }], tags: [{ id: "tag-1", name: "Family Friendly", slug: "family-friendly" }], photos: [{ id: `photo-${branch.id}`, url: branch.coverImageUrl, kind: "INTERIOR", caption: null, sortOrder: 0 }], policies: policy };
}

async function json(route: Route, body: unknown, status = 200) {
  await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body), headers: { "access-control-allow-origin": "*" } });
}

async function installApiMock(page: Page) {
  await page.route("https://example.test/**", (route) => route.fulfill({ status: 200, contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600"><rect width="100%" height="100%" fill="#7d202c"/></svg>' }));
  await page.route(`${apiOrigin}/api/**`, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*" } });
    if (path === "/api/auth/login/email") return json(route, { ok: true, data: { accessToken: "admin-access", refreshToken: "admin-refresh" } });
    if (path === "/api/auth/me") return json(route, { ok: true, data: adminUser });
    if (path === "/api/mobile/tenants") return json(route, { ok: true, data: [company] });
    if (path === `/api/companies/slug/${slug}`) return json(route, { ok: true, data: company });
    if (path === `/api/mobile/tenants/${slug}/menu`) return json(route, { ok: true, data: menu });
    if (path === "/api/mobile/branches") {
      // The API filters by company; the mock honours it so a wrong slug is empty.
      const wanted = new URL(request.url()).searchParams.get("companySlug");
      return json(route, { ok: true, data: wanted === slug ? branches : [] });
    }
    if (path === `/api/mobile/branches/${branchOne}`) return json(route, { ok: true, data: detail(branches[0]) });
    if (path === `/api/mobile/branches/${branchTwo}`) return json(route, { ok: true, data: detail(branches[1]) });
    if (path.endsWith("/blind-availability")) return json(route, { ok: true, data: { isOpen: true, times: ["19:00", "19:30", "20:00"] } });
    if (path.endsWith("/floors-availability")) return json(route, { ok: true, data: { isOpen: true, floors: [{ id: "floor-1", name: "Indoor", tables: [{ id: "table-1", name: "T12", type: "SINGLE", tableIds: ["table-1"], availableTimes: ["19:00"] }, { id: "combo-1", name: "T14 + T15", type: "COMBO", tableIds: ["table-2", "table-3"], availableTimes: ["19:00"] }] }] } });
    return json(route, { error: { message: `Unhandled endpoint ${path}` } }, 404);
  });
}

test.beforeEach(async ({ page }) => installApiMock(page));

test("a restaurant is publicly browsable at its own slug", async ({ page }) => {
  await page.goto(`/${slug}`);
  await expect(page.getByRole("heading", { name: company.name, level: 1 })).toBeVisible();
  await expect(page.getByText("2 locations, one warm welcome.")).toBeVisible();
  await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Menu", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/${slug}/menu$`));
  await expect(page.getByRole("heading", { name: "The menu" })).toBeVisible();
  // Real published items, and no trace of the old sample disclaimer.
  await expect(page.getByRole("heading", { name: "Charred Aubergine" })).toBeVisible();
  await expect(page.getByText(/Sample menu/)).toHaveCount(0);
});

test("the host root lists restaurants and links into one", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: new RegExp(company.name) }).click();
  await expect(page).toHaveURL(new RegExp(`/${slug}$`));
});

test("guest can choose a real available table before authentication", async ({ page }) => {
  await page.goto(`/${slug}/reserve?branch=${branchTwo}`);
  await expect(page.getByRole("heading", { name: "Choose a location" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("button", { name: "7:00 PM" })).toBeVisible();
  await page.getByRole("button", { name: "7:00 PM" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Choose your table" })).toBeVisible();
  await page.getByRole("button", { name: /T14 \+ T15/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Review your reservation" })).toBeVisible();
  await expect(page.getByText("T14 + T15 · Indoor")).toBeVisible();
  // A deposit is due, so a payment method must be chosen before confirming.
  await page.getByRole("radio", { name: /Card/ }).click();
  await page.getByRole("button", { name: "Sign in to confirm" }).click();
  await expect(page).toHaveURL((url) => {
    // Sign-in stays inside this restaurant, and so does the return path.
    return (
      url.pathname === `/${slug}/auth/login` &&
      (url.searchParams.get("returnTo") ?? "").startsWith(`/${slug}/reserve`)
    );
  });
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
  const draft = await page.evaluate(() => sessionStorage.getItem("tbl.restaurant-reservation-draft.v1:sizzler-steak-house-and-co"));
  expect(draft).toContain('"tableIds":["table-2","table-3"]');
});

test("a super admin can sign in to book a table like any other guest", async ({ page }) => {
  await page.goto(`/${slug}/auth/login`);
  await page.getByRole("button", { name: "Email", exact: true }).click();
  await page.getByPlaceholder("Email").fill(adminUser.email);
  await page.getByPlaceholder("Password").fill("whatever");
  await page.getByRole("button", { name: "Login", exact: true }).click();

  // Previously the app cleared the tokens and refused staff accounts outright.
  await expect(page.getByText(/must use the admin app/i)).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`/${slug}`));
  await expect(
    page.getByRole("navigation", { name: "Primary" }).getByRole("button", { name: "Sign out" }),
  ).toBeVisible();
});
