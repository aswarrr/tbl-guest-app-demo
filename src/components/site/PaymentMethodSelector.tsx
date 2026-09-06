import type { PaymentMethod } from "../../white-label/types";

type Props = {
  value: PaymentMethod | null;
  onChange: (method: PaymentMethod) => void;
  disabled?: boolean;
};

const methods: Array<{
  id: PaymentMethod;
  label: string;
  description: string;
}> = [
  {
    id: "CARD",
    label: "Credit or Debit Card",
    description: "Secure card payment powered by Paymob",
  },
  {
    id: "APPLE_PAY",
    label: "Apple Pay",
    description: "Available on supported Apple devices and browsers",
  },
];

export default function PaymentMethodSelector({ value, onChange, disabled = false }: Props) {
  return (
    <fieldset className="wl-payment-methods" disabled={disabled}>
      <legend>Choose a payment method</legend>
      <div className="wl-payment-method-grid" role="radiogroup" aria-label="Payment method">
        {methods.map((method) => {
          const selected = value === method.id;
          return (
            <button
              key={method.id}
              className={selected ? "is-selected" : ""}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(method.id)}
            >
              <span className={`wl-payment-method-icon wl-payment-method-icon-${method.id.toLowerCase()}`} aria-hidden="true">
                {method.id === "CARD" ? <><i /><i /></> : <strong>Pay</strong>}
              </span>
              <span>
                <strong>{method.label}</strong>
                <small>{method.description}</small>
              </span>
              <i className="wl-payment-method-check" aria-hidden="true">✓</i>
            </button>
          );
        })}
      </div>
      <p>Your selected option will open in Paymob’s secure checkout. Apple Pay availability is confirmed there for your device.</p>
    </fieldset>
  );
}
