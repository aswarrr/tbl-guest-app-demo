import { useEffect, useMemo, useState } from "react";
import { loadStripe, type Stripe, type StripeElementsOptions } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

type Props = {
  clientSecret: string;
  publishableKey: string;
  connectedAccountId: string;
  /** Where a redirect-based method returns the guest. */
  returnUrl: string;
  /** Raised when the guest's card is accepted, before the webhook confirms. */
  onSubmitted: () => void;
};

/**
 * loadStripe memoized per (key, account) pair.
 *
 * Stripe.js must be loaded ONCE per configuration — calling loadStripe on every
 * render re-downloads the script and remounts the iframe, losing whatever the
 * guest has typed. A module-level cache also survives the modal being closed
 * and reopened, which is exactly the "resume payment" path.
 */
const stripeCache = new Map<string, Promise<Stripe | null>>();

function getStripe(publishableKey: string, connectedAccountId: string) {
  const cacheKey = `${publishableKey}::${connectedAccountId}`;
  let instance = stripeCache.get(cacheKey);
  if (!instance) {
    // stripeAccount is not optional here. The PaymentIntent was created as a
    // direct charge ON the restaurant's connected account, and a client
    // initialized for the platform cannot confirm it.
    instance = loadStripe(publishableKey, { stripeAccount: connectedAccountId });
    stripeCache.set(cacheKey, instance);
  }
  return instance;
}

/**
 * The inner form. Must be a child of <Elements> to reach the Stripe context,
 * which is why this is split from the exported component.
 */
function CheckoutForm({ returnUrl, onSubmitted }: Pick<Props, "returnUrl" | "onSubmitted">) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements || submitting) return;

    setSubmitting(true);
    setError("");

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      // Keeps 3D Secure inside this modal for cards that can challenge in
      // place. Only methods that genuinely require leaving the page (and
      // redirect-based wallets) will navigate away, and those come back to
      // return_url.
      redirect: "if_required",
    });

    if (result.error) {
      // card_error and validation_error are the two the guest can act on —
      // a declined card, a mistyped number. Everything else is ours, not
      // theirs, so it gets a neutral message rather than Stripe's internals.
      const message =
        result.error.type === "card_error" || result.error.type === "validation_error"
          ? result.error.message || "Your payment could not be completed."
          : "Something went wrong taking your payment. Please try again.";
      setError(message);
      setSubmitting(false);
      return;
    }

    // Confirmed client-side. Deliberately NOT treated as success: the webhook
    // is what confirms the reservation, and the modal's polling is what
    // observes it. Telling the guest "confirming…" here is honest about the
    // gap; navigating away now would be a lie that occasionally breaks.
    onSubmitted();
  };

  return (
    <form className="wl-stripe-form" onSubmit={handleSubmit}>
      <PaymentElement
        onReady={() => setReady(true)}
        options={{ layout: "tabs" }}
      />
      {error ? <div className="wl-inline-error">{error}</div> : null}
      <button
        className="wl-button wl-stripe-submit"
        type="submit"
        disabled={!stripe || !ready || submitting}
      >
        {submitting ? "Processing…" : "Pay deposit"}
      </button>
    </form>
  );
}

/**
 * Stripe's embedded checkout, mounted in place of the Paymob iframe.
 *
 * The Payment Element renders its own method tabs — cards, Apple Pay, Google
 * Pay, and whatever else the restaurant has enabled on their account — so this
 * component intentionally does not offer a method picker of its own.
 */
export default function StripePaymentForm({
  clientSecret,
  publishableKey,
  connectedAccountId,
  returnUrl,
  onSubmitted,
}: Props) {
  const stripePromise = useMemo(
    () => getStripe(publishableKey, connectedAccountId),
    [publishableKey, connectedAccountId]
  );

  const [failedToLoad, setFailedToLoad] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void stripePromise.then((instance) => {
      // A null instance means the script was blocked (an ad blocker, an
      // offline tab). Saying so beats an empty box the guest cannot use.
      if (!cancelled && !instance) setFailedToLoad(true);
    });
    return () => { cancelled = true; };
  }, [stripePromise]);

  const options: StripeElementsOptions = useMemo(
    () => ({
      clientSecret,
      // Themed from the tenant's own CSS variables so the element does not
      // look bolted on. Read at mount: Stripe's appearance API takes concrete
      // values, not var() references.
      appearance: {
        theme: "stripe",
        variables: readBrandVariables(),
      },
    }),
    [clientSecret]
  );

  if (failedToLoad) {
    return (
      <div className="wl-inline-error">
        Secure payment could not load. Please disable any content blocker for this page and try again.
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm returnUrl={returnUrl} onSubmitted={onSubmitted} />
    </Elements>
  );
}

/**
 * Pull the tenant's brand colours out of the cascade so the Payment Element
 * matches the surrounding page. Falls back to Stripe's defaults for anything
 * the white-label theme does not define.
 */
function readBrandVariables(): Record<string, string> {
  if (typeof window === "undefined") return {};

  const styles = window.getComputedStyle(document.documentElement);
  const read = (name: string) => styles.getPropertyValue(name).trim();

  const variables: Record<string, string> = {};
  const accent = read("--wl-accent");
  const ink = read("--wl-ink");
  const paper = read("--wl-paper");
  const fontFamily = read("--wl-font-display");

  if (accent) variables.colorPrimary = accent;
  if (ink) variables.colorText = ink;
  if (paper) variables.colorBackground = paper;
  if (fontFamily) variables.fontFamily = fontFamily;

  return variables;
}
