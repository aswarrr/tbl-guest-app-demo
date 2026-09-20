import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock("../../src/services/api", () => ({ api: apiMock }));

import { customerService } from "../../src/white-label/customer.service";

describe("white-label customer API", () => {
  beforeEach(() => {
    apiMock.get.mockReset();
    apiMock.post.mockReset();
  });

  it("asks the API for one restaurant's branches instead of the whole catalog", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { ok: true, data: [
      { id: "s1", companySlug: "sizzler-steak-house-and-co" },
    ] } });

    await expect(customerService.listTenantBranches("sizzler-steak-house-and-co")).resolves.toEqual([
      { id: "s1", companySlug: "sizzler-steak-house-and-co" },
    ]);
    // One request, filtered server-side: paging the platform and discarding
    // other companies in the browser does not scale past the first page.
    expect(apiMock.get).toHaveBeenCalledTimes(1);
    expect(apiMock.get).toHaveBeenCalledWith("/api/mobile/branches", {
      params: { companySlug: "sizzler-steak-house-and-co", limit: 100 },
      skipGlobalLoading: true,
    });
  });

  it("reads restaurant branding by slug from the public company endpoint", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { ok: true, data: { slug: "farida-steakhouse", name: "Farida" } } });

    await expect(customerService.getCompany("farida-steakhouse")).resolves.toMatchObject({
      name: "Farida",
    });
    expect(apiMock.get).toHaveBeenCalledWith("/api/companies/slug/farida-steakhouse", {
      skipGlobalLoading: true,
    });
  });

  it("treats an unpublished menu as no menu rather than an error", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { ok: true, data: null } });

    await expect(customerService.getTenantMenu("farida-steakhouse")).resolves.toBeNull();
  });

  it("creates a hold through the mobile contract without changing table IDs", async () => {
    const payload = {
      partySize: 4,
      reservationDate: "2026-09-15",
      reservationTimeLocal: "19:30",
      durationMinutes: 90,
      tableIds: ["table-1", "table-2"],
      specialRequest: "Birthday",
    };
    apiMock.post.mockResolvedValueOnce({ data: { ok: true, data: { id: "reservation-1" } } });

    await customerService.createHold("branch-1", payload);
    expect(apiMock.post).toHaveBeenCalledWith("/api/mobile/branches/branch-1/holds", payload);
  });

  it("uses the supported payment start, status, and direct-confirm endpoints", async () => {
    apiMock.post.mockResolvedValueOnce({ data: { ok: true, data: { paymentId: "payment-1" } } });
    apiMock.get.mockResolvedValueOnce({ data: { ok: true, data: { status: "PENDING" } } });
    apiMock.post.mockResolvedValueOnce({ data: { ok: true, data: { id: "reservation-1", status: "CONFIRMED" } } });

    await customerService.startPayment("reservation-1");
    await customerService.getPaymentStatus("payment-1");
    await customerService.confirmReservation("reservation-1");

    expect(apiMock.post).toHaveBeenNthCalledWith(1, "/api/mobile/payments/start", { reservationId: "reservation-1" });
    expect(apiMock.get).toHaveBeenCalledWith("/api/mobile/payments/payment-1", { skipGlobalLoading: true });
    expect(apiMock.post).toHaveBeenNthCalledWith(2, "/api/mobile/reservations/reservation-1/confirm");
  });

  /**
   * The provider is chosen server-side, per restaurant, and the guest app just
   * renders whichever shape comes back. These two tests pin that both shapes
   * survive the service layer untouched - a dropped clientSecret or
   * connectedAccountId is a payment the Payment Element cannot mount.
   */
  it("passes a Stripe payment session through with its client config intact", async () => {
    apiMock.post.mockResolvedValueOnce({ data: { ok: true, data: {
      paymentId: "payment-1",
      attemptId: "attempt-1",
      provider: "STRIPE",
      checkoutUrl: null,
      clientSecret: "pi_123_secret_abc",
      publishableKey: "pk_test_123",
      connectedAccountId: "acct_rest_1",
    } } });

    await expect(customerService.startPayment("reservation-1")).resolves.toMatchObject({
      provider: "STRIPE",
      // Null, not missing: Stripe hosted Checkout cannot be iframed, so there
      // is no URL to frame and the Payment Element mounts from the secret.
      checkoutUrl: null,
      clientSecret: "pi_123_secret_abc",
      publishableKey: "pk_test_123",
      // Without this Stripe.js is initialized for the platform and cannot
      // confirm an intent created on the restaurant's account.
      connectedAccountId: "acct_rest_1",
    });
  });

  it("still returns a Paymob checkout URL for a restaurant without Stripe", async () => {
    apiMock.post.mockResolvedValueOnce({ data: { ok: true, data: {
      paymentId: "payment-2",
      attemptId: "attempt-2",
      provider: "PAYMOB",
      checkoutUrl: "https://accept.paymob.com/unifiedcheckout/?publicKey=pk&clientSecret=cs",
    } } });

    await expect(customerService.startPayment("reservation-2")).resolves.toMatchObject({
      provider: "PAYMOB",
      checkoutUrl: "https://accept.paymob.com/unifiedcheckout/?publicKey=pk&clientSecret=cs",
    });
  });

  it("exposes the Stripe client config on status, so a reload can resume", async () => {
    // A clientSecret stashed in sessionStorage can go stale; the guest app
    // re-reads this on resume rather than trusting what it stored.
    apiMock.get.mockResolvedValueOnce({ data: { ok: true, data: {
      paymentId: "payment-1",
      status: "PENDING",
      provider: "STRIPE",
      clientSecret: "pi_123_secret_abc",
      publishableKey: "pk_test_123",
      connectedAccountId: "acct_rest_1",
    } } });

    await expect(customerService.getPaymentStatus("payment-1")).resolves.toMatchObject({
      provider: "STRIPE",
      clientSecret: "pi_123_secret_abc",
      connectedAccountId: "acct_rest_1",
    });
  });
});
