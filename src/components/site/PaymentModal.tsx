import { useEffect, useRef, useState } from "react";
import { customerService } from "../../white-label/customer.service";
import type { CustomerReservation } from "../../white-label/types";

type Props = {
  paymentId: string;
  checkoutUrl: string;
  reservation: CustomerReservation;
  onSuccess: (reservation: CustomerReservation) => void;
  onClose: () => void;
};

export default function PaymentModal({ paymentId, checkoutUrl, reservation, onSuccess, onClose }: Props) {
  const [statusText, setStatusText] = useState("Waiting for secure payment…");
  const [error, setError] = useState("");
  const finishedRef = useRef(false);

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

  return (
    <div className="wl-payment-backdrop" role="dialog" aria-modal="true" aria-labelledby="payment-title">
      <div className="wl-payment-modal">
        <header>
          <div><span className="wl-kicker">Encrypted checkout</span><h2 id="payment-title">Secure your table</h2></div>
          <button type="button" onClick={onClose} aria-label="Close payment checkout">×</button>
        </header>
        <div className="wl-payment-status" aria-live="polite"><span className="wl-pulse" />{statusText}</div>
        {error ? <div className="wl-inline-error">{error}</div> : null}
        <iframe className="wl-payment-frame" src={checkoutUrl} title="Secure Paymob checkout" allow="payment" />
        <footer>
          <span>Checkout not visible?</span>
          <a href={checkoutUrl} target="_blank" rel="noreferrer">Open it in a separate window</a>
        </footer>
      </div>
    </div>
  );
}
