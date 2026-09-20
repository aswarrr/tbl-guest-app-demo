import { useEffect, useRef, useState } from "react";
import { customerService } from "../../white-label/customer.service";
import type { CustomerReservation, PaymentProvider } from "../../white-label/types";
import StripePaymentForm from "./StripePaymentForm";
import useTenantPath from "../../hooks/useTenantPath";

type Props = {
  paymentId: string;
  reservation: CustomerReservation;
  provider?: PaymentProvider;
  /** Paymob: the Unified Checkout URL to frame. */
  checkoutUrl?: string | null;
  /** Stripe: what the Payment Element mounts from. */
  clientSecret?: string | null;
  publishableKey?: string | null;
  connectedAccountId?: string | null;
  onSuccess: (reservation: CustomerReservation) => void;
  onClose: () => void;
};

/**
 * The checkout shell.
 *
 * POLLING IS THE SUCCESS CHANNEL, for both providers. A payment is confirmed by
 * the provider's webhook reaching our server — not by the guest's browser
 * saying so — and this poll is how the page observes that. Stripe's
 * confirmPayment() resolving only means the card was accepted; the reservation
 * is still unconfirmed until the webhook lands. Keeping the poll in the shell
 * rather than in either provider's component is what lets both rails share one
 * definition of "done".
 */
export default function PaymentModal({
  paymentId,
  reservation,
  provider = "PAYMOB",
  checkoutUrl,
  clientSecret,
  publishableKey,
  connectedAccountId,
  onSuccess,
  onClose,
}: Props) {
  const [statusText, setStatusText] = useState("Waiting for secure payment…");
  const [error, setError] = useState("");
  const finishedRef = useRef(false);
  const tenantPath = useTenantPath();

  useEffect(() => {
    let cancelled = false;
    let timeoutId = 0;

    const poll = async () => {
      try {
        const payment = await customerService.getPaymentStatus(paymentId);
        if (cancelled || finishedRef.current) return;

        if (payment.status === "SUCCEEDED") {
          finishedRef.current = true;
          setStatusText("Payment received. Confirming your table…");
          onSuccess(payment.reservation || { ...reservation, status: "CONFIRMED" });
          return;
        }

        if (payment.status === "FAILED") {
          setError("Payment was not completed. You can retry from the secure checkout.");
        } else if (payment.status === "NEEDS_REFUND") {
          finishedRef.current = true;
          setError("Your payment was received after the table hold expired. The restaurant system has marked it for refund.");
          return;
        }
      } catch {
        setStatusText("Payment status will update automatically when the checkout completes.");
      }

      timeoutId = window.setTimeout(poll, 2500);
    };

    timeoutId = window.setTimeout(poll, 1800);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [onSuccess, paymentId, reservation]);

  const isStripe = provider === "STRIPE";
  const canRenderStripe = isStripe && clientSecret && publishableKey && connectedAccountId;

  // Redirect-based methods (some wallets, some local methods) leave the page.
  // They return to the confirmation route, which already resolves a reservation
  // from sessionStorage or a fresh fetch. Built through tenantPath so the guest
  // comes back inside the restaurant they were booking, not the bare app.
  const returnUrl = `${window.location.origin}${tenantPath(`reservation/${reservation.id}/confirmation`)}`;

  return (
    <div className="wl-payment-backdrop" role="dialog" aria-modal="true" aria-labelledby="payment-title">
      <div className="wl-payment-modal">
        <header>
          <div><span className="wl-kicker">Encrypted checkout</span><h2 id="payment-title">Secure your table</h2></div>
          <button type="button" onClick={onClose} aria-label="Close payment checkout">×</button>
        </header>
        <div className="wl-payment-status" aria-live="polite"><span className="wl-pulse" />{statusText}</div>
        {error ? <div className="wl-inline-error">{error}</div> : null}

        {canRenderStripe ? (
          <StripePaymentForm
            clientSecret={clientSecret}
            publishableKey={publishableKey}
            connectedAccountId={connectedAccountId}
            returnUrl={returnUrl}
            onSubmitted={() => setStatusText("Payment submitted. Confirming your table…")}
          />
        ) : isStripe ? (
          // Stripe was selected but its configuration did not arrive. Better a
          // clear message than an empty modal the guest waits at.
          <div className="wl-inline-error">
            Secure payment could not be prepared. Please close this and try again.
          </div>
        ) : (
          <>
            <iframe className="wl-payment-frame" src={checkoutUrl || ""} title="Secure checkout" allow="payment" />
            <footer>
              <span>Checkout not visible?</span>
              <a href={checkoutUrl || ""} target="_blank" rel="noreferrer">Open it in a separate window</a>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
