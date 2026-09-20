export type PublicPaymentRequest = {
  restaurant: { name: string; logoUrl: string | null; accent: string | null };
  branch: { name: string; address: string; timezone: string };
  reservation: { reference: string; startsAt: string; partySize: number };
  amountMinor: number; currency: string; type: "DEPOSIT" | "FULL_AMOUNT" | "CUSTOM";
  reason: string; expiresAt: string; serverTime: string;
  status: "AWAITING_PAYMENT" | "PROCESSING" | "PAID" | "EXPIRED" | "CANCELED";
  resolution: string | null; unavailable: boolean; requiresConfirmation: boolean;
};
const base = (import.meta.env.VITE_API_BASE_URL || "http://localhost:4006").replace(/\/$/, "");
async function request<T>(token: string, checkout = false): Promise<T> {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new Error("This payment link is not valid.");
  const response = await fetch(`${base}/api/public/payment-requests/${encodeURIComponent(token)}${checkout ? "/checkout" : ""}`, {
    method: checkout ? "POST" : "GET", credentials: "omit", cache: "no-store", referrerPolicy: "no-referrer",
  });
  const body = await response.json();
  if (!response.ok || body.ok === false) throw new Error(body.error?.message || "This payment link is temporarily unavailable.");
  return body.data as T;
}
export const publicPaymentRequestsService = {
  get: (token: string) => request<PublicPaymentRequest>(token),
  checkout: (token: string) => request<{ checkoutUrl: string }>(token, true),
};
