import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useParams } from "react-router-dom";
import { publicPaymentRequestsService, type PublicPaymentRequest } from "../../services/payment-requests.service";
import "./payment-request.css";

function remainingTime(expiresAt: string, now: number) {
  const seconds = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / 1000));
  return [Math.floor(seconds / 3600), Math.floor(seconds % 3600 / 60), seconds % 60]
    .map(value => String(value).padStart(2, "0")).join(":");
}
function requestPresentation(data: PublicPaymentRequest, now: number) {
  if (data.status === "PAID") return data.resolution === "NEEDS_REFUND"
    ? { title: "Payment received · review needed", body: "Your payment was received, but could not be applied to this reservation. Please contact the restaurant. No further payment is needed.", payable: false }
    : { title: "Payment received", body: data.requiresConfirmation ? "Your reservation is confirmed. We look forward to welcoming you." : "Thank you. Your reservation payment is complete.", payable: false };
  if (data.status === "CANCELED") return { title: "This request is no longer active", body: "The restaurant canceled or replaced this payment request. Please use the latest link they shared.", payable: false };
  if (data.status === "EXPIRED" || new Date(data.expiresAt).getTime() <= now) return { title: "This payment link has expired", body: "Please contact the restaurant for help with your reservation. Do not make another payment on this link.", payable: false };
  if (data.unavailable) return { title: "Payment temporarily unavailable", body: "The restaurant is updating this request. Please check again shortly.", payable: false };
  return { title: data.type === "FULL_AMOUNT" ? "Reservation payment" : data.type === "DEPOSIT" ? "Reservation deposit" : "Payment requested",
    body: data.status === "PROCESSING" ? "If you have already paid, wait here while we confirm your payment. Otherwise, you can resume secure checkout." : "Review your reservation and pay securely to complete this request.", payable: true };
}

export default function PaymentRequestPage() {
  const { token = "" } = useParams();
  return <PaymentRequestContent key={token} token={token} />;
}

function PaymentRequestContent({ token }: { token: string }) {
  const [data, setData] = useState<PublicPaymentRequest | null>(null);
  const [error, setError] = useState("");
  const [payError, setPayError] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const serverOffset = useRef(0);
  const fetchGeneration = useRef(0);
  const currentData = useRef<PublicPaymentRequest | null>(null);
  const refresh = useCallback(async () => {
    const generation = ++fetchGeneration.current;
    try {
      const result = await publicPaymentRequestsService.get(token);
      if (generation !== fetchGeneration.current) return;
      serverOffset.current = new Date(result.serverTime).getTime() - Date.now();
      setNow(Date.now() + serverOffset.current);
      currentData.current = result;
      setData(result); setError("");
    } catch (err) {
      if (generation === fetchGeneration.current) setError(err instanceof Error ? err.message : "Unable to load this payment request.");
    }
  }, [token]);
  const invalidateFetch = useCallback(() => { fetchGeneration.current++; }, []);
  useEffect(() => {
    let stopped = false, polls = 0;
    let timeout: ReturnType<typeof setTimeout>;
    currentData.current = null;
    const poll = async () => {
      await refresh();
      if (stopped) return;
      if (!["PAID","CANCELED","EXPIRED"].includes(currentData.current?.status || "")) {
        timeout = setTimeout(() => void poll(), Math.min(2500 * 1.3 ** polls++, 15000));
      }
    };
    void poll();
    const visible = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", visible);
    return () => { stopped = true; invalidateFetch(); clearTimeout(timeout); document.removeEventListener("visibilitychange", visible); };
  }, [refresh, invalidateFetch]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now() + serverOffset.current), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots"; meta.content = "noindex, nofollow"; document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
  const pay = async () => {
    setBusy(true); setPayError("");
    try {
      const result = await publicPaymentRequestsService.checkout(token);
      const url = new URL(result.checkoutUrl);
      if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com") throw new Error("Secure checkout is temporarily unavailable.");
      window.location.assign(url.href);
    } catch (err) { setPayError(err instanceof Error ? err.message : "Unable to open checkout."); setBusy(false); void refresh(); }
  };
  if (!data) return <main className="guest-payment"><section className="guest-payment-card" aria-live="polite">
    <span className="guest-payment-eyebrow">Reservation payment</span>
    <h1>{error ? "Payment link unavailable" : "Loading your reservation…"}</h1>
    {error && <><p role="alert">{error}</p><button onClick={() => void refresh()}>Try again</button></>}
  </section></main>;
  const view = requestPresentation(data, now);
  const formatter = new Intl.NumberFormat(undefined, { style: "currency", currency: data.currency });
  const amount = formatter.format(data.amountMinor / 10 ** (formatter.resolvedOptions().maximumFractionDigits ?? 2));
  const date = new Date(data.reservation.startsAt);
  const accent = /^#[0-9a-f]{6}$/i.test(data.restaurant.accent || "") ? data.restaurant.accent : "#263d32";
  return <main className="guest-payment" style={{ "--payment-accent": accent } as CSSProperties}>
    <header className="guest-payment-brand">
      {data.restaurant.logoUrl && <img src={data.restaurant.logoUrl} alt="" referrerPolicy="no-referrer" />}
      <span>{data.restaurant.name}</span>
    </header>
    <section className="guest-payment-card">
      <span className="guest-payment-eyebrow">Your reservation · {data.reservation.reference}</span>
      <h1>{view.title}</h1>
      <p className="guest-payment-intro" aria-live="polite">{view.body}</p>
      <dl className="guest-payment-details">
        <div><dt>Date</dt><dd>{date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: data.branch.timezone })}</dd></div>
        <div><dt>Time</dt><dd>{date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", timeZone: data.branch.timezone })} <small>{data.branch.timezone}</small></dd></div>
        <div><dt>Party</dt><dd>{data.reservation.partySize} guests</dd></div>
        <div><dt>Location</dt><dd>{data.branch.name}<small>{data.branch.address}</small></dd></div>
      </dl>
      <div className="guest-payment-amount"><span>{data.reason}</span><strong>{amount}</strong></div>
      {view.payable && <>
        <div className="guest-payment-countdown"><span>This payment link expires in</span><strong>{remainingTime(data.expiresAt, now)}</strong></div>
        {data.requiresConfirmation && <p className="guest-payment-note">Your table is held until this deadline. Payment is required to confirm it.</p>}
        <button disabled={busy || !!error} onClick={() => void pay()}>{busy ? "Opening secure checkout…" : `Pay ${amount}`}<span aria-hidden="true"> →</span></button>
        <p className="guest-payment-secure">Secure checkout with Stripe · Paid directly to {data.restaurant.name}</p>
      </>}
      {(error || payError) && <div role="alert" className="guest-payment-error"><p>{payError || error}</p><button className="guest-payment-retry" onClick={() => void refresh()}>Refresh status</button></div>}
    </section>
    <footer className="guest-payment-footer">Reservations by Tavlo</footer>
  </main>;
}
